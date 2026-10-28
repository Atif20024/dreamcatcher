# The dream framework (phase 3a): how to author a dream

This is the manual for building a dream on the phase-3 framework. It is written for Part B (the Musician rebuild) and for every dream after it. The plan behind it is `03_architecture_plan.md` §2.1–2.4, §2.6, §2.10, §2.12, §2.13, §2.15, §2.19 and §4. The reference implementation is THE STOPPED HOUR (once the proof dream) in `src/dreams/clockmaker/`. Read it alongside this file: it uses every feature described here, in about 400 lines of data.

```
?warp=proof:start          the proof dream from its start (dev only; it is not on the hub board)
?warp=proof:clockhouse     any room id (or room:spawnId) works as the place
__dc.warp('proof', 'green')
```

## 1. What a dream is

A dream is data plus small modules, played by one scene, `src/scenes/DreamScene.js` (scene key `'Dream'`).

```
src/dreams/<id>/
  dream.js            the DreamDefinition (below): rooms, cast, objectives, backdrops, music, ending
  rooms/<room>.js     one file per room: grid, material, props, enclosure, backdrop, entities
  dialogue.js         CAST, CONVERSATIONS (scene box), BARKS (caption bar)
  beats.js            scripted story beats (BeatRunner steps)
  encounters/*.js     encounter definitions (engine + presenter + camera)
  verbs/*.js          verb modules (the dream's special action, ≤ 2 keys)
  materials.js        (optional) dream materials; the shared ones are in src/world/MaterialLibrary.js
  props.js            (optional) dream props; the shared ones are in src/art/props.js
```

Register the dream in `src/dreams/index.js` (`FRAMEWORK_DREAMS`). To start it:

```js
this.scene.start('Dream', { dreamId: 'musician' });              // from the hub
this.scene.start('Dream', { dreamId: 'musician', resume: true }); // Continue (the RunState)
```

The hub already starts dreams with `scene.start(d.scene, { levelKey: d.id, resume })`. `DreamScene.init` accepts `levelKey` as the dream id, so a dream moves to the framework when its entry in `src/data/dreams.js` gets `scene: 'Dream'`. Add a dev warp by adding `<id>: { scene: 'Dream', param: null, framework: true }` to `DREAM_WARP` in `src/dev/warp.js`.

### What DreamScene hosts

`DreamScene` extends `BaseLevel`. Every phase-1 service therefore works unchanged:
- hearts, knockback and the death card (`HealthModel`);
- labelled checkpoints (`CheckpointService`), drawn as a lantern post;
- the RunState save and Continue, keyed by the dream id;
- the pause menu, cards (`showCard`) and the ModalManager;
- the HUD on UIScene (`this.hud`), Teach cards (`showTutorial`, zone triggers) and gate signs.

On top of those it builds the following. Each one is a field on the scene:

| Field | Module | What it does |
|---|---|---|
| `graph` | `world/RoomGraph.js` | rooms placed in the world, portals, seam blends, the committed room |
| `streamer` | `world/RoomStreamer.js` | current room + neighbours live; baked layers, colliders, lights, entities |
| `transitions` | `world/TransitionDirector.js` | doors: fade, stream, place at the paired portal |
| `backdrop` | `world/BackdropDirector.js` | painted, tiled backdrop layers per room, crossfaded on t |
| `camDir` | `world/CameraDirector.js` | follow + look-ahead, room clamp (blended), pushed shots |
| `inputs` | `input/InputMap.js` | actions (keyboard + standard gamepad), suspend for beats |
| `caption` / `sceneBox` | `narrative/CaptionBar.js`, `SceneBox.js` | barks and radio / conversations with portraits |
| `barks` | `narrative/Barks.js` | data barks on the caption bar |
| `interaction` | `play/Interaction.js` | one [E] prompt at a time |
| `beats` | `play/BeatRunner.js` | scripted steps (awaitable) |
| `encounters` | `play/Encounters.js` + `encounterPresenters.js` | in-world minigames (engine/presenter split) |
| `ending` | `play/EndingSequence.js` | the shared ending with per-dream content |
| `music` | `audio/MusicDirector.js` (`StemMusic`) | four stems mixed by state |
| (module) | `audio/Ambience.js` | a loop per room, crossfaded on t |
| `footsteps`, `stingers` | `audio/Footsteps.js`, `Stingers.js` | steps by surface; event stingers |
| `perf` | `core/PerfBudget.js` (`PerfMonitor`) | live object / draw-call counts |
| `F` | (flags) | the run's flags, saved with the run |

