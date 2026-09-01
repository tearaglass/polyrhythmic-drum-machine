# Prebuild Questions 295–338

## Failure states and safeguards

### 295. What should the user see when audio initialization fails?
Show a clear inline error with:

- what failed
- whether audio can be retried
- a **RESTART AUDIO** action
- preserved project state

Do not dump raw browser errors into the main UI.

A hidden debug panel can expose technical details.

### 296. What if a preset contains unsupported or corrupted values?
Load as much valid state as possible.

Invalid fields should:

- fall back to safe defaults
- generate a warning
- not crash the entire instrument

If the preset is structurally unreadable, reject it cleanly and preserve the current state.

### 297. Clamp, reject, or repair invalid parameter values?
Generally:

**Clamp safe numeric values into valid ranges.**

Examples:
- pitch too high → clamp
- negative decay where impossible → clamp

Reject values that would fundamentally change meaning or indicate a malformed structure.

The loader may repair old schema formats through version migrations.

### 298. What if a ratio produces dangerously fast events?
The engine needs a maximum useful event frequency.

When a clock exceeds audible-trigger limits:

- do not blindly synthesize every event
- indicate that the rate exceeds trigger range
- clamp or transition behavior depending on context

Eventually extremely fast clocks may become modulation sources rather than drum triggers.

### 299. Maximum event density?
Yes.

There should be both:

- per-clock / per-voice safety limits
- global event scheduling limits

Exact numbers should come from performance testing.

The limit should be high enough not to interfere with musically useful ratchets or extreme polyrhythms.

### 300. What should inaudibly fast clocks do?
Long-term:

**transition naturally into modulation-rate behavior where meaningful.**

This is conceptually interesting because rhythm and audio/modulation frequency are points on the same continuum.

For the MVP:

- cap audible trigger production
- preserve the underlying clock state
- do not attempt audio-rate triggering through ordinary event scheduling

### 301. Prevent modulation feedback from producing NaN/infinity/etc.?
Required safeguards:

- finite-value checks
- parameter clamping
- bounded delta/rate changes where necessary
- feedback-depth limits
- maximum event density
- watchdog/debug logging
- fail-safe fallback to last valid value

A broken modulation loop should degrade safely rather than corrupt the entire audio engine.

### 302. One-action return to known audible state?
**Yes.**

Have a **DEFAULT / INIT** state separate from HARD RESET.

INIT restores:

- usable clock configuration
- usable synthesis defaults
- safe levels
- basic routing

HARD RESET only resets temporal state.

### 303. What should PANIC do?
PANIC should:

- immediately stop all active audio
- clear scheduled audible triggers
- stop transport
- cancel active Home/warp operations

It does not need to erase the patch.

Clock state may be reset to Home for a predictable recovery.

### 304. Master muted when app opens?
The app should not make sound until the user explicitly starts audio.

Once audio is initialized, default master gain can be at a conservative audible level.

No surprise autoplay.

### 305. Remember master volume?
**Yes**, once local persistence exists.

But always clamp restored volume to a safe maximum.

### 306. What happens when rendering cannot keep up?
Priority order:

1. audio timing
2. control processing
3. essential temporal visualization
4. decorative visuals

Drop visual frames or simplify animation first.

Never intentionally skip musically scheduled audio merely to keep graphics smooth.

If the audio engine itself cannot keep up, surface a warning.

### 307. Which changes require warnings?
Warnings should be reserved for truly destructive operations such as:

- clearing an unsaved project
- overwriting saved state
- deleting substantial routing/pattern data
- loading a corrupted/incompatible project

Normal musical operations should not interrupt performance with dialogs.

### 308. Experimental features behind setting?
**Yes, later.**

Unstable systems such as:

- temporal feedback
- irrational/free clock experiments
- experimental audio-rate clock modulation

can live behind an explicit experimental section until reliable.

Do not burden the MVP with a feature-flag framework unless needed.

---

# Testing and acceptance

### 309. Reference rhythms for 3:2, 5:4, and 7:5
Use mathematically generated reference event times.

For a shared reference duration `T`:

**3:2**
- clock A event spacing = `T / 3`
- clock B event spacing = `T / 2`

**5:4**
- A = `T / 5`
- B = `T / 4`

**7:5**
- A = `T / 7`
- B = `T / 5`

Tests should compare scheduled event timestamps against calculated expected times.

