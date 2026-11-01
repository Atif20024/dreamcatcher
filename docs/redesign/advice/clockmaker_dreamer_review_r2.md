# THE STOPPED HOUR, round 2 review (designer + pro gamer)

Read-only. Read: round 1 review, the R2 report, `dialogue.js`, `beats.js`, `logic.js`, `verbs/works.js`, `verbs/wheels.js`, `encounters/clockwork.js`, the rooms, `geartrain.js`, `escapement.js`, the scenario, plus `BeatRunner`, `Interaction`, `SceneBox`, `DreamScene` talk code, `feedback3.js`. Not played, nothing run. Numbers are arithmetic from the code (gravity 1200, knockback 180/-220, run 280, walk 80, escapement period 2200). Where only a person can tell, it says PLAYTEST.

## Verdict

Converged on the things that can break a run. No MUST. The shaft, the wheels, the count and the beats all work as built. What is left is one dramatic leak, two small contradictions with the new confession, one cue that is early, and a way to make the next flaky scenario name itself. Five SHOULDs, all copy, one-liners or dev-only.

## MUST

None. I looked for a softlock or a stuck state in: the new beat (`keeper_why_on`), the count, the peg slow-down, the plank B change, `bell4`, the `{act1}` token, the strain, and the Nell question. None found. The one latent fragility (Nell, below) is not reachable by a player.

## SHOULD

**S1. Ansel gives away Nell's best line two scenes early.** `dialogue.js:90` (k1) vs `beats.js` `green_lit` ("Slipped, I said. It's what you say.").
- k1: "Nell says slipped because that is what you say." Then on the green Nell says nearly the same words. By then the player has been told she knew, so her line is a repeat, not a reveal. The ending's "Nell knew." is the same story: it should be the player's discovery on the green.
- Player experiences: the green's quiet hit lands as an echo.
- Fix (copy, one clause): k1 -> "Forty-one years and not one tooth. They did not slip." Jo's j1 ("Nell said they slipped.") still sets it up. Nell's green line then does the work.

**S2. The confession promises the hands at six; no clock in the dream shows six.** `art/props.js:262` (`house_clock`, the gable clock on the green): hour hand ends at (137, 68) from centre (128, 64): about four o'clock, not six. `wall_clock` (`props.js:496`, in the clock house) is painted with no hands at all.
- `house_clock` is used only by this dream (`rooms/green.js:45`); `wall_clock` also in the Chef's prep room, so change the green's clock only.
- Player experiences: a player who looks up at the gable after "put the hands back to six" sees a clock that says something else. It is a small dial, so most will not look. Those who do will think it is a mistake, not a clue.
- Fix: draw the gable clock hour hand straight down, minute hand up (`lineTo(128, 78)` instead of `(137, 68)`). Optional: give the clock-house `wall_clock` the same two hands, only if it can be done without touching the Chef.

**S3. Pie woman now contradicts the confession.** `dialogue.js:58`: "Ida Dunmarrow sent me up with it at five, for him. He has not come down."
- Ansel now says he came down the hill at seven and went back up after. The pie woman sits on the green's bench (col 11), between the clock house (col 33) and the lane arch (col 0), so she would have seen him both ways. This line was fine before R2; R2's timeline broke it.
- Fix (copy): "He has not come down since." Reads true on both timelines, costs one word.

