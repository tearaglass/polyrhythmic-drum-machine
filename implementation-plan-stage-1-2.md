# Full Project Roadmap with Stage 1 and Stage 2 Implementation Plan

## Scope

This document contains:

- A detailed implementation plan for **Stage 1 — Timing Spike**.
- A detailed implementation plan for **Stage 2 — Thesis Prototype**.
- A high-level architectural roadmap for **Stages 3–11**.
- A parallel **Research Track** for experimental temporal ideas.

Stages 3–11 provide orientation only. They do not authorize implementation and contain no implementation task lists, algorithms, file changes, estimates, or acceptance tests.

The authoritative inputs are:

- `Locked Timing Semantics Addendum.md`
- `prebuild-answers-1.txt`
- `Prebuild Questions 1–38.md` through `Prebuild Questions 295–338.md`
- `Polyrhythmic Drum Synth — MVP Product Spec.md`
- `Polyrhythmic Drum Synth — Full Product Spec.md`
- `AGENTS.md`

When documents differ, the locked timing addendum controls timing behavior and `AGENTS.md` controls repository, preservation, and interface decisions.

## Stage boundary

### Stage 1 proves

- Clock calculations are mathematically correct.
- Scheduled events remain stable on the Web Audio timeline.
- Ratios, phase changes, drift, and HARD RESET behave as specified.
- Timing behavior is testable without relying on the interface or listening alone.

### Stage 2 proves

- Two clock relationships can be understood through an orbital view.
- Phase can be manipulated directly without accidental retriggering.
- Drift is musically useful.
- Phase proximity can change percussion timbre audibly.
- HARD RESET and SOFT HOME form a compelling leave-and-return performance gesture.

### Explicit stopping point

After Stage 2, stop and evaluate the thesis demonstration. Do not proceed automatically into Stage 3 or any later roadmap stage. Each later stage requires a separate decision and implementation-planning pass.

---

# Shared technical foundation

## Proposed development stack

- Plain JavaScript using ES modules
- HTML and CSS for the small browser shell
- Web Audio API for audio time, scheduling, and synthesis
- Canvas 2D for the Stage 2 orbital visualization
- Vite for a small local development server and hot reload
- Vitest for deterministic unit tests
- No UI framework
- No remote runtime assets or CDN dependencies

Vite and Vitest are development dependencies only. The built browser files should run without an internet connection.

## Proposed file structure

Files are introduced only when their stage needs them.

```text
package.json
vite.config.js
index.html
src/
  main.js
  config.js
  timing/
    clock.js
    master-timeline.js
    scheduler.js
    phase.js
    soft-home.js              # Stage 2
  audio/
    audio-engine.js
    click-voice.js            # Stage 1
    kick-voice.js             # Stage 2
    output-stage.js
  modulation/
    phase-proximity.js        # Stage 2
  visualization/
    orbital-view.js           # Stage 2
  input/
    phase-drag.js             # Stage 2
  state/
    runtime-state.js
  debug/
    diagnostics.js
  styles/
    base.css
tests/
  clock.test.js
  phase.test.js
  scheduler.test.js
  transport.test.js
  hard-reset.test.js
  drift.test.js
  soft-home.test.js           # Stage 2
  phase-proximity.test.js     # Stage 2
```

This structure keeps timing, audio, visualization, and input separate without creating a generalized framework.

## Core data boundaries

### Clock

A clock is a continuous temporal phase source. It does not contain a sound generator or DOM state.

Initial clock state:

```js
{
  id,
  ratio: {
    numerator,
    denominator
  },
  homePhase,
  anchorPhase,
  anchorAudioTime,
  cycleCount,
  driftAmount,
  running,
  dragging,
  trajectoryVersion
}
```

Important rules:

- Preserve the entered numerator and denominator.
- Do not automatically replace `6:4` with `3:2`.
- Use stable internal IDs unrelated to UI labels.
- Store phase as a normalized cycle fraction.
- Calculate current phase from an audio-time anchor rather than incrementing phase once per frame.
- Keep unwrapped phase available for event generation, cycle counting, drift, and SOFT HOME.

### Master timeline

The master timeline owns transport state and converts BPM into reference frequency.

```text
masterFrequency = bpm / 60
localBaseFrequency = masterFrequency × numerator / denominator
```

At 120 BPM, the master completes two cycles per second. One master cycle is one quarter-note beat.

The timeline freezes musical time during Pause, browser audio suspension, or computer sleep. It must not catch up missed events after resuming.

### Temporal event

A temporal event is data produced when a clock crosses a forward wrap boundary.

```js
{
  id,
  clockId,
  audioTime,
  cycleIndex,
  kind,                 // normal-wrap or reset-boundary
  trajectoryVersion
}
```

The event does not assume a sound destination. Stage 1 may route it to a click for testing, but the timing layer remains independent.

### Audio destination

An audio destination accepts a temporal event and decides whether to create sound. It does not advance or modify the originating clock.

### Runtime state

Runtime state holds clock configuration, routing used by the current stage, transport state, and selected clock IDs. Audio nodes, DOM elements, and Canvas objects are not serialized into it.

No persistence is required in either stage.

## Scheduling approach

Use a short repeating JavaScript wake-up only to fill a future Web Audio event queue. The repeating timer is not the musical clock.

Provisional scheduling values should live in `src/config.js` so tests can adjust them:

```js
{
  schedulerIntervalMs: 25,
  scheduleAheadSeconds: 0.1
}
```

On every scheduler pass:

1. Read `audioContext.currentTime`.
2. Determine the scheduling horizon.
3. Ask each running clock for all wrap events inside that audio-time range.
4. Store diagnostic event data.
5. Route events to the current stage's audio destination.
6. Move the scheduler cursor to the end of the processed range.

