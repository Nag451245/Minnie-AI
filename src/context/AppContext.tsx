/**
 * App Context - Global State Management
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserProfile, DailyLog, MoodType, MinnieState } from '../types';
import StorageService from '../services/StorageService';
import PedometerService from '../services/PedometerService';
import HistoryService from '../services/HistoryService';


// State interface
interface AppState {
    user: UserProfile | null;
    todayLog: DailyLog | null;
    currentStreak: number;
    minnieState: MinnieState;
    isLoading: boolean;
    onboardingComplete: boolean;
}

// Action types
type AppAction =
    | { type: 'SET_USER'; payload: UserProfile }
    | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
    | { type: 'SET_TODAY_LOG'; payload: DailyLog }
    | { type: 'UPDATE_TODAY_LOG'; payload: Partial<DailyLog> }
    | { type: 'SET_STREAK'; payload: number }
    | { type: 'SET_MINNIE_STATE'; payload: MinnieState }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
    | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
    user: null,
    todayLog: null,
    currentStreak: 0,
    minnieState: 'happy',
    isLoading: true,
    onboardingComplete: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'UPDATE_USER':
            return {
                ...state,
                user: state.user ? { ...state.user, ...action.payload } : null,
            };
        case 'SET_TODAY_LOG':
            return { ...state, todayLog: action.payload };
        case 'UPDATE_TODAY_LOG':
            return {
                ...state,
                todayLog: state.todayLog ? { ...state.todayLog, ...action.payload } : null,
            };
        case 'SET_STREAK':
            return { ...state, currentStreak: action.payload };
        case 'SET_MINNIE_STATE':
            return { ...state, minnieState: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ONBOARDING_COMPLETE':
            return { ...state, onboardingComplete: action.payload };
        case 'RESET_STATE':
            return initialState;
        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    // Helper functions
    updateMood: (mood: MoodType) => void;
    updateSteps: (steps: number) => void;
    updateWater: (amount: number) => void;
    updateSleep: (hours: number, quality?: string) => void;
    logWeight: (weight: number) => void;
    completeOnboarding: (user: UserProfile) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);



    // Load initial data on mount
    useEffect(() => {
        loadInitialData();

        // Subscribe to real-time step updates
        const unsubscribe = PedometerService.addStepListener((steps) => {
            dispatch({
                type: 'UPDATE_TODAY_LOG',
                payload: { steps: steps }
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);


    const loadInitialData = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const user = await StorageService.getUserProfile();
            const onboardingComplete = await StorageService.isOnboardingComplete();

            // ===== STEP COUNTER INITIALIZATION =====
            console.log('[AppContext] Initializing step counter...');

            // 1. Request permission explicitly
            const hasPermission = await PedometerService.requestPermission();
            console.log('[AppContext] Step counter permission granted:', hasPermission);

            if (hasPermission) {
                // 2. Initialize step counter
                await PedometerService.initializeSteps();
                console.log('[AppContext] Step counter initialized');

                // 3. Start tracking
                PedometerService.startTracking();
                console.log('[AppContext] Step tracking started');
            } else {
                console.warn('[AppContext] Step tracking NOT started - permission denied');
            }

            // ... rest of loadInitialData ...
            const streak = await StorageService.getStreak();

            if (user) {
                dispatch({ type: 'SET_USER', payload: user });
            }


            dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: onboardingComplete });
            dispatch({ type: 'SET_STREAK', payload: streak });

            // Load today's steps from storage
            const today = new Date().toISOString().split('T')[0];
            const todaySteps = await StorageService.getDailySteps(today);
            const stepGoal = user?.stepGoal || 7500;

            // ALWAYS initialize todayLog - this is critical for water tracking to work
            dispatch({
                type: 'SET_TODAY_LOG',
                payload: {
                    date: today,
                    steps: todaySteps,
                    stepGoal: stepGoal,
                    challengeCompleted: todaySteps >= stepGoal,
                    waterIntake: 0,
                    mood: undefined,
                    weight: user?.currentWeight,
                    sleepQuality: undefined,
                    sleepHours: undefined,
                }
            });

            dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
            console.error('Error loading initial data:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };



    // ... (existing helper function implementation to persist data)

    // Helper: Update mood
    const updateMood = (mood: MoodType) => {
        const today = new Date().toISOString().split('T')[0];
        const updatedLog: DailyLog = {
            ...(state.todayLog || {
                date: today,
                steps: 0,
                stepGoal: state.user?.stepGoal || 7000,
                waterIntake: 0,
                challengeCompleted: false,
                weight: state.user?.currentWeight
            }),
            mood,
            date: today // Ensure date is set
        };

        dispatch({ type: 'UPDATE_TODAY_LOG', payload: { mood } });

        // Update Minnie's state based on mood
        const moodToMinnieState: Record<MoodType, MinnieState> = {
            happy: 'happy',
            sad: 'concerned',
            stressed: 'calming',
            energetic: 'energized',
            bored: 'encouraging',
        };
        dispatch({ type: 'SET_MINNIE_STATE', payload: moodToMinnieState[mood] });

        // Persist
        HistoryService.saveDailyLog(updatedLog);
    };

    // Helper: Update steps
    const updateSteps = (steps: number) => {
        dispatch({ type: 'UPDATE_TODAY_LOG', payload: { steps } });

        const stepGoal = state.user?.stepGoal || 7500;
        if (steps >= stepGoal) {
            dispatch({ type: 'SET_MINNIE_STATE', payload: 'celebratory' });
        } else if (steps >= stepGoal * 0.8) {
            dispatch({ type: 'SET_MINNIE_STATE', payload: 'encouraging' });
        }

        // We typically don't save explicit log entries for every step update to avoid thrashing,
        // but since we are moving to HistoryService, we might want to save periodically.
        // For now, assume a background job or end-of-day sync might act, 
        // OR we can save here if IO is cheap. Let's rely on PedometerService for step persistence for now?
        // Actually, PedometerService saves to StorageService.dailySteps.
        // We should probably sync it to HistoryService eventually.
    };

    // Helper: Update water - now handles null todayLog properly
    const updateWater = (amount: number) => {
        const today = new Date().toISOString().split('T')[0];
        let updatedLog: DailyLog;

        if (!state.todayLog) {
            // Create new log if it doesn't exist
            const stepGoal = state.user?.stepGoal || 7500;
            updatedLog = {
                date: today,
                steps: 0,
                stepGoal: stepGoal,
                challengeCompleted: false,
                waterIntake: amount,
                weight: state.user?.currentWeight,
            };
            dispatch({ type: 'SET_TODAY_LOG', payload: updatedLog });
        } else {
            const currentWater = state.todayLog.waterIntake || 0;
            const newWater = currentWater + amount;
            dispatch({ type: 'UPDATE_TODAY_LOG', payload: { waterIntake: newWater } });

            updatedLog = {
                ...state.todayLog,
                waterIntake: newWater
            };
        }

        HistoryService.saveDailyLog(updatedLog);
    };

    // Helper: Log weight
    const logWeight = (weight: number) => {
        dispatch({ type: 'UPDATE_TODAY_LOG', payload: { weight } });
        dispatch({ type: 'UPDATE_USER', payload: { currentWeight: weight } });

        if (state.todayLog) {
            HistoryService.saveDailyLog({
                ...state.todayLog,
                weight
            });
        }
    };

    // Helper: Update sleep
    const updateSleep = (hours: number, quality?: string) => {
        const sleepQualityTyped = quality as 'good' | 'groggy' | 'terrible' | undefined;
        dispatch({ type: 'UPDATE_TODAY_LOG', payload: { sleepHours: hours, sleepQuality: sleepQualityTyped } });

        // Persist
        const today = new Date().toISOString().split('T')[0];
        const updatedLog: DailyLog = {
            ...(state.todayLog || {
                date: today,
                steps: 0,
                stepGoal: state.user?.stepGoal || 7000,
                waterIntake: 0,
                challengeCompleted: false,
                weight: state.user?.currentWeight
            }),
            sleepHours: hours,
            sleepQuality: sleepQualityTyped,
            date: today
        };

        HistoryService.saveDailyLog(updatedLog);
    };

    // Helper: Complete onboarding
    const completeOnboarding = async (user: UserProfile) => {
        await StorageService.saveUserProfile(user);
        await StorageService.setOnboardingComplete(true);
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    };

    const value: AppContextType = {
        state,
        dispatch,
        updateMood,
        updateSteps,
        updateWater,
        updateSleep,
        logWeight,
        completeOnboarding,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook
export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
