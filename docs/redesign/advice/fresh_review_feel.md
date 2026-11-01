# Fresh review: how it feels in the hands

Lens: game feel, physics stepping, camera, input, audio, performance hotspots.
Reviewer had never seen the game and did not play it. Everything below is read from code unless marked MEASURED (a small node simulation of the Player's own constants, not the game). Skills applied: game-feel, physics-tuning, camera-systems, input-systems, audio-design, performance-optimization, phaser-arcade-physics (written for Phaser 4; this repo is 3.90, differences noted), platformer.

## Verdict: major revamp from this lens? NO

The structure is sound: Arcade with merged static bodies and baked room chunks, an action-based InputMap, a pure AnimationController, a bus graph with a limiter, a CameraDirector as data. The feel problems are a handful of per-render-frame constants in a game whose physics is fixed-step (so behaviour changes with refresh rate), a missing landing/impact layer, and two camera models. Each is a local fix. One of them (run the controller on the physics tick) is the nearest thing to structural, but dt-scaling the constants gets 90% of it, so it stays in FIX.

Top five, in order of payoff:
1. The jump's variable-height cut and every horizontal lerp are per render frame, so jump height, ice and run response differ by display (FIX 1).
2. The legacy camera (Hub, Chef, Astronaut, Evening, Writer) uses Phaser's per-frame follow lerp: 367 ms to settle at 60 Hz, 153 ms at 144 Hz, 733 ms at 30 Hz (FIX 2).
3. Landings and jumps have no feedback proportional to impact, and no landing sound at all (FIX 4).
4. SFX bypass the sfx bus and every volume slider and reverb (FIX 8).
5. Dust, slash arcs and death bursts are `add.circle`/`add.rectangle` + tween objects, which break sprite batching (FIX 10, suspected).

---

## FIX (specific, buildable)

### 1. Frame-rate dependent controller constants (MEASURED)
Rule: physics-tuning "applying movement in the render frame makes behaviour frame-rate dependent"; platformer "jump height differs between machines".

Cause: `Player.update` runs once per render frame (scene update), while Arcade integrates on a fixed 60 Hz step (default `fixedStep`). Constants applied per call therefore scale with refresh rate.

- `src/entities/Player.js:762-764`: `if (!jumpDown && vy < -160) vy *= 0.82` per call. MEASURED with the real constants (600 launch, 1200 gravity, tap released on the next frame): a tap hop reaches 62 px at 30 Hz, 41 px at 60, 24 px at 120, 20 px at 144. The full jump is 145 px everywhere. So on a 144 Hz monitor a tap is a 0.6 tile hop and on a 30 fps phone it is 1.9 tiles. Dreams with 1-tile steps or 2-tile ceilings behave differently per device.
- `Player.js:708` run: `Linear(vx, target, 0.5 * airFactor)` per call. Time to 90%: 133 ms at 30 Hz, 67 at 60, 28 at 144.
- `Player.js:705` slippery floor: factor 0.06 per call. Time to 90%: 1267 ms at 30 Hz, 633 at 60, 264 at 144. Ice is five times slipperier on a phone than on a monitor.
- Related, `Player.js:766` fast-fall is an instant `vy = max(vy, 420)`; fine, but it also fires on any frame Down is held in the air, including when passing a ladder or hatch.

Fix: scale by dt once, in `update`. `const k = 1 - Math.pow(1 - 0.5, delta / 16.667)` for the run (and same form for 0.06 and the air factor). For the cut, make it a one-shot rather than a continuous multiply: on the first frame the key is up while `vy < -160` and `this.jumpCut` is not yet set, do `vy *= 0.45` once and set the flag; clear the flag on landing. That also makes the minimum hop identical at every refresh rate (about 45-55 px, choose it by outcome: 1.5 tiles). Cap `delta` at 50 as DreamScene already does for `dt` (it passes raw `delta` to `player.update`, line 874).

The cut also applies to any upward velocity that did not come from a jump press: the stomp bounce `src/play/dreamAdapters.js:87` (-280), the launcher `src/scenes/ChefScene.js:942` (-760), knockback `BaseLevel.js:553`. If the key is not held they are shortened. Suspected; verify each. Fix: only cut while `this.jumping` (set when Player starts a jump, cleared on landing, wall jump, or any external `setVelocity`).

### 2. Two camera models, one of them frame-rate dependent
Rule: camera-systems "lerp(pos, target, const) per frame is frame-rate dependent".

- `DreamScene` uses `CameraDirector` (`src/world/CameraDirector.js:98-103`): `k = min(1, dt/110)` with dt capped at 50 (`DreamScene.js:817`). That is acceptable (first-order Euler, a few percent off the exponential at 30 fps).
- Hub, Chef, Astronaut, Writer use `cam.startFollow(player, true, 0.1, 0.1)` (`BaseLevel.js:142`, `HubScene.js:1023`), Evening 0.08/0.04 (`EveningScene.js:267, 2597`). Phaser's lerp is per render frame. MEASURED: 90% settle is 733 ms at 30 Hz, 367 ms at 60, 153 ms at 144. Also `followOffset.x = flipX ? 48 : -48` (`BaseLevel.js:1112`, `HubScene.js:1404`) flips on facing, not on velocity, and relies on that lerp to hide the jump of 96 px; at 144 Hz it reads as a snap.

Fix (small): each frame in those scenes call `cam.setLerp(l, l)` with `l = 1 - Math.exp(-delta / 110)`, and drive `followOffset.x` toward the target with the same smoothing (use velocity > 40 for direction like the Director does). Fix (better, and removes one of two camera systems): drive the Hub with `CameraDirector` too, giving it a one-room graph. Do the small one first.

### 3. Stale camera input and no render interpolation at 120/144 Hz (inferred, measure)
Rule: physics-tuning "visible jitter with a fixed step usually means no render interpolation"; camera-systems "follow after the target has moved".

Phaser order per frame: Arcade `world.update` (integrate, collide) on scene UPDATE, then `scene.update`, then `postupdate` copies body to sprite. Consequences:
- `CameraDirector.update` runs inside `scene.update` and reads `p.x/p.y` (sprite), which are last step's values (`CameraDirector.js:80-87`). Jo's art is synced at `postupdate` (`Player.js:180-181`), so camera and art are one step apart.
- On a 120/144 Hz display Arcade steps only every 2nd-3rd frame, so Jo's position holds for two frames then jumps, while the camera lerps every frame. The camera/Jo offset oscillates each step. Suspected as visible micro-judder when running; not measured.

Fix: in `CameraDirector.update` read `p.body.center` (fresh) instead of the sprite, and for the art, extrapolate the draw position by `body.velocity * (world._elapsed / 1000)` in `syncAttachments` (Arcade has no built-in interpolation; `world._elapsed` is the unspent accumulator). Alternative: `arcade: { fps: 120 }` and halve gravity-derived constants; more cost and re-tuning. Measure by running at 144 Hz and watching Jo's screen x while running at constant speed: it should be perfectly steady.

### 4. Landing, jumping and hitting have no impact scaling; landing is silent
Rule: game-feel "scale juice to importance"; layered feedback of 5-8 channels.

- `Player.js:679-691`: every landing triggers `landSquash()` 1.2/0.8 for 140 ms and 4 dust circles regardless of fall height; `hard` only changes the animation and dust count to 7. A 4 px step-down and a 5-tile drop look the same. No landing sound exists (`src/systems/audio.js` `SFX` has no land/thud; only `step`, from the anim event). No camera kick on a hard landing.
- Spurious landings: `wasAirborne` is set on any frame not grounded (`Player.js:694`). One airborne frame (a seam between bodies, a step-down) plays dust + squash. Suspected; add a minimum air time of ~80 ms or fall of 12 px.
- Jump has no takeoff cue other than the animation inserted (`jump_anticipate` is cosmetic, good) and a fixed `sfx('jump')`.

Fix: `const f = clamp((fallSpeed - 250) / 650, 0, 1)`; squash `1 + 0.08 + 0.17f` x, `1 - 0.08 - 0.17f` y over `110 + 80f` ms; dust count `2 + round(5f)`; a landing sound with the same `f` (a short low-passed noise thump on the sfx bus, plus the surface's own step); for `f > 0.8` a 60 ms 0.002 camera shake. Takeoff: a 2-puff dust and the jump sound with +/-4% pitch. Skip all of it under 12 px of fall.

### 5. Hit-stop only stops physics
`src/systems/effects.js:35-43`: `physics.world.pause()` for 60 ms. Tweens, the AnimationController, foes' own `update`, and Jo's `update` keep running, so the frame does not freeze as a whole: the hurt pose and squash advance while bodies are still. The impact reads as a hitch instead of a freeze, and Jo's horizontal lerp keeps writing velocity during it. It is also called from `Foe.shove` (`Foe.js:114`) with the same 60 ms for a tiny shove and a hurt hit.

Fix: tier it: shove 40 ms, hurt 70 ms, heavy 110 ms. During hit-stop also skip `player.anim` advance and set `scene.tweens.timeScale = 0.05` (restore with the same id-guard so overlapping stops do not cut each other short; the code already has `_hitStopping`, but it ignores a second stop rather than extending). Keep the camera shake running (it should, it is separate).

### 6. Screen shake: no intensity tiers, accessibility hook unused
`BaseLevel.js:307, 531` and ~12 other sites call `cameras.main.shake(ms, intensity)` with fixed values. `CameraDirector.shake = 1` ("settings: reduced shake → 0.4", `CameraDirector.js:32`) is never read: grep finds no consumer, so the setting does nothing. game-feel pitfall: "add a reduce screen shake option".

Fix: one `shake(scene, tier)` helper (small 0.002/80 ms, medium 0.005/160, large 0.008/240 matching today's hurt) that multiplies by the settings value, and replace the direct calls.

### 7. Variable-height jump has no corner correction or apex handling
Rule: platformer table (corner correction up to ~4 px, apex hang, fall gravity 1.5-2x).

- Gravity is symmetric 1200 (`src/main.js:45`), jump 600: apex at 0.5 s, 150 px (4.7 tiles), 1.0 s airtime. The skill's feel table puts apex at 0.30-0.40 s with a heavier fall. It is floaty, though forgivable for a dreamy game. Per-body extra gravity on the way down keeps the apex height and therefore the reach model (`src/world/reach.js`, rise 4, tests) intact: `body.gravity.y = vy > 0 ? 720 : 0` set each frame (fall gravity 1920, fall time 0.39 s vs 0.5 s; horizontal range at 280 px/s drops 11%, well inside the reach model's generous across = 4). Optional apex hang: `gravity *= 0.6` while `|vy| < 70` and jump held. Needs a play pass in each dream; run `tests/reach.test.js`.
- No corner correction (grep: none in Player.js). A jump that clips a ceiling or ledge corner by 1-3 px stops dead. Add: on `body.blocked.up` with `vy < 0`, try shifting x by +/-1..6 px and keep the jump if the body fits.
- Uncapped fall speed (`setMaxVelocity` is not set for Jo): 877 px/s after a 10-tile drop is 14.6 px per step. See FIX 9.

### 8. SFX bypass the bus graph (audio-design: "route everything")
`src/systems/audio.js:150-160` `tone()` and `noise()` call `voice(c, master, ...)`: the one-shot SFX (`jump`, `hurt`, `pickup`, `swing`, `step`...) go straight to the master chain. `AudioBus`'s `sfx` bus, with its trim and the limiter order, is only used by `busTone`/`busNoise` (Footsteps, music). Consequences:
- There is no SFX volume slider (`VOLUME_KEYS = ['music','ambience']`, `AudioBus.js:21`) and the legacy SFX are not under any bus level; the `flatGain` workaround exists because of this.
- SFX get no room acoustics (reverb/low-pass) while footsteps and music do, so a jump in a chapel is dry while the steps echo.
- SFX are not ducked under dialogue or stingers.
- Identical every time: `jump` is a fixed 300->420 square (`audio.js:176`); no pitch or volume variation anywhere in `SFX` (only ambience events use `Math.random`). That is the "machine gun" pitfall: jump, swing, pickup, hurt repeat exactly.

Fix: `tone`/`noise` take an optional bus, default `'sfx'`: `voice(c, buses.bus('sfx') || master, ...)`, apply `flatGain('sfx')` if loudness shifts; add an `sfx` entry to `VOLUME_KEYS`; add `rate = 1 + (rand-0.5)*0.08` and `vol *= 0.9 + rand*0.2` to the frequently repeated ones (`jump`, `step`, `pickup`, `swing`, `click`). The calibration test (tests/audioMix.test.js) will need re-baselining.

### 9. Tunneling through thin one-way bodies at fall speed (inferred, verify)
Ladder caps and one-way planks are 12 px tall static zones (`src/world/ladders.js:25`, `src/world/Terrain.js:344`). Arcade has no swept collision. With gravity 1200 and no terminal velocity, Jo moves 12 px per step at 720 px/s, which is a drop of about 216 px (6.75 tiles); a longer fall can step over a 12 px plank. `BaseLevel`'s "hard landing" check `fallSpeed > 900` shows he does reach those speeds.

Fix: `body.setMaxVelocity(SPEED_CAP, 700)` on Jo (skills: cap speed, thicken walls). Keep "hard landing" on `drop > 5T` (already in the condition), or compare to 700. Or make planks 16 px tall (also helps foes). Test: drop from 12 tiles onto a plank and a ladder cap, 100 times.

### 10. Particle-like effects built as Shape objects (suspected cost)
Rule: performance-optimization "pooling" and "reduce draw calls"; Phaser: Shape/Arc/Rectangle objects render through the graphics path and break sprite batches.

- `Player.dust` (`Player.js:390-407`) creates `n` `add.circle` + a tween per call; footstep events call it each stride above 200 px/s (`Player.js:372`), landings 4-7, wall jump 3.
- `swingLadle` creates a rectangle + tween per swing (line 416); `dreamDust` creates 16-22 rectangles + tweens per burst (`src/systems/effects.js:12-31`); `Foe` shove tweens.
- Churn: ~3 objects/s while running, 22 on each death, all destroyed on completion. GC and batch breaks, not a leak.

Fix: a 4x4 white texture and one pooled `ParticleEmitter` per scene (`emitter.explode(n, x, y)`), with config per effect (dust: up, slow, 350 ms, alpha 0.6->0). Measure first: Chrome performance panel on a mid-range Android, running along a long room, look at draw calls (`PerfMonitor` already estimates them) and frame time spikes in GC.

### 11. Input: quick taps can be missed by the InputMap poll
Rule: input-systems "capture discrete presses so none are missed between frames".

`src/input/InputMap.js:112-125` and `install` (line 139): key state is a `Set` of held `e.code`, sampled once per render frame in `poll()`. A keydown+keyup between two frames (a 12 ms tap on a keyboard, or any synthetic key from touch buttons, `virtualKeys.js`) never appears in `justDown`. At 30 fps a frame is 33 ms. `Player` mixes this with Phaser's own `JustDown`, which is event-latched and does not drop taps, so jump behaves differently from `X`/`E` confirm paths.

Fix: in the `keydown` listener also add to `RAW.pressed`; in `update`, `now = held || pressedSinceLastPoll`, then clear `pressed`. Same for gamepad via `pad.buttons[].pressed` (polled only, acceptable). Also gamepad sticks are treated as digital with a 0.45 threshold (`InputMap.js:48, 85`), so a walk speed cannot be analog; fine for this game, NICE below.

### 12. Per-frame monitor and invisible layers (suspected, small)
- `PerfMonitor.update` (`DreamScene.js:844`, `src/core/PerfBudget.js:63-66`) every 30 frames copies and sorts the whole display list (`[...list].sort(...)`) plus the UI list. It runs in production. A few hundred microseconds to a millisecond with thousands of objects; a periodic hitch. Gate it behind `import.meta.env.DEV` or a `?perf=1` flag.
- Jo has 4 outline images and a rim image created and synced every frame even though `JO_ANCHOR.outline/rim` are false (`Player.js:38, 144-155, 265-302`): five objects, five `setTexture/setPosition/setScale...` chains per frame, invisible. Skip creating them when the flags are off.
- `Player.update` rebuilds closures (`onLadderTile`, `rungAt`, `lidAt`, `plankAt`, `climbableSide`, `tread`) every frame (`Player.js:541-567, 716-723`). Small allocations at 60-144 Hz; hoist to methods. Not worth it until the profile says so.

### 13. Catch-up steps after a hitch (suspected)
No `fps` block in the game config and no cap on Arcade steps per frame (physics-tuning "clamp the max physics step"). Phaser's own delta cap is `fps.min` = 5, i.e. up to 200 ms, which is up to 12 physics steps in one frame; `Player.update` gets the raw delta (`DreamScene.js:874`). Room streaming builds the current room and all neighbours synchronously at the dark of a seam (`RoomStreamer.focus`, lines 117-122) while the dip holds for only 40-80 ms (`thresholds.js:21-25`) and Jo keeps walking (`TransitionDirector.walk`). If a build takes 200 ms on a phone, the next frame runs a burst of steps and Jo moves ~1.7 tiles in one render frame. Suspected; the data exists: `RoomStreamer.paintMs` is recorded per room.

Fix: `fps: { min: 20, target: 60 }` in the game config (delta cap 50 ms, 3 steps); log `paintMs` on a real phone; if any value is above 60 ms, pre-build the neighbour one layer per frame while Jo is within 15 tiles of the seam (`nearFrame()` already knows), so the dark is just the swap.

---

## NICE

- Camera vertical follow tracks Jo through every jump: y eases at 160 ms with no deadzone or ground-lock (`CameraDirector.js:98-103`), so the screen bobs 150 px per jump while the legacy camera has an 80x60 deadzone. Common platformer fix: follow y to the last grounded foot line, and only follow in air when Jo goes within ~25% of the view edge or is falling fast. Inferred; try it.
- Camera zoom changes per room and per shot with non-integer values (`cam.setZoom(zoom)` each frame, `CameraDirector.js:113`). Pixel art scaled by 1.07 or 1.25 shimmers when scrolling. With `Scale.FIT` on a 960x540 base the canvas itself is scaled by the window's ratio (1.42x at 1366 px wide) with nearest neighbour, so pixel widths are uneven except at exact multiples of 960. Option: keep zoom steps at 1, 1.5, 2 for stills, and offer an "integer scale" fit in settings. Inferred.
- `CameraDirector` position smoothing: use `1 - exp(-dt/tau)` instead of `min(1, dt/tau)` (a 5-8% difference at 30 fps).
- Stick input: add a radial deadzone and analog walk speed on gamepad (`InputMap.js`), the skill's pattern 2. Currently the axes are compared per-axis at 0.45.
- Shift is both walk and run depending on place (`walkByDefault`); label in the Hub is only a floating text after 700 ms of walking (`HubScene.js`). Fine; consider showing the control in the pause menu.
- Voice stealing: footsteps (`PRIO.sfx` 3) steal music pulses (`PRIO.music` 2) when the 8-noise cap is reached (`synth.js`). Raise noise cap to 12 or set music above footsteps for the hat.
- Music: the stem mixer (`MusicDirector.js`) crossfades by 0.5 per beat toward state targets and `catch()` hushes 250 ms: good adaptive design. Missing: a stinger for "hard landing" or "coin" quantised to the beat, and a duck for SFX (see FIX 8).
- Audio is silent in dev by design (`DEV_SILENT`, `audio.js:51`). The mix is checked offline in tests but nobody hears it before a production build. Keep a `?audio=1` flag for a mix pass.
- Dust, squash and hit flashes have no "reduced motion" gate.
- Texture memory: the character atlases are 8-16 MB each uncompressed (`people4-7` are 2048x2048, 16 MB; nine large atlases is about 100 MB of GPU memory if all load at once, `BootScene.create` registers all packs from the index). Phones with 2 GB RAM may struggle. Measure with `performance.memory`/GPU memory in Safari/Chrome on a low-end device; if high, load only the packs the dream's cast uses, and trim padding.
- StaticBaker canvas textures keep a CPU canvas and a GPU copy; for a 6-room dream with three layers per room, this doubles memory. Dropping the source canvases after upload (`canvas.width = 0`) is a cheap saving; confirm with the allocation timeline.
- The post-grade/vignette/grain overlays are three full-screen blended sprites per scene (`src/art/look.js`, `setupGrade`); the internal resolution is 960x540 so fill cost is low, but each blend-mode switch breaks the batch. Check draw calls on a phone.

---

## What already feels right (keep it)

- Coyote time 100 ms and jump buffer 120 ms in real time (`Player.js:39, 56, 752-760`), both consumed on use. In range with the skill (80-120, 100-150).
- Squash is cosmetic on a separate art sprite with the body untouched (`Player.js:93-97`), a good solution to a common Arcade trap.
- Ground solver (`ground.js`) with slopes and stairs, shifting both body and `prevFrame` so the sprite is moved once. Careful and explained.
- Hit-stop uses real timers and keeps the camera shake outside it; knockback applies after the freeze.
- Stride-locked animation and the AnimationController being pure, with events (footstep, skid) driving sound and dust.
- Camera look-ahead eased over 600 ms by velocity with a bias of Jo low in frame; zoom clamps so rooms never reveal the void; shots are weights not teleports.
- Static bodies are merged runs, rooms are baked to chunk textures capped at 2048, and rooms stream; performance planning (object and draw-call budgets, `PerfBudget`) exists in code.
- InputMap uses `e.code` (physical keys, layout independent), has a suspended state, last-device tracking and prompt labels; touch controls reuse the same key path, so one input path serves keyboard, pad and touch.
- Audio: master compressor + limiter + ceiling curve, bus ducking numbers from advice, beat clock scheduled on the audio clock with look-ahead, voice cap with priorities.

## Measure first (a short plan)

1. Add `?hz=` test: run the game in Chrome with the rendering throttled to 30 and with a 144 Hz monitor; log tap-hop height and run settle time (the simulation numbers above should reproduce).
2. Chrome performance trace on a mid-range Android: 60 s running through three seams. Record frame time, draw calls (`PerfMonitor.last`), GC events, `RoomStreamer.paintMs`.
3. Count live objects after 60 s of running (dust circles) and after a death burst.
4. Listen to a production build once with headphones: jump, land, hurt, music duck under dialogue.

## Version notes (Phaser 3.90 vs the skill's Phaser 4)

The skill's Arcade API matches for `setVelocity`, `blocked`, `onFloor`, `staticGroup`, `fps` and `setMaxVelocity`. Differences that matter here: Phaser 3 has no built-in render interpolation for Arcade either; `world._elapsed` is a private accumulator in 3.x; Phaser 3's `pixelArt: true` also turns on `roundPixels`; and 3.90's `Camera.startFollow` lerp is per frame (as noted), so the skill's smoothing advice has to be applied by hand.
