# Design fixes round: pro gamer review

Read-only review from code and arithmetic (no browser, no sound). 1 m = 44 px, Jo about 80 px. Jo: SPEED 280 px/s, horizontal lerp 0.5 per 60 Hz frame (`src/entities/motion.js:8`, `Player.js:734-741`), jump 600 px/s at gravity 1200 (apex about 147 px, about 1.0 s in the air).

## Grab numbers (what a skilled player sees)

The foe stands still for the whole wind-up (`Foe.js:337`, `setVelocityX(0)`) and only reaches during the 0.25 s grab. Reach is zero during the wind-up. During the grab the hand covers `42 + lunge * 0.25`:

| lunge | step in | total reach at grab end |
|---|---|---|
| 130 (porter, inspector, Crake, petitioner, gardener, cleaner, gym rat) | 32 px | 74 px |
| 150 (Brann, security, guard, gendarme, shopkeeper, collector) | 37 px | 79 px |
| 160 landlady | 40 px | 82 px |
| 170 proofreader | 42 px | 84 px |
| 180 farmer | 45 px | 87 px |
| 200 runner, scalper | 50 px | 92 px |
| 240 rival | 60 px | 102 px |

All of them exceed the 70 px wind-up range, so standing still is always caught. That part of the fix is correct. Running away from a normal approach (gap about 65-70 px) is safe for every kind, even if Jo starts running only when the grab begins (0.4 s late). The slowest case I simulated with Jo's real acceleration: the foe reaches 44 px at best at 0.4 s reaction, so it never connects.

## MUST

### M1. Holding Down while running is full immunity. Dominant strategy.
- `Player.js:733-741`: horizontal speed has no crouch term. `AnimationController.js:37` even has a `crouch_walk` animation, but the speed is the full 280 px/s.
- `Foe.js:351`: `ducking = player.crouching`, checked every frame of the grab.
- Result: hold Down + direction through any room and no human foe can throw you. Wind-up, tell and timing never matter. Human foes have no body collision with Jo (`dreamAdapters.js:86`, `foeContact` returns for humans), so he walks straight through them. The duck is meant to be a timed reaction to a 0.4 s tell, and instead it is a toggle.
- Fix (one line, keeps the duck as a tool): at wind-up start `this.duckedAtTell = player.crouching`, and in the grab use `const ducking = player.crouching && !this.duckedAtTell`. Someone already crouched when the tell starts is grabbed low. Hide spots are unaffected, since `canSee` already returns false for a hidden Jo. Optional second fix: crouch speed x0.5 (about 140 px/s) in `Player.js:734`, so a crouch walk costs time.
- Add the case to `tests/lunge.test.js` and to the `foe-grab-fair` scenario ("pressed Down before the wind-up: thrown").

### M2. Pause is a free dodge, and it can be chained.
- `BaseLevel.js:892` `freezeWorld` only sets `this.paused`. `handleModalUpdate` returns true, so `updateFoes` is not called, but the scene clock keeps running.
- The new rule `Foe.js:275-282` (gap over 150 ms means drop the wind-up and grant 0.9 s) treats every pause as a conversation. Press ESC during the tell, Resume: the wind-up is cancelled and the foe is calm for 0.9 s. Doing it again at the next wind-up costs nothing. A speedrunner will use this at every foe.
- Fix: when pausing, record the time. On `freezeWorld(false)`, for each foe add the paused duration to `stateUntil`, `stateUntil` only, and set `lastTick = now`, so the gap rule only ever fires for real modal holds (dialogue, card, encounter). A pause then resumes the wind-up where it stopped.

### M3. A whole heart picked up in a level is still capped at 6, while the rule is now 8.
- `BaseLevel.js` shard pickup: `this.maxLives = Math.min(6, this.maxLives + 1)`. `heartsMax` (`wallet.js`) caps at `HEARTS_CAP` = 8.
- Scenario: base 6 hearts (3 caught dreams), pick up the third shard. The popup says "a heart, whole.", `lives` becomes 7 and the max stays 6. The HUD shows 7 of 6. The first refill drops it to 6. The heart appears only on the next scene load. The economy round claims the heart counts on top; in-run it does not.
- Fix: `Math.min(HEARTS_CAP, ...)`, or `this.maxLives = heartsMax(this.difficulty, sv.shards)`. Assert it in `tests/economy.test.js`.

## SHOULD

