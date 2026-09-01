import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';

describe('drift', () => {
  test('uses a relative frequency offset', () => {
    const reference = new Clock({ id: 'reference' });
    const drifting = new Clock({ id: 'drifting' });
    reference.start(0);
    drifting.start(0);
    drifting.setDrift(0.01, 0, 120);

    const relativePhase = drifting.unwrappedPhaseAt(10, 120) - reference.unwrappedPhaseAt(10, 120);
    expect(relativePhase).toBeCloseTo(0.2, 10);
  });

  test('changing and stopping drift preserve phase', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    clock.setDrift(0.05, 0.5, 120);
    const beforeStop = clock.unwrappedPhaseAt(1.5, 120);
    clock.setDrift(0, 1.5, 120);

    expect(clock.unwrappedPhaseAt(1.5, 120)).toBeCloseTo(beforeStop);
    expect(clock.unwrappedPhaseAt(2, 120) - beforeStop).toBeCloseTo(1);
  });
});
