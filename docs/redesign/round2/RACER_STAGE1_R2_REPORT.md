# The Racer, stage 1, fix round

The owner's two decisions are in, with the fixes from both reviews. Stage 2 work was left alone.

**Nobody has driven this, and nobody has heard it.** Every number below comes from a bot, a state check or an offline render. Dev is silent, so the beat has never reached an ear. The owner's first check is whether the beat can be heard, and whether a corner feels like a choice.

## Decision A: lanes are racing lines

In a bend a car's lane is now its line (`bendSafe`, `bendLen`, `lineOf` in `src/engines/race.js`):

- **The outside** holds more speed and is longer. **The inside** holds less and is shorter. Both amounts are set per bend in `tracks.js`.
- **A lane change above 20 m/s** scrubs 1.5 percent of speed.
- **The bend call** says the side: `LEFT IN 150 M: TAKE AT 86 KM/H`. The speed and the speedometer notch follow the lane Jo has asked for.
- **Touch** is unchanged: two pedals and the lane buttons.

To give each line a bend it wins, the road needed a third bend. It is the kink at 720 m, 60 m before the wall bend. The bales and the second cart moved to make room.

| Bend | Character | Best line, others held at their best | Inside / outside / change |
|---|---|---|---|
| 340-430, straw | Sweeper, long straight after | Outside | 45.19 / **44.47** / 44.85 |
| 720-790, straw | Kink, wall bend right after | Inside | **44.47** / 44.77 / 44.49 |
| 850-935, wall | Tight, long straight after | Line change | 44.49 / 44.85 / **44.47** |

`tests/race.test.js` pins these:

- The three uniform strategies finish within 0.5 s of each other. They are 44.87 to 45.21 s here, a spread of 0.34 s.
- Each bend has a different winner.
- A bend's losing lines are within 0.8 s of its winner.
- The best mix beats the best uniform line by more than 0.1 s.

The kink and wall-bend margins are thin (0.02 s), so read them as "nearly equal", not as a clear win. What separates them for a person is risk. A bot that brakes 0.3 s late into the wall bend gets through at these overspeeds:

| Line | Survives up to | Spins at |
|---|---|---|
| Inside | 40 percent over (with a lane press, 60) | 60 percent over, no press |
| Middle | 25 percent over | 40 percent over |
| Outside, by the wall | 5 percent over | 15 percent over |

## Decision B: hear the draft

- **The maths:** `draftBeat()` in `race.js` gives 0 Hz in the slot (the middle of the draft window, in the rival's lane, within a fifth of the window's half-width). It gives 4 Hz at the window's edge and up to 9 Hz further off. It is pure and tested.
- **The sound:** `tuneToBeat()` in `engineSynth.js` pulls the rival's note to Jo's plus `hz`, including the sub-oscillator. The flutter and each voice's own detune fade out as it tunes, because they would beat as well. Far away the rival keeps its own note.
- **The picture:** three streaks off the rival's tail (`drawAir` in `RaceScene`). They wave and throb at the same `hz`, then lie still and turn bright in the slot. There is no text, and it works with the sound off.
- **State check** (`racer-beat`): the note gap the voices are asked for matches `hz` at each position, and the streaks are still at 0 Hz.
- **Offline render** (`racer-beat-offline`), the real oscillator graph into a buffer that never reaches the speakers:

| Beat asked | Strongest loudness repeat | Depth of the throb |
|---|---|---|
| 0 Hz | none to speak of | 0.006 |
| 1 Hz | 1 Hz | 0.453 |
| 4 Hz | 4 Hz | 0.452 |
| 9 Hz | 9 Hz | 0.418 |

Those numbers show the beat is in the signal, not that it can be heard over the road noise, or that it reads as tuning. The beat adds no rule: the draft window, bar and speed are as before. Two things to listen for: the rival's note slides up to Jo's as he nears, and the level is about 1.5 times higher at lock (rms 0.20 against 0.135). When the two notes lock they stay at whatever phase they reached, so that level will vary from one lock to the next.

