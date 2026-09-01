# Polyrhythmic Drum Synth — Full Product Spec

## Concept
A performance-oriented drum synthesizer and **experimental temporal instrument** centered on polyrhythm.

The instrument treats clocks as modular musical objects. Rhythms can divide, multiply, stretch, drift, warp, interact, modulate one another, and control synthesis. Pitch and rhythm can share the same ratio-based mathematical system.

## Core System
- 8+ synthesized percussion voices
- Multiple independent TIME GENERATORS
- Arbitrary rational, harmonic, continuous, and free-running clock relationships
- Polyrhythm, polymeter, Euclidean rhythms, nested tuplets, and compound rhythmic structures
- Clock routing: multiple clocks can drive one voice or one clock can drive many destinations
- Clock-to-clock modulation
- Continuously changing ratios
- Phase shifting, phase drift, phase locking, and phase scrubbing
- Temporal stretching/compression
- Nonlinear tempo curves and elastic subdivisions
- Nested clocks and recursively structured rhythms
- Conditional/event-driven clock advancement
- Coincidence detection and synchronization events
- Controlled desynchronization and resynchronization

## Rhythm as Modulation
Expose temporal measurements as modulation sources:

- phase
- phase difference
- time since last event
- time until next event
- distance to clock coincidence
- cycle count
- event density
- clock speed / acceleration

These can control pitch, tuning, decay, FM, filters, distortion, panning, samples, effects, or other clocks.

## Sound Engine
Multiple percussion synthesis models including:
- analog-style drum synthesis
- FM/PM percussion
- noise/transient synthesis
- modal/resonator synthesis
- physical-model-inspired membranes
- samples and sample excitation
- granular and feedback percussion

Rhythmic ratios can optionally determine oscillator/resonator pitch ratios, linking harmony and rhythm.

## Temporal Performance Tools
- HARD RESET
- SOFT HOME
- PARTIAL HOME
- NEW HOME
- GRAVITY HOME
- clock freeze/release
- phase scrubbing
- scene morphing
- global TIME FIELD macro
- rhythmic mutation
- controlled randomness
- long-form recurrence / cycle visualization

## Interface
The primary visualization is an **orrery of interacting clocks**, not a conventional piano-roll or step sequencer.

Users should be able to see rhythms rotating, drifting, aligning, and diverging in real time.

A secondary grid/editor can exist for precise pattern editing.

## Connectivity
- VST3 / AU / CLAP
- standalone application
- MIDI in/out
- MIDI clock
- Ableton Link
- OSC
- audio-rate modulation where practical
- eventual CV / modular integration
- external control of visuals, lighting, and installations

## Product Boundary
This is **not a DAW**.

No full arrangement system, audio-track recording environment, or attempt to replace Ableton.

Everything must serve the central thesis:

**Create extraordinary percussion by manipulating relationships between simultaneous musical clocks.**