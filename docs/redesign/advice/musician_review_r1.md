# THE BIG STAGE upgrade: review round 1 (designer + rhythm-game player)

Reviewed: worktree `.claude/worktrees/agent-ac3470437050469df`, commit 4b301cb. Read-only. I did not play or hear it. What I could do is run the engine with bots and run the real `Encounters` with the real Gambler defs; those results are marked "run". `vitest` on the two rhythm test files passes (57 tests), which is part of the story: the MUST below passes every test.

Disciplines read: audio-design (beat sync "subtract output latency", quantize to the next beat), game-balancing (curves, no hidden spiral).

## Verdict: NOT converged

2 MUST, 6 SHOULD that touch a first-time player. Both MUSTs are small fixes.

## MUST

**M1. The new `onResult` hook breaks the Gambler dream (soft-lock).**
`src/play/Encounters.js:74` now calls `a.def.onResult(result, flags)` for every successful encounter in every dream. The Gambler already owns `onResult` with a different signature, `(scene, result)`: `src/dreams/gambler/encounters/tables.js:36` (slate), `:54` (faro), and the table defs, called from their own presenters' outro (`src/dreams/gambler/table.js:226`, `:317`). Run: I started the real `slateEnc` through the real `Encounters` with `{ok:true,...}`; `finish()` throws `TypeError: Cannot read properties of undefined (reading 'purse')` at `tables.js:37`, inside `done()`, before `host.exit`, `this.active = null` and `a.resolve`. `Encounters.active` stays set forever: the slate (the Gambler's first encounter) never exits and the dream hangs. Even where it did not throw it would run the Gambler's hook twice (once in the outro, once here) with swapped arguments. No test catches it (no test runs a Gambler def through `Encounters`).
Fix: rename the Musician's hook (`onFlags`) in `Encounters.js:74` and `sets.js` (`onResult: flagsFor(...)` on neon, cellarGig, rayDrill, bigSet, plus the comment at `Encounters.js:18` and the test at `tests/musician-upgrade.test.js` ~301). Add one test: run `slateEnc` through `Encounters` and expect `busy` false afterwards.

**M2. A call that "lands on the band's beat" is played wrong in about half of first tries.**
`src/engines/rhythm.js:49` `beatCorrection` returns a negative number ("already late: run ahead") when the phrase starts 0 to half a band beat after a beat; `nudge` (`:355`) then jumps the phrase clock forward. The first call note sounds at once (up to 348 ms after the band beat at 86 bpm) while note 2 stays on the grid, so the first interval is squeezed. Run: phrase started 340 ms after the beat gives note0 to note1 = 355 ms against a 697 ms grid; on an eighth-note bar at 86 bpm (slot 349 ms) it can be about 9 ms, a flam. Retries are not nudged (`encounterPresenters.js:253`, `!ev.tries`), so the first attempt hears a wrong rhythm, fails, and the retry plays it right. That is the opposite of "the answer is the call", on the time axis. The pitch half of call and response is correct (run: call pitches equal hit pitches on every bar, on first tries and retries, for neon, mic, drill, and the Nia and Tally sets). The test that pins this (`tests/musician-upgrade.test.js:137-139`, "run a little ahead") encodes the bug.
Fix: only ever wait. `beatCorrection`: `return x < 25 ? -x : bandBeatMs - x;` (waits at most one beat, average about 350 ms, once per bar). Update the three expectations at test `:137-139`.

## SHOULD

**S1. The rush measure reads latency, not behaviour, and can scold a late player.**
(a) `rhythm.js:159` rush is the mean absolute offset of third-bar hits against a fixed -35 ms. Output latency (audio-design: "subtract output latency", the report admits none is applied) makes players land late, and Bluetooth is 150 to 250 ms; people tapping to a click are also known to be early on average. So the flag follows the player's device and habit, not "rushed the third bar". Fix: measure the third bar against the player's own other bars: `rush = mean(third) - mean(non-third offsets)` (all hits are already in `s.offs`, with `third` on each). Then -35 ms means what Nia says it means.
(b) `rhythm.js:291`: a press nearest a third-bar rest is logged as `-window` even when it was late. On eighth bars (slot 349 ms at 86 bpm) a press more than 175 ms late on the previous note is nearer the next slot; if that is a rest it counts as -150 "rush". A lagging player gets "You rush the third bar." Fix: `if (p.third && t < best * B)` (only an early press counts).
(c) Aggregation includes failed attempts, so any bar flubbed into rests (and a masher) reads as rushed. With (a) and (b) fixed this mostly goes away; keep.

**S2. Tally list: the third bar and the ending line have no live feedback.**
`encounters/sets.js:142`: `third` cue is `null` for Tally without Marcus staying. `encounterPresenters.js:225` also hides the hint then. The plate turns teal and nothing says why, but `endingLines` (`sets.js:152`) says "You rushed the third bar. Nobody was listening for it." for that player. Fix: give the session player a third cue ("Click's a hair ahead of you.") or drop the rushed ending line when there was no cue.

