/**
 * Challenge Service - Manages daily AI-generated challenges
 * 
 * Features:
 * - Generates personalized daily challenges using OpenAI
 * - Falls back to preset challenges when no API key
 * - Tracks challenge progress and completion
 * - Stores challenge history
 */
import { aiService } from './AiService';
import StorageService from './StorageService';
import NotificationService from './NotificationService';

// Challenge types
export type ChallengeCategory = 'steps' | 'activity' | 'hydration' | 'mindfulness' | 'general';
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'skipped';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    category: ChallengeCategory;
    targetValue: number;
    currentValue: number;
    unit: string;
    emoji: string;
    status: ChallengeStatus;
    createdAt: string;
    completedAt?: string;
    rewardText?: string;
}

// Storage keys
const STORAGE_KEYS = {
    ACTIVE_CHALLENGE: '@minnie_active_challenge',
    CHALLENGE_HISTORY: '@minnie_challenge_history',
    LAST_CHALLENGE_DATE: '@minnie_last_challenge_date',
};

// Preset challenges for when OpenAI is not available
const PRESET_CHALLENGES: Omit<Challenge, 'id' | 'createdAt' | 'currentValue' | 'status'>[] = [
    // Steps challenges
    {
        title: "Step Master",
        description: "Walk 8,000 steps today to boost your energy!",
        category: 'steps',
        targetValue: 8000,
        unit: 'steps',
        emoji: '🚶',
        rewardText: "Great endurance! You're building a walking habit.",
    },
    {
        title: "Morning Mover",
        description: "Get 3,000 steps before noon today!",
        category: 'steps',
        targetValue: 3000,
        unit: 'steps',
        emoji: '🌅',
        rewardText: "Morning warrior! Starting the day strong!",
    },
    {
        title: "10K Champion",
        description: "Challenge yourself with 10,000 steps today!",
        category: 'steps',
        targetValue: 10000,
        unit: 'steps',
        emoji: '🏆',
        rewardText: "Incredible! You've joined the 10K club!",
    },
    // Activity challenges
    {
        title: "Break Timer",
        description: "Take 3 walking breaks of at least 5 minutes each",
        category: 'activity',
        targetValue: 3,
        unit: 'breaks',
        emoji: '⏱️',
        rewardText: "Perfect pacing! Movement breaks are so good for you.",
    },
    {
        title: "Active Hour",
        description: "Log at least 30 active minutes today",
        category: 'activity',
        targetValue: 30,
        unit: 'minutes',
        emoji: '💪',
        rewardText: "Fitness focus on point! Keep it up!",
    },
    // Hydration challenges
    {
        title: "Hydration Hero",
        description: "Drink 8 glasses of water throughout the day",
        category: 'hydration',
        targetValue: 8,
        unit: 'glasses',
        emoji: '💧',
        rewardText: "Your body thanks you for staying hydrated!",
    },
    {
        title: "Water Warrior",
        description: "Drink a glass of water before each meal",
        category: 'hydration',
        targetValue: 3,
        unit: 'glasses',
        emoji: '🥤',
        rewardText: "Smart hydration strategy!",
    },
    // Mindfulness challenges
    {
        title: "Mindful Moment",
        description: "Practice 5 minutes of deep breathing today",
        category: 'mindfulness',
        targetValue: 5,
        unit: 'minutes',
        emoji: '🧘',
        rewardText: "Inner peace unlocked! You're calmer already.",
    },
    {
        title: "Gratitude Pause",
        description: "Take 3 moments today to appreciate something",
        category: 'mindfulness',
        targetValue: 3,
        unit: 'moments',
        emoji: '🙏',
        rewardText: "Gratitude changes everything!",
    },
    // General wellness
    {
        title: "Posture Check",
        description: "Check and correct your posture 5 times today",
        category: 'general',
        targetValue: 5,
        unit: 'checks',
        emoji: '🧍',
        rewardText: "Your spine is smiling at you!",
    },
];

class ChallengeService {
    private activeChallenge: Challenge | null = null;
    private initialized: boolean = false;

    /**
     * Initialize the challenge service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Load active challenge
            const savedChallenge = await StorageService.get(STORAGE_KEYS.ACTIVE_CHALLENGE);
            if (savedChallenge) {
                this.activeChallenge = JSON.parse(savedChallenge);
            }

            // Check if we need a new challenge for today
            await this.checkAndRefreshChallenge();

            this.initialized = true;
            console.log('ChallengeService initialized');
        } catch (error) {
            console.error('Failed to initialize ChallengeService:', error);
            this.initialized = true;
        }
    }

    /**
     * Check if we need a new challenge and generate one if needed
     */
    private async checkAndRefreshChallenge(): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const lastChallengeDate = await StorageService.get(STORAGE_KEYS.LAST_CHALLENGE_DATE);

