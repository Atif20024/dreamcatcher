# Cleanup report: three fixes from the code audit

Checks on the final tree: vitest 302 tests pass (with `--hookTimeout=180000`, see Open items), `lint:content`, `lint:rooms` and `lint:scale` 0 failures, `vite build` clean. No scenario was run, because this job had no browser.

## A. Progress with blocked or full storage

`localStorageAdapter` keeps the last written string. `read` returns it when storage throws or the last write failed, and goes back to storage once a write gets through. `remove` clears it.

One addition: `typeof localStorage` itself throws when the browser blocks site data, and it ran at module load, so such a browser could not have started the game at all. The default storage is now read inside a `try`.

Tests are in `tests/failure.test.js`: three stubs (`setItem` throws, everything throws, no storage) and the recovery path.

## B. Legacy dreams deleted

`?legacy=1`, `?warp=<dream>_legacy`, `?pt=` and `?gm=` are gone.

| Measure | Before | After B | After B and C |
|---|---|---|---|
| `dist` JS | 2,908.91 kB | 2,595.22 kB | 2,588.39 kB |
| `dist` JS gzip | 910.07 kB | | 805.89 kB |
| Atlas frames | 7,572 | 6,632 | 6,632 |
| Atlas folder | 3.17 MB | 2.81 MB | 2.81 MB |

Lines removed in `src`, `scripts` and `tests`: about 11,250 (see the commit's stat for the exact figure).

**Whole files deleted**

- `src/scenes/MusicianScene.js`, `PainterScene.js`, `GamblerScene.js`, `src/scenes/painter/`
- `src/systems/gamblerPuzzles.js`, `painterPuzzles.js`, `cards.js`, `paint.js`
- `src/data/gambler/`, `src/data/painter/`, `src/data/musician/`, `src/data/musicianData.js`
- `src/entities/Pit.js`, `Stroke.js`
- `src/dev/scenarios/betCard.js`

**Trimmed inside surviving files**

- `src/themes/musician.js`: kept the Big Stage's `npc-*` people and Jo's fallback portrait, which the framework dream uses from the atlas. The rest was dead art. It is no longer in the runtime bundle.
- `src/data/teach.js`: 23 cards only the old scenes showed, listed by `lint:content`, and `plate_gate`'s musician zone.
- `src/audio/bands.js`: the gambler, musician and painter bands.
- `src/audio/places.js`: `LEGACY_ROOMS.gambler` and `BEDS.carpark`.
- `src/systems/wallet.js`: the casino's pending chips and marker. The framework gambler's purse is `src/engines/purse.js`.
- `src/systems/puzzles.js`: the three Musician puzzles.
- `src/art/propKit.js`, `src/data/scale.js`: `pt-*`, `gm-*`, `mus-*` and `npc-kid` entries.

**How each deletion was checked**

- An import-graph walk from `main.js`, the harness, `scripts/` and `tests/`.
- Each texture key the deleted sprite modules made, grepped across `src`, `scripts` and `tests`.
- A frame-by-frame diff of the old and new atlas. Every removed frame is `gm-`, `pt-`, `mus-` or a dead `portrait-*`, plus `npc-kid`, `tool-brush` and `tool-horn-case`. The framework dreams set `tool: null` (painter, gambler) or `'trumpet'` (musician).

**The three things to watch**

- `scene` is now the literal `'Dream'` for musician, painter and gambler, and a new test in `tests/warp.test.js` asserts it. `IntroScene` and the hub read the same values.
- Save ids are unchanged. `SaveStore` is not touched by B, and the `pt`/`gm` flag namespaces stay so old saves load.
- The coin `shape: 'round'` is still set on the half dime. It belongs to the live dream, so it stays.

**Kept on purpose, dead but harmless**

- `src/builders/parallax.js`: 83 background names only the old rooms used. The file is shared with chef, writer and astronaut, and pruning it needs a visual check.
- `src/data/kinds.js`: foe kinds `collector`, `farmer`, `gendarme`, `heckler`, `manager`, `metronome_walker`, `petitioner`, `runner`, `scalper`, `shopkeeper`, plus their art in `foeArt`.
- `slots` and `cicadas` loops in `src/audio/synthLoops.js`. A test lists `slots`.
- `src/dreams/gambler/dream.js` lines 2-3 still mention `?legacy=1`. The folder belongs to the casino job.

## C. Dev shortcuts off the public site

Gated on `import.meta.env.DEV`:

- `firstSceneKey` use in `src/main.js`, which also covers `?scenarios` and `?notitle`
- `devWarp` in `AstronautScene` and `WriterScene`
- `?ev` in `EveningScene`
- `?warp` in `DreamScene.init`

`ChefScene` has no dev param. The pure `firstSceneKey` is untouched, so `tests/warp.test.js` still calls it. `npm run dev` takes the same paths as before, but that was not run.

In the built JS, `get("at")` and `get("wr")` are gone. `get("ev")` remains as an argument that `devWarp` ignores, and `get("warp")` remains only in the restart's address-bar cleanup in `BaseLevel`.

Left open on the public site:

- `?touch` and `?sound`, as asked (`?sound` already does nothing in production).
- `?flags`, because `tests/core.test.js` needs the parser and the brief said it stays. Gating the `initFlags` call in `main.js` would close it in one line and keep the test.
- `EveningScene`'s `?first`, `?weather`, `?rare` and `?nohud`, which were outside this brief.

## Scenarios

Removed: `bet-card-hidden`, `gambler-legacy`, `painter-legacy`, `musician-legacy`.

**Retargeted without being run, so check these first**

- `background-snap`: now `writer:attic` holding left, was the casino floor.
- `shadow-slope`: now the chef-arrival ramp, was the old musician's.

**Worth rerunning**

- The legacy entries were removed from these: the stair sites in `round2.js`, `objective-room-entry`, `backdrop-scale`, the `jo-route-*` set, the `failure.js` set and `backgroundSnap.js`'s dream list.
- `scale.js` and the three dream suites (`musician.js`, `painter.js`, `gambler.js`) cover the new atlas and boarding.
- `wp6.js`, `proofTrain.js` and `round2flow.js` cover the hub boarding each platform.

## Open items

- **Slot-machine sounds on the riverboat, an existing bug.** No room in `src/dreams/gambler/rooms/` sets `events`, so `DreamScene` falls back to `PLACE_BED.gambler`, which is `'casino'` (chips, slot jingle, win bell). I kept `BEDS.casino` so this change alters nothing. The casino job may want a riverboat bed.
- **`tests/audioMix.test.js` fails on bare `vitest run` on this Mac, before and after this work.** Its `beforeAll` needs more than the default 10 s hook timeout. It passes with `--hookTimeout=180000`.
- **Merge conflicts are possible in `src/data/scale.js`.** The `PROP_TABLE` lines edited here also hold `ev-*` entries, which the Last Stop job may be changing.
