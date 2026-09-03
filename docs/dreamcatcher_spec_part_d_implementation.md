# DREAMCATCHER — SPEC ADDENDUM: PART D — IMPLEMENTATION FOR THE ACTUAL STACK + REVISED C7

Replaces every "tech stack / implementation notes" section in `dreamcatcher_spec.md`, the chef doc, the musician doc, and Part C. **Do not add software.** Everything below is code.

---

## D1. Locked stack
- Phaser 3, **plain JavaScript ES modules**, Vite. No TypeScript. No binary assets.
- Canvas **960×540**, tiles **32px** (30×17 tiles per screen). All numbers in the other docs written in "tiles" stay the same; numbers written in px (jump 300, run 140, look-ahead 48, shake 2–8) are **doubled** for the 32px scale.
- Sprites: `src/utils/pixelart.js` string-art. Audio: `src/systems/audio.js` WebAudio synth. Darkening: tint overlay per zone. Lighting: glow circles. Keep all four.

---

## D2. One map format for every level
The chef grid and the musician row-builder are two ways of doing the same thing. Standardize on **grid + legend + objects** in `src/data/<dream>/rooms.js`, one entry per room (screen or multi-screen section):

```js
export default {
  id: 'line_1',
  section: 'the_line',
  grid: [
    '..............................',
    '..#####.........................',
    '.../===\\........P..G..........',
    '..#########^^^^#########......',
  ],
  objects: [
    { type: 'checkpoint', x: 3, y: 2, id: 'CP3' },
    { type: 'gate', x: 19, y: 2, id: 'g_line', requires: ['chef.ticket_rail'] },
    { type: 'npc', x: 10, y: 2, who: 'marguerite', dialogue: 'D3' },
    { type: 'foe', x: 22, y: 2, kind: 'pepper_mill', patrol: [18, 26] },
  ],
  music: { section: 'the_line', bpm: 110 },
  bg: { far: 'pans', mid: 'kitchen_wall', landmark: 'pass_window' },
};
```

