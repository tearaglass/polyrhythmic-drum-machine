# Prebuild Questions 135–180

## Sound architecture

### 135. What synthesis model should each first-build voice use?
Use four simple but distinct synthesis models:

**Kick**
- sine/triangle oscillator
- fast downward pitch envelope
- amplitude decay
- optional click/transient

**Snare**
- short tonal body
- filtered noise burst
- separate tonal/noise balance
- decay control

**Hat**
- metallic/noise source
- high-pass filtering
- very short decay

**Perc**
- FM or resonant percussion
- pitch
- decay
- FM amount / resonance

The goal is not perfect drum emulation. The goal is enough timbral range to hear temporal modulation clearly.

### 136. Different voice models or one common architecture?
**Different models behind one shared voice interface.**

Each voice should support common engine-level operations such as:

- trigger
- pitch
- decay
- level
- mute
- modulation

But its internal synthesis can differ.

### 137. Polyphony inside one voice?
For the first build, **limited polyphony is preferable to hard choking**.

Rapid polyrhythmic hits need to be able to overlap naturally.

### 138. Maximum polyphony per voice
Initial target:

**8 simultaneous hits per voice.**

If the limit is exceeded, steal the oldest/quietest hit.

This is enough for normal rhythmic overlap without creating runaway CPU use.

### 139. Choke groups?
Not required in the MVP.

Eventually useful, especially for:

- closed/open hats
- mutually exclusive percussion articulations

### 140. What happens when a voice is muted?
Let currently sounding hits **finish their decay**.

Mute prevents new audible triggers.

It should not kill the underlying clock or modulation sources.

A future panic action can stop sound immediately.

### 141. What does solo affect?
Solo affects **audio output only**.

Non-soloed clocks and their modulation/routing behavior continue operating.

This lets the user isolate a sound without altering the temporal system.

### 142. Pitch units
Support:

- Hertz internally
- note names / MIDI note equivalents where useful
- ratios where relevant

For drums, the UI can primarily expose intuitive pitch values while retaining Hz under the hood.

### 143. Incoming MIDI pitch behavior
Later support both:

- fixed per-voice pitch
- pitch tracking from incoming MIDI

Not required in the first browser build.

### 144. Should rhythm ratios set oscillator/resonator ratios in the MVP?
**Not as a general feature yet.**

But we should include **one experimental fixed route** demonstrating the idea.

For example:

`clock ratio → FM carrier/modulator ratio`

or:

`clock relationship → resonator tuning ratio`

This is important conceptually, but should not explode the first sound engine.

### 145. Which parameters need smoothing?
Smooth continuous live changes such as:

- pitch
- filter cutoff
- FM amount
- gain
- pan
- continuous modulation depth
- clock-derived timbral modulation

Use short ramps to prevent clicks.

### 146. Which parameters may change abruptly?
Percussive/event parameters can intentionally change per trigger:

- transient strength
- velocity/accent
- envelope start values
- selected noise characteristics
- discrete pattern state
- event-conditioned timbre

Abrupt changes are acceptable when they are part of an intentional trigger.

### 147. What does transient control mean?
It controls the **attack component** of the voice.

Depending on the voice, that may adjust:

- click level
- attack duration
- high-frequency burst amount
- pitch-envelope sharpness

It does not need to have identical DSP meaning for every voice.

### 148. Noise types
MVP:

- white noise
- filtered noise
- metallic/noise-derived source for hats

Later:

- pink
- band-limited
- digital/metallic
- sampled noise/excitation

### 149. Filters
Keep the MVP minimal.

Useful types:

- low-pass
- high-pass
- band-pass where needed internally

Do not build a generalized multimode filter section for every voice unless the sound demands it.

### 150. FM topology
For the Perc voice:

**simple two-operator FM.**

One carrier, one modulator.

Expose:

- carrier pitch
- ratio
- FM amount
- decay

Later, rhythm ratios can optionally drive the operator ratio.

### 151. Velocity sensitivity
Yes, conceptually.

Manual and sequenced triggers should carry a normalized **velocity/accent value**.

MIDI velocity support can map into the same system later.

### 152. How should probability and accents affect synthesis?
Accent should have a **stable default behavior** plus optional routing later.

Default:

- amplitude
- transient intensity

Probability only determines whether the audible trigger occurs.

Do not make probability secretly alter timbre unless explicitly routed.

### 153. Per-voice insert effects?
**No MVP insert rack.**

Small voice-specific nonlinearities or saturation inside a synthesis model are fine.

A generalized insert chain is out of scope.

### 154. Global effects?
MVP:

**none required.**

If one effect is added for playability, use a very simple global reverb or delay, but it should not become part of the core architecture yet.

### 155. Distortion placement
Eventually both can make sense:

- per-voice saturation/distortion
- master distortion

For MVP, keep only lightweight model-specific saturation if useful.

### 156. Master limiter / safety stage?
**Yes. Required.**

Include:

- conservative master gain
- peak limiting or clipping protection
- protection against pathological modulation creating dangerous levels

This should exist even in the technical prototype.

### 157. Normalize output across synthesis settings?
Do **not** aggressively auto-normalize every voice.

That can flatten expressive dynamics.

Instead:

- sensible parameter ranges
- conservative defaults
- gain staging
- limiter protection

Some settings being louder than others is musically legitimate.

### 158. Stereo placement
Mono-compatible by default.

Pan can be added later.

The core rhythm/timing concept should not depend on stereo.

