import './styles/base.css';

import { AudioEngine } from './audio/audio-engine.js';
import { Diagnostics } from './debug/diagnostics.js';
import { PhaseDrag } from './input/phase-drag.js';
import { phaseProximity } from './modulation/phase-proximity.js';
import { MidiOutput } from './midi/midi-output.js';
import { createRuntimeState } from './state/runtime-state.js';
import { Scheduler } from './timing/scheduler.js';
import { OrbitalView } from './visualization/orbital-view.js';

let scheduler = null;
let audioEngine = null;

const timeSource = () => audioEngine?.context?.currentTime ?? 0;
const state = createRuntimeState(timeSource);
const diagnostics = new Diagnostics();

const elements = {
  audioStart: document.querySelector('#audio-start'),
  play: document.querySelector('#play'),
  pause: document.querySelector('#pause'),
  stop: document.querySelector('#stop'),
  hardReset: document.querySelector('#hard-reset'),
  softHome: document.querySelector('#soft-home'),
  record: document.querySelector('#record'),
  recordStop: document.querySelector('#record-stop'),
  bpm: document.querySelector('#bpm'),
  error: document.querySelector('#error'),
  diagnostics: document.querySelector('#diagnostics'),
  orbit: document.querySelector('#orbit'),
  kickPitch: document.querySelector('#kick-pitch'),
  kickDecay: document.querySelector('#kick-decay'),
  kickTransient: document.querySelector('#kick-transient'),
  kickFm: document.querySelector('#kick-fm'),
  kickLevel: document.querySelector('#kick-level'),
  kickProximity: document.querySelector('#kick-proximity'),
  clockBFollow: document.querySelector('#clock-b-follow'),
  clockBSidechain: document.querySelector('#clock-b-sidechain'),
  modeKick: document.querySelector('#mode-kick'),
  modeClicks: document.querySelector('#mode-clicks'),
  sidechainPitch: document.querySelector('#b-pitch'),
  sidechainDecay: document.querySelector('#b-decay'),
  sidechainTransient: document.querySelector('#b-transient'),
  sidechainFm: document.querySelector('#b-fm'),
  sidechainLevel: document.querySelector('#b-level'),
  clickSwing: document.querySelector('#click-swing'),
  midiConnect: document.querySelector('#midi-connect'),
  midiOutput: document.querySelector('#midi-output'),
  midiNoteA: document.querySelector('#midi-note-a'),
  midiNoteB: document.querySelector('#midi-note-b'),
  midiChannel: document.querySelector('#midi-channel'),
  kickPanel: document.querySelector('.voice'),
  clockBKickPanel: document.querySelector('.clock-b-control'),
  clockCPanel: document.querySelector('.clock-c-voice'),
  clockCPitch: document.querySelector('#clock-c-pitch'),
  clockCBody: document.querySelector('#clock-c-body'),
  clockCDecay: document.querySelector('#clock-c-decay'),
  clockCLevel: document.querySelector('#clock-c-level'),
};

const midiOutput = new MidiOutput();

function now() {
  return timeSource();
}

function clockById(id) {
  return state.clocks.find((clock) => clock.id === id);
}

function proximityAt(audioTime) {
  return phaseProximity(
    state.clocks[0].phaseAt(audioTime, state.timeline.bpm),
    state.clocks[1].phaseAt(audioTime, state.timeline.bpm),
  );
}

let orbitalView = null;
audioEngine = new AudioEngine({
  onStateChange: handleAudioStateChange,
  getProximity: proximityAt,
  onTemporalEvent: (event) => orbitalView?.pulse(event),
  getClockFrequency: (clockId, audioTime) => clockById(clockId).velocityAt(audioTime, state.timeline.bpm),
  onClickEvent: (event) => midiOutput.send(event, audioEngine.context),
});

orbitalView = new OrbitalView({
  canvas: elements.orbit,
  clocks: state.clocks,
  getAudioTime: now,
  getBpm: () => state.timeline.bpm,
  selectedClockIds: state.selectedClockIds,
});
orbitalView.start();

new PhaseDrag({
  canvas: elements.orbit,
  orbitalView,
  getAudioTime: now,
  getBpm: () => state.timeline.bpm,
  onSelect: selectOnlyClock,
  onTrajectoryChange: invalidateClock,
});

function setError(error = null) {
  elements.error.value = error ? error.message : '';
}

