/**
 * Web Audio API synthesizer for instant zero-latency sound effects
 * and Web Speech API for voice prompts.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isVoiceSpeaking: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a single synthesized tone with ADSR envelope
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before first user interaction
    }
  }

  // Sound when user reaches correct squat bottom depth (encouraging ding)
  playBottomHit() {
    this.playTone(587.33, 0.15, 'triangle', 0.25); // D5
  }

  // Sound when a successful rep is counted
  playRepCount() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Two-tone cheerful chime (E5 -> G5)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.08); // G5

      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.3);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.3);
    } catch {
      // Audio context error fallback
    }
  }

  // Sound for shallow squat / invalid rep warning
  playWarning() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // fallback
    }
  }

  // Sound when workout target is completed (fanfare chord)
  playWorkoutComplete() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
      chord.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 0.4, 'sine', 0.25);
        }, idx * 120);
      });
    } catch {
      // fallback
    }
  }

  // Japanese Voice synthesis
  speak(text: string, force: boolean = false) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (this.isVoiceSpeaking && !force) return;

    window.speechSynthesis.cancel(); // Stop current speech to avoid backlog

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.15; // Slightly faster for natural workout coaching
    utterance.pitch = 1.1;

    utterance.onstart = () => {
      this.isVoiceSpeaking = true;
    };
    utterance.onend = () => {
      this.isVoiceSpeaking = false;
    };
    utterance.onerror = () => {
      this.isVoiceSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const soundManager = new SoundEffectsManager();
