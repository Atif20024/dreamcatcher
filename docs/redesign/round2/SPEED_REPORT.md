# Speed report

Measured 2026-11-01 on the owner's M2 Mac (8 GB, ANGLE/Metal), with two other jobs running.

## Result

- **Frame time was never the problem on the Mac.** Every heavy scene does 1.5 to 3.6 ms of work against a 16.67 ms budget. No walking frame went over budget once the first frame after a warp was excluded.
- **Two fixes shipped, nothing visible changed.** Atlas memory went from 98 to 65 MB. The moon's frame went from 3.64 to 2.30 ms. Pixel comparisons in every scene tested found 0 pixels different.
- **The worst stutter is still there, and fixing it is the owner's call.** The first time Jo reaches a room, one frame takes 100 to 400 ms while its neighbours are painted. See decision 1.
- **On a slowed CPU** (about 6x slower frames), the hub averages 16.7 ms and the casino 19.6 ms. Both are over 60 fps budget and inside the 33 ms floor.

## How it was measured

| Item | Method |
|---|---|
| Production build | `dist/` from `npm run build`, with an extra page that holds the audio context suspended so it stays silent. Warps use `game.scene.start`, so only the hub and framework dreams can be reached. |
| Instrumented build | The same minified bundle with `import.meta.env.DEV` set to true. It has the harness and warps, and no audio work. It is the only way to reach Evening and the moon. |
| Frame timing | The pane was hidden, so rAF never ticked. Frames were stepped by hand, 300 per run. **These are work times, not vsync intervals. No on-screen fps was observed.** |
| CPU split | `update` is step start to `poststep`. `render` is `poststep` to step end. |
| GPU | The wait on a 1-pixel `readPixels` after the frame. It has a floor of about 1 ms in every scene, so it is an upper bound, not GPU time. |
| Draw calls, binds | Counted by wrapping the real GL calls, not the `PerfMonitor` estimate. |
| Before and after | The renderer filter was swapped at runtime and interleaved in one page, 4 rounds, medians. This cancels most of the noise from the other jobs. |

Canvas size is fixed at 960x540 (`Scale.FIT` only changes CSS), so a phone window does not change fill cost.

**CPU throttling.** The browser tools have no throttle. macOS gave one anyway: the hidden renderer sometimes dropped to background priority (`ps` showed pri 4). A fixed JS loop then took about 2000 ms instead of 590 ms, and game frames took 5 to 7x longer. Those windows lasted minutes and could not be triggered on demand, so they appear as their own table. Evening and the moon never landed in one.

## Frame work, before and after

Normal CPU, instrumented build, 4 interleaved rounds, medians, in ms. Scenes walk where walking applies.

| Scene | Objects | Avg before | Avg after | p95 before | p95 after | Render before | Render after | GPU wait after | Draws before | Draws after | Binds before | Binds after |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Hub hall | 2018 | 2.88 | 2.60 | 4.0 | 3.5 | 1.32 | 1.04 | 1.35 | 43 | 27 | 328 | 121 |
| Last Stop, town | ~1980 | 2.54 | 1.84 | 3.9 | 2.6 | 0.74 | 0.41 | 1.14 | 23 | 12 | 218 | 80 |
| Last Stop, road | ~1940 | 2.18 | 1.73 | 3.1 | 2.4 | 0.60 | 0.29 | 1.13 | 19 | 9 | 190 | 53 |
| Casino, panel up | 293 | 3.44 | 2.80 | 6.0 | 3.9 | 1.71 | 1.57 | 0.99 | 12 | 10 | 53 | 24 |
| Chef, the rush | 303 | 1.65 | 1.48 | 2.9 | 2.6 | 0.30 | 0.27 | 0.89 | 12 | 11 | 50 | 29 |
| Musician, the set | 411 | 1.81 | 1.88 | 3.2 | 3.5 | 0.46 | 0.46 | 1.15 | 14 | 13 | 45 | 33 |
| Moon | 4540 | 3.64 | 2.30 | 5.1 | 3.0 | 2.22 | 1.21 | 0.92 | 36 | 10 | 454 | 55 |

