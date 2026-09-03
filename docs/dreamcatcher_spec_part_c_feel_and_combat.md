# DREAMCATCHER — SPEC ADDENDUM: PART C — FEEL, READABILITY & COMBAT STANDARD

Append this to `dreamcatcher_spec.md` after Part A. It **overrides** anything in Part A or in any dream spec that conflicts. Every existing and future level must be retrofitted to pass Section C9.

**Reference feel:** early cinematic platformers — deliberate, weighty movement; every jump is a decision; rooms are built from real architecture with height, depth, and support; enemies are fought, not bumped; traps are read, not memorized. We are not copying any game's art, characters, or levels — only the *discipline*.

---

## C1. Shapes & animation — nothing is a box

### C1.1 Tile construction rules
- **No platform is a flat rectangle.** Every walkable surface has: a *top lip* tile (1–2 px overhang), a *body* with visible material (brick courses, wood grain, tile grout, metal rivets), *supports* below it (columns, brackets, chains, struts, legs) that reach the ground or a wall, and a *shadow* cast on whatever is beneath (a 40% dark tile row).
- **Slopes exist.** Every tileset ships 22.5° and 45° ramp tiles, both directions, plus stair tiles. At least 20% of a level's floor length must be non-flat (ramps, stairs, rubble mounds, sagging planks).
- **Edges break.** Every tileset has chipped-edge, cracked, moss/rust/grease variants and a "collapsed" corner. Level builders must vary edge tiles — three identical edge tiles in a row is a lint error (write a Tiled validation script that flags it).
- **Walls have depth.** Walls use a 3-band scheme: front face, inset shadow band (2 tiles), and a far wall behind at parallax 0.9 so rooms read as rooms, not lines.
- **Round things are round.** Pipes, pots, barrels, drums, wheels, lamps: drawn with curvature and highlight, minimum 3 shades + rim light.
- **Props are not axis-aligned.** Leaning ladders, tilted signs, hanging things at rest angles, cloth with folds. A prop that is a perfect rectangle is a crate — and crates get straps, stencils, and a dent.

### C1.2 Animation minimums (frames at 12 fps unless noted)
- **Jo:** idle 8 (breath cycle) + 2 fidget variants; run 12 with head bob and arm swing; run-start 3; run-stop skid 4; turn-around 3 (visible weight shift); jump-anticipation 2 (crouch) — jump-rise 3 — apex 2 — fall 3 — land 4 (squash) — hard-land 6 (knees buckle, hat tips); **careful-step** 8 (walking to a ledge edge); **ledge-grab** 3, **hang** 4 (swaying), **pull-up** 6, **hang-drop** 3; wall-slide 2; crouch 3; slide 5; climb 8; hurt 4 (knockback + hat flies off, returns); death by fall 8 (crumple), death by hit 8, death by trap 8 (per trap type); push 6; carry-run 12; interact 6; **combat:** guard 2, strike 6 (anticipation-hit-recovery), parry 4, hit-flinch 3, counter 8, stagger 5, victory 8.
- **Every enemy:** idle 6, walk 8, alert 3 (notice Jo — an exclamation motion, not an icon), attack-anticipation 3 (**always** readable, 0.4 s), attack 4, recovery 3, block 2, hurt 3, stagger 4, death 8, plus a unique "signature" idle behavior (a heckler drinks, a crawler cleans antennae, a roadie wipes sweat).
- **Environment:** torches/lamps 8-frame flicker + light radius jitter; cloth 8; chains 6; water/liquid surface 8 with reflection distortion; steam/smoke as particle emitters not sprite loops; dust motes in every lit room; birds/insects/rats as background critters with 2 behaviors each.
- **Secondary motion everywhere:** Jo's hat lags his head by 1 frame; his case/instrument swings on landing; enemies' clothing trails; a torch dropped keeps burning on the floor.
- **Feel effects:** hit-stop 60 ms on every hit given or taken; screen shake 2–8 px scaled by impact; squash/stretch on land (x1.2/y0.8 → recover 4 frames); afterimages on dash/counter; sparks on metal-on-metal; blood is replaced by "dream-dust" (palette-colored particles) for every character death.

---

## C2. Music — it must move with the level

