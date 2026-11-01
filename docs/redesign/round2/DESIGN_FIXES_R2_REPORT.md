# Design fixes, round 2: the reviews of the design-fixes round

Findings from `advice/design_fixes_review_gamer.md` and `advice/design_fixes_review_designer.md`. Each was checked against the code first. Browser checks ran on port 5181, silent. The branch also contains the speed round 2 merge, which landed on `redesign` while this was being done; everything below was re-run on top of it.

## Gamer's list

| Item | Result |
|---|---|
| M1 duck immunity | **True, fixed.** `enter('windup')` records `duckedAtTell`; a crouch held since before the tell doesn't dodge. A duck made during the tell works. I also let Jo release and press Down again during the tell: that is a duck made during the tell, and it is the only answer left when he is crouched on top of a foe. Scenario case `held`. |
| M1 crouch speed | **Slowed to 140 px/s** (half; `CROUCH_SPEED`), grounded only. Checked first: nothing needs full-speed crouching. The glass card literally says "crouch-walk", and 140 is under the glass's 150 limit anyway. The rooms have 15 one-tile gaps, at most 6 tiles long except the hub's steps (16). The Editor's rooms aren't among them, and the glass (col 214) is nowhere near him. I did not trace the Astronaut's `p3_survival` and `p5_crevasse` gaps (3-4 tiles) against their own timers; half speed costs under half a second there. Air speed is unchanged, so the reach model stands. |
| M2 pause | **True, fixed.** `freezeWorld` records when the pause began; on resume each foe's clocks shift by that time and `lastTick` resets. Beyond the brief: `calmUntil`, `seenPlayerAt` and `alertAt` shift too, so a pause also can't burn a calm or lose a foe. Measured in the real game with the real Esc key: 233 ms of wind-up before a 1.5 s pause, 200 ms after, grab lands. |
| M2 chained grace | **Fixed, simply.** One grace per foe per 4 s (`GRACE_EVERY_MS`). A second conversation or card inside that window acts like a pause: wind-up and calm resume where they were. Cards and conversations still get 0.9 s. |
| M3 heart cap | **True, fixed.** Uses `heartsMax`. It also stopped a shard at the cap showing one heart over the max. |
| S1 calm | **True, fixed.** `calmFoes()` on throw-out (once Jo is at the lamp) and on respawn: wind-ups drop, 1.5 s calm. |
| S1 CP6a | **True, fixed.** Proofreaders now walk cols 547-552 and 548-553 (lamp at 544, desk at 543). `writer-press-route` passes. |
| S1 lint | **Added**, `tests/foeCheckpoint.test.js`: a grabbing foe's patrol within about 80 px of a lamp on the same floor. It found two more, both long patrols that pass a lamp, left alone because only CP6a was asked for: `astronaut/p1_track CP1a` (cleaner) and `painter/via cp_via` (rival). They are listed in the test by name, so any new one fails. |
| S2 acceleration | **Claim checks out, nothing tuned.** `grabConnects` now has Jo's real pick-up. Largest gap at which a run still gets caught: 0.25 s reaction 4.5 px, 0.30 s 13.5 px, 0.35 s 27.5 px, 0.40 s 41.5-44 px. The reviewer's numbers were right. The wind-up normally starts near 65-70 px, where all of these are safe. Under 5 px at 0.25 s the duck is the answer. `foe-grab-fair` now also runs gaps 10 and 30 with the real Foe and real Jo: all 13 kinds escape. Fair, so no tuning. |
| S3 pipes | **True, fixed.** `ventBeat` in `tuning.js`: on-time capped at period - 700 ms, 200 ms warning when tilted. Third pipe at tier 2 tilted: 1782 ms on (418 off) → 1500 on (700 off). Untilted beats didn't move. The bigger puff the reviewer suggested was not done. |
| S4 shards | **True, fixed.** `saveRun()` on pickup. |
| S4 coins | **True, fixed.** The save stores the dream's wallet figure in `extra.walletAtSave` (an optional field, no format change); a Continue takes out anything above it. A save without the figure loads untouched (`continue-pays-once` checks this). |
| S5 marks | **True, fixed.** The shard's mark goes on resume. Legacy moments (Writer, Astronaut) keep their marks and drop them when the moment's flag is set, which covers both taking one and a Continue. |

## Designer's list

