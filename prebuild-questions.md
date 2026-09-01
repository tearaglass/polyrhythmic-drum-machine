# Prebuild Questions

Answer only what you already know. Anything left blank can stay undecided until a prototype makes the choice easier.

## First build

1. What should the first runnable version be?
   - [ ] Browser app
   - [ ] Standalone desktop app
   - [ ] Audio plugin
   - [ ] Something else:

2. Which operating system and browser must it work on first?

3. Is the first milestone a technical rhythm prototype, a playable instrument, or a visually presentable demo?

4. Which parts must be in the first milestone? Mark only the essentials.
   - [ ] Four drum voices
   - [ ] Independent clocks
   - [ ] Ratio controls
   - [ ] Polyrhythm mode
   - [ ] Polymeter mode
   - [ ] Phase offset and drift
   - [ ] Probability and accents
   - [ ] Hard reset
   - [ ] Soft home
   - [ ] Clock-based synthesis modulation
   - [ ] Circular clock visualization
   - [ ] MIDI clock
   - [ ] Ableton Link

## Rhythm behavior

5. What is the difference between **polyrhythm mode** and **polymeter mode** in your intended workflow?

6. Should each voice use a conventional step pattern, a Euclidean pulses/steps pattern, a continuously running clock, or a choice between these?

7. How should a ratio such as `5:4` behave? What are the two numbers comparing?

8. Can clocks run completely free, or must every clock remain mathematically related to a master tempo?

9. When a ratio or step count changes during playback, should the clock jump immediately, preserve its current phase, or wait for a cycle boundary?

10. What exactly should **HARD RESET** reset: clock phase, pattern position, random state, modulation, or all of them?

11. How should **SOFT HOME** sound and behave? For example: gradually change speed, shorten the phase distance, or wait and rejoin at the next coincidence.

12. Should phase drift have a fixed amount, a drift speed, a destination, or multiple modes?

13. Does probability make a clock event silent, or does it prevent the event from advancing other clock-dependent behavior too?

14. What should happen when several clocks trigger the same voice at nearly the same time?

## Sound

15. Should the four initial voices have fixed roles, or should every voice use the same flexible synthesis controls?

16. If the voices have fixed roles, what are they?

17. Should the MVP synthesize every sound, or can it also load samples?

18. Which per-voice controls are essential in the first build?
   - [ ] Pitch
   - [ ] Decay
   - [ ] Transient
   - [ ] Noise
   - [ ] Filter
   - [ ] FM
   - [ ] Level
   - [ ] Pan
   - [ ] Mute / solo
   - [ ] Other:

19. Which clock measurement should become a synthesis modulation source first?
   - [ ] Phase
   - [ ] Phase difference
   - [ ] Distance to coincidence
   - [ ] Time since last event
   - [ ] Cycle count
   - [ ] Other:

20. Should modulation routing be fixed for the prototype or assignable by the user?

## Interface and control

21. Is the circular/orbital view mainly a visualization, the primary rhythm editor, or both?

22. What must be directly draggable or playable in that view?

23. Is a conventional grid editor required in the MVP, or can the first version use simple per-voice controls beside the visualization?

24. Which actions need keyboard shortcuts or MIDI mapping for performance?

25. Should controls and patterns persist automatically between sessions?

26. Are presets, save/load, undo, audio recording, or MIDI export required for the first useful version?

27. Is transparent-background or OBS use part of this instrument, or is it a normal opaque application?

## Visual direction

28. Are there existing sketches, references, colors, typefaces, symbols, or interface materials to preserve?

29. Should the visualization prioritize exact rhythmic legibility, expressive motion, or an adjustable balance of both?

30. What information must remain visible while performing?

31. Are there any visual or interaction approaches beyond those in `AGENTS.md` that should be explicitly avoided?

## Technical and product boundaries

32. Is there existing code or a preferred language/audio technology to build from?

33. Can the first version use small dependencies, or should it remain plain HTML, CSS, and JavaScript?

34. What is the minimum acceptable timing accuracy and expected maximum session length?

35. Does the first version need to work without an internet connection?

36. Is this initially a personal performance tool, a downloadable product, an open-source project, or undecided?

37. What should explicitly **not** be built in the MVP?

38. What single demonstration would prove that the first build succeeds?

## Useful materials

If available, place or link these with the answers:

- interface sketches
- sound references
- example rhythms or recordings
- desired MIDI controller mapping
- visual references
- existing code experiments
- target screen size and performance setup

## Musical model and terminology

