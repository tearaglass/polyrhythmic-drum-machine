# Prebuild Questions 181–227

## Visualization and spatial behavior

### 181. What does each orbit represent?
Primarily: **a clock cycle**.

A clock may be associated with:

- a sound voice
- a pattern
- another clock
- modulation only

But the orbit itself represents **time**, not the sound source.

### 182. Are orbit sizes meaningful?
Initially: **mostly compositional/layout-based**.

Later, orbit size may optionally encode something useful such as:

- hierarchy
- clock grouping
- parent/child relationship
- selected importance

Do not make radius equal tempo or ratio by default; that could become visually unreadable.

### 183. How should faster clocks move?
They should **complete more laps**.

Visual angular velocity should correspond to actual clock phase velocity.

A fast clock should visibly lap a slow one.

This direct correspondence is important.

### 184. How are pulses shown under uneven/warped timing?
Pulse positions should be placed according to their **actual temporal position within the cycle**, not evenly around the circle if time itself has been warped.

If a temporal warp causes intervals to bunch together, the geometry should show that bunching.

This is one of the reasons the circular interface matters.

### 185. Visually distinguish accents, probability, mute, skipped triggers, conditions?
Use multiple cues without depending only on color.

Possible visual language:

**Active pulse**
solid marker

**Inactive/rest**
small hollow or faint marker

**Accent**
larger/thicker marker

**Probability**
partial ring / opacity / secondary arc

**Skipped probabilistic trigger**
brief hollow flash instead of normal trigger flash

**Muted**
orbit remains visible but subdued

**Conditional**
distinct outline or small attached symbol

Exact styling can evolve later.

### 186. Distinguish phase offset from drift
**Phase offset** should appear as static displacement from the reference/home marker.

**Drift** should have an additional indication of ongoing relative motion, such as:

- directional trail
- small velocity arrow
- drift ring
- moving offset indicator

The user should be able to tell:

“this clock is currently displaced”

from:

“this clock is actively moving away.”

### 187. How is coincidence shown?
Coincidences should create a clear but brief visual event.

Possible first behavior:

- clocks/orbits momentarily brighten or thicken
- a line briefly connects coincident clocks
- shared center or intersection flashes

The indication should persist long enough to perceive—roughly a few hundred milliseconds—but not obscure subsequent events.

### 188. Should sound affect orbit appearance?
Eventually, yes.

Useful mappings:

- amplitude → pulse size
- decay → visual trail length
- timbre → texture/shape
- transient → flash sharpness

But temporal information must remain visually primary.

Do not let audio-reactive decoration obscure clock behavior.

### 189. Scheduled events or measured audio output for visuals?
Musically meaningful timing visuals should be driven by **scheduled temporal/audio events**.

Measured audio can later provide secondary expressive animation.

The interface should not wait for an analyzer node to guess when a kick happened if the scheduler already knows.

### 190. Reduced-motion setting?
Eventually **yes**.

It should reduce nonessential motion while retaining enough temporal information to understand the system.

Not required in the earliest prototype.

### 191. Can ambient motion be disabled separately?
**Yes.**

Distinguish:

- musically meaningful clock movement
- decorative/ambient animation

Decorative motion should always be independently disableable.

### 192. What happens to inactive voices?
Keep them visible but **dimmed** by default.

Users need spatial consistency.

A later compact mode may collapse unused modules.

### 193. Rearrange/resize/duplicate/hide modules?
Full product:

- rearrange: yes
- hide/collapse: yes
- duplicate clock/voice: yes
- resize some panels: possibly

Not MVP.

Avoid making the UI into a freeform window manager unless actual use demands it.

### 194. Does layout persist separately?
**Yes.**

Musical state and layout state should be conceptually separable.

A full project can save both.

### 195. Compact performance layout vs detailed editing layout?
**Yes.**

Eventually:

**EDIT**
full clock parameters, synthesis, routing, patterns

**PERFORM**
large orbits, essential macros, mute/solo, Home, phase manipulation, transport

This feels worth designing toward early.

### 196. Is fullscreen important?
**Yes for the full product.**

The orbital visualization should be capable of becoming a fullscreen performance surface.

Not required for the technical spike.

### 197. Target resolutions/aspect ratios
Initial target:

**normal desktop/laptop screens around 1440×900 and larger.**

The UI should also remain usable around 1280×720.

Ultrawide and unusual screens can be handled responsively later.

### 198. Touch/phone support?
**Desktop pointer input first.**

Touch support may eventually be worthwhile, particularly for tablets.

Phone layout is not an MVP requirement.

### 199. Fine adjustment interaction
Eventually support:

- modifier-drag for fine adjustment
- click/drag
- scroll wheel where appropriate
- direct numeric/text entry

For ratios especially, direct text entry remains essential.

### 200. Reset single control to default
Use a conventional gesture such as:

**double-click control → default**

or a context action.

Exact platform interaction can be decided during UI prototyping.

### 201. Dramatic actions: confirmation?
Performance actions should generally **not require modal confirmation**.

Examples:

- HARD RESET
- SOFT HOME
- freeze
- mute

They need to be playable.

Dangerous destructive data operations can require confirmation.

For especially dramatic musical gestures, a hold behavior may sometimes be useful, but not as a blanket rule.

### 202. Which states need non-color cues?
At least:

