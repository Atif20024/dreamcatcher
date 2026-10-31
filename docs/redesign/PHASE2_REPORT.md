# Phase 2 report: character pipeline, Jo first

Branch `redesign`. Plan: `03_architecture_plan.md` §2.5, §2.17, §3.1, §4.6–4.7, §6 Phase 2. Owner decisions: see the end of `PHASE1_REPORT.md`.

**Milestone (plan):** "Jo moves with the full core set in every scene; the zero-g float uses `float`." This is met. The whole cast now comes from atlases built at build time. Jo is a code-drawn rig, about 82 px tall. Everyone else is a placeholder atlas under the same texture keys the code already used.

## 1. What changed

### 1.1 The atlas pipeline (`scripts/build-atlas.js`, `npm run atlas`)
- **No dependencies.** It has a pure-JS PNG codec (`scripts/lib/png.js`, using Node's zlib) and a raster, shelf-packer and extrusion module (`scripts/lib/raster.js`). There are no native builds.
- **Three sources, one output.** The output is `public/atlas/<pack>.png/.json` in Phaser JSON hash format, where each frame's custom pivot is the foot anchor, plus `public/atlas/index.json`.
  1. **Rigs.** `src/art/characters/<id>/manifest.js` plus `src/data/rigs/<rig>.js` (parts, palette, tone families, metrics), `<rig>.poses.js` (pose tables) and `<rig>.portrait.js`. The shared skeleton is `src/art/rig/human.js`, built on `src/art/rig/compose.js`. Heads, hat, torso, boots and hands are string grids. Limbs are shaded capsules: lit edge up-left, shade edge down-right, far limbs one tone darker, and a deep-tone inner line where a near limb crosses its own material. Legs use IK and arms use FK. A pose is about ten numbers.
  2. **Importer** (`scripts/lib/importer.js`). It reads `art-src/imported/<pack>/manifest.json`:
     - the licence is required;
     - grid sheets are sliced into named animations;
     - the anchor is given or found automatically (the foot);
     - optional palette snapping and scale.
     
     Credits are aggregated into `public/CREDITS.txt`. No pack uses it yet; it is unit-tested with a generated sheet.
  3. **Placeholders** (`scripts/lib/capture.js`). Today's runtime string-art for every other character runs headless. A fake Phaser scene records Graphics `fillRect` and canvas `fillRect`, `drawImage`, `globalAlpha`, a vertical gradient and `destination-out`. The output is packed under the same texture keys. `phaser` is stubbed for Node by a module hook (`scripts/lib/stub-loader.js`).
- **Review sheets** in `sheets/`:
  - `jo-<anim>.png` for every animation: frames on a ground line with 32 px tile ticks, the planted feet marked in red, and an onion skin in the last cell;
  - `jo-overview.png`;
  - `jo-portraits.png`;
  - `placeholders.png` (every placeholder, for review).
- **Hooked into `dev` and `build`.** `predev` and `prebuild` run `build-atlas.js --if-stale`, which skips when the hash of the inputs is unchanged. CI's `npm run build` therefore always ships fresh atlases. The generated atlases are committed too, so a bare `vite` still works.
- **The old hand-made `jo/foes/hub` atlases are replaced.** Nothing loaded them.
- **A bad manifest fails the build.** It is checked by `src/core/manifest.js`.
- **Fonts are not moved into the atlas.** They were already string-art rasterised at boot by `BitmapFonts`. This is deferred, as planned ("optionally").

### 1.2 Boot (`src/scenes/BootScene.js`)
- Boot is now the first scene. It loads `atlas/index.json`, then every pack, then registers them (`src/art/baked.js`). After that it starts the title, or the scene a dev warp asked for.
- **Placeholders are baked lazily.** `createPixelTexture`, `paintRig` and `paintSilhouette` first ask `bakeFromAtlas(scene, key)`. When the atlas has the key, the texture is cut from the atlas and flagged so painters leave it alone. Otherwise the old string-art paints it, as a fallback only. Game code keeps using the same keys and never branches on where art came from.
- **Harness.** `__dc.warp()` now waits for Boot (it stops scenes that are still pending too). `__dc.ready()` resolves once the atlases are loaded, and `runScenarios()` awaits it.

### 1.3 Characters and the AnimationController
`src/art/AnimationController.js` is pure JS and unit-tested in Node.
- **`resolveState(snapshot)`** maps physics, input and `body.blocked` to a state: `idle walk jog run crouch crouch_walk climb climb_idle wall_slide rise apex fall push carry_* float death pockets brush_hold`. Animation completion alone never changes the state.
- **`transitionInsert`** adds one-shots:
  - `skid`: input released at run speed;
  - `turn`: a reversal at speed (it uses the previous tick's velocity, because Jo's velocity flips in two ticks);
  - `run_start`: starting from idle;
  - `land` or `hard_land`: a drop of more than 5 tiles is hard (a full jump is about 4.7 tiles);
  - `jump_anticipate`;
  - `wall_jump`.
- **Fallback chains** come from the manifest, for example `skid → run → walk → idle`, `crouch_walk → walk`, `hard_land → land → idle`, `float → fall`. A missing animation is logged once.
- **Stride lock.**
  - Walk, jog, run, crouch-walk, carry-walk and brush-hold advance by ground covered: `phase += |dx| / scale / step`. Climb advances by vertical distance.
  - The pose tables move the planted foot back exactly `step` 1× px per frame:
    - walk: step 3, used below 110 px/s;
    - jog: step 7, used from 110 to 240 px/s (the Evening's 215);
    - run: step 7, with two contact and two airborne frames per foot; about 20 fps at 280 px/s.
- **Verbs.** `playOnce(name)` plays a forced verb (hurt, swing, interact, celebrate, wake) and returns a Promise. `hold(name)` and `release()` keep a held pose (trumpet, sitting, sleeping).
- **The world overrules one-shots.** Leaving the ground cuts grounded one-shots. Movement input cuts land, fidget and celebrate. Ducking under a ceiling cuts everything except death.
- **Facing.** Facing is `flipX`. Because each frame has a custom pivot, Phaser flips Jo about his feet.
- **Footsteps.** Footstep events on the contact frames drive the step sound, the dust and `stepEvent`, which the Evening listens to. A `skid` event raises dust.

### 1.4 Player and the scenes
- **Player.** `Player.js` keeps all its physics: coyote time, jump buffer, variable jump, wall rules, ladders.
  - Rendering moved to the controller: `this.art` shows `jo/<outfit>/side/<anim>/<NN>` at the feet.
  - The hat is its own atlas frame (`…/NN/hat`). It is shown one frame late at last frame's feet, so it keeps the lag, the shop tint and the knock tween.
  - The tool rides the rig's hand attach point. It uses the far hand, behind him, while he carries it, and the near hand, in front, while he uses it (swing, brush, pen, trumpet).
  - There are new scene-facing flags: `floating`, `carrying`, `pockets`, `walkOnly`, `toolPose`, `dead`. New methods: `pose(name, {ms})`, `showAnim(name)` for scenes that drive physics themselves, `handPos()` and `feet()`.
- **Every scene**:
  - **Hub, Chef, Musician, Writer, Painter, Gambler.** The full controller.
    - The swing key plays the dream's verb pose: Chef, Gambler and Astronaut `swing`, Painter `brush` (plus `brush_hold` while a ribbon is being laid), Writer `pen`.
    - The Musician holds `play_trumpet` while Q is held or a gig runs. The Gambler's Q plays it for 0.7 s.
    - In the Gambler, after the pawn, he idles with his hands in his pockets (`pockets`).
    - The Gambler's mirror ceiling reflects the atlas frame.
  - **Astronaut.** Zero-g and the pool play `float`, which can rotate; the angle comes from the scene, as before. The rail hold plays `climb_idle`.
  - **Painter currents.** `apex`.
  - **BaseLevel.**
    - A hit plays `hurt`.
    - Zero hearts plays `death`, a crumple to lying down, before the card.
    - Waking at the flag plays `wake`.
    - Lighting a checkpoint plays `celebrate`.
    - E plays `interact`. It is edge-detected, so it does not eat the scene's own key press.
  - **Evening.**
    - Sitting, sleeping, looking up, laughing and shrugging are held animations: `sit` on a bench, `sit_ground` on the grass, `sit_down`, `sit_up`, `sleep`, `look_up`, `laugh`, `shrug`.
    - Barefoot is the `bare` outfit, a build-time recolour.
    - The rim light copies the atlas frame.
    - Carried things ride his hand attach point.
    - The swing and rowboat seat use the atlas `sit` frame.
    - At 215 px/s he jogs. A stride-locked walk at that speed would be a shuffle.
  - **Intro.** The atlas walk, stepped by distance.
- **Dialogue portrait.**
  - `DialogueBox` shows Jo's face automatically for any entry named "Jo"/"JO" without a portrait. `mood: 'smile' | 'doubt' | 'tired'` picks the expression.
  - The Musician's existing `portrait: 'portrait-jo'` lines now resolve to the new face through an atlas alias.
  - Big portraits are fitted to the box's left column.

### 1.5 Jo's move set (46 animations, 868 atlas frames across 2 outfits, 385 unique)
- **Core:** idle (8, breath and blink), idle_fidget (8: hat brim, look back), walk 8, jog 8, run 8, run_start 3, skid 4, turn 3.
- **Jump:** jump_anticipate 2, rise 3, apex 2, fall 3, land 4, hard_land 6.
- **Movement:** crouch 3, crouch_walk 6, climb 8 plus climb_idle 1, wall_slide 2, wall_jump 3, push 6.
- **Carry and interact:** carry_idle 4, carry_walk 8, interact 6.
- **Hurt and death:** hurt 4, caught 8 (flail, lifted, thrown), death 8, wake 4.
- **Other:** celebrate 8, float 4.
- **Tools:** play_trumpet 6, swing 6, pen 4, type 4, brush 5, brush_hold 8, pockets 6.
- **Evening:** sit_down 4, sit 2, sit_ground 2, sit_up 2, sleep 2, look_up 2, laugh 4, shrug 3, wave 4.

Of the skill's P0 and P1 set, these are **not authored**:
- ledge grab, hang and pull-up: there is no mechanic, and the card was deleted in phase 1;
- slide;
- hide in cover;
- sit-talk gestures (nod, point);
- knockback as separate frames (hurt covers it).

`caught`, `type` and `wave` are authored but no game event calls them yet. There is no grab mechanic; the Writer's typing is a minigame screen.

## 2. Size and headroom: the approach

**Decision: keep the legacy 24×44 collision body for every existing dream, draw the 82 px sprite on top of it with the feet aligned, and duck under low ceilings. Report the low spans as the phase 3/5 work list.**

- **The body is unchanged** (`LEGACY_BODY` in `Player.js`). Every jump distance, gap, gate and corridor the dreams were built and tested for behaves exactly as before. All six dreams, the hub and the Evening stay completable with no content edits. The route scenarios check this (see §4).
- **Ducking.** The drawing is about twice the body's height. `Player.lowCeiling()` looks for a solid tile within the drawing's height above his feet. If it finds one, the controller plays `crouch` or `crouch_walk`, which is about 62 px and fits a 2-tile corridor, instead of standing up into it. Crouching wins over every one-shot except death.
- **Trade-offs, honestly.**
  - The hitbox is shorter than the drawing (44 of 82 px). A projectile at head height can pass through his hat.
  - In the air, a jump into a 2-tile ceiling can show his hat overlapping the ceiling for a few frames. Ducking applies only on the ground.
  - Contact with foes is judged by the old body, so a foe that reaches the drawn head does not hit.
  - None of these has shown up as a problem in play. They are the reason the rooms must be rebuilt for the new size rather than living with the flag forever.
- **Rejected alternatives.**
  - Growing the body to about 72 px would break measured jumps and every 2-tile passage.
  - A larger camera zoom does not change fit, only apparent size.
- **Lint.** `scripts/lib/rooms-check.js` has a new headroom rule. A standing human needs 3 clear tiles (96 px). Every floor span with exactly 2 clear tiles is a warning. A 1-tile gap is a crawl space nobody could ever stand in, and is not counted. No span blocks progress today, because the body fits 2 tiles. The work list for phases 3 and 5 is 15 rooms (row = the tile row he stands in; c = columns):

| Dream | Room | Spans with 2-tile headroom |
|---|---|---|
| chef | alley_dock | r33 c13, r33 c16–21, r33 c24–29, r33 c36–41 |
| chef | freezer | r21 c45, r33 c2–6, r33 c14–18, r33 c38, r33 c43–44 |
| chef | the_line | r26 c49, r33 c2–26, r33 c36–41 |
| chef | the_pass | r33 c7–9, r33 c15–17, r33 c23–25, r33 c31–36 |
| musician | d2_corner | r29 c22, r32 c21, r32 c53, r35 c20–21, r35 c53–54 |
| musician | d3_basement | r35 c9–10, r35 c15–16, r35 c30–31 |
| musician | d6_stage | r35 c2–3 |
| astronaut | p1_track | r35 c9, r35 c32 |
| astronaut | p1_pool | r41 c13–14 |
| astronaut | p1_wall_ring | r35 c11, r35 c21 |
| astronaut | p5_moonfield | r35 c36–42, r35 c45 |
| writer | attic | r23 c21 |
| writer | cafe | r28 c16–17, r31 c33 |
| painter | studio | r14 c14–18 |
| painter | petition | r32 c36 |

The Chef kitchen counters (row 33) are the bulk of it. When a dream is rebuilt to the new size in phase 3 or 5, the body grows to match the drawing (about 28×72) and that dream drops the legacy flag.

## 3. Art review: an honest assessment
I looked at every strip in `sheets/` and at Jo in play in the hub, Chef, Writer, Gambler, Astronaut and Evening. I fixed what read wrong along the way: the trumpet hold, ground sitting, the tool covering his chest, and the turn not firing.

- **Does he read as a person with weight?** Yes, at game scale.
  - **Walk.** The four key poses are there: contact, recoil, passing, high. The hips bob −1/0/+1, the head lags a frame, and the arms oppose the legs. The feet plant: the contact marks sit exactly one step apart, and the in-game check measures 0 px drift.
  - **Run.** A forward lean, pumping bent arms, and two airborne frames per stride. It reads as a sprint.
  - **Landings.** The hard landing (knees, hands down, hat tipped, plus the squash) has real weight. The soft landing is brief.
  - **Death.** Clear: he crumples to his knees and tips over.
  - **Celebrate.** He hops with the hat raised.
  - The silhouette stays readable on the dark Gambler street and the bright Evening.
- **Weaknesses.**
  1. **The torso is narrow and boxy in profile.** He reads slim, a bit like a teenager. The chest and shoulders need two more columns and a rounder back.
  2. **Arms are thin capsules.** Elbows read but hands are 2×2 dots, so gestures (shrug, wave, trumpet) read only through arm angle. The trumpet pose looks a little like a salute until the horn sprite is in his hand.
  3. **Rotated frames are rough.** The last death frames and `caught`'s thrown frames are nearest-neighbour rotations of the composed figure, with jaggies and a body that dips into the ground for one frame. They are passable for fast frames.
  4. **The face in profile is mostly the glasses lens.** Expressions in-game (wince, laugh, blow) are 1–2 pixel changes and are only just visible.
  5. **Placeholders are at the old 44 px.** Next to an 82 px Jo they look like children. Pemberton, Ro and Bilal stand chest-high to him. This is the most visible inconsistency on screen, and it is expected until the cast gets rigs (P1/P2).
- **Portrait (the art-source proof point).**
  - **Neutral and smile:** good. The hat with its red band, the glasses with glints and the collar make it clearly the same Jo.
  - **Doubt:** readable. One brow is raised and the mouth is offset.
  - **Tired:** muddy. The heavy lids read more like sunglasses.
  - **The verdict:** a 32×32 face drawn in code is an acceptable 16-bit-style dialogue portrait. It is not illustration-grade. It holds up for neutral and smile and falls off on subtler emotions (tired, afraid, crying). Code-drawn faces will plateau here, so **I recommend the owner moves portraits to an outside source (plan option d3) when the expression set grows.** The importer is ready for it: drop the sheet in `art-src/imported/<pack>/` with an `aliases` map, for example `"portrait-jo-tired": "jo/portrait/tired"`, and the dialogue box picks it up with no code change.

## 4. Verification
- `npm run atlas`:
  - Jo: 868 frames (385 unique) in 2048×1024;
  - cast: 1,478 frames in 2048×1024;
  - foes: 95 frames in 2048×128;
  - Jo's manifest validates.
- `npx vite build`: OK. `prebuild` reports that the atlas is up to date. There are no `[dev]` strings in `dist`.
- `npm test`: 61 passing (13 new in `tests/characters.test.js`):
  - the manifest validator: Jo is valid, and broken manifests are rejected for anchor, idle, step, cycles, refs, events and fps;
  - the controller's state → animation mapping and inserts, the fallback chain and its logging, skid → idle, the run stride lock (one frame per step), footstep events and a forced verb resolving;
  - Jo's height (78–88 px) and leg share (≥ 40%);
  - the walk contacts move exactly one step per frame;
  - the importer.
- `npm run lint:content`: 0 failures. There are 37 warnings: the 22 old geometry warnings plus the 15 headroom rooms above.
- **Harness** (`src/dev/scenarios/phase2.js`): every scenario returns its frame strip, and all pass.
  - `jo-walk`, `jo-skid`, `jo-turn`, `jo-jump-arc` (anticipation → rise → apex → fall → land, in order), `jo-land-soft-hard` (a hop lands soft; a 6-tile drop lands hard), `jo-float` (station zero-g plays `float` and never `run`).
  - `jo-foot-slide`: at each stride-frame boundary, the planted foot's world x (body x at the exact boundary plus the frame's contact offset) drifts 0 px for run, walk and jog, against a limit of 2 px.
  - `jo-route-<dream>` for the hub, chef, musician, astronaut, writer, painter, gambler and evening: Jo runs right from the spawn and hops when blocked, for 17–61 tiles. He never stands with his drawn head in a ceiling (0 clips); in the Painter he ducked 8 times.
- **Full suite: 29/29 pass** (the 14 earlier scenarios plus the 15 new ones), run from `?notitle=1`. Along the way:
  - one frame of `celebrate` under the Chef dock's low ceiling was fixed by letting a duck cut every pose except death;
  - `background-snap` failed only because test runs my scenarios had saved resumed the Gambler at a flag instead of the warp's place. The phase 2 scenarios now leave the save as they found it.
- **Browser** (my own tab, music off):
  - Jo idle and jumping in the hub;
  - running in the Chef street and the Writer's attic;
  - a hard landing in the Gambler arrival;
  - jogging in the Evening with the rim light;
  - sitting on the grass barefoot;
  - the portrait in a Gambler dialogue (`mood: 'doubt'`).

## 5. Placeholder count
1,573 placeholder frames (1,478 cast + 95 foe) cover every NPC, crowd person, animal, foe, NPC portrait and Jo's tools in every dream. One texture stays runtime-painted: `wr-editor`, the Writer's Inner Editor ghost, which uses `putImageData`. Silhouettes (`hub-traveler`) are captured.

## 6. Deferred
- **Rigs for the speaking cast and crowd** (P1/P2). The placeholders are at the old scale. The rig, poses, importer and controller are ready: a new character is a parts file, a palette and pose tables.
- **Hitbox growth per dream** once rooms are rebuilt for 3-tile headroom (phases 3 and 5), and retiring the legacy-body flag.
- **The art fixes from §3:** a wider torso, hands with a thumb, the rotated frames redrawn as poses, and a stronger face in profile.
- **Not authored:** ledge grab, hang and pull-up (no mechanic), slide, hide, talk gestures, the per-dream extras (stir, case open, rail crawl, tether reel, moon bound, swim, card play, pet the dog).
- **Events with no animation call yet:** `caught` (no grab mechanic), `type` (the Writer's typewriter is a screen) and `wave`.
- **The Gambler poker table's mini-portraits** (`portrait-jo`, `portrait-jo-brow`) still use the old 10×10 placeholder faces. The dialogue box uses the new face.
- **Lazy per-dream packs, a watch mode, fonts in the atlas, outfit variants** beyond barefoot (chef whites, EVA suit), and the crowd builder.
- **The plan's "dev overlay counts placeholders"** exists only as `artStats()` in `src/art/baked.js`. There is no on-screen overlay yet.