39. What does a **voice** contain: a sound generator, a rhythm generator, both, or a configurable connection between the two?

40. Should rhythm generators and sound voices be visibly separate modules, even if the MVP initially pairs them one-to-one?

41. What is the smallest unit of time the system needs to represent?

42. Is a **step** a fixed musical subdivision, one division of a voice's cycle, or simply an event slot?

43. Is a **pulse** an audible trigger, an active step, or the output of a clock before probability and conditions are applied?

44. Does a voice's cycle length come from its step count, its ratio, an explicit duration, or some combination?

45. Should ratios be reducible automatically (`6:4` becomes `3:2`), or should unreduced ratios remain distinct because their cycle structure differs?

46. Should users be able to enter ratios directly as text as well as choosing them with controls?

47. Are ratios always integers, or should decimal, irrational, or continuously variable relationships be possible later?

48. Should common rhythmic relationships have quick-select controls without giving them invented musical names?

49. Is the master tempo expressed only in BPM, or should seconds, Hertz, bars, and external-clock divisions also be available?

50. What time signatures, if any, does the system understand?

51. Is there a global bar or transport cycle, or are voice cycles the only meaningful repetitions?

52. Should the interface display the least common multiple / full recurrence time of active rhythms?

53. How should very long recurrence periods be represented without implying that users must wait through the whole cycle?

54. Should negative ratios, reverse-running phase, or reverse pattern traversal be supported?

55. Can a rhythm stop while preserving its phase?

56. Can a clock run without triggering a sound and exist only as a modulation or routing source?

57. Can a sound voice be triggered manually without advancing or affecting its clock?

58. Can one rhythm generator trigger multiple voices in the MVP?

59. Can multiple rhythm generators trigger one voice in the MVP?

60. If routing is many-to-many, how are duplicate or simultaneous triggers handled?

61. Should the system distinguish polyrhythm, polymeter, phase music, and free-running asynchronous rhythm as separate modes, or should these emerge from the same controls?

62. Should changing modes preserve the audible result where possible, or reinterpret the current values under the new model?

## Transport, tempo, and synchronization

63. Which global transport controls are required: play, pause, stop, restart, tap tempo, count-in, or record?

64. Does **stop** reset all phases or preserve them for resume?

65. Should playback begin immediately on press, on the next internal beat, or on an incoming sync boundary?

66. Is there a count-in, and if so, does it sound or only display visually?

67. What is the allowed BPM range?

68. Should tempo changes take effect instantly, ramp smoothly, or offer both behaviors?

69. Does tempo automation need to preserve phase continuity?

70. What should tap tempo average, reject, or reset when taps are irregular?

71. When synchronized externally, which controls become read-only and which remain offsets from the external clock?

72. If external sync disappears, should playback stop, coast at the last measured tempo, or switch to the internal clock?

73. When external sync returns, should the system snap, wait for a boundary, or softly realign?

74. Which MIDI clock messages must be supported: clock, start, stop, continue, song position pointer, or all of these?

75. Does MIDI clock output need to reflect the master tempo only, or can a selected internal clock become the output?

76. Is Ableton Link required in the first browser version if browser support adds setup or dependency cost?

77. Should Link control tempo only, or tempo, beat phase, and transport state?

78. Is synchronization to an audio input transient, MIDI note, OSC event, or manual tap a future requirement worth reserving for now?

79. Should clock timing continue accurately when the browser tab is hidden or the window loses focus?

80. What should happen when the computer wakes from sleep or the audio device changes?

81. Should clocks keep advancing while audio is suspended, or resume from their previous audible state?

82. Is sample-accurate triggering required, or is stable Web Audio scheduling with a small look-ahead acceptable for the first build?

83. What maximum audible timing jitter is acceptable?

84. Should visual phase follow the exact audio scheduler state rather than an independent animation clock?

## Pattern construction

85. What are the minimum and maximum step counts per voice?

86. What are the minimum and maximum pulse counts?

87. Is zero pulses a valid silent pattern?

88. Can a voice have one step and function as a periodic clock?

89. Is rotation measured in whole steps, fractional steps, degrees, phase percentage, or selectable units?

90. Can rotation be modulated continuously during playback?

91. Should a rotated pattern wrap immediately and deterministically?

92. Are patterns generated with a specific Euclidean algorithm, and should users be able to edit the generated result manually afterward?

93. If a generated pattern is edited manually, does changing pulses regenerate it and discard edits, transform the edits, or ask first?

94. Can each active step have its own velocity, probability, microtiming, ratchet count, and condition?