**Legend (shared by all levels; the level's tileset decides how each looks):**
`#` solid · `=` one-way platform · `/` `\` 45° slope · `,` `.` 22.5° slope halves · `S` stair · `|` climbable wall (only tile that allows wall-jump/wall-slide) · `L` loose tile · `^` spikes/hazard-floor · `~` liquid (drown) · `H` ladder · `G` gate · `P` plate · `l` lever · `V` valve · `r` rope/chain pull · `B` breakable · `>` `<` conveyor · `A` staff anchor (musician) · `R` resonant (musician) · `.` empty.

Objects placed **in the object list**, not in `build*()` code. One generic `RoomBuilder.build(scene, room)` replaces `buildChef()`/`buildMusician()`; per-dream differences live in the tileset and the `kinds` registry (D4).

**Validation script** (`scripts/lint-rooms.js`, run by `npm run lint:rooms`): fails on three identical edge tiles in a row, a room with no landmark, a room with no slope/stair and no neighbor with one, a section with no `foe`, a `G` with no `requires` or plate, a solid wall of `#` with no `|` and no `G` between two rooms (anti-skip), a drop > 10 tiles with no `=`/ledge inside it.

---

## D3. Anti-box tiles with string-art (C1)
- **Autotile by neighbor mask.** Each solid/platform char resolves to one of 16 variants from its 4-neighbor mask (top/bottom/left/right solid?). `pixelart.js` gets a `tileset(name)` that returns 16 string-art variants for `#`, 4 for `=`, 2 each for slopes. Top-exposed tiles draw the **lip** (1 lighter row + 1 darker row under it). Left/right-exposed tiles draw the chipped edge.
- **Random edge variants.** Every exposed tile picks one of 3 "wear" variants seeded by `(x*7 + y*13) % 3` (deterministic, no flicker on reload).
- **Auto-supports.** After building, for every `=` or floating `#` with empty tiles beneath, `RoomBuilder` draws a **support column sprite** (theme: pipe, bracket, chain, table leg) straight down to the next solid tile or 4 tiles max, plus a 40%-alpha shadow strip on the tile row below the platform.
- **Slopes in Arcade physics.** Arcade has no slopes; handle in `Player.update()`: if the tile under Jo's feet is a slope, set `body.y` from the slope formula and keep `blocked.down = true`; treat slopes as non-colliding for the body. Enemies never walk slopes (patrol bounds stop at them).
- **Round props** are string-art with 3 shades + a rim highlight letter; a lint check warns if a prop grid uses only one letter.

---

## D4. Characters, enemies, interactables (C4, C5, C7)
`src/entities/` with one base per role, registered in `src/data/kinds.js` (`{ chef: { pepper_mill: PepperMill, ... }, musician: {...} }`):

- **`Npc`** — faces Jo within 4 tiles, shows speech-mark cue + name tag, palette must include Jo-blue letter `J`. Never moves toward Jo.
- **`Foe`** — see D6. Palette must include hazard-red letter `X` and must not include `J`. Eye pixel swaps to `X` on alert. Has `signatureIdle()`.
- **`Interactable`** — six subclasses (`Lever, Plate, Valve, Pull, Panel, Carryable`) sharing `glint()` (2-frame sparkle every 3 s), `nearBrighten()`, `promptIcon()`. `Panel` opens a puzzle-box scene by id and shows red/amber/green pulse.
- **`Gate`** — states `chained → opening → open`; `requires` flags or a linked `Plate`; timed variant shows a shrinking light bar. Plays "distant clank" when its flag flips anywhere in the level.
- A `pixelart.js` palette rule: letters `J` (Jo blue) and `X` (hazard red) are reserved globally; the lint script checks every character grid for misuse.

---

## D5. Animation with string-art (C1.2)
- `pixelart.js` gains `animation(name, [gridA, gridB, ...], fps)` and `flip`. Frame counts per C1.2 are targets; a frame may be a **generated variant** (offset rows by 1 px, swap 2 letters) to hit counts cheaply — e.g. idle breathing = shift the torso rows down 1 px on frames 4–8.
- **Hat and tool are separate sprites** attached to Jo with a 1-frame position lag (store last frame's position, apply it). On hurt, hat gets a small arc tween and returns.
- Squash/stretch: `tweens.add({ scaleX: 1.2, scaleY: 0.8, yoyo, duration: 70 })` on land; hit-stop = `scene.physics.world.pause()` for 60 ms.
- Deaths never delete the sprite: `Foe.die()` and `Player.die()` explode the string-art grid into per-pixel particles (`ParticleEmitter` fed the grid's colors) — "dream-dust."

---

## D6. Confrontation — REPLACES Part C §C7
Jo is a jazz musician chasing dreams; nobody in these dreams sword-fights. Enemies are **people and things in the way**: bouncers, cops, landlords, security, an angry sous-chef, a scalper, a pepper mill, a rat. The feeling we want is *"these people are real, they have a job, and I am in their way"* — not *"I killed them."*

### D6.1 Two foe classes
- **People** (`Foe.kind.human = true`): cannot be killed. Getting **caught** (their grab attack connects) = **thrown out**: a 1.5 s cinematic (they grab Jo, screen wipes, Jo lands at the last checkpoint, loses any carried item to where it was) and **−1 heart**. Old-school: one grab, no health bar on them, no chip damage.
- **Creatures & things** (`human = false`): rats, roaches, grease blobs, meringue puffs, wisps, walkers, carts. Stomp or one tool hit destroys them (dream-dust). A contact just pushes.

### D6.2 What the player can do to People
All with the level tool, all non-lethal, taught **just-in-time** the first time each is needed (D8):
- **Shove (X):** tool swing staggers them 1.5 s and pushes 1 tile. Big ones (bouncer, cop) don't stagger — the swing bounces off with a "clang," which is the cue to use something else.
- **Slip (crouch/slide under a grab):** every grab has a 0.4 s wind-up; sliding through their legs during it puts Jo behind them.
- **Distract:** throw the carried item / play a note / hit a resonant / drop the case → they walk to the noise for 3 s, back turned.
- **Hide:** marked hide spots (barrels, curtains, under counters) — enter with Down; foes lose sight after 2 s; their sight cone is drawn faintly so the player can read it.
- **Outrun:** people are slower than Jo on flat ground but faster on stairs. Chases are set pieces (scalper, landlord).
- **Trip:** knock a foe onto a `^`, `~`, `L` or `>` tile → they fall/slip/get carried off and are *removed from the room* (thrown out themselves). Environmental payoffs, never gore.
Every People-foe is placed on the critical path with **at least two** of these options valid, and one option always visible on screen (a hide spot, a resonant, a loose tile).

### D6.3 Death & harshness (old-school)
Fall ≥ 7 tiles, any trap (`^`, slicer, crusher), drowning, or a grab = **instant reset** to the last checkpoint with the death animation, **−1 heart**. Hearts are *lives per section*: at 0 hearts the whole section restarts (its gate re-chains) and hearts refill. Hearts +1 per dream caught (max 5). No health pickups except one hidden **heart-shard** per section (3 shards = +1 heart).

### D6.4 If a dream is about fighting
Only a dream whose theme *is* fighting (a boxer or athlete dream, if you build one) unlocks the full duel moveset from Part C §C7.2 as its **level mechanic**, taught inside that dream. Nowhere else.

---

## D7. Music, backgrounds, gating with this stack (C2, C3, C6)
- **`MusicDirector`** in `audio.js`: states `explore / danger / caught / quiet / setpiece`; each stem is a scheduler function with its own `GainNode`; state changes crossfade gains over 1 beat. `beatClock` derives from `audioCtx.currentTime` and the room's `bpm`; `scene.events.emit('beat', n)` every beat — hazards with `period` listen to it instead of `time.addEvent`. Stingers are short synth functions (checkpoint, gate, secret, foe-out, death chord).
- **Backgrounds:** three `TileSprite`s from string-art layers with scroll factors 0.2/0.5/0.8, a landmark sprite per room from `room.bg.landmark`, foreground layer at 1.2. Section change swaps `far`/`mid` and tweens the tint overlay color. "Vista" rooms set `cameras.main.zoomTo(0.8, 800)` on entry.
- **Gating:** wall-jump/wall-slide check reads the tile char (`|` only). `Gate` objects only; remove any room where progression relied on a bare `#` wall being jumped.

---

## D8. Just-in-time tutorials
`src/systems/tutorial.js`: the first time a save encounters a mechanic (`ledge_grab, hang_drop, careful_step, slide_under, shove, distract, hide, plate_gate, loose_tile, sound_bridge, call_response, rest_note`), freeze for a card: mechanic name, 3-word hint, key icon; dismiss on the key press. Store `seen[]` in the existing localStorage save. Never show twice. No sparring room before the hub.

---

## D9. Folder structure (target)
```
src/
  main.js
  scenes/   Boot, Hub, Dream, PuzzleBox, Dialogue, Pause
  systems/  audio.js (MusicDirector), tutorial.js, flags.js, save.js, camera.js, rhythm.js
  entities/ Player.js, Npc.js, Foe.js, Interactable.js, Gate.js, Hazard.js
  builders/ RoomBuilder.js, autotile.js, supports.js, parallax.js
  data/     kinds.js, palettes.js, chef/rooms.js, chef/tiles.js, chef/sprites.js,
            musician/rooms.js, musician/tiles.js, musician/sprites.js
  utils/    pixelart.js
scripts/    lint-rooms.js
```

## D10. Retrofit order (do in this sequence, commit after each)
1. `RoomBuilder` + shared legend; convert `chefMap.js` and `musicianData.js` to `rooms.js` format. Nothing visual changes yet.
2. `autotile.js` + `supports.js` + slopes → run the lint; fix every room until it passes.
3. `Interactable` glint + `Gate` states + `|` climbable rule → remove skip routes.
4. `Foe` rewrite per D6 (grab/caught/thrown-out, shove/slip/distract/hide/trip) + sight cones + first-encounter card.
5. `MusicDirector` states + beat clock; move every periodic hazard onto `beat`.
6. Backgrounds: parallax + landmark per room + vista rooms.
7. Animation frame targets + hat/tool lag + dream-dust deaths.
8. Just-in-time tutorial cards.
Then re-run every dream doc's acceptance checklist.
