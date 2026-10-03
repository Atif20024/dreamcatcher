# DREAMCATCHER — DREAM SPEC: ASTRONAUT — "THE QUIET ABOVE"

Follows Parts A, C, D and the three skills. This is the **biggest and most dramatic** dream in the game: six phases, three gravities, one launch. Target first-run playtime: **20–25 minutes**. It should be the dream players talk about — and the one that ends with the most silence.

**Assumptions (correct me):** the space agency is fictional (*Meridian Orbital Program*), the moon objective is a rescue-and-recovery (below), Jo's return to Earth is where the orb waits, and boxing uses the duel moveset from Part C §C7.2 as a *sport* (gloves, rounds, a referee — nobody gets hurt), which Part D §D6.4 permits because this dream's theme includes it.

---

## 1. STORY

**Logline:** Jo wants to be the one who leaves. He spends a year becoming someone the ground can trust, gets eleven days in the sky, walks on the moon to bring back something someone else left there — and discovers the most beautiful thing he saw up there was Earth, which he had all along.

**Theme:** distance. Every phase takes Jo farther from people; every phase he needs them more. The moon is the loneliest level in the game. The finale of the dream is not the moon — it is looking back.

**Arc (six phases):**
1. **The Body** — a run-down municipal gym and pool where Jo trains for the selection physical: running, swimming, boxing, climbing, breath-holding. He meets **Coach Adaeze** (retired boxer, runs the gym), **Priya** (a fellow candidate, better than him at everything, becomes his friend), and **Dr. Halvorsen** (the program's recruiting doctor, who fails him the first time). Clues for the interview are scattered here in plain sight.
2. **The Gate** — the selection board. A locked door, a panel of three, and questions whose answers Jo saw on the walls, in the pool, in Priya's notebook. Fail, and the letter says "reapply in twelve months." He does. (This is the dark day.)
3. **The Ground** — training: the centrifuge, the neutral-buoyancy pool (a full-scale station mock-up underwater), the simulator, the survival course. Priya is his crewmate. **Flight Director Osei** never smiles.
4. **The Sky** — launch, then the station in zero-g: a coolant leak, a stuck solar array, a spacewalk on a tether. The station has a window.
5. **The Moon** — one-sixth gravity, dust, a dead probe from an earlier mission with a data core the program needs, a crater, a suit alarm, and Priya's voice on the radio going quiet.
6. **The Return** — re-entry, parachutes, a field, grass. The orb is in the grass. *"Was it enough?"*

**What the player should feel:** the training should feel like earning something. The rejection should feel like a wall. Launch should make them hold their breath. The moon should feel enormous and lonely. The grass should feel like relief they didn't know they wanted.

---

## 2. CAST
- **Jo** — player. Level tool: at first just his hands (gloves in the ring); from Phase 3 a **multitool** (torque wrench / tether hook — the game-wide shove/interact tool). Duel moveset unlocked only inside the ring.
- **Coach Adaeze** — 60s, ex-boxer, runs the gym, calls everyone "champion." Teaches the sport. Small Moment NPC.
- **Priya Raman** — candidate, then crewmate. Faster, calmer, kinder. Keeps a notebook (the interview's biggest clue source). Companion NPC (Part D companion rules) in Phases 3–5, on the radio in Phase 5.
- **Dr. Halvorsen** — recruiting flight surgeon; fails Jo the first time. Precise, not cruel. "Your numbers are your numbers."
- **Flight Director Osei** — the ground. Voice on comms through Phases 4–6. Never says "good"; says "copy."
- **The Board** — three silhouettes behind a desk at the Gate. Their questions are the puzzle.
- **Foes** (non-lethal people/things per D6): *Sparring partners* (in the ring only — duel), *Gym rats* (block the equipment, shove), *Security* (badge checks at the Ground — hide/distract), *Debris* (orbit: tumbling panels — creatures class, avoid), *Dust devils* (moon: push Jo, drain suit power), *The Alarm* (a suit-alarm "creature" that must be silenced by finding the fault).

---

## 3. LEVEL MECHANICS (unique to this dream)

### 3.1 The Body (stat build — Phase 1 only, carries through the whole dream)
Four **fitness stats**, each 0–5 pips, shown on a clipboard in the objective HUD during Phase 1: **Lungs** (breath/O₂ meter length), **Grip** (hang time & tether pull speed), **Legs** (jump height in 1g; irrelevant later — the joke is that legs don't matter in space), **Nerve** (starting Nerve level in the ring and during the launch and moon alarm). Each is trained by a minigame room (§5.1). Stats are **required** by the Gate (minimum 3 in each) and **matter** later (a Lungs-2 astronaut can't finish the long EVA without a refill).

### 3.2 Gravity (Phases 4–5)
`scene.gravity` switches per section: **1g** (Earth/Ground), **0g** (station/EVA), **⅙g** (moon).
- **0g:** no ground. Jo moves by **push-off** (Space when touching any surface: launch in the facing direction at fixed speed; he drifts until he touches something), **grab** (E on a handrail — rails are the platforms of this world), and **tether** (F: fire the tether hook up to 6 tiles; hold F to reel in). Momentum is conserved; a bad push-off drifts you to a wall you must then push off again. Rotation is cosmetic (Jo tumbles slowly while drifting).
- **⅙g:** jump height ×3, hang time ×2.4, run is a bounding lope (8-frame "moon bound" cycle), landing kicks up dust that hangs 3 s, momentum is hard to kill (friction 0.3). Long jumps are terrifying and slow.

### 3.3 Suit (Phases 4–5)
O₂ meter (length = Lungs stat), refilled at airlocks and the lander. Suit **power** meter drains in dust devils and when the tether reels. Both at zero = Jo "wakes" (death, checkpoint). The suit has a **HUD visor**: pressing Tab toggles a translucent overlay that shows objective markers and the star chart — the player must learn to read it.

### 3.4 Comms
A **radio channel** (top-left, under hearts) with a signal bar. Osei and Priya talk over it. When signal drops (behind the station, in the crater), Jo is alone and the music drops out. Several objectives require **reporting** (E at a comms panel) before a gate opens — the ground has to know.

---

## 4. SECTION MAP & TIMING

| # | Phase / Section | Time | Checkpoints | Flags |
|---|---|---|---|---|
| 0 | Arrival — The Municipal Gym | 0:45 | CP0 | — |
| 1 | The Body (5 rooms + the physical) | 5:00 | CP1a–e | `astro.stats_*`, `astro.physical` |
| 2 | The Gate — Selection Board | 2:30 | CP2 | `astro.rejected`, `astro.selected` |
| 3 | The Ground — Training (4 rooms) | 4:30 | CP3a–d | `astro.centrifuge`, `astro.pool`, `astro.sim`, `astro.survival` |
| 4 | The Sky — Launch & Station | 4:00 | CP4a–c | `astro.docked`, `astro.array_fixed`, `astro.eva_done` |
| 5 | The Moon — Descent, Probe, Rescue | 4:30 | CP5a–c | `astro.landed`, `astro.core`, `astro.priya_safe` |
| 6 | The Return — Re-entry & the Field | 1:30 | — | `dreams.astronaut` |

**Palette:** gym — sweat-yellow fluorescents, cracked green tile, red ropes → Gate — grey carpet, one wood desk, cold white → Ground — concrete, safety orange, chlorine blue → Sky — black, white station modules, blue-white Earth glow (the brightest thing in the game so far) → Moon — grey-on-grey, hard black shadows, one blue marble in the sky → Field — green, gold, soft.
**Music stems:** (1) heartbeat kick + bass (always), (2) piano (gym, Ground), (3) strings pad (Sky, Moon — cuts with signal loss), (4) brass swell (launch, landing, return only), (5) solo trumpet over silence (Moon crater, Field).
**Coin:** mission patch, **worth 10**, budget 45–55. Key items per section (§9).

---

## 5. SECTION DETAILS

### PHASE 0 — Arrival (0:45)
Train pulls into a siding behind a municipal sports centre at dawn. A hand-painted sign: **ADAEZE'S — BOXING · POOL · "COME AS YOU ARE."** A faded recruitment poster on the fence: **MERIDIAN ORBITAL PROGRAM — CANDIDATE INTAKE — MINIMUM STANDARDS INSIDE**. Title card: **DREAM — THE QUIET ABOVE**.
**D0** — Adaeze (skipping rope, not looking up): "Selection's in nine weeks, champion. Everybody in here's trying. Sign the sheet, don't touch the good bag."
**Objective:** *Reach 3 pips in every stat.*

### PHASE 1 — The Body (5:00)
A hub-within-a-dream: the gym's main hall connects five training rooms and the doctor's office. The hall itself is a platforming space (ropes, rings, a climbing wall `|`, stacked mats as slopes, a mezzanine track). **Gym rats** hog equipment (shove or wait); a **cleaner** with a floor buffer patrols (hide behind mats or get "escorted out" = caught). Each room is a **stat minigame** with a hard version worth coins:

1. **The Track (Legs)** — a looping mezzanine with hurdles on the beat; laps in rhythm raise Legs. Hard: hurdles become rolling medicine balls. Clue on the wall: a poster of the launch vehicle with its **name and stage count** (interview Q).
2. **The Pool (Lungs)** — an underwater platformer: swim through hoops, surface at floats to breathe; O₂ meter introduced here. Hard: the deep end, lights off, a sunken locker with the shard. Clue: lane numbers painted on the floor spell the **program's founding year** when read in swim order (Priya points it out later if missed).
3. **The Wall (Grip)** — climbing wall with crumbling holds (hang timer); reach the bell. Hard: no chalk (holds crumble faster). Clue: a plaque under the bell — **"first Meridian crew: 3 names."**
4. **The Ring (Nerve)** — **boxing**: three 45-s rounds against sparring partners with the duel moveset (jab = strike, guard, slip = parry, counter). No killing, no falling off — the ropes hold; losing = knocked down, count of 8, round restarts. Coach shouts the tutorial. Hard: Priya as the third partner, who parries everything the first time — the only way to win is to *not* attack for a bar and let her come to you (the Nerve lesson). Clue: Adaeze's fight poster: her record, which the Board asks about because the doctor is her old sparring partner (a human question, not a trivia one).
5. **The Study** — a quiet room with Priya. Not a minigame: a **flashcard puzzle-box P1 "Systems"** (10 cards: label station modules, orbital terms, the three names, the year, the vehicle). Priya's notebook is readable page by page — it contains every answer the Board will ask, in her handwriting, with doodles. Reading it fully takes 60 s. Players who skip it will fail the Gate.

**The physical** (end of Phase 1): Dr. Halvorsen's office. A short scripted sequence: treadmill (hold run), breath test (hold Space until the meter — Lungs — is full), grip test (mash), a light in the eyes. **D1** — Halvorsen: "Numbers are numbers. Grip's low. Lungs are… fine. Board's Thursday. Don't argue with the board." Sets `astro.physical`.
**Small Moment #1 — "Rope":** early morning, Adaeze skipping alone in the empty hall, perfectly, eyes closed. Jo watches 8 s from the door. Text: *"She'd stopped competing thirty years ago."*
**Checkpoints:** CP1a hall, CP1b–e at each room door (bells are boxing bells).

### PHASE 2 — The Gate (2:30) — THE DARK DAY
A corridor of chairs; candidates in silhouette; a door with a **light**. The Board room is a puzzle-box.
**Puzzle-box P2 "Selection":** three silhouettes ask **seven questions**; each answer is chosen from 4 options (some are typed 2-digit numbers). Questions draw *only* from Phase 1 clues (the vehicle, the year, the three names, module labels, "how many rounds did you go with Adaeze," "what's the first thing you do in a cabin depress" — from the notebook, "who would you give the seat to" — the only answer that's *always* right is "Priya"). Wrong answer = the light above the door blinks red; three wrong = **rejected**.
**First attempt is rigged:** even at 7/7, if any stat < 3, Halvorsen reads: *"Not this intake."* The **letter** (a screen the player must read): "reapply in twelve months." Palette drops to grey. The gym is **twelve months later**: posters faded, the good bag gone, Priya **has been selected** — she is packing. **D2:**
> Priya: "I got it. I'm sorry."
> Jo: "Don't be. Who else."
> Priya: "You. Next year. Read the notebook again — I left it."
Jo trains again (rooms replay in *hard* mode, worth double coins, with a 5-minute timer on the objective HUD — the year compressed). Then the Gate again. Pass → `astro.selected`; the corridor door opens onto a bus with a program logo. If the player fails the second Gate, the letter says "reapply," the year passes again (no extra hard mode; a mercy).
**CP2** — the corridor chair.

### PHASE 3 — The Ground (4:30)
A training campus at dusk: hangars, a water tower, the pool building, the centrifuge dome. **Security** patrols with badge checks (Jo's badge is a key item; lose it — the scalper-type "thief crow" steals it on the roof — and every guard becomes a catcher until it's recovered). Priya is the companion.
1. **Centrifuge (Nerve):** a rotating arm; a rhythm hold — keep Space pressed at the right pressure (a needle in a green band) through 4 stages; screen edges darken, HUD shrinks (G-lock), colors desaturate; release early = the arm stops, a doctor frowns, retry. Passing gives the **flight suit** (Jo's sprite changes permanently for the dream).
2. **Neutral-buoyancy pool:** the station mock-up underwater. **First zero-g practice**: push-off, rails, tether — in water, with divers as helpers. Objective: replace a panel (carry it through the module maze with O₂). Priya's bass-clef equivalent: **two-person tasks** (a hatch needs both).
3. **Simulator:** a cockpit puzzle-box **P3 "Docking"**: align a target crosshair using six thruster buttons with momentum (each press adds velocity; no braking except opposite press); dock within tolerance before fuel runs out. The sim then **fails a system** at random (visor flashes) and Jo must pick the correct checklist item (from the notebook). Three runs.
4. **Survival course:** a night forest with rain (the dream borrows the road's darkness): build a shelter (carry 3 items), find the beacon, **carry Priya** (she "twists an ankle" — a scripted carry section, slower, no jumps > 2 tiles, dark). Osei at the end: "Copy. You're on the manifest." **D3** — Priya, quietly: "You carried me for a kilometre." Jo: "You carried me for a year."
**Small Moment #2 — "Water tower":** climb it at the end of Phase 3; the campus lights, a launch pad far off, Priya joins without a word. 10 s. Text: *"They didn't talk about the sky at all."*
**Checkpoints:** CP3a–d at each building.

### PHASE 4 — The Sky (4:00)
**Launch (1:00, cinematic with input):** the tower, the elevator, the hatch. Countdown on the HUD. During the burn the player must **hold the correct button per callout** ("Breathe" = hold Space; "Brace" = hold Down; "Callout" = press E to say "copy") while the screen shakes and the Nerve meter climbs; miss three = an abort and restart at the hatch. **Staging** — a lurch, silence, and then the window: **Earth**. Music: brass swell, then nothing but the strings pad. Freeze 2 s. Osei: "Copy." That's all.
**Station (2:00):** modules as rooms, **0g platforming** (rails, push-offs, tether). Objectives in order, each opening the next hatch:
- **Coolant leak** — follow a spray of droplets (particles) through three modules to a valve; a valve wheel (`V`); Priya must close the isolation hatch on the other side (two-person).
- **Debris** — the station shudders; loose panels tumble through the modules (creature foes: avoid; a hit = thrown against a wall, −1 heart, not death). Find the **comms panel** and report (E) before the next hatch opens.
- **Stuck solar array** — the window shows it. Airlock. **EVA (1:00): the tether is life.** Outside is a hull with handrails and nothing else; the array truss extends 20 tiles. O₂ drains; the tether must be re-hooked every 6 tiles (a missed hook and a push-off = drifting away, slow, the death animation is Jo shrinking against Earth — make it beautiful and awful). At the array: **puzzle-box P4 "Hinge"** — a jammed hinge shown as a 6-bolt pattern; loosen in the right order (the order is printed on the truss in a code from the notebook's module page) with the torque wrench; wrong order = a bolt floats off (retrievable once). Array deploys: light floods the station. Sets `astro.array_fixed`, `astro.eva_done`.
**Small Moment #3 — "The window":** any time on the station, float to the cupola and hold Up for 10 s. Earth turns. Cities are lights. Text: *"Everyone he'd ever met was in the window."*
**Checkpoints:** CP4a hatch, CP4b node module, CP4c airlock.

### PHASE 5 — The Moon (4:30) — THE LONELY LEVEL
**Descent (0:30):** the lander; the docking puzzle again but with a **surface** — land within a lit ellipse, slow enough (a vertical thrust puzzle with dust obscuring the last 3 tiles). Hard landing = −1 heart, lander damaged (a tighter power budget for the phase). Sets `astro.landed`.
**Surface (3:00):** ⅙g platforming across a **regolith field → boulder ridge → the crater**. Hazards: **dust devils** (push, drain power), **sharp rocks** (suit puncture = O₂ leak, must patch with a kit at a marked spot within 30 s), **shadows** (in black shadow the visor is required to see the floor; hidden drops), **the horizon** (the level is wide and the far layer is a black sky with one Earth — always visible, always small).
**Objective — the dead probe:** a tilted lander from a lost mission on the crater rim. Recover its **data core** (key item, heavy: jump height −40% while carried). Reaching it: a **bound-jump gauntlet** over crevasses in ⅙g (distances 6, 8, 10 tiles — huge, slow, honest coin arcs) and a **crumbling rim** (loose tiles in slow gravity — they fall *slowly*, which is worse).
**The rescue (1:00):** with the core, radio: Priya's voice — she went to the rover to fix power and the rover slid into the crater; her signal bar is one pip. **The Alarm** starts in Jo's suit (power fault, a screech-creature that follows him). The crater is a **shaft descent** in ⅙g: hang-drops down black terraces, visor on, O₂ ticking, signal gone (music gone). Find Priya (a dim helmet light), **carry her** (the survival-course carry, in ⅙g: floaty, terrifying, long), silence the Alarm by finding the fault (a loose cable on his own back — he can't see it; **Priya tells him where** over the radio once she's conscious — the game's last companion mechanic: press F and she speaks the fix). Tether both to the rim winch; **reel up** (hold F, Grip stat = speed) as O₂ nears zero. Sets `astro.priya_safe`.
**D4** — on the rim, both lying in dust, Earth above: Priya: "Did you get it?" Jo: "Got what?" Priya: "The core." Jo: "…Yeah." Priya: "Look up." (Freeze. Earth. 4 s. No music.)
**Checkpoints:** CP5a lander, CP5b probe, CP5c crater floor (a flare Jo plants).

### PHASE 6 — The Return (1:30)
**Re-entry (0:30):** the capsule; the launch mechanic reversed (hold per callout), fire outside the window, comms blackout (signal bar empty, the player holds Space alone for 15 s in orange light). Parachutes: a jolt. Silence. Then wind.
**The field (1:00):** the hatch opens on a **green field at dawn**. 1g. Jo climbs out — the "hard land" animation as his legs remember weight — and **walks** (auto-walk if the player holds right). Grass moves. Birds. Osei's voice, for the first time not on radio, from a truck at the fence: "…Good." (The only "good" in the dream; play it small.) Priya is carried past on a stretcher, thumbs up. The orb sits in the grass a hundred tiles from the capsule, at the fence, next to Adaeze — who came. She says nothing; she nods, skipping rope over her shoulder.
Jo catches the orb. White fade. Text cards: *"Eleven days."* → *"Was it enough?"* → Small-Moment line, plus:
- if the player read the whole notebook in Phase 1: *"She'd written the answers for him."*
- if the player failed the Gate twice: *"Twelve months, twice. He'd have done twelve more."*
Sets `dreams.astronaut = true`.

---

## 6. PUZZLE-BOXES (summary)
| Id | Where | Mechanic | Solution source |
|---|---|---|---|
| P1 Systems | Study | drag labels onto a station diagram, 10 cards | notebook |
| P2 Selection | Gate | 7 questions, 4 options / typed numbers, 3 strikes | Phase 1 clues + notebook |
| P3 Docking | Simulator | momentum crosshair, six thrusters, fuel limit, checklist on fault | practice + notebook |
| P4 Hinge | EVA | 6-bolt order with a torque wrench, floating bolt on error | code on the truss + notebook module page |
| (Landing) | Moon | vertical thrust with dust occlusion | practice |

## 7. DIFFICULTY (must be hard; must be fair)
- Gate minimum stats 3 (d0) → 4 (d≥2). Second-year hard rooms are mandatory at d≥1.
- EVA tether hook interval 6 tiles → 4 at d≥2; O₂ = 40 s + 10 s × Lungs.
- Moon crevasse distances scale with d (+1 tile at d≥2); crumbling rim tiles fall faster at d≥3.
- Debris count 4 → 7. Security guards +1 per d. Boxing partners' parry window shrinks 10 ms per d.
- Fail states: Gate = a year (narrative, not a reset); EVA drift = checkpoint; moon O₂ = checkpoint; carry-Priya section has an invisible 10-s O₂ grace so the rescue can't fail at the last step (but the meter shows red).

## 8. WHAT MAKES IT DRAMATIC (do not cut these)
The staging silence and the first window. The rejection letter with the grey year. Carrying Priya twice (once in rain, once in ⅙g). The tether. The signal bar going to zero. "Copy" thirty times and "Good" once. The grass.

## 9. KEY ITEMS & COINS (per the collectibles skill)
| Section | Key item | Behind | Tool use | Flag |
|---|---|---|---|---|
| Body | Gym pass / Priya's notebook | the cleaner + the Study | notebook is readable | `astro.notebook_read` (if fully read) |
| Gate | The letter | — | — | `astro.rejected` |
| Ground | Badge / flight suit / beacon | security, centrifuge, forest | suit changes sprite | per room |
| Sky | Valve wheel / torque wrench | coolant chase, airlock locker | wrench opens P4 | `astro.eva_done` |
| Moon | Patch kit / data core / flare | sharp-rock field, probe gauntlet, crater | core is heavy | `astro.core` |
Coins: mission patches, worth 10, budget 45–55, tiered per the placement skill; the moon's coins are only on crevasse arcs.

## 10. IMPLEMENTATION (Part D stack)
- `src/data/astronaut/rooms.js`, `tiles.js`, `sprites.js`; new legend chars: `~` water (pool), `R` handrail (0g), `Z` regolith (dust), `D` deep shadow (visor-only floor), `K` hook point (tether).
- `scene.gravity` per room in `room.physics = { g: 1 | 0 | 0.166 }`; `Player` gains states `swim, float, push_off, rail_grab, tether, bound, carry_person`.
- Stats in `flags.astro.stats = { lungs, grip, legs, nerve }`; minigame rooms write them; Gate and suit read them.
- Suit meters use the HUD meter slot (Part D / ui-type skill); visor = a full-screen overlay panel at 40% with objective markers.
- Companion: reuse the musician's Nia implementation for Priya (call, two-person plates, radio lines when out of range).
- Boxing: enable duel moveset via `room.allowDuel = true` only in ring rooms.
- Signal: `radio.signal` per room region; `MusicDirector` drops the strings stem at signal 0.

## 11. ACCEPTANCE
- First-time ≥ 20 min; ≥ 1 tester fails the first Gate *because they didn't read the notebook* and passes the second because they did.
- Testers report the moon as the loneliest section and the field as the most relieving — in those words or close.
- Both Gate outcomes, both landing outcomes, and both notebook states are playable to the orb.
- Every 0g room passes the anti-skip bot (no drift exits); every ⅙g jump distance is 6, 8, or 10 tiles exactly.