**S4. The count calls the stroke early, so "on his count" trains the wrong moment; and the first number is called twice.** `encounters/clockwork.js:29, 36, 51-52`.
- The word, the caption, the tick and the "talking" mouth all fire at the top of the swing (`|x| > 0.98`). The window (period 2200, window 0.14) is the crossing, 550 ms later (a half-width of 154 ms around it). The hint says "[E] on his count". A player who presses on the word or the tick presses 550 ms early. That is a miss: no penalty (no slip on this encounter), just a miss and nothing happens. The ring is right (it closes as the bob arrives); the sound is the thing that is off.
- Double "One.": `c.top` starts `true`, and `!c.called` fires `call()` on frame one with the bob in the middle (x = 0, a crossing). `c.top` is then set to `false`, so the first real top at about 550 ms calls again. The player hears "One." at 0 ms and "One." at 550 ms, the very first cue they are teaching themselves to follow.
- What the count is: a cue on the same window (period 2200, window 0.14), not a rule. It does not change the stroke's timing, difficulty, or the idle auto-strike (every 4.4 s, `patient` 3400). The bob is on the plate and the ring is 55 px from the plate's edge, 100+ px from Ansel: it duplicates the plate's information at a bigger size, next to the plate. That is a genuine help: a bigger, calmer target. It is not "a second man on the rope".
- Fix: (a) say the word and tick when the bob is about to cross, not at the top. Call on `Math.abs(st.x) < 0.4 && approaching` (which is the moment the window opens), keep the ring and the number appearing at the top. Then "on his count" is literally true. (b) Drop the call at `!c.called` for the very first frame; let the first top call it (or start `c.top` false and require `top`). One condition each.
- If the owner wants the choice to matter more than a cue, the doc deliberately keeps windows identical (`docs/dream_clockmaker_dreamer.md`). Leave it; making "with me" easier punishes "go home", and harder is wrong for this dream.
- PLAYTEST: whether the eye leaves the plate for the ring. The number sits about 170 px left of Jo.

**S5. The scenario cannot say why `met-nell` failed.** `dev/scenarios/clockmakerDreamer.js:75-83` (`chat`) and `:204`.
- Details below, "The `met-nell` flake". Short version: I found no way a player gets there. The likeliest cause is the scenario before it, and the next failure will say nothing but `met-nell:FAIL`.
- Fix (dev only): in `chat`, after `b.use()`, if `!s.sceneBox.active` press once more, and on failure put `s.interaction.current?.id`, `s.transitions.busy`, `s.beats.busy`, `s.respawning`, `s.tutorialActive`, `s.cardActive` into the log line. In `feedback3.js:76-84` `restartCheckpoint` returns after `dc.step(10)` while the respawn tail is still going; give it the same settle `arrive()` uses.

## NICE

- **N1. Longest locked stretch.** `green_lit` is about 13 s, input suspended (`lock` -> `inputs.suspend`, `DreamScene.js:707`): 0.9 + 1.6 + Nell's walk about 1.75 + pole 1.5 + 1.5 + 1.8 + 2.0 + 2.2. The two last waits (`"I know."` 2000, `"Slipped..."` 2200) are longer than the lines need (about 1.4 s and 2 s). Trim to 1400 and 2000. The beat is the payoff, so I would not unlock Jo in it. A hold-to-skip would help the second play more than any trimming. PLAYTEST.
- **N2. Nell's intro is consumed on open.** `DreamScene.js:578` sets `_conv:nell_first` when the box opens; `met_nell` is set on the last node (`dialogue.js` `w5`). Because `nell_first` is not `replayable`, a box torn down half way would leave a Nell who says nothing and an objective that never appears. Same shape for `keeper_first` (`met_keeper`, last node k4). Not reachable today (see below). `replayable: true` on both is safe: `pickConversation` tries `nell_after` / `keeper_wait` first once the flag exists.
- **N3. The count repeats itself at an idle player.** "called again until it is struck": an idle player hears "One." every 1.1 s for 4.4 s until the clock auto-strikes. PLAYTEST for nagging. Mute the caption/tick after two repeats and keep the ring.
- **N4. `sfx('hurt')` with no hurt.** `works.js` knock plays `hurt`. Now that nothing is lost, a `knock` sound (already used for the foul) says what happened.
- **N5. Parts two and three of the confession play in the wide frame.** `keeper_why` (E-talk) gets the 1.25x talk shot; the beat's `talk` handler is `runConversation(id, null)` (`DreamScene.js:689`), so the Ida lines (parts b, c) get the room's default frame. PLAYTEST which is better; if the close shot is wanted, the beat handler needs to pass the same `mid` focus.

## Answers

### Does the confession read true and hit?

