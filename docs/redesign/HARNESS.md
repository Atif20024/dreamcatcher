# Dev harness, warp, lint and scenarios (Phase 0)

All dev-only code is behind `import.meta.env.DEV` and is absent from `vite build` output.

## Warp
`?warp=<dream>:<place>` with dreams `hub chef musician astronaut writer painter gambler evening`. It is rewritten onto the old per-scene params, which still work: `?at=` (astronaut), `?wr=`, `?pt=`, `?gm=`, `?ev=`. `chef` and `musician` just start that scene; `hub` is the normal boot. In-session: `__dc.warp('gambler', 'pit')`.

## `window.__dc`
`step(n, dtMs=16.67)` (synthetic clock; puts the rAF loop to sleep, works with the pane hidden; `resume()` wakes it), `press(action|code, frames)`, `hold(a)`, `release(a)`, `releaseAll()`, `state()`, `snap()` (Promise of a PNG data URL), `warp(dream, place)`, `runScenarios(id?)`. Actions: `left right up down jump interact action shove trumpet tether esc enter`, or any code such as `KeyF`, `Space`, `Digit1`. Keys are real KeyboardEvents on `window` with `keyCode` set. Always pass `tabId` to the browser tools; harness loads shortly after boot.

## Scenarios (`src/dev/scenarios/`)
Each asserts the correct future behaviour and returns `{pass, detail}`. Run in the browser:

- open `http://localhost:5173/dreamcatcher/?scenarios=1`, then read `window.__dcResults` (also logged as `[dc:scenarios]`), or
- in any dev page console: `await __dc.runScenarios()` (or `__dc.runScenarios('bet-card-hidden')`).

Phase 1.1 adds four that must PASS, each across Chef, Writer, Gambler and Painter (`src/dev/scenarios/failure.js`): `hit-knockback` (a hit costs one heart, knockback, i-frames, no teleport), `zero-hearts-checkpoint` (death card → back at the last flag, hearts refilled, same scene instance, no dialogue replay), `checkpoint-label` (flag name shown on touch and in the pause menu), `continue-run` (a lit flag saves the run; the hub board shows CONTINUE; continuing wakes Jo at that flag with flags restored). They write to the real save and clear the run they made.

`npm run scenarios` prints these instructions (no headless runner yet). Since phase 1.4 every scenario passes, `eva-tether-trap` included.

Phase 1.2 (UI layer): `bet-card-hidden` now PASSES (the BET card is the top ModalManager modal; the stake selector waits hidden under it and returns), and `hud-scale-zoom` asserts the hearts, the level line and a screen-space probe keep their on-screen size when the world camera zooms to 0.62 (they live on UIScene at zoom 1). The warp keeps UIScene running.

Phase 1.3 (room transitions): `background-snap` now PASSES. `blend-continuity` pans the camera across every room boundary, both ways, in all eight places (no visible backdrop layer y jump > 8 px, alpha jump > 0.1 or zoom jump > 0.02 per frame); `boundary-no-flicker` wobbles the camera on each boundary for 120 frames and asserts the committed room never changes.

Phase 1.4 (`src/dev/scenarios/phase14.js`): `chef-chimney-walljump` (ribbed shaft, WALL JUMP card at its foot, Jo climbs out), `gate-hint-visible` (the dock hatch sign is on screen 10 tiles before the gate), `objective-room-entry` (chef arrival → dock; musician cellar → corner), `title-continue` (the title offers Continue; the board shows CONTINUE). The slow ones are `blend-continuity` and `boundary-no-flicker` (about 2 minutes with the pane hidden: the Evening load waits on throttled timers); run them one at a time and poll.

## Title, teaching, objectives (phase 1.4)
- Boot opens `TitleScene` unless a warp is given; `?notitle=1` (and `?scenarios`, `?warp=hub`) start at the station.
- Cards: `src/data/teach.js` (zone or event triggers), run by `src/play/Teach.js`; seen per dream in `SaveStore.seenCards(dream)`. `unmarkSeen(id, dream)` re-arms one.
- Objectives: `OBJECTIVES` in each `src/data/<dream>/rooms.js` (string or `[{text, flag?, unless?}]`); gate `hint`s in `GATE_HINTS`. `scene.gateSigns.state(id)` reads a sign.

## Room transitions (phase 1.3)
- The current room (`scene._room`: music, ambience, room-scoped logic) comes from the camera centre with 1.5 tiles of hysteresis (`RoomBuilder.roomAtCamera`). Gameplay that asks where Jo stands still uses `RoomBuilder.roomAt(rooms, player.x)`.
- `Parallax.update()` blends every frame: `blendAt(cx)` gives `{L, R, t}` (smoothstep over a 12-tile zone, narrower for small rooms). Sky, layers, scenery and landmark crossfade on `t`; the horizon lerps on `t` (rate-limited to 5 px/frame); vista zoom is `parallax.lerpRoom(...)`. Both rooms' scenery exists only inside the zone. End-of-world rooms the camera cannot centre in get a pulled-in edge (`room._bx`).

## UI layer (phase 1.2)
- `src/ui/UIScene.js` runs over every scene; screen-space objects (`setScrollFactor(0)` at depth >= 100) are moved onto it automatically (`src/ui/ui.js`); world overlays opt out with `keepInWorld = true`.
- HUD state is published to `src/ui/hud.js` (`hud.set`, `hud.toolLine(i)`, `hud.prompt()`); `src/ui/HudGrid.js` draws it in fixed slots with a layout budget (`hud.overflows`).
- Every modal goes through `src/ui/ModalManager.js` (`scene.modals.state()` lists the stack).
- Text: `uiText(scene, x, y, text, { size, color, align, wrap })` from `src/ui/text.js`; string-art fonts in `src/ui/fonts/`, rasterised at boot by `src/ui/BitmapFonts.js` (`paintGlyphs` for canvas textures).

## Lint and tests
- `npm run lint:rooms` is unchanged in output (logic lives in `scripts/lib/rooms-check.js`).
- `npm run lint:content [-- --json]` = room checks + tutorial cards without a firing trigger, rooms without an objective, gates without a hint, foes near spawn, cross-dream landmarks (all ERRORS) + default text (ERROR: any `add.text(`, `make.text(`, `monospace`, canvas `fillText`/`ctx.font`; a line may opt out with `lint-allow default-text: <reason>`; there are none).
- `npm test` runs Vitest (`tests/`).

## Phase 2 (characters)
- Boot loads the atlases first: `await __dc.ready()` resolves once they are loaded and the first scene is past its loader (`runScenarios()` awaits it). A `__dc.warp()` issued before boot is queued for Boot to start.
- `src/dev/scenarios/phase2.js`: `jo-walk`, `jo-skid`, `jo-turn`, `jo-jump-arc`, `jo-land-soft-hard`, `jo-float`, `jo-foot-slide` (planted-foot drift < 2 px at stride boundaries, from `player.anim.plantLog`), `jo-route-<dream>` for all eight places (keeps moving; never stands with the drawn head in a ceiling). Each returns its frame strip in `detail`.
- In a session: `__dc.scene().player.anim` is the AnimationController (`name`, `frame`, `frameName()`, `playOnce()`, `hold()`); `player.pose('celebrate')` plays a verb.
