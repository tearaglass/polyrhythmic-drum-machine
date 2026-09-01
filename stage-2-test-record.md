# Stage 2 Test Record

## Environment

- Date: 2026-08-31
- Hardware: Apple M1 (`arm64`)
- Browser verification: Headless Chrome 152
- Web Audio sample rate: 44,100 Hz

## Automated verification

- `npm run test:run`: 56 tests passed across 13 files
- `npm run build`: passed
- All 32 original Stage 1 tests remain passing.
- SOFT HOME endpoint, forward velocity, curved wrap enumeration, completion, cancellation, Pause/Resume, and HARD RESET behavior passed.
- Phase dragging suppression and release behavior passed.
- Phase-proximity range, circular wrap, and modulation smoothing passed.
- Clock-follow phase continuity, curved SOFT HOME following, follower event enumeration, and cycle rejection passed.
- Clock A routes to the kick; Clock B remains silent while controlling phase-proximity and sidechain modulation.

## Browser verification

- Orbital view rendered from authoritative audio-time phase.
- Direct orbit dragging selected and displaced Clock A without a runtime error.
- Drift changed effective clock velocity.
- SOFT HOME exposed a temporary forward velocity and returned to the configured ratio.
- Synthesized percussion initialized and ran at a 44,100 Hz context sample rate.
- Quick clock-ratio controls changed the active ratios while running.
- With Clock B at `3:2` in FOLLOW mode, its measured frequency followed Clock A from 3.75 Hz at `5:4` to 4.2 Hz when Clock A changed to `7:5`.
- FOLLOW and SIDECHAIN exposed their active state without adding an audible Clock B voice.
- No page errors, application console errors, or Vite error overlay were reported.
- Automated accessibility audit reported zero violations and zero incomplete checks.

## Musical evaluation

- Initial routing of both clocks into one kick was rejected because the combined hits sounded doubled or flammed.
- Final routing decision: Clock A is always the kick; Clock B is silent and can follow Clock A while modulating its pitch, decay, transient, FM, and level.
- Final creator evaluation remains pending after listening to the revised routing.

## Still required for the Stage 2 acceptance gate

- Creator decision: `continue`, `revise`, or `stop`.
- Real two-hour representative browser/audio stability run.
- Manual listening check for phase-proximity audibility and output safety on the target machine.
