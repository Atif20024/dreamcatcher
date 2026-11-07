# Dreamcatcher, round 2: final critique and work order

Inputs: `00_owner_feedback.md` (it overrides any reviewer), `01_gamer_critique.md` (validated in section 3), and live measurement in the dev build on branch `redesign`. Measurements use the harness `window.__dc` with a stepped clock and music muted. Sizes come from `displayWidth/Height` and `getBounds()`, and positions from `body.bottom` frame by frame.

What this review added beyond the gamer's run:
- Slopes measured frame by frame in Musician d0 and on the Evening hill.
- The hub front steps, plus the hub and Evening shadows measured through a jump.
- Asset sizes measured in Astronaut gym and EVA, Writer copyshop/café, Painter square, Gambler floor, and every Evening place from the arch to the ridge.
- Both Evening endings played to the end (the station bench at 20 s, then the ridge bench).
- Jo's hat checked on the ladder, in the wall slide and in the sit pose.
- The Chef chimney climbed with a human input sequence.
- Boot and Evening load timing, and the Evening object count and frame cost.

---

## 1. Verdict and ranked problems

Phase 2 made Jo a real character, but it did so in a world that still uses the old scale. Every other entity was authored for a 48 px hero and Jo is now 76 px (82 px with the hat). That mismatch is the loudest problem in the game, and it is a single systemic problem. It needs one scale rule applied everywhere, not a stack of per-sprite tweaks.

The second problem is movement continuity, the thing the hands feel. Every slope crest throws Jo into the air, the hub steps are four walls, and the ground shadow either vanishes or rises with him. All three come from two small pieces of code: `resolveSlope` and the per-scene shadow hacks. They are cheap to fix and they must land first, because every other change will be judged while walking on them.

Third, text below about 9 px sits over painted art with no plate. Fourth, there is no shared identity rule. The good ingredients already exist (the split-flap board, the lamps, the dry voice and the Evening light), but nothing ties them together.

Ranked:
1. **Scale (owner 1).** NPCs, foes, doors, lamps, trees, buildings, trains and props are at 0.4–0.65 of the scale they should be. The trains are 128×32, so Jo is 2.4 times the height of a train.
2. **Slopes and stairs (owner 6).** Jo is launched 13–15 px into the air at every 45° crest and is airborne for 9–14 frames. He flies over a whole down-ramp. The hub's four 32 px risers are walls, so he stands in a push pose.
3. **Shadow (owner 5).** In the hub it vanishes in the air and pops back on landing. In the Evening it rises with Jo. Five dreams have no Jo shadow at all.
4. **Readability (owner 2).** World text is 7 px caps with no plate. Ending cards sit on the sky with no scrim. Dream meters sit outside the HUD grid. Town chatter is 7 px caps.
5. **Identity (owner 3).** There is no shared rule for light, palette, frame, type, transitions or sound. Jo blends into the Musician navy and the Gambler maroon.
6. **Flow defects.**
   - Jo holds the ladle in the hub and the wrench before the Astronaut locker.
   - The hub opening locks control for 12 s with no skip.
   - The dialogue hint always says [X], while every prompt says [E].
   - The Musician d0 sign is printed twice.
   - Boot shows a bare bar.
7. **The Long Evening** (section 5.8) is the best-lit place, and it also shows the scale problem most clearly: a pine is shorter than Jo, the four-storey houses are 1.5 times his height, and the "roofs" are dollhouses at his knee. The station ending's last card is cream on a cream sky. The scene still holds about 14,000 display objects.

The hat (owner 4) is fixed. I checked it in climb, wall slide and sit, and the gamer checked the other poses (section 6).

---

## 2. Owner feedback: evidence and fix spec (all six stay in scope)

