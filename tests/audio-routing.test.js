import { describe, expect, test, vi } from 'vitest';
import { AudioEngine } from '../src/audio/audio-engine.js';

function event(clockId, id, audioTime = 1) {
  return {
    id,
    clockId,
    audioTime,
    cycleIndex: 1,
    kind: 'normal-wrap',
    trajectoryVersion: 1,
  };
}

describe('Stage 2 audio routing', () => {
  test('routes each clock to its own click in two-click mode', () => {
    const engine = new AudioEngine();
    const clickA = { trigger: vi.fn(() => ({ clockId: 'clock-a' })) };
    const clickB = { trigger: vi.fn(() => ({ clockId: 'clock-b' })) };
    engine.clicks.set('clock-a', clickA);
    engine.clicks.set('clock-b', clickB);
    engine.setMode('clicks');

    expect(engine.routeEvent(event('clock-a', 'a:1'))).toEqual({ clockId: 'clock-a' });
    expect(engine.routeEvent(event('clock-b', 'b:1'))).toEqual({ clockId: 'clock-b' });
    expect(clickA.trigger).toHaveBeenCalledOnce();
    expect(clickB.trigger).toHaveBeenCalledOnce();
  });

  test('cancelling a click also withdraws its MIDI note', () => {
    const midiCancel = vi.fn();
    const soundCancel = vi.fn();
    const engine = new AudioEngine({ onClickEvent: () => ({ cancel: midiCancel }) });
    engine.clicks.set('clock-a', {
      trigger: () => ({ clockId: 'clock-a', startTime: 1, endTime: 1.1, cancel: soundCancel }),
    });
    engine.setMode('clicks');

    const handle = engine.routeEvent(event('clock-a', 'a:1'));
    expect(handle.clockId).toBe('clock-a');
    expect(handle.startTime).toBe(1);
    handle.cancel();

    expect(soundCancel).toHaveBeenCalledOnce();
    expect(midiCancel).toHaveBeenCalledOnce();
  });

  test('delays alternating click events by the configured swing amount', () => {
    const engine = new AudioEngine({ getClockFrequency: () => 2 });
    const click = { trigger: vi.fn((scheduledEvent) => scheduledEvent) };
    engine.clicks.set('clock-a', click);
    engine.setMode('clicks');
    engine.setClickSwing(0.4);

    engine.routeEvent(event('clock-a', 'a:1', 1));
    engine.routeEvent({ ...event('clock-a', 'a:2', 2), cycleIndex: 2 });

    expect(click.trigger.mock.calls[0][0].audioTime).toBeCloseTo(1.1);
    expect(click.trigger.mock.calls[1][0].audioTime).toBe(2);
  });

  test('keeps Clock B silent while preserving its temporal event', () => {
    const temporalEvent = vi.fn();
    const engine = new AudioEngine({ getProximity: () => 0.75, onTemporalEvent: temporalEvent });
    engine.context = { currentTime: 0 };
    engine.kick = {
      applySidechain: vi.fn(),
      setProximity: vi.fn(),
      trigger: vi.fn(),
    };
    const handle = engine.routeEvent(event('clock-b', 'b:1', 1));

    expect(handle).toBeNull();
    expect(temporalEvent).toHaveBeenCalledOnce();
    expect(engine.kick.applySidechain).toHaveBeenCalledWith(1);
    expect(engine.kick.trigger).not.toHaveBeenCalled();
  });

  test('routes straight Clock C to the beater impact only in kick mode', () => {
    const engine = new AudioEngine();
    engine.beater = { trigger: vi.fn(() => ({ clockId: 'clock-c' })) };

    expect(engine.routeEvent(event('clock-c', 'c:1'))).toEqual({ clockId: 'clock-c' });
    expect(engine.beater.trigger).toHaveBeenCalledOnce();

    engine.setMode('clicks');
    expect(engine.routeEvent(event('clock-c', 'c:2'))).toBeNull();
    expect(engine.beater.trigger).toHaveBeenCalledOnce();
  });

  test('routes Clock A to the synthesized kick', () => {
    const soundCancel = vi.fn();
    const engine = new AudioEngine({ getProximity: () => 0.75 });
    engine.context = { currentTime: 0 };
    engine.kick = {
      setProximity: vi.fn(),
      trigger: vi.fn(() => ({ startTime: 1, endTime: 1.3, cancel: soundCancel })),
    };

    const handleA = engine.routeEvent(event('clock-a', 'a:1', 1));

    expect(engine.kick.trigger).toHaveBeenCalledOnce();
    expect(engine.kick.trigger.mock.calls[0][1]).toBe(0.75);
    expect(engine.kick.setProximity).not.toHaveBeenCalled();
    expect(engine.scheduledHits[0].contributors.size).toBe(1);
    handleA.cancel();
    expect(soundCancel).toHaveBeenCalledOnce();
  });
});
