/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio API sound generator for realistic door mechanics
// Zero external audio files, zero 404 risks, instantaneous response.

class DoorAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted = false;
  private lastPlayTime = 0;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play realistic door-open latch click + wooden hinge creak
  public playDoorOpen() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastPlayTime < 0.25) return; // Prevent spamming
    this.lastPlayTime = now;

    try {
      // 1. Metal latch click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1250, now);
      clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
      clickGain.gain.setValueAtTime(0.18, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.05);

      // 2. Wooden door swing resonance / subtle hinge sweep
      const swingOsc = this.ctx.createOscillator();
      const swingGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      swingOsc.type = 'sine';
      swingOsc.frequency.setValueAtTime(140, now + 0.05);
      swingOsc.frequency.exponentialRampToValueAtTime(75, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now + 0.05);

      swingGain.gain.setValueAtTime(0.001, now);
      swingGain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      swingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      swingOsc.connect(filter);
      filter.connect(swingGain);
      swingGain.connect(this.ctx.destination);

      swingOsc.start(now + 0.05);
      swingOsc.stop(now + 0.5);
    } catch {
      // Fallback silent
    }
  }

  // Play solid door-close latch thud and click
  public playDoorClose() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastPlayTime < 0.25) return;
    this.lastPlayTime = now;

    try {
      // 1. Solid door frame impact / bass thump
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(95, now);
      thudOsc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      thudGain.gain.setValueAtTime(0.25, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.15);

      // 2. Metal strike latch click
      const latchOsc = this.ctx.createOscillator();
      const latchGain = this.ctx.createGain();
      latchOsc.type = 'triangle';
      latchOsc.frequency.setValueAtTime(1600, now + 0.015);
      latchOsc.frequency.exponentialRampToValueAtTime(480, now + 0.06);
      latchGain.gain.setValueAtTime(0.16, now + 0.015);
      latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      latchOsc.connect(latchGain);
      latchGain.connect(this.ctx.destination);
      latchOsc.start(now + 0.015);
      latchOsc.stop(now + 0.07);
    } catch {
      // Fallback silent
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const doorAudio = new DoorAudioEngine();