**Jo in a framework dream.** Jo is ~82 px tall with an **82 px body** (`player.setBodyProfile('dream')`: 28×72 standing, 28×48 crouched, feet at `y + 22` as before). Legacy scenes keep the 24×44 body. He reads input through `player.inputMap`, so gamepads work. His tool is hidden unless `dream.tool` is set.

## 2. The DreamDefinition (`dream.js`)

```js
export default {
  id: 'proof', title: 'THE PROOF', enabled: true,
  hubListed: false,                 // true for real dreams (affects returnedFrom on exit)
  profile: { failure: 'default' | 'noFail', hud: 'default' | 'none', camera: { zoom: 1 } },
  rooms: [lane, green, clockhouse, yard],
  start: { room: 'lane', spawn: 'start' },     // a spawn entity id
  tool: null,                       // 'trumpet' to show Jo's tool (default hidden)
  verbs: [whistle],                 // verb modules
  beats, onStart: 'start',          // the beat played when the dream starts
  cast: CAST, conversations: CONVERSATIONS, barks: BARKS,
  encounters: { clockwork },
  objectives: { wind_clock: 'wind the clock in the clock house', /* id → text (≤ 64) */ },
  materials: {}, decorRules: {}, props: {}, palette: {},   // dream additions/overrides
  backdrops: { dusk_town: { /* see §5 */ } },
  music: { bpm: 80, root: 98, motif: [0, 4, 7, 9, 7, 4, 2, 4] },
  ambientLoop: 'dusk_lane',         // fallback for rooms without `ambience`
  runs: true,                       // false: no RunState (hub/evening profiles)
  ending: { /* see §9 */ },
};
```

## 3. Rooms (`rooms/<room>.js`)

```js
export default {
  id: 'green',
  origin: { tx: 44, ty: 0 },        // world placement in tiles. Seam rooms share an edge; door rooms go anywhere free
  grid: [ '....', '####' ],         // collision ASCII, legend.js roles (# solid, = one-way, / \ slopes, H ladder, | ribbed wall, ^ hazard, ~ liquid)
  material: 'meadow',               // the room's ground (§4)
  regions: [{ rect: [23, 13, 40, 15], material: 'mossy_stone' }],   // [x0,y0,x1,y1] inclusive, per-region materials
  decor: ['tufts_front'],           // extra decor rules on top of the materials' own fringe
  props: [ { prop: 'house_clock', x: 32, y: 13, dx: 16 }, ... ],    // §4.4
  lights: [{ x: 24, y: 4, r: 110, color: 0xffd890 }],               // extra glows (tiles)
  enclosure: { ... },               // §4.5
  light: { tint: 0xfff0e0 },        // a tint over the baked layers
  backdrop: { set: 'dusk_green', horizon: 16 } | null,              // horizon = the tile row of the ground line; null for interiors
  camera: { zoom: 1 },              // optional per-room zoom, blended on t across seams
  ambience: 'meadow_dusk',          // a loop from src/audio/synthLoops.js
  music: { state: 'explore', bpm?: 90 },
  objective: [ { text: 'find_lamplighter' }, { text: 'wind_clock', flag: 'met_wren' } ],  // ids or text; last matching wins
  titleCard: 'THE GREEN',           // shown once, on first entry
  entities: [ ... ],                // §3.2
};
```