All audible nodes receive absolute Web Audio start times. `setInterval()` and `requestAnimationFrame()` never determine event timing.

## Trajectory invalidation

Ratio changes, phase changes, drift changes, HARD RESET, phase dragging, and SOFT HOME alter a clock's future trajectory.

Each clock has a monotonically increasing `trajectoryVersion`.

When a trajectory changes:

1. Capture the clock's exact current unwrapped phase at the authoritative audio time.
2. Increment `trajectoryVersion`.
3. Cancel not-yet-started audio nodes created from older versions when possible.
4. Discard queued temporal events carrying older versions.
5. Reset that clock's scheduler cursor to the change time.
6. Schedule new events from the updated trajectory.

Already-produced audio is never altered. Keeping the scheduling horizon short limits the amount of future material that must be cancelled.

Each scheduled click or voice instance must retain a small cancellation handle containing its clock ID, trajectory version, start time, source nodes, and cleanup function.

## Phase calculations

For a constant forward frequency:

```text
unwrappedPhase(t) = anchorPhase + frequency × (t - anchorAudioTime)
phase(t) = modulo(unwrappedPhase(t), 1)
```

Use a positive modulo helper so phase always remains in `[0, 1)`.

Live ratio changes preserve phase:

1. Calculate current unwrapped phase under the old rate.
2. Make it the new anchor phase at the current audio time.
3. Change the ratio.
4. Invalidate the prior trajectory.

## Drift calculation

For these stages, drift is a small relative offset from the configured ratio frequency:

```text
effectiveFrequency = baseFrequency × (1 + driftAmount)
```

`driftAmount = 0` means no drift. The allowable prototype range belongs in configuration and should be tuned by listening; it is not a permanent product range.

Changing or disabling drift preserves current phase and only changes the future rate.

## Raw clock events

- A forward clock produces one normal event at every `1 → 0` wrap.
- Starting transport from Home emits one event immediately at the start audio time.
- Resuming from Pause continues from the frozen phase and does not create a special event.
- Releasing phase drag creates no event by itself, including when released at phase zero.
- The subsequent genuine forward wrap produces the next normal event.

## HARD RESET

HARD RESET is available while playing or paused.

When invoked:

1. Capture the authoritative audio time.
2. Invalidate affected future trajectories and scheduled audio.
3. Set targeted phases to their configured Home phases.
4. Reset cycle counters and accumulated drift.
5. Cancel active Home operations.
6. Emit one reset-boundary temporal event per targeted clock when transport is running.
7. Continue forward from Home using the configured ratio.

When transport is paused, reset state but do not produce sound; the next Play begins from Home according to the normal playback-from-Home rule.

## Diagnostics

Diagnostics should be data-first and removable from normal builds. Stage 1 may display them through the browser console or a plain development panel.

Track at least:

- Audio context state and sample rate
- Master BPM and transport state
- Scheduler pass time and scheduling horizon
- Scheduled event time versus calculated expected time
- Clock unwrapped phase, normalized phase, frequency, and cycle count
- Clock trajectory version
- Pending scheduled-audio count
- Event invalidations and cancellations
- Maximum and average scheduling lateness
- Visual frame rate in Stage 2

Do not log every scheduler pass indefinitely during soak tests. Use bounded rolling measurements.

---

# Stage 1 — Timing Spike

## Stage 1 outcome

A plain browser development page can run a master clock and two derived clocks, schedule distinct clicks, change their temporal relationships live, and produce numerical evidence that timing remains correct.

No drum synthesis or designed musical interface is included.

## Stage 1 implementation steps

### 1. Project shell

Create the minimal Vite/Vitest project and confirm:

- Development server opens in current desktop Chrome.
- Production build completes.
- Test runner executes one trivial test.
- No runtime request depends on an external CDN.

### 2. Pure phase utilities

Implement and test:

- Positive modulo
- Wrapped normalized phase
- Unwrapped phase calculation
- Circular phase distance
- Boundary-crossing calculations
- Floating-point epsilon helpers used only for comparisons

These utilities must not import browser, audio, or UI modules.

### 3. Master timeline

Implement:

- BPM configuration from 20–300 BPM
- `masterFrequency = bpm / 60`
- Play from Home
- Pause preserving phase
- Resume from frozen phase
- Stop returning to Home
- Audio suspension/resume mapping that freezes musical time

Use a controllable test time source so unit tests do not wait in real time.

### 4. Clock model

Implement two derived clocks with:

- Positive integer numerator and denominator
- Preserved unreduced ratio representation
- Current normalized and unwrapped phase
- Cycle count
- Running state
- Phase offset
- Drift amount
- Trajectory version
- Event enumeration for any requested audio-time window

Reject zero or negative Stage 1 ratio components cleanly. Do not implement reverse or free-running clocks.

### 5. Deterministic event planner

Before connecting Web Audio, create a pure event-planning layer that returns expected temporal events for a time range.

Test shared-span relationships:

- `3:2`
- `5:4`
- `7:5`
- `6:4` retaining its entered form while matching `3:2` frequency

For a shared duration `T`, verify exact expected event spacing within floating-point tolerance.

### 6. Web Audio click path

Implement:

- User-initiated audio-context startup
- One light click/beep destination per clock with audibly distinct pitch
- Absolute-time event scheduling
- Conservative master gain
- Basic output protection
- Scheduled-node cleanup
- Future-node cancellation handles

The click synthesizer exists only to hear timing. Keep it separate from the Stage 2 kick voice.

### 7. Scheduler

Connect the pure event planner to the Web Audio timeline.

Verify:

