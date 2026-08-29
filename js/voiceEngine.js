// Indian Voice Engine supporting ElevenLabs API & Indian English Web Speech TTS

export class VoiceEngine {
  constructor() {
    this.isMuted = false;
    this.isSpeaking = false;
    this.provider = 'indian-tts'; // 'elevenlabs' | 'indian-tts'
    this.elevenLabsApiKey = localStorage.getItem('elevenlabs_api_key') || '';
    this.elevenLabsVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Default Rachel / Indian custom voice
    
    this.speechSynth = window.speechSynthesis || null;
    this.indianVoice = null;
    this.audioElement = new Audio();

    this.onStartSpeaking = null;
    this.onEndSpeaking = null;

    this.initBrowserVoice();
  }

  initBrowserVoice() {
    if (!this.speechSynth) return;

    const findVoice = () => {
      const voices = this.speechSynth.getVoices();
      // Look for authentic Indian English voices (en-IN or Indian names)
      this.indianVoice = voices.find(v => 
        v.lang === 'en-IN' || 
        v.name.includes('India') || 
        v.name.includes('Heera') || 
        v.name.includes('Neerja') || 
        v.name.includes('Ravi') || 
        v.name.includes('Veena') ||
        v.name.includes('Prabhat')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    };

    findVoice();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = findVoice;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setApiKey(key) {
    this.elevenLabsApiKey = key;
    localStorage.setItem('elevenlabs_api_key', key);
    if (key) this.provider = 'elevenlabs';
  }

  async speak(text) {
    if (this.isMuted || !text) return;
    this.stop();

    // Clean markdown/quotes
    const cleanText = text.replace(/[*_#"`]/g, '').trim();

    // Try ElevenLabs if API key is provided
    if (this.provider === 'elevenlabs' && this.elevenLabsApiKey) {
      try {
        await this.speakElevenLabs(cleanText);
        return;
      } catch (err) {
        console.warn('ElevenLabs speech failed, falling back to Indian Web Voice:', err);
      }
    }

    // Default: Browser Indian English Voice Over
    this.speakBrowser(cleanText);
  }

  speakBrowser(text) {
    if (!this.speechSynth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.indianVoice) {
      utterance.voice = this.indianVoice;
    }
    utterance.lang = 'en-IN';
    utterance.rate = 0.95; // Natural, clear teaching pace
    utterance.pitch = 1.05; // Friendly, warm tone

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStartSpeaking) this.onStartSpeaking();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onEndSpeaking) this.onEndSpeaking();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.onEndSpeaking) this.onEndSpeaking();
    };

    this.speechSynth.speak(utterance);
  }

  async speakElevenLabs(text) {
    if (!this.elevenLabsApiKey) throw new Error('No ElevenLabs API key');

    this.isSpeaking = true;
    if (this.onStartSpeaking) this.onStartSpeaking();

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.elevenLabsApiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.statusText}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    this.audioElement.src = audioUrl;

    this.audioElement.onended = () => {
      this.isSpeaking = false;
      if (this.onEndSpeaking) this.onEndSpeaking();
      URL.revokeObjectURL(audioUrl);
    };

    this.audioElement.onerror = () => {
      this.isSpeaking = false;
      if (this.onEndSpeaking) this.onEndSpeaking();
      URL.revokeObjectURL(audioUrl);
    };

    await this.audioElement.play();
  }

  stop() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isSpeaking = false;
    if (this.onEndSpeaking) this.onEndSpeaking();
  }
}
