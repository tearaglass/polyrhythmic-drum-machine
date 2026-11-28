import { describe, expect, test, vi } from 'vitest';
import { KickVoice } from '../src/audio/kick-voice.js';

function modulationParameter() {
  return {
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}

describe('kick proximity modulation', () => {
  test('leaves a scheduled hit on the proximity computed for its own start time', () => {
    const parameter = modulationParameter();
    const voice = new KickVoice({ currentTime: 0 }, null);
    voice.activeHits = [{
      startTime: 1,
      endTime: 2,
      modulationGain: { gain: parameter },
    }];

    voice.setProximity(0.5, 0);

    expect(parameter.cancelScheduledValues).not.toHaveBeenCalled();
    expect(parameter.setValueAtTime).not.toHaveBeenCalled();
    expect(parameter.setTargetAtTime).not.toHaveBeenCalled();
  });

  test('uses the hit-time proximity passed in rather than the live value', () => {
    const voice = new KickVoice({ currentTime: 0 }, null);
    voice.setProximity(0, 0);
    // 28 Hz base + 220 Hz * 0.5 amount * 1.0 proximity
    expect(voice.effectiveParametersAt(1, 1).fmDepthHz).toBe(138);
    expect(voice.effectiveParametersAt(1).fmDepthHz).toBe(28);
  });

  test('smooths modulation changes on an already sounding hit', () => {
    const parameter = modulationParameter();
    const voice = new KickVoice({ currentTime: 0.5 }, null);
    voice.activeHits = [{
      startTime: 0,
      endTime: 2,
      modulationGain: { gain: parameter },
    }];

    voice.setProximity(0.5, 0.5);

    expect(parameter.setTargetAtTime).toHaveBeenCalledWith(83, 0.5, 0.012);
  });

  test('clamps sidechain-modulated kick parameters to safe ranges', () => {
    const voice = new KickVoice({ currentTime: 0 }, null);
    voice.setSidechainConfig({
      enabled: true,
      amounts: { pitch: -1, decay: 1, transient: 1, fm: 1, level: -1 },
    });
    voice.sidechain.lastEventTime = 1;
    const effective = voice.effectiveParametersAt(1);

    expect(effective.pitch).toBeGreaterThanOrEqual(28);
    expect(effective.decay).toBeLessThanOrEqual(1.2);
    expect(effective.transient).toBeLessThanOrEqual(1);
    expect(effective.fmDepthHz).toBeLessThanOrEqual(440);
    expect(effective.level).toBeGreaterThanOrEqual(0);
  });
});
