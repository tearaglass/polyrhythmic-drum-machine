import { describe, expect, test } from 'vitest';
import { MasterTimeline } from '../src/timing/master-timeline.js';

describe('master timeline', () => {
  test('converts BPM to one reference cycle per quarter-note beat', () => {
    expect(new MasterTimeline({ bpm: 120 }).frequency).toBe(2);
    expect(new MasterTimeline({ bpm: 60 }).frequency).toBe(1);
  });

  test('play from Home reports the initial temporal boundary once', () => {
    const timeline = new MasterTimeline();
    expect(timeline.play(0)).toEqual({ startedFromHome: true });
    timeline.pause(0.5);
    expect(timeline.play(1)).toEqual({ startedFromHome: false });
  });

  test('pause and resume preserve musical position', () => {
    const timeline = new MasterTimeline();
    timeline.play(2);
    timeline.pause(3.25);
    expect(timeline.positionAt(9)).toBeCloseTo(1.25);
    timeline.play(10);
    expect(timeline.positionAt(10.5)).toBeCloseTo(1.75);
  });

  test('stop returns to Home and arms the initial event', () => {
    const timeline = new MasterTimeline();
    timeline.play(0);
    timeline.stop(1);
    expect(timeline.positionAt(2)).toBe(0);
    expect(timeline.play(2)).toEqual({ startedFromHome: true });
  });

  test('audio suspension freezes time and does not catch up', () => {
    const timeline = new MasterTimeline();
    timeline.play(0);
    timeline.suspend(1.5);
    expect(timeline.positionAt(100)).toBeCloseTo(1.5);
    timeline.resumeFromSuspension(100);
    expect(timeline.positionAt(100.25)).toBeCloseTo(1.75);
  });
});
