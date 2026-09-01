# Prebuild Questions 1–38

## First build

### 1. What should the first runnable version be?
**Browser app.**

### 2. Which operating system and browser must it work on first?
**macOS on Apple Silicon, current desktop Chrome.**

Other browsers/platforms can come later.

### 3. Is the first milestone a technical rhythm prototype, a playable instrument, or a visually presentable demo?
A **playable technical rhythm prototype**.

It should be ugly-but-usable enough to manipulate while listening. Visual polish is secondary.

### 4. Which parts must be in the first milestone?
Required:

- [x] Independent clocks
- [x] Ratio controls
- [x] Polyrhythm mode / behavior
- [x] Phase offset and drift
- [x] Hard reset
- [x] Soft home
- [x] Clock-based synthesis modulation
- [x] Circular clock visualization

Useful shortly afterward:

- [ ] Four drum voices
- [ ] Polymeter mode
- [ ] Probability and accents

Deferred:

- [ ] MIDI clock
- [ ] Ableton Link

The **technical spike before even this milestone** can be only two clocks + one sound.

---

# Rhythm behavior

### 5. What is the difference between polyrhythm mode and polymeter mode?

**Polyrhythm:** different subdivisions occupy the same temporal span.

Example:

`5 events : 4 events`

Both complete their larger cycle together.

**Polymeter:** the underlying pulse duration is shared, but pattern/cycle lengths differ.

Example:

`5-step cycle : 7-step cycle`

Their individual steps occur at the same rate, but their downbeats drift relative to one another.

Both should ultimately use the same clock engine rather than completely separate implementations.

### 6. Should each voice use a conventional step pattern, Euclidean pattern, continuously running clock, or a choice?
Eventually: **choice between multiple rhythm-generating systems.**

Fundamentally: **continuously running clocks come first.**

Step sequences and Euclidean generators should sit *on top of* or consume clocks rather than defining the fundamental timing model.

### 7. How should `5:4` behave?
`5:4` means:

**five cycles/events of the local clock occur during the time occupied by four cycles/events of its reference clock.**

So:

`local frequency = reference frequency × 5/4`

### 8. Can clocks run completely free?
Eventually, yes.

For the MVP, clocks remain mathematically related to a master/reference clock.

The full instrument should permit:

- rational relationships
- continuously variable relationships
- genuinely free-running clocks
- clocks whose relationship changes over time

### 9. What happens when ratio or step count changes during playback?
For ratio changes:

**change immediately while preserving current phase.**

Do not reset the clock.

Its future rate simply changes from its current temporal position.

Quantized/boundary-based changes can be added later.

### 10. What exactly should HARD RESET reset?
Reset temporal state:

- phases
- cycle counters
- accumulated drift
- pattern positions when patterns exist
- active Home/warp operations

Do **not** reset:

- sound settings
- ratios
- patterns themselves
- mixer settings
- routing

### 11. How should SOFT HOME behave?
SOFT HOME should temporarily alter clock speeds so selected clocks **converge smoothly on a shared phase**.

Once aligned, each clock resumes its intended ratio.

This means audible intervals may stretch or compress during the return.

No phase teleportation.

### 12. How should phase drift work?
Eventually multiple drift modes.

First version:

**drift speed** caused by a small relative clock-speed offset.

The phase should continuously wrap.

Later possibilities:

- destination
- bounded drift
- bounce
- random walk
- acceleration
- manually released drift

### 13. What does probability suppress?
Probability suppresses the **trigger**, not the underlying clock event.

The clock continues progressing normally.

This distinction is important because clock events may later:

- modulate something
- advance another structure
- count toward coincidence
- exist silently

### 14. What happens when several clocks trigger the same voice nearly simultaneously?
Exact or extremely-near coincidences should be **coalesced into one audible hit** for the MVP rather than producing accidental amplitude doubling.

The engine should preserve the fact that multiple clocks coincided so that multiplicity can later affect:

- accent
- timbre
- modulation strength
- special coincidence behavior

Distinct hits separated enough to be perceptually meaningful remain separate.

---

# Sound

### 15. Fixed voice roles or same flexible architecture?
For the first instrument: **fixed musical roles with a shared technical interface.**

Each voice exposes common concepts like trigger, pitch, decay, level, mute, and modulation, while its synthesis implementation can differ.

### 16. First four roles
1. Kick
2. Snare
3. Hat
4. Flexible percussion / FM-resonant voice

### 17. Samples in MVP?
**No. Synthesis only.**

Sampling can come later.

This keeps the initial identity clearly about a drum **synth**, not a sample sequencer.

### 18. Essential per-voice controls
Definitely:

- [x] Pitch
- [x] Decay
- [x] Level
- [x] Mute / solo

Useful where appropriate:

- [x] Transient
- [x] Noise
- [x] FM

Can wait:

- [ ] Pan
- [ ] generalized filter controls

Rather than forcing every voice to expose identical irrelevant parameters, each model can have a few meaningful timbral controls.

