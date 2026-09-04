# TODO

## Astronaut — THE QUIET ABOVE (docs/dream_astronaut_quiet_above.md) — built, deviations
- [x] The full six-phase arc plays to the orb: gym (stat training) → the
      Board (rejection AND selection paths) → campus training → launch →
      station 0g → EVA → moon → crevasses → probe/core → crater rescue →
      winch → re-entry → the field. `dreams.astronaut = true` verified.
- [x] Stats (lungs/grip/legs/nerve, pips on the clipboard HUD): track laps,
      pool hoops in one breath (+ deep-end shard dive), the climbing wall's
      staggered crumbling holds to the bell (they re-chalk after 5s in the
      gym, not on the moon), and four boxing rounds — round 4 is Priya, won
      only by NOT swinging until she opens (the Nerve lesson).
- [x] Puzzle-boxes: P1 flashcards, P2 the Board (7 questions from Phase 1
      clues + the notebook, 3 strikes, stat minimum 3 (+1 at d≥2), the
      rigged letter, the grey twelve months), P3 momentum docking with a
      fuel budget and the depress checklist, P4 six-bolt hinge with the
      code plate and the floating bolt, plus the lander's thrust descent
      (soft/hard outcomes — hard costs a heart and the power budget).
- [x] Three gravities: 1g; 0g push-off/rails/hand-over-hand crawl (velocity
      crawl snags Arcade tile seams — the crawl moves the sprite directly);
      the EVA tether ([F] clips, taut line springs back, pushing off
      unclipped = the drift-away death against Earth); ⅙g bounds tuned so
      the 6/8/10-tile crevasses take real edge run-ups, sealed shafts with
      spikes so nobody slips under the world.
- [x] Suit: O₂ (40s + 10s×Lungs, refills at airlocks/lander), power (dust
      devils + tether reel drain it), punctures from sharp rocks (patch kit,
      30s), Tab visor (lightens the deep-shadow zones), the radio signal
      HUD (0 in the crater — the music stops), Priya carry twice (rain and
      ⅙g), the alarm silenced by [F] once she's conscious, the winch reel
      up the clear column (speed = Grip).
- [x] Coins: mission patch, worth 10, 55 placed (budget 45-55), the moon's
      pay only on the crevasse arcs; 2 shards (pool deep end, crater
      terrace + consolation). Lint 0/0.
- [x] Hub wiring: platform 6 runs THE QUIET ABOVE (replaces the 'pilot'
      working name), white LV-3 livery, conductor question, intro shot.
- [ ] Compressions vs the spec: the Study flashcards are P1 but not
      drag-labels; the cleaner escorts via the normal catch (no buffer
      cinematic); no thief-crow badge steal on the campus; the two-person
      tasks are [F]-then-[E] beats, not a full companion AI; the sim runs
      once, not three times; centrifuge G-lock is a darkening overlay; the
      moon walk-back to the lander doubles as the quiet coda (no separate
      descent for the return); music stems are the director's existing
      states, not the five-stem score; small moments m1/m2/m3 wired as
      interacts (postcard markers work) but not scripted vignettes.
- [ ] Difficulty hooks in (§7 partially): stat minimum 4 at d≥2, debris
      count +d, docking fuel −2/d. Not in: tether interval 4 at d≥2,
      crevasse +1 tile, second-year mandatory hard rooms.

## Collectibles (dreamcatcher-collectibles skill) — built, deviations
- [x] Coins (per-dream worth, bob/spin/magnet/combo stinger), wallet in the
      save, death scatter + 8s re-collect, heart shards (3 = +1 heart),
      HUD (coin count + $ under the objective, ✦ under hearts, satchel row).
- [x] Placement per the law: chef 66 coins (budget 60-80), musician 119 + up
      to 12 busking (budget 120-150); tiers, breadcrumbs, P1/P2/P5/P7
      patterns; 2 shards per dream with consolation coins.
- [x] Bilal's stall "THE EXPRESS" in the undercroft: tea 20, shards
      150/300/600, postcards 100, return ticket 250, six hats 50-400; all
      effects live (tea +1 heart next dream, ticket forgives one zero,
      postcard marks the moments, hat tints Jo). "Keep the change." at N=5.
      Pemberton's ledger + tally strokes under the gate counter; the
      busker's hat drops the station's one coin after the Duet.
- [x] Lint: per-screen "something to want", coin budgets, checkpoint free
      money, shard consolation, guarded story carryables.
- [ ] Key items are only PARTLY on the skill's model: saffron + gold leaf
      got pedestals/spotlight/pickup cards and the satchel HUD mirrors the
      carry slot, but the satchel-of-3, `Gate.requires('item:…')`, and the
      new items in references/dream-items.md (crate hook, stockpot lid,
      copper whisk, ticket spike, set list, fuse…) are not built.
- [ ] §3.9 difficulty-scaled placement (riskier coins at d≥2, no
      breadcrumbs at d≥3) not implemented.
- [ ] Only 2 shards per dream, not one per section; hub coin HUD shows a
      musician coin (the station "pays in busker change") — revisit.
- [ ] d5 studio coins ring the combo stinger during the silent run — decide
      whether coins there should be silent or removed.

## Crossroads Station (hub_crossroads_station.md) — built, deviations
- [x] The hub is the OPENING scene: no title screen and no Tutorial Street
      exist yet, so the game starts on the station's front steps in rain
      (the spec assumed the street ends there). Tutorial Street is still M3.
- [ ] Only Chef and Musician lines run. The other six platforms carry a
      red NOT IN SERVICE bar and a dark, unlit train; the board says DELAYED.
- [ ] THE LAST STOP boards to a placeholder card — The Counter (M4) is not
      built. The gate voice, chain drop and tally all work.
- [ ] Undercroft/roof are vertical zones of the five rooms, not separate
      rooms; the "luggage-room stairs" are a signed grate in the concourse
      (LEFT LUGGAGE, [↓] down) over a ladder. Bilal rides the dumbwaiter to
      Jo's floor only when Jo is near the café on the other level.
- [ ] No per-platform ambient loops yet (sizzle/tuning/pistol); music is the
      director's hub mix from the §4 table + the sweeper's hum at N=5.
- [ ] Tween timing cannot be verified in the stepped test harness (Phaser's
      tween clock reads the game loop's own delta); camera moves are chained
      by callbacks so nothing can overlap regardless of clock.

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
