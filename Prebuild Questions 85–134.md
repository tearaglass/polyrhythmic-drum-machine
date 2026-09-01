# Prebuild Questions 85–134

## Pattern construction

### 85. Minimum and maximum step counts per voice
When step patterns are introduced:

**1–64 steps** initially.

The engine should not fundamentally depend on 16-step conventions.

Later we may expand the practical maximum if long patterns prove useful.

### 86. Minimum and maximum pulse counts
For Euclidean/generated patterns:

**0–number of steps.**

So a 13-step pattern can contain anywhere from 0–13 pulses.

### 87. Is zero pulses valid?
**Yes.**

A silent pattern is legitimate.

Its clock can still:

- run
- modulate
- participate in coincidence calculations
- drive other systems

### 88. Can a voice have one step?
**Yes.**

A one-step pattern essentially becomes a periodic event generator.

That is useful and should not be treated as an edge case.

### 89. How is rotation measured?
Internally:

**normalized phase / fraction of cycle.**

For discrete patterns, the UI can additionally express rotation in whole steps.

Eventually support:

- steps
- percentage
- degrees

The underlying representation should support fractional rotation.

### 90. Can rotation be modulated continuously?
**Eventually yes.**

This is one of the more interesting ways to create phase processes.

Not necessary in the initial MVP pattern editor.

### 91. Should rotation wrap immediately?
**Yes.**

Rotation is circular and deterministic.

Moving past the end wraps cleanly to the beginning.

### 92. Euclidean algorithm and manual editing
Use the standard **Bjorklund/Euclidean distribution** for generated patterns.

After generation, users should eventually be able to edit individual steps manually.

The generator should be treated as a way of creating a pattern, not a prison.

### 93. What happens to manual edits when pulse count changes?
For the first implementation:

Changing pulses **regenerates the Euclidean pattern**.

Manual edits can be discarded.

Later we may introduce a distinction between:

- generated mode
- edited/custom mode

Do not complicate this until we actually need it.

### 94. Per-step parameters?
Eventually support:

- velocity/accent
- probability
- microtiming
- condition
- perhaps ratchet count

Not all are MVP requirements.

The first pattern implementation only needs:

- active/inactive
- accent/velocity

### 95. Accent binary or continuous?
**Continuous.**

Internally represent accent/velocity as a normalized value.

The UI may still offer quick binary-looking accents.

### 96. What can accent affect?
Eventually accent should be usable as a general expression value.

Default behavior can affect:

- amplitude
- transient strength

Optionally it may influence:

- pitch
- decay
- filter
- FM
- modulation depth

Do not hard-code accent as volume only.

### 97. Rests: explicit data or inactive steps?
**Inactive steps.**

There is no need for a second rest object initially.

### 98. Pattern manipulation operations
Eventually useful:

- paint/toggle
- drag
- rotate
- clear
- randomize
- invert
- mirror

For the first pattern editor:

- toggle
- drag-paint
- rotate
- clear

are sufficient.

### 99. Which mutations need undo?
Once undo exists, all destructive pattern edits should be undoable:

- randomize
- clear
- invert
- mirror
- manual edits
- generator regeneration

Undo itself is not required for the first technical prototype.

### 100. Randomization behavior
When added:

**seeded and repeatable by default.**

Randomness should be capable of becoming part of the composition.

There may later also be continuously stochastic modes.

### 101. Save random seed?
**Yes.**

Any deterministic generative behavior should restore identically from a preset.

### 102. When does probability reroll?
Default:

**every eligible event.**

Later selectable behaviors might include:

- every cycle
- every master bar
- fixed seed sequence
- held probability state

But event-by-event is the expected default.

### 103. Conditional triggers?
**Definitely part of the full instrument, not MVP.**

Important future conditions include:

- every Nth cycle
- another clock triggered
- clocks coincided
- previous event fired
- previous event did not fire
- phase lies inside a region
- fill mode active

This fits the project's temporal-logic direction extremely well.

### 104. Ratchets in MVP?
**No.**

They are useful but not conceptually central enough to burden the early build.

### 105. Ratchet spacing?
When implemented, evenly spaced by default.

More advanced ratchet timing can later be warped or independently positioned.

### 106. Can microtiming cross neighboring step boundaries?
Eventually **yes**, within safety/reasonable constraints.

We should not impose a MIDI-grid worldview where events are forbidden from crossing conceptual step boundaries.

The timeline is continuous.

### 107. Swing scope
Do not prioritize conventional swing.

When implemented it should probably exist **per clock or temporal layer**, not merely as one global groove knob.

This instrument already has far richer ways to displace timing.

### 108. Swing with odd counts/non-integer ratios
Swing should operate as a **temporal deformation of subdivisions**, not assume pairs of 16th notes.

Its exact semantics can remain undecided until implemented.

### 109. How should tuplets be represented?
Prefer **ratios and nested clocks**, not a special unrelated tuplet engine.

Tuplets are another manifestation of divided time.

### 110. Pattern-length changes and hidden steps
Preserve out-of-range steps as **hidden pattern data** initially.

If a 16-step pattern becomes 7 steps and later returns to 16, the original later steps should still exist.

Provide an explicit destructive trim/reset operation later.

### 111. What does copying a pattern copy?
A **pattern copy** copies only pattern/event data.

A **voice copy** can later copy:

- pattern
- clock
- sound
- modulation

Keep those concepts separate.

### 112. Temporary fill/mutation?
**Yes, eventually.**

