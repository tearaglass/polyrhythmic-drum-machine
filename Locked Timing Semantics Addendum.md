# Locked Timing Semantics Addendum

These rules resolve the remaining implementation ambiguities and should be treated as authoritative for the Timing Spike and Thesis Prototype.

## 1. Master Clock / BPM Semantics

The master reference clock completes **one cycle per quarter-note beat**.

Therefore:

- `120 BPM` = 2 master cycles per second
- `60 BPM` = 1 master cycle per second

A local ratio `p:q` means:

**p local clock cycles occur during q master/reference clock cycles.**

Example:

`5:4`

means the local clock completes five cycles during four master beats.

Equivalently:

`localFrequency = referenceFrequency × p / q`

Time signatures are not required for this relationship.

---

## 2. Raw Clock Event Semantics

A raw forward-running clock produces one normal temporal event whenever its phase wraps:

`1 → 0`

### Playback from Home

Starting playback from Home produces an event immediately at time zero.

This establishes Home as an explicit initial temporal boundary rather than requiring the system to wait one entire cycle before producing its first event.

### HARD RESET During Playback

HARD RESET:

1. cancels applicable scheduled future events
2. resets targeted temporal state to Home
3. emits one immediate **reset-boundary event** from every targeted clock
4. continues normal clock operation from Home

The reset-boundary event is a temporal event, not inherently a sound.

It passes through normal clock routing.

Therefore:

- a clock with no sound destination remains silent
- a clock routed to a voice can immediately trigger that voice
- several clocks routed to the same voice may be coalesced according to normal coincidence rules

This preserves the architectural distinction between clocks and sound voices.

### Phase Dragging

While phase is being manually dragged:

- normal wrap events are suppressed
- crossed event positions do not retrigger

On release:

- normal event generation resumes from the resulting phase
- releasing exactly at phase zero does **not** itself produce a trigger

Only a genuine subsequent forward wrap produces the next normal event.

---

## 3. SOFT HOME Prototype Algorithm

For the first implementation:

**Home duration:** 2 seconds

**Clock direction:** positive/forward speeds only

**Alignment model:** operate using unwrapped phase so clocks may continue progressing naturally through additional cycles while returning Home.

SOFT HOME must:

- never teleport phase
- temporarily alter clock velocity
- preserve forward movement
- converge on the target Home relationship after approximately 2 seconds
- restore each clock's original intended ratio afterward

A clock may complete additional whole cycles during the Home operation if that produces the cleanest forward path.

### Alignment tolerance

Use a small numerical phase tolerance appropriate to the scheduler implementation.

The exact engineering epsilon can be selected during implementation/testing rather than exposed as a product parameter.

### Scheduled events

When SOFT HOME begins, future events scheduled under the previous timing trajectory must not be allowed to fire incorrectly.

The scheduler should invalidate/reschedule affected future events according to the new trajectory.

Already-produced audio is never retroactively altered.

### Cancellation

If SOFT HOME is cancelled:

- stop applying the Home velocity correction
- preserve the exact phase reached at cancellation
- immediately resume the clock's normal configured ratio from that phase

Cancellation never restores the pre-Home phase.

---

## 4. Phase Proximity Formula

For normalized phases `a` and `b` in the range:

`0 ≤ phase < 1`

calculate circular phase distance:

`distance = min(abs(a - b), 1 - abs(a - b))`

Then normalize proximity:

`proximity = 1 - (2 × distance)`

Therefore:

- identical phase → `1`
- quarter-cycle separation → `0.5`
- opposite phase → `0`
- wraparound behaves continuously

Example:

`a = 0.99`
`b = 0.01`

produces a high proximity value rather than treating the clocks as nearly one entire cycle apart.

Phase proximity is a continuous modulation source.

---

## 5. Build-Stage Terminology

Use these labels consistently.

### Stage 1 — Timing Spike

Purpose:

**prove the temporal engine mathematically and technically.**

Contains:

- master clock
- two derived clocks
- rational ratios
- simple clicks/beeps
- phase state
- live ratio changes
- phase offset
- drift
- HARD RESET
- automated timing tests
- scheduler diagnostics

No designed musical interface is required.

No drum synthesis is required.

---

### Stage 2 — Thesis Prototype

Purpose:

**prove that the central concept is musically compelling.**

Contains:

- two clocks
- one synthesized kick/percussion voice
- orbital clock visualization
- direct phase dragging
- continuous phase drift
- HARD RESET
- SOFT HOME
- phase-proximity calculation
- one fixed phase-proximity → synthesis modulation route

The core demonstration is:

`5:4 → phase displacement → drift → timbral interaction → HARD RESET → divergence → SOFT HOME`

This stage answers whether the project should continue.

---

### Stage 3 — MVP

Purpose:

**turn the thesis prototype into a small coherent instrument.**

Contains approximately:

- four clocks
- four synthesized percussion voices
- polyrhythm
- polymeter
- ratio controls
- phase offset/drift
- HARD RESET
- SOFT HOME
- clock-derived synthesis modulation
- orbital editing/visualization
- basic transport
- usable controls
- local persistence
- basic JSON save/load
- safe gain/output stage

The MVP does not need to contain every feature mentioned in the full product specification.

---

### Stage 4 — Expansion

Possible additions include:

- patterns
- Euclidean/Bjorklund generation
- probability
- accents
- recurrence prediction
- clock routing
- many-to-many voice routing
- additional Home behaviors
- temporal warping
- nested clocks
- conditional timing
- MIDI
- Ableton Link
- OSC
- advanced modulation
- recording/export
- OBS visualization
- native application
- VST3 / AU / CLAP

These features must be added according to musical value rather than simply because they appear in the specification.

---

## Documentation Note

`AGENTS.md` remains authoritative for repository-level development and interface constraints.

Where these product/timing specifications conflict with implementation-process instructions in `AGENTS.md`, Codex should flag the conflict rather than silently choosing one interpretation.

---

# Final Timing Principle

The reference clock establishes tempo.

Derived clocks establish relationships to that reference.

Phase describes where each clock currently is.

Events occur when temporal boundaries are crossed.

Sound is something those events may control.

**Time exists independently of whether anything makes a sound.**