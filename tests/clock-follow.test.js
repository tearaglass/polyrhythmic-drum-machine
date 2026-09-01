import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';

describe('Clock B follow', () => {
  test('derives Clock B velocity from Clock A and its own ratio', () => {
    const clockA = new Clock({ id: 'clock-a', numerator: 5, denominator: 4 });
    const clockB = new Clock({ id: 'clock-b', numerator: 3, denominator: 2 });
    clockA.start(0);
    clockB.start(0);
    clockB.setReferenceClock(clockA, 0.2, 120);

    expect(clockA.frequencyAtBpm(120)).toBeCloseTo(2.5);
    expect(clockB.frequencyAtBpm(120)).toBeCloseTo(3.75);
    expect(clockB.velocityAt(1, 120)).toBeCloseTo(3.75);
  });

  test('preserves Clock B phase when Follow is enabled and disabled', () => {
    const clockA = new Clock({ id: 'clock-a', numerator: 5, denominator: 4 });
    const clockB = new Clock({ id: 'clock-b' });
    clockA.start(0);
    clockB.start(0);
    const beforeEnable = clockB.phaseAt(0.37, 120);
    clockB.setReferenceClock(clockA, 0.37, 120);
    expect(clockB.phaseAt(0.37, 120)).toBeCloseTo(beforeEnable);

    const beforeDisable = clockB.phaseAt(0.9, 120);
    clockB.setReferenceClock(null, 0.9, 120);
    expect(clockB.phaseAt(0.9, 120)).toBeCloseTo(beforeDisable);
  });

  test('follows Clock A curved velocity during SOFT HOME', () => {
    const clockA = new Clock({ id: 'clock-a' });
    const clockB = new Clock({ id: 'clock-b', numerator: 3, denominator: 2 });
    clockA.start(0);
    clockB.start(0);
    clockA.setPhase(0.35, 0.2, 120);
    clockB.setReferenceClock(clockA, 0.2, 120);
    clockA.startSoftHome(0.2, 120);

    expect(clockB.velocityAt(1.2, 120)).toBeCloseTo(clockA.velocityAt(1.2, 120) * 1.5);
    const events = clockB.eventsBetween(0.2, 2.2, 120);
    expect(events.length).toBeGreaterThan(0);
    events.forEach((event) => {
      expect(clockB.unwrappedPhaseAt(event.audioTime, 120)).toBeCloseTo(event.cycleIndex, 8);
    });
  });

  test('rejects cyclic clock references', () => {
    const clockA = new Clock({ id: 'clock-a' });
    const clockB = new Clock({ id: 'clock-b' });
    clockB.setReferenceClock(clockA, 0, 120);
    expect(() => clockA.setReferenceClock(clockB, 0, 120)).toThrow(RangeError);
  });
});
