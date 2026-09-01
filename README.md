# Polyrhythmic Drum Machine

A browser instrument for working with linked clocks, kick synthesis, straight-tempo drumhead impact, two-click monitoring, swing, MIDI, and recording.

## How to run

Requires a current Chromium-based browser and Node.js.

```sh
npm install
npm run dev
```

Open the local address printed by Vite, then press `START AUDIO`.

## Sound modes

### Kick setup

- Clock A triggers the synthesized kick.
- Clock B stays silent and can follow Clock A or sidechain its pitch, decay, transient, FM, and level.
- Clock C stays locked to the straight `1:1` master pulse and triggers the tunable drumhead-impact voice.

### Two clicks

- Clock A and Clock B produce separate high and low clicks.
- Swing delays alternating events relative to each clock's own rate.
- Kick-related controls remain saved but dim while inactive.
- Clock C is silent.

## Clock controls

- Use the ratio buttons or enter a ratio directly.
- Phase covers one complete cycle.
- Drift moves symmetrically around its center-zero mark.
- `FOLLOW` makes Clock B derive its motion from Clock A.
- `HARD RESET` returns selected clocks directly home.
- `SOFT HOME` returns selected clocks along a forward trajectory.

## Recording

1. Press `START AUDIO`.
2. Press `RECORD`.
3. Perform and change controls normally.
4. Press `STOP RECORD`.

The browser downloads the limited master output as `recording.webm`. Microphone audio is not included.

## Ableton MIDI setup

1. Create or enable a virtual MIDI port on the computer.
2. In two-click mode, press `MIDI` and select that output.
3. Choose MIDI notes for Clock A and Clock B and set the channel.
4. In Ableton Live, enable the corresponding virtual-port input and route it to a MIDI track or Drum Rack.

MIDI follows the swung primary click events. Clock C and the kick voice do not send MIDI.

## Customize

The easiest starting points are:

- `src/config.js`: default sound, timing, and output values
- `src/audio/`: independent kick, beater, click, MIDI, and recording modules
- `src/styles/base.css`: colors, spacing, controls, and responsive layout
- `src/visualization/orbital-view.js`: clock-orbit rendering

## Verify

```sh
npm run test:run
npm run build
```

## Known issues

- Web MIDI requires browser permission and a browser with Web MIDI support.
- Recordings use the browser's supported MediaRecorder format, currently downloaded as WebM.
- MIDI delivery still needs to be checked against the specific Ableton and virtual-port setup used for performance.

## Next useful improvements

- WAV export for direct Ableton import
- Preset save/load
- Recording duration and take naming
- Real-hardware MIDI timing verification
