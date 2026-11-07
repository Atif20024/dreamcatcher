# Round 2 WP2: everyone and everything at Jo's scale

Owner point 1: "Jo is big but everything else is the same, including NPCs, buildings in the background, elements to interact with... look at the aspect ratio of all other entities". This package covers the people, foes, creatures and play-plane props. Trains and the hub presentation are WP3. Backdrops, trees and building rows are WP4.

## What changed

### 1. The scale system as data: `src/data/scale.js`
- `PX_PER_M = 44`, `px(m, s)` and `metres(p, s)`, which follow the depth rule.
- `JO`, the class ranges `CLASSES` (people and creatures) and `PROP_CLASSES`, and `TOL = 4 %`.
- `CAST_BODIES`: the body class, sex, hair, beard, dress and apron of every person texture, for the rig bake.
- `PROP_TABLE` (texture → prop class), `CREATURE_TABLE`, and `SCALE_EXCEPTIONS` (what is out of scale and which package owns it).
- Read by the atlas bake, `lint:scale` and the `scale-<place>` scenarios. MaterialLibrary, PropLibrary and BackdropDirector should read it too.

### 2. The cast is rigged (no stretched 32×48 grids)
- `src/art/rig/cast.js` builds every person on Jo's skeleton (`src/art/rig/human.js`) from the look data each place already had: Evening `CAST`/`EXTRAS`, the Writer/Painter/Gambler `PEOPLE`, hub `HUB_PEOPLE`, `foeArt.js` `PEOPLE` (now carries `hat`/`held`), and the Musician and Astronaut `NPCS` palettes.
- **Bodies** (metres → rows at 2×):
  - adult m: Jo's metrics, 76 px.
  - adult f: 1.66 m, 74 px.
  - big: 1.95 m and broad, 84–88 px.
  - elderly: stooped, 70–74 px.
  - teen: 72–74 px.
  - child: 1.25 m with a big head, 56 px.
- **Parts:**
  - Seven heads (short, crop, long, bob, bun, tuft, bald; grey hair and beards as options), each with blink, talk, laugh, and a foe `alert`/`shout` with the reserved `X` red glint.
  - Thirteen hats (cap, peaked, beanie, fedora, toque, baker, straw, bandana, headset, scarf, wrap, veil), a skirt/dress layer and an apron. `human.js` gained an optional `parts.over` layer; Jo and Wren are unchanged.
  - Twenty held props drawn at the front hand with a proper holding arm: tray, accordion, basket, book, rod, bass, broom, clipboard, ledger, crate, coil, ladle, bottle, tickets, can, brush, flower, string, rope, suitcase.
  - Palettes are expanded from the old look colours into hue-shifted four-tone families.
