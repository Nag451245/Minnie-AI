import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChallengeGroup, GroupMember, SocialChallenge, UserProfile } from '../types';

const GROUPS_STORAGE_KEY = '@minnie_social_groups';

class GroupService {
    /**
     * Get all groups the user is a member of
     */
    async getUserGroups(): Promise<ChallengeGroup[]> {
        try {
            const data = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error fetching groups:', error);
            return [];
        }
    }

    /**
     * Create a new group
     */
    async createGroup(name: string, adminUser: UserProfile): Promise<ChallengeGroup> {
        const groups = await this.getUserGroups();

        const newGroup: ChallengeGroup = {
            id: Date.now().toString(), // Simple ID generation
            name,
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdAt: new Date().toISOString(),
            createdBy: 'user_me', // Placeholder for current user ID
            members: [{
                userId: 'user_me',
                name: adminUser.name,
                avatarStyle: 'classic', // TODO: Get from preferences
                joinedAt: new Date().toISOString(),
                isAdmin: true,
                stats: {
                    stepsToday: 0,
                    streak: 0,
                    challengeProgress: 0,
                }
            }],
            activeChallenge: null,
            pastChallenges: []
        };

        groups.push(newGroup);
        await this.saveGroups(groups);
        return newGroup;
    }

    /**
     * Join a group using an invite code
     * NOTE: In a real app, this would fetch from a server. 
     * Here we just mock-join or find locally if it exists? 
     * For MVP/Mock, we might simulate finding a "public" group 
     * or just re-joining one of our own for demo.
     */
    async joinGroup(inviteCode: string, user: UserProfile): Promise<ChallengeGroup | null> {
        const groups = await this.getUserGroups();
        // For local demo, we can only join groups we already "know" or 
        // we can simulate joining a "demo" group if code matches 'DEMO123'

        if (inviteCode === 'DEMO123') {
            // Simulate joining a fake global group
            const demoGroup: ChallengeGroup = {
                id: 'demo_group',
                name: 'Minnie Global Walkers',
                inviteCode: 'DEMO123',
                createdAt: new Date().toISOString(),
                createdBy: 'system',
                members: [
                    { userId: 'user_1', name: 'Minnie Fan', isAdmin: true, joinedAt: '', avatarStyle: 'classic', stats: { stepsToday: 8500, streak: 12, challengeProgress: 8500 } },
                    { userId: 'user_2', name: 'Walker Joe', isAdmin: false, joinedAt: '', avatarStyle: 'classic', stats: { stepsToday: 6200, streak: 5, challengeProgress: 6200 } },
                    { userId: 'user_me', name: user.name, isAdmin: false, joinedAt: new Date().toISOString(), avatarStyle: 'classic', stats: { stepsToday: 0, streak: 0, challengeProgress: 0 } }
                ],
                activeChallenge: {
                    id: 'c1',
                    title: 'Weekend Warrior',
                    description: 'Hit 20k steps this weekend!',
                    type: 'steps',
                    targetValue: 20000,
                    durationDays: 2,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
                    status: 'active',
                    participants: {}
                },
                pastChallenges: []
            };

            // Avoid dupe
            const exists = groups.find(g => g.id === 'demo_group');
            if (!exists) {
                groups.push(demoGroup);
                await this.saveGroups(groups);
                return demoGroup;
            }
            return exists;
        }

        const group = groups.find(g => g.inviteCode === inviteCode);
        if (group) {
            // Check if already member
            if (!group.members.find(m => m.userId === 'user_me')) {
                group.members.push({
                    userId: 'user_me',
                    name: user.name,
                    avatarStyle: 'classic',
                    joinedAt: new Date().toISOString(),
                    isAdmin: false,
                    stats: { stepsToday: 0, streak: 0, challengeProgress: 0 }
                });
                await this.saveGroups(groups);
            }
            return group;
        }

        return null;
    }

    /**
     * Start a new challenge in a group
     */
    async startChallenge(groupId: string, challengeData: Partial<SocialChallenge>): Promise<void> {
        const groups = await this.getUserGroups();
        const index = groups.findIndex(g => g.id === groupId);

        if (index >= 0) {
            const newChallenge: SocialChallenge = {
                id: Date.now().toString(),
                title: challengeData.title || 'Group Challenge',
                description: challengeData.description || 'Let\'s move!',
                type: challengeData.type || 'steps',
                targetValue: challengeData.targetValue || 10000,
                durationDays: challengeData.durationDays || 7,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + (challengeData.durationDays || 7) * 86400000).toISOString(),
                status: 'active',
                participants: {}
            };

            groups[index].activeChallenge = newChallenge;
            await this.saveGroups(groups);
        }
    }

    /**
     * Update current user's stats in all groups
     * This mimics "syncing" data to the group
     */
    async updateMyStats(stepsToday: number, streak: number): Promise<void> {
        const groups = await this.getUserGroups();
        let changed = false;

        groups.forEach(group => {
            const member = group.members.find(m => m.userId === 'user_me');
            if (member) {
                member.stats = {
                    stepsToday,
                    streak,
                    challengeProgress: group.activeChallenge?.type === 'steps' ? stepsToday : 0 // Simplified
                };
                member.lastActiveAt = new Date().toISOString();
                changed = true;
            }
        });

        if (changed) {
            await this.saveGroups(groups);
        }
    }

    private async saveGroups(groups: ChallengeGroup[]): Promise<void> {
        try {
            await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
        } catch (error) {
            console.error('Error saving groups:', error);
        }
    }
}

export default new GroupService();
