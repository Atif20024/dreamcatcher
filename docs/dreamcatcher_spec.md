# DREAMCATCHER — Build Instructions (Global Upgrade + Chef Dream)

You are building **Dreamcatcher**, a 2D pixel-art platformer. Jo is a jazz musician who chases "dreams" (careers) and learns the small moments matter more. The current build is a placeholder: flat gray platforms, empty backgrounds, no props, no puzzles, levels finish in under a minute. That is not acceptable. Rebuild to the standard below. **Every dream level must take a first-time player 10–15 minutes.**

---

## PART A — GLOBAL STANDARD (applies to every level)

### A1. Tech stack (use exactly this)
- **Phaser 3 + TypeScript + Vite** (web build, runs in browser).
- **Tiled** for all maps (`.tmj` JSON). Tile size **16px**, render at **3× zoom** (game resolution 640×360, scaled to window).
- **Aseprite** exports for sprites (`.png` + `.json` atlas). Palette limited to **32 colors per level**, swapped per "darkness" stage via a palette shader.
- Audio: Howler via Phaser sound. Adaptive music: 2–3 stems per level that fade in/out by section.

### A2. Visual density rule ("no empty screen")
Every single screen of every level must contain ALL of:
1. **3 parallax background layers** (far / mid / near) at scroll factors 0.2 / 0.5 / 0.8.
2. **Foreground silhouette layer** (scroll factor 1.2) — pipes, hanging objects, railings, plants — that passes in front of Jo.
3. **At least 8 hand-placed decorative props** per screen (posters, crates, lamps, signs, puddles, cloth, wires).
4. **At least 3 animated ambient elements** per screen (steam, flickering lights, dripping water, swaying cloth, drifting particles, background NPCs doing looping tasks).
5. **Themed tiles** — no generic gray blocks. Ground, platforms, walls, ceilings each have edge tiles, corner tiles, cracked/damaged variants, and inside-fill variants. Platforms are drawn as real objects from the theme (shelves, counters, pipes, rafters).
6. **Hazards drawn as scenery**, never as floating abstract shapes (a burner is a burner, a spike is a broken bottle rack, etc.).
7. **Lighting**: per-level ambient tint + point lights on lamps/fires (Phaser Light2D pipeline).

### A3. Camera
- Follow Jo with lerp 0.1, **look-ahead** 48px in facing direction, vertical dead-zone 60px.
- Camera bounds per section; smooth pan on section transitions. Screen shake (2–6px) on impacts, explosions, boss hits.
- Cinematic bars (letterbox) during dialogue and set-pieces.

### A4. Jo — movement & animation set
Physics: run speed 140 px/s, accel 900, air control 70%, jump 300 impulse, variable jump height (release early = short), **coyote time 100ms**, **jump buffer 120ms**, wall-slide + wall-jump, ledge grab + climb, crouch/slide under gaps, fast-fall.
Required animations (each ≥ 4 frames): idle (with breathing + occasional look-around every 4s), run, jump-up, jump-apex, fall, land (squash), wall-slide, ledge-grab, ledge-climb, crouch, slide, hurt, death, push (carts/blocks), carry-idle, carry-run, interact (pull lever / press button), attack (instrument swing / level tool), climb-ladder, celebrate.
Feedback: dust puffs on land/run-start/turn, afterimage trail on dash-like moves, hit-stop 60ms on damage.

### A5. Health & difficulty
- 3 hearts (as now). Hearts +1 per dream caught (max 5). Hazards do 1 heart, boss attacks 1, falls into void = respawn at checkpoint minus 1 heart.
- `difficulty = dreamsCaught` (0–5). Each level reads it: enemy speed +8%/level, timed puzzles −10% time/level, extra enemies spawn at difficulty ≥2, some safe platforms removed at ≥3.
- Palette darkens per dream caught: saturation −12% and value −6% per step, applied via shader to every layer except the orb and Small Moments.

