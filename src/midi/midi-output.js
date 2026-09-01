export class MidiOutput {
  constructor() {
    this.access = null;
    this.output = null;
    this.notes = { 'clock-a': 36, 'clock-b': 37 };
    this.channel = 1;
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
  }

  setNotes(clockA, clockB) {
    this.notes['clock-a'] = Math.min(127, Math.max(0, Number(clockA) || 0));
    this.notes['clock-b'] = Math.min(127, Math.max(0, Number(clockB) || 0));
  }

  setChannel(channel) {
    this.channel = Math.min(16, Math.max(1, Number(channel) || 1));
  }

  send(event, audioContext) {
    if (!this.output || !audioContext) return;
    const note = this.notes[event.clockId];
    const timestamp = performance.now() + Math.max(0, event.audioTime - audioContext.currentTime) * 1000;
    const status = 0x90 + (this.channel - 1);
    this.output.send([status, note, 100], timestamp);
    this.output.send([status, note, 0], timestamp + 24);
  }
}
