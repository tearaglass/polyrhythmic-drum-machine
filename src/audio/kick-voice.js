import { CONFIG } from '../config.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

export class KickVoice {
  constructor(audioContext, destination, settings = CONFIG.kick) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.pitch = settings.pitch;
    this.decay = settings.decay;
    this.level = settings.level;
    this.transient = settings.transient;
    this.fmDepthHz = settings.fmDepthHz;
    this.proximityAmount = settings.proximityAmount;
    this.currentProximity = 1;
    this.sidechain = {
      enabled: false,
      releaseSeconds: CONFIG.sidechain.releaseSeconds,
      amounts: { ...CONFIG.sidechain.amounts },
      lastEventTime: -Infinity,
    };
    this.activeHits = [];
  }

  setParameters(parameters = {}) {
    if (parameters.pitch !== undefined) {
      this.pitch = clamp(parameters.pitch, CONFIG.kickRanges.pitch.min, CONFIG.kickRanges.pitch.max);
    }
    if (parameters.decay !== undefined) {
      this.decay = clamp(parameters.decay, CONFIG.kickRanges.decay.min, CONFIG.kickRanges.decay.max);
    }
    if (parameters.level !== undefined) {
      this.level = clamp(parameters.level, CONFIG.kickRanges.level.min, CONFIG.kickRanges.level.max);
    }
    if (parameters.transient !== undefined) {
      this.transient = clamp(
        parameters.transient,
        CONFIG.kickRanges.transient.min,
        CONFIG.kickRanges.transient.max,
      );
    }
    if (parameters.fmDepthHz !== undefined) {
      this.fmDepthHz = clamp(
        parameters.fmDepthHz,
        CONFIG.kickRanges.fmDepthHz.min,
        CONFIG.kickRanges.fmDepthHz.max,
      );
    }
    if (parameters.proximityAmount !== undefined) {
      this.proximityAmount = clamp(
        parameters.proximityAmount,
        CONFIG.kickRanges.proximityAmount.min,
        CONFIG.kickRanges.proximityAmount.max,
      );
    }
  }

  setSidechainConfig(config = {}) {
    this.sidechain.enabled = Boolean(config.enabled);
    this.sidechain.amounts = {
      ...this.sidechain.amounts,
      ...config.amounts,
    };
  }

  sidechainEnvelopeAt(audioTime) {
    if (!this.sidechain.enabled) return 0;
    const age = audioTime - this.sidechain.lastEventTime;
    if (age < 0 || age >= this.sidechain.releaseSeconds) return 0;
    return 1 - age / this.sidechain.releaseSeconds;
  }

  effectiveFmDepth(sidechainEnvelope = 0, proximity = this.currentProximity) {
    return clamp(
      this.fmDepthHz
        + CONFIG.kick.maxFmDepthHz * this.proximityAmount * proximity
        + CONFIG.kick.maxFmDepthHz * this.sidechain.amounts.fm * sidechainEnvelope,
      0,
      CONFIG.kick.maxFmDepthHz * 2,
    );
  }

  effectiveParametersAt(audioTime, proximity = this.currentProximity) {
    const envelope = this.sidechainEnvelopeAt(audioTime);
    return {
      pitch: clamp(
        this.pitch * (1 + this.sidechain.amounts.pitch * envelope * 0.75),
        CONFIG.kickRanges.pitch.min,
        CONFIG.kickRanges.pitch.max,
      ),
      decay: clamp(
        this.decay * (1 + this.sidechain.amounts.decay * envelope * 0.8),
        CONFIG.kickRanges.decay.min,
        CONFIG.kickRanges.decay.max,
      ),
      transient: clamp(
        this.transient + this.sidechain.amounts.transient * envelope,
        CONFIG.kickRanges.transient.min,
        CONFIG.kickRanges.transient.max,
      ),
      level: clamp(
        this.level * (1 + this.sidechain.amounts.level * envelope),
        CONFIG.kickRanges.level.min,
        CONFIG.kickRanges.level.max,
      ),
      fmDepthHz: this.effectiveFmDepth(envelope, proximity),
    };
  }

  applySidechain(audioTime) {
    if (!this.sidechain.enabled) return;
    this.sidechain.lastEventTime = audioTime;
    const levelMultiplier = clamp(1 + this.sidechain.amounts.level, 0, 2);

    for (const hit of this.activeHits) {
      const changeTime = Math.max(audioTime, this.audioContext.currentTime, hit.startTime);
      const releaseTime = changeTime + this.sidechain.releaseSeconds;
      hit.sidechainGain.gain.cancelScheduledValues(changeTime);
      hit.sidechainGain.gain.setValueAtTime(1, changeTime);
      hit.sidechainGain.gain.linearRampToValueAtTime(levelMultiplier, changeTime + 0.005);
      hit.sidechainGain.gain.linearRampToValueAtTime(1, releaseTime);
    }
  }

  // Live proximity update. Only hits that are already sounding follow it; hits
  // scheduled for later keep the proximity computed for their own start time.
  setProximity(value, audioTime = this.audioContext.currentTime) {
    this.currentProximity = clamp(value, 0, 1);
    const time = Math.max(audioTime, this.audioContext.currentTime);
    const effectiveDepth = this.effectiveFmDepth(this.sidechainEnvelopeAt(time));

    for (const hit of this.activeHits) {
      if (hit.startTime > time) continue;
      hit.modulationGain.gain.cancelScheduledValues(time);
      hit.modulationGain.gain.setTargetAtTime(effectiveDepth, time, 0.012);
    }
  }

  prune(audioTime = this.audioContext.currentTime) {
    this.activeHits = this.activeHits.filter((hit) => hit.endTime > audioTime);
  }

  // proximity: the clock-phase proximity at this hit's start time.
  trigger(event, proximity = this.currentProximity) {
    this.prune();
    if (this.activeHits.length >= CONFIG.kick.maxPolyphony) {
      this.activeHits.shift()?.cancel();
    }

    const startTime = Math.max(event.audioTime, this.audioContext.currentTime);
    const effective = this.effectiveParametersAt(startTime, clamp(proximity, 0, 1));
    const endTime = startTime + effective.decay;
    const carrier = this.audioContext.createOscillator();
    const modulator = this.audioContext.createOscillator();
    const modulationGain = this.audioContext.createGain();
    const envelope = this.audioContext.createGain();
    const transient = this.audioContext.createOscillator();
    const transientEnvelope = this.audioContext.createGain();
    const sidechainGain = this.audioContext.createGain();
    let cancelled = false;

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(effective.pitch * 2.8, startTime);
    carrier.frequency.exponentialRampToValueAtTime(
      effective.pitch,
      startTime + Math.min(0.055, effective.decay * 0.4),
    );

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(effective.pitch * 1.5, startTime);
    modulationGain.gain.setValueAtTime(effective.fmDepthHz, startTime);

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, effective.level), startTime + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

    transient.type = 'triangle';
    transient.frequency.setValueAtTime(effective.pitch * 14, startTime);
    transientEnvelope.gain.setValueAtTime(
      effective.level * effective.transient * 0.5 + 0.0001,
      startTime,
    );
    transientEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.009);

    modulator.connect(modulationGain);
    modulationGain.connect(carrier.frequency);
    carrier.connect(envelope);
    transient.connect(transientEnvelope);
    sidechainGain.gain.setValueAtTime(1, startTime);
    envelope.connect(sidechainGain);
    transientEnvelope.connect(sidechainGain);
    sidechainGain.connect(this.destination);

    carrier.start(startTime);
    modulator.start(startTime);
    transient.start(startTime);
    carrier.stop(endTime + 0.01);
    modulator.stop(endTime + 0.01);
    transient.stop(startTime + 0.012);

    const cleanup = () => {
      carrier.disconnect();
      modulator.disconnect();
      modulationGain.disconnect();
      envelope.disconnect();
      transient.disconnect();
      transientEnvelope.disconnect();
      sidechainGain.disconnect();
      this.activeHits = this.activeHits.filter((activeHit) => activeHit !== hit);
    };

    const hit = {
      modulationGain,
      sidechainGain,
      startTime,
      endTime: endTime + 0.01,
      cancel: () => {
        if (cancelled) return;
        cancelled = true;
        const cancelTime = this.audioContext.currentTime;
        envelope.gain.cancelScheduledValues(cancelTime);
        envelope.gain.setTargetAtTime(0.0001, cancelTime, 0.003);
        for (const oscillator of [carrier, modulator, transient]) {
          try {
            oscillator.stop(cancelTime + 0.012);
          } catch {
            // An oscillator may already have ended during rapid invalidation.
          }
        }
      },
    };

    carrier.addEventListener('ended', cleanup, { once: true });
    this.activeHits.push(hit);

    return {
      startTime,
      endTime: hit.endTime,
      cancel: hit.cancel,
    };
  }
}
