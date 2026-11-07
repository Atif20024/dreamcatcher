# Feel report

Spec: `docs/redesign/advice/fresh_review_feel.md`. Built without a browser or a Vite server: everything below is proved by pure tests (`tests/feel.test.js`) and by reading code, including Phaser 3.90's source. Nothing here has been played or heard.

Checks: vitest 22 files, 328 tests green (`tests/audioMix.test.js` untouched); lint:content, lint:rooms, lint:scale 0 failures; vite build clean.

## What changed

### 1. Refresh-rate independence (`src/entities/motion.js`, new; `Player.js`)

`perFrame(f, dt) = 1 - (1 - f)^(dt / 16.667)` scales run, air, ice and the ladder's column snap. At 60 Hz it returns the old factor exactly.

The jump cut is now one shot, but not the review's `vy *= 0.45`: a constant changes every release between tap and apex at 60 Hz. `cutSpeed(v)` instead computes the speed that reaches the apex the old decay reached from `v`. Tested at 60 Hz for releases every 17 ms up to 400 ms: within 1 px of the old controller.

Apex height in px, key released at that time (from a loop of the real constants):

| Release | Old 30 / 60 / 120 / 144 Hz | New 30 / 60 / 120 / 144 Hz |
| --- | --- | --- |
| next frame | 62 / 41 / 24 / 20 | 49 / 41 / 41 / 41 |
| 100 ms | 99 / 85 / 76 / 71 | 90 / 85 / 85 / 79 |
| 200 ms | 125 / 120 / 108 / 106 | 120 / 120 / 113 / 113 |
| held | 145 everywhere | 145 everywhere |

What remains is one physics step of when the release is seen. 30 Hz cannot see a release before two steps have risen, hence 49. The cut only fires on a frame that stepped, so a sub-step tap at 144 Hz still rises its first step.

Time to 90% of target speed, ms:

| Factor | Old 30 / 60 / 144 Hz | New 30 / 60 / 144 Hz |
| --- | --- | --- |
| run 0.5 | 133 / 67 / 28 | 67 / 67 / 56 |
| air 0.35 | 200 / 100 / 42 | 100 / 100 / 90 |
| ice 0.06 | 1267 / 633 / 264 | 633 / 633 / 625 |

Reach (`src/world/reach.js`) stays valid: full jump 145 px (above `rise` 4 tiles = 128), running jump distance within 6 px across rates and above `across` 4 tiles. `tests/reach.test.js` green.

The cut now belongs to Jo's own jumps only (ground, wall, ladder: `jumpRising`). The window shuts by itself once he slows past -160, so a landing, a ceiling or the apex all end it; knockback, the Chef vent and the Astronaut's ball clear it explicitly.

### 2. Camera (`src/world/CameraDirector.js`; `BaseLevel.js`, `HubScene.js`)

`easeFollow(cam, player, delta)` runs per frame in the Hub, Chef, Astronaut and Writer:
- The follow lerp is dt-scaled; 60 Hz is the old 0.1.
- The facing offset eases and flips on velocity above 40, else facing.
- The vertical deadzone is 60 px on the ground and 240 px in the air, so a jump inside it does not move the view, and landing eases back. It writes `cam.deadzone.height` directly because `setDeadzone` snaps the camera.

`CameraDirector` got the same: its lerps use `perFrame` (60 Hz unchanged), and a feet line that holds within 120 px while airborne. So in the dreams too, the view stays put on a normal jump.

Limit found in Phaser, not fixed: with `pixelArt` the camera floors `scrollX/Y` every frame, so a lerp step under 1 px moving right or down rounds to nothing. It stops short of the deadzone edge by up to 10 px at 60 Hz, 23 px at 144 Hz. It already did this at 10 px on every display; at 144 Hz the dt-correct lerp makes it 23 px, which needs a look on a real display.

### 3. Terminal velocity (`Player.js`, `motion.js`)

`TERMINAL_FALL = 660`, clamped downward only in `Player.update`. Not the review's `setMaxVelocity(…, 700)`: Arcade clamps that both ways, and it would cut the Chef vent's -760.

- Calculation: 660 + 3 steps of gravity (the most one frame can add under `fps.min 20`) = 720 px/s = 12 px per step, the depth of a plank or ladder cap.
- Fall tiers unchanged: a 5-tile drop lands at 620 px/s, under the cap, and the hard-landing drop test reads height. `fallSpeed > 900` (now unreachable) already needed a drop past 5 tiles even from a 420 fast-fall, so it never decided anything alone.
- A review correction: the tunneling it inferred does not actually occur at these speeds. Arcade's `GetOverlapY` allows overlap up to the step's own delta + 4, and Jo's body is 44-72 px tall, so he would have to move more than 56 px in a step (3360 px/s) to miss a 12 px plank. The cap is a guarantee, not a fix for an observed bug. It does lengthen falls above 181 px slightly, which only adds carry.

### 4. Landing weight (`Player.js`, `audio.js`)

`landImpact(drop)` is 0 at 12 px, 0.76 at a full jump, 0.82 at the hard-landing height, 1 from 204 px.
- Squash `1 ± (0.08 + 0.17f)` over `110 + 80f` ms; a full jump is the old 1.2 / 0.8.
- Dust `1 + round(6f²)`: a full jump is the old 4, a hard landing the old 7.
- New `land` sound (noise thump plus a low sine) scaled by `f`.
- A 60 ms 0.002 shake at `f >= 0.8`, which starts just past a full jump.
- `isLanding`: under 12 px of fall and under 150 ms of air is no landing at all (no dust, squash, sound or land animation). A seam or step-down plays nothing; touching a ledge at the top of a jump still counts.
- Takeoff: 2 puffs of dust on a ground jump.

