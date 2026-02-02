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
            Tts.setDefaultRate(0.5);
            Tts.setDefaultPitch(1.1); // Slightly higher pitch for Minnie
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

    public async speak(text: string) {
        try {
            // Stop any current speech
            Tts.stop();
            Tts.speak(text);
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