### S1. After a throw or a death, nothing protects Jo from the foe who is next to the checkpoint.
- `throwOut` (`BaseLevel.js:310`) and `respawnAtCheckpoint` do not touch foe state. The new calm only comes from a stale `lastTick` or from a miss.
- Example: Writer, `rooms.js:300-302`, checkpoint CP6a at col 544, proofreaders patrol cols 542-553 (starting 545 and 550), and the typo desk is at 543. `typos` is not reset on respawn (`WriterScene.js:51/728`, no `onRespawn` reset). Jo respawns 1-6 tiles from a proofreader who can see him. The wind-up starts on the first frame, the grab lands at 0.4 s. Control returns 500 ms after the respawn (`controlLockUntil = now + 1500` is set before the 1 s wipe). That is 0.1 s too late to duck. It costs a heart each time (`loseHeart`), so it can be a death loop.
- Fix: in `throwOut`'s delayed callback and in `respawnAtCheckpoint`, `for (const f of this.foes) { f.calmUntil = now + 1500; if windup/grabbing then enter('patrol') }`. I only verified the Writer case by reading data; other checkpoints may have foes within 70 px too. A one-time lint (foe patrol within 80 px of a checkpoint) would find them.

### S2. The run-through margin is 0-5 px, and the test model is too generous.
- `grab.js:19-21` `grabConnects` gives Jo instant `joSpeed`. Real Jo accelerates with a 0.5 lerp per frame, so he loses about 9 px against the model. With Jo's real acceleration, a wind-up that starts at gap 4 px with a 0.25 s reaction still connects. With a 0.30 s reaction it fails up to a gap of 13 px, with 0.35 s up to 27 px, with 0.40 s up to 41 px. The "any gap, running, 0.25 s reaction, never" assertion in `lunge.test.js` is only true because of the instant-speed model. Close-gap wind-ups happen after a miss (the lunge leaves the foe on top of Jo) and after a conversation grace.
- Running straight through a foe who has just started his wind-up: at full 280 px/s Jo passes by 42-47 px at the moment the grab begins. The reach is 42, so the margin is 0 to 5 px. On anything slower, such as `conveyor_r` (`WriterScene.js:1396`, -90 px/s), a slope, a landing, or a belt in Chef's prep, he is caught. "Running through is safe" is true only on flat ground at full speed. That is probably fine as design, but it means M1 is the only reliable counter.
- Fix: model acceleration in `grabConnects` (`vx += (target - vx) * 0.5` per frame) and set the test to the reaction you actually promise. `foe-grab-fair` only tests gap 66, which is the easy case. Add gap 10 and gap 30 to the scenario.

### S3. The pipes' tilted case gets harder with the tier, with no warning.
- `boat.js:49-50`: `on = v.on * 1.35 * ventOn[d]`, `warn = 0` when tilted. Tier 2 + tilted: 1100 * 1.35 * 1.2 = 1782 ms on. The third pipe (`deck.js:27`, period 2200, appears after `lost_nights`) is then off 418 ms, with no puff and no cue. Crossing a pipe (zone 36 px plus a 28 px body at 280 px/s) takes 229 ms. Reaction 250 ms. It is only possible by learning the beat from watching, and it is already a punished state.
- Non-tilted tier 2: on 1320, off 1280, warning 320 ms. The puff drawn is a 5 px circle at 45 % alpha (`boat.js:62`), a weak cue. Crossing safely is fine in that case: 960 ms of clean gap.
- Fix: `on = Math.min(on, period - 700)` so a pipe is never off for less than 0.7 s, and keep a minimal warning (200 ms) when tilted. Larger puff for the warning.

### S4. Shards can be paid twice by reloading.
- The shard is saved to the wallet at the moment of pickup (`updateSave(... shards + 1)`), but `shardsTaken` is only written in `saveRun()` (called on a lit checkpoint, returning to the station, or `BaseLevel.js:952`). Pick up a shard, reload the page, Continue: the shard is back and gives another +1. Coins work the same: `addCoins` is immediate, `coinsTaken` is written at save, and `walletDelta` is restored without reconciling the wallet (`BaseLevel.js:865`).
- The shard version matters: three duplicates make a whole heart for free, and with M3 fixed the cap is 8. Coins have less weight, because the shelf is capped.
- Fix: call `this.saveRun()` on shard pickup. For coins, either save every pickup or store the dream's wallet at the last save and subtract the excess on resume.

### S5. The postcard's marks leak after a Continue.
- `BaseLevel.js:875`: taken shards are `destroy()`ed on resume, but `img.mark` (the ⌘) is not. The postcard shows a hint for a shard that is gone.
- Legacy moments: `BaseLevel.js:454` creates the ⌘ and keeps no reference, so it never goes away after the moment is taken, while the report says "the mark goes when taken". The framework path (`dreamAdapters.js:spawnMoment`) is fine.
- Fix: `if (i.mark) i.mark.destroy()` in the resume loop. Keep the mark handle on the legacy moment object and destroy it on use.

## NICE

