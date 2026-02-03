/**
 * Coach Screen - Chat with Minnie
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { ChatMessage, MinnieState } from '../../types';
import { VoiceManager } from '../../services/VoiceManager';
import { aiService } from '../../services/AiService';
import { Platform, PermissionsAndroid } from 'react-native';

interface DisplayMessage extends ChatMessage {
    isTyping?: boolean;
}

export default function CoachScreen() {
    const { state } = useApp();
    const scrollViewRef = useRef<ScrollView>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<DisplayMessage[]>([
        {
            id: 1,
            timestamp: Date.now() - 60000,
            sender: 'minnie',
            message: `Hey ${state.user?.name || 'there'}! 👋 How are you feeling today? I'm here to help with anything—from meal suggestions to motivation boosts!`,
            minnieAvatarState: 'happy',
        },
    ]);

    const [isListening, setIsListening] = useState(false);
    const typingDots = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Setup Voice Callbacks
        VoiceManager.setCallbacks(
            // onStart
            () => {
                setIsListening(true);
            },
            // onEnd
            () => {
                setIsListening(false);
            },
            // onResults
            (text) => {
                setInputText(text);
                // Auto-send after a short delay if needed, or let user confirm
                setIsListening(false);
            },
            // onError
            (err) => {
                console.log('Voice Error:', err);
                setIsListening(false);
            }
        );

        return () => {
            VoiceManager.destroy();
            VoiceManager.stopSpeaking();
        };
    }, []);

    const toggleListening = async () => {
        if (isListening) {
            await VoiceManager.stopListening();
        } else {
            // Request permissions on Android if needed
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'Minnie needs access to your microphone to hear you.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    await VoiceManager.startListening();
                }
            } else {
                await VoiceManager.startListening();
            }
        }
    };

    useEffect(() => {
        if (isLoading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(typingDots, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(typingDots, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            typingDots.stopAnimation();
        }
    }, [isLoading, typingDots]);

    const quickResponses = [
        { text: "I'm feeling stressed", emoji: "😰" },
        { text: "What should I eat?", emoji: "🍽️" },
        { text: "I need motivation", emoji: "💪" },
        { text: "How am I doing?", emoji: "📊" },
    ];

    const getMinnieResponse = async (userMessage: string): Promise<{ message: string; state: MinnieState }> => {
        try {
            return await aiService.getResponse(userMessage);
        } catch (error) {
            console.error(error);
            return {
                message: "I'm having a little trouble thinking right now, but I'm still here for you! 😊",
                state: 'worried' as MinnieState, // 'worried' might not be in types, falling back to 'concerned' if needed. 
                // Wait, types has 'concerned'.
            };
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: DisplayMessage = {
            id: Date.now(),
            timestamp: Date.now(),
            sender: 'user',
            message: inputText.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // Scroll to bottom
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await getMinnieResponse(inputText);

        const minnieMessage: DisplayMessage = {
            id: Date.now() + 1,
            timestamp: Date.now(),
            sender: 'minnie',
            message: response.message,
            minnieAvatarState: response.state,
        };

        setMessages(prev => [...prev, minnieMessage]);
        setIsLoading(false);

        // Speak response if it was a voice interaction or just always for accessibility?
        // Let's speak it if the user used voice recently, or we can add a toggle. 
        // For now, let's speak it.
        VoiceManager.speak(response.message);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleQuickResponse = (text: string) => {
        setInputText(text);
    };

    const formatTime = (timestamp: number): string => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header with Minnie */}
                <View style={styles.header}>
                    <MinnieAvatar state={state.minnieState} size="medium" animated />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Chat with Minnie</Text>
                        <Text style={styles.headerSubtitle}>Your wellness companion</Text>
                    </View>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageBubble,
                                msg.sender === 'user' ? styles.userBubble : styles.minnieBubble,
                            ]}
                        >
                            {msg.sender === 'minnie' && (
                                <View style={styles.minnieAvatarSmall}>
                                    <MinnieAvatar
                                        state={isListening && msg.id === Date.now() ? 'listening' : (msg.minnieAvatarState || 'happy')}
                                        size="small"
                                        animated={false}
                                    />
                                </View>
                            )}
                            <View
                                style={[
                                    styles.messageContent,
                                    msg.sender === 'user' ? styles.userContent : styles.minnieContent,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        msg.sender === 'user' && styles.userText,
                                    ]}
                                >
                                    {msg.message}
                                </Text>
                                <Text style={styles.messageTime}>{formatTime(msg.timestamp)}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                        <View style={[styles.messageBubble, styles.minnieBubble]}>
                            <View style={styles.minnieAvatarSmall}>
                                <MinnieAvatar state="thinking" size="small" animated />
                            </View>
                            <View style={[styles.messageContent, styles.minnieContent]}>
                                <Text style={styles.typingText}>Minnie is typing...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Responses */}
                <View style={styles.quickResponses}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {quickResponses.map((resp, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickResponseButton}
                                onPress={() => handleQuickResponse(resp.text)}
                            >
                                <Text style={styles.quickResponseEmoji}>{resp.emoji}</Text>
                                <Text style={styles.quickResponseText}>{resp.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                        onPress={toggleListening}
                    >
                        <Text style={styles.voiceButtonText}>{isListening ? '🛑' : '🎙️'}</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask Minnie anything..."
                        placeholderTextColor={Colors.textTertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Text style={styles.sendButtonText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundSecondary,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerText: {
        marginLeft: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: Spacing.base,
        paddingBottom: Spacing.xl,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    minnieBubble: {
        alignSelf: 'flex-start',
    },
    minnieAvatarSmall: {
        marginRight: Spacing.sm,
        alignSelf: 'flex-end',
    },
    messageContent: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        maxWidth: '100%',
    },
    userContent: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    minnieContent: {
        backgroundColor: Colors.background,
        borderBottomLeftRadius: 4,
        ...Shadows.sm,
    },
    messageText: {
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        lineHeight: 22,
    },
    userText: {
        color: Colors.textLight,
    },
    messageTime: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
        alignSelf: 'flex-end',
    },
    typingText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
    quickResponses: {
        backgroundColor: Colors.background,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    quickResponseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    quickResponseEmoji: {
        fontSize: 14,
        marginRight: Spacing.xs,
    },
    quickResponseText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: Colors.background,
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
        ...Shadows.sm,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.border,
    },
    sendButtonText: {
        fontSize: 20,
        color: Colors.textLight,
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    voiceButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    voiceButtonText: {
        fontSize: 20,
    },
});
