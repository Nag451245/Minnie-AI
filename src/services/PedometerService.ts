import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';
import StorageService from './StorageService';

// Improved step detection parameters
const STEP_THRESHOLD = 1.15; // Slightly lower threshold for better sensitivity
const STEP_UPPER_THRESHOLD = 2.5; // Upper bound to filter out sharp movements
const DELAY_BETWEEN_STEPS = 250; // ms - minimum time between steps

class PedometerService {
    private subscription: any = null;
    private lastStepTime: number = 0;
    private lastMagnitude: number = 1;
    private isRising: boolean = false;
    private listeners: ((steps: number) => void)[] = [];
    private stepsFromSession: number = 0;
    private totalDailySteps: number = 0;
    private initialized: boolean = false;
    private currentDate: string = '';

    constructor() {
        setUpdateIntervalForType(SensorTypes.accelerometer, 50); // 50ms for better resolution
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
            this.currentDate = today;
        }
    }

    startTracking(): void {
        if (this.subscription) return;

        this.stepsFromSession = 0;
        this.lastStepTime = Date.now();
        this.lastMagnitude = 1;
        this.isRising = false;
        this.checkDateChange();

        this.subscription = accelerometer
            .pipe(
                map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z))
            )
            .subscribe({
                next: (magnitude) => {
                    this.processAcceleration(magnitude);
                },
                error: (error) => {
                    console.log('The accelerometer sensor is not available:', error);
                }
            });
    }

    /**
     * Improved step detection using peak detection algorithm
     */
    private processAcceleration(magnitude: number): void {
        const now = Date.now();

        // Detect peaks using rising/falling pattern
        if (magnitude > this.lastMagnitude) {
            this.isRising = true;
        } else if (this.isRising && magnitude < this.lastMagnitude) {
            // We just passed a peak
            this.isRising = false;

            // Check if peak is within valid step range
            if (this.lastMagnitude > STEP_THRESHOLD &&
                this.lastMagnitude < STEP_UPPER_THRESHOLD &&
                (now - this.lastStepTime) > DELAY_BETWEEN_STEPS) {

                this.lastStepTime = now;
                this.stepsFromSession++;
                this.totalDailySteps++;
                this.notifyListeners();
            }
        }

        this.lastMagnitude = magnitude;
    }

    stopTracking(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
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
            this.checkDateChange();
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
    }

    /**
     * Reset session steps (but keep daily total)
     */
    resetSession(): void {
        this.stepsFromSession = 0;
    }

    addListener(callback: (steps: number) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l(this.stepsFromSession));
    }
}

export default new PedometerService();
