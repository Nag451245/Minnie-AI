import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '../../constants/theme';
import GroupService from '../../services/GroupService';
import { ChallengeGroup, RootStackParamList } from '../../types';
import { useApp } from '../../context/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SocialScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { state } = useApp();
    const [groups, setGroups] = useState<ChallengeGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGroups = async () => {
        setLoading(true);
        const userGroups = await GroupService.getUserGroups();
        setGroups(userGroups);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [])
    );

    const handleCreateGroup = () => {
        navigation.navigate('CreateGroup');
    };

    const handleJoinGroup = () => {
        navigation.navigate('JoinGroup');
    };

    const renderGroupItem = ({ item }: { item: ChallengeGroup }) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
        >
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <View style={styles.memberBadge}>
                        <Text style={{ fontSize: 16 }}>👥</Text>
                        <Text style={styles.memberCount}>{item.members.length}</Text>
                    </View>
                </View>

                {item.activeChallenge ? (
                    <View style={styles.challengePreview}>
                        <Text style={styles.challengeTitle}>🔥 {item.activeChallenge.title}</Text>
                        <Text style={styles.challengeStatus}>
                            Ends in {Math.ceil((new Date(item.activeChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noChallengeText}>No active challenge</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.title}>Community</Text>
                <Text style={styles.subtitle}>Challenge friends & stay motivated!</Text>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={groups}
                renderItem={renderGroupItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 64, opacity: 0.5 }}>🏆</Text>
                        <Text style={styles.emptyTitle}>No Groups Yet</Text>
                        <Text style={styles.emptyText}>Join a group or create one to start challenging your friends!</Text>
                        <TouchableOpacity style={styles.joinDemoButton} onPress={handleJoinGroup}>
                            <Text style={styles.joinDemoText}>Join Global Challenge (Demo)</Text>
                        </TouchableOpacity>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadGroups} tintColor={Colors.primary} />}
            />

            <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
                <Text style={{ fontSize: 24, color: '#FFF' }}>➕</Text>
                <Text style={styles.fabText}>New Group</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingTop: Spacing.md,
    },
    title: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 32,
        color: Colors.textPrimary,
    },
    subtitle: {
        fontFamily: Typography.fontFamily.regular,
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 200, // Explicitly large padding for FAB
    },
    groupCard: {
        marginBottom: Spacing.md,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardContent: {
        padding: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    groupName: {
        fontFamily: Typography.fontFamily.bold,
        fontWeight: '600',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    memberCount: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    challengePreview: {
        marginTop: 8,
        padding: 12,
        backgroundColor: 'rgba(78, 205, 196, 0.1)', // Primary tint
        borderRadius: 12,
    },
    challengeTitle: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 15,
        color: Colors.primaryDark,
        fontWeight: '500',
    },
    challengeStatus: {
        fontFamily: Typography.fontFamily.regular,
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    noChallengeText: {
        fontFamily: Typography.fontFamily.regular,
        fontSize: 14,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        padding: Spacing.lg,
    },
    emptyTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 20,
        color: Colors.textPrimary,
        marginTop: Spacing.md,
    },
    emptyText: {
        fontFamily: Typography.fontFamily.regular,
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    joinDemoButton: {
        marginTop: Spacing.lg,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: Colors.secondary,
        borderRadius: 24,
    },
    joinDemoText: {
        fontFamily: Typography.fontFamily.medium,
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 110 : 90, // Clear TabBar
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 32,
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabText: {
        fontFamily: Typography.fontFamily.bold,
        fontWeight: '700',
        color: '#FFF',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default SocialScreen;