## Bot table: lap times per strategy

Same bots on both engines, Jo alone on the road unless stated. "Before" is the stage 1 merge (`ce513f1`).

| Strategy | Before | After |
|---|---|---|
| Inside every bend, to the limit | 43.05 | 45.21 |
| Outside every bend, to the limit | no finish in 150 s (10 spins) | 45.21 |
| Line change every bend, to the limit | 43.07 | 44.87 |
| Middle lane, to the limit | 42.31 | 45.12 |
| Best mix found (out, in, change) | not applicable | 44.47 |
| Middle lane, into the bend at 1.15 × the limit, holding it | 41.27 | no finish (8 spins) |
| Same at 1.25 × | 40.64 | no finish (9 spins) |
| Same at 1.5 × | 39.67 | no finish (10 spins) |
| Never brakes, inside | 40.08 | no finish (11 spins) |
| Never brakes, middle | no finish | no finish (11 spins) |
| Never brakes, outside | no finish | no finish (10 spins) |
| Rival alone | 44.04 | 46.47 |
| Middle lane with the rival on the road, no sling | 42.52, P1 | 47.46, P1 |

The road is longer by a bend, so absolute times went up. Compare within a column.

## Braking matters

- **`slipPush` 0.28 was not enough.** Lanes alone still left "brake to 1.5 × the limit" as the fastest line, because scrubbing speed inside a bend costs less than braking before it. The gamer's own table shows the same trend.
- **I added two numbers beyond the review, both in `TUNE`:**
  - `slipOver`: a tyre that has let go grips again only below the limit, by as much as it went over. That is capped at half the limit.
  - `slipSteer`: a lane press inside a slide steers at half rate, which stopped a bot mashing lanes for time.
- **The result:** braking to the limit is now the best line for the bots. Going over costs time or the wall.
- **Pinned:** a never-brakes bot never places well, on any line.
- **The brake sums:** `brakeDistance` now includes the rolling drag. The old formula put the chalk about 26 m early.
- **Chalk:** one mark per lane at `chalkAt()`, which leaves 0.2 s for the foot. A test brakes from each mark and arrives at that lane's speed, or up to 1.5 m/s under it.
- **BRAKE NOW** uses the same sums. It also shows for the first bend of a player's first race.
- **Bug found and fixed:** the rewrite made straw fire on every step, and `slipOver` could leave a car stuck at 0 m/s. Straw now clears the slide after one hit.

## The other fixes

| Item | What changed | Check |
|---|---|---|
| Lamps | 250, 500, 700, 950. Never more than 250 m back, and no cart or wall more than 250 m past its lamp. | Test |
| Rival on a restart | Goes back to where he was when Jo passed that lamp. The clock does not go back. | Test, `racer-again` |
| "Again?" | On the dark frame when the race can't be won (`raceLost`), or when the rival gets home with Jo over 100 m short. Again / Drive on / Garage. Enter, Space, E, X or a tap takes Again. | `racer-again` |
| Pause in a spin | The fade now follows the race clock, not a timer, so a pause holds it and nobody drives blind. Restart from the lamp does nothing during a spin. No lamp yet: it restarts the race, lights included. | `racer-spin-pause` |
| Hit-stop | Lane and sling presses wait for the race to resume. | Test, `racer-hit-stop` |
| Gamepad | Triggers and d-pad are pedals, d-pad up and down are lanes, the stick's X is still a pedal. Tilting the stick can't change lane. | Test |
| Sight strip | At x 664, no digits. Shows only beyond the view, measured each frame. Grows with time to contact, pulses under 1.5 s. A tick along the lane; other lanes stand back. | `racer-sight-strip` |
| HUD diet | Level, goal and footer fade after 5 s. No FULL label. Grip stays hidden until the tyres leave green, or a track sets `gripMatters`. The distance steps in 50 m. | `racer-hud-diet` |
| Result card | Real lifts (a new count), the gap to the Corsa, spins or rubs, slings, the target time. | `racer-card` |
| Launch | Ottavia on the third light in the first race; "Early. Next time." on a jump start. The rival starts 20 m up the road (was 9). | Test |
| Bends visible | Road slides 8 px towards the outside, land up to 14 px, far land most. The HUD stays put. | `racer-bend-visible` |
| Bench and rack | One [E] line each from Ottavia. | `racer-garage-lines` |
| Target time | "Ottavia's time: 0:44.5" on the card. | `racer-card` |
| `prize[2]` | Second place now pays its 6 nuts, once. First later pays the difference. | Test |
| Gamer's NICE list | `saidGo` reset, knock at most twice a second, double-tap keeps where the glide began, wheels and buzz use interpolated distance. Esc on the grid no longer counts as a try. | Tests |