Use audible clicks only as a secondary human check.

### 310. Verify polymeter correctness
Example:

- both clocks use identical step duration
- Clock A cycle = 5 steps
- Clock B cycle = 7 steps

Verify:

- individual step spacing remains identical
- A resets every 5 steps
- B resets every 7
- full downbeat recurrence occurs after 35 shared steps

Automated timestamp tests are preferable.

### 311. Verify phase offset and drift
Measure numerically.

For phase offset:

- compare actual normalized phase against expected phase difference

For drift:

- calculate expected relative phase over elapsed audio time
- verify measured relative phase follows that trajectory

Also test wraparound behavior at `1 → 0`.

### 312. What proves HARD RESET is correct?
At any arbitrary running state:

1. invoke HARD RESET
2. every targeted clock returns immediately to its Home phase
3. cycle counters reset
4. accumulated drift clears
5. next scheduled events begin from the defined reset state
6. ratios and sound settings remain unchanged

Automated assertions should verify this.

### 313. What proves SOFT HOME is correct?
Start clocks at known phase differences.

Invoke SOFT HOME.

Verify:

- phase does not jump discontinuously
- clock rate temporarily changes
- phase difference decreases smoothly
- clocks reach intended Home relationship within tolerance
- original ratios/rates resume afterward

Also verify that trigger intervals stretch/compress rather than disappearing unpredictably.

### 314. How long must the app run reliably?
Technical milestone:

**at least 2 hours continuously.**

Before calling it robust/shareable:

**8+ hour soak test** with:

- no cumulative timing drift
- no runaway memory growth
- no scheduler failure
- no audio context instability

Longer overnight tests can come later.

### 315. Which rapid control changes should be stress-tested?
At minimum:

- rapid ratio changes
- phase dragging
- repeated HARD RESET
- repeated SOFT HOME
- starting/cancelling drift
- extreme tempo changes
- rapid mute/solo
- repeated manual triggering
- maximum event-density settings
- fast synthesis parameter changes

Especially test combinations rather than isolated controls.

### 316. Target devices/interfaces for testing
Initial target:

- Apple Silicon Mac
- built-in audio output
- normal external audio interface if available

Do not require unusual hardware for acceptance.

### 317. MIDI controllers/sync sources?
Not part of MVP acceptance because MIDI sync is deferred.

When MIDI is introduced, establish a separate hardware test matrix.

### 318. OBS testing?
**No for MVP.**

OBS/transparency becomes its own later feature acceptance pass.

### 319. Acceptable CPU load?
No arbitrary hard percentage initially.

Acceptance criteria:

- stable audio
- comfortable headroom
- smooth normal UI
- no thermal/CPU runaway during representative four-voice use

Measure actual performance and establish thresholds after the first implementation exists.

### 320. Automated timing tests?
**Yes. Strongly recommended.**

Use:

- expected timestamps
- scheduler logs
- offline or recorded event timing where practical

Do not rely exclusively on “sounds right.”

Timing is too central to this product for that.

### 321. Deterministic random seeds for testing?
**Yes.**

Once probability/randomness is introduced, seeded behavior should make automated tests reproducible.

### 322. Minimum manual browser/input matrix
Initially:

- current Chrome/macOS
- trackpad
- mouse if available
- keyboard
- ~1280×720
- ~1440×900 or larger

Additional browsers come later.

### 323. Background/throttle/resize/monitor tests
Verify that:

**Backgrounded tab**
- audio timing remains intact
- visuals recover accurately

**Resize**
- no clock-state changes
- no audio interruption

**Move between monitors**
- no temporal reset

**Browser throttling**
- visual degradation does not alter audio schedule

**Wake from sleep**
- state resumes according to defined suspend behavior rather than catching up missed events.

### 324. Accessibility checks
MVP/basic:

- readable contrast
- controls have focus states
- text fields behave normally
- essential state not communicated by color alone
- keyboard shortcuts do not trap normal text entry

Reduced-motion and comprehensive keyboard navigation can be formalized later.

### 325. Minimum manual smoke test before sharing
Before any build is sent to another person:

1. open app fresh
2. initialize audio
3. play default patch
4. hear all exposed voices
5. create `5:4`
6. change ratio live
7. drag phase
8. enable drift
9. verify visible/audio phase agreement
10. HARD RESET
11. SOFT HOME
12. stop/restart
13. run several minutes without glitches
14. refresh/reopen if persistence exists

