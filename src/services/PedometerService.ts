import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';

// Sensitivity threshold for step detection (approx 1.2G)
const THRESHOLD = 1.2;
const DELAY_BETWEEN_STEPS = 300; // ms

class PedometerService {
    private subscription: any = null;
    private lastStepTime: number = 0;
    private listeners: ((steps: number) => void)[] = [];
    private stepsFromSession: number = 0;

    constructor() {
        setUpdateIntervalForType(SensorTypes.accelerometer, 100); // 100ms updates
    }

    startTracking() {
        if (this.subscription) return;

        this.stepsFromSession = 0;
        this.lastStepTime = Date.now();

        this.subscription = accelerometer
            .pipe(
                map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z)),
                filter(magnitude => magnitude > THRESHOLD)
            )
            .subscribe({
                next: () => {
                    const now = Date.now();
                    if (now - this.lastStepTime > DELAY_BETWEEN_STEPS) {
                        this.lastStepTime = now;
                        this.stepsFromSession++;
                        this.notifyListeners();
                    }
                },
                error: (error) => {
                    console.log('The sensor is not available', error);
                }
            });
    }

    stopTracking() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    getCurrentSteps() {
        return this.stepsFromSession;
    }

    addListener(callback: (steps: number) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.stepsFromSession));
    }
}

export default new PedometerService();