### 3.1 Geometry rules (the lint enforces them)
- **Headroom: 3 tiles.** Every standing tile under a ceiling needs 3 clear tiles above it, because Jo's body is 72 px tall. The lint fails on 2-tile spans. A 1-tile gap is a crawl space and is ignored. Open sky is fine.
- Jumps: about 4.7 tiles up, about 8 tiles across at a run. The on-foot reachability check assumes 4 tiles up and 5 across.
- A room taller than the view (17 tiles at zoom 1) scrolls vertically. A room smaller than the view makes the camera zoom in until the room fills it, so there is never a void at the edges.
- Exteriors in the proof are 20 rows with the ground top at row 16. That shows about 2.5 rows of ground, enough to read the material and not so much that it dominates.
- Grid rows must all be the same length. Rooms must not overlap in the world.

### 3.2 Entities

Positions are room tiles. For anything that stands, `y` is the **standing tile**: the open tile whose floor is at `y + 1`.

```js
{ type: 'spawn', id: 'start', x: 3, y: 15 }
{ type: 'portal', id: 'lane>green', kind: 'seam', x: 43, y: 15, to: { room: 'green', portal: 'green<lane' }, seam: { prop: 'arch_hedge', width: 300 } }
{ type: 'portal', id: 'green>clock', kind: 'door', x: 33, y: 12, to: { room: 'clockhouse', portal: 'clock>green' }, door: { prompt: 'go in', fade: 250 } }
{ type: 'checkpoint', id: 'cp_green', label: 'THE GREEN', x: 6, y: 15 }            // label ≤ 24
{ type: 'npc', id: 'wren', rig: 'wren', x: 18, y: 15, facing: -1, task: 'idle_fidget',
  talk: [{ conv: 'wren_done', if: 'clock_wound' }, { conv: 'wren_after', if: 'met_wren' }, { conv: 'wren_first' }] }
{ type: 'gate', id: 'g_yard', x: 52, y: 10, h: 6, requires: ['clock_wound'], hint: 'OPENS WHEN THE CLOCK STRIKES' }   // y = top row; hint ≤ 40
{ type: 'encounter', id: 'clockwork', x: 24, y: 7, anchor: { x: 24, y: 4 }, prompt: 'wind the clock', unless: 'clock_wound' }
{ type: 'orb', id: 'orb', x: 24, y: 9 }                                              // touching it plays the ending
```

**Portals.** Portals come in pairs, and each one names its partner. A **seam** joins two rooms that share an edge. It is crossed on foot with no cut: the backdrop, the clamp, the zoom and the ambience blend on `t = smoothstep(edge − width, edge + width, camera x)`. It needs a physical seam prop (an arch, a fence, a tunnel mouth); the lint checks for it. Put the prop *inside* one room near the edge, because a prop is clipped to its room's canvas. A **door** fades through black (`door.fade` ms), streams the other room in and stands Jo at the partner portal facing into the room. Doors open on [E]. Name portals `from>to` and `to<from` by convention.

**Gates** are solid until every flag in `requires` is set. They then swing open, emit `gate:open` and stop colliding. The sign on the approach side names what opens it and ticks per requirement. Make a gate tall enough that it cannot be jumped (6 tiles from a floor), and keep ledges away from it.

**Checkpoints are global.** All of them are placed at scene start, so a resume or a respawn can use any of them. The scene streams in whatever room Jo wakes in.

## 4. Terrain: materials, decor, props, enclosure, baking

### 4.1 Materials (`world/MaterialLibrary.js`, painters in `art/materials/painters.js`)

```js
cobble_lane: { id: 'cobble_lane', kind: 'cobble', surface: 'stone',
  palette: { body, stone, mortar, lit, deep, moss, root },
  decor: ['weeds', 'pebbles', 'puddles', 'roots'] }       // the fringe this material grows
```