**Sight strip, against the brief's 20 m.** I hide it at the camera's real view, 14 to 17 m, not at 20 m. At 20 m there would be up to 0.4 s when neither strip nor road shows the thing. At top speed it now hides at 17.3 m, well before the 11.7 m point of no return, and the pulse starts at 53.9 m. That leaves 1.17 s of pulse to react in.

**Rival pace.** Pull 1.0, top 0.94 (was 1.04 and 0.96). A tidy bot that drafts and slings wins by about 1 s; one that never passes loses. A human's margin is a playtest question.

**A launch can still reach the bumper.** With perfect launch and throttle held in the lane, the bar is full by 2.2 s and Jo hits the bumper at 5.7 s if he doesn't pull out. That is racing, so I left it, and the test pins no contact up to 5.5 s.

## Review claims checked

**Wrong or partly wrong:**

- **Designer S1, "no UI camera".** There is one. Screen objects at depth 100 or more move onto `UIScene` (`src/ui/ui.js`). The HUD neither breathes nor rolls, and `racer-bend-visible` confirms it.
- **Designer S2, the second dim strip.** No object draws it. The UI display list has one plate each for the speedo and the footer. Below the plates the pixel columns are plain kerb.
  - **The likely cause is the capture.** A WebGL canvas screenshots black here, so a snapshot gets laid over the canvas, and the canvas sits 25 px down in the page. Its plates then show below the overlay as thin dark strips. My own capture did exactly this, under the speedo and `[ESC] PAUSE`. I don't have the original screenshot, so this is a match, not proof.
  - **One real flaw nearby.** At speed the kerb's top edge crosses the 88 percent plate and made its lower part darker. The speedo plate is now opaque.
- **Gamer M1, "one number".** See "Braking matters". `slipPush` alone does not do it.

**Right:** designer M1, M2, S3, S4, S7 and the reaction arithmetic. Gamer M1's table, S1, S2, S3, S5 and the NICE items I took. Before the fix, a launch rubbed at 2.76 s.

## Production build

Run from `vite build` through `vite preview`, on the real door.

| Check | Result |
|---|---|
| `RaceScene` chunk before the door | Not fetched at the title, hub or garage |
| Chunk at the door | 13 KB, 200, 16 ms; the race is running 0.4 s after the press |
| Chunk missing (404, forced by moving the file out of `dist`) | Ottavia: "She will not turn over. Check the line, reload the page, and try again." Jo stays in the garage, controls and picture back, door usable |
| Door pressed again on that page after the file came back | Still fails. The browser keeps the failed import until a reload, which is what the line tells the player to do |
| Fresh load after that | Works |
| Frames in production, 240 of them with the gas held | Average 16.63 ms, p95 18.1 ms, a steady 60 Hz on this Mac |

**One slip to report:** the first production page ran for under a minute with audio on, because a production build is not silent. `game.sound`'s context reported `running`, on the hub, intro and garage. I didn't check whether anything played. For the rest, a stub added only to the throwaway `dist/index.html` suspended audio.

