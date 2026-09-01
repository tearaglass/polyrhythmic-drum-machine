import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';
import { normalizePhase } from '../src/timing/phase.js';

describe('clock', () => {
  test.each([
    [3, 2, 3],
    [5, 4, 2.5],
    [7, 5, 2.8],
  ])('converts %i:%i at 120 BPM to the expected frequency', (numerator, denominator, frequency) => {
    const clock = new Clock({ id: 'test', numerator, denominator });
    expect(clock.frequencyAtBpm(120)).toBeCloseTo(frequency);
  });

  test('preserves an unreduced ratio representation', () => {
    const clock = new Clock({ id: 'test', numerator: 6, denominator: 4 });
    expect(clock.ratio).toEqual({ numerator: 6, denominator: 4 });
    expect(clock.frequencyAtBpm(120)).toBeCloseTo(3);
  });

  test.each([
    [3, 2],
    [5, 4],
    [7, 5],
  ])('plans exact wrap times for %i:%i', (numerator, denominator) => {
    const clock = new Clock({ id: 'test', numerator, denominator });
    clock.start(0);
    const frequency = clock.frequencyAtBpm(120);
    const duration = denominator / 2;
    const events = clock.eventsBetween(0, duration, 120);

    expect(events).toHaveLength(numerator);
    events.forEach((event, index) => {
      expect(event.audioTime).toBeCloseTo((index + 1) / frequency, 10);
    });
  });

  test('preserves phase during a live ratio change', () => {
    const clock = new Clock({ id: 'test', numerator: 1, denominator: 1 });
    clock.start(0);
    const before = clock.phaseAt(0.375, 120);
    clock.setRatio(7, 3, 0.375, 120);

    expect(clock.phaseAt(0.375, 120)).toBeCloseTo(before);
    expect(clock.frequencyAtBpm(120)).toBeCloseTo(14 / 3);
  });

  test('preserves phase when reanchored for a tempo change', () => {
    const clock = new Clock({ id: 'test', numerator: 5, denominator: 4 });
    clock.start(0);
    const before = clock.phaseAt(0.37, 120);
    clock.capture(0.37, 120);
    clock.invalidate();

    expect(clock.phaseAt(0.37, 90)).toBeCloseTo(before);
    expect(clock.phaseAt(0.57, 90)).toBeCloseTo(normalizePhase(before + 0.375));
  });

  test('sets phase without emitting crossed events', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    clock.setPhase(0.9, 0.2, 120);

    expect(clock.eventsBetween(0.2, 0.24, 120)).toEqual([]);
    expect(clock.eventsBetween(0.2, 0.26, 120)).toHaveLength(1);
  });

  test('rejects zero and negative ratio components', () => {
    expect(() => new Clock({ id: 'test', numerator: 0, denominator: 1 })).toThrow(RangeError);
    expect(() => new Clock({ id: 'test', numerator: 1, denominator: -1 })).toThrow(RangeError);
  });
});
