# TODO

## Part D — remaining work
All eight D10 retrofit steps are in. Still outstanding:
- [ ] Migrate the musician's abstract creatures (wisps, metronome walkers,
      bottles) onto `Foe` too — right now only the *people* use D6.
- [ ] Move the remaining periodic hazards (icicles, cold jets, pendulums,
      piping bags, moving heads) onto the beat clock; only the chef
      burners and vents ride it so far.
- [ ] Use the `Interactable`/`Gate` entity classes in the scenes — they
      exist and are exercised by the builders, but the scenes still use
      their own `addInteract` list and gate records.
- [x] `pixelart.js` frames + outlines; every foe has its own silhouette and
      a walk cycle stepped by distance travelled (entities/foeArt.js).
- [ ] Spec conflict noted: Part D lists '.' as both a 22.5° slope half and
      empty. Empty won; the halves are ',' and ';'.

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

## Musician spec deviations (dream_musician_big_stage.md) — revisit later
- [ ] Rhythm windows ±140ms (spec ±60) until an input-latency calibration
      screen exists; no Perfect/Good tiers yet.
- [ ] Trumpet/bass are synthesized, not sampled; pitch follows a scale
      pattern rather than per-phrase melodies.
- [ ] Cut/simplified: washing-line swings, coin-scatter wind, van interior
      rest screens (dialogue plays at map spots), lantern/firework scale,
      Delphine pavilion cameo is text-only, crowd wave animation, pyro and
      camera-crane hazards in songs 2/3, d≥3 checkpoint removal, Nia
      barrel/plank pathing (she walks or teleports on F), Day-6 riser
      lanes splitting per song.
- [ ] Small Moment #1/#3 are E-interacts rather than hidden scenes; the
      busking Kid uses an [E] prompt instead of ambient detection.

## Level quality bar (from playtest feedback, 2026-08-29)
Every dream level must be:
- [ ] LARGE — several screens wide (150+ tiles), vertical sections too.
- [ ] THEMED — background, tiles, obstacles, and enemies all specific to that
      dream (no generic reuse beyond the engine).
- [ ] UNIQUE — at least one mechanic that exists only in that level.
- [ ] DECENTLY COMPLEX — multi-step tasks, not just run-right-and-jump.

## Readability
- [x] One depth scale (builders/depths.js). The terrain used to sit above
      every prop a scene added without a depth, so those props were
      invisible. Backdrop and terrain are negative now; depth 0 is safe.
- [x] Aerial perspective on the backdrop (haze 0.62/0.74/0.86/1.0) so the
      play layer reads in front.
- [ ] Interactable props still use theme art without rims — give the ones
      that matter the same outline treatment the characters got.

## Art polish (M6)
- [x] Backdrops rebuilt: sky gradient + horizon-anchored layers, seven layer
      kinds (skyline/facade/wall/strip/hanging/railing/glow), 32 named
      background props cast per place, room-to-room crossfades.
- [ ] Replace code-generated sprites with a real pixel-art pass (Jo animation
      frames, tiles, hazards).
- [ ] Backdrop props are silhouettes — they could use interior detail and
      a haze band between the far and mid layers.

## Later
- [ ] Music + SFX (jazz motif that degrades as dreams are caught).
- [ ] Decide: stay with ASCII level maps or move to Tiled if levels outgrow
      text grids.
- [ ] Gamepad support.