95. Is accent binary or continuously variable?

96. Does accent affect velocity only, or can it alter pitch, decay, transient, filter, and modulation depth?

97. Are rests explicit pattern data or merely inactive steps?

98. Should users be able to paint, drag, rotate, randomize, invert, mirror, or clear patterns?

99. Which pattern mutations must be reversible with undo?

100. Is randomization destructive, seeded and repeatable, or continuously generated?

101. Should a pattern's random seed be saved with a preset?

102. Does probability reroll on every event, every cycle, every bar, or according to a selectable rule?

103. Are conditional triggers needed, such as every second cycle, fill only, previous step fired, or another clock coincided?

104. Are ratchets or subdivisions inside a step part of the MVP?

105. If ratchets exist, are they evenly spaced or individually placeable?

106. Is per-step microtiming allowed to cross into a neighboring step's time range?

107. Is swing global, per clock, per voice, per pattern, or intentionally absent?

108. How should swing interact with odd step counts and non-integer ratios?

109. Are tuplets represented as ratios, nested clocks, ratchets, or a separate concept?

110. Can patterns change length while retaining hidden steps, or are out-of-range steps removed?

111. Should copying a pattern copy its clock settings, sound settings, modulation, or only step data?

112. Is there a fill or temporary mutation action that returns to the previous pattern when released?

## Phase, drift, coincidence, and recurrence

113. What is phase measured against: the voice's own cycle, a master cycle, another selected clock, or all three depending on context?

114. Should phase be shown as degrees, percentage, musical subdivisions, clock time, or a configurable combination?

115. Is phase offset stored as an absolute duration or as a fraction of the clock's cycle?

116. When tempo changes, should an absolute phase offset keep its duration or scale with the cycle?

117. Can users drag a running clock's phase directly, and should that gesture scrub events, suppress them, or retrigger crossed events?

118. Is phase drift produced by a speed difference, a changing offset, deliberate jitter, or selectable mechanisms?

119. Should drift wrap forever, bounce between limits, stop at a destination, or be manually released?

120. Does drift need a range limit so clocks never move farther apart than a chosen amount?

121. What qualifies as a **coincidence**: mathematically identical event time, within an audio-sample window, or inside an adjustable tolerance?

122. Are coincidences detected between phase positions, trigger events, active pulses, or any of these?

123. Should a skipped probabilistic event still count as a clock coincidence?

124. What should coincidence do by default: indicate visually, create a modulation value, fire an event, or nothing until routed?

125. Can coincidence detection involve more than two clocks?

126. Should near-coincidence produce a continuous proximity value rather than only an on/off event?

127. How should proximity behave around the wrap point between phase `1` and phase `0`?

128. Should the system predict and display the next coincidence?

129. Should it display elapsed time or cycles until full-system recurrence?

130. What should **PARTIAL HOME**, **NEW HOME**, and **GRAVITY HOME** mean if they move from the full spec into implementation?

131. Can home operations target selected clocks rather than the whole system?

132. During soft realignment, are trigger intervals allowed to speed up and slow down audibly?

133. Does realignment aim for phase zero, the nearest shared event, or a newly selected home phase?

134. Can the user cancel a home operation midway and preserve the resulting phase state?

## Sound architecture

135. What synthesis model should each first-build voice use?

136. Should voice models be deliberately different or share one common architecture with different presets?

137. Is polyphony needed within a single voice, or can a new hit choke the previous hit?

138. If hits overlap, what is the maximum polyphony per voice?

139. Should voices support choke groups?

140. What should happen to an active sound when its voice is muted: fade, stop immediately, or finish its decay?

141. Should solo affect only audio or also modulation and routing events from non-soloed voices?

142. What tuning units are needed: Hertz, MIDI notes, note names, ratios, or normalized values?

143. Does pitch track incoming MIDI notes, remain fixed per voice, or support both?

144. Should rhythm ratios optionally set oscillator or resonator ratios in the MVP?

145. Which parameters should be smoothed to prevent clicks when changed live?

146. Which parameters should intentionally allow abrupt, percussive changes?

147. What does the **transient** control change in synthesis terms?

148. What kind of noise is needed: white, pink, filtered, metallic, sampled, or selectable?

149. What filter types and ranges are necessary?

150. What FM topology is intended, and should the amount track pitch?

151. Is velocity sensitivity required for manual, MIDI, and sequenced triggers?

152. Should probability and accents influence synthesis through a stable rule or user routing?

153. Are per-voice insert effects needed in the MVP?

