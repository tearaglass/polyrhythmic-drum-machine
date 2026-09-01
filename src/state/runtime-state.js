import { Clock } from '../timing/clock.js';
import { MasterTimeline } from '../timing/master-timeline.js';
import { CONFIG } from '../config.js';

export function createRuntimeState(timeSource = () => 0) {
  const timeline = new MasterTimeline({ timeSource });
  const clocks = [
    new Clock({ id: 'clock-a', numerator: 5, denominator: 4 }),
    new Clock({ id: 'clock-b', numerator: 1, denominator: 1 }),
    new Clock({ id: 'clock-c', numerator: 1, denominator: 1, locked: true }),
  ];

  return {
    timeline,
    clocks,
    selectedClockIds: new Set(),
    pendingHomeBoundaryClockIds: new Set(),
    audioMode: 'kick',
    clockBControl: {
      follow: false,
      sidechain: false,
      amounts: { ...CONFIG.sidechain.amounts },
    },
    transport: 'stopped',
  };
}
