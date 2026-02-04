import { MinnieState, DailyLog, ChatMessage } from '../types';
import StorageService from './StorageService';

// Try to load API key from local config file (gitignored)
let DEFAULT_API_KEY = '';
try {
    // This will be bundled at build time - the config.local.json must exist
    const localConfig = require('../../config.local.json');
    DEFAULT_API_KEY = localConfig.OPENAI_API_KEY || '';
} catch (e) {
    console.log('[AiService] No local config found, will rely on user-configured key');
}

export interface AiContext {
    history?: { role: string; content: string }[];
    userStats?: {
        steps: number;
        stepGoal: number;
        mood?: string;
        streak: number;
        name?: string;
    };
}

// Mock responses for fallback
const MOCK_RESPONSES = [
    { keywords: ['stress', 'anxious', 'worry'], state: 'calming' as MinnieState, text: "I hear you—stress is tough. 💙 Let's try the 4-7-8 breathing technique: breathe in for 4s, hold for 7s, exhale for 8s." },
    { keywords: ['eat', 'food', 'hungry', 'diet'], state: 'thinking' as MinnieState, text: "I'd suggest something protein-rich! How about grilled chicken or Greek yogurt? stay fueled! 🥗" },
    { keywords: ['motivation', 'tired', 'give up'], state: 'encouraging' as MinnieState, text: "You've got this! Consistency is key. Even a small step forward is progress. Keep going! 🔥" },
    { keywords: ['progress', 'stats', 'doing'], state: 'happy' as MinnieState, text: "You're making great progress! Your trends are looking positive. Keep up the good work! 📈" },
    { keywords: ['hello', 'hi', 'hey'], state: 'happy' as MinnieState, text: "Hey there! 👋 Great to see you! How can I help you today?" },
    { keywords: ['walk', 'steps', 'exercise'], state: 'energized' as MinnieState, text: "Walking is fantastic for both body and mind! Every step counts towards your goal. 🚶‍♀️" },
    { keywords: ['sleep', 'rest', 'tired'], state: 'calming' as MinnieState, text: "Rest is so important! Try to wind down an hour before bed—no screens, maybe some light stretching. 😴" },
    { keywords: ['water', 'hydration', 'drink'], state: 'thinking' as MinnieState, text: "Hydration is key! Try to drink water regularly throughout the day. Your body will thank you! 💧" },
];

class AiService {
    private apiKey: string | null = null;
    private initialized: boolean = false;
    private endpoint = 'https://api.openai.com/v1/chat/completions';

    /**
     * Initialize the service by loading the API key from storage
     * Falls back to the built-in default API key if no user key is stored
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            const storedKey = await StorageService.getApiKey();
            if (storedKey) {
                console.log('[AiService] ✅ Using stored API key');
                this.apiKey = storedKey;
            } else {
                console.log('[AiService] 🔑 Using default API key (GPT 5.2)');
                this.apiKey = DEFAULT_API_KEY;
            }
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize AI service:', error);
            // Fall back to default key even on error
            this.apiKey = DEFAULT_API_KEY;
            this.initialized = true;
        }
    }

    /**
     * Set/update the OpenAI API key
     */
    async setApiKey(key: string): Promise<void> {
        this.apiKey = key;
        await StorageService.setApiKey(key);
    }

    /**
     * Check if API key is configured
     * Always returns true after initialization since we have a default key
     */
    hasApiKey(): boolean {
        // Always have an API key available (user-configured or default)
        return !!this.apiKey || !!DEFAULT_API_KEY;
    }

    async getResponse(userMessage: string, context?: AiContext): Promise<{ message: string; state: MinnieState }> {
        console.log('[AiService] 📥 getResponse called with message:', userMessage);

        // Ensure service is initialized
        if (!this.initialized) {
            console.log('[AiService] 🔄 Not initialized, calling initialize...');
            await this.initialize();
        }

        console.log('[AiService] 🔑 Has API key:', !!this.apiKey);

        if (this.apiKey) {
            console.log('[AiService] 🌐 Calling OpenAI API...');
            return this.fetchOpenAiResponse(userMessage, context);
        }

        console.log('[AiService] ⚠️ No API key, using mock response');
        return this.getMockResponse(userMessage);
    }

    private async fetchOpenAiResponse(message: string, context?: AiContext): Promise<{ message: string; state: MinnieState }> {
        try {
            // Build system prompt with context
            let systemPrompt = `You are Minnie, a warm, empathetic AI wellness coach with a bubbly, supportive personality. 
            
Guidelines:
- NEVER repeat the same phrase twice in a conversation.
- Use varied sentence structures and creative metaphors.
- Keep responses conversational (2-3 sentences).
- Use emojis sparingly (max 1-2 per message).
- Focus on holistic wellness (physical, mental, sleep, hydration).
- If the user is stressed, be calming. If they are active, be high energy.`;

            if (context?.userStats) {
                const { steps, stepGoal, mood, streak, name } = context.userStats;
                systemPrompt += `\n\nUser Context:
- Name: ${name || 'Friend'}
- Steps Today: ${steps} / ${stepGoal}
- Current Mood: ${mood || 'Unknown'}
- Log Streak: ${streak} days`;
            }

            const messages = [
                { role: "system", content: systemPrompt },
                ...(context?.history || []),
                { role: "user", content: message }
            ];

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-5.2",
                    messages: messages,
                    max_completion_tokens: 200, // Increased for richer responses
                    temperature: 0.85 // Increased for more dynamic/creative responses
                })
            });

            if (!response.ok) {
                console.error('OpenAI API error:', response.status, response.statusText);
                return this.getMockResponse(message);
            }

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                const text = data.choices[0].message.content;
                // Determine Minnie's state based on response content
                const state = this.determineState(text, message);
                return { message: text, state };
            }
        } catch (error) {
            console.error('AI Error:', error);
        }
        return this.getMockResponse(message); // Fallback
    }

    /**
     * Determine Minnie's emotional state based on message content
     */
    private determineState(response: string, userMessage: string): MinnieState {
        const lowerResponse = response.toLowerCase();
        const lowerMessage = userMessage.toLowerCase();

        // Check for calming context
        if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') ||
            lowerResponse.includes('breathe') || lowerResponse.includes('relax') || lowerResponse.includes('calm')) {
            return 'calming';
        }

        // Check for energetic/encouraging context
        if (lowerResponse.includes('!') && (lowerResponse.includes('great') ||
            lowerResponse.includes('amazing') || lowerResponse.includes('awesome') || lowerResponse.includes('go for it'))) {
            return 'encouraging';
        }

        // Check for celebratory context
        if (lowerResponse.includes('congratulations') || lowerResponse.includes('🎉') ||
            lowerResponse.includes('achieved') || lowerResponse.includes('proud')) {
            return 'celebratory';
        }

        // Check for thinking context
        if (lowerMessage.includes('what') || lowerMessage.includes('how') ||
            lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
            return 'thinking';
        }

        // Check for energized/active
        if (lowerMessage.includes('run') || lowerMessage.includes('workout') || lowerMessage.includes('gym')) {
            return 'energized';
        }

        // Default to happy
        return 'happy';
    }

    private getMockResponse(message: string): { message: string; state: MinnieState } {
        const lower = message.toLowerCase();
        const match = MOCK_RESPONSES.find(r => r.keywords.some(k => lower.includes(k)));

        if (match) {
            return { message: match.text, state: match.state };
        }

        return {
            message: "I'm here for you! Whether you need help with meals, motivation, or just want to chat—I've got your back. 😊",
            state: 'happy',
        };
    }
}

export const aiService = new AiService();