154. Are global effects needed, and if so, which minimal set?

155. Is distortion part of each voice, the master output, or both?

156. Is there a master limiter or safety gain stage to prevent dangerous output levels?

157. Should output level be normalized across drastically different synthesis settings?

158. Is stereo placement important, or should the first version be mono-compatible by default?

159. Are multiple audio outputs or stems a future plugin requirement that should influence the data model now?

160. What sample rates and buffer sizes must be supported?

161. Should synthesis continue deterministically during offline rendering or export?

162. Is audio recording required as a master mix, separated stems, or not initially?

163. What file format and bit depth should exports use?

## Modulation and routing

164. Which objects can be modulation sources in the MVP?

165. Which sound, rhythm, visual, and global parameters can be modulation destinations?

166. Can a modulation source control another clock's speed, phase, ratio, pulses, rotation, or probability?

167. How should feedback loops in clock-to-clock modulation be prevented or intentionally supported?

168. Are modulation values bipolar, unipolar, event-based, or selectable per source?

169. Does each route need amount, polarity, curve, smoothing, range, and enable controls?

170. Should modulation operate at audio rate, control rate, event rate, or a fixed MVP rate?

171. How are discontinuities handled when a phase source wraps from maximum back to zero?

172. Can a destination receive multiple modulation sources, and how are their values combined?

173. Does modulation add to, multiply, replace, or constrain the knob's base value?

174. Must the interface show both a parameter's base value and its current modulated value?

175. Should routes be created through menus, drag-and-drop cables, a matrix, or fixed controls?

176. How many routes should remain usable on screen before the interface becomes difficult to read?

177. Can modulation affect visual properties without affecting sound?

178. Should visual-only routing be saved with musical presets or with a separate view/layout state?

179. Are control mappings and internal modulation routes distinct concepts in the interface?

180. Is modulation depth itself a possible modulation destination?

## Visualization and spatial behavior

181. Does each orbit represent a clock cycle, a pattern, a sound voice, or a routed relationship?

182. Are orbit sizes meaningful or purely compositional?

183. Should faster clocks rotate faster, complete more laps, or use another visual encoding that remains readable?

184. How are active pulses placed around a circle when timing is uneven or warped?

185. How are accents, probability, muted steps, skipped triggers, and conditional steps visually distinguished without relying on text?

186. How are phase offset and ongoing drift distinguished from one another?

187. How is coincidence shown, and how long should the indication remain visible?

188. Should sound amplitude, timbre, or decay visibly affect the orbit?

189. Should visual responses be driven by scheduled events or measured audio output?

190. Does the interface need a reduced-motion setting?

191. Can ambient motion be turned off independently from musically meaningful motion?

192. Should inactive voices remain visible, collapse, dim, or disappear?

193. Can modules be rearranged, resized, duplicated, or hidden?

194. Should layout changes persist separately from musical state?

195. Is there a compact performance layout and a detailed editing layout?

196. Is fullscreen a primary performance state?

197. What screen resolutions and aspect ratios must remain usable?

198. Must the UI work on touch screens or phones, or is desktop pointer input sufficient initially?

199. How should fine adjustment work: modifier-drag, scroll wheel, text entry, or all of these?

200. How should reset-to-default work for a single control?

201. Should dangerous or dramatic performance actions require hold, double press, or no confirmation?

202. Which states need non-color cues for color-vision accessibility?

203. What minimum contrast and text size are acceptable while preserving the intended visual character?

204. Should focus indicators and complete keyboard navigation be part of the MVP?

205. Should visual density change automatically at smaller sizes or only through a user-selected view?

206. Does an OBS view need controls hidden while preserving the visualization and transparency?

207. If transparency is supported, which visual elements require outlines or alternate colors to remain legible over arbitrary video?

208. Should the render loop reduce activity when nothing is changing?

## Input, MIDI, and performance control

209. Which browser keyboard keys should trigger the four voices?

210. Should keyboard shortcuts be active while editing numeric or text values?

211. Is MIDI note input required at launch?

212. Should MIDI notes trigger voices chromatically, select voices, change patterns, or be assignable?

213. Is MIDI learn required for knobs and performance actions?

214. Should mappings support notes, CC, pitch bend, aftertouch, program change, and NRPN?

215. Does the intended controller send relative or absolute CC values?

216. How should pickup / soft takeover prevent parameter jumps from physical knobs?

217. Can one hardware control map to several parameters?

218. Can several hardware controls map to one parameter?

219. Should mappings be global, stored per preset, or stored as separate controller profiles?

