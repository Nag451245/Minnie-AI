/**
 * Minnie Avatar Component
 * The friendly AI wellness companion with multiple states
 */
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { MinnieState } from '../../types';
import { Colors, BorderRadius, Shadows, Typography } from '../../constants/theme';

interface MinnieAvatarProps {
    state: MinnieState;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    showMessage?: boolean;
    message?: string;
    animated?: boolean;
}

// Get avatar colors and emoji based on state
const getAvatarConfig = (state: MinnieState) => {
    const configs: Record<MinnieState, { emoji: string; bgColor: string; message: string }> = {
        happy: {
            emoji: '😊',
            bgColor: Colors.primary,
            message: "I'm here when you need me",
        },
        celebratory: {
            emoji: '🎉',
            bgColor: Colors.streakGold,
            message: "You're crushing it today!",
        },
        concerned: {
            emoji: '🤔',
            bgColor: '#87CEEB',
            message: "Let's figure out what happened",
        },
        calming: {
            emoji: '😌',
            bgColor: '#9BB7D4',
            message: 'Breathe with me...',
        },
        encouraging: {
            emoji: '💪',
            bgColor: Colors.secondary,
            message: "Ready for today's mission?",
        },
        energized: {
            emoji: '⚡',
            bgColor: Colors.activity,
            message: 'Yes! Keep moving!',
        },
        sedentaryWarning: {
            emoji: '🚶',
            bgColor: Colors.warning,
            message: 'Time to move, friend!',
        },
        thinking: {
            emoji: '💭',
            bgColor: Colors.info,
            message: 'Let me think about that...',
        },
        listening: {
            emoji: '👂',
            bgColor: Colors.primary,
            message: "I'm listening...",
        },
        speaking: {
            emoji: '🗣️',
            bgColor: Colors.secondary,
            message: 'Speaking...',
        },
    };
    return configs[state];
};

// Size configurations
const getSizeConfig = (size: MinnieAvatarProps['size']) => {
    const configs = {
        small: { container: 40, emoji: 20, messageWidth: 120 },
        medium: { container: 60, emoji: 28, messageWidth: 160 },
        large: { container: 80, emoji: 36, messageWidth: 200 },
        xlarge: { container: 120, emoji: 56, messageWidth: 260 },
    };
    return configs[size || 'medium'];
};

export default function MinnieAvatar({
    state,
    size = 'medium',
    showMessage = false,
    message,
    animated = true,
}: MinnieAvatarProps) {
    const config = getAvatarConfig(state);
    const sizeConfig = getSizeConfig(size);

    // Animation values
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!animated) return;

        // Different animations for different states
        switch (state) {
            case 'celebratory':
                // Bounce animation
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, {
                            toValue: -10,
                            duration: 300,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                        Animated.timing(bounceAnim, {
                            toValue: 0,
                            duration: 300,
                            easing: Easing.in(Easing.quad),
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
                break;

            case 'calming':
                // Slow pulse for breathing
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.1,
                            duration: 2000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 2000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
                break;

            case 'energized':
                // Quick pulse
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.05,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
                break;

            case 'thinking':
                // Gentle sway
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(rotateAnim, {
                            toValue: 0.05,
                            duration: 1000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(rotateAnim, {
                            toValue: -0.05,
                            duration: 1000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
                break;

            default:
                // Gentle sway for happy/default
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(bounceAnim, {
                            toValue: -3,
                            duration: 1500,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(bounceAnim, {
                            toValue: 3,
                            duration: 1500,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
        }

        return () => {
            bounceAnim.stopAnimation();
            pulseAnim.stopAnimation();
            rotateAnim.stopAnimation();
        };
    }, [state, animated, bounceAnim, pulseAnim, rotateAnim]);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [-0.1, 0.1],
        outputRange: ['-5deg', '5deg'],
    });

    const displayMessage = message || config.message;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.avatarContainer,
                    {
                        width: sizeConfig.container,
                        height: sizeConfig.container,
                        borderRadius: sizeConfig.container / 2,
                        backgroundColor: config.bgColor,
                        transform: [
                            { translateY: bounceAnim },
                            { scale: pulseAnim },
                            { rotate: rotateInterpolate },
                        ],
                    },
                    Shadows.md,
                ]}
            >
                <Text style={[styles.emoji, { fontSize: sizeConfig.emoji }]}>
                    {config.emoji}
                </Text>
            </Animated.View>

            {showMessage && (
                <View style={[styles.messageBubble, { maxWidth: sizeConfig.messageWidth }]}>
                    <Text style={styles.messageText}>{displayMessage}</Text>
                    <View style={[styles.bubbleArrow, { borderBottomColor: Colors.background }]} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.background,
    },
    emoji: {
        textAlign: 'center',
    },
    messageBubble: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 8,
        ...Shadows.sm,
    },
    messageText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textPrimary,
        textAlign: 'center',
        fontWeight: Typography.fontWeight.medium,
    },
    bubbleArrow: {
        position: 'absolute',
        top: -8,
        alignSelf: 'center',
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
});
