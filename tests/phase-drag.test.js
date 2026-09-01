import { describe, expect, test } from 'vitest';
import { Clock } from '../src/timing/clock.js';

describe('phase dragging', () => {
  test('suppresses crossed events while dragging', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    clock.beginDrag(0.2, 120);
    clock.dragToPhase(0.95, 0.21);
    clock.dragToPhase(0.05, 0.22);

    expect(clock.eventsBetween(0.2, 1, 120)).toEqual([]);
  });

  test('release creates no event and the next genuine wrap resumes normally', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    clock.beginDrag(0.2, 120);
    clock.dragToPhase(0, 0.3);
    clock.endDrag(0.3);

    expect(clock.eventsBetween(0.3, 0.79, 120)).toEqual([]);
    expect(clock.eventsBetween(0.3, 0.8, 120)).toHaveLength(1);
  });

  test('beginning a drag cancels an active Home trajectory', () => {
    const clock = new Clock({ id: 'test' });
    clock.start(0);
    clock.setPhase(0.35, 0.2, 120);
    clock.startSoftHome(0.2, 120);
    clock.beginDrag(0.5, 120);

    expect(clock.homeOperation).toBeNull();
    expect(clock.dragging).toBe(true);
  });
});
