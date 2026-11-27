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

  test('STOP during a suspension stays stopped when audio returns', () => {
    const timeline = new MasterTimeline();
    timeline.play(0);
    timeline.suspend(1);
    timeline.stop(2);
    expect(timeline.resumeFromSuspension(3)).toEqual({ playing: false, startedFromHome: false });
    expect(timeline.state).toBe('stopped');
  });

  test('PAUSE during a suspension resumes as paused', () => {
    const timeline = new MasterTimeline();
    timeline.play(0);
    timeline.suspend(1);
    timeline.pause(2);
    expect(timeline.resumeFromSuspension(3).playing).toBe(false);
    expect(timeline.state).toBe('paused');
    expect(timeline.positionAt(10)).toBeCloseTo(1);
  });

  test('PLAY during a suspension resumes playing once audio returns', () => {
    const timeline = new MasterTimeline();
    timeline.play(0);
    timeline.pause(1);
    timeline.suspend(1);
    timeline.armPlaybackOnResume();
    expect(timeline.resumeFromSuspension(3).playing).toBe(true);
    expect(timeline.isPlaying).toBe(true);
  });

  test('resume is a no-op when not suspended', () => {
    const timeline = new MasterTimeline();
    timeline.play(0);
    timeline.suspend(1);
    timeline.resumeFromSuspension(2);
    expect(timeline.resumeFromSuspension(5)).toEqual({ playing: false, startedFromHome: false });
    expect(timeline.positionAt(2.5)).toBeCloseTo(1.5);
  });
});
