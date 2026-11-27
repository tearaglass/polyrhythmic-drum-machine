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

  get isSuspended() {
    return this.state === 'suspended';
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
    // Pausing while the audio device is suspended means "stay paused once it returns".
    if (this.isSuspended) {
      this.wasPlayingBeforeSuspension = false;
      return;
    }
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
    this.wasPlayingBeforeSuspension = false;
  }

  markHomeBoundaryPending() {
    this.homeBoundaryPending = true;
  }

  suspend(audioTime = this.timeSource()) {
    this.wasPlayingBeforeSuspension = this.isPlaying;
    if (this.isPlaying) this.pause(audioTime);
    this.state = 'suspended';
  }

  // PLAY pressed during a suspension: start playing as soon as audio returns.
  armPlaybackOnResume() {
    if (this.isSuspended) this.wasPlayingBeforeSuspension = true;
  }

  // Returns what the caller must restart. Does nothing unless currently suspended,
  // so it is safe to call from both the statechange event and the PLAY handler.
  resumeFromSuspension(audioTime = this.timeSource()) {
    if (!this.isSuspended) return { playing: false, startedFromHome: false };
    this.anchorAudioTime = audioTime;
    const playing = this.wasPlayingBeforeSuspension;
    const startedFromHome = playing && this.homeBoundaryPending;
    this.state = playing ? 'playing' : 'paused';
    if (playing) this.homeBoundaryPending = false;
    this.wasPlayingBeforeSuspension = false;
    return { playing, startedFromHome };
  }
}