- Scheduler wake-up jitter does not change intended audio timestamps.
- Duplicate scheduler passes do not schedule duplicate events.
- Late scheduler passes are detected and reported.
- Event queue and audio-node bookkeeping remain bounded.

### 8. Live ratio and tempo changes

Implement phase-preserving live changes.

Test that:

- Current phase is continuous across a ratio change.
- Future wrap spacing reflects the new ratio.
- Tempo changes preserve every clock's phase.
- Old scheduled events are invalidated.
- Rapid repeated changes do not create duplicates or orphan unbounded nodes.

### 9. Phase offset

Implement direct phase setting as a normalized fraction of the clock's cycle.

For Stage 1, a plain development control or console call is sufficient.

Verify:

- Phase changes are immediate.
- Crossed boundaries do not produce unintended events.
- Future wraps are rescheduled from the new phase.
- Tempo changes preserve the normalized offset.

### 10. Drift

Implement indefinite forward drift through the relative frequency offset.

Verify numerically:

- Expected relative phase after known elapsed time
- Correct wrap behavior
- Phase continuity when drift starts, changes, or stops
- No cumulative error from frame-by-frame phase accumulation

### 11. HARD RESET

Implement the locked reset-boundary semantics.

Verify while running:

- Both phases immediately return Home.
- Cycle counters and drift reset.
- One reset-boundary event appears per targeted clock.
- Future events from the old trajectory do not fire.
- Ratios remain unchanged.

Verify while paused:

- Temporal state resets.
- No sound is emitted.
- The next Play produces the normal initial Home event.

### 12. Minimal developer controls

Expose only what is needed to operate and diagnose Stage 1:

- Audio initialization
- Play, Pause, Stop, and HARD RESET
- BPM
- Two ratio entries
- Two phase values
- Two drift values
- Live diagnostic values

This is disposable technical UI, not the product interface. Do not introduce a project name, lore, decorative copy, custom visual identity, or bespoke controls.

### 13. Automated timing suite

The Stage 1 suite must cover:

- BPM-to-frequency conversion
- Ratio-to-frequency conversion
- Event times for reference ratios
- Unreduced ratio preservation
- Phase normalization and wraparound
- Live ratio change continuity
- Tempo change continuity
- Phase-offset changes
- Drift trajectory
- Play-from-Home event
- Pause/resume behavior
- Stop behavior
- HARD RESET while running
- HARD RESET while paused
- Trajectory invalidation
- Duplicate-event prevention
- Audio-suspension musical-time freeze using the fake time source

### 14. Manual timing checks

Perform a short manual run in Chrome:

1. Initialize audio.
2. Start both clocks at `5:4` and `1:1`.
3. Confirm five high clicks occur during the same four-beat span as four reference clicks.
4. Change live to `7:3` without a phase jump.
5. Change phase.
6. Enable and disable drift.
7. Invoke HARD RESET repeatedly.
8. Pause and resume.
9. Stop and restart from Home.
10. Background the tab and confirm audible timing continues.
11. Suspend/resume audio and confirm missed events are not replayed.

### 15. Stability check

Run an automated or instrumented two-hour Stage 1 soak test with bounded diagnostics.

Check:

- No cumulative phase error against calculated clock state
- No steadily growing event queue
- No steadily growing scheduled-node registry
- No duplicate events
- No scheduler halt
- No runaway console logging

The two-hour soak can run after the functional tests pass; it must pass before Stage 1 is declared complete.

## Stage 1 acceptance gate

Stage 1 is complete only when:

- Automated tests pass.
- `5:4`, `3:2`, and `7:5` timestamps match calculated expectations.
- Live ratio, phase, tempo, and drift changes preserve phase correctly.
- HARD RESET follows the reset-boundary rule.
- Browser audio stays stable in the two-hour soak test.
- Diagnostics show no unbounded scheduler or node growth.
- The timing engine contains no DOM or visualization dependencies.

If timing is not stable, do not begin Stage 2 synthesis or orbital work.

## Stage 1 deliverable

- Runnable browser timing spike
- Deterministic timing test suite
- Scheduler diagnostic output
- Brief test record noting browser, hardware, run duration, and observed timing failures if any

---

# Stage 2 — Thesis Prototype

## Stage 2 outcome

A user can perform the complete thesis sequence:

```text
5:4 → phase displacement → drift → timbral interaction
    → HARD RESET → divergence → SOFT HOME
```

The result must be visibly understandable and musically interesting. It does not need product-level polish.

## Stage 2 implementation steps

### 1. Preserve the validated timing engine

Start Stage 2 from the passing Stage 1 engine and tests.

- Do not rewrite clock math to suit the visualization.
- Do not move timing state into Canvas or DOM objects.
- Keep Stage 1 timing tests running throughout Stage 2.
- Add behavior through small modules rather than expanding one main file.

### 2. Kick/percussion voice

Add one synthesized voice behind a common audio-destination interface.

Initial signal path:

- Sine or triangle oscillator body
- Fast downward pitch envelope
- Amplitude decay
- Optional short transient component if needed for timing clarity
- Per-hit limited polyphony
- Conservative voice gain into the shared protected output stage

Expose only the controls needed to hear the interaction:

- Pitch
- Decay
- Level
- One timbral destination for phase proximity

The precise timbral destination should be chosen by listening. Prefer FM depth if it remains clearly percussive; otherwise use pitch-envelope depth or transient intensity. Keep the route fixed.

### 3. Phase-proximity source

Implement the locked formula as a pure module:

```text
distance = min(abs(a - b), 1 - abs(a - b))
proximity = 1 - (2 × distance)
```

Test:

