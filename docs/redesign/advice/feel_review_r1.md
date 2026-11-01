# Feel review, round 1 (senior designer + pro gamer)

Read: fresh_review_feel.md, FEEL_REPORT.md, motion.js, feel.test.js, the merge diff (Player, BaseLevel, CameraDirector, audio) plus effects.js, main.js, AudioBus.js, ChefScene, AstronautScene, Phaser 3.90 World.js / Camera.js / TimeStep.js. Not played, nothing run.

## Verdict: CONVERGED. No MUST. Three SHOULDs, a few NICEs.

## The maths and logic, checked

**60 Hz unchanged.** True for run, air, ice and the ladder snap: `perFrame(f, 16.667)` returns f exactly. The jump cut is not literally the old code. It is a one-shot that `cutSpeed` fits to the old per-frame decay, tested to within 1 px for releases every 17 ms (feel.test.js:96). I accept "same hop" rather than "same code". Two real 60 Hz changes, both intended: a release-press-release no longer pauses the cut, and a hop under 12 px and 150 ms plays no landing.

**30 / 144 Hz match.** The table in the report is right in structure. The leftover error is one physics step of release detection. `stepsLastFrame` is read in `Player.update` (scene update) and reset in `World.postUpdate` (later), so it is the current frame's value. While hit-stop has the world paused it stays 0, so a cut cannot fire mid-freeze. 144 Hz at 100 ms is 79 against 85 and at 200 ms 113 against 120. That is 6 to 7 px, under a quarter tile, and not noticeable. Good.

**49 px tap at 30 Hz.** Acceptable. It is 8 px above the 60 Hz tap (41), and 30 fps is the rare device. 49 is still under 2 tiles. The only way it hurts is a gap built between 41 and 49 px of headroom, which nobody builds. No change.

**Behaviours that changed with the key not held** (stomp 30, Chef stomp 48, vent 234, pool vault 117). With the key held these were always the numbers, so reach does not grow. What changes is the unheld player. Per case:
- Chef vent: `the_line` row 31 is a shelf over local columns 2 to 26, which are vent columns 149, 152 and 155. Clearance is two tiles (floor row 34). An unheld Jo used to rise 54 px; now he hits the ceiling at once. The vent re-fires every frame for 500 ms while his feet are inside the 30 px window, so he may pin against the ceiling. Held jump already did this, so it is not new, but it was rarer. Vents 177 and 179 (columns 45, 47) are open for 7 tiles and column 47 has `##` on row 30 (3 tiles up), which is a ceiling bonk.
- Pool vault: it fires on a fresh press, so the old tap cut it to 35 px. It is now always 117. Check there is no ceiling or ledge within 4 tiles of the pool lip that makes it skip the deck beat. I did not read the Astronaut map.
- Stomp bounce 30 px is lower than a tap hop (41). That reads fine ("a small hop off the foe") and chaining stomps needs the key, as before.

**`fps: { min: 20 }`.** Correct in Phaser: `smoothDelta` caps a frame's delta at 50 ms, so Arcade runs 3 steps at most. Below 20 fps the world slows, and coyote (100 ms) and the jump buffer (120 ms) are real-time, so they gain slack relative to game time on a bad phone. This is kind to the player. One side effect: `easeFollow` and `Player.update` get the smoothed delta, so the camera slows with the world. That is consistent.

**Camera floor at 144 Hz.** The cause is `startFollow(target, true, ...)` (BaseLevel.js:140, HubScene.js:1024), not `pixelArt`. Camera.js:557 floors `sx/sy` and feeds the floored value back, so a lerp step under 1 px stalls. The stall is 1/lerp: 10 px at 60 Hz, 23 px at 144 Hz. It stalls only rightward and downward, since floor pulls left and up toward the target. So the camera sits 23 px further behind Jo when he runs right than when he runs left, and ends 23 px short when he stops. Mostly hidden by the 48 px look-ahead, but it is a left/right asymmetry a pro would feel on a 144 Hz display. See SHOULD 3.

**Hit-stop.** Tweens at 0.05 and Jo's anim frozen: correct and cheap. `scene.time.delayedCall` runs on real time, so release works. Nothing else in src sets `tweens.timeScale`, so the hard reset to 1 is safe. Gap: a second stop is ignored, so a Foe shove (Foe.js:114) followed within 60 ms by a hurt (BaseLevel.js:528) loses the harder freeze. NICE.

**`Camera.prototype.shake` patch** (main.js:68). Fine. Phaser's default intensity is 0.05, matching `?? 0.05`. No call passes a Vector2 (all numeric), so the multiply never gives NaN. `force` and `callback` pass through. It is a global monkey-patch, but it is one line, it is documented, and it covers future calls. Keep it. The landing kick also goes through it, so Reduced shake covers it.

**Ducking and the effects bus.** Sound routing is right: SFX go bus, then ducker, then out and reverb send, skipping the low-pass. -3 dB under dialogue is mild. Two notes: dialogue blips or typewriter ticks, if they use `sfx()`, are now ducked too (check), and chimes are not ducked under stingers by design.

