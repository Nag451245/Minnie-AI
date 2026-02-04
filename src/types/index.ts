/**
 * TypeScript interfaces for Minnie AI
 */

// User Profile
export interface UserProfile {
    name: string;
    gender: 'male' | 'female' | 'other';
    age: number;
    heightCm: number;
    currentWeight: number;
    targetWeight: number;
    activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive';
    bmi?: number;
    bmr?: number;
    tdee?: number;
    stepGoal: number;
    nudgeFrequency: 'gentle' | 'strict';
    onboardingComplete: boolean;
    createdAt: string;
    manifesto?: string;
}

// Daily Log Entry
export interface DailyLog {
    date: string; // YYYY-MM-DD
    weight?: number;
    mood?: MoodType;
    sleepHours?: number;
    sleepQuality?: 'good' | 'groggy' | 'terrible';
    waterIntake: number; // ml
    steps: number;
    stepGoal: number;
    distanceKm?: number;
    activeMinutes?: number;
    caloriesBurned?: number;
    sedentaryMinutes?: number;
    longestSedentaryPeriod?: number;
    notes?: string;
    challengeCompleted: boolean;
    challengeText?: string;
    minnieInsights?: string;
}

// Activity Log
export interface ActivityLog {
    id: number;
    date: string;
    timestamp: number;
    activityType: ActivityType;
    durationMinutes: number;
    intensity: 'light' | 'moderate' | 'high';
    caloriesBurned?: number;
    steps?: number;
    distanceKm?: number;
    notes?: string;
    isManual: boolean;
}

// Sedentary Period
export interface SedentaryPeriod {
    id: number;
    date: string;
    startTime: string; // HH:MM
    endTime: string;
    durationMinutes: number;
    nudgeSent: boolean;
    userAction?: 'walked' | 'snoozed' | 'ignored';
}

// Chat Message
export interface ChatMessage {
    id: number;
    timestamp: number;
    sender: 'user' | 'minnie';
    message: string;
    moodContext?: MoodType;
    activityContext?: string;
    minnieAvatarState?: MinnieState;
}

// Achievement
export interface Achievement {
    id: number;
    date: string;
    type: 'streak' | 'weight_milestone' | 'challenge' | 'step_goal' | 'activity_streak';
    description: string;
    value?: number;
    unlocked: boolean;
}

// Type aliases
export type MoodType = 'happy' | 'sad' | 'stressed' | 'energetic' | 'bored';

export type ActivityType =
    | 'walking'
    | 'running'
    | 'cycling'
    | 'swimming'
    | 'yoga'
    | 'strength'
    | 'rest';

export type MinnieState =
    | 'happy'
    | 'celebratory'
    | 'concerned'
    | 'calming'
    | 'encouraging'
    | 'energized'
    | 'sedentaryWarning'
    | 'thinking'
    | 'listening'
    | 'speaking';

// Context for OpenAI API
export interface MinnieContext {
    currentMood?: MoodType;
    recentStats: {
        stepsToday: number;
        stepsYesterday: number;
        weeklyAvgSteps: number;
        sedentaryMinutesToday: number;
        sleepHours?: number;
        waterMl: number;
        weightTrend: string;
    };
    goalStatus: string;
    streakDays: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    activityLevel: 'below_target' | 'on_target' | 'above_target';
    userName: string;
}

// Navigation types
export type RootTabParamList = {
    Home: undefined;
    Activity: undefined;
    Log: undefined;
    Coach: undefined;
    Progress: undefined;
    Social: undefined;
    Profile: undefined;
    Settings: undefined;
};

export type RootStackParamList = {
    Onboarding: undefined;
    MainTabs: undefined;
    WalkTracker: undefined;
    LogActivity: { type?: ActivityType };
    AchievementDetail: { achievement: Achievement };
    GroupDetail: { groupId: string };
    CreateGroup: undefined;
    JoinGroup: undefined;
};

// Onboarding Step
export interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    minnieMessage: string;
    minnieState: MinnieState;
}

// Weekly Summary
export interface WeeklySummary {
    totalSteps: number;
    avgDailySteps: number;
    goalDays: number;
    totalDistance: number;
    mostActiveDay: string;
    leastActiveDay: string;
    avgSedentaryTime: number;
    weightChange?: number;
    moodTrend: string;
}

// Challenge
export interface Challenge {
    id: string;
    text: string;
    type: 'steps' | 'water' | 'activity' | 'sleep' | 'mood';
    targetValue: number;
    currentValue: number;
    completed: boolean;
    expiresAt: string;
}

// Notification types
export interface ScheduledNudge {
    id: string;
    type: 'activity' | 'water' | 'mood' | 'sleep' | 'check_in' | 'celebration';
    message: string;
    scheduledTime: Date;
    minnieState: MinnieState;
}

// Social & Group Challenges
export interface GroupMember {
    userId: string;
    name: string;
    avatarStyle: string;
    joinedAt: string;
    isAdmin: boolean;
    lastActiveAt?: string;
    stats?: {
        stepsToday: number;
        streak: number;
        challengeProgress: number;
    };
}

export interface SocialChallenge {
    id: string;
    title: string;
    description: string;
    type: 'steps' | 'consistency' | 'sleep' | 'hydration';
    targetValue: number;
    durationDays: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'upcoming';
    participants?: Record<string, number>; // userId -> progress
    winnerUserId?: string;
}

export interface ChallengeGroup {
    id: string;
    name: string;
    inviteCode: string;
    members: GroupMember[];
    activeChallenge: SocialChallenge | null;
    pastChallenges: SocialChallenge[];
    createdAt: string;
    createdBy: string;
}