## Measured

Dev server, this Mac, frames stepped by hand, with the wait on a 1-pixel read included. These are work times, not on-screen rates.

| Check | Result | Budget |
|---|---|---|
| Race frame at speed, 600 frames | avg 2.46 ms, p95 5.3 ms, worst 7.2 ms | 16.67 ms |
| Draw calls | 5 a frame, 176 objects | |
| Worst frame through the door | 7.1 ms | 60 ms |

- vitest: 38 test files, 653 tests, all passing.
- `lint:content`, `lint:rooms`, `lint:scale`: clean, with the existing 7 warnings.
- `vite build`: passes.
- All 20 `racer-*` scenarios pass, plus `continue-pays-once` and `readability-hub`. The full set was not run, as the brief asked.

## Not done

- **Stage 2, as briefed:** coast scenery, track themes, story races, other rivals, music, what nuts buy, track scripts.
- **Sight strip audio tick:** not in the brief.
- **The designer's brake-point bar under the speedometer:** not in the brief.
- **Real fade for the plates:** a tween on the HUD text from `RaceHud`, reaching into `UI.scene.hudGrid`. It works without changing the shared HUD. If other dreams want it, it belongs in `HudGrid`.
- **Touch and a real phone:** still synthetic touches only.

## Open questions before story races (the designer's list)

1. **Lane model.** Answered by decision A. Does a bend's outside always hold the same trade, or do tracks author it freely as here?
2. **Failure unit.** The lamp rule and the rival going back with Jo are built for this road. On a road this short almost any spin leaves the race out of reach, so "Again?" appears nearly every time. Is that right for longer races?
3. **Scripted races.** The tragedy "cannot fail" and the engine has no script. Add `track.script` before race 2, or it arrives as flags in the scene?
4. **Track theme object.** Sky, layers, road paint, kerb, grade, night, wet grip. `PAINT_STEPS` is module-level and can't hold two themes.
5. **Rival behaviour.** Block, mirror and yield, with a telegraph on the sprite. Cassian, Lena and Bruno differ at the engine level.
6. **The ear.** Decision B answered the question. New from this round: should the slot do anything beyond telling you (a faster fill, a stronger sling), or stay information only?
7. **What nuts buy,** and what second place is worth. It now pays 6, into a tin with no shop.
8. **Music in races.** `musicDirector.stop()` at race start. Any music will sit on top of the beat.

## Round 3: last tuning (from `racer_stage1_review_r2.md`)

**Still nobody has driven it.** All numbers are bots with made-up error (`sd` is brake-point noise in metres, `m` its margin). Same bots before and after.

| Item | Change |
|---|---|
| M1 | `wearStraw` 0.10, on bend straw only; bales keep `wearBale`. |
| S1 | `keepGoing`: Drive on (or Esc on the question) sticks for the race. `reset` carries `now`, so Restart from the lamp never asks. |
| S2 | Corsa at d 13, lane 2; Jo stays in lane 1. On screen on the grid, with about a third of the nose past the edge (d 11.5 would show all of it). |
| S3 | A lift is 0.3 s off both pedals, above 25 m/s, clear of `from - 120` to `to`. A clean bot logs 0. |
| S4 | Wall bend `lineSpeed` 3. Track lint in `tests/race.test.js`. |
| S5 | `costliest()` in `result.js`: one card line (lamp, straw, rub, missed green, or slowest bend in km/h). Silent under 0.15 s. Weights in `COST`. |
| NICE | Restart hidden in a spin; lamp line once; `toLamp` clears sling and draft. |

