import { CONFIG } from '../config.js';

export class BeaterVoice {
  constructor(audioContext, destination, settings = CONFIG.beater) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.settings = { ...settings };
  }

  setParameters(parameters) {
    const ranges = {
      pitch: [180, 1800],
      bodyPitch: [60, 320],
      decay: [0.015, 0.18],
      level: [0, 0.3],
    };
    for (const [name, [minimum, maximum]] of Object.entries(ranges)) {
      const value = Number(parameters[name]);
      if (Number.isFinite(value)) this.settings[name] = Math.min(maximum, Math.max(minimum, value));
    }
  }

  trigger(event) {
    const startTime = Math.max(event.audioTime, this.audioContext.currentTime);
    const endTime = startTime + this.settings.decay;
    const impact = this.audioContext.createOscillator();
    const body = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    let cancelled = false;

    impact.type = 'sine';
    impact.frequency.setValueAtTime(this.settings.pitch, startTime);
    impact.frequency.exponentialRampToValueAtTime(this.settings.pitch * 0.36, endTime);
    body.type = 'sine';
    body.frequency.setValueAtTime(this.settings.bodyPitch, startTime);

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(this.settings.level, startTime + 0.0025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);
    impact.connect(envelope);
    body.connect(envelope);
    envelope.connect(this.destination);
    impact.start(startTime);
    body.start(startTime);
    impact.stop(endTime + 0.005);
    body.stop(endTime + 0.005);

    const cleanup = () => {
      impact.disconnect();
      body.disconnect();
      envelope.disconnect();
    };
    impact.addEventListener('ended', cleanup, { once: true });

    return {
      clockId: event.clockId,
      trajectoryVersion: event.trajectoryVersion,
      startTime,
      endTime: endTime + 0.005,
      cancel: () => {
        if (cancelled) return;
        cancelled = true;
        envelope.gain.cancelScheduledValues(this.audioContext.currentTime);
        envelope.gain.setTargetAtTime(0.0001, this.audioContext.currentTime, 0.002);
        try {
          impact.stop(this.audioContext.currentTime + 0.006);
          body.stop(this.audioContext.currentTime + 0.006);
        } catch {
          cleanup();
        }
      },
    };
  }
}
