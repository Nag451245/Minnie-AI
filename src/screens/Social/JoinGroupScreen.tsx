import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import GroupService from '../../services/GroupService';
import { useApp } from '../../context/AppContext';

export default function JoinGroupScreen() {
    const navigation = useNavigation();
    const { state } = useApp();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            Alert.alert('Error', 'Please enter a valid invite code');
            return;
        }

        setLoading(true);
        try {
            // Mock join for now as there is no backend for codes yet
            // In real app: await GroupService.joinByCode(inviteCode, state.user);
            Alert.alert('Success', 'Joined group successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to join group. Check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Join a Group</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButton}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Enter Invite Code</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., TEAM123"
                    placeholderTextColor={Colors.textTertiary}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                />

                <TouchableOpacity
                    style={[styles.joinButton, loading && styles.disabledButton]}
                    onPress={handleJoin}
                    disabled={loading}
                >
                    <Text style={styles.joinButtonText}>{loading ? 'Joining...' : 'Join Group'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginTop: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    closeButton: {
        fontSize: Typography.fontSize.md,
        color: Colors.primary,
        fontWeight: Typography.fontWeight.medium,
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        fontSize: Typography.fontSize.lg,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
    },
    joinButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    joinButtonText: {
        color: '#FFF',
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
});