**S3. The freeze cue repeats.**
`encounterPresenters.js:279` says `cues.freeze` on every freeze. Run: a fully mashing player on Nia's list freezes 15 times in one set, so Nia says "I've got the bar. Come in when I do." fifteen times. Fix: say it on the first two freezes only (a counter in the presenter).

**S4. Tally's list is easy to beat by mashing and has an unforced hard bar.**
Run: spamming the key every 110 ms gives a perfect, 0-miss, 70 s set on Tally's list (rests are filled so every slot is a note, extra presses are free "strays"); on Nia's list the same spam gets 15 freezes and 232 s. So Tally's path is a skill-free path while its song-2 bar 3 (`sets.js:107`) is, to a person who counts, 8 notes at 250 ms (4 taps per second, window 150 > half slot 125 so no dead zone). Neither the mash nor the stamina is intended. Fix: fill rests only on quarter slots (`rests:false` should leave `div:0.5` rests alone) or add a penalty for strays in `blind` bars.

**S5. First-run length is past the bar and the added time is mostly talk.**
Estimate (not measured): 11-13 min before; now about 13-15. Adds: Ray's lesson goes from 5 to 6-7 boxes plus the drill (20 s clean, 35 s with misses, a Poor-player worst case 69 s); Marcus's scene is forced and longer (m1/m1b, bigger m3, goes/walks caption and fade); street adds two NPCs and two resonants (optional); set 69 s. Against a 6-10 min bar this is long for the first run. What I would cut, in order: (1) `dialogue.js:96-97` j2 "I don't know what that means" and the r2/r2b duplicate: the drill now shows it; (2) drill bar 2 `4 . 2 0` (`sets.js:88`) is identical to open-mic bar 4 (`sets.js:44`); drop it, keep `0 2 . 4` and the blank; (3) `marcus_call` m1/m1b (the Nia-says line is already in `nia_after`); (4) the reader NPC (3 boxes).

**S6. Horn-drowned landing: a reminder after a death.**
`verbs/trumpet.js:39-40` says it once ever (`roar_told`). A first-timer who missed the 2.8 s caption and dies on `wisp_s2` respawns at `cp_halfway` (row 25, outside `roar.rows [18,23]`), presses [Q] out of habit and has no hint. The roar sfx replays but the caption does not. Fix: show the caption on each of the first two entries.

**S7. Boundary: a freeze at a song boundary skips the staging.**
`rhythm.js` `advance` (`:129-141`): the freeze `return`s before the `breath` branch, so the song-change roar, camera step and "next:" name are lost if the player freezes on a song's last bar. Fix: after the frozen phase, run the breath (set a `pendingBreath`), or put the breath check before the freeze check.

## NICE

- N1. `Npc.js:32` a seated NPC stays on the `-sit` frame while talking: Marcus gives the dream's central speech with no body motion. A 2-frame `-sit#` talk loop would help. Needs eyes.
- N2. `marcus_calls` (`beats.js`) has no room guard: a Jo who leaves backstage inside the 900 ms wait gets the scene in the alley. `{call:'inRoom'}` or check `s.roomId` in a `calls` entry.
- N3. `ray_after` `rough` (`dialogue.js:103`) says "You played through it" for an old save that has `ray_lesson` but never ran the drill. Key it on `ray_drill_done`-style flag or add an else for no drill.
- N4. `marcus_stays` gives a wider window (170) and the ending line: the selfish choice is the easier set. 20 ms is nearly invisible on quarter notes and does nothing on eighth bars (half slot 125 < 150), so it is flavour; if the owner wants the choice to cost something, flip it.
- N5. `cast-bake.js:98` adds `-sit` to every `npc-*` atlas. Build passes; only a size check in `npm run atlas` output is left. Low risk.
- N6. Open the set's song 1 on a tonic note; it already ends songs 1 and 2 on B and A (unresolved) and the last on E. If a musician objects at the listening test, it is `sets.js:105-107`.

## Verified in code (MUST/SHOULD of the spec)

