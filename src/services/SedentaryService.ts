/**
 * Sedentary Detection Service
 * Monitors user activity and triggers nudge notifications when inactive too long
 */
import { AppState, AppStateStatus } from 'react-native';
import NotificationService from './NotificationService';
import StorageService from './StorageService';

// Configuration
const DEFAULT_SEDENTARY_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes
const MIN_STEPS_FOR_ACTIVITY = 50; // Minimum steps to count as "moving"
const NUDGE_COOLDOWN_MS = 30 * 60 * 1000; // Don't nudge more than once per 30 min
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

// Storage keys
const STORAGE_KEYS = {
    LAST_ACTIVITY_TIME: '@minnie_last_activity_time',
    LAST_NUDGE_TIME: '@minnie_last_nudge_time',
    SEDENTARY_ENABLED: '@minnie_sedentary_enabled',
    SEDENTARY_THRESHOLD: '@minnie_sedentary_threshold',
};

class SedentaryService {
    private checkInterval: NodeJS.Timeout | null = null;
    private lastActivityTime: number = Date.now();
    private lastNudgeTime: number = 0;
    private lastStepCount: number = 0;
    private isEnabled: boolean = true;
    private thresholdMs: number = DEFAULT_SEDENTARY_THRESHOLD_MS;
    private appState: AppStateStatus = 'active';
    private initialized: boolean = false;

    /**
     * Initialize the sedentary detection service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Load saved settings
            const savedActivityTime = await StorageService.get(STORAGE_KEYS.LAST_ACTIVITY_TIME);
            if (savedActivityTime) {
                this.lastActivityTime = parseInt(savedActivityTime, 10);
            }

            const savedNudgeTime = await StorageService.get(STORAGE_KEYS.LAST_NUDGE_TIME);
            if (savedNudgeTime) {
                this.lastNudgeTime = parseInt(savedNudgeTime, 10);
            }

            const savedEnabled = await StorageService.get(STORAGE_KEYS.SEDENTARY_ENABLED);
            this.isEnabled = savedEnabled !== 'false';

            const savedThreshold = await StorageService.get(STORAGE_KEYS.SEDENTARY_THRESHOLD);
            if (savedThreshold) {
                this.thresholdMs = parseInt(savedThreshold, 10);
            }

            // Listen for app state changes
            AppState.addEventListener('change', this.handleAppStateChange);

            this.initialized = true;
            console.log('SedentaryService initialized');
        } catch (error) {
            console.error('Failed to initialize SedentaryService:', error);
        }
    }

    /**
     * Start monitoring for sedentary behavior
     */
    startMonitoring(): void {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(() => {
            this.checkSedentaryStatus();
        }, CHECK_INTERVAL_MS);

        console.log('Sedentary monitoring started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('Sedentary monitoring stopped');
    }

    /**
     * Handle app state changes (foreground/background)
     */
    private handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground - check sedentary status
            this.checkSedentaryStatus();
        }
        this.appState = nextAppState;
    };

    /**
     * Record user activity (call this when steps increase or user logs activity)
     */
    async recordActivity(stepCount?: number): Promise<void> {
        const now = Date.now();

        // If steps increased significantly, record activity
        if (stepCount !== undefined) {
            const stepDelta = stepCount - this.lastStepCount;
            if (stepDelta >= MIN_STEPS_FOR_ACTIVITY) {
                this.lastActivityTime = now;
                this.lastStepCount = stepCount;
                await this.saveActivityTime();
            }
        } else {
            // Manual activity recorded (e.g., user logged activity)
            this.lastActivityTime = now;
            await this.saveActivityTime();
        }
    }

    /**
     * Check if user has been sedentary too long
     */
    private async checkSedentaryStatus(): Promise<void> {
        if (!this.isEnabled) return;

        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;
        const timeSinceLastNudge = now - this.lastNudgeTime;

        // Check if sedentary threshold exceeded and nudge cooldown passed
        if (timeSinceActivity >= this.thresholdMs && timeSinceLastNudge >= NUDGE_COOLDOWN_MS) {
            await this.triggerNudge();
        }
    }

    /**
     * Trigger a sedentary nudge notification
     */
    private async triggerNudge(): Promise<void> {
        try {
            // Only nudge if app is in background (don't interrupt active usage)
            if (this.appState !== 'active') {
                await NotificationService.showSedentaryNudge();
                this.lastNudgeTime = Date.now();
                await this.saveNudgeTime();
                console.log('Sedentary nudge triggered');
            }
        } catch (error) {
            console.error('Failed to send sedentary nudge:', error);
        }
    }

    /**
     * Get time since last activity in minutes
     */
    getTimeSinceActivity(): number {
        return Math.floor((Date.now() - this.lastActivityTime) / 60000);
    }

    /**
     * Enable or disable sedentary detection
     */
    async setEnabled(enabled: boolean): Promise<void> {
        this.isEnabled = enabled;
        await StorageService.set(STORAGE_KEYS.SEDENTARY_ENABLED, enabled.toString());

        if (enabled) {
            this.startMonitoring();
        } else {
            this.stopMonitoring();
        }
    }

    /**
     * Check if sedentary detection is enabled
     */
    isMonitoringEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Set the sedentary threshold in minutes
     */
    async setThreshold(minutes: number): Promise<void> {
        this.thresholdMs = minutes * 60 * 1000;
        await StorageService.set(STORAGE_KEYS.SEDENTARY_THRESHOLD, this.thresholdMs.toString());
    }

    /**
     * Get the current threshold in minutes
     */
    getThresholdMinutes(): number {
        return Math.floor(this.thresholdMs / 60000);
    }

    // Private helper methods
    private async saveActivityTime(): Promise<void> {
        await StorageService.set(STORAGE_KEYS.LAST_ACTIVITY_TIME, this.lastActivityTime.toString());
    }

    private async saveNudgeTime(): Promise<void> {
        await StorageService.set(STORAGE_KEYS.LAST_NUDGE_TIME, this.lastNudgeTime.toString());
    }
}

export default new SedentaryService();
