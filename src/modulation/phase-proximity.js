import { circularPhaseDistance } from '../timing/phase.js';

export function phaseProximity(a, b) {
  return 1 - 2 * circularPhaseDistance(a, b);
}
