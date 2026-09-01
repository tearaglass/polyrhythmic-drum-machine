import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';
import { normalizePhase } from '../src/timing/phase.js';

function displacedClock() {
  const clock = new Clock({ id: 'test' });
  clock.start(0);
  clock.setPhase(0.3, 0.1, 120);
  return clock;
}

describe('SOFT HOME', () => {
  test('converges after two seconds without teleporting', () => {
    const clock = displacedClock();
    const before = clock.unwrappedPhaseAt(0.1, 120);
    clock.startSoftHome(0.1, 120);

    expect(clock.unwrappedPhaseAt(0.1, 120)).toBeCloseTo(before, 12);
    expect(normalizePhase(clock.unwrappedPhaseAt(2.1, 120))).toBeCloseTo(0, 10);
  });

  test('maintains positive forward velocity for the entire operation', () => {
    const clock = displacedClock();
    clock.startSoftHome(0.1, 120);

    for (let time = 0.1; time <= 2.1; time += 0.01) {
      expect(clock.velocityAt(time, 120)).toBeGreaterThan(0);
    }
  });

  test('enumerates every curved-trajectory wrap without duplicates', () => {
    const clock = displacedClock();
    clock.startSoftHome(0.1, 120);
    const events = clock.eventsBetween(0.1, 2.1, 120);

    expect(events.map((event) => event.cycleIndex)).toEqual([1, 2, 3, 4]);
    events.forEach((event, index) => {
      expect(clock.unwrappedPhaseAt(event.audioTime, 120)).toBeCloseTo(index + 1, 9);
      if (index > 0) expect(event.audioTime).toBeGreaterThan(events[index - 1].audioTime);
    });
  });

  test('restores the configured base rate after completion', () => {
    const clock = displacedClock();
    clock.startSoftHome(0.1, 120);
    const endpoint = clock.unwrappedPhaseAt(2.1, 120);
    expect(clock.completeSoftHomeIfNeeded(2.1)).toBe(true);

    expect(clock.homeOperation).toBeNull();
    expect(clock.unwrappedPhaseAt(2.6, 120) - endpoint).toBeCloseTo(1, 10);
  });

  test('cancellation preserves attained phase and resumes the base rate', () => {
    const clock = displacedClock();
    clock.startSoftHome(0.1, 120);
    const attained = clock.unwrappedPhaseAt(0.85, 120);
    clock.cancelSoftHome(0.85, 120);

    expect(clock.unwrappedPhaseAt(0.85, 120)).toBeCloseTo(attained, 12);
    expect(clock.unwrappedPhaseAt(1.35, 120) - attained).toBeCloseTo(1, 10);
  });

  test('Pause freezes an active Home operation and Resume continues it', () => {
    const clock = displacedClock();
    clock.startSoftHome(0.1, 120);
    const pausedPhase = clock.unwrappedPhaseAt(0.8, 120);
    clock.pause(0.8, 120);

    expect(clock.unwrappedPhaseAt(8, 120)).toBeCloseTo(pausedPhase, 12);
    clock.start(8);
    expect(clock.unwrappedPhaseAt(8, 120)).toBeCloseTo(pausedPhase, 12);
    expect(normalizePhase(clock.unwrappedPhaseAt(9.3, 120))).toBeCloseTo(0, 10);
  });

  test('HARD RESET cancels Home and returns immediately to phase zero', () => {
    const clock = displacedClock();
    clock.startSoftHome(0.1, 120);
    clock.hardReset(0.5);

    expect(clock.homeOperation).toBeNull();
    expect(clock.phaseAt(0.5, 120)).toBe(0);
  });
});
