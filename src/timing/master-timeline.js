import { CONFIG } from '../config.js';

export class MasterTimeline {
  constructor({ bpm = CONFIG.bpm.default, timeSource = () => 0 } = {}) {
    this.timeSource = timeSource;
    this.bpm = this.validateBpm(bpm);
    this.state = 'stopped';
    this.position = 0;
    this.anchorAudioTime = this.timeSource();
    this.wasPlayingBeforeSuspension = false;
    this.homeBoundaryPending = true;
  }

  validateBpm(value) {
    const bpm = Number(value);
    if (!Number.isFinite(bpm) || bpm < CONFIG.bpm.min || bpm > CONFIG.bpm.max) {
      throw new RangeError(`BPM must be between ${CONFIG.bpm.min} and ${CONFIG.bpm.max}.`);
    }
    return bpm;
  }

  get frequency() {
    return this.bpm / 60;
  }

  get isPlaying() {
    return this.state === 'playing';
  }

  positionAt(audioTime = this.timeSource()) {
    if (!this.isPlaying) return this.position;
    return this.position + Math.max(0, audioTime - this.anchorAudioTime);
  }

  setBpm(value) {
    this.bpm = this.validateBpm(value);
  }

  play(audioTime = this.timeSource()) {
    if (this.isPlaying) return { startedFromHome: false };
    const startedFromHome = this.homeBoundaryPending;
    this.anchorAudioTime = audioTime;
    this.state = 'playing';
    this.homeBoundaryPending = false;
    return { startedFromHome };
  }

  pause(audioTime = this.timeSource()) {
    if (!this.isPlaying) return;
    this.position = this.positionAt(audioTime);
    this.anchorAudioTime = audioTime;
    this.state = 'paused';
  }

  stop(audioTime = this.timeSource()) {
    this.anchorAudioTime = audioTime;
    this.position = 0;
    this.state = 'stopped';
    this.homeBoundaryPending = true;
  }

  markHomeBoundaryPending() {
    this.homeBoundaryPending = true;
  }

  suspend(audioTime = this.timeSource()) {
    this.wasPlayingBeforeSuspension = this.isPlaying;
    if (this.isPlaying) this.pause(audioTime);
    this.state = 'suspended';
  }

  resumeFromSuspension(audioTime = this.timeSource()) {
    this.anchorAudioTime = audioTime;
    this.state = this.wasPlayingBeforeSuspension ? 'playing' : 'paused';
    this.wasPlayingBeforeSuspension = false;
  }
}