| # | Owner point | Evidence (this review) | Fix spec | Lands |
|---|---|---|---|---|
| 1 | Scale mismatch: NPCs, foes, buildings, props; trees ≈ Jo; trains tiny | Hub: NPCs 32×48, travellers 25–30×37–44, doors 48×40, lamps 24×33, trains 128×32, bench 48×20, booth 32×36. Painter: plane tree 72×56, cypress 36×60, train 75×18. Evening: pine 48×64, tree 128×104, door 32×56, lamp 20×84, bakery 104×64, children 23×35. Foes are 32×48 everywhere (bouncer 38×58). Jo is 22×76 plus a 24×12 hat. | The scale system in section 7: 1 m = 44 px on the play plane, and backdrop objects are drawn at real size × the layer's scroll factor. The train presentation is in section 7.3. | **WP2** (existing scenes, now), **WP3** (trains and hub), **WP4** (backdrops), framework: materials, props and rigs at the new scale |
| 1a | Trees as tall as Jo | Painter `pt-plane_tree` 72×56 and `pt-cypress` 36×60; Evening `ev-pine` 48×64, `ev-tree` 128×104 and `ev-hilltree` 144×120 (all on the play plane) | Trees on the play plane are cropped by the top of the screen (a plane tree's trunk and lower canopy, about 660–1,100 px). A tree drawn whole sits on a parallax layer at s 0.3–0.6, at real height × s. A lint rule rejects a tree on the play plane whose drawn height is below 260 px. | WP2/WP4 |
| 1b | Trains too small; rethink the presentation | `hub-train-*` 128×32 on the concourse floor, no door, boarding by proximity | A head-on terminus: each bay shows the buffer end of a full-scale carriage at the buffer stop, with Jo boarding by walking into the bay. Every dream opens with a full-scale side-on carriage pulling away (section 7.3). | WP3 |
| 1c | Aspect and proportion of every entity | Section 3 (validation) and section 7 table | The section 7.2 target table, plus the `lint:scale` rule (WP2) | WP2 |
| 2 | Text hard to read | `uiText` world text below 13 px resolves to `small` at scale 1, a 7 px cap (`src/ui/text.js:22,30-35,56-58`). Kiosk headline `fontSize '8px'` (`HubScene.js:209`). Station ending card "Stay as long as you like." is cream on a cream sky with no scrim. Ridge camera zoom 0.6 shrinks world text to about 4 px. | The section 8 readability rules: minimum cap heights per use, plates and scrims, the HUD slot rule, no world text under a camera zoom below 0.9, and one bark at a time | **WP5** |
| 3 | Give the game a character | Section 9 | The section 9 identity system: "Nine o'clock at Crossroads: count the lamps." | **WP6** |
| 4 | Jo's hat | Fixed in 92737f5. Climb: the hat sits on the head, 4 px below the raised hands. Wall slide: offset −6 px x (the head lean), on the head. Sit: dx −3, dy −4, visible. Seen at 5× zoom. | Keep. Add a harness assertion `jo-hat-all-poses`: the hat's bottom stays within the head box of every frame in the atlas. | WP1 (test only) |
| 5 | Shadow jumps with Jo | Hub `HubScene.js:170`: `visible = blocked.down`, so on a jump the shadow is hidden the whole time and pops back at 960. Evening `EveningScene.js:710-711`: shadow y = `p.feet().y`, so it tracks 924 → 911 → 1023 with Jo; alpha and scale are constant. No Jo shadow in Chef, Musician, Astronaut, Writer, Painter or Gambler. | The section 10.1 `PlayerShadow` component | **WP1** |
| 6 | Slopes and stairs not smooth | Musician d0 crest: bottom 1120 → **1127.3** (sinks) → 1120 → **1105.3** with `blocked.down=false` and `vy=+20`, then airborne 9 frames. Far crest: airborne 14 frames over the whole down-ramp. Evening hill at 215 px/s: +5.3/−5.3/−10.6 at x 6878 and +5.9/−5.9 at x 7262. Hub steps: four 32 px solid risers (`src/data/hub/map.js:40`), so Jo pushes at x 308 forever. | The section 10.2 continuous ground solver; stairs become stair-slope tiles | **WP1** |

---

## 3. Validation of the gamer critique

Legend: C = CONFIRMED, Cx = CORRECTED, R = REJECTED, U = UNVERIFIED.

| Claim | Verdict | Evidence |
|---|---|---|
| Top 1: everything but Jo at the old scale | C | Section 2, row 1. Sizes re-measured in eight places; the gamer's numbers match to ±1 px. |
| Jo = body 22×76 + hat 24×12 | C | `public/atlas/jo.json`, `jo/street/side/idle/00` is 22×76, hat 24×12 |
| Rule 1 m = 43 px | Cx | Adopted as **44 px** so the 32 px tile is a round 0.727 m and Jo's 76 px is 1.73 m (1.86 m with hat). Within rounding of the gamer's rule. |
| Scale-table targets (NPC 72–76, doors 112–120, bench 80×38, phone 40×100, postbox 64, car 190×70) | C | They agree with section 7. |
| Target lamp 20×150 | Cx | Street and platform lamps are 3.5–5 m, so 154–220 px |
| Target desk 110×60, typewriter 50×36 | Cx | Wrong direction for the typewriter. A real one is 0.45×0.25 m (20×11), and with the hero-prop allowance of ×1.5 it is 30×16, so today's 29–36×19–24 is already at or above that. The desk is the real error: today's 48×15 is 0.34 m tall, and the target is 62–80×33 (0.75 m). |
| Target crawlers/carts "1.0 Jo height for a threat read" | Cx | Threat should come from silhouette, motion and telegraph, not inflated size. A cart foe is a kitchen trolley (0.9 m, 40×40) with a cook behind it (76). A rat stays small (about 28×12, read via motion and squeak). |
| Trains 128×32; proposal of a full carriage with a door Jo walks through | C (problem), Cx (proposal) | A side-on 400 px carriage does not fit the hub's eight 240 px bays (`map.js:9-10`, cols 80–139). Section 7.3 uses a head-on terminus in the hub and a side-on carriage at each dream's arrival. |
| Top 2: slope pops +13/−27 and +9/−26 | Cx | The pop is real and worse than "a pop": a launch with 9–14 airborne frames. Today's numbers are +6.7/−6.7/−13.3 and +1.7/+4.7/−6.3/−12.7. |
| Up-ramp stutter (−7.3/−2.4 alternating) | R | A clean −4.7 px/frame at 280 px/s (`slope_r` x 569–601). The stutter was probably an artefact of the gamer's stepping. |
| Cause: highest of three samples, crest solid-block branch, velocity zeroed | C, plus an extra cause | `slopes.js:19-45`. The resolver leaves the feet 7 px inside the crest tile's top. Arcade's AABB separation against the solid crest tile then pushes Jo up out of it. Neither code path knows about the other. |
| Hub steps: "Jo walks into the second block" | Cx | Four 32 px risers, cols 10–13. He stops at the **first** (x 308) in `push`. |
| Top 3: 7 px sign type, no plate | C | `text.js:22` (`CAP.small = 7`), `fontForPx` maps ≤13 px to small at scale 1 |
| Musician d0 sign printed twice | C | `MusicianScene.js:228` (two-line world text) + `builders/parallax.js:723` (`label('THE BIG STAGE')` on the landmark) |
| Vista title and subtitle with no scrim | C | `HubScene.js:760-765`: `uiText` only, no plate object |
| HUD coin counter over the departure board in the vista | U | Plausible (the top-right HUD slot and the board are both top right during the 0.62 zoom). Not re-screenshotted. |
| Chef COLD under the coin row; Writer INK/DRAFT collide; Astronaut pips tiny | C / Cx / C | COLD is placed by hand outside HudGrid (`ChefScene.js:294`). Writer INK / DRAFT / NOISE are stacked tightly under the coin row but not overlapping (seen in the copyshop); they are outside the grid (`WriterScene.js:1293`). Astronaut `statHud` is outside the grid in small caps (`AstronautScene.js:373`). |
| Banner lingers "many seconds" | Cx | `BaseLevel.js:677`: 250 ms in, **3,200 ms** hold on first use (1,800 after), 250 ms out. That is 3.7 s; the target is 2.5 s. |
| Title menu and tagline at 7 px | C | `TitleScene.js:50` uses `size:'small'` with no screen scale |
| Top 4: no identity system | C | Section 9 |
| Top 5: shadow | C | Section 2, row 5 |
| Top 6: ladle in the hub | C | `Player.js:118` defaults to `tool-ladle`; HubScene never sets `noTool`. Measured `tool:[visible, 'tool-ladle']`. |
| Trumpet in Musician "before the dream gives it" | R | The trumpet is the Musician's core verb from the start ([Q] PLAY, `MusicianScene.js:770`). |
| Trumpet in Gambler is the "wrong tool" | R (as a bug) | Deliberate: Jo arrives with his horn and can pawn it (`GamblerScene.js:48,343-345`, card `no_trumpet`). The trumpet is Jo's own instrument, as in the Evening (`EveningScene.js:170`). Add one arrival line so it reads as intentional. |
| Astronaut gym reuses Chef crates | U | The gym asset list showed no `chef-crate` at warp `gym`, and I did not search other rooms. |
| **New:** Astronaut wrench before the locker | C (new) | `AstronautScene.js:114` hides it, but `Player.js:187` re-shows the tool every frame. It is visible from the gym; it should only appear after the locker (`:931-935`). |
| Top 7: hub opening lock with no skip | C | `HubScene.js:739` `controlLockUntil = now + 12000`; no skip input. The camera sits on the vista, away from Jo. |
| Top 8: steps give no cue | C | The real fix is stairs, not a cue (section 10.2) |
| Top 9: boot 20+ s | Cx | Warm dev boot is ready at **5.4 s** (189 module requests, atlases 700 KB). The 20+ s (and my own permanent hang at 60 s) happens when the tab is in the background. `requestAnimationFrame` then never fires (`game.loop.frame = 0`), and Boot's loader only starts the atlases queued from the index `filecomplete` on a scene UPDATE tick. In production a hidden tab at boot hangs the same way until it is shown. |
| Dialogue [X] on the last line while [E] advanced | Cx | Every line accepts X, E and Space (`DialogueBox.js:82`), but the hint always shows "[X] ▼" (`:52`) while world prompts say [E]. Cards say "[X] Return…" (`ChefScene.js:732`, `MusicianScene.js:1167`, and others). The keys work; the label is the inconsistency. |
| Backdrop crossfade ghosts signs | C | Seen again: Painter square (translucent building row) and Evening lake and ridge (a hard-edged translucent grey band with a vertical seam) |
| Chimney not climbable with scripted input | R | It is climbable by a human sequence: **hold → toward the far wall, and tap jump (about 0.25 s) each time Jo starts to slide**. Scenario `chef-chimney-walljump` PASSES (apex y 790 vs shaft top 864). The gamer's alternating left/right was the wrong input. Keep the WALL JUMP card text; add "hold toward the wall". |
| Hat fixed in all poses checked | C | Plus climb, wall slide and sit (section 6) |
| First card in Chef is "SLOPES / walk, do not jump" | C | `teach.js:33`. Once slopes are continuous the card is unnecessary: **delete it** (WP7). |
| Hub run saved with nothing earned; Continue says "0 CAUGHT" | C | Minor. Acceptable. |
| Grey monolith pillars at the Chef dock | U | Not revisited. They belong to the Chef rebuild. |
| Evening ridge camera zoom 0.79 shrinks text | C | The ridge ending pulls the camera to **0.6** (measured), so world text at 7 px is about 4 px |
| Per-place scores | Accepted as first impressions; superseded by section 5 for the places I played further | |

---

## 4. Shared findings that the per-place sections cite

- **Foes.** Human-class foes are a uniform 32×48 in five dreams (`foe-security`, `foe-guard`, `foe-talker`, `foe-proofreader`, `foe-petitioner`, `foe-floor-security`, `foe-runner`); `foe-lounge-bouncer` is 38×58. They are child-sized next to Jo.
- **NPC portraits and rigs.** Every NPC is a 32×48/49 placeholder image. The phase 2 report already scoped the rigs as placeholders.
- **Ground.** Every dream still has one tinted ground slab (round 1, problem 3), now made worse because Jo's feet sit on a 32 px tile that reads as 0.7 m of masonry.

---

## 5. Per-place findings

### 5.1 Title and boot
- The bare bar has no label. A hidden tab hangs (section 3).
- **Fix (WP7):**
  - Show the bar as the dreamcatcher web filling in (WP6), with the label "Nine o'clock. Loading the station…".
  - In BootScene, kick `this.load.checkLoadQueue()` (or add the atlases to the initial preload from a static import of `index.json`), so loading does not depend on rAF ticks.
  - Menu at display ×1 (14 px), tagline body ×1 on a plate, footer hints body ×1.

### 5.2 Hub: Crossroads Station
Measured:
- Scale: doors 48×40, booths 32×36, kiosk 48×32, bench 48×20, lamp 24×33, fountain 40×32, desk 56×28, clock 56×45, NPCs 32×48, travellers 25–30×37–44.
- Steps are walls. The shadow pops. The ladle is in Jo's hand.
- The opening locks control for 12 s and repeats the title.
- **Fix:** WP1 (stairs, shadow), WP2 (people and props), WP3 (trains, doors, the opening), WP7 (ladle, lock), WP5 (vista scrim, sign plates).

### 5.3 Chef (gamer played arrival, dock, freezer)
- The scale and slope problems are as described above.
- The chimney is fair. It needs a hint: "hold toward the wall, tap jump".
- **Fix:** delete the SLOPES card. COLD becomes a HudGrid slot. Crates go to 48 (pushable) and 22 (kitchen). The cart foe is trolley plus cook.

### 5.4 Musician
- The crest launch is measured here.
- The d0 sign is double-printed.
- Jo (dark navy) blends with the navy and maroon streets.
- **Fix:** WP1; WP7 (delete `MusicianScene.js:228` and keep the landmark label at ≥ 10 px on a plate). Jo's rim light comes from WP6. The rebuild is the framework's reference dream (phase 3), so scale for new Musician rooms is the framework's job; the stopgap is in WP2.

### 5.5 Astronaut (played: gym, EVA)
- The gym is grey and flat. NPCs are 32×44 (Adaeze, Priya, Halvorsen) and foes 32×48.
- The wrench is shown before it is earned.
- EVA: Jo floats in his street coat against black. The beam is one flat grey slab. The sign board in the EVA room is unreadable at 7 px. The bottom hint line "[←→↑↓] AIM · [SPACE] PUSH OFF · [E] GRAB A RAIL · [F] TETHER · [TAB] VISOR" is long but sits on a strip, so it is readable.
- **Fix:**
  - The wrench is hidden until `F.wrench` (WP7).
  - The LUNGS/GRIP/LEGS/NERVE pips become a HudGrid slot at body ×1 (WP5).
  - A suit outfit for EVA (character rig work, framework/WP2b).

### 5.6 Writer (played: attic, copyshop/café)
- People 32×49, desk 48×15 (0.34 m tall), typewriter 29×19 (fine), lamp post 21×45, trunk 36×90, shop door 30×30 (a hatch, not a door).
- Four or five overlapping white text plates float around Jo in the copyshop. These are signs and barks at 7 px.
- INK / DRAFT / NOISE sit outside HudGrid.
- **Fix:**
  - WP2: desks 62–80×33, doors 44×96, lamp 176.
  - WP5: one bark at a time, and signs on plates.

### 5.7 Painter (played: arrival, square)
- The house front (80×44) is the size of a shed. The train is 75×18. The cypress is 36×60 and the plane tree 72×56. Paint tubes are 12×24 (fine as a pickup if outlined).
- The crossfade leaves a translucent row of buildings.
- NPC shadows exist (`pt-shadow`), but there is none for Jo.
- **Fix:** WP2, WP4 (backdrop scale per layer), WP1 (Jo shadow on Painter's light direction).

### 5.8 Gambler (played: arrival, floor/pit)
- The valet is 30×30, lamp post 21×45, cars 63×30 (target 190×64), van 60×27, doors 33×48 and 30×30.
- Jo's navy coat on maroon carpet has very low contrast.
- The objective line and "CHIPS 3 PENDING · $0 REAL" are drawn over the hanging card art with no scrim.
- An interactable labelled "[E] PAUSE" (`GamblerScene.js:1498`) collides in meaning with [Esc] PAUSE.
- **Fix:**
  - WP2 (people, cars, doors).
  - WP6 (Jo rim and contrast rule).
  - WP5 (a HUD plate behind the top band).
  - WP7: rename that interact to "[E] TAKE A BREATH" or "SIT OUT", and add an arrival line explaining that Jo brought his horn.

### 5.9 THE LONG EVENING: full section (the finale)

**How it was played:**
- Start: arch (the arrival).
- The town: square, roofs, station.
- The station ending: sat on the bench; YOU'RE HERE, the cards, and THERE'S A ROAD.
- The road: lake, steep hill, switchbacks.
- The ridge ending: sat on the ridge bench, and the cards played to "It counted anyway."
- The long walks were bridged with `?ev=<place>`.

The Evening is reached from the hub's last-stop gate ("THE LAST STOP … [X] Go through [Q] Not yet", `HubScene.js:931`).

**Goal clarity.** The design has no objective by intent (`finale_long_evening.md §1`, "nothing here is a task"). Two signals carry the player:
1. The HUD ritual fades everything out. It works and it is the right first beat.
2. The board's "YOU'RE HERE" and later "THERE'S A ROAD".

The problem is that the board is not a board. The text "YOU'RE HERE" appears as a 7 px small-caps label at about knee height near the station bench (`flickerBoard`). In my run the hedge "gap" is a flat green rectangle. A first-time player sitting on the bench gets the payoff, but the lead-up never tells them to sit there for 20 s. The square bench and the hill bench do nothing comparable.
- **Fix:**
  - The station gets a real split-flap board at scale: about 6 m long (264 px), 10+ px glyphs, mounted on a canopy, and visible from the square end of the town.
  - In the town, the board quietly shows the time ("8:51 … 8:52"), so it is noticed before it matters.
  - The station bench is the only bench lit by a platform lamp: the lamp rule from WP6.

**Pacing and length.** About 25,000 px of world (788 tiles). At the 215 px/s jog the road alone (cols 400–788) takes about 60 s of pure travel per kilometre of design, and the spec asks for "the last twenty minutes". That only works if every screen has something to look at. The town is dense. The road from the lake on is sparse: a flat dirt slab, one jetty, a hill of grey rectangular steps. A walk that is long by design needs density and changing ground underfoot.
- **Fix (framework phase 6, with stopgaps in WP4):** each road screen gets one foreground set piece at full scale (a wall to walk on, a jetty, a mill, a bridge, a cairn) and a ground material change (cobble → packed earth → grass verge → gravel → snow → rock). The length stays.

**Feel.**
- Slopes are smoother than in the dreams at the 215 px/s jog, but crests still dip and pop (+5.3/−5.3/−10.6 at x 6878; +5.9/−5.9 at x 7262).
- The switchbacks are stair-stepped grey rectangles.
- The shadow rises with Jo on jumps (measured; this is the owner's point 5 at its source).
- The animation shows `look_up` while Jo walks up the hill. The look pose is held during the camera look, which reads as a stiff walk. Gate the look pose to idle only.
- **Fix:** WP1 covers all of these.

**Art and scale (the owner's point 1 is most visible here):**

| Entity | Today | Target (section 7) |
|---|---|---|
| Pine (`ev-pine`, ×11) | 48×64 on the play plane, shorter than Jo | play plane: cropped trunk at 18 m, more than 540 px tall; whole pines only on layers s 0.3–0.5 (240–400 px) |
| Tree / apple / hill tree | 128×104 / 128×104 / 144×120 | apple 3–5 m: 132–220 tall; street tree 8–12 m: 350–530 (crop the top) |
| Arch | 80×92 | a garden arch is 2.4 m: 106 tall, 64 wide (inner 1.0 m) |
| Doors (`ev-door`, ×5) | 32×56 | 44×96 |
| Lamps (×5) | 20×84 | 176 (4 m) |
| Bakery | 104×64 | a shopfront storey of 4 m: 176, with the upper storey at 132 |
| Town houses behind the street | about 1.4× Jo for five storeys | if on the play plane: 132 px per storey (cropped). If they are a backdrop at s 0.5: 66 px per storey, with a visible ground plane or wall line between Jo's street and them so they read as distant. Today they sit right behind the people with no depth cue, so they read as dollhouses. |
| "Roofs" | Jo walks on flat stone past knee-high houses | the roofs place must put Jo **on** pitched roofs (tiles, chimneys at 1.2 m = 53 px, skylights), with the street visible below |
| Benches (×5) | 48×20 | 80×38 |
| Postbox | 20×40 | 26×68 |
| Fountain | 72×40 | basin 176×26, column to 88 |
| Adults (21 people) | 32×48 | 70–84 tall, ±6 % variation, depth-banded (round 1, E2) |
| Children (`stones_kid`, `kite`, `waiting_kid`) | 23×35 | 50–62 |
| Cat / dog / goat / sheep / deer / heron | 27×21, 36×15, 27×21, 27×15, 33×33, 24×39 | cat 26×14 (standing), dog 40×26, goat 40×32, sheep 48×32, deer 66×56, heron 40×40 |
| Narrowboat / rowboat | 104×24 / 56×16 | 20 m long (crop): 880 px. Rowboat 154×26. |
| Tractor / horse cart | 64×32 / 56×24 | 154×110 / 176×88 |

- **Ground:** one sandstone slab over the bottom 30 % of the town, and one brown dirt slab on the road. Round 1's "painted foreground" still has not landed.
- **Translucent grey band:** a hard-edged translucent grey band with a vertical seam is visible at the lake and on the ridge. Probably a frozen-stream or waterfall backdrop layer. It reads as a rendering bug. **Fix (WP4):** locate it (the layer list at `?ev=lake`), feather its edges or move it to its own place only.

**Readability:**
- All town banter is small caps at scale 1 (7 px): "THAT CAT'S CALLED PASHA.", "SOMETHING WITH LENTILS." It is the best writing in the game and it is unreadable.
- The companion's "LOOK HOW SMALL IT IS. ALL OF IT. EVERYONE." on the switchbacks is a 7 px plate.
- The station ending's last card "Stay as long as you like." is body ×2, cream on the cream-gold sky, and nearly invisible.
- The ridge cards are readable (body ×2 on a dark sky).
- **Fix (WP5):**
  - Barks use the body font in sentence case on a plate, one at a time within 300 px, with the speaker's tail.
  - Ending cards get a 1 px dark outline plus a soft horizontal scrim band (60 % of the darkest sky colour at that moment).
  - World text is moved to UIScene or counter-scaled whenever the camera zoom is below 0.9 (the ridge goes to 0.6).

**Identity.** The Evening is the payoff of the light rule (section 9): warm finally dominates. Keep the sky, the weather, the HUD ritual, the companions and "you're here". It must also be the payoff of the motifs: the station board, the lamp lit by the bench, the two-note chime played by the town bells at YOU'RE HERE, and on the ridge, unaccompanied.

**Writing.**
- The ending cards are strong ("Nobody was watching." / "It counted anyway.").
- Two defects:
  1. "You caught 0 dreams." (and "You walked 0.1 kilometres") read as a scoreboard when the numbers are low. For N = 0, use "You didn't catch any dreams. You came anyway." For kilometres, round to a feeling below 1 km ("You walked a little way tonight.").
  2. The station ending prints "You noticed 1 small thing." but in my run "You caught N dreams" did not appear. Check `countLine` for the hidden zero case, so the three-line rhythm is not broken (WP7).

**The ending's emotional landing.**
- The ridge works in structure: the camera pulls out, the aurora, the slow cards, then control returns.
- It undersells in presentation:
  - At zoom 0.6, Jo, her and the dog are a few pixels in the bottom-right corner.
  - The aurora is faint.
  - The ground is a flat slab with a rectangular bump.
- **Fix (framework phase 6, stopgap in WP4):**
  - The closing composition keeps the three figures at ≥ 40 px on screen, in the lower-left third, sitting on a rock silhouette, not a slab.
  - The aurora is at least 2× brighter at its peak.
  - The town lights below are visible as a cluster.
  - The station from the first ending is visible far behind (round 1 asked for this).

**Performance.**
- 13,980–14,064 display objects in every place sampled.
- Frame cost 4.8–5.8 ms per stepped frame on this machine; the scene loads in 0.8 s with textures cached.
- It is fine on a fast laptop and risky on a weak one.
- **Fix (framework phase 6 and WP4 stopgap):** bake the static tufts (≈370 `ev-tuft-*`), wheat (84), hedges and far props into StaticBaker render textures per room. Target ≤ 2,500 objects; budget lint via `src/core/PerfBudget.js`.

**Shadows and slopes in the Evening** are covered by WP1. The Evening keeps its light-driven shadow length and colour (`L.shadow`, `L.shadowLen`) as `PlayerShadow` options.

Evening scores (clarity/feel/art/readability/identity/emotion): 6 / 6 / 7 (sky 9, foreground 4) / 3 / 8 / 7.

---

## 6. Hat check (owner 4)

| Pose | Result |
|---|---|
| idle, walk, run, skid, push, crouch, turn, jump, fall, land, mantle | aligned (gamer) |
| climb / climb_idle (hub ladder col 62) | aligned: on the head, 4 px below the raised hands' bound; 5× crop checked |
| wall_slide (Chef shaft) | aligned: dx −6 (head lean), dy +4, visible |
| sit (Evening station bench) | aligned: dx −3, dy −4, visible |

Verdict: fixed. Add `jo-hat-all-poses` (WP1).

---

## 7. Scale system

### 7.1 The rule
1. **1 m = 44 px on the play plane** (scroll factor 1). Jo is 1.73 m, so 76 px body and 82 px with the hat. One 32 px tile is 0.727 m.
2. **Depth rule:** an object on a parallax layer with scroll factor *s* is drawn at real size × 44 × *s*. A layer at s 0.5 shows a 3 m storey as 66 px. Every backdrop generator takes real metres and *s*, never pixels.
3. **Hero allowance:** an interactable or held object may be drawn up to ×1.5 real size (never larger than what it rests on), with a minimum of 8 px on its long side. Gameplay pickups (coins, shards) are icons at 16–24 px and are exempt.
4. **Creatures:** small animals keep real size up to ×1.5 for readability, capped at 0.4 × Jo's height. Foes threaten through silhouette, motion and telegraph, not inflated size.
5. **Grid consequences:**
   - Standing headroom is ≥ 3 tiles (96 px = 2.2 m).
   - Doors are 3 tiles tall.
   - Corridors meant to be walked upright are ≥ 3 tiles.
   - 2-tile gaps are crawlspaces by design, and Jo crouches there.
   - Stairs are slope tiles, never stacked solid tiles (section 10.2).
6. **Variation:** a crowd uses ±6 % height variation and three depth bands: the play plane at s 1.0, plus two bands behind it at scale 0.9 and 0.8, with matching tint.

### 7.2 Target sizes (play plane; w × h in px unless noted)

| Class | Real | Target |
|---|---|---|
| Jo | 1.73 m | 22×76 (+hat, 82) |
| Adult NPC / human foe | 1.60–1.90 m | 24–34 × 70–84 |
| Big human foe (bouncer, security) | 1.90–2.00 m, broad | 38–44 × 84–88 |
| Elderly | 1.55–1.70 m | 68–75 |
| Teen | 1.50–1.75 m | 66–77 |
| Child 6–10 | 1.15–1.40 m | 50–62 |
| Toddler | 0.85–1.0 m | 38–44 |
| Rat / mouse | 0.25 m long | 28×12 |
| Pigeon / crow | 0.32 / 0.45 m | 16×13 / 22×16 |
| Cat | 0.25 m tall | 26×14 standing, 22×20 sitting |
| Dog (medium) | 0.55 m shoulder | 40×26 |
| Kitchen trolley foe | 0.9 m | 40×40 with a cook (76) behind |
| Door (single) | 0.95×2.1 m | 42×92 leaf, 52×100 with frame (3 tiles) |
| Double / station door | 1.8×2.6 m | 80×114 |
| Revolving door | 2.0×2.4 m | 88×106 |
| Window | 1.0×1.5 m, sill 0.9 m | 44×66, sill at 40 |
| Shop window | 2.4×2.2 m | 106×97 |
| Storey (residential) | 3.0 m | 132 |
| Ground-floor shop / station hall | 4 m / 12–20 m | 176 / 528–880 (cropped) |
| Stair riser / tread | 0.17 / 0.28 m | 8 / 16 (half-pitch slope tiles; see 10.2) |
| Handrail / parapet | 0.9 / 1.1 m | 40 / 48 |
| Street lamp / platform lamp | 4.5 / 3.5 m | 198 / 154 |
| Bench | 1.8×0.45 m seat, 0.85 m back | 80×38 |
| Table / café table | 0.75 m | 52×33 / 31×33 |
| Desk / big desk | 1.4 / 1.8 × 0.75 m | 62×33 / 80×33 |
| Chair | 0.45 seat, 0.9 back | 20×40 |
| Typewriter (hero) | 0.45×0.25 m | 30×16 |
| Crate: kitchen / pushable / pallet stack | 0.5 / 1.1 / 1.2 m | 22 / 48 / 52 |
| Kiosk / phone booth / ticket booth | 2.5 / 2.3 / 2.6 m | 110×110 / 40×100 / 120×114 (counter at 48) |
| Postbox | 1.55 m | 26×68 |
| Fountain (town) | basin 0.6×4 m, column 2 m | 176×26 + column to 88 |
| Drinking fountain | 1.0 m | 22×44 |
| Station clock | 1.2 m diameter | 53 |
| Tree: shrub / hedge | 0.6–1.2 / 1.2–2.0 m | 26–53 / 53–88 |
| Tree: fruit / young street tree | 3–5 / 6–8 m | 132–220 / 264–350 |
| Tree: plane, pine, cypress (mature) | 15–25 m | play plane cropped (more than 540); whole only at s ≤ 0.5 |
| Building, four storeys | 13 m | 572 on the play plane (cropped); 286 at s 0.5; 143 at s 0.25 |
| Train carriage | 20 m × 2.8 m × 3.9 m above rail | side-on: 880×172 (crop); head-on: 123×172; door 50×88 |
| Car / van / bus | 4.3×1.45 / 5×2 / 12×3 m | 190×64 / 220×88 / 528×132 |
| Bicycle / tractor / rowboat | 1.7×1.0 / 3.5×2.5 / 3.5×0.6 m | 75×44 / 154×110 / 154×26 |
| Held: ladle / trumpet / pen / brush / wrench | 0.35 / 0.5 / 0.14 / 0.25 / 0.3 m | ≤ 22 / 22–24 / 8–10 / 12–16 / 14–18 |
| Pickups: coin / heart shard / key item | — | 16–20 icon + 1 px outline / 20 / ×1.5 real, minimum 14 |
| Signs: platform overhead / shop fascia | 2.5×0.5 / 3×0.6 m | 132×26 minimum, or bigger so text meets 8.1 |

### 7.3 Trains: the presentation
- **Hub, a head-on terminus.** Crossroads is a terminus, and the concourse sees the trains end-on at the buffer stops. That is how real termini look and it fits the eight 240 px bays.
  - Each bay shows the buffer end of the last carriage at full scale: 123 px wide and 172 px tall, its lower 40 px down in a track pit below the concourse line, so about 130 px rises above the floor.
  - It carries lit end-windows, a gangway door, two tail lamps and a destination blind (≥ 10 px glyphs) above the door.
  - The platform runs away from the camera beside it, painted in the shed backdrop with converging lines and a row of lit carriage windows receding into steam. The rest of the train is implied by perspective.
  - A buffer stop, a yellow platform-edge line and the platform gate (a short barrier with a lamp) sit in front.
  - **Boarding:** [E] at the gate. Jo walks *into* the bay. A 0.8 s tween moves him up the platform beside the carriage, scaling to 0.85 and darkening slightly. The carriage door spills light, the conductor's line plays, and the chime sounds (WP6).
  - **Caught dreams:** the bay's lamp goes out, the blind reads "NOT IN SERVICE", and an oil stain shows (existing `Train.kill`).
- **Dream arrival, side-on.** Each dream opens on its arrival platform with a full-scale carriage on the play plane: 880×172, cropped by the screen edges, door 50×88 at Jo's floor level. Jo steps out of the door, the train pulls away (2.5 s, wheels and window-strobe), and the platform lamp comes on. This is the WP6 arrival moment, with one shared silhouette and the dream's livery colour. For Evening, the "Station That Isn't" mirrors it with no train.
- **Shared kit:** one carriage drawing in three views (head-on end, side, interior strip) with a livery tint per dream. Built as art in `src/entities/hubArt.js` / `Train.js` now (WP3). The dream-side arrival carriage belongs to the framework as a shared prop (`PropLibrary`), with a temporary copy placed in the existing scenes' arrival rooms by WP3.

---

## 8. Readability rules (WP5)

Canvas pixels at 960×540. Current fonts: small cap 7, body cap 9, display cap 14 (`text.js:22`), all at integer scales.

| Use | Minimum | Font |
|---|---|---|
| Anything the player must read to progress (objective, prompt, gate hint, card body, menu, dialogue) | cap ≥ 14 (display ×1, or small/body ×2) | body ×2 for prose, display ×1 for labels |
| In-world signs that carry information | cap ≥ 9 on screen at the current camera zoom | body ×1 on a plate; small ×2 for caps-only signs |
| Barks and chatter | body ×1, sentence case, on a plate | body |
| Decorative text (posters, graffiti, far signs) | any size; must not look like information | small ×1 allowed |
| HUD numbers and meters | cap ≥ 14 | small ×2 or display ×1 |

- **Zoom:** world text multiplies by camera zoom. Below zoom 0.9 (hub vista 0.62, ridge 0.6), information text moves to UIScene or is counter-scaled. Lint: any world `uiText` at a cap below 9 × (1 / minimum zoom of its room) is an error.
- **Plates:** every information text over painted art sits on a plate. The plate fill is `ink-dark` 0x14122a at 88 %, with a 1 px brass line 0xc8a24a and padding of 4 px vertical and 6 px horizontal. A light variant is cream 0xf2e6cc with ink text for daylight signs. Glyph-to-plate contrast is ≥ 4.5:1.
- **Scrim:** text placed directly on sky or art (title vista, ending cards) gets a 1 px dark outline plus a horizontal gradient band behind the line. The band is 60 % of the scene's darkest colour, as tall as the line height × 2.2, with feathered ends.
- **HUD:**
  - Every screen-space HUD element is a HudGrid slot. Dream meters (COLD, INK/DRAFT/NOISE, LUNGS/GRIP/LEGS/NERVE, BREATH, O₂/PWR, CHIPS/REAL, RADIO) are registered slots in one right-aligned stack under the coin row.
  - No two HUD rects may intersect, and there is an 8 px margin.
  - During cutscenes and vistas the HUD hides.
  - Lint and harness: `hud-no-overlap` in every place.
- **Banner:** 2.5 s hold (first) / 1.5 s (later), in the top third, never over Jo's head.
- **Barks:**
  - At most one visible bark within 300 px of another.
  - Stacked above Jo's head, never across it.
  - Duration 0.9 s + 60 ms per character.
  - Off-screen barks are not drawn. Check the Evening chatter that kept firing during the ridge cards.
- **Signs scale with the world:** after WP2 doubles the world, a sign's plate grows with it and its text uses the bigger font. The 7 px sign is retired.
- **Title:** menu display ×1, tagline body ×1, panel at 85 % opacity.

---

## 9. Identity system (WP6)

**Evaluation of the gamer's proposal ("THE LAST TRAIN HOME, lit by one lamp"):**
- The light idea is right and is kept: cool shadow, warm practicals, one accent.
- The feather and web as a UI frame are too many motifs, and a web drawn into every panel corner adds noise at 7–9 px.
- The game already owns two stronger, native devices: the **split-flap departure board** (`SplitFlapBoard.js`, the hub centrepiece, and the Evening's YOU'RE HERE) and the **platform lamp** (`hub-lamp` / `hub-lamp-off`, which already marks caught dreams).

**The identity, improved: "Nine o'clock at Crossroads: count the lamps."** Every place is a station at night, lit by lamps you can count. Words arrive on a departure board. Every dream you finish puts out its lamp in the hall and adds one strand to the dreamcatcher.

| Element | Rule | Where it appears |
|---|---|---|
| Light | 70 % cool shadow field (indigo variant per place), 25 % warm practicals (lamps, windows, stoves, stage), 5 % the dream accent. The Evening inverts it (warm 70 %) and the night road returns to cool with the aurora as the accent. | Every scene. Lighting pass in the existing scenes (WP6); framework `BackdropDirector` presets. |
| Palette | No pure black (darkest 0x14122a), no pure white (cream 0xf2e6cc). Shadows are the place's indigo. Accents: chef 0xc0392b red, musician 0x2e7d9a teal, astronaut 0xbfe6ef cyan-white, writer 0x2c3e75 ink blue, painter 0xe8b830 yellow, gambler 0x2f7a4a felt green, evening 0xf0b45a gold. | Tints, signs, plates, train liveries |
| Jo anchor | Jo is always the highest-contrast object. A 1 px warm rim on his lit side in every place (generalise the Evening `joRim`). Contrast ≥ 3:1 against the 120×120 px behind him; where a place fails, darken that layer band. | Player (WP6, via the Player art hook) |
| UI frame | One 9-slice: ink-dark fill at 88 %, 1 px brass line, 1 px inner shadow, 3 px rounded corners. Sign plates use the same slice with an accent line. Five uses: dialogue, cards, signs, HUD slots, menus. | `src/ui/Panel.js`, `theme.js` |
| Type | Display (slab caps) only for place names, titles and the board, always revealed by a split-flap flip (60 ms per glyph). Body for anything read. Small only for labels at ×2 and decoration. At most two text colours per panel: names gold 0xf2d580, body cream, warnings red 0xd06050. | `uiText`, `SplitFlapBoard` |
| Motifs | (1) **The board:** every place title ("FIVE-STAR DREAM — PLATFORM 1"), dream end ("CAUGHT"), and the Evening's YOU'RE HERE / THERE'S A ROAD. (2) **The lamp:** every checkpoint is a lamp, not a flag. Touching it lights it and warms the room's practicals by 10 %. (3) **The dreamcatcher:** the title emblem, and a large one in the hall that gains a strand per caught dream (a visible progress object). | Title, hub hall, checkpoints in all dreams, Evening |
| Moments | Arrival: the carriage pulls away and the lamp comes on (7.3). Ending: the board flips to CAUGHT, the hub lamp goes out, a strand is added to the web. Evening: the bench lamp, YOU'RE HERE. | Every dream start and end, Evening |
| Transitions | Hub ↔ dream: one "passing train" wipe. Horizontal lit-window bands in the dream accent sweep across (700 ms), with the chime. Death: a fade to indigo. Room to room: no wipe (the current crossfade, fixed). | `TransitionDirector` (framework) / BaseLevel (now) |
| Sound | One two-note station chime (a falling fourth), re-orchestrated per place: hub chime; musician trumpet; chef service bell; astronaut radio beep; writer typewriter bell; painter church bell; gambler slot chime; Evening town bells, then unaccompanied on the ridge. Plays on: board flips, lamp-checkpoints, boarding, dream end, YOU'RE HERE. Surface footsteps everywhere. | `src/audio/` (framework), `systems/audio.js` (now) |
| Loading | The boot bar is the dreamcatcher web filling strand by strand. | BootScene |

---

## 10. Shadow and slope specs (WP1)

### 10.1 `PlayerShadow` (new `src/entities/PlayerShadow.js`, reusable by NPCs and foes)
- **Owner:** a Player sub-object created in the `Player` constructor. Each scene passes options: `{ tint, alpha, length, offsetX, angleFromLight }`. The defaults are a 28×6 ellipse, the scene's shadow colour and alpha 0.35. The hub (`HubScene.js:169-170`) and Evening (`:172, :711`) hacks are deleted and become options.
- **Update** (after physics, after the ground solver, every frame):
  1. Take three probes at foot x − 8, x, x + 8. For each, find the first walkable surface at or below the feet, within a 320 px drop. The surfaces are:
     - solid tile tops with an empty tile above
     - slope surfaces (`slopeSurface`, interpolated)
     - one-way tops (`=`)
     - tops of moving or static bodies in `scene.shadowCasters` (optional)
  2. Ground y comes from the centre probe. If the centre has no ground but a side probe does, clip the shadow to that side, so a ledge cuts it at the tile edge.
  3. Height h = groundY − feetY.
     - alpha = base × max(0, 1 − h / 160)
     - scaleX = 1 − 0.5 × min(1, h / 160)
     - Hidden if h > 160 or no ground within 320.
  4. On a slope, angle = atan of the surface gradient under the centre (±45° or ±26.6°).
  5. Depth: just under Jo, above ground decor. The Evening's light rule (`L.shadowLen`, `L.shadow`, `L.shadowAlpha`) multiplies through. When sitting, the shadow sits on the bench seat.
- **Acceptance** (`src/dev/scenarios/round2.js`, every place):
  - `shadow-jump`: from flat ground, shadow y is constant ±0.5 px for the whole jump, and alpha is non-increasing up to the apex.
  - `shadow-ledge`: walking off a ledge, the shadow drops to the lower ground within 1 frame of the centre crossing the edge.
  - `shadow-gap`: over a pit with no ground within 320 px it is invisible.
  - `shadow-slope`: on a ramp, shadow y is within 1 px of the surface under the foot centre.
  - It exists in all eight places.

### 10.2 Continuous ground solver (replaces `resolveSlope`, `src/entities/slopes.js`; used by `Player.js:377` and `Foe.js:185`)

**Algorithm:**
1. `groundAt(x, footY)` returns the walkable surface y under one column x, searching `[footY − STEP_UP, footY + SNAP_DOWN]`.
   - Slope tiles give `ty·T + slopeSurface(role, fx)·T`, which is piecewise-linear and continuous across tile seams.
   - Solid tiles give the top of the first solid tile with an empty tile above.
   - One-way tiles give their top.
   - Take the **highest surface ≤ footY + SNAP_DOWN**. Only the foot centre is sampled for height; the left and right edges are used for wall probes only.
2. Grounded walker (grounded last frame and vy ≥ 0):
   - If `groundAt` returns s, set feet = s exactly, vy = 0 and `blocked.down = true`. Set `body.y` so `body.bottom === s`, leaving no overlap for Arcade to separate.
   - STEP_UP = 10 px. A lip of up to 10 px is eased over 3 frames, never more than 4 px per frame.
   - SNAP_DOWN = |vx|·dt·1.0 + 2 px, so Jo stays glued across crests and down 45° ramps.
   - No ground in the window means Jo walked off a ledge, and normal gravity applies (coyote time unchanged).
3. Crest and wall conflict:
   - At build time, any solid tile whose top equals a slope tile's high end, on the slope's high side, gets `collideLeft/Right = false` on the side facing the slope. Arcade can then never treat the crest as a wall or push Jo up out of it.
   - Do the same for the low end of down-ramps.
   - This lives in the tile-body builder (`src/builders/*`). The framework's `Terrain.js:364-374` builds the same grids, so it must call the same helper.
4. Jumping (vy < 0) bypasses the snap (as today). Landing on a slope uses the same `groundAt`.

**Stairs:**
- Every staircase is collision-modelled as slope tiles: half-pitch `slope_r_low/high` pairs, 16 px rise per 32 px. Treads and risers (8 px rise, 16 px tread) are drawn by the tile art.
- The hub front steps (`map.js:40-42`) become two half-pitch stair tiles per 16 px of rise. Raise the street or lower the forecourt so the four 32 px risers become a 2.9 m flight of 16 risers over 8 tiles. In the hub that means shifting the kiosk and the facade start by 4 tiles.
- The hub iron staircase uses one-way `=` treads (`map.js:51-52`). Give it one-way stair-slope tiles (`slope_r_oneway`) so Jo walks up it and can still drop through.

**Acceptance** (`slope-continuity`, `stairs-walk`, every slope and stair join in every place, both directions, at walk speed, run 280 and the Evening jog 215):
- For every frame from 2 tiles before a join to 3 tiles after: |Δy − grad·Δx| ≤ 2 px, where grad is the surface gradient under the foot centre.
- `blocked.down` stays true throughout.
- The animation never enters apex/fall/land, and never `push`.
- Hub front steps: holding → alone climbs them in ≤ 1.25× the time to walk the same horizontal distance on flat ground.
- Foes on carts and patrols pass the same test.
- The SLOPES teaching card is deleted (`teach.js:33`, `Player.js:487-490`).

---

## 11. Prioritised fix plan: work packages

Ownership note:
- The phase 3 framework agent owns `src/dreams/`, `src/actors/`, `src/art/materials/`, `src/art/backdrops/`, `src/art/characters/`, `src/world/`, `src/engines/`, `src/narrative/`, `src/input/`, `src/audio/`, `src/core/PerfBudget.js`, `src/scenes/DreamScene.js` and `tests/framework.test.js`.
- `src/entities/Player.js`, `src/scenes/BaseLevel.js`, `src/ui/text.js`, `src/play/Teach.js`, `src/main.js` and `src/dev/*` appeared modified in the session's git status. Every WP that touches them must `git diff` first and coordinate.
- Long-term homes: terrain at scale, scale-correct rooms, baked backdrops and the Evening rebuild all belong to the framework phases (3: Musician, 4: hub, 5: dreams, 6: Evening). The WPs below land what can land **now** in the existing scenes, with shared code placed where the framework will reuse it.

| Order | WP | Scope | Files | Acceptance | Depends | Touches framework files? |
|---|---|---|---|---|---|---|
| 1 | **WP1 Movement: ground, stairs, shadow** | 10.2 solver (replaces `resolveSlope`); crest side-collision helper; hub front steps and iron stairs as stair-slopes; `PlayerShadow` (10.1) in all 8 places; delete hub/Evening shadow hacks; delete SLOPES card; gate Evening `look_up` to idle; `jo-hat-all-poses` test | `src/entities/slopes.js`, new `src/entities/PlayerShadow.js`, `src/entities/Player.js` (377, constructor), `src/entities/Foe.js:185`, tile-body builder in `src/builders/`, `src/data/hub/map.js`, `src/scenes/HubScene.js:169-170`, `src/scenes/EveningScene.js:172,711`, `src/data/teach.js:33`, new `src/dev/scenarios/round2.js` | `slope-continuity`, `stairs-walk`, `shadow-jump/ledge/gap/slope`, `jo-hat-all-poses`, all phase 1.4 and 2 scenarios still pass | none | Shared: `Player.js` (coordinate). The framework's `Terrain.js` must call the crest helper and DreamScene must pass shadow options: hand over a two-line note, don't edit. |
| 2 | **WP7 Flow fixes** | Hub: `noTool` (no ladle); Astronaut: tool hidden until `F.wrench` (fix `Player.js:187` to respect a `toolHidden` flag); hub opening: control returns after 3 s, any key skips, camera keeps Jo in frame, no second DREAMCATCHER title (use the board line only); dialogue hint label from the InputMap (`[E] ▼`), all "[X] …" card lines → "[E] …"; delete Musician d0 duplicate sign (`MusicianScene.js:228`); Gambler "[E] PAUSE" interact renamed + horn arrival line; Boot: loader not rAF-dependent + labelled bar; Evening N=0 and km wording, missing "You caught" line check; chimney card adds "hold toward the wall" | `HubScene.js` (736-790), `Player.js:117-118,187`, `AstronautScene.js:114`, `DialogueBox.js:52`, scene card strings, `MusicianScene.js:228`, `GamblerScene.js:1498`, `BootScene.js`, `EveningScene.js` (CARDS, countLine), `data/teach.js` | `tool-before-dream` (no tool in hub; no wrench before flag), `opening-skippable` (control < 3.5 s, any key ends it), `dialog-key-label` (no "[X]" string in any scene card or hint; lint), `boot-hidden-tab` (boot completes with stepped frames only), lint `default-text` clean | none (parallel with WP1; coordinate `Player.js`) | Shared `Player.js` only |
| 3 | **WP5 Readability** | Section 8: plate/scrim helpers in `uiText`; sign plates; bark manager (one at a time, body font); HUD: all dream meters as HudGrid slots; banner 2.5 s; title sizes; zoom rule (world text → UI when zoom < 0.9: hub vista, Evening ridge); ending-card scrim | `src/ui/text.js`, `src/ui/Panel.js`, `src/ui/HudGrid.js`, `src/ui/hud.js`, `src/systems/talk.js` (barks), `BaseLevel.js:663-677`, `TitleScene.js`, `ChefScene.js:294`, `WriterScene.js:1293`, `AstronautScene.js:373`, Musician BREATH, Gambler CHIPS, `EveningScene.js` cards | lint `text-min-size` (cap × zoom ≥ 9 for information text; ≥ 14 for HUD/prompt), `hud-no-overlap` per place, `bark-one-at-a-time`, contrast check on plates ≥ 4.5:1 | WP7 (card strings) | `text.js` shared (coordinate); none owned |
| 4 | **WP2 Scale pass: people, foes, props, interactables** | Section 7 table applied in existing scenes: NPC/foe draw scale to 70–84 (interim: rescale current placeholder images ×1.6 with nearest filter until the rigs exist; hitboxes unchanged for foes except bouncers); props redrawn or rescaled per table (doors 3 tiles, benches 80×38, lamps 154–198, desks 62–80×33, crates, cars, booths, kiosk, postbox, fountain, animals); held tools capped; the `lint:scale` rule (a table of texture → class → min/max px; ERROR outside range; play-plane trees < 260 px are errors). Rooms whose doors/ceilings can't take 3-tile doors get a noted exception for the framework rebuild. | `src/entities/hubArt.js`, `src/entities/Townsfolk.js`, `src/entities/foeArt.js`, `src/entities/critters.js`, per-scene prop drawers (`*Scene.js` add.image sizes), `src/scenes/evening/world.js`, new `scripts/lib/scale-check.js` + `src/data/scale.js` | `lint:scale` clean (or every exception listed); harness `npc-height` (all NPC display heights within 0.85–1.1 × Jo); screenshots of 8 places attached | WP1 (doors and stairs geometry) | No. New rigs for the cast at 76 px go through the character pipeline (`src/art/characters/`, framework-owned): request, don't edit. |
| 5 | **WP3 Trains and hub presentation** | 7.3: head-on terminus carriage per bay (123×172, pit, blind ≥ 10 px, tail lamps, platform gate); boarding walk-in tween + door light + chime; dead/caught state kept; side-on arrival carriage (880×172 crop, door 50×88) pulling away in each existing dream's arrival room; hub doors/booths/kiosk at scale; hall dreamcatcher progress object; the board line in the opening | `src/entities/Train.js`, `src/entities/hubArt.js`, `src/scenes/HubScene.js` (440-480, opening), each `*Scene.js` arrival builder (one call to a shared `arrivalTrain(scene, x, livery)` in `src/entities/Train.js`) | `train-scale` (carriage ≥ 2.1 × Jo height; door ≥ 1.15 × Jo), `board-train` (E at gate → walk-in → scene start, ≤ 3 s of lock), `arrival-train` (door at floor, departs, lamp on), screenshots | WP2 (people at scale on the platform), WP6 (chime, wipe) can follow | No. The framework's phase 4 hub will reuse `Train.js` art; tell it. |
| 6 | **WP4 Backdrops and building scale** | Depth rule (7.1.2) applied to existing parallax: every building/tree generator takes metres and the layer s; storey 132·s; a visible ground/wall line between the play plane and near backdrops; Painter/Evening dollhouse fixes (Evening "roofs" place puts Jo on roofs; square houses either cropped play-plane facades or distant with a depth cue); crossfade ghosting (sign layers don't crossfade: cut at t = 0.5); locate and fix the Evening grey translucent band; Evening ridge closing composition stopgap; bake Evening static tufts/wheat/hedges into render textures (stopgap toward ≤ 2,500 objects) | `src/builders/parallax.js` (incl. :723), `src/builders/horizon*`, `src/systems/horizon.js`, `src/scenes/evening/world.js`, `src/scenes/EveningScene.js` (ending camera), `src/scenes/painter/*` | lint `backdrop-scale` (storey height = 132·s ± 10 %), `blend-continuity` + new `no-sign-ghost` (no text layer alpha in 0.15–0.85 for more than 6 frames), Evening object count ≤ 6,000 now (≤ 2,500 in the framework rebuild), frame cost logged | WP2 | No, but the long-term home is `src/art/backdrops/` + `BackdropDirector` (framework). Keep the generators metre-based so the framework can port them. |
| 7 | **WP6 Identity system** | Section 9: palette tokens + accents in `theme.js`; one 9-slice frame for 5 uses; split-flap reveal for place titles and dream ends; lamp checkpoints replace flags (art + light bump); Jo rim light + contrast rule in all scenes; passing-train wipe hub↔dream; chime motif in `systems/audio.js` per place; boot web loader | `src/ui/theme.js`, `src/ui/Panel.js`, `src/systems/SplitFlapBoard.js`, `src/play/Checkpoints.js`, `src/entities/Player.js` (rim hook), `src/systems/audio.js`, `BaseLevel.js` (transition), `BootScene.js`, `TitleScene.js` | `jo-contrast` (≥ 3:1 vs the 120 px box behind him, sampled in each place), `ui-frame-single` (lint: panels only via `Panel`), checkpoint scenarios still pass with lamps, chime plays on 5 events (event log) | WP5 (frame/type), WP3 (arrival moment) | Shared `Player.js`, `BaseLevel.js`. The audio stems and TransitionDirector are framework-owned: implement in the old modules behind the same names, so the framework can lift them. |

**Order and parallelism:**
- WP1 and WP7 run first, in parallel (both touch `Player.js`, in different lines, so merge carefully).
- Then WP5.
- Then WP2, then WP3 and WP4 in parallel.
- WP6 runs last, because it styles what the others built.

**Out of scope for round 2 (the framework phases):**
- Painted ground materials per room.
- NPC and foe rigs at 76 px.
- Room rebuilds at scale (3-tile doors everywhere).
- The Evening rebuild on DreamScene (phase 6).
- Recorded audio loops.

**Shared code to hand the framework agent:**
- The ground solver (WP1), which `Terrain`'s grids must feed with the crest helper.
- `PlayerShadow` options per DreamDefinition.
- `src/data/scale.js` (WP2), which MaterialLibrary, PropLibrary and BackdropDirector should read.
- The train kit (WP3).
- The theme tokens and chime (WP6).
