# Dreamcatcher — Game Design Document

A 2D pixel-art platformer about chasing dreams, and discovering that the small
moments were the point all along. Inspired by the spirit of Pixar's *Soul*,
with an original protagonist.

## 1. Concept

- **Protagonist:** "Jo" — an original jazz-musician character (porkpie hat,
  glasses, warm smile). Inspired by, but legally distinct from, Joe Gardner.
- **Villain:** "The Counter" — an original abstract accountant-of-souls
  character (inspired by Terry's vibe: rigid, line-drawn, obsessed with tallies).
- **Core loop:** Pick a dream → play a platformer level with obstacles →
  catch the dream at the end → short reflective message → realize it wasn't
  enough → pick the next dream.
- **Arc:** Each dream level is slightly *darker* in tone and palette than the
  last. After 5 dreams comes the fixed villain fight, then the finale: a
  bright, calm, beautiful open world (sunset, butterflies, soft music) with no
  objectives — just being. The contrast IS the message.

## 2. Game structure

1. **Title screen** → Start / Continue (progress saved in browser localStorage).
2. **Tutorial level (fixed, same for everyone):** the game opens mid-life, not
   mid-menu. Jo walks through his ordinary neighborhood at dusk — a gentle
   level with no fail state that teaches every control naturally: a curb to
   jump, a low pipe to crouch under, a busker to interact with (X), a gap that
   invites the dash (Z). No one is asked "what's your dream?" — they just
   *play* until the street ends at **Crossroads Station**.
3. **Dream Hub — Crossroads Station:** a small walkable train station. Each
   platform has a waiting train, and each train's destination board names a
   dream. Walk to a platform, press X, and the train takes you into that
   dream level. Any order, player's choice.
   - Dream ideas: Musician on the big stage, Famous chef, Star athlete,
     Astronaut, Bestselling writer, Rich entrepreneur, Movie star,
     World traveler, Champion boxer, Renowned painter.
   - A caught dream's platform goes quiet: the board shows "CAUGHT", the
     train is gone, only the dream orb's faint glow remains.
   - At the far end of the station is a **locked service gate** stamped with
     tally marks — The Counter's gate. It unlocks once **at least 2 dreams**
     are caught. The station announcer (text card) makes the choice explicit:
     "Still chasing? Or is it enough?" Players may keep catching dreams (up
     to 5) or walk through the gate whenever they're ready.
   - The station itself dims one palette step per caught dream: fewer
     passengers, flickering lights, longer shadows.
4. **Dream levels (2–5 of ~8–10):** side-scrolling platformer, one themed
   level per dream (e.g. the chef level has kitchen-hazard obstacles, the
   musician level has a concert-hall setting).
   - End of level: the player literally *catches* a glowing dream orb.
   - Cutscene card: a short message — "You caught it… so why does it feel
     small? Maybe the next dream is the one." Then back to the station.
   - Each subsequent completed dream darkens the hub and level palettes one
     step (5 tint steps total).
5. **Villain fight (fixed, unlocked after 2+ dreams, mandatory after 5):**
   The Counter blocks the way,
   claiming Jo's count is up. Simple 3-phase boss: dodge projectiles
   (tally marks / stamps), hit weak points 3 times per phase.
6. **Infinite world (fixed finale):** big open 2D area, golden-hour palette,
   butterflies, falling leaves, gentle parallax sunset, calm music. No enemies,
   no timer, no objective — small interactions only (sit on a bench, water a
   plant, listen to a street musician, watch the sunset). A closing message:
   the dreams were never the destination.

## 3. Controls (keyboard, Mario-style — keep it simple)

| Input | Action |
|---|---|
| ← / → (or A/D) | Move left / right |
| ↑ / Space (or W) | Jump |
| ↓ (or S) | Crouch / sit |
| X | Action / interact (catch dream, hit boss, sit on bench) |
| Z | Dash or double-jump power (decide during prototyping) |
| Esc / P | Pause |

Gamepad support is optional, later.

## 4. Level design guidelines (keep it simple)

- Each dream level: ~2–3 minutes long, left-to-right, checkpoint at midpoint.
- Obstacles: pits, moving platforms, spikes/hazards, and 1–2 small enemy
  types per level themed to the dream (e.g. rolling pans and flame bursts in
  the chef level, harsh critics/spotlights in the musician level).
- **Lives: 3 per dream attempt.** Losing a life respawns Jo at the last
  checkpoint. Losing all 3 fails the dream: a message card asks
  *"Do you really want to pursue this dream?"* and Jo returns to Crossroads
  Station — free to retry the same dream (fresh 3 lives) or pick another.
  Failure costs the attempt, never overall progress.
- **Difficulty scales with dreams caught, not with the specific dream.**
  Because the player picks dreams in any order, each level reads a global
  difficulty tier (0–4 = dreams already caught): more enemies, faster
  hazards, tighter platform timing, shorter checkpoint invincibility. The
  1st dream anyone picks is gentle; the 5th is a real challenge — every
  catch feels earned, and the rising difficulty mirrors the darkening world.
- The boss fight has its own 3 lives; failing it also returns to the station.
- Reuse one shared platformer engine for all levels; only tilesets, hazards
  skins, and backgrounds change per dream. This is the single biggest
  simplicity win: 5 levels ≈ 1 engine + 5 data files.

## 5. Tone & art direction

- **Pixel art**, 16×16 or 32×32 tiles (decide in prototype).
- **Palette arc:** Hub and early dreams: normal, slightly muted colors.
  Each caught dream shifts palettes darker/desaturated (simple tint overlay).
  Villain fight: darkest, near-monochrome with the villain's stark blue-white
  lines. Infinite world: the ONLY fully bright scene — warm oranges, pinks,
  golds; particles (butterflies, leaves, fireflies); soft gradients.
- **Music:** jazzy motif in dream levels that degrades subtly as things
  darken; silence/tension for the boss; the full warm version of the motif in
  the infinite world. (Free assets or simple loops to start.)

## 6. Tech plan

- **Engine:** Phaser 3 (JavaScript, runs in the browser).
- **Build tool:** Vite (fast dev server, one-command build).
- **Levels:** Tiled map editor (free) → JSON files loaded by Phaser.
- **Save:** localStorage (which dreams caught, settings).
- **Hosting:** GitHub Pages — playable via a public link on every push.
- **Repo:** GitHub, main branch protected by habit: commit small, push often,
  roll back with git if anything breaks.

### Proposed repo layout

```
dreamcatcher/
├── DESIGN.md            ← this file
├── index.html
├── package.json
├── src/
│   ├── main.js          ← Phaser game config
│   ├── scenes/          ← Boot, Title, Hub, DreamLevel, BossFight, InfiniteWorld
│   ├── entities/        ← Player, enemies, dream orb, villain
│   └── data/            ← dreams.json (names, messages, palettes), level JSONs
├── assets/
│   ├── sprites/  tiles/  audio/
└── .github/workflows/deploy.yml   ← auto-deploy to GitHub Pages
```

## 7. Milestones

1. **M0 – Repo & skeleton:** git init, GitHub repo, Vite + Phaser hello-world
   (a rectangle that jumps on a platform), Pages deploy working.
2. **M1 – Platformer core:** movement, jumping, crouching, tile collision,
   checkpoints, hazards, lives/death/respawn, fail-the-dream flow.
   Placeholder art is fine.
3. **M2 – Tutorial + one full dream level:** the fixed opening street level,
   arrival at a basic Crossroads Station, one Tiled dream level, dream orb
   catch, end-of-level message card, return to the station.
4. **M3 – Station + 5 levels:** walkable station hub with train platforms,
   locked gate (opens at 2 dreams), progress saving, palette darkening and
   difficulty tier per completed dream, per-level theming.
5. **M4 – Boss fight:** The Counter, 3 phases.
6. **M5 – Infinite world:** open area, sunset/butterfly ambience, small
   interactions, closing message.
7. **M6 – Polish:** real pixel art pass, music/SFX, title screen, playtesting.

## 8. Explicitly out of scope (to stay simple)

- No mobile/touch controls (initially), no multiplayer, no dialogue trees,
  no inventory/upgrades, no procedural generation, no more than ~10 dreams.
