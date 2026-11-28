import { CONFIG } from '../config.js';

// Converts an AudioContext time into the performance.now() time at which that
// sample is actually heard, so MIDI lines up with the speakers, not the scheduler.
export function audioTimeToPerformanceTime(audioTime, audioContext, offsetMs = 0) {
  const stamp = audioContext.getOutputTimestamp?.();
  if (stamp && stamp.performanceTime > 0) {
    // contextTime here already trails currentTime by the output latency.
    return stamp.performanceTime + (audioTime - stamp.contextTime) * 1000 + offsetMs;
  }
  const latency = (audioContext.baseLatency || 0) + (audioContext.outputLatency || 0);
  return performance.now() + (audioTime - audioContext.currentTime + latency) * 1000 + offsetMs;
}

export class MidiOutput {
  constructor() {
    this.access = null;
    this.output = null;
    this.notes = { 'clock-a': 36, 'clock-b': 37 };
    this.channel = 1;
    // Messages handed to the browser with a future timestamp. Web MIDI cannot
    // recall a single message, so cancelling one means clear() + resend the rest.
    this.queued = [];
  }

  async connect() {
    if (!navigator.requestMIDIAccess) throw new Error('Web MIDI is unavailable in this browser.');
    this.access = await navigator.requestMIDIAccess();
    this.access.addEventListener('statechange', () => this.onOutputsChange?.(this.outputs));
    return this.outputs;
  }

  get outputs() {
    return this.access ? [...this.access.outputs.values()] : [];
  }

  selectOutput(id) {
    this.output = this.access?.outputs.get(id) ?? null;
    this.queued = [];
  }

  setNotes(clockA, clockB) {
    this.notes['clock-a'] = Math.min(127, Math.max(0, Number(clockA) || 0));
    this.notes['clock-b'] = Math.min(127, Math.max(0, Number(clockB) || 0));
  }

  setChannel(channel) {
    this.channel = Math.min(16, Math.max(1, Number(channel) || 1));
  }

  // Queues a note-on/note-off pair. Returns a handle whose cancel() withdraws
  // the note if it has not been sent to the wire yet.
  send(event, audioContext) {
    if (!this.output || !audioContext) return null;
    const note = this.notes[event.clockId];
    if (note === undefined) return null;

    const onTime = audioTimeToPerformanceTime(event.audioTime, audioContext, CONFIG.midi.offsetMs);
    const status = 0x90 + (this.channel - 1);
    const entry = {
      output: this.output,
      messages: [
        { data: [status, note, CONFIG.midi.velocity], timestamp: onTime },
        { data: [status, note, 0], timestamp: onTime + CONFIG.midi.noteLengthMs },
      ],
    };
    for (const message of entry.messages) this.output.send(message.data, message.timestamp);
    this.prune();
    this.queued.push(entry);

    return { cancel: () => this.cancel(entry) };
  }

  cancel(entry) {
    const nowMs = performance.now();
    this.prune(nowMs);
    if (!this.queued.includes(entry)) return;
    this.queued = this.queued.filter((candidate) => candidate !== entry);

    // Only safe to withdraw while the note-on is still in the future.
    if (entry.messages[0].timestamp <= nowMs) return;
    if (typeof entry.output.clear !== 'function') return; // TODO: browsers without clear() still play it.

    entry.output.clear();
    for (const queuedEntry of this.queued) {
      if (queuedEntry.output !== entry.output) continue;
      for (const message of queuedEntry.messages) {
        if (message.timestamp > nowMs) queuedEntry.output.send(message.data, message.timestamp);
      }
    }
  }

  // Forget entries whose last message has already gone out.
  prune(nowMs = performance.now()) {
    this.queued = this.queued.filter((entry) => entry.messages.at(-1).timestamp > nowMs);
  }
}
