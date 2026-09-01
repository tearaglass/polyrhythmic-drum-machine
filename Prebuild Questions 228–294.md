# Prebuild Questions 228–294

## Presets, persistence, and history

### 228. What belongs in a preset?
A musical preset should include:

- clock settings
- ratios
- phase offsets
- drift settings
- pattern data
- sound parameters
- modulation routes
- Home configuration
- random seeds where relevant

Keep these conceptually separate from:

- UI layout
- controller mappings
- global app preferences

A future **scene/project** may save everything together.

### 229. Should presets capture running phase?
Default: **no**.

A preset stores the configuration, not the exact instant in the performance.

However, a future **snapshot/scene** type should be able to capture current phase relationships explicitly.

### 230. Loading preset: reset clocks or preserve global time?
Eventually offer both.

Default:

**preserve transport but reset affected clocks to the preset's intended Home state.**

Later options:

- Preserve Time
- Restart
- Morph

### 231. When can presets load?
Eventually:

- immediately
- next cycle
- next master boundary
- timed morph

MVP save/load can simply load immediately while stopped or reset temporal state on load.

### 232. Which parameters interpolate during morphing?
Continuous parameters should interpolate:

- pitch
- decay
- FM
- filter
- level
- phase offset
- drift
- modulation depths
- continuously variable ratios where supported

Discrete values should switch at meaningful boundaries:

- pattern length
- step states
- synthesis model
- routing topology

Clock-rate morphing should preserve phase continuity.

### 233. Autosave?
**Yes for the first useful version.**

Autosave current local state and restore after accidental refresh/crash where possible.

Do not make autosave part of the technical timing spike.

### 234. Warn before replacing unsaved state?
Once manual projects/presets exist: **yes**.

If autosave is comprehensive, warnings can remain minimal.

### 235. What should undo cover?
Eventually:

- parameter edits
- pattern edits
- routing
- randomization
- clock creation/deletion
- preset loads where feasible
- layout changes

Do not treat live performance gestures like phase scrubbing as hundreds of tiny undo operations.

Instead, one gesture should equal one undoable action where sensible.

### 236. How much undo history?
No strong requirement yet.

Something like **50–100 meaningful actions** is more than sufficient initially.

### 237. Undo while playing?
**Yes.**

Undo should not reset transport or clock phase unless the operation being undone explicitly changed temporal state.

### 238. Shareable preset format?
**Yes: human-readable JSON.**

Important because:

- easy to debug
- easy to version
- easy to share
- easy for future tools/scripts to generate
- suitable for eventual community preset exchange

### 239. Preset versioning?
**Yes from the beginning.**

Every serialized state should include a schema version.

Example:

```json
{
  "schemaVersion": 1
}
```

Migration logic can stay trivial until the format actually changes.

### 240. Copy/paste voice or full state as text?
**Eventually yes.**

Very useful for:

- sharing
- debugging
- experimentation
- saving small configurations in notes/repos

JSON fragments are fine.

### 241. Factory presets?
Eventually yes, but do not spend time naming or designing them yet.

Early presets should primarily prove distinct temporal concepts:

- 3:2
- 5:4
- long recurrence
- phase drift
- Soft Home
- coincidence modulation

### 242. Blank state vs default playable state?
**Yes.**

**Default**
immediately makes a useful sound.

**Blank**
contains minimal/no active routing and is useful for deliberate construction.

Open the app into the playable default, not silence.

### 243. Show local storage failures?
Yes.

If persistence fails, show a concise warning rather than silently pretending state was saved.

### 244. Cloud sync?
**Explicitly out of scope.**

No accounts or backend required.

---

## Recording, export, and interoperability

### 245. What should recording eventually capture?
The first recording feature should capture **audio**.

Later, performance capture could also store:

- clock events
- parameter gestures
- phase manipulation
- Home operations
- scene changes

That would allow deterministic performance replay.

### 246. Must performance replay be deterministic?
If we build control/performance replay: **yes where possible**.

Random systems need saved seeds.

External uncontrolled inputs may naturally break perfect determinism.

### 247. What determines exported loop length?
Eventually selectable:

- number of master cycles
- selected clock cycles
- full recurrence
- fixed duration
- manual stop

The interesting option unique to this instrument is:

**render one complete recurrence.**

### 248. Extremely long recurrence?
Do not force users to render absurdly long files.

If recurrence is huge, show it and allow:

- fixed duration
- selected subset recurrence
- manual length
- capped recurrence render

### 249. Include effect/decay tail?
**Yes.**

Audio exports should optionally include a short tail.

### 250. Seamless loop export?
Eventually useful.

