import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';
import { MasterTimeline } from '../src/timing/master-timeline.js';

describe('HARD RESET', () => {
  test('returns temporal state Home without changing ratio or configured drift', () => {
    const clock = new Clock({ id: 'test', numerator: 5, denominator: 4 });
    clock.start(0);
    clock.setDrift(0.02, 0.25, 120);
    clock.hardReset(2);

    expect(clock.phaseAt(2, 120)).toBe(0);
    expect(clock.cycleCount).toBe(0);
    expect(clock.ratio).toEqual({ numerator: 5, denominator: 4 });
    expect(clock.driftAmount).toBe(0.02);
  });

  test('creates one reset-boundary event per targeted clock while running', () => {
    const clocks = [new Clock({ id: 'a' }), new Clock({ id: 'b' })];
    clocks.forEach((clock) => {
      clock.start(0);
      clock.hardReset(0.75);
    });
    const events = clocks.map((clock) => clock.resetBoundaryEvent(0.75));

    expect(events).toHaveLength(2);
    expect(events.every((event) => event.kind === 'reset-boundary')).toBe(true);
    expect(events.every((event) => event.audioTime === 0.75)).toBe(true);
  });

  test('a paused reset emits no event and arms Play from Home', () => {
    const timeline = new MasterTimeline();
    const clock = new Clock({ id: 'test' });
    timeline.play(0);
    clock.start(0);
    timeline.pause(0.4);
    clock.pause(0.4, 120);
    clock.hardReset(0.4);
    timeline.markHomeBoundaryPending();

    expect(timeline.play(1)).toEqual({ startedFromHome: true });
    expect(clock.phaseAt(0.4, 120)).toBe(0);
  });
});
