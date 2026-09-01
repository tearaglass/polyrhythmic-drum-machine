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
  test('updates a scheduled hit at its future start without disturbing its onset', () => {
    const parameter = modulationParameter();
    const voice = new KickVoice({ currentTime: 0 }, null);
    voice.activeHits = [{
      startTime: 1,
      endTime: 2,
      modulationGain: { gain: parameter },
    }];

    voice.setProximity(0.5, 0);

    expect(parameter.cancelScheduledValues).toHaveBeenCalledWith(1);
    expect(parameter.setValueAtTime).toHaveBeenCalledWith(83, 1);
    expect(parameter.setTargetAtTime).not.toHaveBeenCalled();
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
