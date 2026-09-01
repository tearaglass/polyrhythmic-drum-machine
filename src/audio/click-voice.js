export class ClickVoice {
  constructor(audioContext, destination, { frequency, duration, level }) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.frequency = frequency;
    this.duration = duration;
    this.level = level;
  }

  trigger(event) {
    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    const startTime = Math.max(event.audioTime, this.audioContext.currentTime);
    const endTime = startTime + this.duration;
    let cancelled = false;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(this.frequency, startTime);
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(this.level, startTime + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(envelope);
    envelope.connect(this.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.002);

    const cleanup = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.addEventListener('ended', cleanup, { once: true });

    return {
      clockId: event.clockId,
      trajectoryVersion: event.trajectoryVersion,
      startTime,
      endTime: endTime + 0.002,
      cancel() {
        if (cancelled) return;
        cancelled = true;
        try {
          oscillator.stop();
        } catch {
          cleanup();
        }
      },
    };
  }
}