- **Kinds:** `cobble`, `meadow` (turf over loam), `stone` (dressed blocks, moss coping), `boards` (floor planks over joists), `plaster` (interior walls and ceilings).
- **Palette.** A material is a kind plus a palette, so new looks are mostly palettes. A new kind is a `{ body(ctx, v, P), lip(ctx, v, P) }` pair in `KINDS` (painters.js).
- **What gets painted.** Each sheet has 4 body variants, 4 lip variants (a top-exposed tile), 3 undersides, left and right edges, rounded lip caps, inner-corner and step shadows, one-way ledges and the slope pieces. Noise is periodic every 32 px, so tiles join without seams.
- **How a room is composed.** The pieces are composited per tile from `terrainRules.classifyTile` (lip, body, under, edges, caps, steps). `variantAt` hashes the variant and never repeats one 3 times in a row. Then three room-scale passes run:
  1. buried stones, roots and strata;
  2. a depth gradient below the *local* ground line;
  3. a low-frequency overlay wash.

  These are what stop the ground reading as a grid.
- **Footsteps.** `surface` drives them: `stone grass wood tile carpet metal`.

### 4.2 Decor rules (the fringe; `terrainRules.evaluateDecor`)

```js
{ id: 'tufts', when: 'topExposed', place: 'tuft_*', variants: 3, chance: 0.75, layer: 'mid' | 'fg', materials: ['meadow'], every: 3 }
```

- **`when`:**
  - `topExposed`: a lit lip;
  - `ledgeEdge`: a lip ending at a drop;
  - `ceilingExposed`: an open underside;
  - `wallBase`: a floor tile against a wall;
  - `hollow`: a dip of at most 4 tiles;
  - `cornerTop`: a ceiling corner;
  - `openFloor`: a floor tile with 3 tiles of air.
- **Decor sprites** (`art/materials/decor.js`): `tuft flower pebble roots ivy drip puddle web dust leaves moss_edge weed`, each with variants `_0.._n`.
- **Determinism.** The result is seeded per room, so the same room always grows the same fringe.
- **Layers.** `layer: 'fg'` draws in front of Jo: use it for tall grass at the feet, and sparingly.

### 4.3 Props (`art/props.js`)

A prop is a painted canvas: `{ w, h, anchor: [ax, ay], paint(ctx, w, h, P), light?: {x, y, r, color}, live? }`.
- **Shared props:**
  - exterior: lamp posts lit and dark, bench, barrel, crate, bush, tree, the two houses, two arches, signpost, fence, well, bell frame, lantern post;
  - interior: wall clock, night window, jar shelf, table and table set, chair, hanging lamp, cupboard, workbench, rug, pendulum case, wooden door.
- **Adding props.** A dream adds its own through `dream.props` (same shape).
- **Placement** (in room tiles):
  - `{ prop, x, y, dx?, dy?, scale?, flip?, layer: 'back' | 'mid' | 'fg', palette?, live?, when?, unless? }`.
  - **Floor props** (anchor y = 1) stand on the floor tile row `y`, with their bottom at `y × 32`. **Wall props** (anchor y = 0.5) are centred on tile `y`.
- **Static props** bake into the room's chunks. A prop with `live`, `when: 'flag'` or `unless: 'flag'` stays a live image, shown or hidden on its flag. Use this for lamps that come on, or an encounter's face. A prop's `light` becomes an additive glow that breathes, gated by the same flag.

### 4.4 Enclosure (`world/Enclosure.js`)

Rooms read as rooms because the enclosure frames them:

```js
enclosure: { backWall: 'panelled' | 'plaster', wainscot: true, posts: 7, ceiling: true, pillars: true,
             frames: [{ x: 3, y: 9, w: 2, h: 4 }], palette: { wall, wood, accent }, fgFoliage: [{ x, w }], fgAlpha? }
```

- **Interiors.** The back wall is painted behind everything: plaster, wallpaper, a panelled wainscot, a picture rail and posts. Lamp light pools on it, and the corners fall into shadow. The **foreground** carries a ceiling beam band with brackets, pillars just inside the side walls and door architraves (`frames`).
- **Exteriors.** Exteriors may take `fgFoliage`: dark bushes along the bottom edge for depth.

