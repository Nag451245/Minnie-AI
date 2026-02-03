/**
 * Activity Screen - Step tracking and activity logging
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ActivityScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { state } = useApp();

    // Real data from context - no more dummy data
    const todaySteps = state.todayLog?.steps || 0;
    const stepGoal = state.user?.stepGoal || 7500;
    const distanceKm = state.todayLog?.distanceKm || (todaySteps * 0.000762); // ~762mm per step average
    const activeMinutes = state.todayLog?.activeMinutes || Math.round(todaySteps / 100); // rough estimate
    const caloriesBurned = state.todayLog?.caloriesBurned || Math.round(todaySteps * 0.04); // rough estimate

    const activityData = {
        steps: todaySteps,
        stepGoal: stepGoal,
        distance: Number(distanceKm.toFixed(2)),
        activeMinutes: activeMinutes,
        caloriesBurned: caloriesBurned,
        lastMovement: todaySteps > 0 ? 'recently' : 'no activity yet',
        // Empty hourly data - will be populated when real tracking is implemented
        hourlySteps: [] as { hour: string; steps: number }[],
    };

    const stepProgress = stepGoal > 0 ? (activityData.steps / activityData.stepGoal) * 100 : 0;
    const maxHourlySteps = activityData.hourlySteps.length > 0
        ? Math.max(...activityData.hourlySteps.map(h => h.steps), 1)
        : 1;

    const getMinnieMessage = () => {
        if (todaySteps === 0) {
            return "Ready to get moving? Start your first walk! 🚶";
        } else if (stepProgress >= 100) {
            return "You crushed your goal today! Amazing work! 🎉";
        } else if (stepProgress >= 75) {
            return "Almost there! Just a bit more to hit your goal!";
        } else if (stepProgress >= 50) {
            return "Halfway there! Keep the momentum going!";
        } else {
            return "Let's get moving! Every step counts!";
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
                    <Text style={styles.headerTitle}>Activity</Text>
                    <MinnieAvatar
                        state={stepProgress >= 75 ? 'energized' : 'encouraging'}
                        size="small"
                        animated
                    />
                </View>

                {/* Minnie Message */}
                <View style={styles.minnieCard}>
                    <MinnieAvatar
                        state={stepProgress >= 100 ? 'celebratory' : 'energized'}
                        size="medium"
                        animated
                    />
                    <Text style={styles.minnieMessage}>{getMinnieMessage()}</Text>
                </View>

                {/* Main Steps Display */}
                <View style={styles.stepsCard}>
                    <Text style={styles.stepsLabel}>👟 Today's Steps</Text>
                    <View style={styles.stepsRow}>
                        <Text style={styles.stepsCount}>{activityData.steps.toLocaleString()}</Text>
                        <View style={styles.stepsDivider} />
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalLabel}>Goal</Text>
                            <Text style={styles.goalValue}>{activityData.stepGoal.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Progress Ring (simplified as bar) */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(stepProgress, 100)}%` }]} />
                        </View>
                        <Text style={styles.progressPercent}>{stepProgress.toFixed(0)}%</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>📏</Text>
                            <Text style={styles.statValue}>{activityData.distance} km</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>⏱️</Text>
                            <Text style={styles.statValue}>{activityData.activeMinutes} min</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>🔥</Text>
                            <Text style={styles.statValue}>{activityData.caloriesBurned}</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>
                    </View>

                    <Text style={styles.lastMovement}>Last movement: {activityData.lastMovement} ✓</Text>
                </View>

                {/* Activity Timeline */}
                <View style={styles.timelineCard}>
                    <Text style={styles.sectionTitle}>📊 Activity Timeline</Text>
                    {activityData.hourlySteps.length > 0 ? (
                        <View style={styles.timelineChart}>
                            {activityData.hourlySteps.map((hour, index) => (
                                <View key={hour.hour} style={styles.timelineBar}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { height: `${(hour.steps / maxHourlySteps) * 100}%` },
                                            hour.steps > 500 && styles.barActive,
                                        ]}
                                    />
                                    <Text style={styles.barLabel}>{hour.hour.replace('AM', '').replace('PM', '')}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateText}>📉 No activity data yet</Text>
                            <Text style={styles.emptyStateSubtext}>Start a walk to see your hourly breakdown</Text>
                        </View>
                    )}
                    {activityData.hourlySteps.length > 0 && (
                        <Text style={styles.timelineNote}>Your activity throughout the day</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('WalkTracker')}
                    >
                        <Text style={styles.primaryButtonIcon}>🚶</Text>
                        <Text style={styles.primaryButtonText}>Start Walk Timer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('LogActivity', {})}
                    >
                        <Text style={styles.secondaryButtonIcon}>➕</Text>
                        <Text style={styles.secondaryButtonText}>Log Manual Activity</Text>
                    </TouchableOpacity>
                </View>

                {/* Weekly Summary - Now shows real data */}
                <View style={styles.weeklyCard}>
                    <Text style={styles.sectionTitle}>📈 This Week</Text>
                    <View style={styles.weeklyStats}>
                        <View style={styles.weeklyStat}>
                            <Text style={styles.weeklyValue}>{todaySteps.toLocaleString()}</Text>
                            <Text style={styles.weeklyLabel}>Today's Steps</Text>
                        </View>
                        <View style={styles.weeklyStat}>
                            <Text style={styles.weeklyValue}>{stepGoal.toLocaleString()}</Text>
                            <Text style={styles.weeklyLabel}>Daily Goal</Text>
                        </View>
                        <View style={styles.weeklyStat}>
                            <Text style={styles.weeklyValue}>{stepProgress >= 100 ? '1/1' : '0/1'}</Text>
                            <Text style={styles.weeklyLabel}>Goal Days</Text>
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
    minnieCard: {
        backgroundColor: Colors.moodNeutral,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    minnieMessage: {
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        fontWeight: Typography.fontWeight.medium,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    stepsCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    stepsLabel: {
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    stepsCount: {
        fontSize: Typography.fontSize['5xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.activity,
    },
    stepsDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.lg,
    },
    goalInfo: {
        alignItems: 'flex-start',
    },
    goalLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
    },
    goalValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textSecondary,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    progressBar: {
        flex: 1,
        height: 12,
        backgroundColor: Colors.border,
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: Spacing.md,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.activity,
        borderRadius: 6,
    },
    progressPercent: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.activity,
        minWidth: 50,
        textAlign: 'right',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    statIcon: {
        fontSize: 20,
        marginBottom: Spacing.xs,
    },
    statValue: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
    },
    lastMovement: {
        fontSize: Typography.fontSize.sm,
        color: Colors.success,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    timelineCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    timelineChart: {
        flexDirection: 'row',
        height: 100,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    timelineBar: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '60%',
        backgroundColor: Colors.border,
        borderRadius: 4,
        marginBottom: Spacing.xs,
    },
    barActive: {
        backgroundColor: Colors.activity,
    },
    barLabel: {
        fontSize: 8,
        color: Colors.textTertiary,
    },
    timelineNote: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyStateText: {
        fontSize: Typography.fontSize.base,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    emptyStateSubtext: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    actions: {
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.activity,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        ...Shadows.md,
    },
    primaryButtonIcon: {
        fontSize: 20,
        marginRight: Spacing.sm,
    },
    primaryButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    secondaryButtonIcon: {
        fontSize: 18,
        marginRight: Spacing.sm,
    },
    secondaryButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textSecondary,
    },
    weeklyCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    weeklyStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    weeklyStat: {
        alignItems: 'center',
    },
    weeklyValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.primary,
    },
    weeklyLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
    },
});
