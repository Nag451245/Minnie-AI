/**
 * Health Connect Service - Background step tracking using Android Health Connect
 * 
 * This service reads step counts from Health Connect (synced from Google Fit, 
 * Samsung Health, Fitbit, etc.) for accurate background tracking.
 * 
 * Falls back to accelerometer-based PedometerService when Health Connect unavailable.
 */
import { Platform, Alert, Linking } from 'react-native';
import PedometerService from './PedometerService';
import StorageService from './StorageService';
import SedentaryService from './SedentaryService';

// Note: In a real implementation, you would import from 'react-native-health-connect'
// For now, we'll create a service that can work with or without Health Connect
// and provide a robust fallback to accelerometer-based tracking

const STORAGE_KEYS = {
    HEALTH_CONNECT_ENABLED: '@minnie_health_connect_enabled',
    LAST_SYNCED_STEPS: '@minnie_last_synced_steps',
    LAST_SYNC_TIME: '@minnie_last_sync_time',
};

// Step tracking sources
export type StepSource = 'health_connect' | 'accelerometer' | 'manual';

interface StepData {
    count: number;
    source: StepSource;
    lastUpdated: Date;
}

class HealthConnectService {
    private initialized: boolean = false;
    private healthConnectAvailable: boolean = false;
    private useHealthConnect: boolean = false;
    private listeners: ((steps: number, source: StepSource) => void)[] = [];
    private currentSteps: number = 0;
    private syncInterval: NodeJS.Timeout | null = null;

    // Sync interval - check Health Connect every 5 minutes
    private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000;

    /**
     * Initialize the health connect service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Check platform
            if (Platform.OS !== 'android') {
                console.log('Health Connect is only available on Android');
                this.healthConnectAvailable = false;
                this.initialized = true;
                return;
            }

            // Check if user has enabled Health Connect preference
            const enabled = await StorageService.get(STORAGE_KEYS.HEALTH_CONNECT_ENABLED);
            this.useHealthConnect = enabled === 'true';

            // For now, we'll use the accelerometer-based approach
            // In a full implementation, this would check for Health Connect SDK availability
            // and initialize it accordingly

            // Check if Health Connect SDK is available (placeholder for actual check)
            this.healthConnectAvailable = await this.checkHealthConnectAvailability();

            // Load last synced steps
            const savedSteps = await StorageService.get(STORAGE_KEYS.LAST_SYNCED_STEPS);
            if (savedSteps) {
                this.currentSteps = parseInt(savedSteps, 10);
            }

            this.initialized = true;
            console.log('HealthConnectService initialized', {
                available: this.healthConnectAvailable,
                enabled: this.useHealthConnect
            });
        } catch (error) {
            console.error('Failed to initialize HealthConnectService:', error);
            this.initialized = true;
        }
    }

    /**
     * Check if Health Connect is available on the device
     */
    private async checkHealthConnectAvailability(): Promise<boolean> {
        // In production, this would check if Health Connect SDK is installed
        // For Android 14+, it's built-in. For older versions, check if installed.

        // Placeholder - return false to use accelerometer fallback
        // When react-native-health-connect is installed, this would use:
        // return await healthConnect.isAvailable();
        return false;
    }

    /**
     * Request permission to read step data from Health Connect
     */
    async requestPermission(): Promise<boolean> {
        if (!this.healthConnectAvailable) {
            // Fall back to accelerometer permission
            return await PedometerService.requestPermission();
        }

        // In production with react-native-health-connect:
        // const result = await healthConnect.requestPermission([
        //     { accessType: 'read', recordType: 'Steps' }
        // ]);
        // return result.granted;

        return true;
    }

    /**
     * Enable or disable Health Connect integration
     */
    async setHealthConnectEnabled(enabled: boolean): Promise<void> {
        this.useHealthConnect = enabled && this.healthConnectAvailable;
        await StorageService.set(STORAGE_KEYS.HEALTH_CONNECT_ENABLED, enabled.toString());

        if (this.useHealthConnect) {
            await this.startBackgroundSync();
        } else {
            this.stopBackgroundSync();
        }
    }

    /**
     * Check if Health Connect is available and enabled
     */
    isHealthConnectEnabled(): boolean {
        return this.useHealthConnect && this.healthConnectAvailable;
    }