- Equal phases return `1`.
- Quarter-cycle separation returns `0.5`.
- Opposite phases return `0`.
- `0.99` and `0.01` return high proximity.
- Output always stays within `[0, 1]`.

### 4. Fixed temporal modulation route

Create one explicit route:

```text
Clock A / Clock B phase proximity → percussion timbre
```

Requirements:

- Keep the voice's base value separate from its modulated value.
- Smooth the effective audio parameter with short Web Audio ramps.
- Clamp the effective value to a safe musical range.
- Make the modulation clearly audible without causing extreme volume or pitch.
- Do not build a modulation matrix or generalized routing interface.

Begin with control-rate updates derived from authoritative audio-time phase. Tune the update interval and smoothing by measurement and listening.

### 5. Orbital visualization

Build one Canvas 2D view representing two clock cycles.

Each clock needs:

- A distinct orbit
- A visible Home position
- A visible current phase position
- A visible ratio
- A selected state using shape or thickness as well as color
- A restrained event indication
- A visible drift-active state

The view reads current phase from the clock engine using `audioContext.currentTime`. It never advances a separate visual phase.

Faster clocks complete visibly more laps. Visual frame drops must not affect sound or temporal state.

Avoid decorative animation, fake hardware, faux-terminal effects, neon cyberpunk styling, scanlines, gradients used as generic polish, or text used to manufacture atmosphere. Stage 2 visual character should come from spatial relationships, motion, state, and direct manipulation.

### 6. Direct phase dragging

Implement pointer interaction in a separate input module.

On pointer down:

1. Select the targeted clock.
2. Mark it as dragging.
3. Invalidate its scheduled future trajectory.
4. Suppress its normal wrap events.

During drag:

1. Convert pointer angle around the orbit center into normalized phase.
2. Update the clock anchor at the current audio time.
3. Keep the visualization responsive.
4. Do not emit crossed events.

On release or pointer cancellation:

1. Preserve the final phase.
2. Clear dragging state.
3. Resume the configured forward frequency.
4. Reschedule from the release time.
5. Do not emit an event merely because release occurred at phase zero.

Support pointer capture so dragging does not break when the pointer briefly leaves the orbit.

### 7. SOFT HOME trajectory

Implement SOFT HOME as a temporary trajectory, not repeated phase correction.

At operation start for each selected clock:

1. Capture current unwrapped phase `u0`, base frequency `v0`, start time `t0`, and duration `D = 2 seconds`.
2. Choose an integer target cycle whose normalized phase equals the clock's Home phase at `t0 + D`.
3. Prefer the target nearest the uncorrected endpoint while guaranteeing forward velocity for the full operation.
4. Define a smooth correction with zero correction velocity at both endpoints.

One suitable prototype trajectory is:

```text
s = clamp((t - t0) / D, 0, 1)
ease(s) = 3s² - 2s³
uncorrected(t) = u0 + v0 × (t - t0)
correction = targetUnwrappedPhase - (u0 + v0 × D)
u(t) = uncorrected(t) + correction × ease(s)
```

Because a negative correction can theoretically reverse a very slow clock, test candidate target cycles and select one whose derivative stays positive throughout the operation. If the nearest candidate fails, choose the next forward target cycle.

At completion:

- Normalized phase equals Home within engineering tolerance.
- Base configured frequency resumes without a velocity discontinuity.
- The clock's configured ratio remains unchanged.
- The Home operation clears itself.

At cancellation:

- Evaluate the trajectory at the exact cancellation audio time.
- Make that unwrapped phase the new normal anchor.
- Resume base frequency immediately.
- Do not restore the pre-Home phase.

### 8. SOFT HOME scheduling

The event planner must enumerate every genuine wrap along the curved Home trajectory.

Do not approximate Home events by assuming constant spacing across the entire two-second interval.

For the prototype, use a bounded numerical root-finding method to solve when the monotonic unwrapped trajectory crosses each next integer cycle boundary inside the scheduling horizon.

Test that:

- No wrap is duplicated or omitted.
- Event spacing compresses or expands smoothly.
- Starting Home invalidates events from the prior trajectory.
- Cancelling Home invalidates the remaining Home trajectory.
- No clock reverses.
- Clocks arrive at Home together within tolerance.

### 9. Selection and Home targeting

Stage 2 contains two clocks.

- A selected clock can be phase-dragged.
- SOFT HOME applies to the selected clocks.
- If no specific selection exists, both clocks are targeted.
- HARD RESET follows the same target rule.

Do not implement a generalized clock-management or routing interface.

### 10. Minimal thesis controls

Expose only controls required for the demonstration:

- Audio initialization
- Play and Pause
- BPM
- Two ratios
- Per-clock drift
- Clock selection
- HARD RESET
- SOFT HOME
- Kick pitch, decay, level, and fixed modulation amount

Use ordinary HTML/CSS controls adjacent to the orbital view. Keep present state visible. Do not add unapproved names, slogans, lore, decorative messages, tooltips, or onboarding copy.

### 11. Stage 2 automated tests

Keep the complete Stage 1 suite and add:

- Phase-proximity values and wrap continuity
- Phase-drag event suppression
- Phase release behavior
- SOFT HOME endpoint alignment
- SOFT HOME forward-only velocity
- SOFT HOME event enumeration
- SOFT HOME completion and base-rate restoration
- SOFT HOME cancellation
- HARD RESET cancelling active Home
- Trajectory invalidation during rapid Home/reset/drag changes
- Fixed modulation-value clamping

### 12. Stage 2 manual interaction test

Run the exact thesis sequence in current Chrome:

1. Initialize audio.
2. Start Clock A at `5:4` and Clock B at `1:1`.
3. Confirm the relationship is audible and visible.
4. Drag one clock away from its current phase.
5. Confirm dragging does not machine-gun triggers.
6. Release and hear normal wraps resume.
7. Add continuous drift.
8. Confirm phase proximity changes the voice timbre.
9. Invoke HARD RESET and confirm the reset-boundary event.
10. Let the clocks diverge again.
11. Invoke SOFT HOME.
12. Hear and see intervals compress or expand as the clocks converge.
13. Confirm original ratios resume after Home.
14. Cancel Home midway and confirm the attained phase is preserved.

Also test rapid alternation among dragging, drift, HARD RESET, and SOFT HOME for stale scheduled events or audio bursts.

### 13. Visual and interaction QA

Check at approximately 1280×720 and 1440×900 or larger:

- Orbit geometry remains legible.
- Current phase, Home, selection, drift, and coincidence do not rely on color alone.
- Pointer drag remains stable across the `1 → 0` angle boundary.
- Ratio text editing does not trigger keyboard performance actions.
- Backgrounding and resizing do not alter clock state.
- Reduced visual frame rate does not change audible timing.
- No text selection or page drag interferes with orbit interaction.

This is not a full accessibility or responsive-design pass.

### 14. Stage 2 stability check

Run a representative session containing:

- Repeated ratio changes
- Continuous drift
- Repeated phase dragging
- Repeated HARD RESET
- Repeated SOFT HOME and cancellation
- Continuous proximity modulation
- Background/foreground transitions

Stage 2 should complete at least the Stage 1 two-hour reliability target before being shared for thesis evaluation. The later eight-hour robustness target is outside this stage unless convenient to run.

## Stage 2 acceptance gate

Stage 2 is technically complete when:

- All Stage 1 and Stage 2 tests pass.
- The orbit follows authoritative audio phase.
- Phase dragging never emits crossed events.
- Drift behaves continuously.
- Proximity modulation is continuous at phase wrap and audibly clear.
- HARD RESET emits the specified reset-boundary events.
- SOFT HOME converges without phase teleportation or reverse movement.
- SOFT HOME restores configured ratios and supports cancellation.
- Rapid interaction does not leave stale scheduled events.
- The protected output remains at safe levels.
- The representative stability run shows no unbounded resource growth.

Stage 2 passes its actual product question only when the creator finds the complete interaction musically compelling enough to continue.

## Stage 2 deliverable

- Runnable two-clock browser thesis prototype
- One synthesized kick/percussion voice
- Directly manipulable orbital view
- Fixed phase-proximity timbre route
- Passing timing and interaction tests
- Short test record
- Manual thesis evaluation recorded as **continue**, **revise**, or **stop**

---

# Full product roadmap

## Roadmap rules

The roadmap describes architectural direction, not approved implementation work.

- Stage 1 and Stage 2 remain the only stages with implementation-level plans in this document.
- Every later stage begins only after the previous stage has demonstrated musical value and received a separate planning decision.
- Later capabilities should deepen the manipulation of relationships between simultaneous rhythms.
- The primary product remains a **polyrhythmic drum synthesizer**.
- The project must not become a generic DAW, general-purpose modular synthesizer, conventional piano-roll sequencer, or collection of unrelated features.
- New abstractions should enter the production instrument only when they make polyrhythmic percussion more expressive, legible, playable, or interoperable.
- Experimental ideas may remain in the Research Track indefinitely without becoming production commitments.

The stages are sequential architectural layers, not release promises. A later stage may be revised, divided, combined, or omitted when evidence from the working instrument supports that decision.

---

## Stage 1 — Timing Spike

### Purpose

Prove that the continuous clock engine, rational relationships, event scheduling, phase changes, drift, and reset semantics are mathematically and technically sound in the browser.

### Major capabilities introduced

- Master reference clock tied to BPM
- Two continuous derived clocks
- Positive rational ratios
- Raw temporal events
- Phase offsets and continuous drift
- Live phase-preserving ratio changes
- HARD RESET
- Web Audio scheduling
- Timing diagnostics and automated mathematical verification

### Dependencies on previous stages

None. This is the technical foundation.

### Product question

Can independent rational clocks run, change, drift, and reset reliably enough to support a serious musical instrument?

### Still deferred

- Designed musical interface
- Drum synthesis
- SOFT HOME
- Direct orbital manipulation
- Product-level modulation
- All pattern, routing, persistence, interoperability, and distribution work

Detailed implementation is defined earlier in this document.

---

## Stage 2 — Thesis Prototype

### Purpose

Prove that directly manipulating relationships between clocks produces a distinctive and musically compelling percussion experience.

### Major capabilities introduced

- Two-clock orbital visualization
- One synthesized kick/percussion voice
- Direct phase dragging
- Continuous phase drift as a performance gesture
- HARD RESET in the musical interaction
- Forward-only SOFT HOME
- Continuous circular phase proximity
- One fixed phase-proximity-to-timbre modulation route

### Dependencies on previous stages

- Validated Stage 1 clock math
- Stable Web Audio scheduling
- Reliable trajectory invalidation
- Passing timing and reset tests

### Product question

Does leaving synchronization, hearing and seeing the changing relationship, and intentionally returning to Home feel like the basis of an instrument worth continuing?

### Still deferred

- Four-voice drum instrument
- Polymeter and pattern construction
- General routing or modulation assignment
- Persistence and presets
- External synchronization
- Capture and export
- Product packaging

Detailed implementation is defined earlier in this document. Stage 2 ends with an explicit **continue**, **revise**, or **stop** decision.

---

## Stage 3 — Polyrhythmic Drum Synth MVP

### Purpose

Turn the successful thesis interaction into a small, coherent, playable drum synthesizer whose primary identity is unmistakably polyrhythmic percussion.