### 159. Multiple outputs/stems later?
**Yes. Reserve for it architecturally.**

A future plugin should plausibly expose:

- stereo master
- individual voice outputs/stems

Do not implement browser multichannel output now.

### 160. Sample rates and buffer sizes
Browser MVP should use the active Web Audio device/context sample rate.

Do not hard-code a specific rate.

Typical 44.1/48 kHz operation should work.

Buffer behavior is browser/device controlled.

### 161. Deterministic offline rendering?
Future requirement, not MVP.

When offline rendering/export exists, deterministic timing should be possible given:

- same preset
- same random seed
- same automation/control history

### 162. Audio recording?
Not initially.

Later:

- master mix first
- stems afterward if useful

### 163. Export file format
When export exists:

**WAV, 24-bit or 32-bit float.**

No need to decide browser encoding implementation yet.

---

## Modulation and routing

### 164. Which objects are modulation sources in the MVP?
MVP modulation sources should be narrowly focused on **time**:

- clock phase
- phase difference
- phase proximity
- event pulse
- cycle count if trivial to expose

The first actually wired source should be:

**phase proximity between two clocks.**

### 165. Which parameters can be modulation destinations?
For the prototype:

A small chosen subset only, such as:

- pitch
- decay
- FM amount
- transient amount
- level

Later expand to:

- filters
- distortion
- pan
- pattern properties
- clock properties
- visual properties
- global parameters

### 166. Can modulation control another clock?
**Full project: absolutely yes.**

Possible future clock destinations:

- speed
- ratio
- phase
- drift
- rotation
- probability
- temporal warp amount

This is one of the key ways the project expands from polyrhythm into time manipulation.

Not required in the first routing UI.

### 167. Feedback loops in clock modulation
Eventually support them **carefully**, rather than banning them completely.

For safety:

- explicit opt-in
- bounded parameter ranges
- finite-value checks
- rate limiting/smoothing
- maximum event density
- easy panic/reset

Feedback between clocks could be musically very interesting, but must never be allowed to destabilize the engine numerically.

### 168. Modulation value types
Support multiple semantic types:

**Unipolar**
`0 → 1`

Useful for:
- phase
- proximity
- envelope-like values

**Bipolar**
`-1 → 1`

Useful for:
- signed phase difference
- centered modulation

**Event**
discrete trigger/pulse

The source defines its natural representation.

### 169. What controls does each modulation route need?
Eventually:

- source
- destination
- amount
- polarity
- enable/bypass

Later, if useful:

- curve
- smoothing
- range clamp

Do not require every advanced control in the MVP.

### 170. Modulation rate
MVP:

**control-rate / scheduler-rate modulation**, sufficient for changing synth parameters smoothly.

Event sources operate at event rate.

Do not require audio-rate clock modulation initially.

Audio-rate temporal modulation can become a later native/plugin experiment.

### 171. What happens at phase wrap?
Do not blindly use raw phase for parameters where the `1 → 0` jump causes unwanted discontinuity.

Provide useful derived forms such as:

- sine/cosine phase
- circular distance
- smoothed phase
- event pulse at wrap

Raw sawtooth phase should still be available when the discontinuity is intentional.

### 172. Multiple modulation sources per destination?
Eventually **yes**.

Combine them predictably.

Default future behavior:

`final value = base value + summed modulation`

with clamping to the valid parameter range.

Other combination modes can come later.

### 173. Add, multiply, replace, or constrain?
Default:

**additive modulation around a base parameter value.**

For ratios and other multiplicative concepts, multiplication may later make more musical sense.

Do not force one global mathematical rule onto every destination forever.

### 174. Show base and modulated value?
**Yes, eventually.**

The UI should make it clear that a control has:

- a base setting
- a current effective/modulated value

This is especially important once time relationships are moving controls continuously.

For the technical spike, a simple animated indicator is enough.

### 175. Routing interaction style
For the eventual instrument, prefer a **modulation matrix / source-destination assignment UI** over giant virtual patch cables.

Possible workflow:

1. select modulation source
2. choose destination
3. set depth

Direct drag-to-modulate interactions could also exist.

Avoid turning the main interface into modular cable spaghetti.

### 176. How many visible routes before readability breaks?
Do not design around showing every route simultaneously.

A selected clock/voice should reveal its relevant routes contextually.

The architecture may support dozens, while the interface shows only a manageable subset.

### 177. Can modulation affect visuals only?
**Yes.**

Temporal information should eventually be able to drive visual behavior independently of sound.

Examples:

- orbit deformation
- brightness
- trails
- geometry
- pulse size
- coincidence flashes

This creates a natural bridge to performance visuals later.

### 178. Save visual-only routing where?
Separate **musical state** from **view/visual state** conceptually.

A complete project file may store both, but a musical preset should not necessarily require a particular visual layout.

Eventually consider:

- sound/rhythm preset
- visual preset
- full scene

### 179. Control mappings vs internal modulation?
**Distinct concepts.**

**Internal modulation**
one musical/temporal signal controls another parameter.

**Control mapping**
keyboard/MIDI/OSC/hardware input controls a parameter.

They can share infrastructure internally, but the UI should not conflate them.

### 180. Can modulation depth itself be modulated?
**Full project: yes.**

This is useful for creating higher-order temporal behavior.

Example:

`Clock A/B proximity → amount of Clock C → FM modulation`

Not needed for the first implementation.

Architecturally, do not make modulation depth permanently non-addressable.