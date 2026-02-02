import { MinnieState } from '../types';

// Mock responses forfallback
const MOCK_RESPONSES = [
    { keywords: ['stress', 'anxious', 'worry'], state: 'calming' as MinnieState, text: "I hear you—stress is tough. 💙 Let's try the 4-7-8 breathing technique: breathe in for 4s, hold for 7s, exhale for 8s." },
    { keywords: ['eat', 'food', 'hungry', 'diet'], state: 'thinking' as MinnieState, text: "I'd suggest something protein-rich! How about grilled chicken or Greek yogurt? stay fueled! 🥗" },
    { keywords: ['motivation', 'tired', 'give up'], state: 'encouraging' as MinnieState, text: "You've got this! Consistency is key. Even a small step forward is progress. Keep going! 🔥" },
    { keywords: ['progress', 'stats', 'doing'], state: 'happy' as MinnieState, text: "You're making great progress! Your trends are looking positive. Keep up the good work! 📈" },
];

class AiService {
    private apiKey: string | null = null;
    private endpoint = 'https://api.openai.com/v1/chat/completions';

    constructor() {
        // user implementation would load this from env or storage
        // this.apiKey = process.env.OPENAI_API_KEY; 
    }

    async getResponse(userMessage: string): Promise<{ message: string; state: MinnieState }> {
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
                        { role: "system", content: "You are Minnie, an empathetic AI wellness coach. Keep responses short (under 2 sentences) and encouraging." },
                        { role: "user", content: message }
                    ],
                    max_tokens: 60
                })
            });
            const data = await response.json();
            if (data.choices && data.choices[0]) {
                const text = data.choices[0].message.content;
                // Simple sentiment analysis for state (can be improved)
                const state = text.includes('!') ? 'encouraging' : 'happy';
                return { message: text, state };
            }
        } catch (error) {
            console.error('AI Error', error);
        }
        return this.getMockResponse(message); // Fallback
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
