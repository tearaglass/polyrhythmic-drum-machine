import { describe, expect, test, vi } from 'vitest';
import { Clock } from '../src/timing/clock.js';
import { Scheduler } from '../src/timing/scheduler.js';

function makeScheduler({ clock, routed, now = 0 }) {
  return new Scheduler({
    timeSource: () => now,
    clocks: [clock],
    getBpm: () => 120,
    scheduleAheadSeconds: 0.6,
    routeEvent: (event) => {
      routed.push(event);
      return {
        clockId: event.clockId,
        trajectoryVersion: event.trajectoryVersion,
        startTime: event.audioTime,
        endTime: event.audioTime + 0.01,
        cancel: vi.fn(),
      };
    },
  });
}

describe('scheduler', () => {
  test('duplicate passes do not schedule duplicate events', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    const routed = [];
    const scheduler = makeScheduler({ clock, routed });

    scheduler.cursors.set(clock.id, 0);
    scheduler.schedulePass(0);
    scheduler.cursors.set(clock.id, 0);
    scheduler.schedulePass(0);

    expect(routed).toHaveLength(1);
  });

  test('trajectory invalidation cancels future audio and reschedules from change time', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    const routed = [];
    const scheduler = makeScheduler({ clock, routed });
    scheduler.cursors.set(clock.id, 0);
    scheduler.schedulePass(0);
    const oldHandle = [...scheduler.handles][0];

    clock.setRatio(3, 1, 0.1, 120);
    scheduler.invalidateClock(clock.id, 0.1);
    scheduler.schedulePass(0.1);

    expect(oldHandle.cancel).toHaveBeenCalledOnce();
    expect(routed.some((event) => event.trajectoryVersion === clock.trajectoryVersion)).toBe(true);
  });

  test('scheduled event bookkeeping is pruned after events pass', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    const scheduler = makeScheduler({ clock, routed: [] });
    scheduler.cursors.set(clock.id, 0);
    scheduler.schedulePass(0);
    expect(scheduler.scheduledEvents.size).toBeGreaterThan(0);
    scheduler.pruneHandles(2);
    expect(scheduler.scheduledEvents.size).toBe(0);
    expect(scheduler.pendingHandleCount).toBe(0);
  });

  test('rapid trajectory changes keep future-event bookkeeping bounded', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    const scheduler = makeScheduler({ clock, routed: [] });
    scheduler.cursors.set(clock.id, 0);

    for (let index = 0; index < 500; index += 1) {
      const changeTime = index / 10_000;
      scheduler.schedulePass(changeTime);
      clock.setRatio((index % 7) + 1, (index % 5) + 1, changeTime, 120);
      scheduler.invalidateClock(clock.id, changeTime);
    }

    scheduler.schedulePass(0.05);
    expect(scheduler.pendingHandleCount).toBeLessThanOrEqual(4);
    expect(scheduler.scheduledEvents.size).toBeLessThanOrEqual(4);
  });
});
