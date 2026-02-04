import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, Typography, Spacing } from '../../constants/theme';
import GroupService from '../../services/GroupService';
import { RootStackParamList } from '../../types';
import { useApp } from '../../context/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateGroupScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { state } = useApp();
    const [name, setName] = useState('');
    const [challengeTitle, setChallengeTitle] = useState('');
    const [target, setTarget] = useState('10000');
    const [duration, setDuration] = useState('7');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        if (!state.user) {
            Alert.alert('Error', 'User profile not found');
            return;
        }

        setCreating(true);
        try {
            const newGroup = await GroupService.createGroup(name, state.user);

            // Start default challenge
            if (challengeTitle.trim()) {
                await GroupService.startChallenge(newGroup.id, {
                    title: challengeTitle,
                    description: 'Keep it up!',
                    type: 'steps',
                    targetValue: parseInt(target) || 10000,
                    durationDays: parseInt(duration) || 7
                });
            }

            setCreating(false);
            // Navigate back (or to detail)
            navigation.goBack();
        } catch (error) {
            setCreating(false);
            Alert.alert('Error', 'Failed to create group');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Icon name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Group</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Morning Walkers"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.sectionHeader}>First Challenge</Text>

                <Text style={styles.label}>Challenge Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 7-Day Streak"
                    value={challengeTitle}
                    onChangeText={setChallengeTitle}
                    placeholderTextColor={Colors.textTertiary}
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Goal (Steps)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10000"
                            value={target}
                            onChangeText={setTarget}
                            keyboardType="numeric"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Duration (Days)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="7"
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.createButton, creating && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={creating}
                >
                    <Text style={styles.createButtonText}>
                        {creating ? 'Creating...' : 'Create Group'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.surface,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.textPrimary,
    },
    form: {
        padding: Spacing.lg,
    },
    label: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: Spacing.lg,
        fontFamily: Typography.fontFamily.regular,
        fontSize: 16,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionHeader: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    createButton: {
        backgroundColor: Colors.primary,
        borderRadius: 32,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: Spacing.lg,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 16,
        color: '#FFF',
    },
});

export default CreateGroupScreen;
