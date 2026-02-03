/**
 * Home Screen - Daily Dashboard
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { state } = useApp();
    const [refreshing, setRefreshing] = useState(false);

    // Calculate real data from context (with fallback to 0 for new users)
    const todayStats = {
        steps: state.todayLog?.steps || 0,
        stepGoal: state.user?.stepGoal || 7500,
        water: state.todayLog?.waterIntake || 0,
        waterGoal: 2500,
        sleepHours: state.todayLog?.sleepHours || 0,
        mood: state.todayLog?.mood || null,
        streak: state.currentStreak || 0,
        challengeCompleted: (state.todayLog?.steps || 0) >= (state.user?.stepGoal || 7500),
    };

    // Dynamic challenge text
    const getChallengeText = (): string => {
        const remaining = todayStats.stepGoal - todayStats.steps;
        if (remaining <= 0) return 'Great job! You hit your step goal! 🎉';
        return `Walk ${remaining.toLocaleString()} more steps to reach your goal`;
    };

    const stepProgress = (todayStats.steps / todayStats.stepGoal) * 100;
    const waterProgress = (todayStats.water / todayStats.waterGoal) * 100;

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Refresh data from database
        setTimeout(() => setRefreshing(false), 1000);
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString();
    };

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Header with Greeting and Minnie */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{state.user?.name || 'Friend'}! 👋</Text>
                    </View>
                    <View style={styles.headerMinnie}>
                        <MinnieAvatar state={state.minnieState} size="medium" animated />
                    </View>
                </View>

                {/* Streak Card */}
                <View style={styles.streakCard}>
                    <View style={styles.streakIcon}>
                        <Text style={styles.streakEmoji}>🔥</Text>
                    </View>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakNumber}>{todayStats.streak}</Text>
                        <Text style={styles.streakLabel}>Day Streak</Text>
                    </View>
                    <Text style={styles.streakMessage}>Keep it going!</Text>
                </View>

                {/* Steps Widget */}
                <TouchableOpacity
                    style={styles.stepsWidget}
                    onPress={() => navigation.navigate('WalkTracker')}
                    activeOpacity={0.8}
                >
                    <View style={styles.stepsHeader}>
                        <Text style={styles.widgetTitle}>👟 Today's Steps</Text>
                        <Text style={styles.stepsLastUpdate}>Updated just now</Text>
                    </View>

                    <View style={styles.stepsMain}>
                        <Text style={styles.stepsCount}>{formatNumber(todayStats.steps)}</Text>
                        <Text style={styles.stepsGoal}>/ {formatNumber(todayStats.stepGoal)}</Text>
                    </View>

                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min(stepProgress, 100)}%` }]} />
                    </View>

                    <View style={styles.stepsFooter}>
                        <Text style={styles.stepsDistance}>
                            📏 {((todayStats.steps * 0.000762).toFixed(1))} km
                        </Text>
                        <Text style={styles.stepsPercent}>{stepProgress.toFixed(0)}%</Text>
                    </View>
                </TouchableOpacity>

                {/* Quick Stats Row */}
                <View style={styles.quickStats}>
                    {/* Water Card */}
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>💧</Text>
                        <Text style={styles.statValue}>{(todayStats.water / 1000).toFixed(1)}L</Text>
                        <Text style={styles.statLabel}>Water</Text>
                        <View style={styles.miniProgressBar}>
                            <View style={[styles.miniProgressFill, { width: `${Math.min(waterProgress, 100)}%` }]} />
                        </View>
                    </View>

                    {/* Sleep Card */}
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>😴</Text>
                        <Text style={styles.statValue}>{todayStats.sleepHours}h</Text>
                        <Text style={styles.statLabel}>Sleep</Text>
                        <View style={styles.miniProgressBar}>
                            <View style={[styles.miniProgressFill, styles.sleepProgress, { width: `${(todayStats.sleepHours / 8) * 100}%` }]} />
                        </View>
                    </View>

                    {/* Mood Card */}
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>😊</Text>
                        <Text style={styles.statValue}>Happy</Text>
                        <Text style={styles.statLabel}>Mood</Text>
                    </View>
                </View>

                {/* Today's Challenge */}
                <View style={[styles.challengeCard, todayStats.challengeCompleted && styles.challengeCompleted]}>
                    <View style={styles.challengeHeader}>
                        <Text style={styles.challengeTitle}>🎯 Today's Challenge</Text>
                        {!todayStats.challengeCompleted && (
                            <View style={styles.challengeBadge}>
                                <Text style={styles.challengeBadgeText}>Active</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.challengeText}>{getChallengeText()}</Text>
                    <TouchableOpacity
                        style={[styles.challengeButton, todayStats.challengeCompleted && styles.challengeButtonDone]}
                        disabled={todayStats.challengeCompleted}
                    >
                        <Text style={styles.challengeButtonText}>
                            {todayStats.challengeCompleted ? '✓ Completed!' : 'Mark as Done'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Minnie Insight */}
                <View style={styles.insightCard}>
                    <MinnieAvatar state="encouraging" size="small" animated={false} />
                    <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>💡 Minnie's Insight</Text>
                        <Text style={styles.insightText}>
                            You're 72% to your step goal! A 15-minute walk would get you there. Ready to go?
                        </Text>
                    </View>
                </View>

                {/* Weight Trend Mini Card */}
                <TouchableOpacity style={styles.weightCard}>
                    <View style={styles.weightInfo}>
                        <Text style={styles.widgetTitle}>⚖️ Weight</Text>
                        <Text style={styles.weightValue}>{state.user?.currentWeight || 75} kg</Text>
                    </View>
                    <View style={styles.weightTrend}>
                        <Text style={styles.weightTrendIcon}>↓</Text>
                        <Text style={styles.weightTrendText}>0.5 kg this week</Text>
                    </View>
                </TouchableOpacity>
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
        marginBottom: Spacing.lg,
    },
    headerText: {
        flex: 1,
    },
    greeting: {
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
    },
    userName: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    headerMinnie: {
        marginLeft: Spacing.md,
    },
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.streakFlame,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    streakIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakEmoji: {
        fontSize: 24,
    },
    streakInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    streakNumber: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    streakLabel: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    streakMessage: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textLight,
        fontWeight: Typography.fontWeight.medium,
    },
    stepsWidget: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    stepsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    widgetTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    stepsLastUpdate: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
    },
    stepsMain: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: Spacing.md,
    },
    stepsCount: {
        fontSize: Typography.fontSize['4xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.activity,
    },
    stepsGoal: {
        fontSize: Typography.fontSize.lg,
        color: Colors.textTertiary,
        marginLeft: Spacing.xs,
    },
    progressBar: {
        height: 10,
        backgroundColor: Colors.border,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.activity,
        borderRadius: 5,
    },
    stepsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepsDistance: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    stepsPercent: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.activity,
    },
    quickStats: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        ...Shadows.sm,
    },
    statEmoji: {
        fontSize: 24,
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
        marginBottom: Spacing.xs,
    },
    miniProgressBar: {
        width: '100%',
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    miniProgressFill: {
        height: '100%',
        backgroundColor: Colors.info,
        borderRadius: 2,
    },
    sleepProgress: {
        backgroundColor: Colors.secondary,
    },
    challengeCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        ...Shadows.sm,
    },
    challengeCompleted: {
        borderLeftColor: Colors.success,
        opacity: 0.8,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    challengeTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    challengeBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    challengeBadgeText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.primaryDark,
        fontWeight: Typography.fontWeight.medium,
    },
    challengeText: {
        fontSize: Typography.fontSize.base,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        lineHeight: 22,
    },
    challengeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    challengeButtonDone: {
        backgroundColor: Colors.success,
    },
    challengeButtonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textLight,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: Colors.moodNeutral,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    insightContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    insightTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.primaryDark,
        marginBottom: Spacing.xs,
    },
    insightText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    weightCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    weightInfo: {},
    weightValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
    },
    weightTrend: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.activityLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    weightTrendIcon: {
        fontSize: Typography.fontSize.lg,
        color: Colors.activityDark,
        marginRight: Spacing.xs,
    },
    weightTrendText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.activityDark,
        fontWeight: Typography.fontWeight.medium,
    },
});
