/**
 * Walk Tracker Screen - Timed walking session
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { MinnieState } from '../../types';
import PedometerService from '../../services/PedometerService';

export default function WalkTrackerScreen() {
    const navigation = useNavigation();
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [steps, setSteps] = useState(0);
    const [minnieState, setMinnieState] = useState<MinnieState>('encouraging');
    const [minnieMessage, setMinnieMessage] = useState("Let's get moving! 🚶");

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        let unsubscribe: (() => void) | null = null;

        if (isActive && !isPaused) {
            PedometerService.startTracking();

            // Subscribe to step updates
            unsubscribe = PedometerService.addListener((currentSteps) => {
                setSteps(currentSteps);
            });

            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else {
            if (interval) clearInterval(interval);
            PedometerService.stopTracking(); // Or keep tracking? Usually stop for "session".
        }

        return () => {
            if (interval) clearInterval(interval);
            if (unsubscribe) unsubscribe();
            // We don't stop PedometerService here immediately to avoid losing state on re-render, 
            // but we should if component unmounts? 
            // Better to rely on "isActive" state management.
        };
    }, [isActive, isPaused]);

    useEffect(() => {
        return () => {
            PedometerService.stopTracking();
        };
    }, []);

    // Update Minnie's encouragement based on progress
    useEffect(() => {
        const minutes = Math.floor(seconds / 60);

        if (minutes === 1) {
            setMinnieState('energized');
            setMinnieMessage("1 minute in! You're doing great! 💪");
        } else if (minutes === 3) {
            setMinnieMessage("3 minutes! Keep that pace! 🔥");
        } else if (minutes === 5) {
            setMinnieState('celebratory');
            setMinnieMessage("5 minutes done! Awesome work! 🎉");
        } else if (minutes === 10) {
            setMinnieMessage("10 minutes! You're a walking champion! 🏆");
        }
    }, [seconds]);

    // Pulse animation when active
    useEffect(() => {
        if (isActive && !isPaused) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isActive, isPaused, pulseAnim]);

    const formatTime = (totalSeconds: number): string => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateDistance = (): string => {
        return (steps * 0.000762).toFixed(2);
    };

    const calculateCalories = (): number => {
        // Rough estimate: ~0.04 calories per step
        return Math.round(steps * 0.04);
    };

    const handleStart = () => {
        setIsActive(true);
        setIsPaused(false);
        Vibration.vibrate(100);
        setMinnieState('energized');
        setMinnieMessage("Let's go! Every step counts! 👟");
    };

    const handlePause = () => {
        setIsPaused(true);
        setMinnieState('thinking');
        setMinnieMessage("Taking a breather? That's okay! 😊");
    };

    const handleResume = () => {
        setIsPaused(false);
        setMinnieState('energized');
        setMinnieMessage("Back at it! Great energy! 💪");
    };

    const handleEnd = async () => {
        setIsActive(false);
        setIsPaused(false);
        Vibration.vibrate([100, 100, 100]);
        setMinnieState('celebratory');
        setMinnieMessage(`Amazing! ${steps} steps in ${formatTime(seconds)}! 🎉`);

        // Save steps to persistent storage
        try {
            await PedometerService.saveTodaySteps();
        } catch (error) {
            console.error('Failed to save steps:', error);
        }

        setTimeout(() => {
            navigation.goBack();
        }, 2000);
    };

    const handleClose = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🚶 Walking with Minnie</Text>
            </View>

            {/* Minnie Section */}
            <View style={styles.minnieSection}>
                <MinnieAvatar state={minnieState} size="xlarge" animated />
                <Text style={styles.minnieMessage}>{minnieMessage}</Text>
            </View>

            {/* Timer */}
            <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.timerLabel}>Duration</Text>
                <Text style={styles.timer}>{formatTime(seconds)}</Text>
            </Animated.View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👟</Text>
                    <Text style={styles.statValue}>{steps.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>steps</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📏</Text>
                    <Text style={styles.statValue}>{calculateDistance()}</Text>
                    <Text style={styles.statLabel}>km</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🔥</Text>
                    <Text style={styles.statValue}>{calculateCalories()}</Text>
                    <Text style={styles.statLabel}>cal</Text>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                {!isActive ? (
                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Text style={styles.startButtonText}>▶ Start Walk</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.activeControls}>
                        {isPaused ? (
                            <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                                <Text style={styles.controlButtonText}>▶ Resume</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                                <Text style={styles.controlButtonText}>⏸ Pause</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
                            <Text style={styles.endButtonText}>⏹ End Walk</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
                <Text style={styles.tipText}>
                    💡 Tip: Walk at a brisk pace for maximum calorie burn!
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.moodActive,
    },
    closeButton: {
        position: 'absolute',
        top: Spacing['3xl'],
        right: Spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        ...Shadows.sm,
    },
    closeButtonText: {
        fontSize: 20,
        color: Colors.textSecondary,
    },
    header: {
        alignItems: 'center',
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    minnieSection: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    minnieMessage: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    timerContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    timerLabel: {
        fontSize: Typography.fontSize.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    timer: {
        fontSize: 72,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.activity,
        fontVariant: ['tabular-nums'],
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    statCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        alignItems: 'center',
        minWidth: 90,
        ...Shadows.sm,
    },
    statIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    statValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textTertiary,
    },
    controlsContainer: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
    },
    startButton: {
        backgroundColor: Colors.activity,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius['2xl'],
        alignItems: 'center',
        ...Shadows.lg,
    },
    startButtonText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    activeControls: {
        gap: Spacing.md,
    },
    pauseButton: {
        backgroundColor: Colors.warning,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    resumeButton: {
        backgroundColor: Colors.activity,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    controlButtonText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    endButton: {
        backgroundColor: Colors.error,
        paddingVertical: Spacing.base,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    endButtonText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textLight,
    },
    tipsContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    tipText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        backgroundColor: Colors.background,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
});
