import { CONFIG } from '../config.js';
import {
  forwardBoundaries,
  normalizePhase,
  positiveModulo,
  solveForwardCrossing,
  unwrappedPhaseAt,
} from './phase.js';
import {
  createSoftHomeTrajectory,
  phaseOnSoftHome,
  velocityOnSoftHome,
} from './soft-home.js';

function validateRatioPart(value, name) {
  const part = Number(value);
  if (!Number.isInteger(part) || part <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
  return part;
}

export class Clock {
  constructor({
    id,
    numerator = 1,
    denominator = 1,
    homePhase = 0,
    anchorAudioTime = 0,
    locked = false,
  }) {
    if (!id) throw new TypeError('Clock requires an id.');

    this.id = id;
    this.ratio = {
      numerator: validateRatioPart(numerator, 'Numerator'),
      denominator: validateRatioPart(denominator, 'Denominator'),
    };
    this.homePhase = normalizePhase(homePhase);
    this.anchorPhase = this.homePhase;
    this.anchorAudioTime = anchorAudioTime;
    this.cycleCount = 0;
    this.driftAmount = 0;
    this.running = false;
    this.dragging = false;
    this.homeOperation = null;
    this.referenceClock = null;
    this.followSourceAnchorPhase = 0;
    this.trajectoryVersion = 0;
    this.locked = locked;
  }

  frequencyAtBpm(bpm) {
    const referenceFrequency = this.referenceClock
      ? this.referenceClock.frequencyAtBpm(bpm)
      : bpm / 60;
    return referenceFrequency * (this.ratio.numerator / this.ratio.denominator) * (1 + this.driftAmount);
  }

  unwrappedPhaseAt(audioTime, bpm) {
    if (!this.running || this.dragging) return this.anchorPhase;
    if (this.homeOperation) return phaseOnSoftHome(this.homeOperation, audioTime);
    if (this.referenceClock) {
      const sourcePhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
      const multiplier = (this.ratio.numerator / this.ratio.denominator) * (1 + this.driftAmount);
      return this.anchorPhase + (sourcePhase - this.followSourceAnchorPhase) * multiplier;
    }
    return unwrappedPhaseAt(
      this.anchorPhase,
      this.frequencyAtBpm(bpm),
      Math.max(0, audioTime - this.anchorAudioTime),
    );
  }

  velocityAt(audioTime, bpm) {
    if (!this.running || this.dragging) return 0;
    if (this.homeOperation) return velocityOnSoftHome(this.homeOperation, audioTime);
    if (this.referenceClock) {
      const multiplier = (this.ratio.numerator / this.ratio.denominator) * (1 + this.driftAmount);
      return this.referenceClock.velocityAt(audioTime, bpm) * multiplier;
    }
    return this.frequencyAtBpm(bpm);
  }

  phaseAt(audioTime, bpm) {
    return positiveModulo(this.unwrappedPhaseAt(audioTime, bpm), 1);
  }

  cycleCountAt(audioTime, bpm) {
    return Math.max(
      0,
      Math.floor(this.unwrappedPhaseAt(audioTime, bpm) - this.homePhase + CONFIG.comparisonEpsilon),
    );
  }

  capture(audioTime, bpm) {
    const phase = this.unwrappedPhaseAt(audioTime, bpm);
    this.anchorPhase = phase;
    this.anchorAudioTime = audioTime;
    this.cycleCount = Math.max(0, Math.floor(this.anchorPhase - this.homePhase + CONFIG.comparisonEpsilon));
    this.homeOperation = null;
    if (this.referenceClock) {
      this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
    }
  }

  invalidate() {
    this.trajectoryVersion += 1;
  }

  start(audioTime, bpm = CONFIG.bpm.default) {
    if (this.homeOperation?.pausedAt !== null && this.homeOperation?.pausedAt !== undefined) {
      const pauseDuration = audioTime - this.homeOperation.pausedAt;
      this.homeOperation.startTime += pauseDuration;
      this.homeOperation.endTime += pauseDuration;
      this.homeOperation.pausedAt = null;
    } else {
      this.anchorAudioTime = audioTime;
      if (this.referenceClock) {
        this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
      }
    }
    this.running = true;
    this.invalidate();
  }

  pause(audioTime, bpm) {
    if (!this.running) return;
    if (this.homeOperation) {
      this.anchorPhase = this.unwrappedPhaseAt(audioTime, bpm);
      this.anchorAudioTime = audioTime;
      this.homeOperation.pausedAt = audioTime;
    } else {
      this.capture(audioTime, bpm);
    }
    this.running = false;
    this.invalidate();
  }

  stop(audioTime) {
    this.running = false;
    this.anchorAudioTime = audioTime;
    this.anchorPhase = this.homePhase;
    this.cycleCount = 0;
    this.dragging = false;
    this.homeOperation = null;
    this.invalidate();
  }

  setRatio(numerator, denominator, audioTime, bpm) {
    if (this.locked) return;
    this.capture(audioTime, bpm);
    this.ratio = {
      numerator: validateRatioPart(numerator, 'Numerator'),
      denominator: validateRatioPart(denominator, 'Denominator'),
    };
    this.invalidate();
  }

  setDrift(amount, audioTime, bpm) {
    if (this.locked) return;
    const drift = Number(amount);
    if (!Number.isFinite(drift) || drift < CONFIG.drift.min || drift > CONFIG.drift.max) {
      throw new RangeError(`Drift must be between ${CONFIG.drift.min} and ${CONFIG.drift.max}.`);
    }
    this.capture(audioTime, bpm);
    this.driftAmount = drift;
    this.invalidate();
  }

  setPhase(phase, audioTime, bpm) {
    if (this.locked) return;
    this.capture(audioTime, bpm);
    this.anchorPhase = Math.floor(this.anchorPhase) + normalizePhase(Number(phase));
    this.anchorAudioTime = audioTime;
    this.invalidate();
  }

  setReferenceClock(referenceClock, audioTime, bpm) {
    if (this.locked) return;
    if (referenceClock === this || referenceClock?.referenceClock === this) {
      throw new RangeError('Clock references must remain acyclic.');
    }
    this.capture(audioTime, bpm);
    this.referenceClock = referenceClock ?? null;
    if (this.referenceClock) {
      this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
    }
    this.anchorAudioTime = audioTime;
    this.invalidate();
  }

  hardReset(audioTime, bpm = CONFIG.bpm.default) {
    this.anchorPhase = this.homePhase;
    this.anchorAudioTime = audioTime;
    this.cycleCount = 0;
    this.dragging = false;
    this.homeOperation = null;
    if (this.referenceClock) {
      this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
    }
    this.invalidate();
  }

  beginDrag(audioTime, bpm) {
    if (this.locked) return;
    this.capture(audioTime, bpm);
    this.dragging = true;
    this.invalidate();
  }

  dragToPhase(phase, audioTime) {
    if (!this.dragging) return;
    this.anchorPhase = Math.floor(this.anchorPhase) + normalizePhase(Number(phase));
    this.anchorAudioTime = audioTime;
  }

  endDrag(audioTime, bpm = CONFIG.bpm.default) {
    if (!this.dragging) return;
    this.anchorAudioTime = audioTime;
    this.dragging = false;
    if (this.referenceClock) {
      this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
    }
    this.invalidate();
  }

  startSoftHome(audioTime, bpm, duration = CONFIG.softHomeDurationSeconds) {
    if (this.locked) return;
    this.capture(audioTime, bpm);
    this.homeOperation = createSoftHomeTrajectory({
      startPhase: this.anchorPhase,
      baseFrequency: this.frequencyAtBpm(bpm),
      startTime: audioTime,
      duration,
      homePhase: this.homePhase,
      epsilon: CONFIG.comparisonEpsilon,
    });
    if (!this.running) this.homeOperation.pausedAt = audioTime;
    this.invalidate();
  }

  cancelSoftHome(audioTime, bpm) {
    if (!this.homeOperation) return false;
    const attainedPhase = this.running
      ? phaseOnSoftHome(this.homeOperation, audioTime)
      : this.anchorPhase;
    this.anchorPhase = attainedPhase;
    this.anchorAudioTime = audioTime;
    this.homeOperation = null;
    if (this.referenceClock) {
      this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(audioTime, bpm);
    }
    this.invalidate();
    return true;
  }

  completeSoftHomeIfNeeded(audioTime, bpm = CONFIG.bpm.default) {
    if (!this.homeOperation || !this.running || audioTime < this.homeOperation.endTime) return false;
    this.anchorPhase = this.homeOperation.targetPhase;
    this.anchorAudioTime = this.homeOperation.endTime;
    if (this.referenceClock) {
      this.followSourceAnchorPhase = this.referenceClock.unwrappedPhaseAt(
        this.homeOperation.endTime,
        bpm,
      );
    }
    this.homeOperation = null;
    return true;
  }

  isSoftHomeActiveAt(audioTime) {
    return Boolean(
      this.homeOperation
      && (this.homeOperation.pausedAt !== null || audioTime < this.homeOperation.endTime),
    );
  }

  eventsBetween(startAudioTime, endAudioTime, bpm) {
    if (!this.running || this.dragging || endAudioTime <= startAudioTime) return [];

    const startPhase = this.unwrappedPhaseAt(startAudioTime, bpm);
    const endPhase = this.unwrappedPhaseAt(endAudioTime, bpm);
    const frequency = this.frequencyAtBpm(bpm);

    return forwardBoundaries(startPhase, endPhase, CONFIG.comparisonEpsilon).map((boundary) => ({
      id: `${this.id}:${this.trajectoryVersion}:${boundary}`,
      clockId: this.id,
      audioTime: (this.homeOperation || this.referenceClock)
        ? solveForwardCrossing(
          (audioTime) => this.unwrappedPhaseAt(audioTime, bpm),
          boundary,
          startAudioTime,
          endAudioTime,
        )
        : this.anchorAudioTime + (boundary - this.anchorPhase) / frequency,
      cycleIndex: boundary,
      kind: 'normal-wrap',
      trajectoryVersion: this.trajectoryVersion,
    }));
  }

  resetBoundaryEvent(audioTime) {
    return {
      id: `${this.id}:${this.trajectoryVersion}:reset:${audioTime}`,
      clockId: this.id,
      audioTime,
      cycleIndex: 0,
      kind: 'reset-boundary',
      trajectoryVersion: this.trajectoryVersion,
    };
  }

  homeBoundaryEvent(audioTime) {
    return {
      id: `${this.id}:${this.trajectoryVersion}:home:${audioTime}`,
      clockId: this.id,
      audioTime,
      cycleIndex: 0,
      kind: 'normal-wrap',
      trajectoryVersion: this.trajectoryVersion,
    };
  }
}