### 4.5 Baking and streaming

- **Baking.** Each room is painted once into three canvases (`back`, `mid` = terrain and fringe, `fg`). `StaticBaker` cuts them into chunks at most 1024 px wide, as textures. A room costs about 3–9 images plus its live props, lights and entities. The textures stay cached for the scene, so returning to a room is instant.
- **Painting cost.** Painting a room costs 10–100 ms. It happens when a room becomes a neighbour, before Jo can see it.
- **Collision.** Colliders are merged runs of solid tiles (zones), not one body per tile.

## 5. Backdrops (`world/BackdropDirector.js`, generators in `art/backdrops/painted.js`)

```js
backdrops: { dusk_town: {
  sky: { top, mid, bottom, sun?: { x, y, r, color }, stars: 24, clouds: 8, cloud, cloudLit, seed },
  palette: { sky, hill, house, roof, window, light, rim, deep, leaf, trunk, mist, mistA },
  layers: [ { kind: 'hills_town', f: 0.08, dy: -10, seed: 3 }, { kind: 'town_row', f: 0.22, dy: 24, palette: {...} }, { kind: 'hedge_line', f: 0.45, dy: 30 } ],
  landmark: { kind: 'bell_tower', x: 30, f: 0.25, dy: 10 },
  motes: 'fireflies' | 'dust', moteCount: 18 } }
```

- **Layer kinds:** `hills_town`, `town_row`, `tree_band`, `hedge_line`, `far_ridge`. Each paints once into a canvas 1024 px wide that tiles seamlessly, with aerial haze toward the sky colour, and is shown as a TileSprite: parallax `f` in x, pinned to the world horizon in y.
- **Sky.** One painted image per set.
- **Landmarks.** A landmark is one image per room, at its room column.
- **Blending.** Between seam rooms both sets are alive. The incoming sky is laid over the outgoing one at alpha t, the layers crossfade, and the horizon lerps (rate-limited) and snaps only on a door or a teleport.
- **Adding generators.** New generators go in `LAYERS` (painted.js), and the legacy `parallax.js` generators can be ported there. Keep layers at most 2× the viewport wide (the lint checks this).

## 6. Camera (`world/CameraDirector.js`)

- **Follow.** The base shot follows Jo with a look-ahead (72 px toward where he moves or faces), feet at 62% of the frame, and easing.
- **Clamp.** The view is clamped to the room. Across a seam it is clamped to both rooms blended on t, so it never snaps.
- **Zoom.** Zoom is the base zoom (`profile.camera.zoom`, 1.0 for the 82 px Jo) × the room zoom (lerped on t) × any pushed shots. It is raised automatically when a room is smaller than the view.
- **Shots:** `camDir.push({ zoom, focus: {x,y} | () => ({x,y}), ms })` returns a handle, and `camDir.pop(handle, ms)` releases it. Every shot eases in and out. The built-in shots:
  - talk: 1.25, between Jo and the speaker;
  - encounter: `def.camera.zoom`, on the anchor;
  - the ending vista: `ending.vista`.

## 7. Dialogue (`dialogue.js`)

```js
export const CAST = { wren: { name: 'WREN', portrait: 'portrait-wren', voicePitch: 1.3 } };
export const CONVERSATIONS = { wren_first: { id, channel: 'scene', camera: 'talk', replayable: false, cast: [...], nodes: {
  start: { who: 'wren', expr: 'smile', text: '…', next: 'j1' },
  j2: { who: 'jo', text: '…', choices: [{ text: "I'll seat them.", next: 'w3', set?, if? }, ...] },
  w3: { who: 'wren', text: '…', set: { met_wren: true }, effects: [{ objective: 'wind_clock' }, { beat: 'x' }], end: true } } } };
export const BARKS = [ { id, channel: 'caption', who, text, when: { near: 'npc:wren', r: 420, unless?, flag?, room? }, once: true, cooldown? } ];
```

