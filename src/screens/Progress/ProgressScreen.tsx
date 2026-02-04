/**
 * Progress Screen - Charts and insights
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import HistoryService from '../../services/HistoryService';
import CalendarView from '../../components/CalendarView';
import StatsService from '../../services/StatsService';
import { DailyLog, MoodType } from '../../types';

const { width } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | '3months';

export default function ProgressScreen() {
    const { state } = useApp();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);

    // Load data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [state.todayLog]) // Reload if today's log changes
    );

    const loadHistory = async () => {
        // Safety timeout to prevent infinite loading screen
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("ProgressScreen: Data load timed out, forcing render");
                setLoading(false);
            }
        }, 5000);

        try {
            // Only set loading to true if we don't have logs yet
            if (historyLogs.length === 0) setLoading(true);

            const logs: DailyLog[] = await HistoryService.getAllLogs().catch(e => {
                console.error("Failed to load persistence logs", e);
                return [];
            });

            // Ensure today's log from context is included/updated
            if (state.todayLog && state.todayLog.date) {
                const todayIndex = logs.findIndex(l => l.date === state.todayLog!.date);
                if (todayIndex >= 0) {
                    logs[todayIndex] = state.todayLog;
                } else {
                    logs.push(state.todayLog);
                }
            }

            // Sanitize logs
            const validLogs = logs.filter(l => l && l.date && !isNaN(new Date(l.date).getTime()));
            setHistoryLogs(validLogs);

            // Calculate Streak safely
            const currentStreak = StatsService.calculateCurrentStreak(validLogs);
            setStreak(currentStreak);

        } catch (error) {
            console.error("Critical error loading progress data:", error);
            // Don't crash, just show empty state
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    if (loading && historyLogs.length === 0) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading progress...</Text>
            </SafeAreaView>
        );
    }

    const getWeeklyData = () => {
        // Get last 7 days ending today
        const days = [];
        const steps = [];
        const weight = [];
        const water = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const log = historyLogs.find(l => l.date === dateStr);

            days.push(d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0));
            steps.push(log ? (log.steps || 0) : 0);
            water.push(log ? (log.waterIntake || 0) : 0);
            if (log?.weight) weight.push(log.weight);
        }

        return { days, steps, weight, water };
    };

    const weeklyData = getWeeklyData();

    // Calculate stats
    const calculateStats = () => {
        const totalSteps = weeklyData.steps.reduce((a, b) => a + (b || 0), 0);
        const avgSteps = Math.round(totalSteps / 7);

        // Weight change
        const currentWeight = state.user?.currentWeight || 0;
        // Filter out 0 or undefined weights
        const validWeights = weeklyData.weight.filter(w => w && w > 0);
        const startWeight = validWeights.length > 0 ? validWeights[0] : currentWeight;
        const weightChange = currentWeight - startWeight;

        // Mood breakdown from history
        const moodCounts: Record<string, number> = {};
        historyLogs.forEach(log => {
            if (log.mood) {
                moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
            }
        });

        const moodBreakdown = Object.entries(moodCounts).map(([mood, count]) => ({
            mood,
            count,
            color: getMoodColor(mood)
        })).sort((a, b) => b.count - a.count);

        return {
            avgSteps: isNaN(avgSteps) ? 0 : avgSteps,
            weightChange: isNaN(weightChange) ? 0 : parseFloat(weightChange.toFixed(1)),
            moodBreakdown
        };
    };

    const stats = calculateStats();

    const selectedLog = historyLogs.find(l => l.date === selectedDate);

    // Safety check for step goal to avoid % NaN
    const selectedStepGoal = selectedLog?.stepGoal || state.user?.stepGoal || 7000;
    const selectedSteps = selectedLog?.steps || 0;
    const selectedProgress = Math.min((selectedSteps / selectedStepGoal) * 100, 100);

    const getMoodColor = (mood: string) => {
        switch (mood) {
            case 'happy': return Colors.secondary;
            case 'sad': return Colors.textTertiary;
            case 'stressed': return Colors.primary;
            case 'energetic': return Colors.activity;
            default: return Colors.info;
        }
    };

    const getMoodEmoji = (mood?: string) => {
        switch (mood) {
            case 'happy': return '😊';
            case 'sad': return '😔';
            case 'stressed': return '😫';
            case 'energetic': return '⚡';
            case 'bored': return '😐';
            case 'calm': return '😌';
            default: return '❓';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Progress</Text>
                    <MinnieAvatar state="happy" size="small" animated />
                </View>

                {/* Summary Cards Row 1: Streak & Steps */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, styles.streakCard]}>
                        <Text style={styles.summaryIcon}>🔥</Text>
                        <Text style={styles.summaryValue}>{streak} Days</Text>
                        <Text style={styles.summaryLabel}>Current Streak</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.stepsCard]}>
                        <Text style={styles.summaryIcon}>👟</Text>
                        <Text style={styles.summaryValue}>{stats.avgSteps.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>Avg. Steps</Text>
                    </View>
                </View>

                {/* Calendar View */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📆 Consistency Calendar</Text>
                    <CalendarView
                        logs={historyLogs}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />
                </View>

                {/* Daily Detail Card (Based on Selection) */}
                <View style={styles.chartCard}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.chartTitle}>
                            📋 Details: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                        {selectedLog ? (
                            <Text style={[styles.statusBadge, selectedSteps >= selectedStepGoal ? styles.statusBadgeSuccess : styles.statusBadgePending]}>
                                {selectedSteps >= selectedStepGoal ? 'Goal Met' : 'In Progress'}
                            </Text>
                        ) : (
                            <Text style={styles.statusBadge}>No Data</Text>
                        )}
                    </View>

                    {selectedLog ? (
                        <View style={styles.detailGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Steps</Text>
                                <Text style={styles.detailValue}>{selectedSteps.toLocaleString()}</Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${selectedProgress}%` }]} />
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Mood</Text>
                                <Text style={styles.detailValue}>
                                    {getMoodEmoji(selectedLog.mood)} {selectedLog.mood ? selectedLog.mood.charAt(0).toUpperCase() + selectedLog.mood.slice(1) : '-'}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Sleep</Text>
                                <Text style={styles.detailValue}>
                                    {selectedLog.sleepHours ? `${selectedLog.sleepHours}h` : '-'}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Water</Text>
                                <Text style={styles.detailValue}>
                                    {selectedLog.waterIntake ? `${(selectedLog.waterIntake / 1000).toFixed(1)}L` : '-'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.noDataText}>No activity logged for this day.</Text>
                    )}
                </View>

                {/* Steps Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📊 Weekly Activity</Text>
                    <View style={styles.chartWrapper}>
                        <View style={styles.barChart}>
                            {weeklyData.steps.map((value, index) => (
                                <View key={index} style={styles.barColumn}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${Math.min((value / 10000) * 100, 100)}%`,
                                                backgroundColor: Colors.activity,
                                            },
                                        ]}
                                    />
                                    <Text style={styles.barLabel}>{weeklyData.days[index]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Mood Breakdown */}
                {stats.moodBreakdown.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>🎭 Mood Breakdown</Text>
                        <View style={styles.moodBreakdown}>
                            {stats.moodBreakdown.map((item, index) => (
                                <View key={index} style={styles.moodItem}>
                                    <View style={[styles.moodBar, { backgroundColor: item.color, flex: item.count }]} />
                                    <Text style={styles.moodLabel}>{item.mood} ({item.count})</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Minnie Insights */}
                <View style={styles.insightCard}>
                    <MinnieAvatar state="thinking" size="medium" animated />
                    <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>✨ Minnie's Insights</Text>
                        <Text style={styles.insightText}>
                            {stats.avgSteps > 7000
                                ? "You're crushing your step goals this week! Keep that momentum going! 🔥"
                                : "A little more walking could boost your energy. Let's aim for 7,000 steps tomorrow! 👟"}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.base,
        paddingBottom: 100, // Account for tab bar (70px) + FAB overlap
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    // ... Legacy styles kept for compatibility ...
    summaryRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        alignItems: 'center',
        ...Shadows.sm,
    },
    streakCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.secondary,
    },
    stepsCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.activity,
    },
    weightCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    summaryIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    summaryValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
    },
    chartCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    chartTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    chartWrapper: {
        height: 120,
        marginBottom: Spacing.sm,
    },
    barChart: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '60%',
        borderRadius: 4,
        marginBottom: Spacing.xs,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.textTertiary,
    },
    moodBreakdown: {
        gap: Spacing.sm,
    },
    moodItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moodBar: {
        height: 20,
        borderRadius: 4,
        marginRight: Spacing.sm,
    },
    moodLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: Colors.moodNeutral,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    insightContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    insightTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.primaryDark,
        marginBottom: Spacing.sm,
    },
    insightText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    // New Styles for Daily Detail
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    statusBadge: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
        color: Colors.textLight,
        backgroundColor: Colors.textTertiary,
    },
    statusBadgeSuccess: {
        backgroundColor: Colors.activity,
    },
    statusBadgePending: {
        backgroundColor: Colors.primary,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    detailItem: {
        width: '47%',
        backgroundColor: Colors.surfaceSecondary,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    detailLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    detailValue: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.activity,
        borderRadius: 2,
    },
    noDataText: {
        textAlign: 'center',
        color: Colors.textTertiary,
        fontStyle: 'italic',
        marginTop: Spacing.sm,
    },
    positive: {
        color: Colors.activity,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
    },
});