### 326. Who decides whether milestone is musically useful?
**The creator/user, not automated tests.**

Technical correctness is necessary but insufficient.

The milestone passes musically if interacting with the clocks produces rhythms/behaviors that feel worth exploring beyond the test case.

---

# Build sequence

### 327. Timing-engine spike with clicks first?
**Yes. Absolutely.**

Before drum synthesis:

Build a timing spike using simple click/beep events.

Prove:

- independent clocks
- ratio semantics
- phase
- live ratio changes
- reset
- drift
- timing stability

Do not debug fancy drum synthesis and timing simultaneously.

### 328. Visualization with simulated clocks first?
Prefer:

1. basic timing engine
2. expose clock-state data
3. build orbital visualization from real timing state
4. then improve synthesis

A tiny simulated visual prototype is fine for layout exploration, but production visualization must be driven by the actual timing model.

### 329. Which voice first?
**Kick.**

Reasons:

- easy to synthesize
- obvious timing
- easy to hear overlaps/flams
- pitch envelope makes temporal modulation audible
- low conceptual overhead

### 330. Single clock interaction demonstrating uniqueness?
**Two clocks in a live `5:4` relationship whose relative phase can be manually displaced and allowed to drift, while their phase proximity changes the drum timbre.**

That one interaction contains:

- polyrhythm
- phase
- drift
- temporal modulation
- visual clock relationships

It is the smallest convincing thesis demo.

### 331. What can use deliberately plain controls?
Almost everything except the temporal representation.

Plain temporary inputs/buttons are fine for:

- BPM
- ratio numerator/denominator
- drift speed
- synthesis parameters
- volume
- Home duration
- debug values

Do not spend time designing bespoke knobs before the temporal interactions work.

### 332. Which visual decisions must happen early?
Only decisions that affect interaction architecture:

- clocks represented as circular cycles
- phase position maps spatially around orbit
- clocks are individually selectable
- phase can be directly dragged
- actual audio timing drives visual position
- clock and sound voice remain conceptually distinct

Colors, typography, ornamentation, animation style, etc. can wait.

### 333. What can safely be hard-coded in first spike?
Safe temporary hard-coding:

- one master BPM
- two clocks
- one voice
- one fixed modulation route
- one Home duration
- simple colors
- basic parameter ranges
- fixed layout
- Chrome/macOS
- no saving
- no MIDI

### 334. Which hard-coded choices would cause expensive rework?
Do **not** hard-code assumptions that:

- one clock permanently equals one voice
- clocks must use integer ratios forever
- all time is step-based
- all rhythms reset at a bar line
- UI animation is the timing source
- patterns define the fundamental clock
- one sound can only receive one rhythm source
- temporal events equal audible triggers
- phase is stored in milliseconds
- ratios are always automatically reduced
- clocks can never exist silently
- timing engine depends directly on DOM/UI state

These would undermine the full concept.

### 335. Smallest build worth showing another musician
A build with:

- 2–4 clocks
- 2 drum voices minimum
- live ratios
- phase dragging
- drift
- hard reset
- orbital display
- stable timing

SOFT HOME would make it substantially more interesting but is not strictly required for the first private test.

### 336. Smallest build worth recording as demo
Prefer:

- 4 clocks
- 4 recognizable drum voices
- good `5:4`, `7:3`, or similarly obvious demonstrations
- phase dragging
- drift
- coincidence/proximity timbral modulation
- HARD RESET
- SOFT HOME
- readable orbital visualization

Visual polish only needs to be coherent enough that viewers understand what is happening.

### 337. Smallest build worth packaging for someone else
Requires more than the demo build:

- stable audio
- sensible defaults
- basic save/load
- error handling
- Start Audio/onboarding
- safe gain stage
- no terminal required
- simple instructions
- several useful presets/examples
- repeatable installation/opening process

### 338. What marks transition from timing experiment to instrument?
The project becomes an **instrument** when:

- manipulating temporal relationships produces predictable musical consequences
- those relationships can be performed in real time
- sound responds expressively to time
- the user can intentionally leave synchronization and intentionally return
- the system invites exploration rather than merely proving mathematical correctness

A useful litmus test:

**You stop testing `5:4` and start making music with it.**