Read aloud, in order:
1. "All four. You hang a wheel like a man who was told. Nobody told you why they were down."
2. Jo: "Nell said they slipped."
3. "Forty-one years and not one tooth. Nell says slipped because that is what you say."
4. "I took them off. After. I went back up the hill and took them off, one by one, and put the hands back to six. This one I kept."
5. (look at the wheels) Jo: "Why?"
6. "Ida had supper on for six. A table for two. Six is winding, so I came up."
7. "The weight stuck. An hour, it took. I could have left it. Nobody looks up."
8. "She went at half past six, the doctor said. Quiet, at the table. Two plates. I came down the hill at seven."
9. (look at the bell)
10. "So it is not seven. It does not get to be. If it never gets to seven, I am not late."

It hits. The turn is clean now: supper at six, winding at six, the weight stuck an hour, she went at half past, he came down at seven. "Two plates" and "Nobody looks up" are the two best lines in the dream. "After." as a one-word sentence works, because the player asks "after what?" and the next box answers it. "Put the hands back to six" is right and needed: it is the only line that explains why the town says six. It matches `docs/dream_clockmaker_dreamer.md`, the lane window ("a table laid for two"), and the Evening's Ansel ("I was late. I went in. It took me a long while to do the second part.").

What contradicts: the pie woman (S3), the gable clock face (S2), and the last clause of Nell's first line ("went out at six, and the clock with them"), which on the new timeline means "the hands said six" (the works stopped after seven). That one I would leave: everyone in town reads the face, which is the point of the hands line.

What leaks: S1.

Length is higher than the report says. It lists "nine boxes". Counting nodes: part 1 has 4, part 2 has 4, part 3 has 4 (stays) or 5 (go home): 12 or 13 boxes, about 55 s at a reader's pace plus the two looks. Not a problem if the copy is this good. PLAYTEST: after about 80 s of wheel work, whether box 9 to 13 drag. If it does, cut Jo's j1 + Ansel's k1 together (boxes 2 and 3): S1's fix already makes k1 shorter and the sequence still works without them.

### The two camera looks: earned or padding?

