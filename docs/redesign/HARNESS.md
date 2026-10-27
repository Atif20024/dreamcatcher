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

`npm run scenarios` prints these instructions (no headless runner yet). Today all three FAIL on purpose: `background-snap` (256 px layer jump), `eva-tether-trap` (untaught drift-away death), `bet-card-hidden` (card depth 242 under modal 300).

## Lint and tests
- `npm run lint:rooms` is unchanged in output (logic lives in `scripts/lib/rooms-check.js`).
- `npm run lint:content [-- --json]` = room checks + dead tutorial cards + default-text debt (warn only; exit code still fails on room failures only).
- `npm test` runs Vitest (`tests/`).