function setTransportEnabled(enabled) {
  elements.play.disabled = !enabled;
  elements.pause.disabled = !enabled;
  elements.stop.disabled = !enabled;
  elements.hardReset.disabled = !enabled;
  elements.softHome.disabled = !enabled;
  elements.record.disabled = !enabled;
}

function setRecordingState(recording) {
  elements.record.setAttribute('aria-pressed', String(recording));
  elements.record.disabled = recording;
  elements.recordStop.disabled = !recording;
}

function downloadRecording(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'recording.webm';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function updateSelectionControls() {
  document.querySelectorAll('[data-select-clock]').forEach((button) => {
    button.setAttribute('aria-pressed', String(state.selectedClockIds.has(button.dataset.selectClock)));
  });
}

function selectOnlyClock(clockId) {
  state.selectedClockIds.clear();
  state.selectedClockIds.add(clockId);
  updateSelectionControls();
}

function toggleClockSelection(clockId) {
  if (state.selectedClockIds.has(clockId)) state.selectedClockIds.delete(clockId);
  else state.selectedClockIds.add(clockId);
  updateSelectionControls();
}

function targetedClocks() {
  if (state.selectedClockIds.size === 0) return state.clocks;
  return state.clocks.filter((clock) => state.selectedClockIds.has(clock.id));
}

function createScheduler() {
  scheduler = new Scheduler({
    timeSource,
    clocks: state.clocks,
    getBpm: () => state.timeline.bpm,
    routeEvent: (event) => audioEngine.routeEvent(event),
    diagnostics,
  });
}

function invalidateClock(clock, audioTime) {
  scheduler?.invalidateClock(clock.id, audioTime);
  for (const follower of state.clocks.filter((candidate) => candidate.referenceClock === clock)) {
    follower.invalidate();
    scheduler?.invalidateClock(follower.id, audioTime);
  }
}

function kickParametersFromControls() {
  return {
    pitch: Number(elements.kickPitch.value),
    decay: Number(elements.kickDecay.value),
    transient: Number(elements.kickTransient.value),
    fmDepthHz: Number(elements.kickFm.value),
    level: Number(elements.kickLevel.value),
    proximityAmount: Number(elements.kickProximity.value),
  };
}

function sidechainConfigFromControls() {
  return {
    enabled: state.clockBControl.sidechain,
    amounts: {
      pitch: Number(elements.sidechainPitch.value),
      decay: Number(elements.sidechainDecay.value),
      transient: Number(elements.sidechainTransient.value),
      fm: Number(elements.sidechainFm.value),
      level: Number(elements.sidechainLevel.value),
    },
  };
}

function beaterParametersFromControls() {
  return {
    pitch: Number(elements.clockCPitch.value),
    bodyPitch: Number(elements.clockCBody.value),
    decay: Number(elements.clockCDecay.value),
    level: Number(elements.clockCLevel.value),
  };
}

function updateQuickRatioState(clock) {
  const current = `${clock.ratio.numerator}:${clock.ratio.denominator}`;
  document.querySelectorAll(`[data-set-ratio="${clock.id}"]`).forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.ratio === current));
  });
}

function setAudioMode(mode) {
  state.audioMode = mode;
  audioEngine.setMode(mode);
  elements.modeKick.setAttribute('aria-pressed', String(mode === 'kick'));
  elements.modeClicks.setAttribute('aria-pressed', String(mode === 'clicks'));
  elements.kickPanel.dataset.inactive = String(mode === 'clicks');
  elements.clockBKickPanel.dataset.inactive = String(mode === 'clicks');
  elements.clockCPanel.dataset.inactive = String(mode === 'clicks');
}

function updateMidiSettings() {
  midiOutput.setNotes(elements.midiNoteA.value, elements.midiNoteB.value);
  midiOutput.setChannel(elements.midiChannel.value);
}

function renderMidiOutputs(outputs) {
  const selectedId = midiOutput.output?.id;
  elements.midiOutput.replaceChildren(
    ...outputs.map((output) => new Option(output.name, output.id, false, output.id === selectedId)),
  );
  if (outputs.length) {
    midiOutput.selectOutput(elements.midiOutput.value || outputs[0].id);
    elements.midiOutput.value = midiOutput.output?.id ?? '';
  }
}