- selected/unselected
- muted/unmuted
- running/stopped
- drift active
- probability-skipped event
- coincidence
- clock direction
- Home operation active

Use shape, thickness, motion, icons, or pattern in addition to color.

### 203. Contrast/text size
Keep normal controls clearly legible at performance distance.

Exact accessibility targets can be formalized later, but avoid tiny techno-interface text.

A good practical minimum for normal UI text is around **12–14 px equivalent**, with larger values for performance-critical data.

### 204. Keyboard navigation/focus in MVP?
Basic sensible focus behavior: **yes**.

A complete accessibility/keyboard-navigation pass can come after the musical prototype.

Do not intentionally build something impossible to operate without precision mouse movements.

### 205. Automatic density changes?
Use responsive layout where obvious, but favor **user-selectable Edit/Performance views** rather than aggressively hiding controls based only on screen width.

### 206. OBS mode?
Future feature:

**yes.**

A dedicated visualization/output view could hide controls and retain only:

- clocks
- phase
- pulses
- coincidences
- selected expressive visuals

Transparency can be added then.

Not MVP.

### 207. Transparency safeguards
If transparent OBS output exists later, important clock geometry should have configurable:

- outline
- glow
- contrast backing
- alternate high-contrast mode

so arbitrary video backgrounds do not swallow it.

### 208. Reduce render activity when idle?
**Yes.**

Visual rendering may reduce FPS when nothing meaningful is changing.

Audio scheduling must remain unaffected.

---

# Input, MIDI, and performance control

### 209. Keyboard keys for four voices
Initial default:

- `1` Kick
- `2` Snare
- `3` Hat
- `4` Perc

Simple and visible.

Alternative drum-pad layouts can be added later.

### 210. Shortcuts while editing text?
**No.**

When a numeric/text field has keyboard focus, global performance shortcuts should be suppressed except perhaps a dedicated panic command.

We do not want typing `5:4` to trigger percussion.

### 211. MIDI note input at launch?
Not required for technical spike.

Desirable for first sellable/playable version.

### 212. What should MIDI notes do?
Default future behavior:

**trigger voices.**

Mappings should later be assignable.

Chromatic pitch control may be optionally supported for voices where meaningful.

Pattern selection via MIDI can come later.

### 213. MIDI learn?
**Yes eventually.**

Especially for:

- ratios
- phase
- drift
- Home
- mute/solo
- synthesis controls
- TIME FIELD-style macros

Not MVP.

### 214. Supported MIDI message types
First implementation later:

- notes
- CC

Eventually useful:

- pitch bend
- channel aftertouch
- poly aftertouch where practical
- program change

NRPN can wait unless a particular controller demands it.

### 215. Relative or absolute CC?
Support both eventually.

The default/simple implementation can start with **absolute CC**.

Relative encoders should be added when controller testing requires them.

### 216. Soft takeover?
**Yes.**

For absolute hardware controls, pickup/soft takeover should prevent abrupt parameter jumps.

This matters a lot in performance.

### 217. One hardware control → several parameters?
**Yes eventually.**

This enables macros.

A single knob might simultaneously:

- increase drift
- shorten decay
- increase FM
- distort phase

This is musically useful.

### 218. Several controls → one parameter?
Technically yes.

The most recently changed control can determine the effective hardware input.

Avoid overcomplicating this unless needed.

### 219. Mapping storage
Prefer separate **controller profiles**, with optional preset-specific overrides later.

A MIDI controller setup should not disappear merely because a sound preset changes.

### 220. OP-1 mapping in initial release?
**No requirement.**

Do not tie the first release to one controller.

Controller-specific templates can come later.

### 221. OSC before plugin development?
Potentially useful, especially for:

- visuals
- installations
- external temporal control

But **not required before plugin development**.

Implement when a concrete use case appears.

### 222. Emit rhythm events as MIDI notes?
**Yes eventually.**

Each clock/pattern should be capable of driving external instruments.

Configurable per route:

- channel
- note
- velocity
- gate duration

This is an important future feature.

### 223. Export internal relationships via MIDI clock or note events?
Internal rhythms should be represented as **MIDI note/event streams**, not changing MIDI transport clock.

Master synchronization uses MIDI Clock.

This separation keeps external devices sane.

### 224. Performance-safe editing lock?
**Yes.**

Performance mode should eventually offer a lock preventing accidental:

- layout changes
- destructive edits
- text selection
- module deletion

while keeping intentional performance controls active.

### 225. Which operations must never cause audio dropout?
At minimum:

- ratio changes
- phase changes
- drift changes
- mute/solo
- synthesis parameter changes
- adding/removing ordinary modulation routes
- Home operations
- manual triggers
- view/layout changes

Anything likely to reinitialize the audio engine should not be a routine performance action.

### 226. Suppress browser navigation/scroll/text selection in performance mode?
**Yes where appropriate.**

Performance mode should prevent accidental:

- page scrolling
- text selection
- browser-spacebar scrolling
- drag behaviors unrelated to the instrument

But do not hijack standard browser commands unnecessarily outside performance mode.

### 227. MIDI disconnect/reconnect behavior
If a MIDI device disconnects:

- keep the instrument running
- preserve mappings
- indicate device loss

If it reconnects:

- automatically reattach where identity can be matched safely
- preserve existing mappings
- avoid parameter jumps on reconnection

No audio reset should be required.