- **Two channels.** The **SceneBox** carries conversations: a letterbox, the portrait (`portrait-<who>[-expr]` from the atlas), typewriter text at 40 cps with punctuation pauses and a voice tick, choices with a → cursor, and gamepad support through the InputMap. **It opens only on [E] or from a beat** (`{ talk: 'id' }`), never by proximity. The **CaptionBar** carries barks and radio: non-blocking, queued, with a portrait chip, and hidden while a scene box is up.
- **Not replaying.** A non-replayable conversation is marked seen in the flags (`_conv:<id>`, saved with the run). An NPC's `talk` list picks the first entry whose `if` holds and that is not used up. Barks are also once per run (`_bark:<id>`).
- **Node conditions.** A node or choice condition is `'flag'`, `'!flag'` or `{ flag, not }`.

## 8. Beats (`beats.js`, `play/BeatRunner.js`)

A beat is an array of steps. It is awaited step by step and cancelled when the scene shuts down.

```js
clock_done: [
  { set: 'clock_wound' },                                  // or { set: { a: 1, b: true } }
  { camera: { push: 1.2, to: 'anchor:clockwork', ms: 500 } },   // to: 'self' | 'npc:id' | 'anchor:encId' | {x,y}; { vista: 0.8 }; 'pop'
  { say: { who: 'jo', text: '…' } },                       // caption bar
  { wait: 1400 },
  { camera: 'pop' },
  { objective: 'back_out' },
  { sting: 'gate' },
]
```

- **All steps:** `say talk camera wait set objective music ('quiet'|'explore'|'tense'|'setpiece'|'ending') sting sfx hud ('hide'|'show') lock (bool) anim ({who, name}) spawn ({...entity, room?}) despawn (npcId) encounter (id → result in ctx.last) fade ('out'|'in', ms) ending if/then/else beat (inline another)`.
- **Adding a step.** A new step kind is one handler in `DreamScene.beatHandlers()`.
- **Where beats come from:** `dream.onStart`, `encounter.onWin`, a conversation effect `{ beat }`, or code (`scene.beats.play(id)`).

## 9. Encounters (`encounters/*.js`, `play/Encounters.js`)

```js
export default { id: 'clockwork', title: 'THE CLOCK', engine: clockwork, params: { gears: 3, speed: 140 },
  presenter: 'world' | 'modal', view: 'clockwork', camera: { zoom: 1.3 }, hint: '[E] when …', pose: 'interact', onWin: 'clock_done',
  keys: ['act1', 'confirm'], canLeave: true }
```

- **The engine** (`src/engines/*.js`) is pure logic, with no Phaser: `update(dt)`, `press(action) → outcome`, `state()`, `done`, `result`. It is unit-tested in Node (`tests/framework.test.js`). Part B: the Musician's `rhythm.js` logic becomes an engine of this shape.
- **The presenter** (`play/encounterPresenters.js`, under `PRESENTERS[view].world | .modal`) only draws `state()`. It returns `{ enter(state), render(state, outcome), outro(result) → Promise, destroy() }`.
- **World staging** is the default. Jo stops, the camera pushes to the anchor, the HUD tool slot carries the count, and the context line carries the hint. A modal presenter goes through the ModalManager.
- **Lifecycle:** `[E]` on the encounter entity → `encounters.start(id, { anchor })` → `update` every frame with the InputMap → exit → `onWin` beat if `result.ok`. [Esc] (`back`) steps away with `{ ok: false, left: true }`.

## 10. Verbs (`verbs/*.js`)

```js
export default { id: 'whistle', keys: ['act2'],            // ≤ 2 action keys (lint)
  create(ctx) {}, update(ctx, dt) { if (ctx.input.justDown('act2')) … }, onEvent?(ctx, evt), hudWidget?, teach?: ['card'] }
// ctx = { scene, player, input, state, flags, npcs(), services: { caption, interaction, beats } }
```

## 11. Input (`input/InputMap.js`)