**Landing weight on the moon.** `landImpact(drop)` assumes gravity 1200 (Player.js:~695). The Astronaut sets net gravity 500 (AstronautScene.js:1829) and a jump rises 360 px. The formula then gives f = 1 for every moon jump (thump, 7 dust, 60 ms camera kick on each landing). The real impact speed is 600 px/s, which is f = 0.78 with the true gravity, under the 0.8 shake line. SHOULD 1.

## MUST

None.

## SHOULD

1. Player.js:~695, `const f = landImpact(drop);` becomes `landImpact(drop, this.scene.physics.world.gravity.y + body.gravity.y)`. Moon landings stop shaking the camera every jump. Guard `g <= 0` (zero-g) so it returns 0.
2. HubScene.js:~1024, add `cam.setDeadzone(80, 60);` after `startFollow`. The Hub has no deadzone, so `easeFollow`'s air band (CameraDirector.js:43) silently does nothing there and the Hub view still bobs on every jump or ladder hop. The report says the Hub got the band; it did not. Lowest-risk fix is the same call BaseLevel makes at line 141.
3. BaseLevel.js:140 and HubScene.js:1024, try `startFollow(target, false, ...)` and look at the pixel crawl at 144 Hz. If the crawl is worse than the 23 px stall, keep `true` and instead snap in `easeFollow` when `|target - scroll| < 24` and Jo's x-speed is under 40. Decide on a real display. Do not ship both.

## NICE

- effects.js:37, `if (scene._hitStopping) return;` becomes extend: keep the later of the two end times. Hurt after shove then freezes fully.
- Player.js:786, motion.js `cutSpeed`: if `gravity <= 0` return the input speed. In zero-g the sqrt gives 0 and would kill the rise.
- ChefScene.js:938, add a short per-vent cooldown (`v.firedAt`) so a Jo pinned under the row-31 shelf is not re-launched every frame.
- Verify the 3 Chef vents under the row-31 shelf are meant to be vents (they bonk even for a held jump). Maybe move or raise the shelf. A level call, not a feel bug.
- Check dialogue typewriter blips are on a bus that is not the ducked sfx bus.

## The owner's open call, in plain words

**Extra fall gravity: skip it for now.**
- What it does: Jo falls faster than he rises (say 1.6x), so jumps feel snappier and less floaty. Landing comes about 0.1 s sooner and a running jump covers about 11% less ground.
- Why not here: this is a dreamy, deliberate game, not a twitchy one. The 4-tile rise and the reach model stay the same, but every drop-down jump shortens, and the whole fall-weight scale moves. `landImpact` (assumes 1200), `TERMINAL_FALL` (660 is reached after 113 px instead of 181) and the "5-tile hard landing at 620 px/s" test all assume the current arc. With 1.6x, a 5-tile drop would hit about 790 px/s, get clamped to 660, and every long fall would land with the same weight.
- Hard conflict: the Astronaut sets `body.gravity.y` itself (AstronautScene.js:1829, -700 for the moon, 0 for zero-g). A per-frame fall-gravity write in Player would overwrite it unless it adds on top of the scene's value.
- If playtesters say "floaty", do 1.3x on the way down only, as an add-on over the base gravity, then re-run the reach and ground tests and change `landImpact` to take net gravity.

**Apex hang: skip.** Jo already hangs: about 0.12 s under 70 px/s at the top, and a 1 s round trip. More hang makes him floatier and widens every gap by a few pixels, and the game has no precision-timing platforming where it would earn its keep. Low risk, low value.

**Corner correction: worth it, do it.**
- What players feel: nothing, which is the point. A jump that clips the underside of a ledge by 1 to 4 px slides past instead of stopping dead; a toe that just misses a ledge top gets lifted onto it. Both are the classic "I was sure I made that" complaints, and the game has two-tile corridors, ladder caps and 12 px planks where it happens.
- How: airborne only, `blocked.up` with the previous frame's rising speed over about 100 px/s, not climbing, not on a slope, not floating. Try x offsets of +/-1 to 4 px, keep the first where the body fits and restore the rising speed. Keep the nudge at 4 px or less. Read the previous frame's vy yourself, since Arcade has already zeroed it by `Player.update`.
- What it could break: a nudge only works where the body already fits, so no new route opens. The risk is nudging Jo sideways into a hazard (a spike or a flame beside a ceiling corner); do not nudge toward a hazard tile. It also stacks with the vent (a Jo pinned under the shelf would slide sideways), so land the vent cooldown first. It does not interact with `jumpRising` (a ceiling hit zeroes the speed, which already shuts the window).
- Test with a pure test like feel.test.js: a ceiling corner at 1, 4 and 6 px.

## Not checked

Nothing was played or heard. I did not read the Astronaut pool map or any dream's ceilings other than Chef's `the_line`. Row-to-pixel mapping for the vents assumes `px(n) = n * 32`. 144 Hz judder (no render interpolation) is still unmeasured, as the report says.
