import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, Typography, Spacing } from '../../constants/theme';
import GroupService from '../../services/GroupService';
import { ChallengeGroup, GroupMember, RootStackParamList } from '../../types';
import { useApp } from '../../context/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<NavigationProp>();
    const { groupId } = route.params;
    const { state } = useApp();
    const [group, setGroup] = useState<ChallengeGroup | null>(null);

    useEffect(() => {
        loadGroup();
    }, [groupId]);

    const loadGroup = async () => {
        const groups = await GroupService.getUserGroups();
        const found = groups.find(g => g.id === groupId);
        if (found) setGroup(found);
    };

    const handleInvite = async () => {
        if (!group) return;
        try {
            await Share.share({
                message: `Join my group "${group.name}" on Minnie AI! Use code: ${group.inviteCode}`,
                url: `minnie://join/${group.inviteCode}`, // Deep link concept
            });
        } catch (error) {
            console.error(error);
        }
    };

    const renderMember = ({ item, index }: { item: GroupMember; index: number }) => {
        const isMe = item.userId === 'user_me'; // Simplified ID check
        const progress = item.stats?.challengeProgress || 0;
        const target = group?.activeChallenge?.targetValue || 10000;
        const percentage = Math.min(progress / target, 1);

        return (
            <View style={styles.memberRow}>
                <Text style={styles.rank}>{index + 1}</Text>
                <View style={styles.avatar}>
                    <Icon name="account" size={24} color="#FFF" />
                </View>
                <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.memberName, isMe && styles.meText]}>
                            {item.name} {isMe ? '(You)' : ''}
                        </Text>
                        <Text style={styles.progressText}>{progress} / {target}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${percentage * 100}%` }]} />
                    </View>
                </View>
            </View>
        );
    };

    if (!group) return (
        <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
        </View>
    );

    // Sort members by progress desc
    const sortedMembers = [...group.members].sort((a, b) =>
        (b.stats?.challengeProgress || 0) - (a.stats?.challengeProgress || 0)
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{group.name}</Text>
                <TouchableOpacity onPress={handleInvite} style={styles.inviteButton}>
                    <Icon name="share-variant" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.challengeCard}>
                <View style={styles.challengeIconBg}>
                    <Icon name="shoe-print" size={32} color={Colors.primary} />
                </View>
                <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>
                        {group.activeChallenge?.title || 'No Active Challenge'}
                    </Text>
                    <Text style={styles.challengeMeta}>
                        Goal: {group.activeChallenge?.targetValue} {group.activeChallenge?.type} •
                        Ends in {Math.ceil((new Date(group.activeChallenge?.endDate || '').getTime() - Date.now()) / 86400000)}d
                    </Text>
                </View>
            </View>

            <View style={styles.leaderboardContainer}>
                <Text style={styles.sectionTitle}>Leaderboard</Text>
                <FlatList
                    data={sortedMembers}
                    renderItem={renderMember}
                    keyExtractor={item => item.userId}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60, // Safe area
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.textPrimary,
    },
    inviteButton: {
        padding: 8,
    },
    challengeCard: {
        margin: Spacing.lg,
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    challengeIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    challengeInfo: {
        flex: 1,
    },
    challengeTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    challengeMeta: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    leaderboardContainer: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.lg,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    sectionTitle: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    listContent: {
        paddingBottom: 40,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    rank: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 16,
        color: Colors.textSecondary,
        width: 24,
        textAlign: 'center',
        marginRight: Spacing.xs,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    memberInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    memberName: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    meText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    progressText: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: Colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
});

export default GroupDetailScreen;