The actions are `left right up down jump crouch act1 act2 confirm back pause`.

| Action | Keyboard | Gamepad (standard) |
|---|---|---|
| move | arrows / WASD | d-pad / left stick |
| jump | Space, W | A |
| act1 (interact) | E | X |
| act2 (verb) | Q | Y |
| confirm | X, E, Space, Enter | A, X |
| back | Esc, Backspace | B |
| pause | Esc | Start |

The API is `inputs.isDown / justDown / justUp`, `suspend(bool)` (beats, doors) and `bind(action, device, codes)` (remap). `label(action)` returns the key name for the device in use, which is what the prompts show. The scene polls the map once per frame (`inputs.poll()`).

## 12. Audio (`src/audio/`)

- **Buses:** `music ambience sfx ui` under the master gain. The music bus is 0 while music is off. Volumes come from `settings.volumes`.
- **Ambience.** `ambience.blend(a, b, t)`. The loops are synthesised in `synthLoops.js`: no downloads and nothing to credit.
  - Proof loops: `dusk_lane meadow_dusk clock_room bell_yard`.
  - Legacy loops: `sizzle tuning typewriter cicadas engines slots`. The legacy dreams now play their `ambientLoop` from `data/dreams.js` too.
  - A new loop is one function `(sampleRate) → Float32Array` in `LOOPS`.
- **Music.** `StemMusic` has four stems (`base pulse lead danger`), mixed by state:
  - states: `quiet explore tense setpiece ending silent`;
  - `dream.music = { bpm, root, motif }`;
  - a room's `music.state` or a `{ music }` beat step sets the state;
  - the beat clock is emitted on the scene as `'beat'`.

  Part B: the Musician's gig can keep the legacy `music.*` helpers, or add stems.
- **Footsteps.** The AnimationController's `footstep` contact events and the material `surface` under Jo's feet select the sound.
- **Stingers** fire on `checkpoint:lit gate:open objective:changed encounter:end dream:complete`.

## 13. The ending (`play/EndingSequence.js`)

```js
ending: { orb: true, record: true, title: 'THE LAMPS', lines: ['…', '…'], vista: 0.8, beat?: 'id', hold?: 1600, returnTo?: 'Hub', paint(ctx, w, h) { /* the image */ } }
```

The sequence runs in this order:
1. Control locks, and the camera pulls out onto the orb.
2. The orb rises, drifts to Jo and flashes, and `dream:complete` fires.
3. `completeDream(id)` runs (skipped when `record: false`, as in the proof).
4. The image beat: `paint` draws a 560×300 picture, framed, with the title and the dream's own lines typed under it.
5. "[E] Return to Crossroads Station".

Write each dream's own lines. "Was it enough?" belongs to the finale only (critique F#11).

## 14. Characters