220. Is OP-1 mapping part of the initial release, and which exact OP-1 model and MIDI mode are targeted?

221. Is OSC input/output needed before plugin development?

222. Should rhythm events be emitted as MIDI notes, and how are channel, pitch, velocity, and duration assigned?

223. Should internal clock relationships be exportable as MIDI clock, note sequences, or both?

224. Is there a performance-safe way to temporarily lock editing controls?

225. Which operations must never cause an audio dropout during performance?

226. Should accidental browser navigation, scrolling, or text selection be suppressed in performance mode?

227. What must happen if a MIDI device disconnects and reconnects?

## Presets, persistence, and history

228. What belongs in a preset: rhythm, sound, routing, layout, sync settings, mappings, visual state, or all of these?

229. Should presets capture current running phase or only parameter values?

230. Should loading a preset reset clocks, preserve global time, or offer both behaviors?

231. Can presets load instantly, at the next event, at the next cycle, or through a timed morph?

232. Which parameters should interpolate during a scene morph, and which should switch discretely?

233. Is autosave desired, and should it restore the exact state after a crash or refresh?

234. Should the app warn before replacing the current unsaved state?

235. What should undo cover: parameter edits, pattern edits, routing, randomization, preset loads, layout, and performance actions?

236. How many undo states are enough?

237. Should undo operate during playback without resetting time?

238. Is a shareable preset file needed, and should it be human-readable JSON?

239. Does the preset format need a version number and migration strategy from the first build?

240. Should users be able to copy/paste a voice or full state as text?

241. Are factory presets desired, and if so, will their names and content be supplied separately?

242. Is a blank state different from a default playable state?

243. Should local storage failures or quota errors be shown explicitly?

244. Is cloud sync intentionally out of scope?

## Recording, export, and interoperability

245. Should recording capture only audio, or also control gestures and clock events for later replay?

246. If performance gestures are recorded, must playback be deterministic?

247. Should exported loops stop at a selected number of bars, voice cycles, full recurrence, or manual stop?

248. How should exports handle rhythms whose full recurrence is extremely long?

249. Should export include a tail for decays and effects?

250. Is seamless loop export required, and which state should be restored at the loop boundary?

251. Should metadata include tempo, ratios, seed, and preset state?

252. Is drag-and-drop export from the browser useful?

253. Is offline faster-than-real-time rendering important?

254. Should MIDI export preserve independent tracks per voice?

255. How should phase drift or continuous tempo curves be represented in MIDI?

256. Should visual output be recordable directly, or will screen/OBS capture be the intended workflow?

257. If a visual export is needed, must it include alpha transparency?

258. Are plugin-state recall and DAW automation future requirements that constrain parameter IDs now?

## Application structure and implementation choices

259. Should the first build run by opening a file directly, or is a small local development server acceptable?

260. Is installing Node.js acceptable for development and running the prototype?

261. Should the app be installable as a PWA?

262. Which browsers must be supported, and are browser-specific MIDI or audio limitations acceptable?

263. Is a Web Audio worklet acceptable if it improves timing but makes the code more advanced?

264. Should sound generation live in one audio engine module with separate files for voices, clocks, modulation, UI, and visualization?

265. Should the timing engine be written independently enough to reuse in a future desktop or plugin version?

266. Is future Rust, C++, JUCE, or another native technology already anticipated?

267. Must the browser prototype and future plugin produce identical sound and timing?

268. What dependency size or count feels acceptable?

269. Are third-party libraries with restrictive commercial licenses prohibited?

270. Must all dependencies work offline and be bundled locally?

271. Should configuration live in one obvious file for voice defaults, colors, ranges, and keyboard mappings?

272. Which aspects must be editable without touching core engine code?

273. Is hot reloading useful, or is a minimal static setup preferable?

274. Should debug information such as scheduler drift, active voices, and frame rate be available behind a hidden panel?

275. What performance budget should the first build target for CPU usage and memory?

276. How many simultaneous clocks, routes, and voices should the architecture handle even if the UI initially exposes four?

277. Should low-power mode reduce visual frame rate while keeping audio timing intact?

278. What happens when the audio context cannot start until the user interacts with the page?

279. Should audio-engine errors be recoverable without reloading the whole application?

## Product form and distribution

280. What is the intended first distribution format: source folder, hosted webpage, downloadable zip, desktop bundle, or plugin installer?

281. Should a buyer be able to use it without a terminal?

282. Is a settings/config file acceptable for customization, or must all important customization have visible controls?