- `update` is 0.2 to 0.4 ms in every scene and did not change, so the work is on the render side.
- The casino's GPU wait moved 1.49 to 0.99 ms, but its best rounds were 1.00 and 0.97, so most of that is noise.
- The set's small rise is noise. Its render time is unchanged.

Slowed CPU, production build, 4 interleaved rounds, medians, in ms:

| Scene | Avg before | Avg after | p95 before | p95 after | Render after | GPU wait after |
|---|---|---|---|---|---|---|
| Hub hall | 20.05 | 16.74 | 26.1 | 22.9 | 9.95 | 3.58 |
| Casino, panel up | 20.34 | 19.64 | 32.4 | 28.2 | 14.51 | 3.61 |
| Chef, the rush | 8.77 | 8.12 | 14.6 | 14.3 | 2.71 | 2.85 |
| Musician, the set | 10.56 | 9.72 | 18.0 | 17.2 | 4.46 | 3.54 |

Other checks:

- **Moon, town and road when slowed** are estimates only. At the 5 to 7x seen above, the moon goes from about 22 to about 14 ms.
- **Production against instrumented, normal CPU:** the hub read 2.9 to 3.2 ms before the fix and the casino 3.0 to 3.7 ms, in line with the table above. The casino read 2.8 ms after.
- **Phone-sized window (667x375, touch controls on, normal CPU):** hub 3.4 to 2.8 ms, moon 4.3 to 2.6, town 2.5 to 2.1, road 2.3 to 1.9.
- **Portrait (375x812):** the hub scene sat paused, so nothing was measured there.

## Memory and load

| Item | Before | After |
|---|---|---|
| Atlas textures, all loaded at boot | 98.1 MB | 65.1 MB |
| All textures, hub, first entry | 129 MB | 97 to 99 MB |
| All textures, musician's stage after touring every scene | 240 MB | 208 MB |
| Atlas PNG download | 1.51 MB | 1.46 MB |
| JS | 2.69 MB, 842 KB gzip | unchanged |
| Atlas JSON | 1.47 MB, 79 KB gzip | unchanged |
| Boot, localhost, cold | 907 to 944 ms | not re-measured cold |
| Boot, localhost, warm cache | 292 to 297 ms | 270 to 311 ms |

- **Download:** about 2.4 MB compressed, roughly 2 s at 10 Mb/s by arithmetic. No slow network was emulated.
- **Which atlases dreams load:** all 12 packs, every time, from `BootScene`. The review's 8 to 16 MB per atlas and about 100 MB in total were right.
- **Scene entry:** 126 to 443 ms for hub, chef and musician. The first entry to Evening took about 1.5 s and the moon about 0.5 s.
- **No texture leak:** four rounds of hub, chef and musician kept each scene's total within 0.1 MB (at most +1 texture per round).
- **What stays resident:** Evening's textures, about 65 MB, after leaving it. Rooms free theirs. Canvas textures also keep a CPU copy, so they cost roughly double the figures above (suspected, not measured).

## What changed

1. **`scripts/lib/raster.js`: atlases are packed to their exact box.** Rounding up to a power of two wasted 33 MB, half of the four largest sheets. Art stays NEAREST and clamped, so WebGL1 takes the sizes as they are. Art resolution is unchanged, and the casino's cast was checked by eye on the tight atlases.
2. **`src/core/offscreenCull.js`, installed from `main.js`: off-screen objects skip the renderer.** Phaser batches everything in the display list, and 4205 of the moon's 4492 objects were off screen. The filter adds about 0.2 ms over the moon's 4500 objects and saves about 1.3 ms. `visible` and the display list are untouched, so game logic sees what it always saw.
   - **Proof of no visual change:** the same frame rendered with and without the filter differed by 0 pixels, in 6 samples each of hub, chef, casino, stage, painter and clockmaker, and 3 settled samples each of town, road, moon and writer.
   - **Reads Phaser internals:** `_rotation`, `_scaleX` and `_scaleY`, because the getters cost twice as much. A Phaser upgrade needs to recheck them.
   - **Never culled:** containers, BitmapText, anything rotated or flipped by negative scale, and anything with parallax.
3. **Budgets:** `BUDGET.atlasMB` (80) and `BUDGET.renderList` (800), enforced by a new `speed-budget` scenario. It reads 65 MB and 318 drawn of 4492 objects.

