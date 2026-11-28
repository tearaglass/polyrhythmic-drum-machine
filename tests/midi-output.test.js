import { afterEach, describe, expect, test, vi } from 'vitest';
import { MidiOutput, audioTimeToPerformanceTime } from '../src/midi/midi-output.js';

function fakeOutput() {
  return { send: vi.fn(), clear: vi.fn() };
}

function clickEvent(audioTime, clockId = 'clock-a') {
  return { clockId, audioTime };
}

describe('MIDI timing', () => {
  afterEach(() => vi.restoreAllMocks());

  test('maps audio time through the output timestamp so latency is included', () => {
    const context = {
      currentTime: 10.02,
      getOutputTimestamp: () => ({ contextTime: 10, performanceTime: 5000 }),
    };
    expect(audioTimeToPerformanceTime(10.1, context)).toBeCloseTo(5100);
  });

  test('falls back to currentTime plus reported latency', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const context = { currentTime: 2, baseLatency: 0.005, outputLatency: 0.015 };
    expect(audioTimeToPerformanceTime(2.1, context)).toBeCloseTo(1120);
  });
});

describe('MIDI cancellation', () => {
  afterEach(() => vi.restoreAllMocks());

  function setup() {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    const midi = new MidiOutput();
    midi.output = fakeOutput();
    const context = { currentTime: 0 };
    return { midi, context };
  }

  test('cancelling a future note clears the port and resends the others', () => {
    const { midi, context } = setup();
    const first = midi.send(clickEvent(0.05), context);
    midi.send(clickEvent(0.08, 'clock-b'), context);
    midi.output.send.mockClear();

    first.cancel();

    expect(midi.output.clear).toHaveBeenCalledOnce();
    const resent = midi.output.send.mock.calls.map(([data]) => data[1]);
    expect(resent).toEqual([37, 37]);
  });

  test('a note already sent cannot be cancelled and does not clear the port', () => {
    const { midi, context } = setup();
    const handle = midi.send(clickEvent(0.05), context);
    performance.now.mockReturnValue(60);
    handle.cancel();
    expect(midi.output.clear).not.toHaveBeenCalled();
  });

  test('cancel is safe to call twice', () => {
    const { midi, context } = setup();
    const handle = midi.send(clickEvent(0.05), context);
    handle.cancel();
    handle.cancel();
    expect(midi.output.clear).toHaveBeenCalledOnce();
  });
});
