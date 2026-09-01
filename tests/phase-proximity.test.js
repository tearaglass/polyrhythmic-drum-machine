import { describe, expect, test } from 'vitest';
import { phaseProximity } from '../src/modulation/phase-proximity.js';

describe('phase proximity', () => {
  test.each([
    [0, 0, 1],
    [0, 0.25, 0.5],
    [0, 0.5, 0],
    [0.99, 0.01, 0.96],
  ])('maps phases %f and %f to %f', (a, b, expected) => {
    expect(phaseProximity(a, b)).toBeCloseTo(expected, 10);
  });

  test('always remains in the normalized range', () => {
    for (let a = -2; a <= 2; a += 0.07) {
      const value = phaseProximity(a, a * 1.73);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
