/**
 * Onboarding Screen - 5-step setup with Minnie
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { UserProfile, MinnieState } from '../../types';
import { StepGoalsByLevel } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingData {
    name: string;
    gender: 'male' | 'female' | 'other';
    age: string;
    heightCm: string;
    currentWeight: string;
    targetWeight: string;
    activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive';
    nudgeFrequency: 'gentle' | 'strict';
}

const STEPS = [
    {
        id: 1,
        title: 'Welcome',
        minnieMessage: "Hi! I'm Minnie, your wellness companion. I'm here to help you succeed—not just with numbers, but with how you feel.",
        minnieState: 'happy' as MinnieState,
    },
    {
        id: 2,
        title: 'About You',
        minnieMessage: "Let's get to know each other! This helps me calculate what's healthy for YOUR body.",
        minnieState: 'encouraging' as MinnieState,
    },
    {
        id: 3,
        title: 'Your Goals',
        minnieMessage: "Let's make this realistic. Slow progress is lasting progress. What's your target?",
        minnieState: 'thinking' as MinnieState,
    },
    {
        id: 4,
        title: 'Activity Level',
        minnieMessage: "Be honest here—I'll adjust your goals based on reality. How active are you currently?",
        minnieState: 'encouraging' as MinnieState,
    },
    {
        id: 5,
        title: 'Coaching Style',
        minnieMessage: "I'll adapt to what works for YOU. We can change this anytime!",
        minnieState: 'happy' as MinnieState,
    },
];

export default function OnboardingScreen() {
    const { completeOnboarding } = useApp();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>({
        name: '',
        gender: 'other',
        age: '',
        heightCm: '',
        currentWeight: '',
        targetWeight: '',
        activityLevel: 'lightlyActive',
        nudgeFrequency: 'gentle',
    });

    const currentStep = STEPS[step - 1];

    const calculateBMI = (weight: number, heightCm: number): number => {
        const heightM = heightCm / 100;
        return parseFloat((weight / (heightM * heightM)).toFixed(1));
    };

    const calculateBMR = (weight: number, heightCm: number, age: number, gender: string): number => {
        // Mifflin-St Jeor Equation
        if (gender === 'male') {
            return 10 * weight + 6.25 * heightCm - 5 * age + 5;
        }
        return 10 * weight + 6.25 * heightCm - 5 * age - 161;
    };

    const handleNext = async () => {
        if (step < 5) {
            setStep(step + 1);
        } else {
            // Complete onboarding
            const bmi = calculateBMI(parseFloat(data.currentWeight), parseFloat(data.heightCm));
            const bmr = calculateBMR(
                parseFloat(data.currentWeight),
                parseFloat(data.heightCm),
                parseInt(data.age, 10),
                data.gender
            );
            const stepGoal = StepGoalsByLevel[data.activityLevel];

            const profile: UserProfile = {
                name: data.name,
                gender: data.gender,
                age: parseInt(data.age, 10),
                heightCm: parseFloat(data.heightCm),
                currentWeight: parseFloat(data.currentWeight),
                targetWeight: parseFloat(data.targetWeight),
                activityLevel: data.activityLevel,
                bmi,
                bmr,
                stepGoal,
                nudgeFrequency: data.nudgeFrequency,
                onboardingComplete: true,
                createdAt: new Date().toISOString(),
            };

            await completeOnboarding(profile);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const isStepValid = (): boolean => {
        switch (step) {
            case 1:
                return true;
            case 2:
                return data.name.length > 0 && data.age.length > 0 && data.heightCm.length > 0;
            case 3:
                return data.currentWeight.length > 0 && data.targetWeight.length > 0;
            case 4:
            case 5:
                return true;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>Welcome to Minnie AI</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Your personal wellness companion for sustainable weight loss through behavior and emotional support.
                        </Text>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.formContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>What's your name?</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors.textTertiary}
                                value={data.name}
                                onChangeText={(text) => setData({ ...data, name: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Gender</Text>
                            <View style={styles.optionRow}>
                                {(['male', 'female', 'other'] as const).map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.optionButton, data.gender === g && styles.optionButtonActive]}
                                        onPress={() => setData({ ...data, gender: g })}
                                    >
                                        <Text style={[styles.optionText, data.gender === g && styles.optionTextActive]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.rowInputs}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                                <Text style={styles.inputLabel}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="25"
                                    placeholderTextColor={Colors.textTertiary}
                                    keyboardType="numeric"
                                    value={data.age}
                                    onChangeText={(text) => setData({ ...data, age: text })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Height (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="170"
                                    placeholderTextColor={Colors.textTertiary}
                                    keyboardType="numeric"
                                    value={data.heightCm}
                                    onChangeText={(text) => setData({ ...data, heightCm: text })}
                                />
                            </View>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.formContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="75"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="numeric"
                                value={data.currentWeight}
                                onChangeText={(text) => setData({ ...data, currentWeight: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Target Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="70"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="numeric"
                                value={data.targetWeight}
                                onChangeText={(text) => setData({ ...data, targetWeight: text })}
                            />
                        </View>

                        {data.currentWeight && data.heightCm && (
                            <View style={styles.bmiCard}>
                                <Text style={styles.bmiLabel}>Your BMI</Text>
                                <Text style={styles.bmiValue}>
                                    {calculateBMI(parseFloat(data.currentWeight), parseFloat(data.heightCm))}
                                </Text>
                            </View>
                        )}
                    </View>
                );

            case 4:
                return (
                    <View style={styles.formContent}>
                        <Text style={styles.sectionTitle}>How active are you currently?</Text>
                        {[
                            { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', steps: '5,000 steps/day' },
                            { value: 'lightlyActive', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week', steps: '7,500 steps/day' },
                            { value: 'moderatelyActive', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week', steps: '10,000 steps/day' },
                            { value: 'veryActive', label: 'Very Active', desc: 'Hard exercise 6-7 days/week', steps: '12,500 steps/day' },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.activityOption,
                                    data.activityLevel === option.value && styles.activityOptionActive,
                                ]}
                                onPress={() => setData({ ...data, activityLevel: option.value as OnboardingData['activityLevel'] })}
                            >
                                <View style={styles.activityInfo}>
                                    <Text style={[styles.activityLabel, data.activityLevel === option.value && styles.activityLabelActive]}>
                                        {option.label}
                                    </Text>
                                    <Text style={styles.activityDesc}>{option.desc}</Text>
                                </View>
                                <Text style={styles.activitySteps}>{option.steps}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );

            case 5:
                return (
                    <View style={styles.formContent}>
                        <Text style={styles.sectionTitle}>Choose your coaching style</Text>
                        <TouchableOpacity
                            style={[styles.coachingOption, data.nudgeFrequency === 'gentle' && styles.coachingOptionActive]}
                            onPress={() => setData({ ...data, nudgeFrequency: 'gentle' })}
                        >
                            <Text style={styles.coachingEmoji}>🌸</Text>
                            <View style={styles.coachingInfo}>
                                <Text style={[styles.coachingLabel, data.nudgeFrequency === 'gentle' && styles.coachingLabelActive]}>
                                    Gentle Mode
                                </Text>
                                <Text style={styles.coachingDesc}>3 nudges/day, softer language, activity reminder after 45 mins idle</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.coachingOption, data.nudgeFrequency === 'strict' && styles.coachingOptionActive]}
                            onPress={() => setData({ ...data, nudgeFrequency: 'strict' })}
                        >
                            <Text style={styles.coachingEmoji}>💪</Text>
                            <View style={styles.coachingInfo}>
                                <Text style={[styles.coachingLabel, data.nudgeFrequency === 'strict' && styles.coachingLabelActive]}>
                                    Strict Mode
                                </Text>
                                <Text style={styles.coachingDesc}>Hourly check-ins, direct challenges, activity reminder every 30 mins idle</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>Step {step} of 5</Text>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Minnie Avatar */}
                    <View style={styles.minnieSection}>
                        <MinnieAvatar
                            state={currentStep.minnieState}
                            size="large"
                            showMessage
                            message={currentStep.minnieMessage}
                            animated
                        />
                    </View>

                    {/* Step Content */}
                    {renderStepContent()}
                </ScrollView>

                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    {step > 1 && (
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.nextButton, !isStepValid() && styles.nextButtonDisabled]}
                        onPress={handleNext}
                        disabled={!isStepValid()}
                    >
                        <Text style={styles.nextButtonText}>
                            {step === 5 ? "Let's Start!" : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    progressContainer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    minnieSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    welcomeContent: {
        alignItems: 'center',
        paddingTop: Spacing.xl,
    },
    welcomeTitle: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    welcomeSubtitle: {
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    formContent: {
        paddingTop: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
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
        fontSize: Typography.fontSize.md,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    optionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    optionButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.base,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    optionButtonActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    optionText: {
        fontSize: Typography.fontSize.base,
        color: Colors.textSecondary,
        fontWeight: Typography.fontWeight.medium,
    },
    optionTextActive: {
        color: Colors.primaryDark,
        fontWeight: Typography.fontWeight.semibold,
    },
    rowInputs: {
        flexDirection: 'row',
    },
    bmiCard: {
        backgroundColor: Colors.moodNeutral,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    bmiLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    bmiValue: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.primary,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    activityOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    activityOptionActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    activityInfo: {
        flex: 1,
    },
    activityLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    activityLabelActive: {
        color: Colors.primaryDark,
    },
    activityDesc: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
    },
    activitySteps: {
        fontSize: Typography.fontSize.sm,
        color: Colors.activity,
        fontWeight: Typography.fontWeight.semibold,
    },
    coachingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    coachingOptionActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    coachingEmoji: {
        fontSize: 32,
        marginRight: Spacing.md,
    },
    coachingInfo: {
        flex: 1,
    },
    coachingLabel: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    coachingLabelActive: {
        color: Colors.primaryDark,
    },
    coachingDesc: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    backButton: {
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    backButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textSecondary,
    },
    nextButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        ...Shadows.md,
    },
    nextButtonDisabled: {
        backgroundColor: Colors.border,
    },
    nextButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
});
