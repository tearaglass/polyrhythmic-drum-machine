import { normalizePhase } from './phase.js';

export function smoothstep(value) {
  const s = Math.min(1, Math.max(0, value));
  return 3 * s * s - 2 * s * s * s;
}

export function smoothstepDerivative(value) {
  const s = Math.min(1, Math.max(0, value));
  return 6 * s - 6 * s * s;
}

export function phaseOnSoftHome(trajectory, audioTime) {
  const { startTime, endTime, startPhase, baseFrequency, correction, targetPhase } = trajectory;

  if (audioTime <= startTime) {
    return startPhase + baseFrequency * (audioTime - startTime);
  }
  if (audioTime >= endTime) {
    return targetPhase + baseFrequency * (audioTime - endTime);
  }

  const elapsed = audioTime - startTime;
  const s = elapsed / trajectory.duration;
  return startPhase + baseFrequency * elapsed + correction * smoothstep(s);
}

export function velocityOnSoftHome(trajectory, audioTime) {
  if (audioTime <= trajectory.startTime || audioTime >= trajectory.endTime) {
    return trajectory.baseFrequency;
  }

  const s = (audioTime - trajectory.startTime) / trajectory.duration;
  return trajectory.baseFrequency
    + (trajectory.correction / trajectory.duration) * smoothstepDerivative(s);
}

function minimumVelocity(baseFrequency, correction, duration) {
  if (correction >= 0) return baseFrequency;
  return baseFrequency + (1.5 * correction) / duration;
}

export function createSoftHomeTrajectory({
  startPhase,
  baseFrequency,
  startTime,
  duration,
  homePhase = 0,
  epsilon = 1e-9,
}) {
  if (!Number.isFinite(startPhase) || !Number.isFinite(startTime)) {
    throw new RangeError('SOFT HOME requires finite phase and time values.');
  }
  if (!Number.isFinite(baseFrequency) || baseFrequency <= 0) {
    throw new RangeError('SOFT HOME requires a positive clock frequency.');
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError('SOFT HOME duration must be positive.');
  }

  const normalizedHome = normalizePhase(homePhase);
  const uncorrectedEnd = startPhase + baseFrequency * duration;
  const nearestCycle = Math.round(uncorrectedEnd - normalizedHome);

  for (let offset = 0; offset < 10_000; offset += 1) {
    const targetPhase = normalizedHome + nearestCycle + offset;
    const correction = targetPhase - uncorrectedEnd;
    const minVelocity = minimumVelocity(baseFrequency, correction, duration);

    if (targetPhase > startPhase && minVelocity > epsilon) {
      return {
        startTime,
        endTime: startTime + duration,
        duration,
        startPhase,
        baseFrequency,
        targetPhase,
        correction,
        minVelocity,
        pausedAt: null,
      };
    }
  }

  throw new RangeError('SOFT HOME could not find a forward-only target cycle.');
}

export function solveSoftHomeCrossing(trajectory, boundary, startTime, endTime) {
  let low = startTime;
  let high = endTime;

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (phaseOnSoftHome(trajectory, midpoint) < boundary) low = midpoint;
    else high = midpoint;
  }

  return (low + high) / 2;
}
