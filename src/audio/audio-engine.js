import { CONFIG } from '../config.js';
import { BeaterVoice } from './beater-voice.js';
import { AudioRecorder } from './audio-recorder.js';
import { ClickVoice } from './click-voice.js';
import { KickVoice } from './kick-voice.js';
import { OutputStage } from './output-stage.js';

export class AudioEngine {
  constructor({ onStateChange, getProximity, getClockFrequency, onTemporalEvent, onClickEvent } = {}) {
    this.context = null;
    this.output = null;
    this.clicks = new Map();
    this.kick = null;
    this.beater = null;
    this.recorder = null;
    this.mode = 'kick';
    this.scheduledHits = [];
    this.onStateChange = onStateChange;
    this.getProximity = getProximity;
    this.onTemporalEvent = onTemporalEvent;
    this.onClickEvent = onClickEvent;
    this.getClockFrequency = getClockFrequency;
    this.clickSwing = 0;
  }

  async initialize() {
    if (!this.context) {
      const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio is unavailable.');

      this.context = new AudioContextClass();
      this.output = new OutputStage(this.context);
      if (globalThis.MediaRecorder && this.context.createMediaStreamDestination) {
        this.recorder = new AudioRecorder(this.context, this.output.limiter);
      }
      this.kick = new KickVoice(this.context, this.output.input);
      this.beater = new BeaterVoice(this.context, this.output.input);
      for (const [clockId, settings] of Object.entries(CONFIG.clicks)) {
        this.clicks.set(clockId, new ClickVoice(this.context, this.output.input, settings));
      }
      this.context.addEventListener('statechange', () => {
        this.onStateChange?.(this.context.state, this.context.currentTime);
      });
    }

    if (this.context.state !== 'running') await this.context.resume();
    return this.context;
  }

  routeEvent(event) {
    this.onTemporalEvent?.(event);
    if (this.mode === 'clicks') {
      const click = this.clicks.get(event.clockId);
      if (!click) return null;
      const frequency = Math.max(0.0001, this.getClockFrequency?.(event.clockId, event.audioTime) ?? 1);
      const swingOffset = Math.abs(event.cycleIndex % 2) === 1
        ? (this.clickSwing * 0.5) / frequency
        : 0;
      const swungEvent = { ...event, audioTime: event.audioTime + swingOffset };
      const midiHandle = this.onClickEvent?.(swungEvent);
      const soundHandle = click.trigger(swungEvent);
      if (!midiHandle?.cancel) return soundHandle;
      // An invalidated click must also withdraw its MIDI note.
      return {
        ...soundHandle,
        cancel: () => {
          soundHandle?.cancel?.();
          midiHandle.cancel();
        },
      };
    }

    if (event.clockId === 'clock-c') return this.beater?.trigger(event) ?? null;

    if (event.clockId === 'clock-b') {
      this.kick.applySidechain(event.audioTime);
      return null;
    }
    this.pruneScheduledHits();

    const existing = this.scheduledHits.find(
      (hit) => Math.abs(hit.audioTime - event.audioTime) <= CONFIG.coincidenceToleranceSeconds,
    );
    let entry = existing;

    if (!entry) {
      // Pass the hit-time proximity straight to the hit instead of retuning
      // every other active hit to a value from the future.
      const soundHandle = this.kick.trigger(event, this.getProximity?.(event.audioTime) ?? 0);
      entry = {
        audioTime: event.audioTime,
        soundHandle,
        contributors: new Set(),
      };
      this.scheduledHits.push(entry);
    }

    entry.contributors.add(event.id);
    let cancelled = false;

    return {
      clockId: event.clockId,
      trajectoryVersion: event.trajectoryVersion,
      startTime: entry.soundHandle.startTime,
      endTime: entry.soundHandle.endTime,
      cancel: () => {
        if (cancelled) return;
        cancelled = true;
        entry.contributors.delete(event.id);
        if (entry.contributors.size === 0) {
          entry.soundHandle.cancel();
          this.scheduledHits = this.scheduledHits.filter((hit) => hit !== entry);
        }
      },
    };
  }

  setKickParameters(parameters) {
    this.kick?.setParameters(parameters);
  }

  setBeaterParameters(parameters) {
    this.beater?.setParameters(parameters);
  }

  setMode(mode) {
    if (mode !== 'kick' && mode !== 'clicks') throw new RangeError('Unknown audio mode.');
    this.mode = mode;
  }

  setClickSwing(amount) {
    this.clickSwing = Math.min(0.5, Math.max(0, Number(amount) || 0));
  }

  startRecording() {
    return this.recorder?.start() ?? false;
  }

  stopRecording() {
    return this.recorder?.stop() ?? Promise.resolve(null);
  }

  get isRecording() {
    return this.recorder?.isRecording ?? false;
  }

  get canRecord() {
    return Boolean(this.recorder);
  }

  setProximity(value, audioTime) {
    this.kick?.setProximity(value, audioTime);
  }

  setSidechainConfig(config) {
    this.kick?.setSidechainConfig(config);
  }

  pruneScheduledHits() {
    if (!this.context) return;
    this.scheduledHits = this.scheduledHits.filter(
      (hit) => hit.soundHandle.endTime > this.context.currentTime,
    );
  }

  get state() {
    return this.context?.state ?? 'uninitialized';
  }
}