Tried and dropped: checking occlusion less often while Jo stands still. `checkOcclusion` costs 1.1 ms in Dream rooms every 8th frame, about 0.14 ms a frame on average. The slower check missed the `jo-locator` scenario's 20-frame window, and the gain did not justify changing it.

## Decisions for the owner

Nothing here was changed, because each one alters how the game loads or sits in another job's files.

| # | Change | Measured gain | Cost or risk |
|---|---|---|---|
| 1 | Build neighbouring rooms before the seam, spread over several frames | Removes the worst stutter measured: first-visit frames of 100 to 400 ms (musician's alley 399, clockmaker's green 188, gambler's office 134). Repeat visits are 14 to 28 ms. At the slowed-CPU factor that is roughly 0.5 to 2.4 s. | Changes room streaming. The warp jumped Jo straight into each room; a real seam runs the same build but was not timed. |
| 2 | Load only the packs a dream uses | With the hub loaded, 14 to 39 MB of atlas instead of 65, and up to about 1 MB less download. These come from a scan of quoted keys in source, which misses keys built at runtime, so they are probably low. | Changes loading, and needs a loader at each dream's start. |
| 3 | Split dreams into separate JS chunks | At most 527 KB gzip of the 842 KB. Phaser's 315 KB always stays. Not built or measured. | Changes loading. JS only takes 110 to 150 ms to reach game start on the M2. |
| 4 | Free Evening's textures when leaving it | About 65 MB of GPU memory, plus its canvas copies, after the Last Stop. | About 1.5 s of re-baking on any return, and caches to check. Only matters late in a run. |
| 5 | Draw baked cast from atlas frames, not 1421 separate canvases | About 30 MB of duplicated GPU memory, and fewer texture binds. | Touches `src/art/baked.js`, the texture-key contract, and the running NPC job's area. |
| 6 | Bake the casino panel's static Graphics | The panel is the largest render cost when slowed: 14.5 of 19.6 ms, p95 28 ms. | Lives in `src/dreams/gambler`, which the Painter and casino job owns now. |

## The review's suspected costs

| Suspect | Finding |
|---|---|
| Character atlases, about 100 MB | Confirmed at 98 MB. Now 65 MB. |
| Dust and bursts as Shape objects | Not a measured cost. No walking frame stood out. Not changed. |
| `PerfMonitor` in production | Already gated to dev. |
| Jo's hidden outline and rim objects | `syncRim` already returns early while they are off. Not a cost. |
| Per-frame closures in `Player.update` | `update` is 0.2 to 0.4 ms. Not worth changing. |
| Catch-up steps after a hitch | `fps: { min: 20 }` is already in. |
| Room build at a seam | Confirmed and large. See decision 1. |
| Canvas textures doubling memory | Still suspected. Not measured, because no tool here reads GPU or canvas memory. |
| Grade and overlay batch breaks | Not a cost. Draw calls are 9 to 27. |
| GC from per-frame allocation | Not a measured cost: 8 heap drops and one frame over 9 ms in 900 hub frames. The allocation rate could not be read reliably, because `performance.memory` is quantised. |

## Checks

Vitest 473 of 473. `lint:content`, `lint:rooms` and `lint:scale` clean, with the existing 7 warnings. `vite build` passes.

These scenarios pass in the instrumented build: `speed-budget`, `evening-object-budget`, `clockmaker-perf`, `chef-places`, `musician-places`, `gambler-places`, `backdrop-scale`, `jo-locator`, `hud-scale-zoom`. `scale-gambler` failed once when run straight after those, then passed on two reruns from that same session, with the filter and without it.

`blend-continuity` and `boundary-no-flicker` also pass. `readability-hub` threw once when run straight after them, then passed with and without the filter. `readability-astronaut` fails with the filter and without it (`hud-level × hud-objective` overlap), so it is not caused by this work and is still open. The full scenario suite was not run.

## Limits

- No real phone was tested, and the slowed figures come from a throttled Mac.
- Only `readability-hub` and `readability-astronaut` were run from the `readability-*` set.
- Audio is excluded from the instrumented figures. In the production build the context was suspended, so main-thread audio scheduling was included but audio-thread cost was not.

## Round 2

Measured 2026-11-01 on the same Mac, with other jobs running. All four approved changes shipped. Before and after use the same method for each change, and frame times are work times, as in round 1. The slowed-CPU case could not be triggered, so nothing here was measured on it.

| # | Change | Before | After |
|---|---|---|---|
| 1 | Rooms built ahead of the doorway | Worst frame 341 ms | Worst frame 48 ms |
| 2 | Only a dream's atlas packs | 65 MB of atlas, 1.46 MB of PNG at boot | 10 to 23 MB, 0.13 MB of PNG at boot |
| 3 | Casino panel baked | Render 1.91 ms | Render 0.45 ms |
| 3 | Cast drawn from atlas frames | 1206 canvases, 27 MB | None |
| 4 | Dreams as JS chunks | 855 KB gzip at boot | 542 KB gzip at boot |

### 1. Room entry

Each crossing starts from a fresh scene, walks a real seam there and back or goes through a door, and times every frame. It runs in the dev build, as the `room-entry-budget` scenario. The "before" run used an earlier form of the same walk, on the code before this round.

| Crossing | Worst frame before (ms) | Worst frame after (ms) |
|---|---|---|
| Painter, via to piazza (seam) | 341 | 48 |
| Musician, backstage to escape (door) | 240 | 48 |
| Musician, street to alley (seam) | 196 | 20 |
| Painter, guild to piazza (door) | 174 | 23 |
| Gambler, office to deck (door) | 146 | 15 |
| Gambler, cards to office (door) | 135 | 38 |
| Clockmaker, lane to green (seam) | 104 | 25 |

- **All 58 crossings:** the worst frame is 48 ms. 54 stay at 33 ms or less, and 4 have one or two frames over it. The budget is `BUDGET.doorFrameMs`, 60 ms.
- **Trade-off:** some of this cost moved from the full-dark frame onto lit frames while Jo walks. A lit frame can now reach 48 ms, where before the long frames were hidden by the dip. They are much shorter, and painted props are cached for the rest of the page load.
- **Lead time:** the rooms ahead take 1 to 54 frames to paint, at 3 ms a frame. If Jo crosses before that finishes, the crossing finishes the paint on the spot, which is the old cost, in the dark. This was not timed in a deliberate rush.
- **What stays long:** the frames I profiled at the swap spent their time outside room building, which suggests first draws of new textures. Single paints such as a back wall cannot be split further. Not every long frame was traced.
- **Memory:** rooms two doors away now hold their textures sooner. Nothing extra is painted over a full visit, because rooms already kept their textures until the scene ended.
- **Scope:** only framework dreams stream rooms. The hub, Astronaut, Writer and Evening build at scene start, so they did not change.

The dip through dark is unchanged. `dream-seams-dip`, `hub-thresholds-dip`, `hub-threshold-no-flicker`, `blend-continuity` and `boundary-no-flicker` all pass on the final code. `transitions` is the file that holds three of these, not a scenario of its own.

### 2. Atlas packs

The people are now packed by who needs them (`src/art/packOwners.js`). The station keeps its 9 MB. Boarding frees the last dream's packs and loads the next one's, starting when Jo commits at the door.

| Place | Atlas MB, with the hub | PNG MB, with the hub |
|---|---|---|
| Hub alone | 9.0 | 0.13 |
| Clockmaker | 10.2 | 0.14 |
| Chef | 13.0 | 0.19 |
| Astronaut | 13.6 | 0.20 |
| Writer | 15.4 | 0.24 |
| Evening | 17.5 | 0.29 |
| Musician | 21.2 | 0.34 |
| Gambler | 22.7 | 0.37 |
| Painter | 23.3 | 0.42 |
| All packs (dev pages) | 70.2 | 1.25 |

- **Cost:** all packs together grew from 65 to 70 MB, because small packs waste more space. A player only reaches that total on a dev page.
- **Proof:** `tests/packs.test.js` scans each place's source for people, and `dream-packs-cover` records what the running game asks for. Both find every person in that place's packs. Neither can see a person named only by a key built at runtime from something other than their own key.
- **Dev:** dev pages still load everything, for warps. `?lean` runs the real path.

### 3. Casino panel and cast

Panel timings are interleaved in one page, 8 rounds of 40 frames, in the dev build:

| Table | Render before (ms) | Render after (ms) | Average frame before (ms) | Average frame after (ms) |
|---|---|---|---|---|
| Cards | 1.91 | 0.45 | 2.61 | 1.45 |
| Faro | 1.96 | 0.31 | 2.63 | 1.30 |
| Slate | 0.45 | 0.23 | 1.33 | 1.00 |

- **Panel captures:** the same frame with and without the bake differs by at most 1 level of 255, over about 100,000 to 137,000 pixels. This comes from blending through a texture and is not visible.
- **Slowed CPU:** at the same ratio, the 14.5 ms render would fall to about 3.4 ms. This is an estimate.
- **Cast:** a baked person is now a frame of its pack, not a canvas. After touring the places, that is 1206 fewer canvases and 27 MB less.
- **What the cast change did not do:** draw calls, texture binds and render time did not change (hub 130 binds before and after, gambler 22), because few people are on screen once culled. The gain is memory only.
- **Cast captures, same frame, old and new:** 0 pixels different in chef, musician, painter, clockmaker and writer, and in gambler's quay. Gambler's saloon differs by 12 pixels and the hub by 150, at one sprite's edge at a non-integer scale.
- **Kept as canvases:** the 68 placeholder frames in the `cast` and `foes` packs, which code may repaint.

### 4. JS chunks

Sizes from `vite build`, in KB:

| Chunk | Raw | Gzip |
|---|---|---|
| Single bundle, before | 2726 | 855 |
| Boot chunk, after (Phaser is about 315 of the gzip) | 1804 | 542 |
| `DreamScene`, for any framework dream | 124 | 44 |
| One framework dream | 33 to 94 | 11 to 34 |
| Writer | 101 | 34 |
| Astronaut | 104 | 35 |
| Evening | 202 | 71 |

- **Boot:** on localhost with a warm cache, the production page reached game start in 300 ms, against 270 to 311 ms in round 1. The gain is in download size, and no slow network was emulated.
- **Waiting:** loading starts at the door, about 2.3 s before the wipe's middle. If it is still going, the wipe holds at full cover. That hold was not seen on localhost, so it has not been observed with a slow load.
- **Failed load:** tested by stopping the server after boot, then boarding. The wipe clears and the station restarts with a card saying the train could not leave. [E] closes it and Jo walks. The card asks for a page reload, because a browser may not retry a failed module.
- **Dev:** Boot loads every chunk, so the harness and warps work as before.

### Browser runs

The production build (`npm run build`, then preview on port 5183) boarded all seven dreams and the Evening from the hub through the real boarding code. The driver answered the conductor for Jo and did not walk him to the train. A listener on console errors, warnings and rejections recorded nothing, and no missing texture was requested. Each place was checked by screenshot, and so was the casino panel. Returning to the hub and boarding again also worked.

The offline test first showed a real bug: the failed load also raised an unhandled rejection, because the handler attaches seconds later. That is fixed. The rerun did not repeat the offline test.

**`Permissions check failed`** did not appear in any run here. The text is not in `src/` or `phaser.esm.js`, and the game makes no permissions calls. The only related browser API it uses is `navigator.getGamepads` in `src/input/InputMap.js`. That points outside the game, perhaps at the browser or its tooling, but this is not proven, because the error was never reproduced.

### Checks

Vitest 511 of 511. `lint:content`, `lint:rooms` and `lint:scale` clean, with the existing 7 warnings. `vite build` passes.

Scenarios passing in dev: `speed-budget`, `room-entry-budget`, `dream-packs-cover`, the five seam scenarios above, `train-wipe`, `panel-frame`, `clockmaker-perf`, `chef-places`, `musician-places`, `readability-hub`, `jo-locator`, and all 13 gambler scenarios. The gambler set, `chef-places`, `musician-places`, `readability-hub`, `jo-locator` and `panel-frame` last ran before the chunk split. `gambler-cards` and `clockmaker-perf` were rerun after it. The full scenario set was not run.

### Limits

- No phone or slowed CPU was measured for any of this.
- The other worktree's Evening cast and foe changes may name people in new places. `tests/packs.test.js` is what catches that after merging.
- `readability-astronaut`, which failed in round 1, was not rerun.