### Major capabilities introduced

- Four independent clocks
- Four synthesized percussion voices: kick, snare, hat, and flexible FM/resonant percussion
- A shared voice interface with model-specific timbral controls
- One-to-one clock/voice presentation while preserving their architectural separation
- Rational polyrhythm controls
- Basic polymeter behavior using the same temporal engine
- Phase offset and continuous drift per clock
- HARD RESET and SOFT HOME across selected or global clocks
- Clock-derived synthesis modulation in a constrained, understandable form
- Orbital editing and visualization for all active clocks
- Basic master transport and tempo
- Manual voice triggering
- Mute, solo, level, pitch, and decay controls where relevant
- Safe gain staging and protected master output
- Local state restoration
- Human-readable, versioned JSON save/load
- A playable default state and a distinct blank state

### Dependencies on previous stages

- A musically successful Stage 2 thesis evaluation
- Stable timing during representative sessions
- Proven direct phase manipulation
- Proven HARD RESET and SOFT HOME behavior
- A useful clock-to-synthesis modulation relationship
- A visual model that remains legible with more than two clocks

### Product question

Can the central thesis become a compact instrument that supports actual rhythmic performance rather than a single demonstration?

### Still deferred

- Full step-pattern and Euclidean construction
- Probability, conditional triggers, ratchets, and deep per-step editing
- Advanced temporal warping and additional Home behaviors
- Many-to-many routing UI
- General modulation matrix
- MIDI, Ableton Link, OSC, and external instruments
- Audio/MIDI recording and export
- OBS output
- Native application and plugin formats
- Commercial release packaging

---

## Stage 4 — Rhythm Construction

### Purpose

Add deliberate pattern-making systems without replacing the continuous clock as the instrument's fundamental temporal abstraction.

### Major capabilities introduced

- Pattern layers that consume clocks rather than define them
- Variable pattern lengths independent of conventional 16-step assumptions
- Polymetric pattern cycles over shared pulse durations
- Active/inactive steps
- Continuous accent/velocity values
- Euclidean/Bjorklund generation
- Rotation expressed as both discrete steps and continuous cycle phase
- Manual editing of generated patterns
- Basic pattern transformations such as rotate, clear, invert, mirror, and seeded randomization
- Preserved hidden step data when pattern lengths shrink
- Pattern copying distinct from clock, voice, or complete-state copying
- Stronger visual distinction among clock events, pattern pulses, and audible triggers

### Dependencies on previous stages

- Stage 3 clock/voice separation
- Stable four-clock performance
- A state model capable of representing patterns separately from clocks and sound voices
- Versioned local project data
- A clear interface distinction between temporal motion and discrete event structure

### Product question

Can musicians compose repeatable rhythmic structures on top of the clock system without the instrument collapsing into a conventional step sequencer?

### Still deferred

- Deep microtiming
- Ratchets and nested subdivisions
- Conditional/event-logic triggers
- General clock-to-clock modulation
- Complex temporal warping
- Full generative evolution
- External synchronization and MIDI output
- Recording and loop export

---

## Stage 5 — Time Warping

### Purpose

Expand phase manipulation into a coherent family of performable temporal transformations while preserving rhythmic legibility and forward musical motion.

### Major capabilities introduced

- Freeze and release while preserving phase
- PARTIAL HOME for selected-clock realignment
- NEW HOME for storing a current phase configuration as the return state
- GRAVITY HOME as a continuous attraction toward a temporal configuration
- Bounded phase drift
- Destination-based and one-shot drift
- Smooth temporal stretching and compression
- Phase scrubbing with intentional event-suppression behavior
- Configurable Home targets such as stored relationships or selected coincidences
- Visible active transformation state
- Cancellation that preserves the attained temporal position
- A restrained global temporal-performance macro only if it can remain understandable

### Dependencies on previous stages

- Stable SOFT HOME trajectory behavior
- Clear clock selection and grouping
- Reliable event enumeration under changing trajectories
- Stage 4 distinction among clocks, pulses, and triggers
- Visual language capable of showing displacement, active motion, target state, and recovery

### Product question

Can synchronization, desynchronization, stretching, and return become expressive musical gestures rather than hidden clock-engine operations?

### Still deferred

- Arbitrary clock-routing networks
- Unbounded feedback between temporal sources
- Audio-rate clock modulation
- Conditional generative systems
- External synchronization reconciliation
- Full performance scene system
- Capture of temporal gestures

---

## Stage 6 — Temporal Network / Routing & Modulation

### Purpose

Allow clocks, voices, patterns, and temporal measurements to interact as a controlled network without turning the main interface into generic modular patch-cable machinery.

### Major capabilities introduced

- Clocks that exist without sound destinations
- One clock triggering multiple voices
- Multiple clocks contributing to one voice
- Coalesced trigger handling with preserved coincidence metadata
- Pairwise and selected-group phase relationships
- Temporal modulation sources including phase, signed phase difference, phase proximity, event pulse, time since event, cycle count, and event density where musically justified
- Assignable clock-to-synthesis modulation
- Selected clock-to-clock modulation
- Multiple sources contributing to one destination
- Base-value and effective-value visibility
- Route amount, polarity, enable state, and appropriate smoothing
- Contextual routing or a compact modulation matrix
- Clear separation between internal modulation and external control mapping
- Safety constraints for event density, invalid values, and temporal feedback

### Dependencies on previous stages

- Stable clock, pattern, and voice identities
- Safe parameter ranges and output protection
- Proven fixed temporal modulation from Stage 2
- Proven temporal transformations from Stage 5
- Project serialization capable of stable route IDs and schema evolution
- An interface model that can reveal relevant routes without showing everything simultaneously