| Item | Result |
|---|---|
| M-M1 tunes differ | Yes. Run: six distinct rhythms; engine `div:0.5` is real (slot 349 ms at 86, 250 ms at 120). |
| M-M2 notes | Yes. `notes` per bar, `pitch` on preview/hit/answer events, counter gone. Call equals answer on every try (run). Tally filled rests hammer the previous note (`rhythm.js` norm). |
| Key | Yes by construction: all notes are degrees of `def.scale` (D Dorian at the cellar, E Mixolydian at the stage; noteHz = root*2^(semis/12)). No note is out of key. Chord fit is not controlled: bars are 3, 5, 6 beats and the call starts on any band beat, so a tune can sit across a chord change (e.g. G# over an A pad on `2 3 4 .`); that is a "needs ears" item, not a defect. |
| Results read | Yes. Flags written before `onWin`; lines branch via `if`/`else` (DialogueRunner), `cellar_*`, `ray_drill_*`, `set_*`. Nothing blocks finishing: bots that press nothing, mash, or fail every bar all finish. |
| M-M3 nine chairs | Yes. 9 audience entities sit exactly on the 9 `club_chair` props (checked positions); `react` turns `ceil(9/total)` per passed bar, so a fully clean mic turns all nine. |
| M-M4/M-M5 laminate, Marcus | Yes. Forced scene is `onEnter` + `calls.afterTalk`; choices cannot strand the player; Marcus leaves (`marcus_gone`). `sceneBox` has no cancel. Resume replays it until `marcus_left`. |
| M-S1 drill | Yes. Cannot soft-lock: retries 3, then advances; `back` leaves cleanly and Ray re-offers (`ray_again`, `ray_talked`). Gate needs `ray_lesson`, set only on the drill's win beat. A silent player finishes in 69 s. |
| M-S2 third bar | Mechanism yes; calibration see S1, M2. |
| M-S3 climax | Yes: 4 crowd claps, 3 breaths, camera steps, Nia spot, held-note light. Clean 69/70 s. |
| M-S4/S5/S6 | Yes (street, props, session joke). |
| M-S7 stairs | Yes. `roar.rows [18,23]` covers the 6th landing (row 22); `cp_halfway` is outside it; row 17 (landing 7) is outside; Q works again. See S6. |
| Engine bug fix | Yes. `beatMs` reset per bar (`rhythm.js:123`). Run: a retried bar no longer slows later bars. |

## Difficulty and spiral

- Curve: neon (3-4 quarter notes, 698 ms, window 150) then mic (4-5 quarters, a rest at bar 3, eighths at 349 ms in bars 5-6) then drill (clapped rests, an empty bar) then set (tempo 86 to 120, quarters at 500 ms; one eighth bar at 250 ms, three blind bars, a hold). The ramp is sensible; the step that matters is tempo, not the notes. Nia's list is fair (3 notes in the eighth bar). Tally's depends on S4.
- Windows and rest slots: window 150 is never smaller than a quarter half-slot (349/250) so there are no dead zones on quarters; on eighths at 120 it is wider than half a slot (125), so a press always lands on some slot; on Nia's list that means a stray press into a rest fails the bar, correctly.
- The -35 ms threshold: see S1. Do not move the number; change what is measured.
- Spiral: none in difficulty. Results change only (a) the set's starting nerve (24 after a cellar freeze), (b) relief 16 vs 12 after a clean drill, (c) the window by Marcus's choice. Nerve drives only a 1.5 s freeze that resets it to 60; no window shrink, no tempo change. A struggler can sit in a freeze-per-failed-bar loop (nerve 60, +18 per missed note on Nia's list) but it costs time and repeated lines (S3), not skill. Worst case time (silent): 244 s Nia, 265 s Tally. Acceptable; there is no skip, which is by design ("never blocked").

## Saves from before this change (traced)

- Missing new flags (`cellar_perfect`, `set_*`, `ray_drill_*`, `marcus_gone`): all falsy, every branch has an else. Result: an old save past the cellar hears "You played most of the notes" from Ray if it had not yet seen him; Marcus (if already left) reappears seated and says `marcus_after`; `ray_after` says "played through it" (N3). All harmless, none blocks.
- Old save at backstage before Marcus: the scene plays on entry. Old save in the alley before the lesson: `ray_lesson` runs the drill (gate still needs `ray_lesson`, so nothing is skipped). Old save with `ray_lesson` already set: gate satisfied, no drill needed.
- `cast.marcus_left` unchanged, so the Evening is unaffected.

## Shared-code hooks: could they break other dreams?

- `Encounters.finish` `onResult`: YES, see M1.
- `DreamScene.commit` `onEnter` (`:387`): safe. Guarded by `this.def.onEnter &&`; no other dream defines it; `this.beats` exists before the first commit (`:221` vs `:264`). Note it also fires on teleport and respawn commits (N2).
- `DialogueRunner` `else`: safe. No other dream has a node-level `else:` (grep: painter `else:` is in beats, a different runner); without `else` behaviour is unchanged; `conversationIssues` checks it.
- `dreamAdapters` `record:false`: safe, additive.
- Cast bake `-sit`: low risk (N5). `Npc.js:21` uses it only when `pose:'sit'`.
- `audio.js` `trumpetHz/bassHz`: additive; `trumpet`/`bassNote` keep signatures. `modes.noteHz`: additive. `rhythm.js` `gap` default 0.5 keeps the old listen length; its only other consumer is `tests/rhythm.test.js` (passes unchanged).

## Not checked

No ears: chord fit, band against horn, whether the cue lines sit well, -sit seat height on the props. No hands: the real feel of 4 taps per second, the 150 ms window, the retry slowdown. Gambler soft-lock proven with a headless Encounters run, not in a browser. Length is an estimate from box counts and bot times.
