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
};

class StorageService {
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
}

export default new StorageService();