- **Animations** (poses scaled to each body's leg length, so the planted foot still moves exactly one step a frame):
  - Everyone: idle 4, walk 8, talk 4, wave 4, laugh, sit, sit-laugh, plus empty-hand idle and walk.
  - Foes: idle, walk 8, alert 2, windup 3, grab 2, throw 3, search 2.
- **Bake** (`scripts/lib/cast-bake.js`, called by `scripts/build-atlas.js`):
  - 108 people, 2,993 frames, packed as `public/atlas/people*.png`. Packs are chunked so each stays within 2048².
  - Frames use the **same texture keys** the scenes already use (`ev-p-wren#3`, `foe-guard`, `hub-pemberton-walk#2` …), plus new keys for the new animations (`…-talk#n`, `…-idle#n`, `foe-x-windup#n` …).
  - One canvas per character, with the foot anchor at bottom centre.
  - Pivots: scenes that place people at origin (0.5, 1) get a foot pivot. The older centre-origin callers (hub, Musician/Astronaut NPCs, foes) get a pivot that keeps the feet exactly where the old 48 px image had them, so every figure grows upward from the same floor point.
  - `bakeFromAtlas` now carries the pivot onto the runtime texture, and `lightTextures` keeps it through a relight.
- **Review sheets:**
  - `sheets/cast-lineup.png`: every person beside Jo on a ground line with tile ticks, showing idle, two walk frames, talk, wave, sit and laugh, plus alert, windup, grab and throw for foes.
  - `sheets/placeholders.png`: the remaining string-art (creatures, tools, portraits).
- **Runtime wiring:**
  - `Townsfolk`:
    - Kids are no longer shrunk ×0.72 (they are baked at child height).
    - The walk steps every 6 px (3.5 for kids), matching the rig step.
    - The rig's hip bob replaces the scripted one.
    - The talk loop plays while a line is up.
    - Bubbles and carried things sit at the real head and hand height, and shadows scale with height.
    - A seated person who is not on a bench or the low wall gets a chair (`ev-chair`).
  - `Foe`:
    - Rigged foes walk on 8 frames stepped by distance.
    - States show poses instead of a tint and lean: alert, the 0.4 s windup tell, grab, throw (when Jo is caught), and search (distracted).
    - Big foes are drawn big instead of `setScale(1.2)`.
    - The physics body is the old sprite's box, bottom-aligned at the feet, so rooms, grabs and shoves play as before.
    - `markY()` puts the "!" above the real head.
  - Writer/Painter/Gambler `walkPerson` steps at 6 px.
  - Physics followers (Nia, Priya, the scalper, the boxing opponent) use `personBody()`, Jo's body at the feet.
  - Astronaut `snap()` respects the origin.
  - The Silhouette crowd keeps its feet origin.

### 3. Props redrawn to the table: `src/art/propKit.js`
- Metre-based painters build letter grids in 2 px cells: bench, desk, table, café table, chair, street lamp, door (panelled, glazed, push-bar, revolving), postbox, cabinet, copier, slot machine, upright piano, handcart, car, easel, bed, stove, town fountain, drinking fountain, host stand, lectern, washer, luggage trolley, suitcase.
- They are shaded by the hub's `paintRig` pass (lit west edge, hue-shifted east shade, selective outline), so props and people read as one drawing.
- `REDRAW` maps 49 existing keys onto them. `createPixelTexture` and the hub prop painter ask the kit first, so no scene placement code changed.
- The pivot keeps every prop's floor point.
- Lamp glows moved to the lantern (Writer, Gambler, Painter).
- The hub desk now draws in front of Pemberton.
- The hub luggage cart body sits at the bottom of the new frame.

### 4. Creatures at real proportions
| Creature | Size (px) |
|---|---|
| Rat | 28×12 (redrawn 14×6 grid) |
| Roach | 20×12 |
| Writer pigeon | 16×12 |
| Painter crow | 22×14 |
| Evening pigeon | 15×15 |

Cats (27×21 sitting) and the dog (36×21) were already within the table.

### 5. `npm run lint:scale` (also inside `npm run lint:content`)
`scripts/lib/scale-check.js` measures each group against its class range from `scale.js` (± 4 %):
- **People:** every rigged person's standing height, from the bake's `castReport` in `public/atlas/index.json`.
- **Creatures:** the opaque height of every creature's baked frame.
- **Props:** every kit prop's drawn height.

Anything out of range fails the run unless `SCALE_EXCEPTIONS` names its owner. Current result: **172 measured, 0 failures, 22 owned elsewhere** (listed below).

### 6. The `scale-<place>` scenarios (`src/dev/scenarios/scale.js`)
In each of the nine places (hub, chef, musician, astronaut, writer, painter, gambler, evening, proof), the scenario measures the **on-screen opaque height** of every person, foe, creature and kit prop on the play plane:
- Adults, teens, elderly and big bodies must be 0.82–1.12 × Jo (82 px) and inside their class range. Children must be 0.58–0.78 × Jo.
- Doors must be ≥ 1.15 × Jo, and every prop must be inside its class range.
- Seated and tumbling poses and depth-band crowds are listed, not judged.
- `detail.near` gives the ratios of Jo's nearest neighbours.

## Before / after (drawn px; Jo = 22×76, 82 with hat)

| Entity | Before | After | §7 target |
|---|---|---|---|
| Adult NPC (hub, Evening, Writer, Painter, Gambler) | 32×48 frame, ~44 drawn | 74–80 | 70–84 |
| Astronaut NPCs (Adaeze, Priya, Halvorsen, Osei) | 32×44 | 70–76 | 70–84 |
| Musician NPCs (Delphine, Nia, Marcus, Ray, Tally, Sol) | 32×48 | 70–86 | 70–84 (Marcus big) |
| Human foes | 32×48 | 72–80 | 70–84 |
| Big foes (bouncers, security, roadie) | 38×58 (×1.2) | 84–86 | 84–88 |
| Elderly (Pemberton, Emmerich, Lou, Sal, Delphine …) | 32×48 | 70–74 | 68–75 |
| Children (Joy, Noor, Idris, Kite Kid) | 23×35 (×0.72) | 56 | 50–62 |
| Musician kid (`npc-kid`) | 16×20 | 58 | 50–62 |
| Station travellers (depth band ×0.78–0.94) | 25–30×37–44 | 61–73 | crowd bands 0.8–0.9 |
| Rat | 30×21 | 28×12 | 28×12 |
| Roach / pigeon / crow | 30×18 / 24×18 / 33×21 | 20×12 / 16×12 / 22×14 | — / 16×13 / 22×16 |
| Bench (Evening, Writer, Painter, hub) | 48×20 (Writer 48×15) | 80×38 | 80×38 |
| Desk / big desk | 48×15 / 60×15 | 62×34 / 80×34 | 62×33 / 80×33 |
| Hub desk (Pemberton) | 56×28 | 80×40 | counter 40–54 |
| Astronaut desk | 30×9 | 62×34 | 62×33 |
| Table / chess table | 36×15 / 40×24 | 54×34 / 44×34 | 52×33 |
| Chair (Writer, Painter, Musician) | 18×18 / 24×18 | 20×40 | 20×40 |
| Street lamp (Writer, Gambler, Painter) | 21×45 / 15×45 | 22×198 | 198 |
| Door: Writer shop/fire, Gambler staff/fire | 30×30 | 52×100 | 52×100 |
| Gambler revolving door | 33×48 | 88×106 | 88×106 |
| Postbox | 20×40 | 26×68 | 26×68 |
| Town fountain (Evening / Gambler / Painter) | 72×40 / 64×44 / 54×21 | 176×88 / 158×80 / 132×88 | 176×26 + column to 88 |
| Hub drinking fountain | 40×32 | 22×44 | 22×44 |
| Copier / piano / slot / lectern / host stand | 48×30 / 54×24 / 30×30 / 24×21 / 30×30 | 58×54 / 66×54 / 36×76 / 30×54 / 26×54 | 1.1–1.7 m |
| Filing cabinet / washer | 36×27 / 36×24 | 40×36 / 26×38 | 0.8 / 0.85 m |
| Handcart / luggage cart / suitcase | 40×24 / 40×16 / 18×15 | 70×40 / 60×44 / 32×24 | 0.9 / 1.0 / 0.55 m |
| Bed / cot / charpoy | 48×18 / 30×18 / 56×16 | 88×24 / 80×20 / 84×22 | 0.5 m high |
| Easel / stove | 33×27 / 24×27 | 36×70 / 30×40 | 1.6 / 0.9 m |
| Parked car (Gambler) | 63×30 | 190×64 | 190×64 |

## Room geometry
No room data changed.
- Kit props are decoration at their old floor points.
- Bodies of people and foes keep their old size at the feet, so every corridor, grab and shove plays as before.
- Two places needed a fix:
  - The Writer filing cabinet is drawn as a low two-drawer cabinet (0.8 m), so its noun label does not collide with the gate sign above it (`readability-writer`).
  - The Gambler carpark van stays 27 px: it is a moving platform Jo rides, and a 2 m van would be out of jump reach. This needs the carpark rebuilt and is listed as an exception.

## Exceptions (`SCALE_EXCEPTIONS`, owned elsewhere)

| Owner | Items |
|---|---|
| WP3 | Hub doors, ticket booths, kiosk, platform lamps, hub pigeons, all trains, the Painter train (Paul on it at ×0.8) |
| WP4 | Play-plane trees: Painter plane tree, cypress and grey tree; Evening tree, apple tree, pine and hill tree |
| WP4 | Evening house rows: doors, lamps and the bakery, which scale with their buildings |
| WP4 | Painter house and café fronts |
| Framework | Chef 1-tile crates (puzzle geometry), the kitchen trolley foe (trolley plus cook), the Gambler van (carpark rebuild) |

## Verification
- `npm run atlas` ok (108 people, 2,993 rig frames, 11 packs).
- `npx vite build` ok.
- `npm test`: 101/101.
- `npm run lint:content`: 0 failures, including scale: 172 measured, 0 failures.
- `npm run lint:scale`: clean.
- **Scenarios** (run by group in the browser, own tab):
  - All nine `scale-<place>` pass.
  - Every existing scenario passes except `slope-gambler-floor-stairs` (left at 280 px/s). It fails identically on the pre-WP2 tree (checked with the changes stashed): the floor-security guard by the stairs grabs Jo mid-run. That is a scenario/foe-placement issue, not a scale regression.
- **Screenshots** were taken at full scale (camera zoom 2–3) in every place: Jo beside people, foes, doors and desks or counters.

## Honest view
- **Better:** the cast now reads as one world with Jo.
  - People stand at his height with legs that walk and real heads and hands, and kids are kids.
  - Bouncers are big because they are drawn big.
  - Benches, desks, chairs, lamps, doors and fountains are the size a person uses them at.
- **Weaker:**
  - Everyone shares Jo's skeleton, so silhouettes vary by body class, hat, held thing and colour, but not by gait. The per-character gaits in the motion skill (bouncer sway, landlord hurry) are not authored yet.
  - Faces are 8×8 profiles: readable, but not expressive.
  - The prop kit is clean, but more generic than hand-drawn art.
  - The hub and Evening building rows still look doll-sized next to full-size people and furniture until WP3/WP4 land.

## Handover (framework)
- `src/data/scale.js` is the source for MaterialLibrary, PropLibrary and BackdropDirector.
- `src/art/rig/cast.js` (bodies, heads, hats, held props, poses) can back framework NPC manifests: a manifest could name a look and a body instead of a hand rig.
- `src/art/propKit.js` painters take metres. PropLibrary can call them directly.