### Product question

Can relationships among rhythms become a playable compositional network while remaining understandable as a drum instrument?

### Still deferred

- Unrestricted modular routing
- Default-on temporal feedback loops
- Audio-rate modulation
- Fully nested or recursive clocks
- Large-scale autonomous generation
- External controller mapping and external event output
- Capture or replay of routed performances

---

## Stage 7 — Generative & Long-Form Rhythm

### Purpose

Let polyrhythmic structures evolve over long durations in repeatable, inspectable ways while keeping the user able to understand and intervene in the process.

### Major capabilities introduced

- Seeded probability with clock events continuing beneath suppressed triggers
- Conditional triggers based on cycle count, prior events, coincidence, phase regions, or performance state
- Deterministic mutation and variation
- Long-form recurrence calculation for rational systems
- Time and cycle count until selected or full-system recurrence
- Explicit states for extremely long, free, or non-finite recurrence
- Recurrence-aware visual progress
- Temporary fill or hold-to-mutate gestures that return to prior state
- Scene variation that preserves meaningful temporal relationships
- Slowly changing ratios or pattern properties within bounded, inspectable rules
- Repeatable generative states stored with seeds and configuration

### Dependencies on previous stages

- Stage 4 pattern representation
- Stage 6 temporal events, relationships, and routing metadata
- Stable seeded state serialization
- Reliable recurrence math for deterministic rational clocks
- Clear safeguards against event-density explosions
- Visible separation among deterministic structure, probability, and live intervention

### Product question

Can the instrument produce evolving rhythm over minutes or hours without becoming arbitrary, opaque, or musically uncontrollable?

### Still deferred

- Generative AI
- Unbounded autonomous composition
- Full arrangement timeline
- DAW-style song construction
- Default-on recursive clock networks
- Final recording/export system
- Native/plugin-specific automation behavior

---

## Stage 8 — Performance Instrument

### Purpose

Make the established temporal and synthesis systems reliable, immediate, and physically playable in rehearsal, performance, and screen-based presentation.

### Major capabilities introduced

- Dedicated Edit and Perform views
- Fullscreen orbital performance surface
- Performance-safe editing lock
- Keyboard control beyond the basic prototype mappings
- MIDI note input and MIDI learn
- Controller profiles with soft takeover
- Assignable notes and CC controls
- Macros that can affect several musical parameters coherently
- Performance scenes or snapshots with deliberate phase-preservation/reset behavior
- Immediate, boundary-based, and morphing scene changes where musically appropriate
- Tap tempo
- Panic and recoverable audio restart behavior
- Clear external-device loss and reconnection state
- Reduced visual load mode that never degrades audio timing
- Refined state visibility, focus behavior, contrast, and reduced-motion support
- A dedicated visual/performance view that can later support OBS output

### Dependencies on previous stages

- A stable and musically useful Stage 3–7 instrument
- Predictable project and scene state
- Safe live parameter changes
- Clear temporal transformation status
- Stable route and parameter IDs
- Measured performance headroom

### Product question

Can the instrument be played confidently in real time without accidental destructive edits, audio interruption, or loss of temporal understanding?

### Still deferred

- Full external synchronization suite
- MIDI event output
- OSC and installation control
- Integrated audio/MIDI recording
- Direct visual rendering/export
- Commercial packaging and support materials
- Native/plugin delivery

---

## Stage 9 — Capture, Export & External Systems

### Purpose

Connect the instrument to broader music and visual workflows while preserving the distinction between master synchronization and internal polyrhythmic event streams.

### Major capabilities introduced

- MIDI Clock input and output for master transport
- MIDI Start, Stop, and Continue
- Ableton Link tempo and beat-phase synchronization
- Optional Link transport behavior
- Graceful coast and soft-realignment behavior when external sync disappears or returns
- MIDI note/event output from internal clocks and patterns
- OSC input/output when justified by performance or installation use
- Master audio recording
- Recurrence-aware loop length choices
- WAV export with optional decay/effect tails
- Human-readable temporal metadata accompanying exports
- MIDI export with separate voice tracks where representable
- Clear acknowledgement that continuous temporal warping may not map perfectly into Standard MIDI Files
- OBS-oriented visual output and transparency
- Screen-capture-friendly performance presentation
- Deterministic performance/control capture as a later capability within the stage if the established system supports it cleanly

### Dependencies on previous stages

- Stage 8 performance-safe transport and control behavior
- Stable master/reference clock semantics
- Reliable event streams with timestamps and source identity
- Versioned project, scene, and seed state
- Recurrence calculations
- Renderer separation sufficient for visual-only output
- Defined recovery behavior for audio and external synchronization changes

### Product question

Can the instrument enter real production, live-performance, visual, and installation workflows without compromising its internal temporal model?

### Still deferred

- DAW replacement features
- Audio-track arrangement
- Cloud collaboration
- Accounts or subscription infrastructure
- Full video editor or render pipeline
- Native/plugin implementation
- Final commercial distribution system

---

## Stage 10 — Productization

### Purpose

Turn the validated browser instrument into a reliable, understandable, distributable product that another musician can use without a terminal.

### Major capabilities introduced

- Hosted web release and/or downloadable offline web bundle
- Dependable first-run audio initialization and recovery
- Concise onboarding using user-approved wording
- Clear documentation for operation, customization, saving, controllers, and external systems
- Curated, user-approved factory presets demonstrating distinct temporal concepts
- Reliable autosave, project recovery, JSON import/export, and schema migration
- Refined default and blank states
- Browser compatibility work beyond the initial Chrome/macOS target where practical
- Commercially compatible dependency and asset review
- Product-level performance, soak, failure-state, and accessibility validation
- Demo audio/video and release materials using separately approved names and copy
- Simple update and versioning process
- Optional dedicated OBS instructions and performance setup documentation

