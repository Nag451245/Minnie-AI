/**
 * API Key Modal - Configure OpenAI API key for AI Coach
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { aiService } from '../services/AiService';

interface ApiKeyModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

export default function ApiKeyModal({ visible, onClose, onSaved }: ApiKeyModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Check if key is already configured
    useEffect(() => {
        if (visible && aiService.hasApiKey()) {
            setApiKey('sk-...configured');
        }
    }, [visible]);

    const handleSave = async () => {
        if (!apiKey.trim() || apiKey === 'sk-...configured') {
            setErrorMessage('Please enter a valid API key');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            setErrorMessage('API key should start with "sk-"');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            await aiService.setApiKey(apiKey.trim());
            onSaved?.();
            onClose();
        } catch (error) {
            setErrorMessage('Failed to save API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTest = async () => {
        if (!apiKey.trim() || apiKey === 'sk-...configured') {
            setErrorMessage('Please enter a valid API key to test');
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        setErrorMessage('');

        try {
            // Temporarily set the key
            await aiService.setApiKey(apiKey.trim());

            // Test with a simple request
            const response = await aiService.getResponse('Hello');

            if (response.message) {
                setTestResult('success');
            } else {
                setTestResult('error');
                setErrorMessage('Unexpected response from API');
            }
        } catch (error: any) {
            setTestResult('error');
            setErrorMessage(error.message || 'Connection failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleGetKey = () => {
        Linking.openURL('https://platform.openai.com/api-keys');
    };

    const handleClose = () => {
        setApiKey('');
        setTestResult(null);
        setErrorMessage('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modal}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>🤖 Configure AI Coach</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            Enter your OpenAI API key to enable personalized AI coaching.
                            Your key is stored securely on your device.
                        </Text>

                        {/* API Key Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>API Key</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="sk-..."
                                placeholderTextColor={Colors.textTertiary}
                                value={apiKey}
                                onChangeText={(text) => {
                                    setApiKey(text);
                                    setTestResult(null);
                                    setErrorMessage('');
                                }}
                                secureTextEntry={true}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Error Message */}
                        {errorMessage ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                            </View>
                        ) : null}

                        {/* Test Result */}
                        {testResult === 'success' && (
                            <View style={styles.successContainer}>
                                <Text style={styles.successText}>✅ Connection successful!</Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.testButton}
                                onPress={handleTest}
                                disabled={isTesting || isLoading}
                            >
                                {isTesting ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <Text style={styles.testButtonText}>Test Connection</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={Colors.textLight} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Get API Key Link */}
                        <TouchableOpacity style={styles.linkContainer} onPress={handleGetKey}>
                            <Text style={styles.linkText}>
                                Don't have an API key? Get one from OpenAI →
                            </Text>
                        </TouchableOpacity>

                        {/* Info */}
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoText}>
                                💡 Without an API key, Minnie will use preset responses.
                                With a key, you get personalized AI coaching powered by GPT.
                            </Text>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 20,
        ...Shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    closeText: {
        fontSize: Typography.fontSize.lg,
        color: Colors.textSecondary,
    },
    description: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    inputContainer: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.md,
    },
    errorText: {
        color: Colors.error,
        fontSize: Typography.fontSize.sm,
    },
    successContainer: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.md,
    },
    successText: {
        color: Colors.success,
        fontSize: Typography.fontSize.sm,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    testButton: {
        flex: 1,
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    testButtonText: {
        color: Colors.primary,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    saveButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    linkContainer: {
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    linkText: {
        color: Colors.primary,
        fontSize: Typography.fontSize.sm,
        textDecorationLine: 'underline',
    },
    infoContainer: {
        backgroundColor: Colors.backgroundSecondary,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    infoText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
});
