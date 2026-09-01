import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';

describe('two-hour mathematical timing span', () => {
  test.each([
    [3, 2, 21_600],
    [5, 4, 18_000],
    [7, 5, 20_160],
  ])('%i:%i produces the expected wraps without cumulative phase error', (numerator, denominator, count) => {
    const clock = new Clock({ id: 'test', numerator, denominator });
    const durationSeconds = 2 * 60 * 60;
    clock.start(0);

    const events = clock.eventsBetween(0, durationSeconds, 120);
    expect(events).toHaveLength(count);
    expect(events.at(-1).audioTime).toBeCloseTo(durationSeconds, 8);
    expect(clock.unwrappedPhaseAt(durationSeconds, 120)).toBeCloseTo(count, 8);
  });
});
