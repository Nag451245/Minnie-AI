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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';

const { width } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | '3months';

export default function ProgressScreen() {
    const { state } = useApp();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');

    // Mock data - will be replaced with real data
    const weeklyData = {
        weight: [75.2, 75.0, 74.8, 74.9, 74.6, 74.5, 74.4],
        steps: [6500, 8200, 5400, 9100, 7800, 4200, 5432],
        water: [2000, 2500, 1800, 2200, 2400, 1500, 1250],
    };

    const stats = {
        weightChange: -0.8,
        avgSteps: 6662,
        avgWater: 1950,
        streakDays: 4,
        goalDays: 5,
        totalDays: 7,
        moodBreakdown: [
            { mood: 'Happy', count: 3, color: Colors.activity },
            { mood: 'Stressed', count: 2, color: Colors.secondary },
            { mood: 'Energetic', count: 1, color: Colors.streakGold },
            { mood: 'Tired', count: 1, color: Colors.textTertiary },
        ],
    };

    // Simple bar chart renderer
    const renderBarChart = (data: number[], maxValue: number, color: string) => {
        return (
            <View style={styles.barChart}>
                {data.map((value, index) => (
                    <View key={index} style={styles.barColumn}>
                        <View
                            style={[
                                styles.bar,
                                {
                                    height: `${(value / maxValue) * 100}%`,
                                    backgroundColor: color,
                                },
                            ]}
                        />
                        <Text style={styles.barLabel}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // Consistency heatmap
    const renderHeatmap = () => {
        const days = Array.from({ length: 28 }, (_, i) => ({
            day: i + 1,
            completed: Math.random() > 0.3,
        }));

        return (
            <View style={styles.heatmapGrid}>
                {days.map((day, index) => (
                    <View
                        key={index}
                        style={[
                            styles.heatmapCell,
                            day.completed ? styles.heatmapCompleted : styles.heatmapMissed,
                        ]}
                    />
                ))}
            </View>
        );
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

                {/* Time Range Selector */}
                <View style={styles.timeSelector}>
                    {(['week', 'month', '3months'] as TimeRange[]).map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[styles.timeButton, timeRange === range && styles.timeButtonActive]}
                            onPress={() => setTimeRange(range)}
                        >
                            <Text style={[styles.timeButtonText, timeRange === range && styles.timeButtonTextActive]}>
                                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : '3 Months'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, styles.weightCard]}>
                        <Text style={styles.summaryIcon}>⚖️</Text>
                        <Text style={[styles.summaryValue, stats.weightChange < 0 && styles.positive]}>
                            {stats.weightChange > 0 ? '+' : ''}{stats.weightChange} kg
                        </Text>
                        <Text style={styles.summaryLabel}>Weight Change</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.stepsCard]}>
                        <Text style={styles.summaryIcon}>👟</Text>
                        <Text style={styles.summaryValue}>{stats.avgSteps.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>Avg. Steps</Text>
                    </View>
                </View>

                {/* Weight Trend */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📈 Weight Trend</Text>
                    <View style={styles.chartContainer}>
                        {/* Simplified line representation */}
                        <View style={styles.weightLine}>
                            {weeklyData.weight.map((w, i) => (
                                <View key={i} style={styles.weightPoint}>
                                    <View style={[styles.dot, { bottom: ((w - 74) / 2) * 100 }]} />
                                </View>
                            ))}
                        </View>
                        <View style={styles.chartLabels}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                <Text key={i} style={styles.chartLabel}>{day}</Text>
                            ))}
                        </View>
                    </View>
                    <Text style={styles.chartInsight}>
                        ↓ You've lost 0.8 kg this week! Keep it up! 🎉
                    </Text>
                </View>

                {/* Steps Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>👟 Daily Steps</Text>
                    <View style={styles.chartWrapper}>
                        {renderBarChart(weeklyData.steps, 10000, Colors.activity)}
                    </View>
                    <Text style={styles.chartInsight}>
                        Best day: Thursday (9,100 steps)
                    </Text>
                </View>

                {/* Consistency Calendar */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>📆 Consistency Heatmap</Text>
                    {renderHeatmap()}
                    <View style={styles.heatmapLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.heatmapCompleted]} />
                            <Text style={styles.legendText}>Goal Met</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, styles.heatmapMissed]} />
                            <Text style={styles.legendText}>Missed</Text>
                        </View>
                    </View>
                </View>

                {/* Mood Breakdown */}
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
                    <Text style={styles.chartInsight}>
                        You felt happy 43% of the time this week! 😊
                    </Text>
                </View>

                {/* Minnie Insights */}
                <View style={styles.insightCard}>
                    <MinnieAvatar state="thinking" size="medium" animated />
                    <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>📊 Minnie's Weekly Insights</Text>
                        <Text style={styles.insightText}>
                            You're most consistent on weekdays! Your weekend activity drops by 40%.
                            Try scheduling a Sunday morning walk to keep momentum going.
                        </Text>
                    </View>
                </View>

                {/* Achievements */}
                <View style={styles.achievementsCard}>
                    <Text style={styles.chartTitle}>🏆 Recent Achievements</Text>
                    <View style={styles.achievementsList}>
                        <View style={styles.achievement}>
                            <Text style={styles.achievementIcon}>🔥</Text>
                            <View style={styles.achievementInfo}>
                                <Text style={styles.achievementTitle}>4-Day Streak</Text>
                                <Text style={styles.achievementDate}>Today</Text>
                            </View>
                        </View>
                        <View style={styles.achievement}>
                            <Text style={styles.achievementIcon}>👟</Text>
                            <View style={styles.achievementInfo}>
                                <Text style={styles.achievementTitle}>10K Steps in One Day</Text>
                                <Text style={styles.achievementDate}>2 days ago</Text>
                            </View>
                        </View>
                        <View style={styles.achievement}>
                            <Text style={styles.achievementIcon}>💧</Text>
                            <View style={styles.achievementInfo}>
                                <Text style={styles.achievementTitle}>Hydration Hero</Text>
                                <Text style={styles.achievementDate}>3 days ago</Text>
                            </View>
                        </View>
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
        paddingBottom: Spacing['2xl'],
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