| Item | Result |
|---|---|
| M1 hearts | **Fixed as briefed.** Caught dreams give 3 to 5; shards take it to 8; tea one over. `HEARTS_CAP` stays 8, no tier 3. Row display is unchanged, since it reads `n`/`max`. `economy.test.js` updated. |
| M2 foe pace | **True, fixed.** Chef, Astronaut and Writer have `foePace` rows [1, 1.08, 1.16]; the fallback is on tiers too, so nothing reaches +40 %. Only pace changed. `lunge.test.js` now tests the top tier for every kind. A foe's pace only changes where he starts a wind-up (a step closer); wind-up and lunge don't scale, so the dodge holds, and no walker outruns a running Jo. |
| S2 Bilal | **Fixed against the new cap.** At 8 hearts: "You're full, friend. Keep your money." and no charge. `heartsFull` is based on the real cap, not on what a caught dream may add later. |
| S4 flag | **Claim wrong.** A direct `this.F.x = ...` is saved like any flag: `saveRun` sanitizes and stores all of `F`, booleans included. Nothing was being lost on a Continue. I routed it through `setFlag` anyway to match the file. Payoff added: when she brings the soup, Maren opens with "Still only listening?" (`d3b_listening`). It is at the word she gives him, "again", which is the closest fit I could find to "the pen's word". |
| S5 names | **Fixed.** Racer's coast is now the **Calvessa Coast / Coppa Calvessa** (invented). `nell/manifest.js:1` says Nell. Historical docs untouched. |

## `foe-grab-fair` failing on a first run: found, reproduced, fixed

A scenario bug, not a game bug, and not timing. A new port means a new browser origin and an empty save, so no tutorial cards have been seen. A card opening in the middle of a trial freezes physics until it is closed. The scenario reset the `tutorialActive` flag but left the modal open, so the foes kept running with physics frozen, and the next trial's foe couldn't step in.

Reproduced on demand with the original three actions on a cleared save: the first run failed `writer/guard stand` (a card opened at the end of the landlady's `away` trial), the second passed. That matches the failure once, then pass 5 times. The scenario now closes cards. On a cleared save and a freshly started server it passes first time and again.

The server's own first load (`Re-optimizing dependencies because vite config has changed`) did not cause a failure in my runs.

Also fixed in the scenario: Jo's arrival spot is against a wall in three dreams, which only showed once close gaps were tested. The foe now stands on the side Jo can't run to.

## Measured

- vitest: 555 passed. `lint:content`, `lint:rooms` (0 failures, 7 warnings), `lint:scale`, `vite build`: clean.
- Scenarios, on a cleared save and a fresh server: pass for `foe-grab-fair` (twice), `foe-pause-fair` (new), `bilal-buy` (new), `continue-pays-once` (new), `chef-no-twice`, `chef-continue`, `chef-busy-brann`, `painter-lapis-theft`, `writer-press-route`, `gambler-deck`, `zero-hearts-checkpoint`, `continue-run`, `restart-death-card`, `hub-ladder-undercroft`, `hub-ladder-roof`, `writer-ladders-both-ways`, `jo-walk`. `gambler-tilt` passed earlier, before the speed merge, and was not re-run after it.
- A real buy at Bilal's through the real dialogue with key presses: "shard ·60", wallet 500 → 440, shards 0 → 1, his line plays.

## Failing, not from this round

Both fail the same way with this round's source swapped out for plain `redesign`, so these changes didn't cause them. I didn't investigate either.
- `dream-ladders-both-ways`: `painter/chapel col 96 rows 89-92`, down leg. Jo ends at 2032,3434, not climbing. `RECHECK_REPORT.md` had this same ladder passing after a card fix.
- `jo-foot-slide`: walk and jog log 0 plants. `STATION_EVENING_REPORT.md` had it passing.

## Open, for the owner

- **"Board from the start" still pays twice.** A run in progress, then boarding from the start: the run is cleared but the wallet and shard tally keep what it gave, and the shards and coins are back in the world. The pause menu's restart undoes this; the Conductor's choice doesn't. S4 covered reloads only, and this one is a choice about what that option should mean. Options: undo the run's takings as the pause menu does (recommended, it needs those takings stored in the run), or keep a permanent per-dream list of shards taken.
- **Coins before the first save in Writer and Astronaut.** Framework dreams save on arrival. The old scenes save at the first lamp, so coins taken before it and a reload aren't reconciled. There is no run to Continue and it is a few coins at most.
- `astronaut/p1_track CP1a` and `painter/via cp_via` have patrols across a lamp. The calm covers a respawn; moving them is a level design call.
- Vite's cache is shared through the `node_modules` symlink. My server logged a re-optimise on start because its config differs, in the same `.vite` directory the main checkout's server uses. I saw no effect on my runs and didn't check the other server.

## Not checked

- Nobody has played any of this. The new crouch speed and the 4 s grace are numbers and scenarios only.
- Nothing visual: the browser pane was hidden and the screenshot came back black. That covers an 8-heart row, the mark disappearing and Maren's new line on screen.
- Sound: dev is silent.
- Astronaut and Writer room crossings at the new foe pace.
- `d3b_listening` in a real play through to the soup; only the text and the branch exist.
- The full scenario set was not run, by rule.
