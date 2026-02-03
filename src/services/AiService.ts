import { MinnieState } from '../types';
import StorageService from './StorageService';

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
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            const storedKey = await StorageService.getApiKey();
            if (storedKey) {
                this.apiKey = storedKey;
            }
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize AI service:', error);
            this.initialized = true; // Mark as initialized even on error to prevent retry loops
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
     */
    hasApiKey(): boolean {
        return !!this.apiKey;
    }

    async getResponse(userMessage: string): Promise<{ message: string; state: MinnieState }> {
        // Ensure service is initialized
        if (!this.initialized) {
            await this.initialize();
        }

        if (this.apiKey) {
            return this.fetchOpenAiResponse(userMessage);
        }
        return this.getMockResponse(userMessage);
    }

    private async fetchOpenAiResponse(message: string): Promise<{ message: string; state: MinnieState }> {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are Minnie, an empathetic AI wellness coach. Keep responses short (under 2 sentences) and encouraging. Use relevant emojis. Focus on health, fitness, mental wellness, and positive motivation."
                        },
                        { role: "user", content: message }
                    ],
                    max_tokens: 100,
                    temperature: 0.7
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
            lowerResponse.includes('breathe') || lowerResponse.includes('relax')) {
            return 'calming';
        }

        // Check for energetic/encouraging context
        if (lowerResponse.includes('!') && (lowerResponse.includes('great') ||
            lowerResponse.includes('amazing') || lowerResponse.includes('awesome'))) {
            return 'encouraging';
        }

        // Check for celebratory context
        if (lowerResponse.includes('congratulations') || lowerResponse.includes('🎉') ||
            lowerResponse.includes('achieved')) {
            return 'celebratory';
        }

        // Check for thinking context
        if (lowerMessage.includes('what') || lowerMessage.includes('how') ||
            lowerMessage.includes('suggest')) {
            return 'thinking';
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
