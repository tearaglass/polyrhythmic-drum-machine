export class AudioRecorder {
  constructor(audioContext, sourceNode) {
    if (!globalThis.MediaRecorder) throw new Error('Audio recording is unavailable in this browser.');
    this.destination = audioContext.createMediaStreamDestination();
    sourceNode.connect(this.destination);
    this.chunks = [];
    this.recorder = null;
  }

  start() {
    if (this.recorder?.state === 'recording') return false;
    this.chunks = [];
    const preferredType = 'audio/webm;codecs=opus';
    const options = MediaRecorder.isTypeSupported?.(preferredType) ? { mimeType: preferredType } : {};
    this.recorder = new MediaRecorder(this.destination.stream, options);
    this.recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) this.chunks.push(event.data);
    });
    this.recorder.start();
    return true;
  }

  stop() {
    if (this.recorder?.state !== 'recording') return Promise.resolve(null);
    return new Promise((resolve) => {
      this.recorder.addEventListener('stop', () => {
        resolve(new Blob(this.chunks, { type: this.recorder.mimeType || 'audio/webm' }));
      }, { once: true });
      this.recorder.stop();
    });
  }

  get isRecording() {
    return this.recorder?.state === 'recording';
  }
}
