# Stage 1 Test Record

## Environment

- Date: 2026-08-31
- Hardware: Apple M1 (`arm64`)
- macOS: 26.4.1
- Browser verification: Headless Chrome 152
- Web Audio sample rate: 44,100 Hz
- Runtime: Node.js 26.5.0

## Automated verification

- `npm run test:run`: 32 tests passed across 7 files
- `npm run build`: passed
- Mathematical two-hour span: passed for `3:2`, `5:4`, and `7:5`
- Rapid trajectory-change test: 500 live changes with bounded future-event bookkeeping

## Browser verification

- Page loaded at 1280×720 with no blank state or Vite error overlay.
- No page errors or application console errors were reported.
- Audio context initialized from a user gesture.
- `5:4` and `1:1` clocks produced scheduled events from the Web Audio timeline.
- Live ratio change from `5:4` to `7:3` preserved operation and invalidated old scheduling.
- Direct phase and drift changes updated the clock trajectory.
- HARD RESET, Pause, Resume, and Stop remained operational.
- Stop returned both clocks to normalized phase `0` and cycle count `0`.
- Clock phase continued advancing during a five-second background-tab check.
- Resizing from 1280×720 to 1440×900 did not reset clock state or trajectory versions.
- Automated accessibility audit: no violations after correcting document structure.

## Still required for the Stage 1 acceptance gate

- A real two-hour continuous browser/audio soak test has not yet been run.
- Computer sleep/wake behavior still requires manual testing in desktop Chrome.
- Audible event counts and output timing still require a human listening or recorded-audio check on the target machine.
