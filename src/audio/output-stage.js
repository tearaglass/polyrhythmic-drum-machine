import { CONFIG } from '../config.js';

export class OutputStage {
  constructor(audioContext, settings = CONFIG.output) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.master = audioContext.createGain();
    this.limiter = audioContext.createDynamicsCompressor();

    this.master.gain.value = settings.masterGain;
    this.limiter.threshold.value = settings.limiterThreshold;
    this.limiter.knee.value = settings.limiterKnee;
    this.limiter.ratio.value = settings.limiterRatio;
    this.limiter.attack.value = settings.limiterAttack;
    this.limiter.release.value = settings.limiterRelease;

    this.input.connect(this.master);
    this.master.connect(this.limiter);
    this.limiter.connect(audioContext.destination);
  }

  disconnect() {
    this.input.disconnect();
    this.master.disconnect();
    this.limiter.disconnect();
  }
}
