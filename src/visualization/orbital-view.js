import { CONFIG } from '../config.js';
import { phaseProximity } from '../modulation/phase-proximity.js';

const TAU = Math.PI * 2;

export class OrbitalView {
  constructor({ canvas, clocks, getAudioTime, getBpm, selectedClockIds }) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.clocks = clocks;
    this.getAudioTime = getAudioTime;
    this.getBpm = getBpm;
    this.selectedClockIds = selectedClockIds;
    this.pulses = new Map();
    this.animationFrame = null;
    this.geometry = null;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.width = bounds.width;
    this.height = bounds.height;

    const shortest = Math.min(bounds.width, bounds.height);
    this.geometry = {
      centerX: bounds.width / 2,
      centerY: bounds.height / 2,
      radii: [shortest * 0.21, shortest * 0.31, shortest * 0.405],
    };
  }

  start() {
    if (this.animationFrame) return;
    const draw = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(draw);
    };
    this.animationFrame = requestAnimationFrame(draw);
  }

  stop() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  pulse(event) {
    this.pulses.set(event.clockId, event.audioTime);
  }

  pointFor(clock, audioTime) {
    const index = this.clocks.indexOf(clock);
    const radius = this.geometry.radii[index];
    const phase = clock.phaseAt(audioTime, this.getBpm());
    const angle = phase * TAU - Math.PI / 2;
    return {
      x: this.geometry.centerX + Math.cos(angle) * radius,
      y: this.geometry.centerY + Math.sin(angle) * radius,
      radius,
      angle,
    };
  }

  phaseFromPoint(clientX, clientY) {
    const bounds = this.canvas.getBoundingClientRect();
    const x = clientX - bounds.left - this.geometry.centerX;
    const y = clientY - bounds.top - this.geometry.centerY;
    return ((Math.atan2(y, x) + Math.PI / 2) / TAU + 1) % 1;
  }

  clockAtPoint(clientX, clientY) {
    const bounds = this.canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    const audioTime = this.getAudioTime();
    let best = null;

    this.clocks.forEach((clock, index) => {
      const marker = this.pointFor(clock, audioTime);
      const markerDistance = Math.hypot(x - marker.x, y - marker.y);
      const centerDistance = Math.hypot(x - this.geometry.centerX, y - this.geometry.centerY);
      const orbitDistance = Math.abs(centerDistance - this.geometry.radii[index]);
      const distance = Math.min(markerDistance, orbitDistance + 8);
      if (distance <= 26 && (!best || distance < best.distance)) best = { clock, distance };
    });

    return best?.clock ?? null;
  }

  render() {
    const context = this.context;
    const audioTime = this.getAudioTime();
    const bpm = this.getBpm();
    context.clearRect(0, 0, this.width, this.height);

    const markers = this.clocks.map((clock, index) => {
      const marker = this.pointFor(clock, audioTime);
      const selected = this.selectedClockIds.has(clock.id);
      const activeHome = clock.isSoftHomeActiveAt(audioTime);
      const pulseAge = audioTime - (this.pulses.get(clock.id) ?? -Infinity);

      context.save();
      context.strokeStyle = CONFIG.visual.ink;
      context.fillStyle = CONFIG.visual.surface;
      context.lineWidth = selected ? 3 : 1;
      context.beginPath();
      context.arc(this.geometry.centerX, this.geometry.centerY, marker.radius, 0, TAU);
      context.stroke();

      context.lineWidth = activeHome ? 4 : 2;
      context.beginPath();
      context.moveTo(this.geometry.centerX, this.geometry.centerY - marker.radius - 8);
      context.lineTo(this.geometry.centerX, this.geometry.centerY - marker.radius + 8);
      context.stroke();

      if (clock.driftAmount !== 0) {
        context.setLineDash([3, 5]);
        context.lineWidth = 3;
        context.beginPath();
        context.arc(
          this.geometry.centerX,
          this.geometry.centerY,
          marker.radius,
          marker.angle - 0.22,
          marker.angle + 0.22,
        );
        context.stroke();
        context.setLineDash([]);
      }

      context.translate(marker.x, marker.y);
      context.rotate(marker.angle + Math.PI / 2);
      context.beginPath();
      if (selected) {
        context.moveTo(0, -11);
        context.lineTo(11, 0);
        context.lineTo(0, 11);
        context.lineTo(-11, 0);
        context.closePath();
      } else {
        context.arc(0, 0, 8, 0, TAU);
      }
      context.fill();
      context.stroke();

      if (pulseAge >= 0 && pulseAge < CONFIG.visual.pulseSeconds) {
        const expansion = 13 + (pulseAge / CONFIG.visual.pulseSeconds) * 18;
        context.globalAlpha = 1 - pulseAge / CONFIG.visual.pulseSeconds;
        context.beginPath();
        context.arc(0, 0, expansion, 0, TAU);
        context.stroke();
      }
      context.restore();

      context.save();
      context.fillStyle = CONFIG.visual.ink;
      context.font = '13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      context.textBaseline = 'middle';
      context.fillText(
        `${String.fromCharCode(65 + index)}  ${clock.ratio.numerator}:${clock.ratio.denominator}`,
        this.geometry.centerX + marker.radius + 14,
        this.geometry.centerY + (index - 1) * 18,
      );
      context.restore();
      return marker;
    });

    if (markers.length >= 2) {
      const proximity = phaseProximity(
        this.clocks[0].phaseAt(audioTime, bpm),
        this.clocks[1].phaseAt(audioTime, bpm),
      );
      context.save();
      context.globalAlpha = 0.08 + proximity * 0.52;
      context.strokeStyle = CONFIG.visual.ink;
      context.lineWidth = 1 + proximity * 4;
      context.beginPath();
      context.moveTo(markers[0].x, markers[0].y);
      context.lineTo(markers[1].x, markers[1].y);
      context.stroke();
      context.restore();
    }
  }
}
