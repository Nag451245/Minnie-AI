/**
 * Log Activity Screen - Manual activity entry
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, ActivityTypes } from '../../constants/theme';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { RootStackParamList, ActivityType } from '../../types';
import StorageService from '../../services/StorageService';

type LogActivityRouteProp = RouteProp<RootStackParamList, 'LogActivity'>;

export default function LogActivityScreen() {
    const navigation = useNavigation();
    const route = useRoute<LogActivityRouteProp>();

    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(
        route.params?.type || null
    );
    const [duration, setDuration] = useState('');
    const [intensity, setIntensity] = useState<'light' | 'moderate' | 'high'>('moderate');
    const [notes, setNotes] = useState('');

    const calculateCalories = (): number => {
        if (!selectedActivity || !duration) return 0;
        const activityInfo = ActivityTypes.find(a => a.id === selectedActivity);
        if (!activityInfo) return 0;

        const intensityMultiplier = intensity === 'light' ? 0.8 : intensity === 'high' ? 1.2 : 1;
        const weight = 70; // Default, should use actual user weight
        const hours = parseInt(duration, 10) / 60;

        return Math.round(activityInfo.met * intensityMultiplier * weight * hours);
    };

    const handleSave = async () => {
        if (!selectedActivity || !duration) return;

        const activity = {
            type: selectedActivity,
            duration: parseInt(duration, 10),
            intensity,
            calories: calculateCalories(),
            notes,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
        };

        try {
            console.log('[LogActivity] Saving activity:', activity);

            // Get existing logs and add new one
            const existingLogs = await StorageService.getDailyLogs();
            const updatedLogs = [...existingLogs, activity];

            await StorageService.saveDailyLogs(updatedLogs);

            console.log('[LogActivity] ✅ Activity saved successfully');
            console.log('[LogActivity] Total logs now:', updatedLogs.length);

            navigation.goBack();
        } catch (error) {
            console.error('[LogActivity] ❌ Error saving activity:', error);
        }
    };

    const isValid = selectedActivity && duration && parseInt(duration, 10) > 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Log Activity</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Activity Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity Type</Text>
                    <View style={styles.activityGrid}>
                        {ActivityTypes.map((activity) => (
                            <TouchableOpacity
                                key={activity.id}
                                style={[
                                    styles.activityCard,
                                    selectedActivity === activity.id && styles.activityCardActive,
                                ]}
                                onPress={() => setSelectedActivity(activity.id as ActivityType)}
                            >
                                <Text style={styles.activityIcon}>{activity.icon}</Text>
                                <Text style={[
                                    styles.activityLabel,
                                    selectedActivity === activity.id && styles.activityLabelActive,
                                ]}>
                                    {activity.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Duration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Duration (minutes)</Text>
                    <View style={styles.durationRow}>
                        <TextInput
                            style={styles.durationInput}
                            placeholder="30"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="numeric"
                            value={duration}
                            onChangeText={setDuration}
                        />
                        <View style={styles.quickDurations}>
                            {[15, 30, 45, 60].map((mins) => (
                                <TouchableOpacity
                                    key={mins}
                                    style={[styles.quickButton, duration === mins.toString() && styles.quickButtonActive]}
                                    onPress={() => setDuration(mins.toString())}
                                >
                                    <Text style={[styles.quickButtonText, duration === mins.toString() && styles.quickButtonTextActive]}>
                                        {mins}m
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Intensity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Intensity</Text>
                    <View style={styles.intensityRow}>
                        {(['light', 'moderate', 'high'] as const).map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[styles.intensityButton, intensity === level && styles.intensityButtonActive]}
                                onPress={() => setIntensity(level)}
                            >
                                <Text style={styles.intensityEmoji}>
                                    {level === 'light' ? '🚶' : level === 'moderate' ? '🏃' : '🔥'}
                                </Text>
                                <Text style={[styles.intensityLabel, intensity === level && styles.intensityLabelActive]}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes (optional)</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="How did it feel?"
                        placeholderTextColor={Colors.textTertiary}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                {/* Calorie Estimate */}
                {isValid && (
                    <View style={styles.calorieCard}>
                        <Text style={styles.calorieLabel}>Estimated Calories Burned</Text>
                        <Text style={styles.calorieValue}>🔥 {calculateCalories()} cal</Text>
                    </View>
                )}

                {/* Minnie */}
                <View style={styles.minnieSection}>
                    <MinnieAvatar state="happy" size="small" animated={false} />
                    <Text style={styles.minnieMessage}>
                        Every bit of movement counts! 💪
                    </Text>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!isValid}
                >
                    <Text style={styles.saveButtonText}>Save Activity</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 24,
        color: Colors.textSecondary,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.base,
        paddingBottom: Spacing.xl,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    activityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    activityCard: {
        width: '31%',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    activityCardActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    activityIcon: {
        fontSize: 28,
        marginBottom: Spacing.xs,
    },
    activityLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    activityLabelActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.fontWeight.semibold,
    },
    durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    durationInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
        textAlign: 'center',
    },
    quickDurations: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    quickButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    quickButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    quickButtonText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.fontWeight.medium,
    },
    quickButtonTextActive: {
        color: Colors.textLight,
    },
    intensityRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    intensityButton: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    intensityButtonActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    intensityEmoji: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    intensityLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    intensityLabelActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.fontWeight.semibold,
    },
    notesInput: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    calorieCard: {
        backgroundColor: Colors.moodActive,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    calorieLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.activityDark,
        marginBottom: Spacing.xs,
    },
    calorieValue: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.activityDark,
    },
    minnieSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
    },
    minnieMessage: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        marginLeft: Spacing.sm,
    },
    footer: {
        padding: Spacing.base,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        ...Shadows.md,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.border,
    },
    saveButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
});
