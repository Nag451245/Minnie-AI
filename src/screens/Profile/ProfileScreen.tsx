/**
 * Profile Screen - Settings and user info
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import StorageService from '../../services/StorageService';
import ApiKeyModal from '../../components/ApiKeyModal';
import { aiService } from '../../services/AiService';

export default function ProfileScreen() {
    const { state, dispatch } = useApp();
    const [activityReminders, setActivityReminders] = useState(true);
    const [waterReminders, setWaterReminders] = useState(true);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);

    // Check if API key is configured on mount
    useEffect(() => {
        aiService.initialize().then(() => {
            setHasApiKey(aiService.hasApiKey());
        });
    }, []);

    const handleResetOnboarding = async () => {
        Alert.alert(
            'Reset App',
            'This will clear all your data and restart onboarding. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await StorageService.clearAll();
                        dispatch({ type: 'RESET_STATE' });
                    },
                },
            ]
        );
    };

    const handleCoachingModeChange = () => {
        Alert.alert(
            'Coaching Mode',
            'Choose your preference',
            [
                {
                    text: 'Gentle',
                    onPress: async () => {
                        const updated = { ...state.user!, nudgeFrequency: 'gentle' as const };
                        await StorageService.saveUserProfile(updated);
                        dispatch({ type: 'SET_USER', payload: updated });
                    },
                },
                {
                    text: 'Strict',
                    onPress: async () => {
                        const updated = { ...state.user!, nudgeFrequency: 'strict' as const };
                        await StorageService.saveUserProfile(updated);
                        dispatch({ type: 'SET_USER', payload: updated });
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleStepGoalEdit = () => {
        Alert.prompt(
            'Daily Step Goal',
            'Enter your target steps per day',
            async (value) => {
                const newGoal = parseInt(value, 10);
                if (!isNaN(newGoal) && newGoal > 0) {
                    const updated = { ...state.user!, stepGoal: newGoal };
                    await StorageService.saveUserProfile(updated);
                    dispatch({ type: 'SET_USER', payload: updated });
                }
            },
            'plain-text',
            state.user?.stepGoal?.toString() || '7500'
        );
    };

    const getBMICategory = (bmi?: number): { label: string; color: string } => {
        if (!bmi) return { label: 'N/A', color: Colors.textTertiary };
        if (bmi < 18.5) return { label: 'Underweight', color: Colors.info };
        if (bmi < 25) return { label: 'Healthy', color: Colors.activity };
        if (bmi < 30) return { label: 'Overweight', color: Colors.warning };
        return { label: 'Obese', color: Colors.error };
    };

    const bmiCategory = getBMICategory(state.user?.bmi);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarSection}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitial}>
                                {state.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <MinnieAvatar state="happy" size="small" animated />
                    </View>
                    <Text style={styles.userName}>{state.user?.name || 'User'}</Text>
                    <Text style={styles.userJoined}>
                        Member since {new Date(state.user?.createdAt || '').toLocaleDateString()}
                    </Text>
                </View>

                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <Text style={styles.sectionTitle}>📊 Your Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Current Weight</Text>
                            <Text style={styles.statValue}>{state.user?.currentWeight || '--'} kg</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Target Weight</Text>
                            <Text style={styles.statValue}>{state.user?.targetWeight || '--'} kg</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>BMI</Text>
                            <View style={styles.bmiRow}>
                                <Text style={styles.statValue}>{state.user?.bmi || '--'}</Text>
                                <View style={[styles.bmiTag, { backgroundColor: bmiCategory.color }]}>
                                    <Text style={styles.bmiTagText}>{bmiCategory.label}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Daily Step Goal</Text>
                            <Text style={styles.statValue}>{state.user?.stepGoal?.toLocaleString() || '--'}</Text>
                        </View>
                    </View>
                </View>

                {/* Goal Progress */}
                <View style={styles.goalCard}>
                    <Text style={styles.sectionTitle}>🎯 Goal Progress</Text>
                    <View style={styles.goalProgress}>
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalStart}>{state.user?.currentWeight} kg</Text>
                            <Text style={styles.goalEnd}>→ {state.user?.targetWeight} kg</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '25%' }]} />
                        </View>
                        <Text style={styles.goalRemaining}>
                            {((state.user?.currentWeight || 0) - (state.user?.targetWeight || 0)).toFixed(1)} kg to go
                        </Text>
                    </View>
                </View>

                {/* Settings */}
                <View style={styles.settingsCard}>
                    <Text style={styles.sectionTitle}>⚙️ Settings</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Coaching Mode</Text>
                            <Text style={styles.settingValue}>
                                {state.user?.nudgeFrequency === 'strict' ? 'Strict' : 'Gentle'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={handleCoachingModeChange}
                        >
                            <Text style={styles.changeButtonText}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Activity Reminders</Text>
                            <Text style={styles.settingDesc}>Nudges when sedentary</Text>
                        </View>
                        <Switch
                            value={activityReminders}
                            onValueChange={setActivityReminders}
                            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                            thumbColor={activityReminders ? Colors.primary : Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Water Reminders</Text>
                            <Text style={styles.settingDesc}>Hydration check-ins</Text>
                        </View>
                        <Switch
                            value={waterReminders}
                            onValueChange={setWaterReminders}
                            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                            thumbColor={waterReminders ? Colors.primary : Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Daily Step Goal</Text>
                            <Text style={styles.settingValue}>{state.user?.stepGoal?.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={handleStepGoalEdit}
                        >
                            <Text style={styles.changeButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>🤖 AI Coach</Text>
                            <Text style={styles.settingDesc}>
                                {hasApiKey ? 'OpenAI powered ✓' : 'Not configured'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.changeButton, hasApiKey && styles.configuredButton]}
                            onPress={() => setShowApiKeyModal(true)}
                        >
                            <Text style={[styles.changeButtonText, hasApiKey && styles.configuredButtonText]}>
                                {hasApiKey ? 'Reconfigure' : 'Setup'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* About */}
                <View style={styles.aboutCard}>
                    <Text style={styles.sectionTitle}>ℹ️ About</Text>
                    <View style={styles.aboutItem}>
                        <Text style={styles.aboutLabel}>Version</Text>
                        <Text style={styles.aboutValue}>1.0.0</Text>
                    </View>
                    <View style={styles.aboutItem}>
                        <Text style={styles.aboutLabel}>Powered by</Text>
                        <Text style={styles.aboutValue}>OpenAI GPT</Text>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.dangerCard}>
                    <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleResetOnboarding}>
                        <Text style={styles.dangerButtonText}>Reset All Data</Text>
                    </TouchableOpacity>
                </View>

                {/* Minnie Footer */}
                <View style={styles.minnieFooter}>
                    <MinnieAvatar state="happy" size="medium" showMessage message="I'm always here to help! 💙" animated />
                </View>
            </ScrollView>

            {/* API Key Configuration Modal */}
            <ApiKeyModal
                visible={showApiKeyModal}
                onClose={() => setShowApiKeyModal(false)}
                onSaved={() => setHasApiKey(true)}
            />
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
        marginBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    userCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    userAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    userInitial: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    userName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    userJoined: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
    },
    statsCard: {
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
    statsGrid: {
        gap: Spacing.md,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    statLabel: {
        fontSize: Typography.fontSize.base,
        color: Colors.textSecondary,
    },
    statValue: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    bmiRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bmiTag: {
        marginLeft: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    bmiTagText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textLight,
        fontWeight: Typography.fontWeight.semibold,
    },
    goalCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    goalProgress: {},
    goalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    goalStart: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    goalEnd: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.activity,
    },
    progressBar: {
        height: 12,
        backgroundColor: Colors.border,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.activity,
        borderRadius: 6,
    },
    goalRemaining: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    settingsCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textPrimary,
    },
    settingDesc: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    settingValue: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    changeButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.lg,
    },
    changeButtonText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.primaryDark,
        fontWeight: Typography.fontWeight.medium,
    },
    aboutCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    aboutItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    aboutLabel: {
        fontSize: Typography.fontSize.base,
        color: Colors.textSecondary,
    },
    aboutValue: {
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        fontWeight: Typography.fontWeight.medium,
    },
    dangerCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.error,
    },
    dangerTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.error,
        marginBottom: Spacing.md,
    },
    dangerButton: {
        backgroundColor: Colors.error,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    dangerButtonText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textLight,
    },
    minnieFooter: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    configuredButton: {
        backgroundColor: Colors.success,
        borderWidth: 0,
    },
    configuredButtonText: {
        color: Colors.textLight,
    },
});
