export class PhaseDrag {
  constructor({ canvas, orbitalView, getAudioTime, getBpm, onSelect, onTrajectoryChange }) {
    this.canvas = canvas;
    this.orbitalView = orbitalView;
    this.getAudioTime = getAudioTime;
    this.getBpm = getBpm;
    this.onSelect = onSelect;
    this.onTrajectoryChange = onTrajectoryChange;
    this.activeClock = null;
    this.pointerId = null;

    canvas.addEventListener('pointerdown', (event) => this.pointerDown(event));
    canvas.addEventListener('pointermove', (event) => this.pointerMove(event));
    canvas.addEventListener('pointerup', (event) => this.pointerUp(event));
    canvas.addEventListener('pointercancel', (event) => this.pointerUp(event));
  }

  pointerDown(event) {
    const clock = this.orbitalView.clockAtPoint(event.clientX, event.clientY);
    if (!clock) return;

    event.preventDefault();
    this.activeClock = clock;
    this.pointerId = event.pointerId;
    this.onSelect(clock.id);
    const audioTime = this.getAudioTime();
    clock.beginDrag(audioTime, this.getBpm());
    clock.dragToPhase(this.orbitalView.phaseFromPoint(event.clientX, event.clientY), audioTime);
    this.onTrajectoryChange(clock, audioTime);
    this.canvas.setPointerCapture?.(event.pointerId);
  }

  pointerMove(event) {
    if (!this.activeClock || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.activeClock.dragToPhase(
      this.orbitalView.phaseFromPoint(event.clientX, event.clientY),
      this.getAudioTime(),
    );
  }

  pointerUp(event) {
    if (!this.activeClock || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const audioTime = this.getAudioTime();
    this.activeClock.endDrag(audioTime, this.getBpm());
    this.onTrajectoryChange(this.activeClock, audioTime);
    this.canvas.releasePointerCapture?.(event.pointerId);
    this.activeClock = null;
    this.pointerId = null;
  }
}