| Bot, alone unless stated | Before | After |
|---|---|---|
| Inside / middle / outside / change, uniform | 45.21 / 45.12 / 45.21 / 44.87 | 45.57 / 45.08 / 44.87 / 44.98 |
| Best mix | out, in, change 44.47 | out, in, out 44.52 |
| Wall bend, others best: in / mid / out / change | 44.49 / 44.68 / 44.85 / 44.47 | 44.85 / 44.65 / 44.52 / 44.58 |
| Wall bend, sd 4, m 4: time and spin, outside | 45.24, 15 % | 44.90, 8 % |
| Wall bend, sd 4, m 4: inside / middle | 44.89 / 45.07 | 45.37 / 45.04 |
| Skip brake at both straw bends, best mix / mid | +0.74 / +0.69 | +2.04 / +1.49 |
| Skip the sweeper only / the kink only, best mix | +0.46 / +0.26 | +1.06 / +0.52 |
| Middle lane at 1.15, 1.25, 1.5 × the limit; never brakes | no finish | no finish |
| Rival alone (top 0.94 → 0.96) | 46.47 | 46.45 |
| Launch held straight | bumper at 5.67 s | no contact, past him at 5.41 s |
| Launch, pulling into his lane | armed 2.19 s | armed 1.21 s, bumper at 3.62 s |

P1 with the rival on the road, mid lane, 200 runs:

| Driver | Before | After |
|---|---|---|
| sd 3, m 4, launch | 99 % | 100 % |
| sd 3, m 4, no launch | 31 % | 90 % |
| sd 5, m 8, launch: brakes / skips both straws | 76 % / 90 % | 76 % / 31 % |
| sd 5, m 8, no launch: brakes / skips both straws | 36 % / 67 % | 64 % / 0 % |
| Brakes to 95 % / 90 % of the limit | 31 % / 0 % | 21 % / 0 % |
| sd 8, m 12, launch | 31 % | 36 % |

**The rival needed more than the grid.** Moving him cost him pace (he now takes the wall bend's slow inside), so top went from 0.94 to 0.96. The slack is 1.93 s (was 2.0).

**Target stays 44.5.** The best bot is 44.52, not the 44.2 the review expected. That bot has no launch; a launch is worth 0.42 s more.

**Review claims that did not hold:**

- **"Move the 700 m lamp to 790-800 changes nothing."** It breaks the pinned rule of no lamp more than 250 m back (500 to 800 is 300 m). With four lamps no spot fits: the next lamp after 500 must be at or before 750, which is the kink. It also hands the car back 50 m from the wall. **Not moved: owner's call.** The caption has gone (lamp line once), so only the chime still lands on the braking point.
- **"`vIn` and `launchTried` are in the engine."** There is no `vIn`, and `launchTried` is also true on a jump start. Added `launched` and a per-bend undershoot.
- **The "1 % is 0.2 s" rule** is for holding under the limit through all the bends. Arriving under and driving back up costs about 0.07 s per m/s (bot), which is the weight the card uses.

**Bug found on the way:** Restart from the lamp left a stale listener on `camerafadeoutcomplete`, so the next spin's dark lifted early and "Again?" appeared over a bright road. Fixed: only a running fade to dark is waited for.

**Consequences to watch:**

- **The draft is now opt-in.** Held straight, Jo never gets it; he has to press a lane to sit behind the Corsa. This answers the review's "the draft arms itself every race", but a player who never tries it won't meet it.
- **The launch carries less.** No launch is no longer stuck behind him: sd 3 goes from 31 % to 90 %.
- **The lint reads "skipping the straw bends" as all of them.** One bend alone costs less than the slack (+1.06 and +0.52 s). Skipping only the sweeper is nearly free at P1 for a sloppy driver: 70 % against 76 %. Braking still pays, but not at every bend for that driver.
- **Uniform outside is now the best uniform plan.** The spread pin went from 0.5 s to 0.8 s, and "each bend a different winner" became "more than one winner", as the review expected.

Checks: vitest 39 files, 684 tests; `lint:content`, `lint:rooms`, `lint:scale` clean with the same 7 warnings; `vite build` passes; all 20 `racer-*` scenarios pass.