### Dependencies on previous stages

- A musically validated feature set
- Stable performance and interoperability
- Mature state serialization and recovery
- Settled licensing/business decisions
- User-approved product name, interface wording, preset names, documentation tone, and visual assets
- Evidence about the actual target audience and workflows

### Product question

Can another musician acquire, understand, trust, perform with, and retain work made in the instrument without developer assistance?

### Still deferred

- Accounts, cloud sync, and collaboration unless later justified
- Custom auto-updater unless distribution scale requires it
- Marketplace or platform-building work
- Unrelated product-family extraction
- Native desktop and plugin development
- Any feature that has not demonstrated musical value in the browser instrument

---

## Stage 11 — Native / Plugin

### Purpose

Carry the proven musical model into native standalone and DAW-hosted forms with tighter integration, higher performance ceilings, and reliable host recall.

### Major capabilities introduced

- Native standalone application
- VST3, AU, and CLAP formats where technically and commercially appropriate
- Stable host-visible parameter IDs
- DAW automation for suitable continuous and discrete controls
- Plugin-state save and recall
- Host tempo, transport, and beat-position synchronization
- Multiple audio outputs or per-voice stems where supported
- Higher event-density and DSP-performance ceilings
- Improved synthesis or timing where native execution creates real musical benefit
- MIDI input/output appropriate to plugin hosts
- Native preset, project, and migration behavior compatible in concept with browser state
- Installation, signing, notarization, and release packaging for supported platforms

### Dependencies on previous stages

- A completed and validated browser product
- Stable musical semantics that no longer depend on unresolved experiments
- A settled native technology choice based on concrete requirements
- Stable parameter, route, preset, and state identifiers
- Clear host-sync behavior
- Commercial licensing and distribution decisions
- Evidence that users need native/plugin operation rather than merely assuming it

### Product question

Does native and plugin integration materially improve how the established polyrhythmic drum synthesizer is used, performed, automated, and recorded?

### Still deferred

- Bit-identical parity with browser DSP when musical equivalence is sufficient
- Support for every operating system or plugin format without demonstrated demand
- DAW arrangement or recording features inside the instrument
- Generic modular-synth expansion
- Cloud services
- Hardware development unless pursued as a separately approved product direction

---

# Parallel Research Track

## Purpose

Provide a safe place to explore unusual temporal ideas without quietly turning experiments into production commitments or destabilizing the main instrument.

The Research Track runs beside the product roadmap. It is not Stage 12, does not have to advance sequentially, and must not block practical product work.

## Candidate research territories

- Free-running clocks with no rational or finite recurrence
- Continuously variable and effectively irrational relationships
- Reverse-running clocks
- Nested and recursively structured clocks
- Clock-to-clock feedback
- Modulation of modulation depth
- Audio-rate temporal modulation
- Transition between event-rate rhythm and modulation/audio-rate behavior
- Nonlinear tempo curves and elastic subdivisions
- Bounded, bouncing, accelerating, or random-walk drift
- Predictive coincidence across changing clock networks
- Multi-clock and full-system convergence
- Gravity-like temporal attraction fields
- Temporal hysteresis and memory
- Conditional clock advancement
- Clock structures driven by audio transients or environmental data
- Ratio-linked oscillator, resonator, or harmonic systems
- Visual geometry derived from warped temporal intervals
- Long-form structures whose recurrence exceeds practical performance duration
- Alternative representations of phase, recurrence, and network causality
- External control of light, visuals, installations, or spatial audio through clock relationships
- Hardware or CV interpretations of the clock engine

## Relationship to the production roadmap

A Research Track idea may enter a future production stage only when it has:

- A clear connection to polyrhythmic percussion
- Demonstrated musical value in an isolated experiment
- Understandable behavior or a deliberately bounded mystery
- Safe timing, audio, and failure behavior
- A legible interaction model
- A scope that does not turn the instrument into a generic modular environment
- A separately approved product-stage plan

Research prototypes may be rough, disposable, or branch-like experiments. They should not require production UI, preset compatibility, documentation, or migration support unless promoted into the roadmap.

## Explicitly not implied by the Research Track

- Every experiment will ship.
- Experiments must be mutually compatible.
- Experimental controls belong in the main interface.
- The production architecture must preemptively support every idea.
- Strange behavior is valuable merely because it is complicated.
- The instrument should become a DAW, general modular synthesizer, research platform, or miscellaneous creative-coding toolbox.

The standard for promotion remains musical: the idea must make relationships between rhythms more expressive, perceptible, performable, or sonically consequential.

---

# Verification commands

These are the expected commands once the project shell exists. Confirm the final scripts in `package.json` during implementation.

```sh
npm install
npm run dev
npm test
npm run build
```

For a one-pass test run rather than watch mode, provide a dedicated script such as:

```sh
npm run test:run
```

# Deferred from implementation-level planning

The following are intentionally not designed here:

- Four-clock/four-voice instrument structure
- Polymeter UI or pattern cycles
- Step sequencing
- Euclidean rhythms
- Probability or accents
- General modulation routing
- Many-to-many clock/voice routing UI
- Persistence or JSON import/export
- Presets
- MIDI, Ableton Link, or OSC
- Recording or export
- OBS/transparent view
- Native or plugin packaging
- Stage 3 milestones, estimates, or task breakdown

These capabilities now have high-level orientation in the full roadmap, but none has an implementation plan here. Any work beyond Stage 2 requires a new planning pass after the Stage 2 thesis evaluation.