For truly seamless loops, export from a state that mathematically returns to its initial phase configuration.

This makes recurrence-aware loop export especially natural for this project.

### 251. Export metadata?
Yes, when practical:

- BPM
- active ratios
- recurrence duration
- random seed
- preset/schema version

Could live in accompanying JSON rather than forcing exotic WAV metadata.

### 252. Browser drag-and-drop export?
Potentially useful but not a priority.

Normal download/export UI is enough initially.

### 253. Faster-than-real-time offline rendering?
**Eventually yes**, especially if recurrence periods become long.

Not relevant to the MVP.

### 254. MIDI export per voice?
Eventually **yes**.

One MIDI track per sound voice is the obvious default.

Clock-only generators may optionally export their event streams too.

### 255. Represent phase drift/tempo curves in MIDI?
Approximate them using timestamped note events and tempo automation where possible.

Do not expect MIDI to perfectly represent the internal temporal model.

For genuinely continuous temporal warping, an exported event list or native project format will preserve more information than Standard MIDI Files.

### 256. Visual recording?
Not initially.

Use screen capture / OBS for visuals first.

Direct visual export can come later if there is a concrete use case.

### 257. Alpha transparency for visual export?
If native visual export/OBS output is built later: **yes, desirable**.

Not relevant to current architecture beyond keeping the renderer separable.

### 258. Future DAW automation/plugin recall constrain parameter IDs?
**Yes.**

Use stable internal IDs for important parameters from the beginning.

Do not rely on UI labels as identifiers.

Example:

`voice.0.pitch`
`clock.2.ratioNumerator`

or another stable scheme.

---

## Application structure and implementation choices

### 259. File-open or local server?
A small local development server is completely acceptable.

The eventual user-facing browser build can be hosted or packaged.

Do not optimize development around `file://`.

### 260. Is Node.js acceptable?
**Yes for development.**

The eventual instrument should not require users to understand Node or use a terminal.

### 261. PWA?
Potentially useful later, but **not required**.

Offline capability can be achieved without committing to PWA behavior immediately.

### 262. Browsers?
First target:

**current Chrome on macOS.**

Browser-specific limitations are acceptable initially.

Later target modern Chromium + Safari where practical.

Do not burden the first timing prototype with universal browser compatibility.

### 263. AudioWorklet acceptable?
**Yes.**

If AudioWorklet materially improves timing, scheduling, or DSP reliability, use it.

Do not avoid a good architecture merely because it is slightly more advanced.

That said, do not introduce it before there is a concrete timing/DSP reason.

### 264. Module structure?
**Yes. Strongly separate concerns.**

Suggested broad modules:

- timing / clocks
- scheduler
- sound engine
- individual voice models
- patterns
- modulation
- state/serialization
- visualization
- UI/input

Avoid one giant app file.

### 265. Reusable timing engine?
**Absolutely.**

The timing/clock model should be as independent from the browser UI as practical.

This is one of the most important technical decisions because the clock engine may later migrate to:

- desktop
- plugin
- Max device
- hardware
- other creative tools

### 266. Future native technology?
Undecided.

Likely candidates later:

- C++ / JUCE
- Rust + suitable plugin framework

Do not choose now.

The browser prototype exists partly to discover what the native implementation actually needs.

### 267. Browser and plugin identical sound/timing?
**No strict bit-identical requirement.**

They should preserve the same musical behavior and concepts.

A later native version may improve:

- DSP
- timing
- synthesis quality
- event density

Do not constrain future implementation to browser quirks.

### 268. Dependency count/size?
Keep it **small and intentional**.

No arbitrary numeric limit.

A dependency should earn its existence by solving a meaningful problem.

Avoid enormous framework/ecosystem overhead for a relatively focused instrument.

### 269. Restrictive commercial licenses?
**Avoid them.**

Prefer permissive licenses such as:

- MIT
- BSD
- Apache-2.0

Do not casually introduce dependencies that could prevent commercial distribution later.

### 270. Dependencies offline/bundled locally?
For released builds: **yes**.

Core instrument functionality should not depend on remote CDNs or services.

### 271. Central configuration file?
**Yes.**

Have obvious configuration/data structures for things like:

- default voice settings
- parameter ranges
- keyboard bindings
- default clock state
- visual constants where appropriate

Do not bury basic product tuning across dozens of implementation files.

### 272. What should be editable without core-engine work?
At minimum:

- voice defaults
- parameter ranges
- presets
- keyboard mappings
- visual settings
- available quick ratios
- initial instrument state

Adding a new synthesis voice or clock transformation may legitimately require engine code.

### 273. Hot reload?
**Yes, useful during development.**

