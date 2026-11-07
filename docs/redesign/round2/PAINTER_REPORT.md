# THE MASTER'S LADDER: the painter rebuilt on the framework

The owner said the Yellow House's background ("yellow house, pink and circles") looked real bad. He asked for a Renaissance city where artists were encouraged, painters climbing the ladder of that era, and a famous kind of work or a famous rival at the end.

THE MASTER'S LADDER replaces THE YELLOW HOUSE on platform 5. It is built on DreamScene, the way the Musician was. The design is `docs/dream_painter_renaissance.md`, the code `src/dreams/painter/`. Every name is invented, and works are described by their kind, never by title.

## The dream
- **Whose dream:** Bice's. An old woman with gold leaf under her nails, who restored church walls for fifty years and never signed one, dreams of Fioralba in the spring the new chapel went to a contest. She is sixteen there, the master's daughter, who draws better than anyone in the shop and whom the guild will not take.
- **Jo's role:** he is the new errand boy, the hands she was never allowed. He climbs the whole ladder of the trade in one day, and at the top of the scaffold he paints her drawing with her.

| # | Place | You walk into | The one job (shown on arrival) | The rung |
|---|---|---|---|---|
| 1 | THE BOTTEGA | beams, north light through roundel glass, the altarpiece on its trestle, the porphyry slab, the hearth, Bice's loft | grind the colours on the slab (crush, grind, wash, temper with yolk) | errand boy → apprentice |
| 2 | VIA DEI PITTORI | arched shop mouths, pentices, linen lines, terracotta roofs, the campanile, a cypress at the gate | the colour-seller, under the sign of the mortar (Dori's apprentices own the street) | |
| 3 | THE COLOUR-SELLER | dark shelves of jars to the beams, a glowing copper still, lapis under a glass bell | climb the shelves by ladder for the LAPIS | |
| 1b | THE BOTTEGA | the altarpiece fills in as you paint it | the gold ground and the drapery (gesso, gold over bole, the ultramarine mantle, the fold, the light) | → assistant; the guild's chain on the gate drops |
| 4 | THE PIAZZA | the guild hall with the arms of the arts, a loggia (its roof is the high road), the fountain, an antique torso, Palazzo Bardelli, the church front, and the dome half built in its timber centering with a treadwheel crane | show the guild a masterpiece | |
| 5 | THE GUILD HALL | stone, banners of the arts, inspectors on the floor and the gallery, the consuls' dais | paint the test piece before the consuls (a head and a hand on a panel) | → master; GUILD SEAL |
| 6 | PALAZZO BARDELLI | an arcaded cortile, a lemon tree, the gallery with the family's hangings, Bruno's porters, Maestro Dori pitching below | win Messer Corso's commission (the contract; name Bice, or say nothing), then the GOLD LEAF from his study | commission |
| 7 | THE NEW CHAPEL | scaffolds and ladders to the vault, candles and the plaster trough, Dori's bay going in on the left | Bruno hid the CARTOON on the 4th plank; at the top, the giornata | the contest |

- **The finale:** the contest of the vault. Two bays of the new chapel, one giornata each, judged at the bell (advice option C). The rival is Maestro Anselmo Dori, the celebrated master; his bay fills a HUD bar.
- **What Jo and Bice paint:** a night sky of ultramarine sown with gilded stars round a figure in a blue mantle, the kind of vault every chapel of the age wanted. It takes eight steps:
  1. pounce the cartoon
  2. lay the wet plaster
  3. the sky, ultramarine (I)
  4. the sky, ultramarine (II)
  5. the stars in gold leaf
  6. the mantle
  7. the fold
  8. the face, which Bice paints while Jo holds the ladder
- **The clock:** WET → DRY is the clock. A patch that dries is chipped off and laid fresh, and the sweep slows. The work always finishes.
- **The coda:** the bell, then the city and the consuls judging under the two bays. Its lines follow how cleanly the giornata went and whether Jo named Bice.
- **The ending, THE GIORNATA:** "One day of wet plaster, and then it is the wall." It closes on Bice's line, plus one for the three studies.

**The engine:** `src/engines/craft.js`, unit-tested. A brush sweeps a bar, and you press on the gold mark. Misses slow the sweep and never fail. Plaster may be the clock, a rival may paint alongside, and an auto step is another hand. The presenter is `src/play/craftPresenter.js`: the piece builds up stroke by stroke on its altarpiece, panel or vault.

## Pickups (collectibles skill)
- **Giglio coins, worth 3:** 97 placed (budget 80–100), all on the harder way:
  - the pentices, the balcony and the barrel stacks in the street
  - the jar shelves
  - the loggia roof and the masons' stage by the church
  - the guild gallery over the inspectors
  - the palazzo's arcade
  - the chapel's sill and putlog off the ladder line
- **Key items:** each sits on a lit pedestal behind its place's challenge and opens a gate.
  - LAPIS (top shelf, past a rival and a pigeon) opens the drapery.
  - GUILD SEAL (won with the test piece) opens the palazzo door.
  - GOLD LEAF (the study, past the porters) opens the chapel door, together with the commission.
  - THE CARTOON (past Bruno) opens the vault gate.
- **The contract on the HUD:** once signed, it reads `ULTRAMARINE II / GOLD LEAF X`, and the giornata spends it stroke by stroke (advice point 2). Ultramarine is the precious thing throughout (point 3).
- **Heart shard:** over the copper still, on the hardest shelf run.
- **Small Moment, "Bice's hand":** in the loft, after the drapery.
- **Studies ([Q], silverpoint):** the antique torso, the beggar's hands, and the dome's centering. They are optional, and all three earn an ending line. [Q] also makes a foe stop to watch.

## Look, cast, scale
- **Painted in code at 1 m = 44 px:**
  - the building kit for the fronts (a new `arcade` ground floor)
  - `rn_hills`, `rn_skyline` (s 0.12) and `rn_row` (s 0.3), declared in `BACKDROP_ROWS`
  - the campanile and the dome landmarks at s 0.12, standing behind the roofs (landmarks may now set a depth)
  - the tree kit's cypress
- **Fewer blobs:** the tapestries are a lozenge lattice, and the banners carry signs of the arts (lily, tower, wheel, key, star). Shops are known by hanging emblems, not lettering.
- **Cast:** 12 townsfolk and 3 foes on the WP2 rig in era costume (luccos, gowns, tunics over hose, berretta and mazzocchio hats), baked with a foot pivot. The foes keep their gaits:
  - rival apprentices: skulk
  - inspectors: measured, hands behind the back
  - Bruno and his porters: heavy
  - pigeons
- **Contrast:** places sit under the existing painter grade. The `jo-contrast` scenario now samples the new Via dei Pittori; its result is in Verification.

## Sound (the coordinator's added scope)
- **Music by place** (`src/dreams/painter/music.js`, room `music.key`):
  - bottega: lute, Dorian, 72, D drone
  - street: recorder over lute, Mixolydian, 100, a 6/8 lilt and a frame drum
  - colour-seller: lute and glass, 60
  - piazza: shawm and frame drum, Dorian, 90
  - guild hall: portative organ, 60
  - palazzo: a lute and recorder pavane, Mixolydian, 66
  - chapel: open fifth and organ; during the contest a lute pulse comes in and the tempo climbs 60 → 84
- **The voices** are new in `MusicDirector` (VOICES, MODES, keys). Without `voices` the other dreams play exactly as before.
- **Inside vs outside:** `AudioBus` gains a room stage, a low-pass plus a feedback-comb reverb on music and ambience. `room.acoustics` picks `room`, `hall` or `chapel` (t60 0.9, 1.6 and 3.6 s). Rooms without one are `open` (dry), so nothing else changes.
- **Ambience:** `src/audio/eraLoops.js` holds reusable sound recipes as data:
  - swallows, voices through vowel formants, a fountain, a church bell for the hour, the pestle's scrape, the hearth, the alembic, glass, footsteps, the masons' chisel, a quill, a drone and a baked echo
  - seven loops, levelled to RMS −34…−40 dBFS (the other dreams' beds are −25…−36), with peaks under −16 dBFS
- **Checked offline:** no clipping, no NaN, seamless joins, and the inside loops less bright than the street (`tests/eraAudio.test.js`). Dev stayed silent: nothing was heard.

## The advisor's points

| # | Advice | Adopted? |
|---|---|---|
| 1 | Finale on the chapel vault, one bay each, judged at the bell; plaster timer, scaffold climb, rival bar | Yes. The guild-judging coda is a beat (bell, consuls, crowd), not a separate cutscene panel. |
| 2 | The contract as HUD, feeding the finale's resources | Yes: ULTRAMARINE II / GOLD LEAF X, spent stroke by stroke |
| 3 | Ultramarine dearer than gold | Yes, in the master's and Orazio's lines, the lapis card and the contract |
| 4 | Modal, secular music; organ and long reverb in the hall and chapel; bells for the hours | Yes. Bells are one toll in the piazza loop and the contest's end. |
| 5 | Avoid oil, canvas, studio easels, the bohemian cliché, famous compositions, inventor gags | Yes: tempera, gesso, panels, trestles, fresco, an invented vault, no lettering on signs. The workshop cap is the period berretta, not a bohemian beret. |
| — | Bice's story depends on women being excluded from the guild | Kept: it is the dream's point |
| — | Roman numerals on the contract | Yes |

## How to reach it
- **From the hub:** platform 5, [E] at the gate. The conductor asks "Are you ready to climb?" Catching it saves `dreams.painter`, the same flag as before.
- **Dev:** `?warp=painter:start`, or any of `bottega via speziale piazza guild palazzo chapel`.
- **The old dream:** `?warp=painter_legacy`, or `?warp=painter&legacy=1`, plays THE YELLOW HOUSE.

## What a player should try
1. Talk to Bice in the loft before you paint the drapery. Then watch the fold she told you about appear on the altarpiece.
2. Take the high road in the street: barrels, pentices, the balcony over Dori's boys.
3. In the colour-seller, go left along the top shelf over the glowing still for the heart shard.
4. Press [Q] at the antique torso by the fountain, at the old man's hands on the church steps, and up on the masons' stage under the dome. Then see the ending.
5. In the palazzo, when Corso asks whose cartoon it is, try both answers on two runs.
6. In the giornata, let a patch dry once on purpose to see it chipped off and laid fresh.

## Screenshots (`sheets/`)

| File | Shows |
|---|---|
| `painter-bottega-grind.jpg` | The bottega: grinding at the slab under the north window |
| `painter-via.jpg` | Via dei Pittori: the shop mouths, the pentices, Dori's apprentices |
| `painter-colour-seller.jpg` | The jar shelves, ladders, a rival, the lapis glowing top right |
| `painter-piazza.jpg` | The loggia roof, the dome in its centering with the crane |
| `painter-guild-test-piece.jpg` | The test piece on its trestle before the consuls, inspectors on the gallery |
| `painter-palazzo.jpg` | The gallery, the family's hangings, Messer Corso |
| `painter-chapel-giornata.jpg` | The giornata: the starry sky going in, the contract spent, PLASTER and DORI'S BAY |
| `painter-ending.jpg` | THE MASTER'S LADDER CAUGHT: the vault over the city at vespers |

## Verification

| Check | Result |
|---|---|
| `npm test` | 130/130. New: `tests/craft.test.js` (4) and `tests/eraAudio.test.js` (6); `tests/warp.test.js` updated |
| `npm run lint:content` | 0 failures. Framework dreams `clockmaker, musician, painter` are clean: graph, reach (now following ladders), headroom, refs, objectives, perf |
| `lint:rooms` / `lint:scale` | 0 failures; clean (253 measured, the 15 new people inside their classes) |
| `npx vite build` | OK |
| Scenarios: one full run (port 5197, dev silent, from `?notitle=1`) | **100 passed, 4 failed.** |
| `continue-run` | Failed in the full run: the legacy `PainterScene` (and the legacy `MusicianScene`) no longer resolved a dream id for its run save. Fixed in `BaseLevel` (`DREAM_OF_SCENE` maps the legacy scenes) and re-run: pass. |
| `readability-painter` | Failed in the full run: the long HUD level label crowded a two-line objective. Fixed with `def.hudName` and shorter objectives (≤ 50 chars); re-run: pass. |
| `painter-ladder` and `painter-playthrough` | Failed in the full run: past a ladder's top Jo dropped back into the ladder hole. Ladders now end under a deck plank (`grid.ladder(x, deck, foot, [deck])`), and the lint follows that; re-run: pass. |
| `painter-playthrough` re-run | Every step passes. The test piece and the giornata take 4, 5, 6 and 7 presses; 2.0 min of scripted game time with the platforming placed. A first play should take 7–9 min. |
| Other full-run passes | `painter-board`, `-places` (all eight under budget: 279–540 objects, ~73–127 draw calls; rooms paint in 16–135 ms; each room's loop, music key and acoustics set) and `-coins` (97 placed, worth 3). Also `painter-legacy`, every `slope-*`, `scale-painter`, `shadow-places`, `musician-*` and `clockmaker-playthrough`. |
| `jo-contrast`, painter (Via dei Pittori) | edge **3.67** (local 3.11): ≥ 3:1 |
| Audio, offline | Loops at RMS −34…−40 dBFS, peaks ≤ −16 dBFS, finite and seamless. The comb reverb is stable for every preset. Dev was silent throughout. |

## Files outside `src/dreams/painter/`
- **Framework:**
  - new `src/engines/craft.js` and `src/play/craftPresenter.js`; `encounterPresenters.js` (registers craft)
  - `DreamScene.js` (craft results as flags, room music key, acoustics, `def.hudName`); `BaseLevel.js` (legacy Musician/Painter scenes keep their run id)
  - `BackdropDirector.js` (landmark depth)
  - `buildingKit.js` (arcade)
  - `backdrops/painted.js` (three rows, two landmarks)
  - `scripts/lib/dream-checks.js` (the lint follows ladders)
- **Audio:** new `src/audio/eraLoops.js`; `synthLoops.js`, `AudioBus.js` (acoustics, busSynth), `MusicDirector.js` (voices, modes, keys)
- **Cast:**
  - `src/art/rig/cast.js` (two hats), `gaits.js`
  - `src/entities/foeArt.js`, `src/data/scale.js` (bodies and rows), `src/data/kinds.js`
  - `scripts/lib/cast-bake.js`
  - regenerated `public/atlas/people*`, `index.json` and `sheets/cast-lineup.png`
- **Wiring:**
  - `src/data/dreams.js` (title, scene, giglio coin, lily livery, conductor; `LEGACY_PAINTER`)
  - `src/dev/warp.js` (`painter_legacy`, `<dream>&legacy=1`)
  - `src/dreams/index.js`, `src/scenes/IntroScene.js` (the Fioralba arrival)
  - `src/ui/theme.js` (place name), `src/art/trainArt.js` (lily)
- **Scenarios:**
  - new `src/dev/scenarios/painter.js`
  - legacy-geometry checks moved to `painter_legacy` (`backdrops`, `backgroundSnap`, `failure`, `phase2` routes, `round2` slope sites)
  - `scale`, `readability`, `wp6 jo-contrast` and `round2 shadow-places` now sample the new `painter:via`
- **Tests:** new `tests/craft.test.js` and `tests/eraAudio.test.js`; `tests/warp.test.js` updated

## Known gaps
- **Cut for length:**
  - the cartoon-pricking job, the gesso panels as their own job, a fetch for eggs
  - a real crowd in the chapel at the bell (the coda is told, not staged)
- **The caption bar sits over the floor line** in short interiors while a line is up (the framework's framing, as in the Musician).
- **The onStart beat replays on every dev warp,** so warped screenshots show the bottega's first line. Boarding from the hub plays it once.
- **Audio was not heard** (dev silent). Levels and joins were checked offline only.
- **The Teach cards** (SHOVE, LADDERS…) are the shared ones. The painter's own Teach texts in `src/data/teach.js` still describe the Yellow House's verbs, which are now legacy-only.
- **The old `PainterScene.js` and `src/data/painter/`** stay, as the brief asked.
