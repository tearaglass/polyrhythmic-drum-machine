# Polyrhythmic Drum Synth — MVP Product Spec

## Concept
A drum synthesizer built around **polyrhythm, polymeter, phase, and independent clocks**.

Rather than attaching a sequencer to a drum synth, rhythm is part of the instrument’s synthesis architecture. Multiple temporal sources interact, drift, coincide, and modulate sound.

## Core Features
- 4 synthesized drum voices
- Independent clock/rhythm generator per voice
- True polyrhythm and polymeter modes
- Arbitrary clock ratios such as 3:2, 5:4, 7:5
- Integer clock division/multiplication inspired by the Moog Subharmonicon
- Steps, pulses, rotation, phase offset, probability, and accents
- Continuous phase drift between rhythms
- Per-voice pitch, decay, transient, noise, filter, and FM controls
- Route clock phase / coincidence information into synthesis parameters
- HARD RESET to instantly realign clocks
- SOFT HOME to gradually return rhythms to synchronization
- Circular/orbital visualization showing clock relationships
- MIDI clock + Ableton Link

## Design Principle
**Polyrhythm comes first.** Time-warping features exist to create, transform, and perform relationships between simultaneous rhythms—not to turn the instrument into a general-purpose sequencer.

## MVP Goal
Make it immediately possible to create rhythms that would be difficult or annoying to program in a conventional drum machine, while making their temporal relationships visible and playable.