async function initializeAudio() {
  try {
    await audioEngine.initialize();
    audioEngine.setKickParameters(kickParametersFromControls());
    audioEngine.setBeaterParameters(beaterParametersFromControls());
    audioEngine.setSidechainConfig(sidechainConfigFromControls());
    if (!scheduler) createScheduler();
    elements.audioStart.disabled = audioEngine.state === 'running';
    setTransportEnabled(true);
    elements.record.disabled = !audioEngine.canRecord;
    setError();
  } catch (error) {
    setError(error);
  }
}

// Shared by PLAY and by recovery from an audio suspension.
function startClocks(audioTime, startedFromHome) {
  for (const clock of state.clocks) clock.start(audioTime, state.timeline.bpm);
  scheduler.start();

  const boundaryClocks = startedFromHome
    ? state.clocks
    : state.clocks.filter((clock) => state.pendingHomeBoundaryClockIds.has(clock.id));
  for (const clock of boundaryClocks) scheduler.emitImmediate(clock.homeBoundaryEvent(audioTime));
  state.pendingHomeBoundaryClockIds.clear();
}

function resumeAfterSuspension(audioTime) {
  const { playing, startedFromHome } = state.timeline.resumeFromSuspension(audioTime);
  if (playing) startClocks(audioTime, startedFromHome);
}

async function play() {
  if (!audioEngine.context || state.timeline.isPlaying) return;

  if (state.timeline.isSuspended) {
    // Ask the device to come back; playback resumes from wherever it froze.
    state.timeline.armPlaybackOnResume();
    await initializeAudio();
    if (audioEngine.state === 'running') resumeAfterSuspension(now());
    return;
  }

  // Never start the clocks against a frozen audio clock.
  if (audioEngine.state !== 'running') await initializeAudio();
  if (audioEngine.state !== 'running' || state.timeline.isPlaying) return;

  const audioTime = now();
  const { startedFromHome } = state.timeline.play(audioTime);
  startClocks(audioTime, startedFromHome);
}

function pause() {
  if (state.timeline.isSuspended) {
    state.timeline.pause(now());
    return;
  }
  if (!state.timeline.isPlaying) return;
  const audioTime = now();
  scheduler.stop();
  for (const clock of state.clocks) clock.pause(audioTime, state.timeline.bpm);
  state.timeline.pause(audioTime);
}

function stop() {
  const audioTime = now();
  scheduler?.stop();
  for (const clock of state.clocks) clock.stop(audioTime);
  state.timeline.stop(audioTime);
  state.pendingHomeBoundaryClockIds.clear();
}

function hardReset() {
  const audioTime = now();
  const running = state.timeline.isPlaying;
  const targets = targetedClocks();

  for (const clock of targets) {
    clock.hardReset(audioTime, state.timeline.bpm);
    invalidateClock(clock, audioTime);
  }

  if (running) {
    for (const clock of targets) scheduler.emitImmediate(clock.resetBoundaryEvent(audioTime));
    scheduler.schedulePass(audioTime);
  } else {
    for (const clock of targets) state.pendingHomeBoundaryClockIds.add(clock.id);
    if (targets.length === state.clocks.length) state.timeline.markHomeBoundaryPending();
  }
}

function softHome() {
  const audioTime = now();
  const targets = targetedClocks();
  const cancelling = targets.some((clock) => clock.isSoftHomeActiveAt(audioTime));

  for (const clock of targets) {
    if (cancelling) clock.cancelSoftHome(audioTime, state.timeline.bpm);
    else clock.startSoftHome(audioTime, state.timeline.bpm);
    invalidateClock(clock, audioTime);
  }

  if (state.timeline.isPlaying) scheduler.schedulePass(audioTime);
}

function updateBpm(input) {
  const audioTime = now();
  const previousBpm = state.timeline.bpm;

  try {
    const nextBpm = state.timeline.validateBpm(input.value);
    for (const clock of state.clocks) clock.capture(audioTime, previousBpm);
    state.timeline.setBpm(nextBpm);
    for (const clock of state.clocks) {
      clock.invalidate();
      invalidateClock(clock, audioTime);
    }
    input.removeAttribute('aria-invalid');
    setError();
  } catch (error) {
    input.value = String(previousBpm);
    input.setAttribute('aria-invalid', 'true');
    setError(error);
  }
}

function parseRatio(value) {
  const match = /^\s*(\d+)\s*:\s*(\d+)\s*$/.exec(value);
  if (!match) throw new RangeError('Ratio must use positive integers in p:q form.');
  return [Number(match[1]), Number(match[2])];
}