A hold-to-mutate/fill operation that returns to the prior state on release would be excellent for performance.

Not MVP.

---

# Phase, drift, coincidence, and recurrence

### 113. What is phase measured against?
Every clock has its own normalized phase:

`0 → 1`

Relationships can then be measured against:

- its own cycle
- the master clock
- another selected clock

The internal concept stays simple; the interface chooses the relevant reference.

### 114. How should phase be displayed?
Primary visual representation:

**position around the orbit.**

Numeric representations may include:

- percentage
- degrees
- cycle fraction

Musical subdivisions can be shown when meaningful.

No single display unit needs to dominate.

### 115. Store phase offset as duration or fraction?
**Fraction of cycle.**

Example:

`0.25 = 90° = one quarter-cycle offset`

This preserves the musical relationship when tempo changes.

### 116. What happens to phase offset when tempo changes?
Because phase offset is normalized to the cycle, its absolute duration scales with tempo.

The relative phase relationship stays constant.

### 117. Dragging a running clock's phase
**Yes. Direct phase manipulation is fundamental.**

While dragging:

- phase follows the gesture
- crossed trigger points should generally be suppressed
- do not machine-gun the voice while scrubbing

When released, normal event generation resumes from the new phase.

A future alternate "scrub triggers" mode could intentionally fire crossed events.

### 118. What produces drift?
First implementation:

**small speed differences.**

This creates genuine phase drift rather than merely animating an offset parameter.

Later selectable mechanisms can include:

- changing phase offset
- acceleration
- jitter
- random walk
- external modulation

### 119. Drift behavior
Default:

**wrap forever.**

A slightly faster clock continuously laps the slower one.

Later modes:

- bounce
- bounded
- destination
- one-shot
- manually released

### 120. Drift range limit?
Eventually, yes.

A **bounded phase relationship** could be a very useful time-warp operation.

Not required initially.

### 121. What qualifies as coincidence?
For actual trigger coincidence:

Two or more temporal events fall within a small configurable **time-tolerance window**.

Exact mathematical equality is too brittle for practical performance systems.

Internally, use high-resolution scheduler time.

### 122. Coincidence of what?
Distinguish several concepts:

**Phase alignment**
clocks occupy approximately the same normalized phase.

**Event coincidence**
clock events occur at approximately the same absolute time.

**Trigger coincidence**
audible/gated triggers occur at approximately the same time.

The full system should eventually expose all three.

For the first version, focus on **phase proximity** and event coincidence.

### 123. Does a probabilistically skipped event count?
As a **clock/event coincidence: yes.**

As an **audible trigger coincidence: no.**

This is another reason temporal events and sound triggers must remain separate concepts.

### 124. Default coincidence behavior
Default should be:

- visible indication
- modulation value available internally

It should **not automatically fire extra sounds**.

Users can later route coincidence events to actions.

### 125. Coincidences between more than two clocks?
**Yes, eventually.**

The system should be capable of detecting:

- pairwise coincidences
- selected groups
- full-system alignment

Multi-clock convergence is one of the project's more interesting compositional ideas.

### 126. Near-coincidence as continuous value?
**Absolutely.**

This should be one of the flagship modulation concepts.

Define a normalized **phase proximity** value:

`0 = maximally separated`
`1 = perfectly aligned`

That value can continuously modulate sound or other temporal behavior.

### 127. Proximity around phase wrap
Use **circular distance**, not ordinary subtraction.

For phases `a` and `b`:

`distance = min(|a-b|, 1-|a-b|)`

So phase `0.99` and `0.01` are very close, not almost an entire cycle apart.

### 128. Predict next coincidence?
**Eventually yes.**

For deterministic clocks, display:

- time until next event coincidence
- perhaps location in the orbit
- perhaps which clocks will coincide

Not MVP.

### 129. Show time/cycles until full recurrence?
**Yes.**

This should become a signature visualization.

Possible display:

`RECURRENCE  02:47`
`163 master cycles`

For dynamically drifting or irrational/free clocks where exact recurrence does not exist:

`NO FINITE RECURRENCE`

or

`APERIODIC`

should be a meaningful state, not an error.

### 130. Define PARTIAL HOME, NEW HOME, GRAVITY HOME
These belong to the full instrument.

**PARTIAL HOME**
Realign only selected clocks while leaving all others untouched.

**NEW HOME**
Declare the current phase configuration to be the new reference/home state. Future Home operations return to this relationship instead of universal phase zero.

**GRAVITY HOME**
Apply a continuous attractive force toward the target phase configuration. Clocks progressively bend their speeds toward synchronization rather than following one fixed linear correction.

Gravity strength should eventually be performable/modulatable.

### 131. Can Home target selected clocks?
**Yes.**

Selection-based Home behavior is essential.

Global Home is merely the default when nothing specific is selected.

### 132. Can trigger intervals change during Soft Home?
**Yes. Deliberately.**

The audible stretching/compression produced while clocks realign is part of the instrument.

Do not hide it.

Home is a musical temporal operation, not merely error correction.

### 133. What does realignment target?
Default target:

**the defined Home phase configuration.**

Initially that is phase zero / shared origin.

Once NEW HOME exists, it may be any stored phase relationship.

Later we may also support:

- nearest shared event
- next coincidence
- selected target phase

### 134. Can Home be cancelled midway?
**Yes.**

Cancelling should freeze the correction operation and preserve whatever phase relationship has been reached.

The clocks then continue normally from that new state.

This turns Soft/Gravity Home into performable gestures rather than irreversible commands.