    /**
     * Get today's step count from the best available source
     */
    async getTodaySteps(): Promise<StepData> {
        await this.initialize();

        if (this.useHealthConnect && this.healthConnectAvailable) {
            return await this.getStepsFromHealthConnect();
        }

        // Fallback to accelerometer
        return await this.getStepsFromAccelerometer();
    }

    /**
     * Get steps from Health Connect
     */
    private async getStepsFromHealthConnect(): Promise<StepData> {
        try {
            // In production with react-native-health-connect:
            // const today = new Date();
            // today.setHours(0, 0, 0, 0);
            // const result = await healthConnect.readRecords('Steps', {
            //     timeRangeFilter: {
            //         operator: 'after',
            //         startTime: today.toISOString(),
            //     },
            // });
            // const totalSteps = result.reduce((sum, record) => sum + record.count, 0);

            // Placeholder - return current tracked steps
            return {
                count: this.currentSteps,
                source: 'health_connect',
                lastUpdated: new Date(),
            };
        } catch (error) {
            console.error('Error reading from Health Connect:', error);
            return await this.getStepsFromAccelerometer();
        }
    }

    /**
     * Get steps from accelerometer-based pedometer
     */
    private async getStepsFromAccelerometer(): Promise<StepData> {
        const steps = PedometerService.getTotalDailySteps();
        return {
            count: steps,
            source: 'accelerometer',
            lastUpdated: new Date(),
        };
    }

    /**
     * Start tracking steps (unified interface)
     */
    async startTracking(): Promise<void> {
        await this.initialize();

        if (this.useHealthConnect && this.healthConnectAvailable) {
            await this.startBackgroundSync();
        }

        // Also start accelerometer for real-time feedback
        PedometerService.startTracking();

        // Listen to accelerometer step updates
        PedometerService.addListener((steps) => {
            this.currentSteps = steps;
            this.notifyListeners(steps, 'accelerometer');

            // Record activity for sedentary detection
            SedentaryService.recordActivity(steps);
        });
    }

    /**
     * Stop tracking
     */
    stopTracking(): void {
        this.stopBackgroundSync();
        PedometerService.stopTracking();
    }

    /**
     * Start background sync with Health Connect
     */
    private async startBackgroundSync(): Promise<void> {
        if (this.syncInterval) return;

        // Initial sync
        await this.syncFromHealthConnect();

        // Periodic sync
        this.syncInterval = setInterval(() => {
            this.syncFromHealthConnect();
        }, this.SYNC_INTERVAL_MS);
    }

    /**
     * Stop background sync
     */
    private stopBackgroundSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Sync step count from Health Connect
     */
    private async syncFromHealthConnect(): Promise<void> {
        if (!this.healthConnectAvailable) return;

        try {
            const stepData = await this.getStepsFromHealthConnect();

            // If Health Connect has more steps than accelerometer, use that
            const accelerometerSteps = PedometerService.getTotalDailySteps();
            const bestSteps = Math.max(stepData.count, accelerometerSteps);

            if (bestSteps > this.currentSteps) {
                this.currentSteps = bestSteps;
                await StorageService.set(STORAGE_KEYS.LAST_SYNCED_STEPS, bestSteps.toString());
                await StorageService.set(STORAGE_KEYS.LAST_SYNC_TIME, Date.now().toString());

                this.notifyListeners(bestSteps, stepData.source);
            }
        } catch (error) {
            console.error('Health Connect sync failed:', error);
        }
    }

    /**
     * Add step update listener
     */
    addListener(callback: (steps: number, source: StepSource) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners of step updates
     */
    private notifyListeners(steps: number, source: StepSource): void {
        this.listeners.forEach(listener => listener(steps, source));
    }

    /**
     * Open Health Connect settings
     */
    openHealthConnectSettings(): void {
        if (Platform.OS === 'android') {
            // Try to open Health Connect app
            Linking.openURL('healthconnect://').catch(() => {
                // Health Connect not installed, open Play Store
                Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
            });
        }
    }

    /**
     * Log manual steps (for when user inputs activity manually)
     */
    async logManualSteps(steps: number): Promise<void> {
        this.currentSteps += steps;
        await StorageService.set(STORAGE_KEYS.LAST_SYNCED_STEPS, this.currentSteps.toString());
        this.notifyListeners(this.currentSteps, 'manual');

        // Record activity for sedentary detection
        await SedentaryService.recordActivity(this.currentSteps);
    }
}

export default new HealthConnectService();