### A6. Systems that must exist in the engine
**Dialogue system** — bottom-screen box with portrait (left), name tag, typewriter text (40 cps, skippable), multi-page, optional 2–3 choice branches. Triggered by map objects, item pickup, puzzle completion, or timer. Game pauses during dialogue.

**Puzzle-box system** — a full-screen modal minigame overlay (darkens level behind). Each puzzle is a self-contained scene with: title, instruction line, input handling (keyboard + mouse), success animation, fail behavior, and a **close/retry** button. Puzzles set a flag on success (`flags.<puzzleId> = true`) which the level reads to open doors/change state.

**Carry/Interact system** — E to pick up/drop a carryable item (shown above Jo's head), E at interaction points (levers, valves, stations, NPCs). Interaction prompts appear as a small icon above the object when Jo is within 24px.

**Checkpoints** — visible themed object (e.g. a lit lantern / bell). Activating plays a chime. Respawn restores position, carried item, and puzzle flags.

**Small Moments (collectibles)** — 3 per level, hidden off the critical path. Each is a short scene (5–10 s) where Jo just observes something ordinary and beautiful (a cat asleep on warm pipes, two workers laughing, rain on a window). Collected count shows on the end screen and changes the end-of-dream message (see A8).

**Order / objective HUD** — top-right slot showing the current in-level goal (icon + 4–6 words), updated on every section change.

**Level state machine** — sections are named; each section has entry trigger, required flags, exit door. Doors remain visibly locked (chains, red light, "CLOSED" sign) until flags are true.

### A7. Enemy & hazard standards
Each level needs a **minimum of 4 enemy types** and **6 hazard types**, all themed. Every enemy has: idle, move, attack, hurt, death animations; telegraph (0.4 s wind-up flash) before attacks; a way to defeat (stomp, hit with tool, lure into hazard) OR an explicit "cannot defeat, must avoid" design. Hazards must be readable: color-coded warning frames before firing.

### A8. Dream structure template (every dream uses this)
1. **Arrival** (1 min) — train pulls in, cinematic, level title card, one dialogue with a "guide" NPC who represents the dream's promise.
2. **Entry section** (2 min) — teaches the level's unique mechanic safely.
3. **Section 2** (2–3 min) — mechanic + first puzzle-box + first enemy type.
4. **Section 3 — set piece** (3 min) — the level's biggest, densest area; combined mechanics; timed segment.
5. **Section 4** (2–3 min) — vertical or reversed-gravity variation; second puzzle-box; second Small Moment.
6. **Climax** (2 min) — mini-boss or escalating sequence tied to the theme's pressure (deadlines, crowds, critics).
7. **The Orb** (1 min) — quiet, music drops to a single instrument, Jo walks to the glowing orb, catches it. Fade to text: *"Was it enough?"* then a message that changes with Small Moments collected: 0 → "You didn't notice anything on the way." 1–2 → "You noticed a little." 3 → "You noticed. Maybe that was the point."
8. Return to Crossroads Station; world palette darkens; a new gate cracks open if `dreamsCaught ≥ 2`.

### A9. Definition of done per level (checklist)
- [ ] Playtest: first-time player ≥ 10 min, speedrunner ≥ 5 min.
- [ ] Zero screens violating A2.
- [ ] ≥ 2 puzzle-boxes, ≥ 6 dialogue triggers, 3 Small Moments, ≥ 5 checkpoints.
- [ ] ≥ 4 enemies, ≥ 6 hazards, 1 climax sequence.
- [ ] Adaptive music with ≥ 2 stems; ≥ 20 unique sound effects.
- [ ] Reads `difficulty` and `dreamsCaught`.
- [ ] No softlocks: every puzzle has retry; every pit has a checkpoint within 20 s of play.

---

## PART B — CHEF DREAM: "FIVE-STAR DREAM" (full specification)

**Fantasy:** Jo dreams of being a Michelin-star chef. The dream is a grand hotel kitchen — *Hotel Meridian* — that starts realistic and grows more surreal the deeper he goes: pots the size of rooms, rivers of chocolate, a dining room in the clouds. The pressure of "service" is the antagonist: bells, tickets, and a head chef who never says "good."

**Unique level mechanic — CARRY & COOK:** Jo carries one ingredient at a time and delivers it to stations. Some platforms only exist/activate when a dish is complete. **Heat** is the secondary mechanic: standing in steam launches Jo upward; touching open flame hurts; wet floors make him slide.

**Palette:** warm brass, copper, cream tile, deep green, tomato red accents; steam is pale blue-white. At higher darkness stages the copper goes gray-brown and the cream goes mustard.

**Music:** brushed-drum jazz swing. Stems: (1) upright bass + brushes (always), (2) piano comping (from Section 2), (3) muted trumpet (set piece & climax), (4) solo piano only (Orb).

**Level tool:** a long **ladle** — attack (short arc, knocks enemies back 32px), ring bells, hit switches, scoop from pots.

### B0. Cast
- **Jo** — player.
- **Marguerite** (sous chef, guide NPC) — kind, tired, keeps saying "Chef will love this." Portrait: hairnet, burn scar on forearm, warm smile.
- **Chef Aurelio** (head chef, climax) — never seen fully until the climax; only his voice over the intercom and a bell. Portrait: tall hat, eyes hidden by its shadow.
- **Bastien** (dishwasher, Small Moment NPC) — hums, sings badly, is the happiest person in the building.
- **Enemies:** *Crawlers* (cockroaches), *Grease Blobs*, *Pepper Mills* (walking, spray pepper clouds), *Gull Thieves* (rooftop only), *Runaway Carts*.

### B1. Section map & timing (target 12–14 min)

| # | Section | Time | Checkpoint | Flag set |
|---|---|---|---|---|
| 0 | Arrival — Service Entrance | 1:00 | CP0 | — |
| 1 | Delivery Alley & Dry Store | 2:00 | CP1 | `chef.crates` |
| 2 | Walk-in Freezer | 2:30 | CP2 | `chef.freezer_valve`, `chef.has_saffron` |
| 3 | THE LINE (set piece) | 3:30 | CP3, CP3b | `chef.ticket_rail`, `chef.rush_done` |
| 4 | Dumbwaiter Shaft & Pastry Loft | 2:30 | CP4 | `chef.piping`, `chef.has_gold_leaf` |
| 5 | The Pass — Chef Aurelio's Service | 2:00 | CP5 | `chef.service_survived` |
| 6 | Rooftop Garden — The Orb | 1:00 | — | `dreams.chef = true` |

---

### B2. Section 0 — Arrival: Service Entrance (1:00)
**Scene:** Night. Rain. Train hisses into a siding behind a hotel. Foreground: chain-link fence, steam from a grate. Mid: brick wall with faded "HOTEL MERIDIAN — DELIVERIES" sign, neon "OPEN" flickering. Far: city skyline, moving clouds.
**Props (min 8):** dumpster, stacked milk crates, wet cardboard, a bicycle, dripping gutter, vent fan (animated), two rats' eyes in a drain (animated blink), a hanging bulb swinging.
**Title card:** "DREAM 03 — FIVE-STAR DREAM" over a copper-pan texture.
**Dialogue D0 (auto):** Marguerite opens the back door.
> M: "You're the new stage? Good, we're drowning. Grab a ladle — Chef wants saffron risotto on the pass by the time the critic sits."
> M: "Kitchen's through there. Freezer's… complicated tonight. Don't touch the red burners. And whatever you hear on the intercom — Chef never says 'good.' Don't wait for it."
**HUD objective:** "Find saffron → deliver to pass."
**Checkpoint CP0** at the door (a hanging order-bell; ring it with the ladle).

---

### B3. Section 1 — Delivery Alley & Dry Store (2:00)
**Layout:** horizontal, 4 screens. Alley (outdoor) → loading dock (conveyor belts) → dry store (tall shelving, ladders).
**Teaches:** carrying, pushing, conveyors, ladle attack.

**Screen 1 — Alley:** Puddles (slide physics, slight). A *Runaway Cart* rolls down the alley every 6 s (telegraph: rattling sound + shaking cart at top of ramp) — Jo must hop onto a dumpster lid or the fence. Jump the fence via wall-jump between fence and wall.
**Screen 2 — Loading dock:** Two conveyor belts (one moving right, one moving left, toggled by a lever). Crates ride the belts. Jo must **ride the belt while dodging low pipes** (crouch/slide) and jump over crates. First *Crawlers* (3) on the dock: stomp or ladle them. Crawlers scatter toward Jo when a light flickers off (lights blink every 5 s — cue to be careful).
**Screen 3 — Dry store, Crate Puzzle (in-world, not modal):** A shelf door 4 tiles high is blocked. Three pushable crates of different heights (1, 2, 3 tiles) are scattered; a **weight-plate** in the floor opens the pantry hatch only while ≥ 2 crates sit on it. Solution: push crates 1 and 2 onto the plate; use crate 3 as a step to reach the hatch before it closes (hatch stays open 4 s after plate pressed — timed dash). Sets `chef.crates`.
**Screen 4 — Pantry:** Sacks of flour (walk through → flour cloud particles, Jo's palette dusts white for 3 s). Hanging garlic strings swing (cosmetic, foreground). Ladders up to a mezzanine.
**Small Moment #1 — "The Onion":** hidden behind the flour sacks, a tiny alcove. A prep cook is chopping onions and crying and laughing at a joke on the radio. Jo sits on a bucket for 6 s. Text: *"He wasn't crying about anything."*
**Dialogue D1 (trigger at pantry exit):** Intercom, Chef Aurelio (voice only): "SAFFRON. Where is my saffron. Freezer. NOW."
**Checkpoint CP1** — bell at the freezer door.
**Enemies:** Crawlers ×5, Runaway Cart ×1 (loops). **Hazards:** puddle slide, low pipes on belt, closing hatch.

---

### B4. Section 2 — Walk-in Freezer (2:30)
**Layout:** 3 screens horizontal then 1 vertical. Blue palette shift, breath particles on Jo, frost on the screen edges.
**Mechanics:** **Ice floors** (friction 0.05 — momentum carries; stop by jumping or hitting a wall). **Cold meter** (top-left, replaces nothing — small thermometer): drains over 40 s; standing under a heat lamp refills. Hitting 0 = 1 heart and respawn.
**Screen 1 — Shelving rows:** Hanging carcasses swing on hooks (foreground silhouettes, some block the path and must be pushed to swing — push one, run through while it's away). Icicles fall from the ceiling when Jo passes under (telegraph: crack sound + shaking icicle, 0.5 s). Frozen fish crates as platforms.
**Screen 2 — The broken compressor:** Steam-cold jets fire horizontally from broken pipes every 3 s in a pattern (A–B–A–C); each jet pushes Jo 64px. Cross by timing. A heat lamp mid-screen.
**Screen 3 — Puzzle-box P1: "Freezer Valve":** A locked control panel. **Modal puzzle:** a dial with 8 positions and 3 pipes shown as a circuit. Rotating the dial changes pressure in pipes; gauges must all sit in the green band simultaneously. Rules: dial position N sets pipe pressures to (N mod 3, (N×2) mod 5, (N+1) mod 4) — designer sets one dial position (position 5) where all three land in green; the panel shows gauge needles animating live. Fail state: gauges overshoot → red flash, panel reboots (2 s), retry unlimited. Success → compressor stops, all ice jets stop, ice floors partially melt into water (slide changes from 0.05 to 0.5 friction), a frozen **ladder of ice** thaws exposing a metal ladder. Sets `chef.freezer_valve`.
**Screen 4 (vertical) — Saffron vault:** Climb the ladder past **swinging chain hooks** (pendulum, 2 s period) and **falling ice blocks** (spawn on timer, break on floor). At top: a tiny glowing tin — **Saffron** (carryable; Jo keeps it through the level as a story item; shows in HUD slot). Sets `chef.has_saffron`.
**Dialogue D2 (pickup):** Marguerite over radio: "You found it? Oh thank God. Ok — through the line. It's rush. Stay low, stay quick."
**Small Moment #2 — "Warm Pipe":** in Screen 1, a gap under the lowest shelf (crouch-slide). A cat sleeps curled on the one warm pipe in the freezer. Jo crouches next to it 6 s. Text: *"It found the only warm place, and stayed."*
**Checkpoint CP2** at freezer exit (bell frozen — must hit twice to ring).
**Enemies:** none (isolation). **Hazards:** ice floor, cold meter, icicles, cold jets, swinging hooks, falling ice blocks.

---

### B5. Section 3 — THE LINE (set piece, 3:30)
**Layout:** 6 screens horizontal, 2 screens tall. The main kitchen at full service. This is the densest area in the game.
**Background:** far — rows of hanging copper pans (parallax glint). Mid — tiled wall with clocks, ticket printers spitting paper (animated), pass window with heat lamps. Near — cooks (NPC silhouettes) working at stations, arms moving in loops. Foreground — hanging ladles, pot handles, a swinging kitchen door.
**Ambient:** constant steam plumes, burner flares (orange point lights), ticket-printer chatter, shouting ("Behind!", "Corner!", "Hands!") as random voice samples.

**Hazards:**
1. **Burners** — rows of stoves. Blue burner = safe platform. Red burner = fires a flame column every 2 s (telegraph: clicking igniter + red glow 0.4 s). Pattern per stove row is fixed and readable.
2. **Steam vents** — floor grates that launch Jo 5 tiles up when active (white plume). Some are timed, some are triggered by stepping on a pedal.
3. **Swinging pans** — pendulum hazards on chains between stations.
4. **Grease floor** — near the fryer: friction 0.1 and occasional grease-fire bursts.
5. **Ticket rail** — wire over the pass; grabbing it lets Jo zipline (hold Up to ride, Down to drop). Tickets on the rail block the path (ladle them off).
6. **The Fryer** — bubbling oil pit; spits oil droplets in arcs (dodge).

**Enemies:** *Grease Blobs* (slow, bounce; splitting into two smaller on ladle hit; stomp kills), *Pepper Mills* (walk back and forth; spray pepper cloud that reverses Jo's controls for 2 s — telegraph: mill spins), *Crawlers* in swarms of 6 from under the counters when a light flickers.

**Progress structure:**
- **Screens 1–2 (Sauté & Grill):** platforming over burner rows; use steam vents to reach the upper shelf line; deliver the Saffron to the **Risotto Station** (interaction). Marguerite is there; dialogue **D3:** "Saffron in. Now I need the rest of the order fired in sequence or it all dies under the lamp. Ticket rail's a mess — sort it."
- **Screen 3 — Puzzle-box P2: "Ticket Rail":** Modal. Six order tickets are pinned in random order on a rail. Each ticket shows a dish and a cook time (Soup 4, Risotto 18, Fish 8, Steak 12, Salad 2, Soufflé 14). Player drags tickets into a **fire order** so that everything finishes within the same 60-second window with no dish waiting under the lamp more than 3 min. There is a visible timeline that simulates as you arrange. Exactly one order satisfies all constraints (Risotto → Soufflé → Steak → Fish → Soup → Salad); near-misses show which dish "died" with a red X so the player can iterate. Success → rail unjams, station lights turn green in sequence. Sets `chef.ticket_rail`.
- **Screens 4–5 — RUSH (timed segment, 90 s at difficulty 0):** A large **"SERVICE" clock** appears on the HUD. Jo must fetch 3 ingredients (in any order) from three stations and deliver each to the Pass window: **Fish** (on the ice bar, guarded by Pepper Mills), **Herbs** (top shelf, reached only by chaining 3 steam vents), **Bread** (inside the oven room — door opens for 4 s every 12 s; inside, the floor is hot after 3 s → must be quick). Carrying only one at a time forces three round trips through the burner gauntlet. Music: trumpet stem in. Each delivery makes Chef's voice yell "NEXT." Timer runs out → dishes die, "REFIRE" — respawn at CP3 with the delivered count kept (so it's tense, not punishing). Success sets `chef.rush_done`; Checkpoint **CP3b**.
- **Screen 6 — The dumbwaiter:** A rickety lift cage. Jo enters; Marguerite waves. **Dialogue D4:** "Pastry's upstairs. Chef needs the gold leaf for the plate. Don't look down — the shaft's older than the hotel."
**Checkpoints:** CP3 (start of line), CP3b (after rush).
**Small Moment #3 — "Bastien":** the dish pit is a side room off Screen 2 behind a swinging door. Bastien is spraying dishes and singing, terribly, with all his heart; bubbles float everywhere. Jo leans on the wall 8 s. Text: *"Nobody was listening. He didn't need them to."*

---

### B6. Section 4 — Dumbwaiter Shaft & Pastry Loft (2:30)
**Part A — Shaft (vertical, 3 screens up):** The lift rises slowly (auto-scroll up). Walls have jutting pipes and counterweights that sweep through the cage — Jo must **move inside the cage** to dodge, and at two points jump **out** of the cage onto a ledge because a beam blocks the lift, then re-enter after pulling a lever that raises the beam. Cables fray (visual). Music drops to bass only; echoes. At the top the cable snaps — Jo leaps to the loft as the lift falls (cinematic, camera shake, dust).
**Part B — Pastry Loft (surreal begins, 3 screens):** Warm cream and pink palette. Giant bowls, a sugar-work chandelier, a **chocolate river** flowing across the floor (drown = respawn, 1 heart).
**Mechanics:**
- **Rising dough platforms:** touching a "yeast" pedal makes a dough blob expand for 6 s into a soft, bouncy platform, then deflate. Chain them across the river.
- **Spun-sugar bridges:** appear when Jo walks onto their anchor; crack and shatter 1.5 s after first step (run, don't stop).
- **Piping bags** (enemy-ish hazard): mounted on the ceiling, squirt cream blobs in arcs on a timer; cream on the floor is sticky (walk speed halved for 2 s).
- **Gull Thieves** don't appear here; enemies are **Grease Blobs** replaced by **Meringue Puffs** (float, drift toward Jo, pop on ladle — harmless but push you).
**Puzzle-box P3: "Piping":** At the plating table. Modal. A **plate outline** shows a target pattern (a 5×5 grid of dots: a small rosette shape). The player controls a piping bag with WASD/arrows and holds Space to pipe; must trace the pattern **without lifting** in one stroke, and without crossing an already-piped cell. Three patterns of increasing difficulty (Euler-path puzzles). Fail (lift or cross) → plate wipes, retry. Success → a gold-leaf drawer unlocks. Sets `chef.piping`.
**Pickup:** **Gold Leaf** (carryable story item). Sets `chef.has_gold_leaf`.
**Dialogue D5 (pickup):** Intercom, Aurelio: "Stage. Bring it to the pass. Yourself. I want to see your hands." Marguerite (radio, quieter): "…he's never asked to see anyone's hands."
**Checkpoint CP4** at the loft exit (a tiny bell on a cake).

---

### B7. Section 5 — The Pass: Chef Aurelio's Service (climax, 2:00)
**Arena:** the pass — a long counter under blinding heat lamps. Beyond it the dining room is impossibly large, glowing, chandeliers, silhouettes of diners. Aurelio stands at the pass, face in shadow. This is **not** a fight to the death; it is a **three-wave service under his bell**.
**Rules:** A bell on a pole at each end of the counter. When Aurelio rings **his** bell, an **order** appears (icon above the pass). Jo must deliver by grabbing the plate from the correct station (3 stations along the back wall: Hot, Cold, Dessert), carry it across, and place it on the pass before Aurelio's timer (shown as a heat-lamp bar) burns out. Meanwhile:
- **Wave 1 (3 orders):** thrown pans arc across the counter (dodge/duck); floor tiles heat randomly (red glow telegraph).
- **Wave 2 (4 orders):** + Pepper Mills patrol the counter; + steam vents that throw Jo off if stepped; orders now include a wrong "decoy" station lit (must read the icon, not the light).
- **Wave 3 (5 orders):** + the dining room lights go out between orders — only Aurelio's eyes and the lamps visible; Crawlers swarm from the dark; orders come **two at a time** (Jo must decide which one dies).
After **every** delivered plate, Aurelio says only "**Next.**" Never "good." Missing 3 plates total → "REFIRE" respawn at CP5 at the start of the current wave.
**End of wave 3:** Aurelio steps into the light. **Dialogue D6:**
> A: "The risotto. The saffron. The gold. It's… correct."
> J: "Is it good?"
> A: "…Next."
> (He turns away. The lamps click off one by one. The dining room is empty — it was always empty.)
Sets `chef.service_survived`. Checkpoint CP5 at the arena entrance.

---

### B8. Section 6 — Rooftop Garden: The Orb (1:00)
A door behind the pass opens to the roof. Dawn. Herb beds, a beehive, wind. Music: solo piano stem only. **Gull Thieves** are cosmetic here — they steal nothing, just circle. No hazards. One long walk across planks over the herb beds (auto-walk optional if the player holds right for 2 s).
The **orb** floats over the beehive, glowing gold (excluded from darkness shader). Jo catches it; freeze-frame; white fade.
Text card sequence (2 s each): *"Five stars."* → *"Was it enough?"* → the Small Moment message (see A8) → "Return to Crossroads Station."
Sets `dreams.chef = true`, `dreamsCaught += 1`.

---

### B9. Implementation details for the Chef level

**Tiled layers (in this order):** `bg_far`, `bg_mid`, `bg_near`, `decor_behind`, `ground` (collision), `oneway` (jump-through platforms), `hazards` (typed tiles), `decor_front`, `foreground` (scroll 1.2), `objects` (object layer), `triggers` (object layer), `lights` (object layer).

**Object types (object layer, `type` property):** `checkpoint{id}`, `door{id, requires: "flag1,flag2"}`, `dialogue{id}`, `puzzle{id}`, `item{id, carryable:true}`, `station{id, accepts:"saffron"}`, `enemy{kind, patrol:"x1,x2"}`, `hazard{kind, period, offset}`, `vent{mode:"timed"|"pedal", period}`, `lever{targets}`, `plate{crates_required}`, `moment{id}`, `music{stem, action}`, `camera{bounds, lookahead}`.

**Flags used:** `chef.crates, chef.freezer_valve, chef.has_saffron, chef.ticket_rail, chef.rush_done, chef.piping, chef.has_gold_leaf, chef.service_survived, chef.moment1, chef.moment2, chef.moment3, dreams.chef`.

**Difficulty hooks (read `difficulty`):** rush timer 90 → 90×(1−0.1d) s; wave orders +1 per wave at d≥2; cold meter 40 → 40−4d s; red-burner period 2 → 2−0.15d s; extra Pepper Mill in The Line at d≥1; remove the mid-screen heat lamp in the freezer at d≥3.

**Sound list (minimum):** bell, ticket printer, burner click, flame whoosh, steam hiss, ice crack, icicle shatter, cold jet, pan swing, pan clang, grease bubble, oil spit, pepper spray, crawler skitter, blob squish, blob split, cart rattle, conveyor hum, hatch slam, dough inflate, sugar shatter, cream squirt, cable fray, cable snap, plate set, "NEXT" (voice), "Behind!/Corner!/Hands!" (voices), cat purr, dish-pit singing loop, rooftop wind, bees, orb chime.

**Acceptance test for this level:** a tester who has never played must need ≥ 10 minutes; every puzzle must be solvable by reading the screen only (no external hints); all three Small Moments must be reachable without backtracking more than 20 s; no screen fails A2; the "Next." beat must land — never let Aurelio say anything positive.