283. Will users be allowed to edit or redistribute source code?

284. Is commercial licensing for samples, fonts, icons, and dependencies required from the start?

285. Should the product include multiple visual layouts or remain one deeply configurable instrument?

286. Is this one product or the first member of a family of separate clock, sound, visualization, and OBS tools?

287. Which parts could be packaged independently without weakening the main instrument?

288. Does the first sellable version need onboarding, documentation, presets, demo media, or an example project?

289. Who is the first intended user: the creator alone, experimental musicians, live performers, producers, educators, visual artists, or another specific group?

290. What knowledge can that user be expected to have about ratios, phase, MIDI, and synthesis?

291. What price range or product scope is being imagined, if any?

292. Does the app need an update mechanism or only downloadable replacement versions?

293. Is telemetry prohibited, optional, or potentially useful later?

294. Is account creation explicitly out of scope?

## Failure states and safeguards

295. What should the user see when audio initialization fails?

296. What should happen if a preset contains unsupported or corrupted values?

297. Should parameter values be clamped, rejected, or repaired when loaded?

298. What should happen if a ratio produces an event rate too fast to synthesize safely?

299. Is there a maximum event density per voice or globally?

300. Should inaudibly fast clocks become modulation-rate signals, be capped, or be rejected?

301. How should the system prevent feedback modulation from producing `NaN`, infinity, silence, or unsafe output?

302. Should there be a one-action return to a known audible default state?

303. Should panic stop audio only, stop transport, clear active notes, reset clocks, or all of these?

304. Is master output automatically muted when the tab opens?

305. Should the app remember master volume across sessions?

306. What happens when rendering cannot keep up: drop visual frames, simplify animation, skip audio events, or stop with an error?

307. Which state changes deserve a visible warning because they cannot be undone?

308. Should experimental or unstable features be isolated behind an explicit setting?

## Testing and acceptance

309. What reference rhythms should be used to prove `3:2`, `5:4`, and `7:5` are implemented correctly?

310. How should polymeter correctness be verified?

311. How should phase offset and drift be measured rather than judged only by ear?

312. What exact behavior proves HARD RESET is correct?

313. What exact behavior proves SOFT HOME is correct?

314. How many minutes or hours should the app run without timing drift, memory growth, or audio failure?

315. Which rapid live-control changes should be stress-tested?

316. Which target devices and audio interfaces are available for testing?

317. Which MIDI controllers and sync sources are available for testing?

318. Is testing through OBS required, including transparency and capture performance?

319. What CPU load is acceptable during a representative four-voice performance?

320. Should timing tests be automated with recorded timestamps or audio analysis?

321. Should deterministic random seeds make automated probability tests possible?

322. What browsers, window sizes, and input methods form the minimum manual test matrix?

323. What should happen in tests when the tab is backgrounded, throttled, resized, or moved between monitors?

324. What accessibility checks are expected for keyboard use, focus, contrast, and reduced motion?

325. What is the minimum manual smoke test before sharing a build?

326. Who gives final approval that a milestone is musically useful rather than merely technically functional?

## Build sequence

327. Should the first technical spike prove the timing engine with clicks before any drum synthesis is built?

328. Should the orbital visualization be built against simulated clocks first or only after audio scheduling is stable?

329. Which one voice should be synthesized first to test the complete trigger-to-audio path?

330. Which single clock interaction best demonstrates why this instrument is different from a conventional sequencer?

331. What can be represented with deliberately plain temporary controls while the engine is being proven?

332. Which visual decisions must be established early because they shape the interaction model?

333. Which features can safely remain hard-coded in the first spike?

334. Which hard-coded choices would create expensive rework and therefore need answers before coding?

335. What is the smallest build worth putting in front of another musician?

336. What is the smallest build worth recording as a demo?

337. What is the smallest build worth packaging for another person to run?

338. What concrete result marks the transition from timing experiment to instrument?

## Final prebuild decisions

These are the answers most likely to block implementation. Complete these before the first production build even if the rest remain open.

339. First target platform:

340. First milestone outcome:

341. Required MVP features:

342. Explicitly excluded MVP features:

343. Exact ratio semantics:

344. Exact polyrhythm / polymeter distinction:

345. First rhythm-generation method:

346. HARD RESET behavior:

347. SOFT HOME behavior:

348. First four voice models or roles:

349. First clock-to-synthesis modulation route:

350. Primary editing interaction:

351. Required sync method:

352. Required save/export behavior:

353. Target computer, browser, screen, and controller:

354. First-build success demonstration:
