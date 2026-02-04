import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { Platform } from 'react-native';

class VoiceManagerService {
    private isListening: boolean = false;
    private onSpeechStartCallback: (() => void) | null = null;
    private onSpeechEndCallback: (() => void) | null = null;
    private onSpeechResultsCallback: ((text: string) => void) | null = null;
    private onSpeechErrorCallback: ((error: any) => void) | null = null;

    constructor() {
        // Initialize Voice Events
        Voice.onSpeechStart = this.onSpeechStart.bind(this);
        Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
        Voice.onSpeechResults = this.onSpeechResults.bind(this);
        Voice.onSpeechError = this.onSpeechError.bind(this);

        // Initialize TTS
        this.initTts();
    }

    private async initTts() {
        try {
            await Tts.getInitStatus();
            Tts.setDefaultRate(0.45); // Slightly slower for clarity
            Tts.setDefaultPitch(1.0); // Neutral/Warm pitch
            // Tts.setDefaultLanguage('en-US'); // Fallback to default
        } catch (err) {
            console.error('TTS initialization error', err);
        }
    }

    // --- Event Handlers ---

    private onSpeechStart(e: any) {
        this.isListening = true;
        if (this.onSpeechStartCallback) this.onSpeechStartCallback();
    }

    private onSpeechEnd(e: any) {
        this.isListening = false;
        if (this.onSpeechEndCallback) this.onSpeechEndCallback();
    }

    private onSpeechResults(e: SpeechResultsEvent) {
        if (e.value && e.value[0]) {
            if (this.onSpeechResultsCallback) {
                this.onSpeechResultsCallback(e.value[0]);
            }
        }
    }

    private onSpeechError(e: SpeechErrorEvent) {
        this.isListening = false;
        if (this.onSpeechErrorCallback) this.onSpeechErrorCallback(e);
    }

    // --- Public API ---

    public setCallbacks(
        onStart: () => void,
        onEnd: () => void,
        onResults: (text: string) => void,
        onError: (error: any) => void
    ) {
        this.onSpeechStartCallback = onStart;
        this.onSpeechEndCallback = onEnd;
        this.onSpeechResultsCallback = onResults;
        this.onSpeechErrorCallback = onError;
    }

    public async startListening() {
        if (this.isListening) {
            await this.stopListening();
        }
        try {
            await Voice.start('en-US');
        } catch (e) {
            console.error(e);
        }
    }

    public async stopListening() {
        try {
            await Voice.stop();
        } catch (e) {
            console.error(e);
        }
    }

    public async cancelListening() {
        try {
            await Voice.cancel();
        } catch (e) {
            console.error(e);
        }
    }

    private sanitizeTextForSpeech(text: string): string {
        return text
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis (range 1)
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove emojis (range 2)
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove emojis (range 3)
            .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Remove misc symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Remove dingbats
            .replace(/\[.*?\]/g, '')                 // Remove [image] descriptions
            .replace(/[*_~`#]/g, '')                 // Remove markdown chars
            .replace(/\s+/g, ' ')                    // Normalize whitespace
            .trim();
    }

    public async speak(text: string) {
        try {
            // Stop any current speech
            Tts.stop();
            const cleanText = this.sanitizeTextForSpeech(text);
            if (cleanText.length > 0) {
                Tts.speak(cleanText);
            }
        } catch (e) {
            console.error(e);
        }
    }

    public stopSpeaking() {
        Tts.stop();
    }

    public destroy() {
        Voice.destroy().then(Voice.removeAllListeners);
    }
}

export const VoiceManager = new VoiceManagerService();
