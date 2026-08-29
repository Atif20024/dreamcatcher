# TODO

## Spec deviations (dreamcatcher_spec.md) — deliberate, revisit later
- Stack stays **JavaScript** (not TS), tiles stay 32px/960×540 (not 16px/640×360),
  maps are code-built text grids (not Tiled .tmj), art is code-generated pixel
  grids (no Aseprite atlases). Changing these is churn with no player-visible gain
  at this stage; migrate when a real art/asset pipeline exists.
- Audio is WebAudio-synthesized (SFX + generative bass/piano/trumpet stems),
  not Howler with recorded stems — no audio files exist yet.
- Palette darkening is a tint overlay, not a palette shader; lighting is glow
  sprites, not Light2D.
- Not yet implemented from Part A/B: ledge grab/climb, hit-stop, afterimage,
  Crate puzzle uses 2-crate weight plate (no 3-heights stacking), freezer
  carcass-pushing, fryer oil arcs, Bastien sprite (moment is text), decoy
  wave-2 uses glow only, dumbwaiter lever-ledges (weights sweep instead),
  gull thieves are circles, D1 intercom trigger, per-level 32-color palette
  discipline, "8 props per screen" density bar (partial), speedrun/first-time
  duration acceptance tests.

## Level quality bar (from playtest feedback, 2026-08-29)
Every dream level must be:
- [ ] LARGE — several screens wide (150+ tiles), vertical sections too.
- [ ] THEMED — background, tiles, obstacles, and enemies all specific to that
      dream (no generic reuse beyond the engine).
- [ ] UNIQUE — at least one mechanic that exists only in that level.
- [ ] DECENTLY COMPLEX — multi-step tasks, not just run-right-and-jump.

## Art polish (M6)
- [ ] Backdrop buildings look flat/repetitive — more silhouette variety
      (water towers, antennas, fire escapes), softer window glow, haze layers.
- [ ] Replace code-generated sprites with a real pixel-art pass (Jo animation
      frames, tiles, hazards).
- [ ] Add parallax depth layers (far skyline / near rooftops).

## Later
- [ ] Music + SFX (jazz motif that degrades as dreams are caught).
- [ ] Decide: stay with ASCII level maps or move to Tiled if levels outgrow
      text grids.
- [ ] Gamepad support.
