# Round 2 WP4: backdrops and buildings at scale, trees, the Evening

Owner point 1: trees were "about the same height as Jo, which is impossible", and the buildings and background did not match the bigger Jo. This package covers trees, building rows, house and shop fronts, and the Evening's fixes (critique §5.9, §7.1.2, §11 WP4). It does not touch trains, the hub bays, booths, kiosk, platform lamps, doors or the intro carriage (WP3).

## What changed

### Shared kits (painted in code, metric)
- `src/art/treeKit.js`: painterly trees from `TREE_SPECS`.
  - Kinds: plane, street, apple, hill, pine, cypress, grey, olive.
  - Each tree is drawn at m × 44 × s px: trunk, boughs and lobed crowns. Planes have flaking bark, apples carry their fruit in the crown, pines have drooping tiers with optional snow, and the cypress is drawn as a flame of upward strokes.
  - `drawTree` paints onto any canvas (bands, layers). `paintTreeTexture` makes a play-plane texture with its foot at bottom centre.
- `src/art/buildingKit.js`: facades in metres, from `facadeMetrics(s)`.
  - Measures: a 3 m storey, a 4 m shop floor, a 2.2 m door, 1.0 × 1.5 m windows on a 0.9 m sill, a roof rising 2.4 m.
  - Facade parts: plaster wash, quoins, shutters, balconies, flower boxes, a fascia and awning, pitched or parapet roofs, chimneys and skylights.
  - Detail scales with px per metre.
  - `drawRow` builds a whole row. `drawGroundLine` adds the depth cue: a far pavement, kerb and road in front of a row. `paintFrontTexture` and `paintDoorTexture` make play-plane props.
  - Every row logs its storey in `ROW_LOG`.
- `src/data/scale.js` (appended only):
  - `STOREY_M`, `facadeMetrics`, `frontPx`, `TREE_SPECS`, `treePx`.
  - `TREE_TABLE`/`TREE_CLASS`, `FRONT_TABLE` and `BACKDROP_ROWS`, plus the new classes.
  - `ev-lamp` added to `PROP_TABLE`.
  - The 12 WP4 keys deleted from `SCALE_EXCEPTIONS`.
- `src/art/propKit.js` (appended only): `ev-lamp` is redrawn as the 4.5 m street lamp.

### Sizes (play plane, px)

| Thing | Before | After |
|---|---|---|
| Painter plane tree / cypress / grey tree | 72×56 / 36×60 / 48×40 | 662 / 574 / 442 tall (15 / 13 / 10 m) |
| Evening street tree / apple / hill tree / pine | 128×104 / 128×104 / 144×120 / 48×64 | 398 / 266 / 530 / 706 and 574 (9 / 6 / 12 / 16 and 13 m) |
| Evening door | 32×56, alone on the street | 52×108 in a stone surround, in front of a two-storey house front (about 380×420) |
| Evening lamp / bakery | 20×84 / 104×64 | 4.5 m kit lamp, with the glow at the lantern / a 4 m shopfront plus one storey (323 tall) |
| Painter yellow house / café | 80×44 / 60×27 | 2 storeys plus a roof (370 tall, door 97) / a 4 m shopfront, a storey and an awning (323) |
| Storey, by layer s | ad hoc | 132·s: 15.8 (far 0.12), 23.8 (Evening town 0.18), 33 (Evening near 0.25), 44.9 (mid 0.34), 82 (near 0.62) |

### Backdrops (`src/builders/parallax.js`)
- **Building rows:**
  - 10 skyline layers (city, rain_city … village_night) and 14 facade layers (brick, theatre, club_wall … station_umber) are now painted by the kit for their slot's s. The texture key now includes the slot.
  - Per-place storey ranges, so a village is 1–3 storeys and a city up to 13.
  - Rows nearer than the far slot stand behind a ground line.
- **Tree rows:** `plane_trees` (Painter arrival) and `pines` (Astronaut) are rows of kit trees.
- **Outdoor scenery:**
  - Props are drawn at real size for s 0.22. A lamp is 4.5 m, a pylon 22 m, with the scale capped at 1.8.
  - Ground things (trees, lamps, booths) stand on the street rather than on the roofs.
  - Trees are kit images.
  - Interior scenery is unchanged.
- **Hub:** two plane trees on the street layer (`hubArt.js` `station_street`, 2 lines).

### The Evening
- **Near town band** (s 0.25, `horizon.js makeNear`):
  - The facades come from the kit at 33 px a storey.
  - They are lifted behind a visible far street with 19 px passers-by, lamps and trees. This is the dollhouse fix.
  - Haze is up from 0.08 to 0.16.
  - The town band (s 0.18) has metric windows and storeys.