Earned, and shorter than the report says. `camera` steps in the BeatRunner are not awaited (`DreamScene.js:690-697` return undefined). The push and pop happen during the waits. The input is locked for the waits only: look 1 = 3.4 s, look 2 = 2.8 s (`beats.js` `wait: 3400`, `wait: 2800`), not "about 4 s each". About 6 s of lock in a confession of about 60 s.
- Look 1 (the wheels turning under the gallery, Jo's line "He took it down, and I hung it back") is the one place where the verb and the story meet: the player's own hands are the evidence. Earned.
- Look 2 (the silent bell) comes right after "I came down the hill at seven". The pause is the grammar of that line. Earned, and the right place for silence. It could be 2.0 s instead of 2.8 s; PLAYTEST.
- Neither can be skipped. Each is a hold inside a conversation the player is already pacing, which is fine on first play.

### Longest stretch with nothing to do (after the strike)

All input-locked, by beat (from the waits):
| Stretch | Go home | With me |
|---|---|---|
| encounter outro (`outroMs` 1400) | 1.4 s | 1.4 s |
| `seven_struck` | 3.6 s (2.4 wait + his walk to the gate about 1.2 s) | 5.2 s (2.4 + 2.8) |
| free walk, yard to green | about 11 s (round 1's number) | same |
| `green_lit` | about 13 s | about 13 s |
| free walk, green and lane | a few seconds | same |
| `at_his_door` | about 2.6 s | box about 9 s + `keeperIn` about 5 s + 2.6 s |
| Locked total | about 21 s | about 27 s plus the box |

Longest single stretch: `green_lit`, about 13 s, with something to look at (Nell walks, the pole, the lamp) but nothing to do. That is at the edge of what a first play will take and long for the second. The post-strike claim in round 1 ("25 to 30 s") holds only for "with me". N1.

### With no heart cost, is the shaft still a threat?

Not a threat to the run; still a threat to progress, and that is where it belongs. A knock is: a 240 ms control lock (`BaseLevel.js:571`), a shove with arc time about 0.37 s (vy -220, g 1200) and about 55 px sideways (measured 51), and the carried wheel dropped at the spot (`wheels.js:258-261`). No heart, no coin scatter, a 1.2 s lock-out so it cannot chain (`works.js` `hitAt`).

Cost in seconds (estimated, add them up from the geometry):
| Where | What it costs | Seconds |
|---|---|---|
| Not carrying, on a floor or plank | lock + arc + walk back | about 0.6 |
| Carrying, on a floor or plank | the above + walk to the wheel + [E] + wait for the bob to clear (expected wait 0.3 to 1 s, the gate's slack) | about 1.5 to 2.5 |
| Carrying, on a ladder | fall to the floor below + re-climb 1.3 to 1.5 s + the above | about 3 to 4 |
| Carrying, on the chain (4400 ms bob) | fall to plank B (wheel rests on B, `drop`'s `floorUnder`) + back to the ladder + wait + 1.49 s climb | about 3.5 to 4.5 |

The bots' 11 to 13 knocks are then about 25 to 35 s of a 4.3 to 4.9 min run (about 10%); a person with 2 to 4 knocks loses under 15 s. The pendulum is now a timing gate with a small, visible price, and a dropped wheel is the lesson. For the gentlest dream that is right: it cannot hurt you and it is not free. A pro will run empty legs blind (0.6 s) and watch only when carrying; that is the intended read ("carry" is the verb). The one thing lost is the 1.2 s after a hit: no flash (no `flashInvulnerable`), so the bob can pass through Jo silently. Not worth a fix.

### "Strike it with me": does the count change the play?

See S4. It is a cue, not a rule: same windows, same idle auto-strike. It helps by giving a bigger, calmer target and an anticipation beat; it fights the bob only through the early word/tick and the double first "One." Fix those and "on his count" is true. If the owner wants the choice to be felt in the hands, the design lever is not here; leave the windows alone.

### Peg slow-down and the ghost wheel

`PEG_SLOW` 60 px each side, vertical band: peg 8 px above to 104 px below Jo's feet (`wheels.js:14-17`). Walk 80 vs run 280 px/s.
- Shaft: the pegs are on plank C only (x 424, 480), the slow strip is 364 to 540 (176 px = 2.2 s vs 0.63 s). The chain ladder tops out 16 and 40 px from the pegs, so Jo steps off into the strip, where he wants to be. Bob 3 never reaches plank C (its lowest top edge is at y 422, plank C feet at 352). Safe.
- Bell chamber: the floor under the gallery has all seven pegs within the band (top row 96 px above, low row 41 above). The strip is x 532 to 844 = 312 px, about 3.9 s at walk vs 1.1 s at run. The swing ends at about x 415, so 117 px of clear floor lies between the bob and the strip. Nothing slows Jo inside a swing. Trap: no.
- Clock house: three pegs, the strip is x 580 to 764. Nothing to carry past them.
- Gallery wheels: the band excludes pegs below the gallery's feet (feet 224, pegs 288 and 343), so no slow-down up there. A jump off the gallery's west edge starts the slow-down mid-air (feet pass peg-8 on the way down); with the velocity lerp that is a stall of about 6 frames and a near-vertical landing at the strip's edge. Harmless.
- Annoy: only for someone carrying a wheel the length of the belfry strip without hanging it (a wrong peg, lift, re-hang). Each peg step is 32 to 64 px (0.4 to 0.8 s). A thinker is standing there anyway; a runner holds Shift (not taught; touch has no Shift). A cliff, not a ramp, at 60 px. NICE if a ramp is cheap: scale speed by distance to the nearest peg. Otherwise leave it.
- Ghost wheel: only appears on the peg [E] would use, and only with a wheel on the back (`wheels.js:341-343`). Pegs are picked by x only (Interaction `nearest`), so the 32 px stagger between the belfry's top row and low row is exactly what the ghost is for. One frame of lag (verbs update before Interaction). Fine.

### The `met-nell` flake: a real way for E near Nell to do nothing?

I could not find a way a player gets there. Checked, in order:
- A card up: no clockmaker `zone` triggers in `data/teach.js` (the only zone cards are Writer and Astronaut); the global event cards (foe wind-up, ribbed wall) cannot fire on the green. No.
- A beat locking input: `start` is 400 ms and does not lock; `green_lit` needs `struck`. No.
- A transition: `Interaction.update(!transitions.busy)` swallows E during a seam or door dip (`DreamScene.js:892`). Nell is 18 columns past the arch; the `chat` helper walks to within 36 px of her, long after the dip. No.
- Another interactable stealing E: `nearest()` picks the smallest dx among enabled items. The pie woman is 224 px away; no pegs/wheels are enabled (roomId), no `wheel:down` (nothing carried). No.
- A stale flag: Nell's list is `nell_done` (struck), `nell_wound` (clock_wound), `nell_after` (met_nell), `nell_first`. `nell_first` is non-replayable and `_conv:nell_first` is set on open (`DreamScene.js:578`), but `met_nell` is set on the last node. If the box were ever torn down mid-way with that flag saved, Nell would be mute forever. A save only happens at a checkpoint or the station; the pause menu cannot open during a scene box (`DreamScene.js:860-863`); `cp_green` is at col 8, 10 columns from Nell. Not reachable. N2.
- A run restored from a checkpoint: restoring rolls `F` back to the flags at the checkpoint (`RunState`), consistent with `met_nell` and `_conv` together. No.

What does match "failed once right after `restart-checkpoint-clockmaker`, then passed 3 times": the scenario before it. `restartCheckpoint` (`feedback3.js:70-84`) selects "restart" and returns after `dc.step(10)`, as soon as Jo is near the lamp; it does not wait for the respawn tail the way `afterRestart` does for the dream restart. `boot()` then warps and runs 40 frames. If that overlap leaves the scene mid-respawn/transition for a moment, E near Nell does nothing, `chat` returns, `met-nell` is false. Only this explanation fits "first in a batch only". I could not confirm it by reading; S5 makes the next failure name itself. A player cannot hit it.

### Did a fix open a new hole?

Checked each; no new softlock.
- Plank B 2 to 16: B's right end is 544 px, the chain ladder (col 14) and the weight prop (col 18) are clear; the pendulum-2 pivot (col 12, row 19) is under B and was already. A right shove at x 515 lands on B. Fine.
- `bell4` at col 20: gallery x 17 to 27, `bell3` 64 px away (Interaction radius 44, so they do not overlap); the third-gear seat is at col 21 and needs `gear3_given`, by when all four are hung. Fine.
- `{act1}` replace: first occurrence only, text only (not choices). Used once. Fine.
- `pendulumToll` gone: `works.js` has no heart path; `scatterCoins` gone with it.
- Held-train strain: `t.angle` only advances while the train runs (`wheels.js:289`), so the release no longer pops; a running train cannot be lifted again (`here()` needs `!flags[def.flag]`), so no running-to-held path.
- `keeper_why_on` plays whenever `why_told && !gear3_given` and no beat is busy (`works.js` update): reached only after the first conversation closes (the update does not run while a box is open); `gear3_given` is set at the last node, so no loop. A pause (menu, return to station) during a look re-plays the beat for parts 2 and 3 on resume; part 1 is not replayed since `why_told` is saved. Fine. Jo is on the gallery during it, out of the bob's reach (bob swing x 195 to 415, Jo at x 700+).
- Wheel to another room: `wheels.update` clears `carrying` before `nearPeg`, so the slow-down cannot outlive the wheel.

## Where only a real play can tell

- Whether the eye leaves the plate for the ring (S4), and whether "One. One. One." nags an idle player (N3).
- Whether two silent holds (3.4 s, 2.8 s) help or press on a confession of 12 or 13 boxes (this review thinks help).
- Whether the close shot for part 1 and the wide shot for parts 2 and 3 (N5) feels deliberate.
- Whether the strain reads as "held" and whether the sound is right (silent, per the report).
- Whether the 13 s `green_lit` is too long on a second play (N1).
- Whether anyone notices the gable clock (S2).
