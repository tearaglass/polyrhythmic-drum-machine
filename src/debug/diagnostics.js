export class Diagnostics {
  constructor(limit = 256) {
    this.limit = limit;
    this.events = [];
    this.lateness = [];
    this.invalidations = 0;
    this.cancelledEvents = 0;
    this.lastPass = null;
  }

  boundedPush(collection, value) {
    collection.push(value);
    if (collection.length > this.limit) collection.splice(0, collection.length - this.limit);
  }

  recordPass(pass) {
    this.lastPass = pass;
  }

  recordEvent(event, scheduledAt) {
    this.boundedPush(this.events, {
      ...event,
      scheduledAt,
      leadTime: event.audioTime - scheduledAt,
    });
  }

  recordLatePass(seconds) {
    this.boundedPush(this.lateness, seconds);
  }

  recordInvalidation(_clockId, cancelled) {
    this.invalidations += 1;
    this.cancelledEvents += cancelled;
  }

  get averageLateness() {
    if (this.lateness.length === 0) return 0;
    return this.lateness.reduce((total, value) => total + value, 0) / this.lateness.length;
  }

  get maximumLateness() {
    return this.lateness.length === 0 ? 0 : Math.max(...this.lateness);
  }

  snapshot({ audioEngine, state, scheduler, now, proximity = 0 }) {
    return {
      audio: audioEngine.state,
      sampleRate: audioEngine.context?.sampleRate ?? 0,
      transport: state.timeline.state,
      bpm: state.timeline.bpm,
      phaseProximity: proximity,
      scheduler: {
        now,
        horizon: this.lastPass?.horizon ?? now,
        pendingAudio: scheduler?.pendingHandleCount ?? 0,
        eventsRecorded: this.events.length,
        invalidations: this.invalidations,
        cancelledEvents: this.cancelledEvents,
        averageLatenessMs: this.averageLateness * 1000,
        maximumLatenessMs: this.maximumLateness * 1000,
      },
      clocks: state.clocks.map((clock) => ({
        id: clock.id,
        ratio: `${clock.ratio.numerator}:${clock.ratio.denominator}`,
        frequency: clock.frequencyAtBpm(state.timeline.bpm),
        velocity: clock.velocityAt(now, state.timeline.bpm),
        phase: clock.phaseAt(now, state.timeline.bpm),
        unwrappedPhase: clock.unwrappedPhaseAt(now, state.timeline.bpm),
        cycleCount: clock.cycleCountAt(now, state.timeline.bpm),
        drift: clock.driftAmount,
        dragging: clock.dragging,
        softHome: clock.isSoftHomeActiveAt(now),
      referenceClock: clock.referenceClock?.id ?? null,
      locked: clock.locked,
        trajectoryVersion: clock.trajectoryVersion,
      })),
    };
  }
}