### 5. SFX on the sfx bus (`audio.js`, `AudioBus.js`, `settingsItems.js`)

`tone` and `noise` go through the bus, at the level they had (`flatGain`). So everything using them moved, including chimes, trumpet and coins.
- Slider: a new "Effects volume" item. `VOLUME_KEYS` stays `['music','ambience']` because audioMix asserts it; the settings list adds `sfx` itself.
- Reverb: the bus sends into the room's reverb, skipping its low-pass. The bus was dry before, footsteps included, contrary to the review.
- Ducking: -3 dB under dialogue.
- Not ducked under stingers: a chime is itself on this bus and would duck itself.
- Pitch: +/-4% on jump, pickup, swing, land. `step` left alone.

The music mix is untouched.

### 6. Reduced shake (`CameraDirector.js`, `main.js`, `settingsItems.js`, `SaveStore.js`)

The review was right that nothing read it; in fact the setting did not exist. Now there is `settings.reducedShake`, a menu toggle, and `CameraDirector.shake` reads it (0.4 or 1). Every direct `cam.shake` call (16 sites, plus the new landing kick) gets it from one patch of `Camera.prototype.shake` in `main.js`, rather than editing a dozen scenes, so future calls obey it too. Shake durations are unchanged.

### 7. Cheap ones

- **Hit-stop** (`effects.js`): also sets tween `timeScale` 0.05 and freezes Jo's animation (`_hitStopping`), and releases on scene shutdown (the flag used to stick across a restart mid-stop). Tiers and "extend, don't ignore" not done.
- **InputMap**: keeps a press that ends between two polls. Shortcut, noted in the code: one polling map per page, which is true today (DreamScene).
- **PerfMonitor**: `update()` is dev-only. `sample()` still answers the scenarios.
- **Rim and outline**: not synced while `JO_ANCHOR` has them off. The objects still exist (hidden), because `JoLocator` and `identityProbe` read them.
- **`fps: { min: 20 }`**: the reasoning holds. Phaser's `smoothDelta` caps a frame's delta at `1000/min`, so a hitch costs 3 physics steps instead of 12. Side effect: below a sustained 20 fps the world slows down rather than leaping, while coyote and buffer stay on real time, so they tighten a little there.

## Changes at 60 Hz you may notice

You asked for these, or they follow from them:
- **Key not held, uncut now.** Stomp bounce 17 -> 30 px; Chef stomp 21 -> 48; Chef vent 54 -> 234; knockback off the ball 15 -> 26; the Astronaut's pool vault 35 -> 117. With the key held they were always the higher value, so no route becomes newly possible; but a vent used to need Jump held, and now anyone rises 234 px. Look for ceilings and skipped beats.
- A release, re-press, release during one rise used to pause the decay; now the first release is the cut.
- Tiny hops under 12 px and 150 ms no longer play a land animation.

## Left for the owner's call (would change how every jump feels)

- **Extra fall gravity** (review FIX 7): snappier, but changes landing time and horizontal range at every jump. Not done.
- **Apex hang.** Not done.
- **Corner correction** (FIX 7): a jump clipping a ledge by 1-3 px still stops dead. Not done.

## Not done, smaller

- FIX 3, render interpolation and reading `body.center` in the camera: untouched, judder at 120/144 Hz is unmeasured.
- FIX 5, hit-stop tiers. FIX 6's tiered shake helper (the setting works without it).
- FIX 10, pooled particles: the review said measure first.
- `EveningScene` keeps Phaser's per-frame lerp and its own offset (another builder is in there). Its Jo does get the controller changes.
- Per-frame lerps outside Player: the Astronaut's swim (`AstronautScene.js:1558, 1564`).

## Rerun in a browser

Muted, as ever. Priority order:
1. `jo-jump-arc`, `jo-land-soft-hard`, `jo-walk`, `jo-skid`, `jo-foot-slide` (`phase2.js`): the controller and landing changes.
2. `hub-ladder-undercroft`, `hub-ladder-roof`, `dream-ladders-both-ways`, `writer-ladders-both-ways`: jump-off arming, terminal on caps, the ladder snap.
3. `hit-knockback`, `zero-hearts-checkpoint` (`failure.js`): hit-stop with tweens, knockback uncut.
4. `volume-sliders`, `restart-death-card`, `restart-evening` (`feedback3.js`): `volume-sliders` for the new items; the menu is now six rows, check it fits in title and pause.
5. `astroPool.js`, `evaTether.js`: the vault uncut, the moon's cut at gravity 500.
6. `readability.js`, `round2.js`, `transitions.js`, `backgroundSnap.js`: anything framing-sensitive, since the air band changes where the camera sits mid-jump.
7. The perf scenarios (`clockmaker-perf`, and in `musician.js`, `gambler.js`, `painter.js`): `sample()` still works in dev; confirm.
8. The whole-dream playthroughs (`phase3.js`, `proofTrain.js`) as the pre-merge set.

By hand:
- A Chef vent with no key held; a stomp chain.
- 144 Hz and 30 Hz (throttled) for hop height and the camera's stop-short.
- In a production build, once, with headphones: land, jump variation, chapel reverb on steps and SFX, -3 dB under dialogue.