Use a simple modern development workflow.

This does not imply a heavyweight production framework.

### 274. Debug panel?
**Definitely yes.**

Hidden/dev-only panel should expose things like:

- scheduler timing
- event queue
- current clock phase
- measured timing error
- active sound count
- audio context state
- CPU-ish diagnostics where available
- visual FPS

This will save enormous pain when debugging polyrhythmic timing.

### 275. Performance budget?
No hard percentage yet.

Initial target:

- comfortably run the MVP on Apple Silicon
- no audio dropouts
- visualization remains smooth
- audio retains priority over rendering

Optimize based on measurement, not premature micro-optimization.

### 276. Architecture capacity?
Even if the UI exposes four voices initially, design comfortably toward approximately:

- 8–16 sound voices
- 16–32 clocks
- dozens of modulation routes

This is a design target, not a promise that all configurations remain cheap indefinitely.

### 277. Low-power mode?
Eventually useful.

Lower:

- visualization FPS
- decorative animation
- analyzer work

Never degrade audio timing just to save visual CPU.

### 278. Audio context requires user interaction?
Expected browser behavior.

Initial screen can show a simple:

**START AUDIO**

interaction.

Do not pretend audio can autoplay when browsers prohibit it.

### 279. Recover audio-engine errors without reload?
Where practical: **yes**.

Provide a recover/reinitialize-audio operation that preserves musical configuration.

If full recovery is impossible, retain state and make reloading safe through autosave.

---

## Product form and distribution

### 280. Intended first distribution format?
Development:

**source repo + hosted browser build.**

First user-friendly release:

**hosted web app and/or downloadable offline web bundle.**

Native desktop/plugin packaging can come later.

### 281. Should buyers need a terminal?
**Absolutely not.**

Development can be terminal-heavy.

Released product should open like normal software.

### 282. Config file vs visible controls?
Important musical controls must be visible.

Config files are appropriate for:

- developer defaults
- advanced customization
- controller templates

Do not require users to edit JSON to perform normal synthesis/time operations.

### 283. Source redistribution?
Undecided until licensing/business model is chosen.

Do not assume either closed or open source yet.

### 284. Commercial licensing for assets/dependencies?
**Yes.**

From the start, only use assets/dependencies that leave commercial release legally possible.

Avoid creating a licensing archaeology problem later.

### 285. Multiple visual layouts or one configurable instrument?
Prefer **one coherent instrument with a few purposeful views**, rather than dozens of themes/layouts.

Likely:

- Edit
- Perform
- Visual/OBS

### 286. One product or beginning of a family?
For now: **one product.**

But some internal systems may eventually be reusable across related tools.

Do not start building a “platform” before the instrument exists.

### 287. What could be independently packaged later?
Potential candidates:

- clock/time engine
- orbital visualizer
- MIDI/OSC temporal generator
- standalone clock modulation utility
- OBS visualization

But none should be split out until they have obvious standalone value.

### 288. First sellable version requirements?
Yes, a sellable release should have:

- onboarding
- concise documentation
- good defaults
- useful factory presets
- demo video/audio
- reliable save/load
- stable performance
- clear explanation of polyrhythm/phase concepts

The MVP does not need all of this.

### 289. First intended user?
Primary:

**experimental musicians, producers, and live performers interested in rhythm.**

Secondary:

- sound designers
- electronic composers
- modular musicians
- creative coders
- visual/installation artists
- educators interested in rhythm/phase

The first user can still be the creator; product design should not assume specialist academic knowledge.

### 290. Expected knowledge?
Assume users understand basic music production concepts:

- tempo
- drums
- sequencing
- maybe subdivisions

Do **not** require them to already understand:

- phase mathematics
- least common multiples
- advanced ratio theory
- signal routing jargon

The instrument should teach its deeper concepts through interaction.

### 291. Price range/product scope?
Undecided.

Do not allow pricing speculation to inflate the MVP.

If it becomes a polished standalone/plugin instrument, it should be treated like a serious creative music tool rather than a disposable $5 toy.

Exact pricing comes after musical validation.

### 292. Update mechanism?
For web version: deployment handles updates.

For downloadable/native versions later:

simple replacement versions are sufficient initially.

No custom auto-updater required until distribution scale justifies it.

### 293. Telemetry?
Default position:

**none in the early instrument.**

If anonymous diagnostics ever become useful, make them transparent and optional.

No analytics requirement should influence the MVP.

### 294. Account creation?
**Explicitly out of scope.**

The instrument should work without:

- login
- subscription account
- cloud profile
- internet connection

unless a future optional service creates a compelling reason otherwise.