- **NPCs** are rigs on the shared skeleton, like Jo (character-motion skill). The proof's Wren is `src/data/rigs/wren.js`, with `wren.poses.js` (Jo's cycles plus her own `talk`), `wren.portrait.js` (Jo's face construction, her features patched in, 3 expressions) and `src/art/characters/wren/manifest.js`. `npm run atlas` builds `public/atlas/wren.*` and `sheets/wren-*.png`.
- **The NPC actor.** `actors/Npc.js` draws a rig from its atlas, faces Jo when he is near, plays `talk` while it is the speaker, and runs its task loop (`task`) every few seconds.

## 14a. Ground, slopes and Jo's shadow (round 2)

- **Ground solver: `src/entities/ground.js`.** Arcade has no slopes, so everything that walks (Jo, foes, carts) asks `groundAt(...)` for the surface under its feet and is laid on it every frame. Slopes and stairs are therefore continuous: no launch at a crest, no airborne frames on a down-ramp, no push pose against a riser. Framework authors draw slopes and stair joins in the room tiles and get this for free; do not add per-scene slope code.
- **Shadow: `src/entities/PlayerShadow.js`.** Every player has `player.shadow`. A dream shapes it with `player.shadow.set({ tint, alpha, length, ... })` or declaratively through `def.shadow` (PlayerShadow options, merged over the palette default in `DreamScene`). It lies on whatever walkable surface is under Jo, shrinks and fades with height, and hides over a gap. Do not hand-place a shadow sprite.
- **Scenarios:** `src/dev/scenarios/round2.js` holds `slope-<place>` (no airborne frame or bad pose across every slope/stair join), `shadow-jump`, `shadow-gap`, `shadow-slope` and `shadow-places`. Run them after any room or physics change. `src/dev/scenarios/round2flow.js` covers the flow fixes: tool visibility (`def.tool` / `player.noTool`), the skippable hub opening, the dialogue key label (always `[E]`) and single signs.

## 15. Performance (`core/PerfBudget.js`, lint)

- **Runtime.** `scene.perf.sample()` returns `{ objects, ui, drawCalls, ok }`. Draw calls are estimated as batch breaks. The budget is 2,500 live objects and about 150 draw calls. The proof uses about 100–175 objects and 27–54 draw calls.
- **Static (the lint).** Per room: dynamic objects at most 800, painted height at most 2048 px, backdrop layers at most 2× the viewport.

## 16. Testing

- **Unit tests** (`npm test`):
  - `tests/framework.test.js`: RoomGraph, terrain rules and decor, BeatRunner, DialogueRunner, InputMap, the encounter engine/presenter split, PerfBudget;
  - `tests/dream-checks.test.js`: the lint on the proof and on broken copies of it.
- **Lint** (`npm run lint:content`). The framework section runs `scripts/lib/dream-checks.js` on every dream in `FRAMEWORK_DREAMS`. It checks portal pairs and seam props, room and on-foot reachability, headroom (3 tiles), standing spots, references, objectives, checkpoints, gate hints, verb keys and perf. All of these fail the run.
- **Scenarios** (`src/dev/scenarios/phase3.js`; `await __dc.runScenarios('proof-playthrough')`):
  - `proof-playthrough`: real inputs from the lane to the station, including the conversation, the door, the climb, the encounter, the gate, the hill and the orb;
  - `proof-seam-no-snap`: per-frame camera, zoom and layer continuity across the seam;
  - `proof-door`: fade, the paired portal and streaming, both ways;
  - `proof-talk-on-e`: proximity never opens the box, [E] does;
  - `proof-perf`: every room under budget, only neighbours live.
- **Harness notes.**
  - `__dc.run(n)` steps n frames *and lets promises settle between frames*. Beats, conversations, encounters and the ending are async, so use `run`, not `step`, when anything awaits.
  - The harness now drives Phaser's tweens from the step clock (they used to follow the wall clock), so tween `onComplete` callbacks fire under stepping.
  - `walkTo` in phase3.js is a reusable "walk there, hop when blocked, brake at the target" helper.

## 17. Known limits (for Part B)

- **Hub.** A framework dream is not on the hub board until its `data/dreams.js` entry points at `scene: 'Dream'`. The hub's return flow (`returnedFrom`) is unchanged.
- **Foes, coins and Teach cards.** There are no foe or coin entities in the framework yet. Part B ports them: `BaseLevel.initFoes/spawnPickups` expect legacy room objects (`wx`/`wy`/`room`), so an adapter from `entities` is needed. Teach zone triggers work, because `dreamOfScene` reads `scene.dreamDef.id`, but the cards live in `src/data/teach.js` with `dream: '<id>'`.
- **Ladders and on-foot reachability.** The reachability check ignores ladders (the proof has none). Add them to `reachableTiles` before relying on one.
- **Painting a new material kind** is code. A new palette for an existing kind is data.
- **Backdrops.** Only the five painted layer kinds exist. Port the `parallax.js` kinds the Musician needs (city, rain_city, theatre, fire_escape) into `painted.js`.
- **The body.** In the 82 px body, under a 2-tile ceiling Jo is stopped by the body itself (it does not fit). Design for 3 tiles.
