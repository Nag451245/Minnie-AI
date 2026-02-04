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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import HistoryService from '../../services/HistoryService';
import CalendarView from '../../components/CalendarView';
import { DailyLog } from '../../types';

const { width } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | '3months';

export default function ProgressScreen() {
    const { state } = useApp();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    // Load data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [state.todayLog]) // Reload if today's log changes
    );

    const loadHistory = async () => {
        const logs = await HistoryService.getAllLogs();
        // Ensure today's log from context is included/updated in the list for immediate feedback
        if (state.todayLog) {
            const todayIndex = logs.findIndex(l => l.date === state.todayLog!.date);
            if (todayIndex >= 0) {
                logs[todayIndex] = state.todayLog;
            } else {
                logs.push(state.todayLog);
            }
        }
        setHistoryLogs(logs);
        setLoading(false);
    };

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
            steps.push(log ? log.steps : 0);
            water.push(log ? log.waterIntake : 0);
            if (log?.weight) weight.push(log.weight);
        }

        return { days, steps, weight, water };
    };

    const weeklyData = getWeeklyData();

    // Calculate stats
    const calculateStats = () => {
        const totalSteps = weeklyData.steps.reduce((a, b) => a + b, 0);
        const avgSteps = Math.round(totalSteps / 7);

        // Weight change
        const currentWeight = state.user?.currentWeight || 0;
        const startWeight = weeklyData.weight.length > 0 ? weeklyData.weight[0] : currentWeight;
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
            avgSteps,
            weightChange: parseFloat(weightChange.toFixed(1)),
            moodBreakdown
        };
    };

    const stats = calculateStats();

    const getMoodColor = (mood: string) => {
        switch (mood) {
            case 'happy': return Colors.secondary;
            case 'sad': return Colors.textTertiary;
            case 'stressed': return Colors.primary;
            case 'energetic': return Colors.activity;
            default: return Colors.info;
        }
    };

    // Render logic...
    // (Helper render functions remain same or slightly adapted)

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

                {/* Calendar View */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📆 Consistency Calendar</Text>
                    <CalendarView
                        logs={historyLogs}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, styles.weightCard]}>
                        <Text style={styles.summaryIcon}>⚖️</Text>
                        <Text style={[styles.summaryValue, stats.weightChange < 0 && styles.positive]}>
                            {stats.weightChange > 0 ? '+' : ''}{stats.weightChange} kg
                        </Text>
                        <Text style={styles.summaryLabel}>Weekly Change</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.stepsCard]}>
                        <Text style={styles.summaryIcon}>👟</Text>
                        <Text style={styles.summaryValue}>{stats.avgSteps.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>Avg. Steps</Text>
                    </View>
                </View>

                {/* Steps Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>👟 Weekly Steps</Text>
                    <View style={styles.chartWrapper}>
                        {/* Reusing existing renderBarChart logic but with weeklyData.steps */}
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
                        <Text style={styles.insightTitle}>📊 Minnie's Insights</Text>
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
    timeSelector: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xs,
        marginBottom: Spacing.md,
    },
    timeButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
    },
    timeButtonActive: {
        backgroundColor: Colors.primary,
    },
    timeButtonText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.fontWeight.medium,
    },
    timeButtonTextActive: {
        color: Colors.textLight,
        fontWeight: Typography.fontWeight.semibold,
    },
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
    weightCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    stepsCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.activity,
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
    positive: {
        color: Colors.activity,
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
    chartContainer: {
        height: 100,
        marginBottom: Spacing.md,
    },
    weightLine: {
        flexDirection: 'row',
        height: 80,
        alignItems: 'flex-end',
    },
    weightPoint: {
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        position: 'absolute',
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chartLabel: {
        fontSize: 10,
        color: Colors.textTertiary,
        flex: 1,
        textAlign: 'center',
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
    chartInsight: {
        fontSize: Typography.fontSize.sm,
        color: Colors.activity,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: Spacing.md,
    },
    heatmapCell: {
        width: (width - Spacing.base * 2 - Spacing.lg * 2 - 24) / 7,
        aspectRatio: 1,
        borderRadius: 4,
    },
    heatmapCompleted: {
        backgroundColor: Colors.activity,
    },
    heatmapMissed: {
        backgroundColor: Colors.border,
    },
    heatmapLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 2,
        marginRight: Spacing.xs,
    },
    legendText: {
        fontSize: Typography.fontSize.xs,
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
    achievementsCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    achievementsList: {
        gap: Spacing.md,
    },
    achievement: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    achievementIcon: {
        fontSize: 28,
        marginRight: Spacing.md,
    },
    achievementInfo: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    achievementDate: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
    },
});