function bindClockControls(fieldset) {
  const clock = clockById(fieldset.dataset.clock);
  const ratio = fieldset.querySelector('.ratio');
  const phase = fieldset.querySelector('.phase');
  const drift = fieldset.querySelector('.drift');
  const phaseScale = fieldset.querySelector('.phase-scale');
  const driftScale = fieldset.querySelector('.drift-scale');

  function syncScale(input, scale) {
    scale.value = input.value;
    const minimum = Number(scale.min);
    const span = Number(scale.max) - minimum;
    const position = ((Number(scale.value) - minimum) / span) * 100;
    scale.style.setProperty('--scale-position', `${position}%`);
  }

  ratio.addEventListener('change', () => {
    const audioTime = now();
    try {
      const [numerator, denominator] = parseRatio(ratio.value);
      clock.setRatio(numerator, denominator, audioTime, state.timeline.bpm);
      invalidateClock(clock, audioTime);
      ratio.value = `${clock.ratio.numerator}:${clock.ratio.denominator}`;
      updateQuickRatioState(clock);
      ratio.removeAttribute('aria-invalid');
      setError();
    } catch (error) {
      ratio.value = `${clock.ratio.numerator}:${clock.ratio.denominator}`;
      ratio.setAttribute('aria-invalid', 'true');
      setError(error);
    }
  });

  function applyPhase(value) {
    const audioTime = now();
    try {
      clock.setPhase(Number(value), audioTime, state.timeline.bpm);
      invalidateClock(clock, audioTime);
      phase.value = clock.phaseAt(audioTime, state.timeline.bpm).toFixed(3);
      syncScale(phase, phaseScale);
      phase.removeAttribute('aria-invalid');
      setError();
    } catch (error) {
      phase.value = clock.phaseAt(audioTime, state.timeline.bpm).toFixed(3);
      syncScale(phase, phaseScale);
      phase.setAttribute('aria-invalid', 'true');
      setError(error);
    }
  }

  phase.addEventListener('change', () => applyPhase(phase.value));
  phaseScale.addEventListener('input', () => applyPhase(phaseScale.value));

  function applyDrift(value) {
    const audioTime = now();
    try {
      clock.setDrift(Number(value), audioTime, state.timeline.bpm);
      invalidateClock(clock, audioTime);
      drift.value = String(clock.driftAmount);
      syncScale(drift, driftScale);
      drift.removeAttribute('aria-invalid');
      setError();
    } catch (error) {
      drift.value = String(clock.driftAmount);
      syncScale(drift, driftScale);
      drift.setAttribute('aria-invalid', 'true');
      setError(error);
    }
  }

  drift.addEventListener('change', () => applyDrift(drift.value));
  driftScale.addEventListener('input', () => applyDrift(driftScale.value));

  syncScale(phase, phaseScale);
  syncScale(drift, driftScale);
}

function handleAudioStateChange(contextState, audioTime) {
  // START AUDIO doubles as the way to wake a suspended audio device.
  elements.audioStart.disabled = contextState === 'running';
  if (!scheduler) return;

  if ((contextState === 'suspended' || contextState === 'interrupted') && state.timeline.isPlaying) {
    scheduler.stop();
    for (const clock of state.clocks) clock.pause(audioTime, state.timeline.bpm);
    state.timeline.suspend(audioTime);
  } else if (contextState === 'running') {
    resumeAfterSuspension(audioTime);
  }
}

function renderDiagnostics() {
  const audioTime = now();
  for (const clock of state.clocks) clock.completeSoftHomeIfNeeded(audioTime, state.timeline.bpm);
  const proximity = proximityAt(audioTime);
  audioEngine.setProximity(proximity, audioTime);
  elements.softHome.dataset.active = String(
    targetedClocks().some((clock) => clock.isSoftHomeActiveAt(audioTime)),
  );
  elements.diagnostics.textContent = JSON.stringify(
    diagnostics.snapshot({ audioEngine, state, scheduler, now: audioTime, proximity }),
    null,
    2,
  );
  requestAnimationFrame(renderDiagnostics);
}

