# The Racer, stage 1

THE LONG STRAIGHT now boards from a new platform 10. It runs through a garage on the DreamScene framework, into a separate race scene and back.

Nobody has felt or heard any of it yet. See "What nobody has felt or heard" below.

## What's built

| Piece | Where | Notes |
|---|---|---|
| Race rules | `src/engines/race.js` | Pure maths at a fixed 120 Hz: throttle, brake, three depth lanes, bends, grip, draft, slingshot, rubs, lamps, spins. |
| Race scene | `src/scenes/RaceScene.js` | Its own chunk: 26 KB, 11 KB gzip. Started from a door in the garage. |
| Road and parallax | `src/dreams/racer/race/RaceRoad.js` | Sky, layers at 0.1, 0.35 and 0.7, the road band, a kerb streak. |
| HUD | `src/dreams/racer/race/RaceHud.js` | Bitmap fonts. Uses the HUD grid's slots and meters, and claims regions for what it draws itself. |
| Test road | `src/dreams/racer/race/tracks.js` | 1.2 km, flat, two bends, four things on the road, one lamp, one placeholder rival. |
| Hand-off | `src/dreams/racer/race/result.js` | The result goes into the saved run as plain flags. |
| Car kit | `src/art/carKit.js` | Five cars, wheels and road props, painted in code and baked into a `cars` pack owned by the racer. |
| Engine sound | `src/audio/engineSynth.js` | Three cars at most: Jo and the two nearest. |
| Pedals | `layoutRace` in `src/input/touchLayout.js` | Tall GAS and BRAKE plates under the right thumb, two lane buttons and SLING under the left. They press the same keys as the keyboard. |
| Garage | `src/dreams/racer/` | One room with its Heron at the shutter. The door into the race is here, and the prize is paid here. |
| Platform 10 | `src/data/hub/` | Train, board row, sign, tyres on the concourse. |

### The owner's points

- **Station width.** W went from 167 to 174. The shed room is now cols 110-163, with bay 10 at cols 155-161. The gate room is now cols 164-173, with everything in it 7 tiles further east. The roof's far bench, lamp and skylight moved with it, so they keep their place over the end of the shed.
- **`bayIndex`.** Platform 10 is index 10. G stays at 9.
- **Not counting yet.** The racer's entry has `unfinished: true`. It keeps `scene: 'Dream'`, so the real boarding code runs.
  - `runningDreams()` leaves it out, so `caughtRunning`, `progress` and the station's states stay as they were. The dreamcatcher's web (`WEB_ORDER`) leaves it out too.
  - The headline counts only finished platforms, so it still reads NINE PLATFORMS.
  - The departure board does show its row as BOARDING and the platform sign as `● BOARDING · FAST`, because you can board it.
- **Saving.** There is no save format change.
  - The door saves the run before the race starts.
  - The finish line writes the result into the run before any card shows.
  - Back at the garage, the verb pays what the flags say is owed, in one save with the coin count and the wallet figure.
  - A Continue after that pays nothing, because the `paid` flag is in the run. If the tab closes before payment, BaseLevel's existing wallet check still holds, and the garage pays on the next Continue.
- **Shared code touched.** Only these, and only additively:
  - `SCENES.Race` and `loadSceneChunk` in `boarding.js`
  - a `touchProfile === 'race'` check in `TouchControls`
  - `data.quietResume` in `BaseLevel.applyResume`, so a return from a race doesn't say "continued from the last flag" (no other caller passes it)
  - the `racer` entries in `theme.js`, `packOwners.js`, `joLights.js`, `dreams/index.js`, `warp.js` and `IntroScene.js`

  DreamScene itself did not change.

## The numbers I tuned, and why

All of these come from the bot runs in `tests/race.test.js` and a throwaway simulation, not from anyone driving. The first six rows are in `TUNE` in `race.js`. The rival is in `tracks.js`.

| Number | Value | Why |
|---|---|---|
| Top speed | 36 m/s | The design's figure. |
| Pull | 8.5 m/s², fading on a power of 1.7 | 0-20 m/s in about 3 s, a slow climb to the top (the tests pin 7 to 12 s to 34 m/s). A strong launch, then a long pull that rewards not lifting. |
| Brake | 8 m/s² plus drag | About 4 s from the top. I started at 14, which sheds a whole bend's speed in under a second, too short for a braking choice to matter. |
| Fade | From 2.5 s, down to 70% at 5 s | Drum brakes. Normal braking never reaches it. |
| Slide | 0.22 lanes/s per m/s over a bend's speed, 0.6 m/s² of scrub | A slide wins over the lane glide unless a lane press is fighting it. Without that rule, flat-out with no brakes was the fastest way round (39 s, against about 43 s for a tidy lap). |
| Rival | Pull ×1.04, top ×0.96, 9 m ahead | Stays ahead off the line, so Jo actually meets its draft on the straights. At pull ×0.95 Jo drove past before the draft ever filled. |

Bot results on the test road:

| Bot | Place | Time | Notes |
|---|---|---|---|
| Tidy, drafts and slings | 1 | 43.2 s | Grip 0.85, green. |
| Tidy, passes with no draft | 2 | 46.4 s | Rival 46.3 s, 18 rubs. |
| Flat out, no brakes | Never finishes | | 16 trips into the straw and 6 spins in the 150 s the bot ran. |
| Rival alone | | 44.0 s | |