- **Grey band:** the road band (2600 px) wrapped from the lake on, which made a hard vertical seam. Its foot ended mid-air, and its rock was painted column by column, which made the grey streaks. Now:
  - The band is 4096 wide and 200 px deeper.
  - The crest light is applied only near the top.
  - The snow country is darker and painted in patches.
- **Roofs** (cols 248–282): painted as the top of a row of houses. Jo walks tiled ridges, with a gutter and the eaves' shadow. Below are facades with windows, down to the school yard. Also on the roofs:
  - chimneys (1.2 m)
  - skylights
  - the goat's chimney as a brick stack
- **Ridge:**
  - The treeline and ridge are a painted granite crag with snow ledges and an aurora rim. The end block becomes a peak, and the crag falls away past the world's edge.
  - The closing shot ends at zoom 0.72 with Jo in the lower-left third (59 px standing, about 40 seated). Bounds are removed for the shot and restored after.
  - The aurora is 2× brighter.
  - The town lights are a 64-dot cluster with a glow.
- **Baking** (`world.js bakeTerrain`):
  - The ~12,100 terrain tiles and grass, plus the roof block and the crag, are drawn into 30 render textures, one per 32 columns per depth.
  - The tiles keep their physics bodies but leave the display list. The hedge's breakable tiles stay live.
  - The ambient light tints whole chunks.
  - `?nobake=1` (dev only) restores the old path for comparison.

### Object counts and frame cost (same harness, stepped 60 frames, in-app browser)

| Place | Before: objects, ms/frame | After: objects, ms/frame |
|---|---|---|
| arch | 14,013, 5.55 | 1,930, 0.83 |
| square | 14,007, 6.07 | 1,945, 0.84 |
| roofs | 14,010, 6.58 | 1,941, 0.83 |
| station | 14,008, 7.46 | 1,926, 0.84 |
| lake | 14,009, 6.17 | 1,945, 1.12 |
| pines | 14,008, 5.91 | 1,934, 1.04 |
| ridge | 14,074, 6.68 | 2,003, 1.25 |

Every place sampled is under the 6,000 budget and also under the framework target of 2,500. I could not measure the real rAF frame rate, because the browser pane was hidden (background throttling). The numbers above are the stepped CPU cost per frame, which includes render submission.

## Lint and scenarios
- `npm run lint:scale` is clean: 189 measured, including 7 trees, 4 fronts and 5 backdrop rows. The new checks are in `scripts/lib/backdrop-check.js`:
  - every play-plane tree is ≥ 260 px and inside its class;
  - fronts are at 3 m a storey;
  - every row has storey = 132·s ± 10 %;
  - every row nearer than the far skyline has a ground line.
- New scenarios in `src/dev/scenarios/backdrops.js`:
  - `backdrop-scale` reads the runtime `ROW_LOG` and the on-screen trees across 11 places;
  - `evening-object-budget` checks ≤ 6,000 objects and logs ms/frame.
- Results:
  - `npm test`: 101/101.
  - `lint:content`: 0 failures.
  - `lint:rooms`: 0 failures.
  - `vite build`: ok.
  - Full scenario run: 76/76 pass, including `blend-continuity`, every `slope-*`, `readability-*` and `scale-*`, and `slope-gambler-floor-stairs`.

## Screenshots (`sheets/`)
- `wp4-before-evening.jpg` and `wp4-after-evening.jpg`: twelve Evening places.
- `wp4-before-dreams.jpg` and `wp4-after-dreams.jpg`: Chef, Musician, Astronaut, Writer, Painter ×3, Gambler, and the hub (before: the hub tile is the station).
- `wp4-evening-square.jpg`, `wp4-evening-roofs.jpg`, `wp4-evening-ridge-ending.jpg`, `wp4-painter-house.jpg`, `wp4-painter-cafe.jpg`.

## Known gaps
- The play-plane fronts and big trees stand behind the terrain at depth -10.6/-11.x. They are decoration only: no new doors or collision.
- The Painter café has a soft yellow halo from the scene's own paint/light pass. I did not chase it.
- The crossfade ghosting of sign layers (critique §11 WP4, `no-sign-ghost`) is not done.
- The Evening's road set pieces and ground-material changes are not done (framework phase 6).
- Interior parallax layers (walls, shelves) and their scenery keep their old sizes. Their "distance" is a room's far wall, not depth.
- The Astronaut night forest place was not warped to visually; it is covered only by the lint and the layer code.
- The end-of-world block on the ridge reads as a large wedge of rock in the closing shot. It is acceptable, but it could be redrawn when the Evening is rebuilt.
