# Racer stage 1: pro gamer review

Read-only. Everything below comes from code and from throwaway node runs of the real `Race` class (`src/engines/race.js`, `TRACKS.test`) with scripted drivers. Scripts live in the session scratchpad, not the repo. Bots are perfect-timing bots, so a human will be a little worse everywhere. Anything about how it looks or feels at speed needs a real drive, and I say so where it applies.

## Verdict in one line

The engine is clean and fair in its plumbing: input is never lost in a short frame, the step is correct, the result and the prize are saved once. But the one skill the design is built around, braking for bends, is dominated: lifting is never needed, and braking is 4 s slower than not braking. The bend is the whole game, so this is the MUST.

## MUST

### M1. Brake is a dominated choice; the fastest line is throttle plus two lane changes (race.js:29-30, 296-303, 321-334; tracks.js:16-19)

Lap time on the test road, Jo alone, perfect lane timing (lane 0 into bend 1, lane 2 into bend 2, dodge carts and bales):

| Driver | Time | Spins | Straw hits |
|---|---|---|---|
| Brakes to exactly safe speed (what the report's "tidy" bot does) | 43.0 s | 0 | 0 |
| Brakes to 1.25 x safe | 41.0 s | 0 | 0 |
| Brakes to 1.5 x safe | 39.9 s | 0 | 0 |
| Never touches brake, best lanes | **39.1 s** | 0 | 0 |
| Never brakes, lane 1 into bend 1, lane 2 into bend 2 | 39.1 s | 0 | 0 |
| Never brakes, stays in lane 1 for both bends | 40.1 s | 0 | 1 |
| Never brakes, lane 2 for both bends | 40.1 s | 0 | 2 |

With the rival on the road the no-brake line wins in 39.05 s. The report's "flat out never finishes" is true only for a bot that does not move lanes for the bends. Why it works: the slide scrubs `0.6 m/s²` per m/s over the limit, so it sheds its own speed in about a second, and it pushes only `0.22 lanes/s` per m/s over. From the right lane the 2.45-lane buffer to the wall or straw is never used up. Even eating a straw hit (40% speed loss) is still 3 s faster than braking, because a brake plus the long slow pull back to 36 m/s (`accelPow` 1.7) costs 4 s over two bends.

Consequences: the BRAKE pedal, the brake fade, the grip meter (grip ends at 0.01 on the no-brake run and it costs nothing, `gripMin` caps the loss), the speedometer notch, the "BEND 260 M: 86" call, the chalk line and "BRAKE NOW" all point the player at the slower line. Soft aid actively teaches the wrong thing: the chalk sits 59 m before the bend, the real need is about 33 m (the formula ignores the coast drag that adds to the brake).

Fix (one number): raise `slipPush` from 0.22 to 0.26-0.28. Measured, with everything else as it is:

| `slipPush` | No brake (best lanes) | Brake to safe | Brake to 1.25 x safe | Brake to 1.5 x safe |
|---|---|---|---|---|
| 0.22 now | 39.1 s | 43.0 s | 41.0 s | 39.9 s |
| 0.24 | 39.1 s | 43.0 s | 41.0 s | 39.9 s |
| 0.26 | spins into the wall every time | 43.0 s | 41.1 s | 39.9 s |
| 0.30 | spins into the wall every time | 43.0 s | 41.1 s | 39.9 s |

The cliff is between 0.24 and 0.26, so 0.26 sits right on the edge and a human who is a few metres late with a lane change will spin at 0.26 even with a lift. Take 0.28 and re-run the bots (`tests/race.test.js` pins this). At 0.26 and up the trade is smooth: every extra km/h of margin you brake off costs about 0.15 s, which is a real braking choice, and flat out is a spin. Also pin in the test: "a bot that never brakes must not finish".

Second, independent lever: the bend is short. 90 m and 85 m at 36 m/s are 2.5 s each. Lengthening bend 2 to about 130 m makes the scrub matter more.

## SHOULD

### S1. Pause > Restart from the lamp mid-spin skips the 3 s fail and can leave the screen black (RaceScene.js:265, 433-440; race.js:395-410)

Pause is allowed while the car is in `spin` or `reset` (RaceScene.js:178). `restartFromLamp` calls `toLamp(c, true)`, which puts Jo straight back in `run` at 12 m/s, so the design's "3 s of recovery" is about 0.3 s. Saves up to about 2.7 s per spin, and the spin still counts only as a spin flag. Worse, the 1.6 s `delayedCall` that fades the camera out (line 265) is never cancelled. If the restart happens before 1.6 s after the spin, the reset event fades in, then the pending call fades out, and nothing fades back in: Jo drives blind in the dark until the next reset. Not his fault.
Fix: in `restartFromLamp` return early when `c.state !== 'run'` (the lamp is already coming), and keep the handle of the delayed call and `.remove()` it on the `reset` event.

### S2. The first lamp is at 600 m, but the first fatal thing is at 540 (tracks.js:15, 20-21)

The cart at 540 (lane 2) spins you at any speed above 8 m/s, and the only lamp is 600. A spin before 600 sends Jo back to the grid at d = 0 with 12 m/s. Flat-out Jo reaches 540 m in about 18 s, so one miss costs roughly 20 s on top of the 3 s, against the 3 s in the design. It is avoidable and well signposted (see reaction budget), so it is not unfair, but it will make the first lap feel like a cliff for a learner, and the gate is first place against a rival who finishes in 44 s. Fix: move the lamp to about 300 (before the straw bend, after the grid), or add a second one. The wall bend is already covered by 600.

### S3. Hit-stop eats lane and sling presses (RaceScene.js:183-185)

`input` is built every frame from `justDown`, but while `holdMs > 0` the frame skips `race.advance`, so any lane or sling edge in those frames is dropped (justDown is true for one poll only). The comment says "the keys wait", the code does not. Hit-stops are 40 ms (rub), 80 ms (hit) and 90 ms (spin). A rub is exactly when you want to dodge. At 60 Hz that is 3-6 frames of dead input right after a bump.
Fix: during hit-stop call `this.race.advance(input, 0)` (it queues the edges in `advance`, line 147-149, and runs no step because the accumulator is under one step).

### S4. The rival is a time trial, not a race (tracks.js:26; race.js:234-251)

Rival alone is 44.0 s. A no-brake Jo finishes in 39.1 s, so after the first straight Jo is 150+ m clear and the rival never matters again. No rubber band, no cheating: it brakes on the same numbers as Jo (at 0.97 x safe), takes the same bends, dodges with the same 0.45 s glide. It never blocks. It does one dodge that can rub you: the bale at 760 sends it from lane 1 to lane 2 starting about 55 m before (`c.v * 1.6`, race.js:245). If Jo is alongside in lane 2 right then it rubs (both lose 10%). Not a wall-out, and I could not make it trap Jo. But the design's drafting and slingshot never come into play for a competent player: sling is worth about 0.3 s (below). Once M1 is fixed the rival's 44.0 s becomes a real pace (careful driving 43.0 s beats it by 1 s, which is thin). If you want drafting to matter, rival top 0.96 -> 0.98 and `d: 9` -> `d: 30` so Jo has a straight in its air before the first bend. Keep it out of this milestone if the owner just wants the feel check.

### S5. Gamepad: the stick does lane and throttle at once (InputMap.js:36-45; RaceScene.js:71)

`right` is `ax0+` and `up` is `ax1-` with a 0.45 deadzone, no triggers. Holding the stick fully right and drifting 27 degrees up gives a lane press with the throttle held. On a pad, thumb on the stick for throttle will flick lanes by accident. Fix in `create`: `this.inputs.bind('right','gamepad',['b7','b15'])`, `bind('left','gamepad',['b6','b14'])` (triggers, d-pad), and `bind('up'/'down','gamepad',['b12'/'b13'])` so the stick Y is not a lane. The map handles `b6/b7` by value already.

## NICE

- **N1. `saidGo` is never reset (RaceScene.js:195-198).** `scene.restart` reuses the object, so the "Don't lift." call is only said on the first race of a session. Set `this.saidGo = false` in `create`.
- **N2. Pause is a free tries counter (RaceScene.js:442-449).** `Restart this race` at the grid counts as a try, so three Esc-restart cycles turn on the soft aid in seconds. Harmless once M1 is fixed (the aid is a bend aid). Count a try only if `race.t > 3`.
- **N3. Bump leaves Jo pinned (race.js:348-353).** At 8 m/s or less into a cart: `v = 0` and `d` is put 0.05 m short, the next step creeps in again. He escapes by changing lane (which works, no lock) but each cycle emits `bump`, a knock and a shake about every 0.1 s while you hold throttle. Latch `bump` for 0.5 s or let it hand back the same `ghost` as a reset.
- **N4. The bend call does not say which side to take.** "BEND 260 M: 86" is the speed. The line (lane 0 into the straw right, lane 2 into the wall left) is the real knowledge, learned from the chevrons, which are drawn on the inner verge. Add "KEEP NEAR/FAR" or an arrow to the call. (If M1 is fixed this matters more.)
- **N5. Gamepad "fair" lane press mid-rub** (race.js:436): when the lane door is shut by a rub `c.lane = c.fromLane`, which after a double-tap mid-glide is the intermediate lane, not the original. Rare. Store the lane at the start of the first press only.
- **N6. Wheel angle and body "buzz" use the raw step value (RaceScene.js:342, 348).** `c.d`, not `jd`. At 60 Hz it moves in two steps per frame, at 144 Hz in none or one. The buzz is a +/-1 px noise by design, the wheels are a blur above 7.5 m/s, so I expect nobody sees it, but if the car looks like it shimmers at 144 Hz, interpolate here.

## Reaction budget (arithmetic)

Constants: lane glide 0.45 s per lane; obstacle test is `|y - lane| <= 0.55` and `c.d + 1.9 >= o.d` (race.js:339-341).

- Time to clear: 0.55 lanes x 0.45 s = **0.248 s**, or **8.9 m** at 36 m/s.
- Plus 1.9 m (half a car) plus up to 0.3 m for the next 120 Hz step plus 0.6 m for a 60 Hz frame: the last press is about **11.7 m, or 0.32 s,** before the obstacle's start.
- What the screen shows: camera lead 250 px at top speed, zoom 0.9, 960 px wide. The right edge is at 1013 px, so the road ahead is (1013-250)/44 = **17.3 m, 0.48 s.** Human reaction (about 0.2 s) leaves 0.28 s, less than the 0.32 s needed. So with the picture alone a cart in your lane at top speed is not avoidable. The sight strip is what makes it fair: it shows the nearest hazard per lane from 160 m (4.4 s) and hides at 10 m (RaceHud.js `a.dist > 10`), which is about 0.28 s out, the same moment as the point of no return. That is a good match. Legibility of a 16 px chevron at the screen edge with a distance in 10 m steps is something only a drive can tell.
- Bends: braking from 36 to 24 m/s needs about 33 m (1.0 s), to 19 m/s about 45 m (1.6 s), against a call from 260 m (7.2 s). Plenty. Once M1 is fixed, the real braking point is about 60 m before bend 2 (1.7 s): fine.
- Unavoidable hazards: none. The four things are at 540 (lane 2), 700 (lane 0), 760 (lane 1), 1040 (lane 0); no two share a distance. Worst chain is the bales 60 m apart (1.7 s), and bales are soft anyway. The only tight combination is the slide pushing Jo toward the cart at 540 after bend 1, 110 m of road, 3 s.

## Fair fails and control

- **Stuck or spin-locked:** I could not make it happen. After a spin Jo comes back at the lamp, lane 1, 12 m/s, with a 1 s ghost; at 600 the next hazard is 100+ m away, and at 0 the first is the cart at 540. A wall spin cannot repeat because the bend is 250 m on.
- **Rubs:** only inside a lane and 3.8 m, and sideways passes at lane distance 1 do not touch (`|dy| < 0.6`). A rub is symmetrical (both lose 10%). The one asymmetry is the "door is shut" rule (race.js:436): if Jo moved into the rival's lane and gets rubbed, Jo is thrown back; the rival is not. That is by design.
- **Drafting forever:** can't be done. Draft gives +6% (38.2 m/s) against the rival's 34.6, so Jo closes at up to 3.6 m/s and drops out of the 5.7-15.2 m window in a few seconds. He has to lift to stay in it, and lifting is slower than passing.
- **Sling spam:** can't be done. Lockout is 6 s from the press (`slingCool = 2 + 4`), a re-arm needs another 1.2 s in a draft, and there is one rival. In a bot run a sling gained nothing measurable (43.06 s with, 42.90 s without, two rubs). Slinging in the same lane into a rival at closing speed above 6 m/s is a "hit": both lose 25%. Space as a context key behaves.
- **Launch:** window runs -0.1 s to +0.35 s, 0.45 s wide, worth about 0.4 s (38.7 s against 39.1 s). A press earlier than -0.1 s spends the launch for nothing (`jump_start`, race.js:197-200); no penalty beyond that. Easy to hit, so it will not be a skill. Fine for a first stage.

## Input and timing

- **Lane queueing:** lane presses are edge-latched in `advance` (race.js:147-149) and applied on the first step, so a press in a 0-step frame at 144 Hz is kept. A press mid-glide changes the target at once (`changeLane`, race.js:313), so double taps queue and reversals work. A press at lane 0 or 2 pointing out of the road is thrown away, not buffered. All good.
- **Touch vs keyboard:** touch fires the same keyboard events (TouchControls.js `sync`/`dispatchKey`) and short taps are kept by `RAW.taps`, so nothing the keys have is lost on touch. Pedal rolling is a finger moving between `controlsAt` regions and works through `sync`. Whether the GAS to BRAKE roll is reachable by thumb on a real phone is a hands-on test, as the report says.
- **Latency:** the poll is once per frame, steps are 120 Hz, the render is interpolated by `alpha()` (a one-step, 8.3 ms lag at most). Nothing to fix. At 60 Hz two steps per frame, at 144 Hz five frames in six have one step and one has none; `jd` and rival positions are interpolated, so no step stutter in the scrolling. A hitch is capped at 50 ms of race time twice (scene dt and `MAX_FRAME`), good.
- **Not checkable without a drive:** the camera runs a continuous zoom 1.0 to 0.9 and a rotation up to 1 degree (`setRotation`, RaceScene.js:295) over pixel art, with `Math.round` on world x. That can shimmer or crawl. It is only visible on a real screen.

## Exploits checked

- **Pause:** the race freezes (update returns early before `advance`), the engine is silenced, nothing leaks. Fine, except S1.
- **Restart from the lamp at the start:** tried at 0.3 s to 1.5 s into the run: 41.2, 41.2, 41.0, 40.2 and 39.2 s against 39.05 s without. No gain. Fine.
- **Result saving:** written at the line before the card, never lowers a better run (`applyResult`). Closing the tab on the card loses nothing.
- **Prize twice:** can't be double-paid in this code. The `paid` flag is saved in the same call as the coins and wallet (garage.js:49-54), and `prizeOwed` is `prize - paid` (result.js:36-39). Racing again for a slower first place, or first place again, adds nothing. I did not trace "Board from the start" (the report says it clears the run, so the 12 nuts come back); the commit title c825720 says it takes the old run's earnings back, which is what other dreams do.
- **Continue:** pays once; the first-frame check in garage.js:76-82 does it and the `checked` flag stops a repeat.
- **Door at the wrong moment:** `ctx.state.going` stops a double press (garage.js:19), the door is disabled while it fades, the chunk-failure path restores control. Fine. A pause menu opened in the garage while the fade finishes I did not trace.
- **Race scene restart:** `Race it again` goes through the camera fade and `scene.restart`; the `leaving` flag stops a double. Only N1 (`saidGo`) is left over. Soft aid can be switched on by pause-restart (N2).

## What is fine

The fixed step and its accumulator, the edge latching, the replay-safe `advance` (the tests pin that frame rate does not change the race), the hand-off flags, the one-shot prize, the sight strip timing, hazard layout, the rival's honesty (no rubber band, same braking numbers), and the draft/sling limits. The risk is balance, not code: fix M1 first because it decides whether the design's core idea exists at all.
