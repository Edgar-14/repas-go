'use client';

export interface NotificationSoundOptions {
  enabled: boolean;
  volume: number; // 0-1
  type: 'subtle' | 'standard' | 'attention';
}

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private settings: NotificationSoundOptions = {
    enabled: false, // Disabled by default
    volume: 0.3,
    type: 'subtle'
  };

  constructor() {
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('befast-notification-sounds');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        } catch (e) {
          console.warn('Failed to parse notification sound settings');
        }
      }
    }
  }

  private async initAudioContext() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private async createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<AudioBuffer> {
    if (!this.audioContext) await this.initAudioContext();
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let value = 0;
      
      switch (type) {
        case 'sine':
          value = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'triangle':
          value = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'square':
          value = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
      }
      
      // Apply envelope (fade in/out)
      const fadeTime = 0.01; // 10ms fade
      const fadeInSamples = fadeTime * sampleRate;
      const fadeOutSamples = fadeTime * sampleRate;
      
      if (i < fadeInSamples) {
        value *= i / fadeInSamples;
      } else if (i > length - fadeOutSamples) {
        value *= (length - i) / fadeOutSamples;
      }
      
      data[i] = value * 0.1; // Keep volume low
    }

    return buffer;
  }

  private async generateSounds() {
    if (!this.audioContext) return;

    try {
      // Subtle notification (soft chime)
      const subtleBuffer = await this.createTone(800, 0.1, 'sine');
      this.sounds.set('subtle', subtleBuffer);

      // Standard notification (two-tone)
      const standardBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
      const standardData = standardBuffer.getChannelData(0);
      
      // First tone
      for (let i = 0; i < this.audioContext.sampleRate * 0.1; i++) {
        const t = i / this.audioContext.sampleRate;
        standardData[i] = Math.sin(2 * Math.PI * 600 * t) * 0.1;
      }
      
      // Brief pause
      for (let i = this.audioContext.sampleRate * 0.1; i < this.audioContext.sampleRate * 0.15; i++) {
        standardData[i] = 0;
      }
      
      // Second tone
      for (let i = this.audioContext.sampleRate * 0.15; i < this.audioContext.sampleRate * 0.25; i++) {
        const t = (i - this.audioContext.sampleRate * 0.15) / this.audioContext.sampleRate;
        standardData[i] = Math.sin(2 * Math.PI * 800 * t) * 0.1;
      }
      
      this.sounds.set('standard', standardBuffer);

      // Attention notification (ascending tones)
      const attentionBuffer = await this.createTone(400, 0.15, 'triangle');
      this.sounds.set('attention', attentionBuffer);

    } catch (e) {
      console.warn('Failed to generate notification sounds:', e);
    }
  }

  async playNotification(type: 'message' | 'error' | 'success' = 'message') {
    if (!this.settings.enabled) return;
    
    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      // Generate sounds if not already done
      if (this.sounds.size === 0) {
        await this.generateSounds();
      }

      let soundKey = this.settings.type;
      
      // Override sound type based on notification type
      if (type === 'error') soundKey = 'attention';
      if (type === 'success') soundKey = 'standard';

      const buffer = this.sounds.get(soundKey);
      if (!buffer) return;

      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.settings.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (e) {
      console.warn('Failed to play notification sound:', e);
    }
  }

  updateSettings(newSettings: Partial<NotificationSoundOptions>) {
    this.settings = { ...this.settings, ...newSettings };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('befast-notification-sounds', JSON.stringify(this.settings));
    }
  }

  getSettings(): NotificationSoundOptions {
    return { ...this.settings };
  }

  async testSound() {
    const wasEnabled = this.settings.enabled;
    this.settings.enabled = true;
    await this.playNotification('message');
    this.settings.enabled = wasEnabled;
  }
}

export const notificationSounds = new NotificationSoundManager();