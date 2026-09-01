import { describe, expect, test } from 'vitest';
import {
  circularPhaseDistance,
  forwardBoundaries,
  normalizePhase,
  phaseProximity,
  positiveModulo,
  unwrappedPhaseAt,
} from '../src/timing/phase.js';

describe('phase utilities', () => {
  test('normalizes positive and negative phase values', () => {
    expect(positiveModulo(-0.25)).toBeCloseTo(0.75);
    expect(normalizePhase(2.25)).toBeCloseTo(0.25);
  });

  test('calculates unwrapped phase without frame accumulation', () => {
    expect(unwrappedPhaseAt(0.25, 2.5, 4)).toBeCloseTo(10.25);
  });

  test('uses circular distance across phase wrap', () => {
    expect(circularPhaseDistance(0.99, 0.01)).toBeCloseTo(0.02);
    expect(phaseProximity(0.99, 0.01)).toBeCloseTo(0.96);
    expect(phaseProximity(0, 0.5)).toBeCloseTo(0);
  });

  test('finds forward wrap boundaries and excludes the starting boundary', () => {
    expect(forwardBoundaries(0.25, 3.1)).toEqual([1, 2, 3]);
    expect(forwardBoundaries(1, 2)).toEqual([2]);
  });
});