### 19. First clock measurement used for synthesis modulation
**Phase difference / proximity between two clocks.**

This is more conceptually important than simple phase.

It demonstrates the thesis that **relationships between rhythms can directly determine timbre.**

### 20. Fixed or assignable modulation routing?
**Fixed for the prototype.**

Example:

`Clock A ↔ Clock B phase proximity → Perc FM depth`

Once we know this is musically useful, build assignable routing.

---

# Interface and control

### 21. Circular/orbital view: visualization, editor, or both?
**Both.**

It is primarily the representation of temporal relationships, but users should directly manipulate time through it.

### 22. What should be directly draggable/playable?
Initially:

- drag clock phase around its orbit
- select clocks
- possibly start/stop or mute them directly

Ratio and exact numeric values can live in ordinary controls nearby.

Do not overload the orbit with every parameter immediately.

### 23. Is a conventional grid editor required?
**No.**

Simple per-clock controls beside the orbital view are enough.

A grid should only be added once we actually need pattern editing.

### 24. Keyboard shortcuts / MIDI mapping
Useful initial keyboard actions:

- `Space` — play/pause
- `1–4` — manually trigger voices
- `R` — HARD RESET
- `H` — SOFT HOME

Additional performance mappings can wait.

MIDI mapping is not required initially.

### 25. Persist between sessions?
Technical spike: **no requirement.**

First genuinely useful MVP: **yes, automatically restore the most recent local state.**

### 26. Presets, save/load, undo, recording, MIDI export?
First useful MVP:

- basic autosave
- JSON save/load

Not initially required:

- elaborate preset browser
- deep undo system
- audio recording
- MIDI export

### 27. OBS / transparent background?
**Normal opaque application first.**

An OBS/performance visualization mode could be extremely good later, but it should not distort the instrument architecture now.

---

# Visual direction

### 28. Existing visual materials to preserve?
None have been established for this instrument yet.

Do not lock a detailed visual identity before we understand the interaction.

### 29. Exact rhythmic legibility or expressive motion?
**Legibility first, expressive motion second.**

Ultimately the balance should be adjustable.

The visualization can become beautiful, but the user should always be able to understand what time is doing.

### 30. What must remain visible while performing?
At minimum:

- transport state
- master tempo
- each active clock
- ratio
- current phase
- drift state
- voice mute/level
- currently selected clock(s)
- Home/reset state
- clear visual indication of major coincidences

### 31. Visual/interaction approaches to explicitly avoid?
Without seeing `AGENTS.md`, I cannot specify anything relative to its contents.

Independently, avoid:

- piano-roll-first design
- fake hardware skeuomorphism
- gratuitous patch-cable spaghetti
- interfaces where every parameter is permanently visible
- decorative animation disconnected from audio timing
- requiring color alone to understand clock state
- turning the orbital display into meaningless visualizer fluff

The interface should make **temporal structure** legible.

---

# Technical and product boundaries

### 32. Existing code / preferred technology?
No existing codebase is required.

First implementation:

**JavaScript + Web Audio + browser graphics.**

Canvas/WebGL can be chosen later depending on visualization needs.

### 33. Dependencies?
Small dependencies are fine.

Core clock/timing/audio behavior should remain understandable and as dependency-light as practical.

Avoid a giant framework stack unless it actually solves a problem.

### 34. Minimum timing accuracy and session length
Use Web Audio scheduling with a short look-ahead.

Requirements:

- no cumulative musical drift
- no obvious jitter during normal use
- rhythm remains stable for multi-hour sessions

The first practical target should be **at least several continuous hours without timing degradation, memory growth, or audio failure.**

Sample-accurate custom DSP is not required for the MVP.

### 35. Offline operation?
**Yes.**

Once installed/downloaded, the instrument should not require an internet connection to function.

### 36. Personal tool, product, or open source?
Initially:

**personal experimental/performance instrument.**

It should be architected so it could become a downloadable product later.

Commercial vs open-source distribution can remain undecided.

### 37. What explicitly should NOT be built in the MVP?
Do not build:

- DAW functionality
- arrangement timeline
- piano roll
- sample library/browser
- sample import
- granular engine
- advanced physical modeling
- full modular routing environment
- complex effects rack
- VST/AU/CLAP
- cloud accounts
- collaboration
- mobile version
- MIDI export
- audio export
- Link
- external sync
- OSC
- CV
- elaborate preset management
- deep undo/history
- visual themes
- OBS-specific implementation
- generative AI anything
- giant settings panel

Most importantly:

**do not start implementing every interesting time concept at once.**

### 38. What single demonstration proves the first build succeeds?
A musician can:

1. start two clocks at `5:4`
2. hear the relationship clearly
3. see the relationship in the orbital view
4. change it live to `7:3`
5. drag one clock out of phase
6. introduce continuous drift
7. hear their phase relationship alter the percussion timbre
8. HARD RESET them into alignment
9. let them separate again
10. SOFT HOME them back together

If that interaction is compelling enough that you naturally want to keep playing with it, the technical premise is validated.