- **Length.** A lap of about 43 s is close to the design's 0:40 for this distance.
- **Unchanged from the design.** Draft window, 6% draft, 18% slingshot for 2 s, 4 s cool-down, 10% rub, 25% grip limit, 0.45 s lane glide.

### What I added to the design

- **Sight strip and bend call.** At top speed the view ahead is only about 18 m, about half a second of warning. So a chevron per lane shows what is coming within 160 m, and the top of the screen calls the next bend and its speed, which is also marked on the speedometer.
- **`passPlace: 1` on the test road.** The design's top 3 can't fail with two cars.
- **Soft aid.** After three runs short of the gate or restarts, Ottavia's chalk line appears on the road and BRAKE NOW shows on the call.
- **Rubs in the `clean` flag.** A rub, a spin, straw or a bale clears `clean`. A run with `clean` true had no contact at all.

## Measured results

Dev server, this Mac, other jobs running. Frames were stepped by hand and include the wait on a 1-pixel read. These are work times, not on-screen frame rates. No phone and no slowed CPU were measured.

| Check | Result | Budget |
|---|---|---|
| Race frame at speed, 600 frames | avg 3.19 ms, p95 7.4 ms, worst 14.4 ms | 16.67 ms |
| Draw calls | 5 a frame, 138 objects | |
| Worst frame through the garage door | 13.3 ms | 60 ms |
| `cars` pack | 1.32 MB of RGBA, 10 KB PNG | |
| All packs, dev page | 73 MB | 80 MB |

- **The door.** Its first version cost 110 ms in one frame, painting the road's textures. The garage now paints them one a frame as it fades up. Those frames were not timed on their own.
- **Atlas with the hub.** About 10.3 MB for the racer, by arithmetic from the speed report's 9 MB hub figure plus the pack above. Not measured on a lean page.

### Checks

- vitest: 38 files, 616 tests, all passing. New files: `tests/race.test.js`, `tests/raceResult.test.js`.
- `lint:content`, `lint:rooms`, `lint:scale`: clean, with the existing 7 warnings. The scale lint now measures the baked cars.
- `vite build`: passes.

| Scenarios | Result |
|---|---|
| `racer-race-start`, `racer-finish-return`, `racer-fail-message`, `racer-fail-fair`, `racer-pause`, `racer-touch`, `racer-draft`, `racer-engine-offline`, `racer-frame-time`, `racer-platform` | Pass |
| `dream-packs-cover`, `speed-budget`, `room-entry-budget` | Pass (58 crossings, worst 47 ms). The racer has no door crossings for `room-entry-budget`, so its door is timed in `racer-frame-time`. |
| `hub-thresholds-dip`, `hub-threshold-no-flicker`, `hub-roof-drops`, `hub-safety-net`, `hub-ladder-undercroft`, `hub-ladder-roof` | Pass: no way back lost |
| `station-counts-all`, `station-prompts`, `station-roof-rewards`, `continue-pays-once`, `readability-hub`, `train-wipe` | Pass |

- `tests/reach.test.js` passes on the widened map.
- `racer-platform` also passed on `?lean`, the path a player gets: the `cars` pack was absent at boot and present after boarding.
- A dev page loads every chunk at boot, so the Race chunk loading at the door, and its failure message, were not exercised. The chunk exists in the build output. The production build was not played.

The full scenario set was not run, as the brief asked.

## What nobody has felt or heard

- **The feel.** No person has driven this. Every number above is a bot or a calculation. This is the owner's first check, and the design says nothing else matters if it fails. These are the likeliest to need changing: brake strength, the slide's push, lane glide at speed, and whether the sight strip can be read at speed.
- **The sound.** Dev is silent, so nothing has been heard. In a dev build the game has no live audio context at all, so the engine's live path never ran. Two things were checked:
  - what the scene asks of the voices (pitch, filter, gain, pan), by state
  - the real oscillator graph rendered into an offline buffer that never reaches the speakers

  The rendered level rises with revs, peaks at 0.39 with three cars, and the strongest repeat follows the pitch (119 Hz at top speed: the sub-octave, as designed). Whether it sounds like an engine is unknown, and the mix against the rest of the game is unchecked.
- **A real phone.** The pedals were tested with synthetic touches on a desktop page. Thumb reach, and whether a thumb can roll from GAS to BRAKE by feel, are untested.

## Not done, or short of the design

- **Parallax art.** The layers reuse the shared painters, so the land reads as broadleaf trees and a pale town rather than pines, cliffs and stone villages. It needs its own layers.
- **Heat shimmer.** Not built. Dust, the kerb streak, the lead, the zoom and the motion lines are.
- **Grip display.** A HUD meter that changes colour by band, not bands drawn on the tyre.
- **Board-from-start.** Boarding the dream from the start clears the run, so the prize can be earned again. This matches how other dreams' coins behave. It is not the Continue case.

## One error I didn't trace

`Permissions check failed` appeared twice in the console on one `?lean` load, the error `SPEED_REPORT.md` could not reproduce. I added a listener for unhandled rejections partway through that page, after the first screenshot, and it caught nothing from there on. The cause is still unknown, and nothing failed around it.
