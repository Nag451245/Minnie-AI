/**
 * Pedometer Service - Unified step tracking using native hardware sensor
 * 
 * Uses Android's TYPE_STEP_COUNTER hardware sensor via native module,
 * with fallback to accelerometer-based detection if unavailable.
 */
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid, Alert } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map } from 'rxjs/operators';
import StorageService from './StorageService';

// Native module bridge
const { StepCounterModule } = NativeModules;

// Create event emitter for native step events
const stepCounterEmitter = StepCounterModule
    ? new NativeEventEmitter(StepCounterModule)
    : null;

// Accelerometer step detection parameters (fallback)
const STEP_THRESHOLD = 1.15;
const STEP_UPPER_THRESHOLD = 2.5;
const DELAY_BETWEEN_STEPS = 250;

class PedometerService {
    // State
    private listeners: ((steps: number) => void)[] = [];
    private stepsFromSession: number = 0;
    private totalDailySteps: number = 0;
    private lastRawSteps: number = 0; // Track raw sensor value for reboot detection
    private initialized: boolean = false;
    private currentDate: string = '';
    private permissionGranted: boolean = false;
    private isTracking: boolean = false;

    // Native vs fallback tracking
    private useNativeSensor: boolean = false;
    private nativeSubscription: any = null;

    // Fallback (accelerometer) tracking
    private accelerometerSubscription: any = null;
    private lastStepTime: number = 0;
    private lastMagnitude: number = 1;
    private isRising: boolean = false;

    constructor() {
        setUpdateIntervalForType(SensorTypes.accelerometer, 50);
        this.initializeSteps();
    }

    /**
     * Load today's step count from storage
     */
    private async initializeSteps(): Promise<void> {
        if (this.initialized) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            this.currentDate = today;
            this.totalDailySteps = await StorageService.getDailySteps(today);
            this.lastRawSteps = await StorageService.getLastRawSteps();

            // Check if native sensor is available
            if (Platform.OS === 'android' && StepCounterModule) {
                try {
                    const availability = await StepCounterModule.isStepCounterAvailable();
                    this.useNativeSensor = availability.available;
                    console.log('Native step counter available:', this.useNativeSensor);
                } catch (e) {
                    console.log('Native step counter check failed:', e);
                    this.useNativeSensor = false;
                }
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize steps:', error);
            this.totalDailySteps = 0;
            this.initialized = true;
        }
    }

    /**
     * Check if we've crossed midnight and reset if needed
     */
    private checkDateChange(): void {
        const today = new Date().toISOString().split('T')[0];
        if (this.currentDate && this.currentDate !== today) {
            // New day - reset daily steps
            this.totalDailySteps = 0;
            this.stepsFromSession = 0;
            this.currentDate = today;

            // Reset native sensor baseline if using it
            if (this.useNativeSensor && StepCounterModule) {
                StepCounterModule.resetSteps().catch(() => { });
            }
        }
    }

    /**
     * Request ACTIVITY_RECOGNITION permission for Android 10+
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') {
            this.permissionGranted = true;
            return true;
        }

        // Android 10 (API 29) and above require runtime permission
        if (Platform.Version >= 29) {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
                    {
                        title: 'Step Tracking Permission',
                        message: 'Minnie needs permission to track your steps and activity throughout the day. This helps provide accurate health insights and daily challenges.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    this.permissionGranted = true;
                    return true;
                }

                if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                    Alert.alert(
                        'Permission Required',
                        'Step tracking requires activity recognition permission. Please enable it in Settings → Apps → Minnie AI → Permissions.',
                        [{ text: 'OK' }]
                    );
                }

                this.permissionGranted = false;
                return false;
            } catch (err) {
                console.error('Permission request error:', err);
                this.permissionGranted = false;
                return false;
            }
        }

        // Below Android 10, permission is granted automatically
        this.permissionGranted = true;
        return true;
    }

    /**
     * Check if permission has been granted
     */
    hasPermission(): boolean {
        return this.permissionGranted;
    }

    /**
     * Start step tracking (uses native sensor if available)
     */
    async startTracking(): Promise<void> {
        if (this.isTracking) return;

        // Ensure initialized
        await this.initializeSteps();
        this.checkDateChange();

        if (this.useNativeSensor && StepCounterModule) {
            await this.startNativeTracking();
        } else {
            this.startAccelerometerTracking();
        }

        this.isTracking = true;
    }

