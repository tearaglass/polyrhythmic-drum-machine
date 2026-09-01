import { CONFIG } from '../config.js';

export class Scheduler {
  constructor({
    timeSource,
    clocks,
    getBpm,
    routeEvent,
    diagnostics,
    intervalMs = CONFIG.schedulerIntervalMs,
    scheduleAheadSeconds = CONFIG.scheduleAheadSeconds,
  }) {
    this.timeSource = timeSource;
    this.clocks = clocks;
    this.getBpm = getBpm;
    this.routeEvent = routeEvent;
    this.diagnostics = diagnostics;
    this.intervalMs = intervalMs;
    this.scheduleAheadSeconds = scheduleAheadSeconds;
    this.cursors = new Map();
    this.handles = new Set();
    this.scheduledEvents = new Map();
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    const now = this.timeSource();
    for (const clock of this.clocks) this.cursors.set(clock.id, now);
    this.schedulePass(now);
    this.timer = globalThis.setInterval(() => this.schedulePass(), this.intervalMs);
  }

  stop({ cancelFuture = true } = {}) {
    if (this.timer) globalThis.clearInterval(this.timer);
    this.timer = null;
    if (cancelFuture) this.cancelAll(this.timeSource());
  }

  schedulePass(now = this.timeSource()) {
    const horizon = now + this.scheduleAheadSeconds;
    this.pruneHandles(now);

    for (const clock of this.clocks) {
      const previousCursor = this.cursors.get(clock.id) ?? now;
      if (previousCursor < now - CONFIG.comparisonEpsilon) {
        this.diagnostics?.recordLatePass(now - previousCursor);
      }
      const start = Math.max(previousCursor, now);
      const events = clock.eventsBetween(start, horizon, this.getBpm());

      for (const event of events) this.scheduleEvent(event, now);
      this.cursors.set(clock.id, horizon);
    }

    this.diagnostics?.recordPass({ now, horizon });
    return horizon;
  }

  scheduleEvent(event, now = this.timeSource()) {
    if (this.scheduledEvents.has(event.id)) return null;
    this.scheduledEvents.set(event.id, event);
    this.diagnostics?.recordEvent(event, now);
    const handle = this.routeEvent?.(event);
    if (handle) this.handles.add(handle);
    return handle;
  }

  emitImmediate(event) {
    return this.scheduleEvent(event, this.timeSource());
  }

  invalidateClock(clockId, audioTime = this.timeSource()) {
    let cancelled = 0;
    for (const handle of [...this.handles]) {
      if (handle.clockId === clockId && handle.startTime >= audioTime) {
        handle.cancel?.();
        this.handles.delete(handle);
        cancelled += 1;
      }
    }
    for (const [eventId, event] of this.scheduledEvents) {
      if (event.clockId === clockId && event.audioTime >= audioTime) {
        this.scheduledEvents.delete(eventId);
      }
    }
    this.cursors.set(clockId, audioTime);
    this.diagnostics?.recordInvalidation(clockId, cancelled);
  }

  cancelAll(audioTime = this.timeSource()) {
    for (const handle of [...this.handles]) {
      if (handle.startTime >= audioTime) handle.cancel?.();
      this.handles.delete(handle);
    }
    this.scheduledEvents.clear();
  }

  pruneHandles(now = this.timeSource()) {
    for (const handle of this.handles) {
      if (handle.endTime <= now) this.handles.delete(handle);
    }
    for (const [eventId, event] of this.scheduledEvents) {
      if (event.audioTime < now - CONFIG.comparisonEpsilon) this.scheduledEvents.delete(eventId);
    }
  }

  get pendingHandleCount() {
    return this.handles.size;
  }
}
