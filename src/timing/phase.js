export function positiveModulo(value, modulus = 1) {
  if (!Number.isFinite(value) || !Number.isFinite(modulus) || modulus <= 0) {
    throw new RangeError('Modulo inputs must be finite and the modulus must be positive.');
  }

  return ((value % modulus) + modulus) % modulus;
}

export function normalizePhase(value) {
  return positiveModulo(value, 1);
}

export function unwrappedPhaseAt(anchorPhase, frequency, elapsedSeconds) {
  return anchorPhase + frequency * elapsedSeconds;
}

export function circularPhaseDistance(a, b) {
  const difference = Math.abs(normalizePhase(a) - normalizePhase(b));
  return Math.min(difference, 1 - difference);
}

export function phaseProximity(a, b) {
  return 1 - 2 * circularPhaseDistance(a, b);
}

export function nearlyEqual(a, b, epsilon = 1e-9) {
  return Math.abs(a - b) <= epsilon;
}

// Returns every forward integer boundary crossed after start and through end.
export function forwardBoundaries(startPhase, endPhase, epsilon = 1e-9) {
  if (endPhase < startPhase) {
    throw new RangeError('Forward boundary search requires a non-decreasing phase.');
  }

  const boundaries = [];
  const first = Math.floor(startPhase + epsilon) + 1;
  const last = Math.floor(endPhase + epsilon);

  for (let boundary = first; boundary <= last; boundary += 1) {
    boundaries.push(boundary);
  }

  return boundaries;
}

export function solveForwardCrossing(phaseAtTime, boundary, startTime, endTime) {
  let low = startTime;
  let high = endTime;

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (phaseAtTime(midpoint) < boundary) low = midpoint;
    else high = midpoint;
  }

  return (low + high) / 2;
}
