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
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import StorageService from '../../services/StorageService';

import { useApp } from '../../context/AppContext';
import MinnieAvatar from '../../components/Minnie/MinnieAvatar';
import { ChatMessage, MinnieState } from '../../types';
import { VoiceManager } from '../../services/VoiceManager';
import { aiService } from '../../services/AiService';
import { Platform, PermissionsAndroid } from 'react-native';
import ApiKeyModal from '../../components/ApiKeyModal';

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
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const typingDots = useRef(new Animated.Value(0)).current;
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);

    useEffect(() => {
        // Load settings
        const loadSettings = async () => {
            const enabled = await StorageService.isTtsEnabled();
            setTtsEnabled(enabled);
        };
        loadSettings();

        // Check API key on mount
        const checkApiKey = async () => {
            console.log('[CoachScreen] 🔍 Checking for API key...');
            await aiService.initialize();
            // ... (rest of checkApiKey)
            const hasKey = aiService.hasApiKey();
            setHasApiKey(hasKey);
            if (!hasKey) {
                setTimeout(() => setShowApiKeyModal(true), 800);
            }
        };
        checkApiKey();
    }, []);

    const toggleTts = async () => {
        const newState = !ttsEnabled;
        setTtsEnabled(newState);
        await StorageService.setTtsEnabled(newState);
        if (!newState) {
            VoiceManager.stopSpeaking();
        }
    };

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

    const getMinnieResponse = async (userMessage: string, history?: { role: string; content: string }[]): Promise<{ message: string; state: MinnieState }> => {
        if (!hasApiKey) {
            return {
                message: "I need a little help to think clearly! Please configure my AI brain in the settings. 🧠✨",
                state: 'concerned',
            };
        }

        try {
            // Prepare context
            const context = {
                history,
                userStats: {
                    steps: state.todayLog?.steps || 0,
                    stepGoal: state.todayLog?.stepGoal || 7000,
                    mood: state.todayLog?.mood,
                    streak: state.currentStreak,
                    name: state.user?.name
                }
            };

            return await aiService.getResponse(userMessage, context);
        } catch (error) {
            console.error(error);
            return {
                message: "I'm having a little trouble thinking right now, but I'm still here for you! 😊",
                state: 'worried' as MinnieState,
            };
        }
    };

    const handleSend = async () => {
        // ... (existing validation logs)
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

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        const recentHistory = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.message
        }));

        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await getMinnieResponse(inputText, recentHistory);

        const minnieMessage: DisplayMessage = {
            id: Date.now() + 1,
            timestamp: Date.now(),
            sender: 'minnie',
            message: response.message,
            minnieAvatarState: response.state,
        };

        setMessages(prev => [...prev, minnieMessage]);
        setIsLoading(false);

        // Speak response if enabled
        if (ttsEnabled) {
            VoiceManager.speak(response.message);
        }

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleQuickResponse = async (text: string) => {
        // ... (validation)
        if (!hasApiKey) { setShowApiKeyModal(true); return; }
        if (isLoading) return;

        const userMessage: DisplayMessage = {
            id: Date.now(),
            timestamp: Date.now(),
            sender: 'user',
            message: text,
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        await new Promise(resolve => setTimeout(resolve, 1500));

        const recentHistory = messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.message
        }));

        const response = await getMinnieResponse(text, recentHistory);

        const minnieMessage: DisplayMessage = {
            id: Date.now() + 1,
            timestamp: Date.now(),
            sender: 'minnie',
            message: response.message,
            minnieAvatarState: response.state,
        };

        setMessages(prev => [...prev, minnieMessage]);
        setIsLoading(false);

        // Speak response if enabled
        if (ttsEnabled) {
            VoiceManager.speak(response.message);
        }

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const formatTime = (timestamp: number): string => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header with Minnie */}
                <View style={styles.header}>
                    <MinnieAvatar state={state.minnieState} size="medium" animated />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Chat with Minnie</Text>
                        <Text style={styles.headerSubtitle}>Your wellness companion</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                        style={styles.ttsButton}
                        onPress={toggleTts}
                    >
                        <Text style={styles.ttsIcon}>{ttsEnabled ? '🔊' : '🔇'}</Text>
                    </TouchableOpacity>
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

                {/* Bottom Section - Wrapped for tab bar spacing */}
                <View style={styles.bottomSection}>
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
                    <View style={[styles.inputContainer, !hasApiKey && styles.inputContainerDisabled]}>
                        <TouchableOpacity
                            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                            onPress={toggleListening}
                            disabled={!hasApiKey}
                        >
                            <Text style={styles.voiceButtonText}>{isListening ? '🛑' : '🎙️'}</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder={hasApiKey ? "Ask Minnie anything..." : "Configure AI key to chat"}
                            placeholderTextColor={Colors.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            editable={hasApiKey && !isLoading}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || isLoading || !hasApiKey) && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isLoading || !hasApiKey}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={Colors.textLight} />
                            ) : (
                                <Text style={styles.sendButtonText}>➤</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Setup Prompt */}
                    {!hasApiKey && (
                        <TouchableOpacity
                            style={styles.setupBanner}
                            onPress={() => setShowApiKeyModal(true)}
                        >
                            <Text style={styles.setupIcon}>🔑</Text>
                            <Text style={styles.setupText}>Tap to configure OpenAI API Key</Text>
                            <Text style={styles.setupArrow}>→</Text>
                        </TouchableOpacity>
                    )}
                </View>


                <ApiKeyModal
                    visible={showApiKeyModal}
                    onClose={() => setShowApiKeyModal(false)}
                    onSaved={() => {
                        setHasApiKey(true);
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            timestamp: Date.now(),
                            sender: 'minnie',
                            message: "Yay! My brain is connected! I'm ready to help you on your journey! 🚀",
                            minnieAvatarState: 'happy'
                        }]);
                    }}
                />
            </KeyboardAvoidingView>
        </SafeAreaView >
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
    bottomSection: {
        paddingBottom: Platform.OS === 'ios' ? 90 : 80, // Account for tab bar height
        backgroundColor: Colors.background,
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
        paddingBottom: Spacing.lg, // Extra padding to ensure visibility above tab bar
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
    inputContainerDisabled: {
        opacity: 0.7,
        backgroundColor: Colors.backgroundSecondary,
    },
    setupBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        margin: Spacing.base,
        marginTop: 0,
    },
    setupIcon: {
        fontSize: Typography.fontSize.lg,
        marginRight: Spacing.md,
        color: Colors.textPrimary,
    },
    setupText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.primaryDark,
    },
    setupArrow: {
        fontSize: Typography.fontSize.lg,
        color: Colors.primaryDark,
        fontWeight: Typography.fontWeight.bold,
    },
    ttsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: Colors.surfaceSecondary,
        marginLeft: Spacing.sm,
    },
    ttsIcon: {
        fontSize: 20,
    },
});