- Tea is a dominant buy: 20 coins for +1 heart over max on the first stretch of every dream (that is +33 % at 3 hearts), 1 % of income. Nobody will ever skip it. Raise to 50-60, or leave it and accept it as a tax-free tutorial. Also, a refill (checkpoint respawn) drops the extra heart.
- Conversation grace can be chained: a short bark or sign that re-opens within 0.9 s of the last one keeps a foe off indefinitely. Only works where a repeatable one-line interaction sits beside a foe.
- Jump is a second, unreported dodge: Jo is more than 50 px above the foe for t = 0.09-0.91 s of a jump (the grab checks `abs(dy) < 50`, `Foe.js:350`), so a jump started up to 0.3 s into the tell beats it, with a wider window (0.56 s) than the duck. Nobody is taught it. It isn't a problem, but the `slide_under` card says only "duck".
- A calm foe walks his patrol (the `calmUntil` fall-through in `Foe.js`) while still in state `alert`, so he can wander toward Jo during the 0.45 s he should be off balance; the time he is calm is also not visible. A short stumble animation or tint during calm would make the "opening" legible.
- The 0.4 s tell is a red tint plus a click (`Foe.js:339`, `sfx('click')`). Dev is silent, so the sound cue isn't tested. A player with sound off has a 0.4 s tint only. Probably fine.
- Hearts at tier cap: difficulty stops at tier 2 (two caught) while hearts keep growing to 8 (base min(6, 3+d) + shards). From the 4th dream on the game gets easier. Consider letting tier 3 exist for foe pace, or accept.

## Sections that are fine

- Foe grab, standing / duck-timed / run-timed: the numbers are fair for a 0.25-0.30 s reaction and all 13 kinds have `lunge` above `MIN_LUNGE` (120). Reach during wind-up is nil. Nobody can bait the lunge into a long exposure: a miss gives a 0.45 s calm, and runner / scalper speeds (130 x 1.1 x 0.9 = 129 px/s chase) never catch a Jo moving at 280.
- The 0.9 s grace after a conversation: right idea, and it also fixes the card/tutorial wind-up. The only abuse is pause (M2).
- Economy exploits via scatter: a death or hit scatters `coinsSinceCP`, deducts exactly that worth, and the sprites re-collect the same total (`Coin.js:57-81`, `BaseLevel.js:494-500`). Net zero. Placed coins do not respawn within a scene. A dream restart deducts exactly what the run gave. No farm there. A thrown-out Jo also scatters, same result.
- The return ticket: the refill keeps the hit's invulnerability and Jo stays where he fell. Because one ticket is held at a time and it is bought at the hub, it can't be chained. 150 against income 1,855 is a reasonable price.
- Shop prices: heart 380 (about 20 % of a full run), postcards 7 x 100, ticket 150, tea 20. Hearts cannot reach 8 by purchase alone: three bought shards are one heart, so cap 8 needs base 6 (3 caught dreams) plus 6 shards, at least 3 of them found. Early cap is not reachable. The postcard reveal of shards is intended and costs 100 per dream.
- Musician: window 150 x 0.86 = 129 ms (rest of nerve: big set 14 + 4 = 18, 22 with Nia, 100 limit, retries never below 1). Harder, not impossible. Window 129 ms at 120 bpm is 52 % of a beat. Not verified with a person.
- Painter at tier 2: the giornata dwell time in the zone is 0.138 / 0.928 = 148 ms against 200 ms at tier 0 (74 %). Clock 9000 -> 7830 ms per section. The section with three steps could need up to 3 x 2.15 s = 6.5 s in the worst case of missing the pass each time, so the margin to the clock is about 1.3 s. `tuning.test.js` proves it is finishable with a perfect bot (16 ms latency), not with a human. Suggest the bot test with a 120 ms offset and one miss per section before calling tier 2 safe.
- Casino: Lou wrong 1 in 3 at tier 2; the odds do not move. Fine. Pipes: see S3.
- FOLD web (col 596): the landing works. A walk-off from web 2's right end (col 588) at 280 px/s lands near col 593 (fall 160 px takes 0.52 s, about 145 px). A jump off the end carries about 320 px and ends on or just past the stop (col 597, rows 26-27); that can put Jo in the 1-tile slot at col 598 on the floor beside the gate. The gate `g6` at col 599 requires `printed` (`rooms.js:319`), so it is no skip. The slot is 32 px wide for a 28 px body, so a stuck state would need a ceiling; there isn't one (the slot is open above), and he can jump out. The stop is 2 tiles high and Jo's jump reaches over it. The belt (+90 px/s) pushes him against it without tipping him off. Walking back left to the FOLD lever (col 566) from col 593 is 27 tiles against the belt: 190 px/s net, about 4.5 s, and the folder hazard at col 580 (period 2000) is on that path. Longer than before, not stuck.
- Run-off landings elsewhere, Clockmaker pole walk for Nell, Evening cast, dialogue: nothing to report from the numbers.

## What I did not check

- Foes during room transitions and beats that keep Jo free (updateAdapters is not gated on `transitions.busy`): not traced.
- Astronaut and Writer crossings (also not checked by the author).
- Any real play at tier 1 or 2.
- Whether other checkpoints sit within 80 px of a foe (S1 is confirmed for Writer CP6a by data only).
