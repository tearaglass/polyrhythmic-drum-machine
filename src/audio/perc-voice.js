import { CONFIG } from '../config.js';

export class PercVoice {
  constructor(audioContext, destination, settings = CONFIG.perc) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.settings = settings;
  }

  trigger(event) {
    const startTime = Math.max(event.audioTime, this.audioContext.currentTime);
    const endTime = startTime + this.settings.decay;
    const carrier = this.audioContext.createOscillator();
    const modulator = this.audioContext.createOscillator();
    const modulationGain = this.audioContext.createGain();
    const envelope = this.audioContext.createGain();
    let cancelled = false;

    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(this.settings.pitch, startTime);
    carrier.frequency.exponentialRampToValueAtTime(this.settings.pitch * 0.82, endTime);
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(this.settings.pitch * this.settings.fmRatio, startTime);
    modulationGain.gain.setValueAtTime(this.settings.fmDepthHz, startTime);
    modulationGain.gain.exponentialRampToValueAtTime(0.01, endTime);

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(this.settings.level, startTime + 0.0015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

    modulator.connect(modulationGain);
    modulationGain.connect(carrier.frequency);
    carrier.connect(envelope);
    envelope.connect(this.destination);
    carrier.start(startTime);
    modulator.start(startTime);
    carrier.stop(endTime + 0.01);
    modulator.stop(endTime + 0.01);

    const cleanup = () => {
      carrier.disconnect();
      modulator.disconnect();
      modulationGain.disconnect();
      envelope.disconnect();
    };
    carrier.addEventListener('ended', cleanup, { once: true });

    return {
      startTime,
      endTime: endTime + 0.01,
      cancel: () => {
        if (cancelled) return;
        cancelled = true;
        const cancelTime = this.audioContext.currentTime;
        envelope.gain.cancelScheduledValues(cancelTime);
        envelope.gain.setTargetAtTime(0.0001, cancelTime, 0.003);
        try {
          carrier.stop(cancelTime + 0.012);
          modulator.stop(cancelTime + 0.012);
        } catch {
          cleanup();
        }
      },
    };
  }
}