    /**
     * Start tracking using native hardware step counter
     */
    /**
     * Start tracking using native hardware step counter
     */
    private async startNativeTracking(): Promise<void> {
        try {
            // Subscribe to native step events
            if (stepCounterEmitter) {
                this.nativeSubscription = stepCounterEmitter.addListener(
                    'StepCounterUpdate',
                    (event: any) => {
                        // Handle both old (number) and new (object) event formats
                        const stepsFromStart = typeof event === 'number' ? event : event.steps;
                        const rawSteps = typeof event === 'object' ? event.rawSteps : -1;

                        if (rawSteps > 0) {
                            // Robust tracking using raw steps (reboot proof)
                            if (this.lastRawSteps === 0) {
                                // First initialization
                                this.lastRawSteps = rawSteps;
                            }

                            let delta = rawSteps - this.lastRawSteps;

                            // Reboot detection: If current raw < last raw, device rebooted
                            if (delta < 0) {
                                console.log('Device reboot detected (step counter reset)');
                                delta = rawSteps; // Add all new steps
                            }

                            if (delta > 0) {
                                this.totalDailySteps += delta;
                                this.lastRawSteps = rawSteps;
                                this.saveTodaySteps();
                                StorageService.setLastRawSteps(rawSteps);
                            }
                        } else {
                            // Fallback for simple session steps or older module version
                            // This is less accurate across reboots but functional
                            this.stepsFromSession = stepsFromStart;
                            // Approximate daily steps if we don't have raw delta
                            // Note: This matches old logic, but rawSteps path is preferred
                            this.totalDailySteps = this.stepsFromSession;
                        }

                        this.notifyListeners();
                    }
                );
            }

            // Start native tracking
            await StepCounterModule.startTracking();
            console.log('Native step tracking started');
        } catch (error) {
            console.error('Native tracking failed, falling back to accelerometer:', error);
            this.useNativeSensor = false;
            this.startAccelerometerTracking();
        }
    }

    /**
     * Start tracking using accelerometer (fallback)
     */
    private startAccelerometerTracking(): void {
        this.stepsFromSession = 0;
        this.lastStepTime = Date.now();
        this.lastMagnitude = 1;
        this.isRising = false;

        this.accelerometerSubscription = accelerometer
            .pipe(
                map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z))
            )
            .subscribe({
                next: (magnitude) => {
                    this.processAcceleration(magnitude);
                },
                error: (error) => {
                    console.log('Accelerometer not available:', error);
                }
            });

        console.log('Accelerometer step tracking started (fallback)');
    }

    /**
     * Process accelerometer data to detect steps
     */
    private processAcceleration(magnitude: number): void {
        const now = Date.now();

        // Detect rising edge (step starts)
        if (magnitude > this.lastMagnitude) {
            this.isRising = true;
        }

        // Detect peak (step detected)
        if (this.isRising && magnitude < this.lastMagnitude) {
            if (
                this.lastMagnitude > STEP_THRESHOLD &&
                this.lastMagnitude < STEP_UPPER_THRESHOLD &&
                now - this.lastStepTime > DELAY_BETWEEN_STEPS
            ) {
                this.stepsFromSession++;
                this.totalDailySteps++;
                this.lastStepTime = now;
                this.notifyListeners();

                // Save every 10 steps
                if (this.stepsFromSession % 10 === 0) {
                    this.saveTodaySteps();
                }
            }
            this.isRising = false;
        }

        this.lastMagnitude = magnitude;
    }

    /**
     * Stop step tracking
     */
    async stopTracking(): Promise<void> {
        if (this.nativeSubscription) {
            this.nativeSubscription.remove();
            this.nativeSubscription = null;

            if (StepCounterModule) {
                await StepCounterModule.stopTracking().catch(() => { });
            }
        }

        if (this.accelerometerSubscription) {
            this.accelerometerSubscription.unsubscribe();
            this.accelerometerSubscription = null;
        }

        this.isTracking = false;
        await this.saveTodaySteps();
    }

    /**
     * Get steps from current session only
     */
    getCurrentSteps(): number {
        return this.stepsFromSession;
    }

    /**
     * Get total steps for today (including previous sessions)
     */
    getTotalDailySteps(): number {
        return this.totalDailySteps;
    }

    /**
     * Save current step count to persistent storage
     */
    async saveTodaySteps(): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            await StorageService.setDailySteps(today, this.totalDailySteps);
        } catch (error) {
            console.error('Failed to save steps:', error);
        }
    }

    /**
     * Manually add steps (for testing or sync purposes)
     */
    addSteps(count: number): void {
        this.stepsFromSession += count;
        this.totalDailySteps += count;
        this.notifyListeners();
        this.saveTodaySteps();
    }

    /**
     * Reset session steps (but keep daily total)
     */
    resetSession(): void {
        this.stepsFromSession = 0;
        this.lastStepTime = Date.now();
    }

    /**
     * Add step count listener
     */
    addListener(callback: (steps: number) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners of step updates
     */
    private notifyListeners(): void {
        this.listeners.forEach(l => l(this.totalDailySteps));
    }

    /**
     * Check if native step counter is available
     */
    isNativeSensorAvailable(): boolean {
        return this.useNativeSensor;
    }

    /**
     * Check if currently tracking
     */
    isCurrentlyTracking(): boolean {
        return this.isTracking;
    }
}

export default new PedometerService();
