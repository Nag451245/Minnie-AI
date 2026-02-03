/**
 * Storage Service - AsyncStorage wrapper for user preferences
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const STORAGE_KEYS = {
    USER_PROFILE: '@minnie_user_profile',
    ONBOARDING_COMPLETE: '@minnie_onboarding_complete',
    NUDGE_FREQUENCY: '@minnie_nudge_frequency',
    STEP_GOAL: '@minnie_step_goal',
    ACTIVITY_REMINDER_ENABLED: '@minnie_activity_reminder',
    ACTIVITY_REMINDER_THRESHOLD: '@minnie_activity_threshold',
    SLEEP_HOURS: '@minnie_sleep_hours',
    MINNIE_AVATAR_STYLE: '@minnie_avatar_style',
    LAST_NUDGE_TIME: '@minnie_last_nudge',
    LAST_ACTIVITY_CHECK: '@minnie_last_activity_check',
    DAILY_STEPS_PREFIX: '@minnie_daily_steps_',
    OPENAI_API_KEY: '@minnie_openai_api_key',
    DAILY_LOGS: '@minnie_daily_logs',
    CURRENT_STREAK: '@minnie_current_streak',
    LAST_RAW_STEPS: '@minnie_last_raw_steps',
};

class StorageService {
    // ... existing user profile methods ...

    // Raw Step Tracking (for reboot handling)
    async setLastRawSteps(steps: number): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_RAW_STEPS, steps.toString());
    }

    async getLastRawSteps(): Promise<number> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RAW_STEPS);
        return data ? parseFloat(data) : 0;
    }

    // User Profile
    async saveUserProfile(profile: UserProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw error;
        }
    }

    async getUserProfile(): Promise<UserProfile | null> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
        try {
            const existing = await this.getUserProfile();
            if (existing) {
                await this.saveUserProfile({ ...existing, ...updates });
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Onboarding
    async setOnboardingComplete(complete: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
        } catch (error) {
            console.error('Error setting onboarding status:', error);
            throw error;
        }
    }

    async isOnboardingComplete(): Promise<boolean> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
            return data ? JSON.parse(data) : false;
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            return false;
        }
    }

    // Nudge Settings
    async setNudgeFrequency(frequency: 'gentle' | 'strict'): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.NUDGE_FREQUENCY, frequency);
    }

    async getNudgeFrequency(): Promise<'gentle' | 'strict'> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.NUDGE_FREQUENCY);
        return (data as 'gentle' | 'strict') || 'gentle';
    }

    // Step Goal
    async setStepGoal(goal: number): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.STEP_GOAL, goal.toString());
    }

    async getStepGoal(): Promise<number> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.STEP_GOAL);
        return data ? parseInt(data, 10) : 7500;
    }

    // Activity Reminders
    async setActivityReminderEnabled(enabled: boolean): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_REMINDER_ENABLED, JSON.stringify(enabled));
    }

    async isActivityReminderEnabled(): Promise<boolean> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_REMINDER_ENABLED);
        return data ? JSON.parse(data) : true;
    }

    async setActivityReminderThreshold(minutes: number): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_REMINDER_THRESHOLD, minutes.toString());
    }

    async getActivityReminderThreshold(): Promise<number> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_REMINDER_THRESHOLD);
        return data ? parseInt(data, 10) : 45;
    }

    // Sleep Hours
    async setSleepHours(hours: { start: string; end: string }): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_HOURS, JSON.stringify(hours));
    }

    async getSleepHours(): Promise<{ start: string; end: string }> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_HOURS);
        return data ? JSON.parse(data) : { start: '22:00', end: '07:00' };
    }

    // Avatar Style
    async setMinnieAvatarStyle(style: string): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.MINNIE_AVATAR_STYLE, style);
    }

    async getMinnieAvatarStyle(): Promise<string> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.MINNIE_AVATAR_STYLE);
        return data || 'classic';
    }

    // Last Nudge Time
    async setLastNudgeTime(timestamp: number): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_NUDGE_TIME, timestamp.toString());
    }

    async getLastNudgeTime(): Promise<number | null> {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NUDGE_TIME);
        return data ? parseInt(data, 10) : null;
    }

    // Daily Steps (by date)
    async setDailySteps(date: string, steps: number): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STEPS_PREFIX + date, steps.toString());
        } catch (error) {
            console.error('Error saving daily steps:', error);
        }
    }

    async getDailySteps(date: string): Promise<number> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_STEPS_PREFIX + date);
            return data ? parseInt(data, 10) : 0;
        } catch (error) {
            console.error('Error getting daily steps:', error);
            return 0;
        }
    }

    // OpenAI API Key
    async setApiKey(key: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.OPENAI_API_KEY, key);
        } catch (error) {
            console.error('Error saving API key:', error);
        }
    }

    async getApiKey(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.OPENAI_API_KEY);
        } catch (error) {
            console.error('Error getting API key:', error);
            return null;
        }
    }

    // Daily Logs (array of log entries)
    async saveDailyLogs(logs: any[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
        } catch (error) {
            console.error('Error saving daily logs:', error);
        }
    }

    async getDailyLogs(): Promise<any[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting daily logs:', error);
            return [];
        }
    }

    // Current Streak
    async setStreak(streak: number): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_STREAK, streak.toString());
        } catch (error) {
            console.error('Error saving streak:', error);
        }
    }

    async getStreak(): Promise<number> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STREAK);
            return data ? parseInt(data, 10) : 0;
        } catch (error) {
            console.error('Error getting streak:', error);
            return 0;
        }
    }

    // Clear all data (for testing/reset)
    async clearAll(): Promise<void> {
        try {
            const keys = Object.values(STORAGE_KEYS);
            await AsyncStorage.multiRemove(keys);
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }

    // Generic get for any key
    async get(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return null;
        }
    }

    // Generic set for any key
    async set(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
            throw error;
        }
    }
}

export default new StorageService();