- **Stems, not loops.** Every level ships 4–6 stems at one BPM per section (or a tempo-mapped set). A `MusicDirector` crossfades stems on section triggers and on state: `explore` (2 stems), `danger` (add a tension stem when an enemy is alerted or Jo is on a collapsing structure), `combat` (add percussion + horn stabs within 1 beat), `quiet` (drop to one stem inside secret rooms, Small Moments, and after deaths), `set-piece` (all stems).
- **Beat-synced world.** Hazards with a period (burners, stompers, pendulums, gates) lock to the beat grid. The world *is* the metronome. Players learn timing by ear.
- **Stingers.** One-shot musical hits on: checkpoint, gate opening, secret found, enemy death, Jo death (a wrong chord), puzzle solved. Never a UI beep — always an instrument from the level's palette.
- **Silence is an instrument.** Each level has at least one deliberately silent stretch (rooms with only ambience), and music always cuts to ambience for 2 s after a death before rebuilding.
- **Section identity.** No two sections in a level share the same lead instrument. Write the stem plan per section in each dream doc (the chef and musician docs already do this — implement it, don't loop one track).

---

## C3. Backgrounds — every screen must be somewhere

- **The Landmark Rule:** every screen has **one unique landmark** in the mid or far layer (a clock tower, a giant pot, a crane, a stained window, a wreck, a poster wall) that appears on no other screen. A player shown any screen in isolation must be able to say where in the level it is.
- **Sections change the far layer.** Crossing a section boundary changes at least 2 of the 3 parallax layers and the ambient tint. Within a section, the near layer changes every screen (different props, different clutter density).
- **Time and weather move.** Long levels advance time-of-day across sections (sky gradient, shadow length/direction, lamp states). Rain/snow/dust intensity ramps rather than toggling.
- **Vista rooms.** Each level has 1–2 "reveal" screens: the camera pulls back (zoom 0.8) to show the whole space ahead — the full kitchen line, the festival field, the freezer's depth — before the player enters it. Height and distance must be visible *before* they're dangerous.
- **Depth cues:** foreground silhouettes at 1.2 parallax; fog/haze on far layers; light shafts; things *behind* platforms visible through gaps.

---

## C4. Friend or foe — readable in one frame

**Shape language (mandatory, applies to every character in the game):**
| | Friendly / interact | Hostile |
|---|---|---|
| Posture | open, upright, faces Jo when near, hands visible | hunched or forward-leaning, hands hidden or holding something |
| Eyes | visible whites, blink | a single warm-white glint that turns **red** on alert |
| Color | shares 1 accent color with Jo's palette (his blue) | never uses Jo's blue; uses the level's "hazard" accent (same red as the red burners / warning frames) |
| Motion | never moves toward Jo unless called | *always* moves toward Jo once alerted |
| Proximity cue | a small **speech-mark** icon fades in above their head + soft chime; name tag appears | a **sword** icon flashes once + low drum hit; a thin red arc shows attack range |
| Outline | none | 1 px dark outline (they're "harder" in the world) |
- **Neutral NPCs** (background workers, crowd) have no proximity cue and are drawn at 80% saturation so they read as scenery.
- **Nothing hurts on touch except hazards.** Humanoid and creature enemies deal damage only with a telegraphed attack (C7). Contact just pushes.
- **First-encounter card:** the first time any enemy type appears, a 1.5 s slow-mo with its name and a 3-word hint ("Pepper Mill — block the spray").

---

## C5. Interactables — visible, consistent, never accidental

- **Shared vocabulary, themed skin.** The whole game uses six interactable archetypes, each with one silhouette that never changes, only its material: **Lever** (vertical handle), **Plate** (raised floor slab), **Valve** (wheel), **Hanging pull** (rope/chain with a ring), **Panel** (framed rectangle with a light) → opens a puzzle-box, **Carryable** (small, sits on a stand/pedestal with a spotlight).
- **The glint rule:** every interactable emits a 2-frame sparkle every 3 s at idle, brightens (+20% value) within 3 tiles, and shows its action icon within 1 tile. Puzzle Panels have a slowly pulsing light: red = locked, amber = available, green = solved.
- **Resonant / reactive scenery** (musician level etc.) is marked by a faint animated shimmer in its outline — always, not only on proximity.
- **Locked things say why.** A locked door shows a padlock + the icon of what opens it (a plate icon, a key icon, an "objective" ribbon). No mystery locks.
- **Secrets are hinted, never invisible:** a hairline crack, a draft of particles from a gap, a slightly different tile, a sound. Invisible walls do not exist anywhere in the game.
- **Destructibles** (breakable crates, glass, brittle walls) use the "cracked" edge variant and puff dust when Jo lands near them.

---

## C6. Gating — progress is earned through doors, not exploits

- **Wall-jump only on marked surfaces.** Introduce a `climbable` tile flag: rough stone, chain-link, ivy, pipe racks, scaffolding. Every other wall is smooth: Jo slides down and cannot wall-jump. Ceilings are solid; no room can be exited over the top.
- **Gates.** Every section exit is a physical gate with a state animation: chained (needs objective flag) → grinding open (2 s, dust, sound) → open. Sub-rooms use **timed gates**: a plate raises a portcullis for N seconds (N shown as a shrinking light bar on the gate); the player must reach it before it drops. Close-plates (the opposite: step on it and a gate slams) exist as traps.
- **One-way drops** are explicit: a broken floor edge with a visible "no return" (rubble below, a ledge too high to grab). The camera pans down to show the landing before the drop is committed (hold Down 0.5 s = peek).
- **Objective-locked doors** display the objective ribbon icon; when the flag flips anywhere in the level, the door's lamp turns green and a distant "clank" plays so the player knows to return.
- **Anti-skip test:** a "chaos bot" that mashes jump/wall-jump for 10 minutes per room must never leave the room except through a gate.

---

## C7. Combat — enemies stand in the way and can be beaten

### C7.1 Jo's weapon
Jo fights with the **level tool** (ladle in the chef dream, trumpet in the musician dream, etc.). All tools share one moveset and hitbox timing; only the sprite and sound change.

### C7.2 Duel mode (humanoid enemies)
When Jo comes within 4 tiles of an alerted humanoid enemy on the same floor, both enter **duel stance**: Jo auto-faces, walk speed drops to 60%, camera tightens.
- **Strike (X):** 3-hit chain, each 0.35 s; 3rd hit knocks back 2 tiles. Damage 1 pip.
- **Guard (hold Z):** blocks frontal attacks; chip damage 0 but each blocked hit pushes Jo back 1 tile — guard forever and you're pushed off the ledge.
- **Parry (Z within 120 ms of the enemy's hit frame):** enemy staggers 1 s; the next strike is a **counter** (2 pips, dramatic). Parry window shrinks 10 ms per difficulty step.
- **Advance / retreat (←/→):** step 1 tile; you can retreat off a ledge (careful!). **Jump (Space) is disabled in duel** to force footwork — except a **vault** over a staggered enemy.
- **Enemy pips:** 2–5 shown above the head as small level-themed marks (tomatoes, notes…). Jo's hearts are the shared pool.
- **Environmental kills:** knocking an enemy into a hazard (burner, spikes, void) kills instantly. Level design should place duels next to hazards on purpose.

### C7.3 Creature enemies (non-humanoid)
No duel stance. Stomp (from above) or one tool hit. They have a telegraphed lunge; contact only pushes. Swarm types die in one hit each; large creatures have 3 pips and a weak spot (glowing).

### C7.4 Placement rules
- **On the critical path, always.** At least 1 combat encounter every 2 screens; at least 1 duel per section; at least 1 "gate guardian" duel before each objective door.
- **Chokepoints:** duels happen on ledges, bridges, narrow corridors, or between two hazards — never in a wide empty room.
- **Patrols have routes**, sightlines, and a "lost sight" behavior (returns to post, mutters). Alert state is shown (red eye glint + drum hit).
- **Difficulty:** at d≥1 some enemies guard; at d≥2 they feint (fake anticipation); at d≥3 they attack in pairs (one high, one low — must alternate guard/crouch).
- **Rewards:** every duel drops something (a coin, a heart-shard — 3 shards = 1 heart, a Small-Moment hint scrap). Killing must feel worth it.

### C7.5 Tutorial
The Tutorial Street (before Crossroads Station) gains a **sparring room**: a friendly opponent ("Bo, the busker with the mop") who teaches strike → guard → parry → counter with on-screen prompts, unskippable on first play, 60 s.

---

## C8. Verticality & fear — height must matter

- **Room profiles vary.** Rooms are built from a 3-height vocabulary: **low** (1–2 tiles of headroom: crawl/slide), **standard**, **tall** (screen-and-a-half or more, climbable). Each section must use all three. Floors rise and fall: the average path elevation must change by at least one screen height every 3 screens.
- **Fall rules:** drop ≤ 3 tiles: free. 4–6 tiles: hard-land (0.5 s stun, dust). 7+ tiles: **1 heart** and hard-land. 10+ tiles: death. **Hang-drop** (grab a ledge with Down+Space, then release) reduces effective fall by 2 tiles — this is *the* way to descend safely, and levels must be designed so hang-dropping is regularly the right move.
- **Careful step:** hold Shift to walk; at a ledge Jo stops with toes over the edge instead of falling. Long jumps need a **running start** (3 tiles of run for full distance); a standing jump clears only 2 tiles. Distances are always exactly 2, 3, or 4 tiles — never ambiguous.
- **Look down / look up:** hold Down/Up 0.5 s to scroll the camera one screen. Every big drop is shown before it's jumped.
- **Trap set (available to every level, themed):** loose floor tiles (wobble 0.5 s, then fall — and land as a platform below), retractable spikes (rise on a beat with a click), slicing gates (close on a beat; 2 tiles wide, must run through on the open frame), collapsing bridges, crumbling handholds (hang timer), pendulum blades/pans/chains, crushers, dart traps triggered by plates, tilting planks (Jo's weight tips them).
- **Fear through presentation:** long drops have wind sound, camera slowly tilting down, dust falling off the edge, and Jo's careful-step idle looks nervous (hat held). Deaths from falls are slow-mo crumples with a dropped tool clanging seconds later.
- **Vertical set pieces:** each level has one **tower** (ascend) and one **shaft** (descend) sequence of at least 3 screens.

---

## C9. Per-screen verification checklist (run on every screen of every level)
- [ ] No flat-rectangle platforms; supports and shadows present; ≥1 slope or stair on screen or adjacent.
- [ ] Landmark present and unique; near layer differs from the previous screen.
- [ ] ≥1 enemy or trap on the critical path; any humanoid enemy is a duel with a telegraph.
- [ ] Every interactable glints; every locked door shows its key; no invisible walls; wall-jump only on marked tiles.
- [ ] Elevation change visible; at least one place where hang-drop or careful-step is the correct move.
- [ ] Music stem state changes when entering combat/danger on this screen.
- [ ] A new player can tell friend from foe within 1 second of them appearing.
- [ ] Death here looks dramatic and restarts within 2 s at a checkpoint ≤ 30 s away.
