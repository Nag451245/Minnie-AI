/**
 * Log Screen - Quick logging modal
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, MoodOptions, SleepQualityOptions } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { MoodType } from '../../types';

type LogType = 'weight' | 'water' | 'mood' | 'sleep' | 'activity' | null;

export default function LogScreen() {
    const navigation = useNavigation();
    const { state, dispatch, updateMood, updateWater, logWeight } = useApp();
    const [activeLog, setActiveLog] = useState<LogType>(null);
    const [weightValue, setWeightValue] = useState('');
    const [sleepHours, setSleepHours] = useState('');
    const [sleepQuality, setSleepQuality] = useState<string>('');
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [activityDuration, setActivityDuration] = useState('');
    const [activityType, setActivityType] = useState('Run');

    const logTypes = [
        { id: 'weight', icon: '⚖️', label: 'Weight', color: Colors.primary },
        { id: 'water', icon: '💧', label: 'Water', color: Colors.info },
        { id: 'mood', icon: '😊', label: 'Mood', color: Colors.secondary },
        { id: 'sleep', icon: '😴', label: 'Sleep', color: '#9B59B6' },
        { id: 'activity', icon: '🏃', label: 'Activity', color: Colors.activity },
    ];

    const handleLogWeight = () => {
        if (weightValue) {
            logWeight(parseFloat(weightValue));
            setWeightValue('');
            setActiveLog(null);
        }
    };

    const handleAddWater = (amount: number) => {
        updateWater(amount);
        setActiveLog(null);
    };

    const handleLogMood = () => {
        if (selectedMood) {
            updateMood(selectedMood);
            setSelectedMood(null);
            setActiveLog(null);
        }
    };

    const handleLogSleep = () => {
        if (sleepHours) {
            // TODO: Save to database
            setSleepHours('');
            setSleepQuality('');
            setActiveLog(null);
        }
    };

    const handleLogActivity = () => {
        if (activityDuration && activityType) {
            dispatch({
                type: 'UPDATE_TODAY_LOG',
                payload: {
                    steps: (state.todayLog?.steps || 0) + (parseInt(activityDuration) * 100),
                    activeMinutes: (state.todayLog?.activeMinutes || 0) + parseInt(activityDuration)
                }
            });
            setActiveLog(null);
            setActivityDuration('');
        }
    };

    const renderLogModal = () => {
        if (!activeLog) return null;

        return (
            <Modal
                visible={!!activeLog}
                animationType="slide"
                transparent
                onRequestClose={() => setActiveLog(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {logTypes.find(l => l.id === activeLog)?.icon}{' '}
                                Log {logTypes.find(l => l.id === activeLog)?.label}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveLog(null)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {activeLog === 'weight' && (
                                <View style={styles.logForm}>
                                    <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={state.user?.currentWeight?.toString() || '75'}
                                        placeholderTextColor={Colors.textTertiary}
                                        keyboardType="decimal-pad"
                                        value={weightValue}
                                        onChangeText={setWeightValue}
                                        autoFocus
                                    />
                                    <TouchableOpacity
                                        style={[styles.submitButton, !weightValue && styles.submitButtonDisabled]}
                                        onPress={handleLogWeight}
                                        disabled={!weightValue}
                                    >
                                        <Text style={styles.submitButtonText}>Update Weight</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeLog === 'activity' && (
                                <View style={styles.logForm}>
                                    <Text style={styles.inputLabel}>Duration (minutes)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="30"
                                        placeholderTextColor={Colors.textTertiary}
                                        keyboardType="number-pad"
                                        value={activityDuration}
                                        onChangeText={setActivityDuration}
                                        autoFocus
                                    />
                                    <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Activity Type</Text>
                                    <View style={styles.moodGrid}>
                                        {['Run', 'Walk', 'Gym', 'Yoga'].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.moodButton,
                                                    activityType === type && styles.moodButtonActive,
                                                    { width: '45%' }
                                                ]}
                                                onPress={() => setActivityType(type)}
                                            >
                                                <Text style={styles.waterButtonText}>{type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.submitButton, (!activityDuration || !activityType) && styles.submitButtonDisabled]}
                                        onPress={handleLogActivity}
                                        disabled={!activityDuration || !activityType}
                                    >
                                        <Text style={styles.submitButtonText}>Log Activity</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeLog === 'water' && (
                                <View style={styles.logForm}>
                                    <Text style={styles.inputLabel}>Add Water Intake</Text>
                                    <View style={styles.waterButtons}>
                                        {[250, 500, 750, 1000].map((amount) => (
                                            <TouchableOpacity
                                                key={amount}
                                                style={styles.waterButton}
                                                onPress={() => handleAddWater(amount)}
                                            >
                                                <Text style={styles.waterButtonIcon}>💧</Text>
                                                <Text style={styles.waterButtonText}>{amount}ml</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={styles.waterNote}>
                                        Today: {(state.todayLog?.waterIntake || 0) / 1000}L
                                    </Text>
                                </View>
                            )}

                            {activeLog === 'mood' && (
                                <View style={styles.logForm}>
                                    <Text style={styles.inputLabel}>How are you feeling?</Text>
                                    <View style={styles.moodGrid}>
                                        {MoodOptions.map((mood) => (
                                            <TouchableOpacity
                                                key={mood.id}
                                                style={[
                                                    styles.moodButton,
                                                    selectedMood === mood.id && styles.moodButtonActive,
                                                ]}
                                                onPress={() => setSelectedMood(mood.id as MoodType)}
                                            >
                                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                                <Text style={styles.moodLabel}>{mood.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.submitButton, !selectedMood && styles.submitButtonDisabled]}
                                        onPress={handleLogMood}
                                        disabled={!selectedMood}
                                    >
                                        <Text style={styles.submitButtonText}>Save Mood</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeLog === 'sleep' && (
                                <View style={styles.logForm}>
                                    <Text style={styles.inputLabel}>Hours Slept</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="7.5"
                                        placeholderTextColor={Colors.textTertiary}
                                        keyboardType="decimal-pad"
                                        value={sleepHours}
                                        onChangeText={setSleepHours}
                                    />

                                    <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Sleep Quality</Text>
                                    <View style={styles.qualityButtons}>
                                        {SleepQualityOptions.map((quality) => (
                                            <TouchableOpacity
                                                key={quality.id}
                                                style={[
                                                    styles.qualityButton,
                                                    sleepQuality === quality.id && styles.qualityButtonActive,
                                                ]}
                                                onPress={() => setSleepQuality(quality.id)}
                                            >
                                                <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
                                                <Text style={styles.qualityLabel}>{quality.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.submitButton, !sleepHours && styles.submitButtonDisabled]}
                                        onPress={handleLogSleep}
                                        disabled={!sleepHours}
                                    >
                                        <Text style={styles.submitButtonText}>Save Sleep</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.minnieSection}>
                            <MinnieAvatar state="happy" size="small" animated={false} />
                            <Text style={styles.minnieNote}>Every log matters! 📝</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quick Log</Text>
                <MinnieAvatar state="encouraging" size="small" animated />
            </View>

            <Text style={styles.subtitle}>What would you like to log today?</Text>

            <View style={styles.logGrid}>
                {logTypes.map((log) => (
                    <TouchableOpacity
                        key={log.id}
                        style={[styles.logCard, { borderLeftColor: log.color }]}
                        onPress={() => setActiveLog(log.id as LogType)}
                    >
                        <Text style={styles.logIcon}>{log.icon}</Text>
                        <Text style={styles.logLabel}>{log.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.tipCard}>
                <MinnieAvatar state="thinking" size="small" animated={false} />
                <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>💡 Logging Tip</Text>
                    <Text style={styles.tipText}>
                        Consistent logging helps me give you better insights! Try to log your mood and water intake 3x daily.
                    </Text>
                </View>
            </View>

            {renderLogModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundSecondary,
        padding: Spacing.base,
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
    subtitle: {
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    logGrid: {
        gap: Spacing.md,
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderLeftWidth: 4,
        ...Shadows.sm,
    },
    logIcon: {
        fontSize: 24,
        marginRight: Spacing.md,
    },
    logLabel: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: Colors.moodNeutral,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    tipContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    tipTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.primaryDark,
        marginBottom: Spacing.xs,
    },
    tipText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    closeButton: {
        fontSize: 24,
        color: Colors.textTertiary,
        padding: Spacing.sm,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    logForm: {},
    inputLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.lg,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginTop: Spacing.lg,
        ...Shadows.sm,
    },
    submitButtonDisabled: {
        backgroundColor: Colors.border,
    },
    submitButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    waterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    waterButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    waterButtonIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    waterButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
    },
    waterNote: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    moodButton: {
        width: '30%',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    moodButtonActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    moodEmoji: {
        fontSize: 28,
        marginBottom: Spacing.xs,
    },
    moodLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    qualityButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    qualityButton: {
        flex: 1,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    qualityButtonActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    qualityEmoji: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    qualityLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    sectionNote: {
        fontSize: Typography.fontSize.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    minnieSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    minnieNote: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        marginLeft: Spacing.sm,
    },
});
