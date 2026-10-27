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

`npm run scenarios` prints these instructions (no headless runner yet). Still FAILING on purpose (later workstreams): `background-snap` (256 px layer jump), `eva-tether-trap` (untaught drift-away death).

Phase 1.2 (UI layer): `bet-card-hidden` now PASSES (the BET card is the top ModalManager modal; the stake selector waits hidden under it and returns), and `hud-scale-zoom` asserts the hearts, the level line and a screen-space probe keep their on-screen size when the world camera zooms to 0.62 (they live on UIScene at zoom 1). The warp keeps UIScene running.

## UI layer (phase 1.2)
- `src/ui/UIScene.js` runs over every scene; screen-space objects (`setScrollFactor(0)` at depth >= 100) are moved onto it automatically (`src/ui/ui.js`); world overlays opt out with `keepInWorld = true`.
- HUD state is published to `src/ui/hud.js` (`hud.set`, `hud.toolLine(i)`, `hud.prompt()`); `src/ui/HudGrid.js` draws it in fixed slots with a layout budget (`hud.overflows`).
- Every modal goes through `src/ui/ModalManager.js` (`scene.modals.state()` lists the stack).
- Text: `uiText(scene, x, y, text, { size, color, align, wrap })` from `src/ui/text.js`; string-art fonts in `src/ui/fonts/`, rasterised at boot by `src/ui/BitmapFonts.js` (`paintGlyphs` for canvas textures).

## Lint and tests
- `npm run lint:rooms` is unchanged in output (logic lives in `scripts/lib/rooms-check.js`).
- `npm run lint:content [-- --json]` = room checks + dead tutorial cards (warn) + default text (ERROR: any `add.text(`, `make.text(`, `monospace`, canvas `fillText`/`ctx.font`; a line may opt out with `lint-allow default-text: <reason>`; there are none).
- `npm test` runs Vitest (`tests/`).
