/**
 * Minnie AI - Theme Constants
 * Design system following the PRD specifications
 */

// Color Palette
export const Colors = {
    // Primary Colors
    primary: '#4ECDC4', // Soft teal - Calming, trustworthy
    primaryLight: '#7EDDD7',
    primaryDark: '#3DBDB5',

    // Secondary Colors
    secondary: '#FF6B6B', // Warm coral - Energetic, motivational
    secondaryLight: '#FF8E8E',
    secondaryDark: '#E55555',

    // Activity Colors
    activity: '#4ADE80', // Vibrant green - Movement, vitality
    activityLight: '#6EE7A0',
    activityDark: '#22C55E',

    // Warning/Alert Colors
    warning: '#FFA500', // Soft amber - Gentle alert
    warningLight: '#FFB833',
    warningDark: '#E69500',

    // Mood-Adaptive Backgrounds
    moodStressed: '#E8F4FD', // Cool blue tones
    moodHappy: '#FFF8E8', // Warm orange/yellow tones
    moodActive: '#E8FDF0', // Green accents
    moodNeutral: '#E8F9F8', // Default teal

    // Base Colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F7F7',

    // Text Colors
    textPrimary: '#1A1A2E',
    textSecondary: '#4A4A68',
    textTertiary: '#8A8AA3',
    textLight: '#FFFFFF',

    // State Colors
    success: '#4ADE80',
    error: '#EF4444',
    info: '#3B82F6',

    // Streak Colors
    streakFlame: '#FF6B35',
    streakGold: '#FFD700',

    // Border Colors
    border: '#E8EAEA',
    borderLight: '#F0F2F2',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.1)',
};

// Typography
export const Typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

// Spacing
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
};

// Border Radius
export const BorderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
};

// Shadows
export const Shadows = {
    sm: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.5,
        elevation: 2,
    },
    md: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 4,
    },
    lg: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    xl: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 12,
    },
};

// Minnie Avatar States
export const MinnieStates = {
    happy: {
        color: Colors.primary,
        animation: 'gentle_sway',
        message: "I'm here when you need me",
    },
    celebratory: {
        color: Colors.streakGold,
        animation: 'jumping_confetti',
        message: "You're crushing it today!",
    },
    concerned: {
        color: Colors.moodStressed,
        animation: 'thoughtful_pose',
        message: "Let's figure out what happened",
    },
    calming: {
        color: '#87CEEB',
        animation: 'breathing',
        message: 'Breathe with me...',
    },
    encouraging: {
        color: Colors.secondary,
        animation: 'pointing',
        message: "Ready for today's mission?",
    },
    energized: {
        color: Colors.activity,
        animation: 'running',
        message: 'Yes! Keep moving!',
    },
    sedentaryWarning: {
        color: Colors.warning,
        animation: 'sitting_tapping',
        message: 'Time to move, friend!',
    },
    thinking: {
        color: Colors.info,
        animation: 'thinking',
        message: 'Let me think about that...',
    },
};

// Mood Options
export const MoodOptions = [
    { id: 'happy', emoji: '😊', label: 'Happy', color: Colors.moodHappy },
    { id: 'sad', emoji: '😢', label: 'Sad', color: Colors.moodStressed },
    { id: 'stressed', emoji: '😰', label: 'Stressed', color: Colors.moodStressed },
    { id: 'energetic', emoji: '⚡', label: 'Energetic', color: Colors.activity },
    { id: 'bored', emoji: '😴', label: 'Bored', color: Colors.surfaceSecondary },
];

// Activity Types
export const ActivityTypes = [
    { id: 'walking', icon: '🚶', label: 'Walking', met: 3.5 },
    { id: 'running', icon: '🏃', label: 'Running', met: 9.8 },
    { id: 'cycling', icon: '🚴', label: 'Cycling', met: 6.8 },
    { id: 'swimming', icon: '🏊', label: 'Swimming', met: 7.0 },
    { id: 'yoga', icon: '🧘', label: 'Yoga', met: 2.5 },
    { id: 'strength', icon: '🏋️', label: 'Strength Training', met: 5.0 },
    { id: 'rest', icon: '💤', label: 'Intentional Rest', met: 1.0 },
];

// Sleep Quality Options
export const SleepQualityOptions = [
    { id: 'good', label: 'Good', emoji: '😊' },
    { id: 'groggy', label: 'Groggy', emoji: '😑' },
    { id: 'terrible', label: 'Terrible', emoji: '😫' },
];

// Default step goals by activity level
export const StepGoalsByLevel = {
    sedentary: 5000,
    lightlyActive: 7500,
    moderatelyActive: 10000,
    veryActive: 12500,
};

// Nudge settings
export const NudgeSettings = {
    gentle: {
        frequency: 3, // per day
        idleThreshold: 45, // minutes
    },
    strict: {
        frequency: 6, // per day
        idleThreshold: 30, // minutes
    },
};

export default {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
    MinnieStates,
    MoodOptions,
    ActivityTypes,
    SleepQualityOptions,
    StepGoalsByLevel,
    NudgeSettings,
};