elements.audioStart.addEventListener('click', initializeAudio);
elements.play.addEventListener('click', play);
elements.pause.addEventListener('click', pause);
elements.stop.addEventListener('click', stop);
elements.hardReset.addEventListener('click', hardReset);
elements.softHome.addEventListener('click', softHome);
elements.record.addEventListener('click', () => {
  try {
    if (audioEngine.startRecording()) setRecordingState(true);
    setError();
  } catch (error) {
    setError(error);
  }
});
elements.recordStop.addEventListener('click', async () => {
  try {
    const blob = await audioEngine.stopRecording();
    setRecordingState(false);
    if (blob?.size) downloadRecording(blob);
    setError();
  } catch (error) {
    setRecordingState(false);
    setError(error);
  }
});
elements.modeKick.addEventListener('click', () => setAudioMode('kick'));
elements.modeClicks.addEventListener('click', () => setAudioMode('clicks'));
elements.clickSwing.addEventListener('input', () => audioEngine.setClickSwing(elements.clickSwing.value));
elements.midiConnect.addEventListener('click', async () => {
  try {
    const outputs = await midiOutput.connect();
    midiOutput.onOutputsChange = renderMidiOutputs;
    renderMidiOutputs(outputs);
    updateMidiSettings();
    setError();
  } catch (error) {
    setError(error);
  }
});
elements.midiOutput.addEventListener('change', () => midiOutput.selectOutput(elements.midiOutput.value));
elements.midiNoteA.addEventListener('input', updateMidiSettings);
elements.midiNoteB.addEventListener('input', updateMidiSettings);
elements.midiChannel.addEventListener('input', updateMidiSettings);
elements.bpm.addEventListener('change', () => updateBpm(elements.bpm));
document.querySelectorAll('[data-clock]').forEach(bindClockControls);
for (const clock of state.clocks) updateQuickRatioState(clock);
document.querySelectorAll('[data-set-ratio]').forEach((button) => {
  button.addEventListener('click', () => {
    const fieldset = document.querySelector(`[data-clock="${button.dataset.setRatio}"]`);
    const ratio = fieldset.querySelector('.ratio');
    ratio.value = button.dataset.ratio;
    ratio.dispatchEvent(new Event('change', { bubbles: true }));
  });
});
document.querySelectorAll('[data-select-clock]').forEach((button) => {
  button.addEventListener('click', () => toggleClockSelection(button.dataset.selectClock));
});
for (const control of [
  elements.kickPitch,
  elements.kickDecay,
  elements.kickTransient,
  elements.kickFm,
  elements.kickLevel,
  elements.kickProximity,
]) {
  control.addEventListener('input', () => audioEngine.setKickParameters(kickParametersFromControls()));
}

for (const control of [elements.clockCPitch, elements.clockCBody, elements.clockCDecay, elements.clockCLevel]) {
  control.addEventListener('input', () => audioEngine.setBeaterParameters(beaterParametersFromControls()));
}

elements.clockBFollow.addEventListener('click', () => {
  const audioTime = now();
  state.clockBControl.follow = !state.clockBControl.follow;
  const clockB = clockById('clock-b');
  clockB.setReferenceClock(
    state.clockBControl.follow ? clockById('clock-a') : null,
    audioTime,
    state.timeline.bpm,
  );
  invalidateClock(clockB, audioTime);
  elements.clockBFollow.setAttribute('aria-pressed', String(state.clockBControl.follow));
});

elements.clockBSidechain.addEventListener('click', () => {
  state.clockBControl.sidechain = !state.clockBControl.sidechain;
  elements.clockBSidechain.setAttribute('aria-pressed', String(state.clockBControl.sidechain));
  audioEngine.setSidechainConfig(sidechainConfigFromControls());
});

for (const control of [
  elements.sidechainPitch,
  elements.sidechainDecay,
  elements.sidechainTransient,
  elements.sidechainFm,
  elements.sidechainLevel,
]) {
  control.addEventListener('input', () => {
    state.clockBControl.amounts = sidechainConfigFromControls().amounts;
    audioEngine.setSidechainConfig(sidechainConfigFromControls());
  });
}

function bindParameterScale(scale) {
  const numberInput = document.querySelector(`#${scale.dataset.for}`);

  function syncFromNumber() {
    scale.value = numberInput.value;
    const minimum = Number(scale.min);
    const position = ((Number(scale.value) - minimum) / (Number(scale.max) - minimum)) * 100;
    scale.style.setProperty('--scale-position', `${position}%`);
  }

  scale.addEventListener('input', () => {
    numberInput.value = scale.value;
    numberInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  numberInput.addEventListener('input', syncFromNumber);
  syncFromNumber();
}

document.querySelectorAll('.parameter-scale').forEach(bindParameterScale);

renderDiagnostics();