        if (lastChallengeDate !== today) {
            // New day - mark old challenge as completed/failed and generate new
            if (this.activeChallenge && this.activeChallenge.status === 'active') {
                if (this.activeChallenge.currentValue >= this.activeChallenge.targetValue) {
                    this.activeChallenge.status = 'completed';
                } else {
                    this.activeChallenge.status = 'failed';
                }
                await this.saveToHistory(this.activeChallenge);
            }

            // Generate new challenge for today
            await this.generateNewChallenge();
            await StorageService.set(STORAGE_KEYS.LAST_CHALLENGE_DATE, today);
        }
    }

    /**
     * Generate a new daily challenge
     */
    async generateNewChallenge(): Promise<Challenge> {
        let challenge: Challenge;

        try {
            // Try to use AI to generate a personalized challenge
            if (aiService.hasApiKey()) {
                const aiChallenge = await this.generateAIChallenge();
                if (aiChallenge) {
                    challenge = aiChallenge;
                } else {
                    challenge = this.getRandomPresetChallenge();
                }
            } else {
                challenge = this.getRandomPresetChallenge();
            }
        } catch (error) {
            console.error('Error generating AI challenge:', error);
            challenge = this.getRandomPresetChallenge();
        }

        this.activeChallenge = challenge;
        await this.saveActiveChallenge();

        return challenge;
    }

    /**
     * Generate a challenge using OpenAI
     */
    private async generateAIChallenge(): Promise<Challenge | null> {
        try {
            // Get user context for personalization
            const userProfile = await StorageService.getUserProfile();
            const stepGoal = userProfile?.stepGoal || 7500;
            const todaySteps = await StorageService.getDailySteps(new Date().toISOString().split('T')[0]);

            const prompt = `Generate a personalized wellness challenge for a user with a ${stepGoal} daily step goal who has walked ${todaySteps} steps so far today. 
            
Return ONLY a JSON object (no markdown, no explanation) with these fields:
- title: catchy 2-3 word title
- description: encouraging challenge description (1 sentence)
- category: one of "steps", "activity", "hydration", "mindfulness"
- targetValue: numeric goal
- unit: what's being counted
- emoji: single relevant emoji
- rewardText: motivational completion message`;

            const response = await aiService.getResponse(prompt);

            // Try to parse the AI response as JSON
            const jsonMatch = response.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                return {
                    id: this.generateId(),
                    title: parsed.title || 'Daily Challenge',
                    description: parsed.description || 'Complete today\'s wellness goal!',
                    category: parsed.category || 'general',
                    targetValue: parsed.targetValue || 1000,
                    currentValue: 0,
                    unit: parsed.unit || 'units',
                    emoji: parsed.emoji || '⭐',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    rewardText: parsed.rewardText || 'Great job completing the challenge!',
                };
            }
        } catch (error) {
            console.error('Failed to generate AI challenge:', error);
        }

        return null;
    }

    /**
     * Get a random preset challenge
     */
    private getRandomPresetChallenge(): Challenge {
        const randomIndex = Math.floor(Math.random() * PRESET_CHALLENGES.length);
        const preset = PRESET_CHALLENGES[randomIndex];

        return {
            ...preset,
            id: this.generateId(),
            currentValue: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * Get the current active challenge
     */
    async getActiveChallenge(): Promise<Challenge | null> {
        await this.initialize();
        return this.activeChallenge;
    }

    /**
     * Update challenge progress
     */
    async updateProgress(value: number): Promise<void> {
        if (!this.activeChallenge || this.activeChallenge.status !== 'active') return;

        this.activeChallenge.currentValue = value;

        // Check if challenge is completed
        if (this.activeChallenge.currentValue >= this.activeChallenge.targetValue) {
            await this.completeChallenge();
        } else {
            await this.saveActiveChallenge();
        }
    }

    /**
     * Increment challenge progress by a value
     */
    async incrementProgress(delta: number): Promise<void> {
        if (!this.activeChallenge || this.activeChallenge.status !== 'active') return;

        await this.updateProgress(this.activeChallenge.currentValue + delta);
    }

    /**
     * Mark challenge as completed
     */
    private async completeChallenge(): Promise<void> {
        if (!this.activeChallenge) return;

        this.activeChallenge.status = 'completed';
        this.activeChallenge.completedAt = new Date().toISOString();

        await this.saveActiveChallenge();
        await this.saveToHistory(this.activeChallenge);

        // Show achievement notification
        await NotificationService.showAchievement('challenge');
    }

    /**
     * Skip the current challenge
     */
    async skipChallenge(): Promise<void> {
        if (!this.activeChallenge) return;

        this.activeChallenge.status = 'skipped';
        await this.saveToHistory(this.activeChallenge);

        // Generate a new challenge
        await this.generateNewChallenge();
    }

    /**
     * Get challenge completion percentage
     */
    getCompletionPercentage(): number {
        if (!this.activeChallenge) return 0;
        return Math.min(100, Math.round((this.activeChallenge.currentValue / this.activeChallenge.targetValue) * 100));
    }

    /**
     * Get challenge history
     */
    async getChallengeHistory(): Promise<Challenge[]> {
        try {
            const history = await StorageService.get(STORAGE_KEYS.CHALLENGE_HISTORY);
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }

    /**
     * Get stats about completed challenges
     */
    async getStats(): Promise<{ completed: number; total: number; streak: number }> {
        const history = await this.getChallengeHistory();
        const completed = history.filter(c => c.status === 'completed').length;

        // Calculate current completion streak
        let streak = 0;
        const sortedHistory = [...history].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        for (const challenge of sortedHistory) {
            if (challenge.status === 'completed') {
                streak++;
            } else {
                break;
            }
        }

        return {
            completed,
            total: history.length,
            streak,
        };
    }

    // Private helper methods
    private generateId(): string {
        return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async saveActiveChallenge(): Promise<void> {
        if (this.activeChallenge) {
            await StorageService.set(STORAGE_KEYS.ACTIVE_CHALLENGE, JSON.stringify(this.activeChallenge));
        }
    }

    private async saveToHistory(challenge: Challenge): Promise<void> {
        const history = await this.getChallengeHistory();
        history.push(challenge);

        // Keep only last 30 challenges
        const recentHistory = history.slice(-30);
        await StorageService.set(STORAGE_KEYS.CHALLENGE_HISTORY, JSON.stringify(recentHistory));
    }
}

export default new ChallengeService();
