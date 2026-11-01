# Deep review: the Chef dream and the Astronaut dream

Reviewer: a senior game designer and a pro gamer, in one read. Standard (the owner's, verbatim): "so that its very engaging and interesting. nothing should feel like its not well thought out".

**I did not play.** Everything is read from code and data. Anything about feel, length or fairness is marked **(inferred)**. Anything I traced in code and am sure of is marked **(code)**. Where I could not tell from code whether something is a bug, I say **verify**.

Read first, so I do not repeat them: `fresh_review_design.md`, `fresh_review_feel.md`, `fresh_review_art.md`, `lead_design_review.md` (§2.4 and §2.6 already propose rebuilds of both dreams; §3 and `round2/ASTRO_TRACK_REPORT.md` and `SOFTLOCK_POOL_REPORT.md` cover the astronaut's track, pool and props, which stay as they are). Skills applied: genres:platformer, disciplines:level-design, game-feel, audio-design, dialogue-systems, dreamcatcher-character-motion, game-balancing.

Files read in full: `src/scenes/ChefScene.js`, `src/data/chefMap.js`, `src/data/chef/rooms.js`, `src/systems/puzzles.js`, `src/scenes/AstronautScene.js`, `src/data/astronautData.js`, `src/data/astronaut/rooms.js`, `src/systems/astroPuzzles.js`, plus `src/data/teach.js`, `src/audio/places.js`, `src/audio/bands.js`, `src/builders/parallax.js` (clue props) and the `hurt` path in `BaseLevel.js`.

---

## Verdicts

**CHEF (FIVE-STAR DREAM)**
- Engaging in bursts (the beat-driven burners, the cold climb for the saffron, "...Next." as the ending), but it plays as six unrelated minigames wearing a kitchen coat; it does not feel like cooking.
- Biggest single thing wrong: the story's promised payoff is not built. The gold leaf Aurelio asks Jo to carry "yourself... I want to see your hands" is never handed over, and as written it blocks the final service (`ChefScene.js:522`, see C-M1). The dream's one great scene is described, not played.

**ASTRONAUT (THE QUIET ABOVE)**
- Engaging: the best story in the game and the best movement variety (ground, water, zero-g with a tether, moon, a carry-down-a-crater finale). It earns its length in the second half.
- Biggest single thing wrong: the first half's story beat (the Board rejects you, Priya gets the seat, the grey year) only happens to players who ignore the objective. A player who trains to 3 in every stat, as the HUD and the study-room objective tell them to, can pass the Board first time and never meet it (`AstronautScene.js:808-818`, see A-M1). The best idea in the game is accidentally optional.

---

# PART 1: THE CHEF

## 1.1 A first-time player, minute by minute (inferred from room data and scripts)

Jo moves 280 px/s (`Player.js:27`), so the whole 10,240 px strip is 37 seconds of pure running. The real length is the stops.

| When | What I see and do | What I want next | Boredom / confusion / "nothing happened" |
|---|---|---|---|
| 0:00 | Kerb at night, neon "OPEN", sign "HOTEL MERIDIAN - DELIVERIES". After 0.9 s a dialogue box: Marguerite (a portrait, nobody on screen). | To find Marguerite. | **Nobody is there.** The only NPC objects (`rooms.js` lines for `marguerite`, `aurelio`) are never drawn; they only feed the audio speaker list (`BaseLevel.js:1005`). A voice from nowhere. |
| 0:10 | Rat by the kerb, coins on the ramp. Objective "find the service entrance". Gate g0 opens as soon as d0 ends. | Go right. | The gate sign says "hear Marguerite out" but it is already open when the player can first read it. Harmless. |
| 0:30 | Alley. Runaway cart charges. Chimney wall-jump with a card. Three crawlers on the dock. | What is the goal? Objective: "two crates on the plate". | Crates are among the roaches, behind me. The plate is at col 72, far right, past the dock hand. A first-timer sees a plate and no crates. |
| 1:00-2:30 | Push crates (max 80 px/s, `ChefScene.js:270`) 25 tiles past a patrolling dock hand under a 2-tile beam. | Hatch to open. | **Slow, then exact.** 10 s per crate at 80 px/s. The 3-high crate (96 px) cannot go under the 64 px beam, so it is a decoy that looks like the best crate (**verify**). Dock hand grab drops the crate. |
| 2:30 | Hatch opens (stays open 4 s after the last frame the plate is held). Marker m1: a "[E]" prompt over bare floor (see 1.3). | Freezer. | The m1 text describes "a prep cook chops onions, crying" - no prep cook is drawn (`decorate()` only draws four white circles). |
| 3:00 | Freezer: ice floor, icicles, jets, cold meter appears (nobody taught it), heat lamp. | Valve, then saffron. | `DIALOGUES.d1` ("SAFFRON. Where is my saffron. Freezer. NOW.") is **never played** (code: no `d1` call in `ChefScene.js`). The player has no pressure in here but a meter. |
| 3:30 | Valve modal: dial one of 8 positions, watch three gauges, find the one that is all green. | Done. | A 5-second scan. Fine as a breather, no thinking. |
| 4:00 | Climb shelves past swinging pans to the saffron on a pedestal. "SAFFRON - the whole order dies without it". d2 radio. | Back out, to the line. | **Good moment.** The best-built objective in the dream. |
| 4:45 | The Line: six burners on the beat, vents, grease blobs, pepper mills, sous-chef. Risotto station at col 140: hand over saffron, d3. | The ticket rail. | Beat-synced burners with a click on the warning beat are the dream's best craft (`ChefScene.js:360-371`, `931`). |
| 5:30 | Ticket rail: sort 6 cards by minutes, longest first. | Now what? | **Takes 10 seconds and teaches nothing the next scene uses.** It sets nothing for the rush. |
| 6:00-8:00 | Rush: fish, herbs, bread, three trips to the pass, 90 s clock, same cloche sprite for all three. | The lift. | Three identical errands. The clock is frame-counted (`ChefScene.js:978`, 0.016 per frame): ~94 s at 60 Hz, ~40 s at 144 Hz. The queued refresh-rate pass should include it. |
| 8:00 | Dumbwaiter: ride 13 s up between two counterweights, "the cable frays - JUMP!" | Loft. | **Good set piece.** A forced ride with a clock. |
| 8:45-11:00 | Loft: dough trampoline, sugar bridge over a chocolate river, cream bags, meringue ghosts. Plating puzzle: trace a 3x3 grid in one stroke. Gold leaf. d5. | The pass. | Tone swerves to a candy world with no tie to the rest. The "rosette" is a grey 3x3 grid. |
| 11:00 | Arena. Service: 12 orders, one at a time, wave 2 pepper mills, wave 3 lights go out. | Serve. | **Stuck: Jo is carrying the gold leaf** (C-M1). |
| 14:00 | d6, "...Next." Lamps click off. Roof. Orb. | - | Great ending line. |

Total about 14 to 16 minutes at a first attempt (inferred).

## 1.2 Judgement by aspect

### Characters and actions
- **GOOD, keep:** Marguerite's voice ("whatever you hear on the intercom, Chef never says 'good'. Don't wait for it.") is the best setup line in the game. Aurelio's "...Next." answers it. Marguerite's "...he's never asked to see anyone's hands." (d5) is a quiet gem. The dock hand and sous-chef are real foes with a grab (slide under, shove, hide), not contact damage. Keep.
- **Problem:** the three people who carry the story are not on screen. Marguerite is a portrait; Aurelio is a tinted 5x-scaled portrait texture floating at the pass (`ChefScene.js:525`, `setScale(0.9).setTint(0x777788)`); nobody reacts to Jo (the sous-chef sees him as a foe; no one says a word when he gets burned, cold, or delivers). The cook people in the three small moments are text only (m1 prep cook, m3 Bastien); `chef-cat` for m2 exists as a texture and is never placed (code: grep finds `chef-cat` only in `themes/chef.js` and `scale.js`).
- No reason for the sous-chef to be there other than "a human foe". He patrols 157-166 between the risotto station and the pass: the rush runs through him. He does nothing story-wise.

### Level
- Seven rooms, strip of 320 tiles: alley/dock, freezer, line, loft, pass, roof. Flow is readable: left to right, one gate per room, one checkpoint per room, coins on risk lines (good coin placement: "the pay is past him, under the beam").
- **GOOD:** the freezer is the most considered room. Shelves under icicles, a shard above the icicle shelf, the saffron up a shaft with pans.
- **Dead or empty:** the first 25 tiles are 3 coins, a rat and a ramp (fine, a staged calm). The rooftop is 14 tiles for the orb. That is intended: "no hazards". It could use the dawn beat (see NICE).
- **Secrets worth exploring:** coins and shards. There is no discoverable story thing (no kitchen staff to find, no photo on a wall). Nothing says "this kitchen has history".

### Obstacles and hazards
- **Varied:** icicles, cold jets, swinging pans, burners, vents, grease, oven door on a 12 s cycle, counterweights, sugar planks, cream. That is a lot of types, and most are **fair and readable** because they telegraph (icicle shakes 0.5 s; burner flashes and clicks).
- **Not escalating:** each hazard appears once and is gone. Nothing returns in a harder form. The pass finale reuses pans and hot tiles but they are different pans (thrown) than the freezer's.
- **Filler:** the three crawlers on the dock (44, 48, 52) - roaches walking on a floor the player ignores (the pay is on the conveyor line above). They are speed bumps, not a lesson.
- **Wave 2 pepper mills reverse controls for 2 s** (`ChefScene.js:1134-1137`) right on the platforms Jo must use to serve; 2 s of reversed controls near hot tiles is nasty and un-telegraphed beyond a cloud; the cloud is 46 px but the reverse check is 80 px (cloud smaller than the effect). Fix in SHOULD.

### Story
- Told in 7 short dialogues, plus the card "Five stars. Was it enough?" The thesis (an unfinished approval) is clear and lands in d6.
- **Connection to the whole game:** the sign at the kerb says "HOTEL MERIDIAN"; the astronaut's programme is the "Meridian Orbital Program" and the rocket "MERIDIAN LV-3". Two dreams share a name for no reason. Either it is a deliberate wink (then show a MERIDIAN matchbook in both) or it is an accident (then rename the hotel). Inferred as an accident.
- **Broken promise:** d5 sets up "I want to see your hands." Nothing in the game does anything with Jo's hands. d6 says "The risotto. The saffron. The gold." as if all three were delivered; the gold never is (C-M1).

### Objectives
- Per-room objectives read well, and change with flags (`rooms.js` OBJECTIVES).
- **Wording:** `ChefScene.js:107` sets "find saffron -> deliver to pass" but the saffron goes to the risotto station, and "the pass" means three different places (risotto, the rush pass at col 158, the final pass at col 296). A player on the line will look for "the pass".
- **Worth doing?** The saffron fetch: yes. Crates: it is not clear why. Ticket rail: not clear why. Plating: "pipe the plate" - because the drawer holds the gold. Reasons are given late or not at all.

### Movement
- Asks of the body: wall-jump (ribbed chimney), crouch under a beam and grabs, shove with the ladle, hide spots, push crates, climb shelves, ice slide, conveyors, vent launch, ride a lift, jump over a cream-slowed floor. That is a good spread of the base moveset.
- **Missing:** the ladle is never a verb that matters (it kills crawlers, splits grease blobs; shoves humans). Blobs splitting is clever and fun (keep).

### Music and sound
- **GOOD:** the chef band is a radio swing (C ionian, 112, brushes, walking bass, a band-limited radio horn); `music.trumpet()` brings the horn in for the rush and the service. Hazards ride the beat clock. The freezer has near-silence behind a "wall" filter (`places.js:49`, `R('room', null, 400)`), a considered choice.
- **Gaps:** (1) The compressor "sighs and stops" (`ChefScene.js:327`) but there is no compressor hum to stop. If there is no hum bed in the freezer there is no sound payoff for the valve. **Verify** in `Ambience.js`; add a low drone that drops out. (2) In the finale d6 the text says the dining room "was always empty" but `the_pass` is `R('room', 'kitchen')`: the bed keeps playing chop, ticket bells and order calls (`places.js:31`) through the empty dining room. Silence there would carry the beat.

### Anything else
- **Props with no purpose:** the three "stations" (hot, cold, dessert) are identical scaled tables with a coloured bar; the three rush items and the service plates all use the same `chef-cloche` sprite (`ChefScene.js:428-430, 522`). The pedestal triangle and glints are decoration; keep them (they sell "important").
- **HUD / prompts:** `ChefScene.js:791` sets the prompt position but never its text, so every interaction in the Chef reads a bare `[E]` (the astronaut sets `[E] ${label}`, `AstronautScene.js:2100`). The `label` of each interact is unused. A bare `[E]` over the empty floor of a "moment" is confusing.
- **Death/fail costs:** hurt anywhere while carrying saffron drops it back to its freezer pedestal. A mistake on the line sends Jo back through the cold meter. The cold meter keeps draining after the valve is done (`updateFreezer` ignores `jetsOff`). Together this is harsh but consistent. Keep the item-returns-to-pedestal rule; it is good teaching.
- **Rewards / ending:** card with the "You noticed a little." line counts moments. Good; and the moments are unreachable if you do not know where. The orb card is clean.

## 1.3 Prioritised list (Chef)

### MUST (a player would notice)

**C-M1. The gold leaf is never delivered, and it blocks the service.** (code, high confidence; not playtested)
- File: `ChefScene.js:502-509` (take), `:522` (`!this.carry` guard), `:379/439/605` (the only places `carry` is cleared; none handles `'gold leaf'`), `:194` (`dropCarry` is the only other exit, via any hit).
- Case: Jo takes the gold (`carry = 'gold leaf'`), walks into the arena, the service starts at `p.x > px(266)`. Order 1 appears with a 12 s deadline. Jo presses E at a station: `take('plate:...')` runs only if `!this.carry`, so nothing happens. Orders miss, 3 misses -> "REFIRE", teleport to col 266, still carrying. Jo is only unblocked by getting hit by a pan or hot tile, which prints "the gold leaf is lost!" and sends it back to the loft.
- Fix, which also repairs the story: do not make Jo carry the gold during the service.
  1. When Jo enters the arena with `carry === 'gold leaf'`, put it "in his apron" (`this.goldInApron = true; carry = null;` and keep a small gold glint at his belt). It cannot be dropped by hits during service.
  2. After the third wave, before d6, set `carry` back to the gold with a prompt at the pass: `[E] show your hands`. On E, run d6 (rewritten in C-S1). Delete the lines that treat the gold as handed over elsewhere.
  3. Add a scenario `chef-service-gold` (carry gold into the arena, assert a plate can be taken).

**C-M2. The "see your hands" payoff is missing.** (code)
- File: `chefMap.js:149-156` (d5/d6).
- Case: d5 builds to it; d6 skips it. Fix is the d6 rewrite in C-S1 and the hand-over step above.

**C-M3. Nobody is there to speak.** (code)
- File: `ChefScene.js:103-108` (d0), `:525` (Aurelio as a portrait); the `npc` objects in `rooms.js` are never drawn.
- Case: d0 plays on an empty kerb. Aurelio at the pass is a head-and-shoulders portrait box, scaled to look like a man.
- Fix: draw Marguerite as a rigged person (she exists as a portrait only; use the sous-chef rig with a different hat or the generic adult NPC rig used for Adaeze/Priya in the astronaut, `attachStride(this, sprite, key)`) at the staff door (col 24). Start d0 when Jo is within 6 tiles of her (not on a timer), and have her step through the door as it ends, so the open gate has a reason. For Aurelio, put a rigged chef figure behind the pass window at col 297, back to the room until d6, and turn to face Jo for d6. If the rig work is not ready, a back-lit silhouette in the pass window with the tinted portrait only in the dialogue box is still better than a floating face.

**C-M4. The three small moments have no subject.** (code)
- Files: `ChefScene.js:285` (m1), `:341` (m2), `:402` (m3); `decorate()` `:691-701`.
- Case: m1 "A prep cook chops onions, crying, laughing at the radio." There is nobody there, only a "[E]" prompt over bare floor. m2 describes a cat on a warm pipe; `chef-cat` exists and is never placed. m3 describes Bastien singing while he sprays dishes; the scene draws three bubbles.
- Fix: place the three: a seated cook with a looping chop (an `ev-` style idle with a small radio sprite with notes), the cat curled on a warm pipe in the freezer, Bastien at the pit with a hose arc and soap bubbles. Give each a real label (`[E] watch the cook`, `[E] the cat`, `[E] listen`). The moments are the dream's soul; they should be the easiest thing to find, not hidden.

### SHOULD

**C-S1. Rewrite d0 and d6 so the staging carries the story.**
- File: `chefMap.js:137-156`.
- d0 now (keeps its best line; trims the jargon):
  - MARGUERITE: "You're the new stage, the trainee? Good, we're drowning."
  - MARGUERITE: "Saffron risotto for the critic's table by the time she sits. Freezer's complicated tonight. Don't touch the red burners. And whatever you hear on the intercom: Chef never says 'good.' Don't wait for it."
- Fire `d1` the first time Jo enters the freezer: `INTERCOM - CHEF AURELIO: "Saffron. The freezer. Now."` (3 words fewer; it is cold, he is not).
- d6 now becomes, with the hands carried in:
  - CHEF AURELIO: "Stage. Hands."
  - (Jo holds out the gold leaf. Camera pushes in 10%.)
  - CHEF AURELIO: "A burn on the left thumb. Flour in the nails. Frost still on the cuff."
  - CHEF AURELIO: "The risotto. The saffron. The gold. It's... correct."
  - JO: "Is it good?"
  - CHEF AURELIO: "...Next."
  - narration (unchanged): "He turns away. The lamps click off, one by one. The dining room is empty. It was always empty."
- It lets the burned and frozen state of the player's hands tell the run's story. If the player was never hurt, the line reads "Clean hands. Nothing cooked on them tonight." which is a different, equally good beat. Branch on `this.health` hits.

**C-S2. Make the ticket rail the cause of the rush.** (also the lead review's idea)
- File: `puzzles.js:140-205`, `ChefScene.js:389-395, 420-457`.
- Case: the sort is a 10-second stand-alone puzzle; the rush's fish/herbs/bread are unrelated to it. Fix, cheap: the rail's result sets the order the rush must be served in (fish first if the player sorted fish before herbs...). A minimal version: the cards' order IS the rush order; the objective during the rush reads "fish -> herbs -> bread" in the order they put them in, and a wrong-order serve costs 10 s of the clock. This makes the sort matter and shows the player their own decision.

**C-S3. Show the prompts.** (code)
- File: `ChefScene.js:791`. Add `.setText(\`[E] ${nearest.it.label}\`)`, matching the astronaut (`AstronautScene.js:2100`). Rename labels: 'valve' -> 'turn the valve', 'tickets' -> 'the ticket rail', 'risotto' -> 'hand over the saffron', 'pause' -> per C-M4. One-line fix, large clarity gain.

**C-S4. Piping puzzle says "start anywhere" and does not.** (code)
- File: `puzzles.js:310-319`, instruction at `:266`.
- Case: the first arrow press always enters cell (2,2), the centre, ignoring the key and the text; the player cannot choose a start. It is solvable (a spiral out from the centre) but the instruction lies. Fix: make the first key start on the pressed edge, or change the text to "start at the centre". Also draw a real rosette (concentric dots) in the grey cells; right now it is nine grey squares and calls itself a rosette.

**C-S5. Pepper cloud smaller than its effect.** (code)
- File: `ChefScene.js:1131-1137`. Cloud radius 46 px, reverse at 80 px. A player outside the cloud gets reversed. Fix: make the cloud radius 80 and give 0.4 s of visible swelling before it triggers, or lower the effect to 46.

**C-S6. Crate 3 is a trap.** (inferred, **verify**)
- File: `ChefScene.js:266-275`; `chefMap.js:121-124` beam clearance 64 px; crates 32/64/96 px high.
- Case: the 96 px crate cannot pass under the beam, yet it is the first thing a player picks (tallest). Either make crates 1 and 2 the only pushables and use the third as a ledge (it can serve as a stair to the coins on the beam: that is a real use), or hint it with a gap: the "dark gap" crate stack gag at `BaseLevel.js:280` already exists.

**C-S7. Silence the pass at the reveal.**
- File: `ChefScene.js:645-657`. In `endService()`, after the d6 dialogue starts, drop the kitchen bed (`placeAudio.setBed(null)`) and music, then play one `click` per lamp (the lamps already click off visually only in text). Keep the radio horn out. The line "it was always empty" is then heard.

**C-S8. Rush identical sprites.**
- File: `ChefScene.js:428-430`. Fish, herbs and bread all show `chef-cloche`. Give each its own 12x12 pixel sprite and name the carry card in the pickup line ("a whole fish", "herbs", "bread"). It is cheap and makes the fetch loop legible.

### NICE
- C-N1. Roof: make the dawn do something. When Jo steps into the rooftop, play one held piano note and let the radio fall out (the band does `music.soloPiano()` only after the orb). A beat of "birdsong first" is free.
- C-N2. The kerb sign "HOTEL MERIDIAN": rename (see 1.2 Story) unless it is meant to connect.
- C-N3. Dock crawlers are filler: delete two and let the dock hand be the dock's whole point.
- C-N4. Cold meter has no teaching card. Add a one-line floating text the first time it appears: "the cold takes a heart at zero. the lamp warms you."
- C-N5. Rush clock and a few timers use per-frame constants (`:978`); the refresh-rate pass should include `ChefScene.js:978` and `:700` heat chances.

## 1.4 MAJOR flag (Chef)

**Rebuild on the framework (already ROADMAP #6, "the ticket rail as the verb").** I support it, and the reason is not polish: smaller fixes cannot repair a dream whose six mechanics (crate-on-plate, gauge dial, sort cards, dumbwaiter dodge, sugar-bridge platforming, 12-order fetch) share no verb. They do not teach each other. You never get better at "cooking". The fix for each would be a patch; the lead review's one-night-at-Le-Rêve plan (dish pit, cold store, prep, the line at rush, the pass, the dining room) is the right shape.
- **Keep, whatever the rebuild:** Marguerite's "Chef never says good", Aurelio's "...Next.", "I want to see your hands", the cold-store saffron climb with a lit pedestal, beat-driven burners, the dock hand's slide-under grab, three small moments, grease blobs that split, the "item returns to its pedestal" rule.
- **Do not wait for the rebuild to do:** C-M1 to C-M4 and C-S3, C-S7. They are cheap, and C-M1 is a live bug.

---

# PART 2: THE ASTRONAUT

## 2.1 A first-time player, minute by minute (inferred)

| When | What I see and do | What I want next | Boredom / confusion / "nothing happened" |
|---|---|---|---|
| 0:00 | Gym siding at dawn, a poster, Adaeze. d0 auto after 0.9 s: "Selection's in nine weeks, champion... Sign the sheet. Don't touch the good bag." Then "Board wants three pips in everything - lungs, grip, legs, nerve." | What are pips? | The stats are named by the coach and then shown as a single HUD line. Good (the HUD was reduced). |
| 0:30 | Objective: "run 3 laps for Coach Adaeze - dodge the medicine balls". Adaeze jogs to the deck. | Run. | **GOOD.** Fixed already; keep as is. |
| 1:00-3:30 | Track (3 laps), pool (5 hoops on one breath), wall (crumbling holds, bell), ring (3 bouts). Each pays a stat pip. | Next room. | Clear, short, each one a different body. The ring's three bouts are the same opponent three times (see 2.2). |
| 3:30 | Study. Priya, flashcards (10 Qs), notebook (5 pages), Halvorsen's "physical" (three button-holds). | The Board. | The flashcards do nothing but gate a flag no one reads (`cards_done`, code: set at `:608`, never read). |
| 5:30 | The Board's door in a grey corridor. Seven questions. Seven answers are posted around the gym. Wrong answer prints "(it was the poster over the track)". | - | **Clever teach-by-failure.** Mixed: the Q7 "give the seat away" is a quiz question with three wrong answers (A-S2). |
| 7:00 | Rejection (or, if stats were 3+, selection - A-M1). Grey year, "TWELVE MONTHS LATER". Priya says "I got it. I'm sorry." Jo: "Don't be. Who else." | - | **The best scene in the dream** and half the players can skip it. |
| 8:30 | Campus: centrifuge (hold Space to keep a needle in green, cannot fail), flight suit. Tank: carry a panel, seat it, call Priya with F. Simulator: docking, then a depress quiz. Survival: three items, a shelter, Priya "not answering", carry her to a beacon. | - | The tank and survival forest are long fetch tasks in a dark, wet 26-tile strip. Priya is walking beside Jo until the moment "she is not answering" (A-S1). |
| 14:00 | Launch: countdown, six button prompts, black. The station window. "Osei: copy. that's all." | - | **Great transition.** Keep. |
| 15:00-19:00 | Zero-g: aim, push off, rails, follow droplets to a valve, a debris tumble, comms, wrench, airlock. EVA with a tether. | - | Station is the freshest movement in the game. EVA has no real danger (A-S3). |
| 19:00 | Fade to descent minigame, then the moon. Objective: "the dead probe". | **Why?** | The plot jumps. Priya, who was selected, is suddenly on the moon with a dead rover. Nobody tells Jo or the player (A-M2). |
| 20:00-27:00 | Crevasses, patch kit, probe, core, alarm, crater, carry Priya, winch, rim. d4. | - | **The finale scene is strong:** "Did you get it?" "Got what?" "The core." "...Yeah." "Look up." |
| 27:00 | Re-entry (hold Space for 9 s), a walk across a field, "Osei: ...Good." Priya on a stretcher: thumbs up. Orb. | - | Quietly earned. |

About 28 to 32 minutes (inferred).

## 2.2 Judgement by aspect

### Characters and actions
- **GOOD, keep:** Adaeze (jogs to the track, winds up, rolls balls, repeats the rules), Priya's notebook (hand-written pages, "her handwriting slants left"), Halvorsen ("Your numbers were your numbers. Good numbers, this time."), Osei and the running "copy." payoff to "...Good." A cast with a reason to be there, and who return.
- **Priya in the survival forest:** the narration says "Priya is not answering" and "she says nothing. you pick her up", but she walks beside Jo until he presses E on a fixed spot (code: `updatePriya` keeps `priyaFollow` alive; `priya_hurt` is only an interact mark at col 231, `AstronautScene.js:947-953`). The injury is never shown. The reader is told, not shown.
- **The ring opponents:** three bouts against one "gym rat" with the same behaviour (`boxing()`, `:666-688`). `stats.nerve` starts at 1, so the first bout is labelled "ROUND 2" (`round = nerve < 3 ? nerve + 1 : 4`). There is no round 1. It looks like a counting error.
- **Gym extras:** gym rat and cleaner on the track are human foes with sight and hide spots (mats); they are in the way, not part of the training.

### Level
- Six phases left to right: arrival, gym (track, pool, wall, ring, study), the Board's corridor, the ground (centrifuge, tank, sim, forest), the sky (pad, station, EVA), the moon (field, crevasse, crater), the field home. The phase order is a clean story shape and each phase has its own look and a different set of rules (tints per zone, `ZONES` at `:37`).
- **GOOD:** the station's "hatch A->B->C" modules with gates for coolant, report, wrench. The crater: four terraces down into black, with the shard on a side terrace.
- **Dead ends / empty:** `p2_gate` is a hall of chairs, intentionally empty ("flat on purpose"). `p3_sim` is 12 tiles and a shed: its single contribution is a docking minigame then a quiz. Fine as a pause.
- **Clue props:** the quiz answers live in the world as signposts. They are good ideas, but "LANES 1 - 9 - 7 - 4" for the year 1974 (`parallax.js:927-929`) is too cryptic to be read as a year; `"the year this program was founded"` -> "the lane numbers in the pool" only lands when the failed answer prints its source. Add the year in plain: "LANE 1 - est. 1974" (SHOULD A-S5).

### Obstacles and hazards
- **Gym:** medicine balls (fair, telegraphed, just fixed). Boxing wind-up with a 0.4 s tint, duck to avoid (crouch is a good use of the body). Priya's guard-drop 4 s lesson ("she opens up only when Jo stops swinging") is the nicest mechanic in the gym: it tells the player a thing about themselves. Keep.
- **Station:** tumbling debris 14 s on a timer; the EVA has none.
- **Moon:** dust devils (push + power drain), sharp rocks (puncture, 30 s leak, patch kit), crevasses (6/8/10 tiles, spikes), a shadow patch (visor). Fair and escalating. The 6/8/10 gaps with coins as the arc are great level design (keep).
- **Not escalating enough:** the EVA ("the tether is life") is taught and never tested. Hooks every 6 tiles, a 7.5 tile tether, and a refuse-then-reel safety net mean there is no way to be in danger (A-S3).
- **Frame-rate dependent:** the boxing opponent's wind-up is `Math.random() < 0.012` per frame (`:700`), about 0.7 per second at 60 Hz, 1.7 per second at 144 Hz. The refresh-rate pass should cover it.

### Story
- Told in a short script plus the notebook plus props. It lands because it is small: a friend gets the seat, a year of work, a rescue that inverts it ("You carried me for a year"), and the field.
- **Gap 1 (A-M1):** the rejection is optional.
- **Gap 2 (A-M2):** nothing explains the moon. After the array, Jo goes to a probe, finds a core, and a radio fragment mentions a rover; Priya is down a crater. Priya's mission, the probe, why Jo is the one on the surface: none of it is said.
- **Gap 3:** d3 "You carried me for a kilometre." The carry is about 6 tiles, 4 metres (`priya_hurt` col 231, beacon col 237). The line is a lovely exaggeration but a player can see it is not true. Make the carry longer (a section of the forest) or change the line (SHOULD A-S1).
- **Gap 4:** Q7 of the Board, "One seat left. You may give it away. To whom?", is the heart of the dream and it is a multiple-choice question with a strike (A-S2).
- **Dead line:** `this.rejectedTwice` is never set (`:1515`, code), so the end line "Twelve months, twice. He'd have done twelve more." is unreachable. Either set it (A-N1) or delete it.
- **Connection to the whole game:** "Osei: ...Good." (the one Good) is the exact opposite of the Chef's "Chef never says good". Two dreams answer each other: one denies approval, the other gives it quietly, in a truck, off radio. That is a happy accident or a deliberate design. Say so in `DESIGN.md` and keep both.

### Objectives
- Clear, ordered, and changing with flags (`rooms.js` OBJECTIVES); the per-stat second-year objective that lists what is short and where it is earned is excellent (`gainStat`, `shortStatLine`).
- **Lies:** (1) `g1` gate hint "needs 3 pips in every stat" while the gate requires only the flag `physical` (`rooms.js` gate g1; the Board checks the pips). (2) "the bus is waiting - training campus" (`AstronautScene.js:821`, `rooms.js:359`): there is no bus; the gate to the campus is a door. This breaks the rule the lead review set ("No objective may name a thing the player can't see"). (3) The Board corridor says "the Board. Thursday." Thursday is mentioned by Halvorsen twice and by the objective; the game does not have days. Fine as flavour.
- **Worth doing:** the gym circuit, yes. Flashcards, no.

### Movement
- **GOOD, the dream's strength.** What it asks of the body, phase by phase: run and jump (track), swim and hold a breath (pool), climb and a vault out (wall), duck and jab (ring), carry (tank, forest, crater), push-off and rails and tether (zero-g), long low-gravity bounds and run-ups (moon), walk (field). Each phase retrains the body. This is the right answer to "does it use the moveset": it keeps changing it.
- **Minigame sprawl:** eight modals sit on top: cards, Board, centrifuge (hold), docking (thrust), launch (6 key prompts), hinge (key order), descent (thrust), re-entry (hold 9 s), physical (3 holds). That is nine different mini-controls in 30 minutes; none repeats, so none is learned. This is the real "sprawl" (A MAJOR item).

### Music and sound
- **GOOD:** the use of silence is the best in the game: `music.stop()` at launch, at the unclipped drift, in the crater (`:1980`), on the rim (`:1429`), at re-entry. D Lydian, 66 bpm, a heartbeat sub when seen, and the zones' sound beds.
- **Problems:**
  1. **The gym sounds like a campus.** `LEGACY_ROOMS.astronaut` gives `p1_track`, `p1_pool`, `p1_wall_ring` the bed `campus` (`places.js:76-78`) = birds, console beeps, a door (`places.js:35`). An indoor boxing hall has no birds. The gym is the first ten minutes of the dream and the music (a sparse synth, no percussion) has no drive for a training montage.
  2. **Rooms with no entry keep the last bed.** `LEGACY_ROOMS.astronaut` stops at `p4_station` (`places.js:71-82`). `enterAudioRoom` only calls `setBed` when an entry exists (`BaseLevel.js:996`). So the station's `orbit` bed (console beeps, airlock, radio chirps) keeps playing on the EVA, the moon, the crater and the green field. **Verify by ear**; by code, the beeps follow Jo to the moon, and the line "alone" at the crater has them.
  3. **The grey year has no sound change.** `music.stop()` runs in `rejection()` and then `music.bass()` restarts at once. The grey year is two shots of silence; hold it for the "TWELVE MONTHS LATER" text.

### Anything else
- **Props with no purpose:** `cards_done` flag; the second "ROUND" counts; the survival "a tarp/a pole/a dry box" are named as a kit but the tent builds from nothing visual; the clue "plaque under the bell" is a plaque that nobody told the player to read.
- **HUD:** one line of stat, a meter stack only in the suit. Good. Visor [Tab]: a translucent overlay that repeats the objective text; it is a subtitle for a thing the HUD already says (`:1990`). Its only purpose is to lighten the shadows. Teach what it does (it is on the hint bar) and tie it to a moment (A-N2).
- **Rewards:** shards and coins on risk lines. Fine.
- **Ending:** the white fade and the lines "Eleven days. / Was it enough? / She'd written the answers for him." Good. The notebook-read variant is a nice reward for curiosity.

## 2.3 Prioritised list (Astronaut)

### MUST

**A-M1. The rejection is optional; the dream's best scene is skipped by the player who plays well.** (code)
- File: `AstronautScene.js:787-823` (`faceTheBoard`), gate `g1` in `rooms.js` (requires only `physical`), the HUD line and the study objective (`rooms.js` OBJECTIVES p1_study: "read the notebook. 3 pips in every stat").
- Case: the player trains to 3+ in all four stats (the dream tells them to), passes 7 of 7 (the wrong-answer sources are printed, the cards drill them), and at line 808 `statsReady()` is true, so line 818 plays `d_selected`, no grey year, no "I got it. I'm sorry", Priya never "wins", and the later line "twelve months" has no weight. A player who skips training sees the story. The rewards are inverted.
- Fix: the first attempt always ends in rejection, by the story's own logic (one seat, and it is Priya's). In `faceTheBoard`, if `attempt === 1`: whatever the quiz and stat result, play a rewritten letter and call `rejection()`. The stats gate belongs to attempt 2.
  - The Board, when stats are ready and the quiz is passed: "Candidate Jo. Your numbers meet the minimum. We have one seat this intake. It is not yours."
  - When the quiz is failed or stats are short, keep the existing `d_rejected` + shortStatLine.
  - Move the "3 pips in every stat" objective so the player is told on attempt 1 only that "the Board wants a minimum" and then, in the grey year, given the list (the second-year objective already does this well).
  - Keep the dream's balance: the stat gains persist into year two, so a diligent player gets to "numbers are there. the Board." immediately after the grey year.
- Tell the Board's rejection in a way the player cannot mistake for a fail: put the red blinks on a still frame of the three silhouettes, and one of them stands up.

**A-M2. Nothing tells Jo or the player why the moon.** (code)
- File: after `setFlag('array_fixed')` (`:1102-1107`) and in `descend()` (`:1252-1281`); objective "back to the airlock - the moon is next".
- Case: after the array is fixed the game fades to a descent minigame; the next on-screen cause for anything is a radio fragment when Jo picks up the core: "...Jo. the rover- and then the crater." The player does not know a probe has died, that a crew is on the surface, that Priya is on it, or that a core is wanted. The finale's emotional logic (it is Priya) lands late.
- Fix: one comms beat in the airlock after `array_fixed`, before `descend()`. Add `A_DIALOGUES.d_moon`:
  - OSEI: "Array's unfolded. Copy. Now the bad news."
  - OSEI: "Surface team's rover is down. Their probe went dark an hour ago. Priya Raman is out there with a core she won't leave."
  - JO: "Priya's on the moon?"
  - OSEI: "Lander's fuelled. Bring the core. Bring her."
  Osei never says "good" here, so the one "...Good" in the field stays the only one. Then the objective "the lander. the probe is dark" names something the player can see.

**A-M3. The `g1` hint and the study objective lie about what opens the gate.** (code)
- File: `rooms.js` GATE_HINTS `g1` and OBJECTIVES `p1_study` (text), gate `g1` `requires: ['physical']`.
- Case: both say pips are needed; the gate wants the physical. The objective at `p1_study` is in the room where the physical is, so "3 pips in every stat" reads as the physical's requirement.
- Fix: `g1`: "THE PHYSICAL - Dr. Halvorsen". Objective: "the physical, then the Board" (until A-M1's fix tells them about pips in year two; before it, the coach already said "three pips").

**A-M4. The bus.** (code)
- File: `AstronautScene.js:821`, `rooms.js:359`. Replace "the bus is waiting - training campus" with "the training campus is through the gate". One line. (No bus is drawn.)

### SHOULD

**A-S1. Show Priya's injury.** (code)
- File: `AstronautScene.js:947-953, 2507-2523`.
- Case: Priya follows at 54 px behind Jo until he presses E at col 231; the line "Priya is not answering" is untrue; "she says nothing" is untrue. Fix: when `F.shelter` is set, make `priyaFollow` stumble at her current x (play the `hurt` or a seated pose, stop following), then move the E interact to her position instead of the fixed mark. d3's "You carried me for a kilometre" lands better if the carry is a visible 20+ tiles. Either move the beacon to col 262 beyond the pad's wall (not possible) or rewrite the line:
  - PRIYA: "You carried me through the whole forest."
  - JO: "You carried me for a year."
  - OSEI: "Copy. You're on the manifest."
  (Preserves the reply; removes the false claim.)

**A-S2. Q7 as a real choice, not a quiz.** (code)
- File: `astronautData.js:182-190` (`BOARD_QUESTIONS[6]`), `astroPuzzles.js:94-140`.
- Case: "One seat left. You may give it away. To whom?" has three "wrong" answers, and picking "Yourself. Obviously." is a strike. A strike for being honest teaches that the dream's morality is a test with an answer key. And the player who picks "Priya Raman" then watches Priya get the seat in year one, then gives it away again in year two with the same answer.
- Fix: turn Q7 into a dialogue choice with no strike, delivered through `dialog.show` with `choices` (the sim uses the same API, `:887`), and branch only the line, not the outcome:
  - BOARD: "One seat. If you could give it to one candidate, would you?"
  - [Priya Raman] BOARD: "Noted. She has said the same of you."
  - [Myself] BOARD: "Honest. We prefer honest."
  - [I'd earn it] BOARD: "Then earn it."
  In year one all three end in rejection, with the Board adding for the first: "She has said the same of you" (this is why Priya is chosen). In year two, only the first line changes. Store `F.gaveSeat` to colour the ending card ("She'd written the answers for him" / "He'd have given it away twice").

**A-S3. Make the EVA actually risky once.** (code)
- File: `rooms.js` p4_eva (hooks at 303, 309, 315, 321, 327, every 6 tiles); tether range 7.5 tiles at `:1761`; refuse-then-reel at `:1682-1693`.
- Case: hooks are always within reach; the teaching net (refuse, then one free rescue) means the only way to take a hit is to push off unclipped three times. "The tether is life" is a rule the dream states and never tests.
- Fix: one beat of danger that obeys the rule: a micro-meteor spark flies through (no damage, a telegraphed streak) and breaks the line at hook 3 (the tether snaps free; Jo must clip to the next hook within 2 s; `power` untouched). Or a gap of 8 tiles between hooks 3 and 4 so he must clip hook 4 BEFORE letting go of 3 (the F key is "clip nearest", so clipping a hook out of the 7.5 tile range does nothing visible now). Add a streak SFX and a 'clip!' prompt flash on the hook that is in range. This teaches that the order matters.

**A-S4. Hinge puzzle prints its own answer.** (code)
- File: `astroPuzzles.js:215-222`.
- Case: the modal text says "the code plate reads 3 1 5 2 6 4" (from `BOLT_ORDER`). The plate on the hull (`:1094-1096`), notebook page 4 ("read it off the code plate, never from memory") and the whole "remember" mechanic are then pointless; the player reads the answer in the dialog.
- Fix: remove the order from the modal; show only "next: ?". The plate is 6 tiles from the array; the notebook says to read it. Leave a 3-second "look at the plate" camera nudge at the first approach. This gives page 4 and the plate a purpose.

**A-S5. Make the clues legible.** (code)
- File: `parallax.js:927-929` ("LANES 1 - 9 - 7 - 4"), `astronautData.js:178` (Q source).
- Case: the year 1974 is written as lane numbers in a background banner. Fix: "EST. 1974 - LANE 1" on the lane sign. The plaque and the poster read fine.

**A-S6. The physical is three button-holds.** (code)
- File: `AstronautScene.js:633-662`.
- Case: "TREADMILL, BREATH, GRIP - hold [Space]". No failure, no number shown. `lungs` makes the breath hold longer (`1200 + lungs*300`) which looks reversed. Halvorsen says "Numbers are numbers" without reading them.
- Fix: after the holds, Halvorsen reads the real values: "Lungs two. Grip one. Legs two. Nerve one." (from `this.stats`), and the HUD pulses the stat line. This teaches the minimum before the Board and gives the line "Your numbers are your numbers" something to mean. Also show the hold bar (a thin bar over Jo) so it is a test, not a wait.

**A-S7. Gym sound.**
- File: `places.js:35, 76-78`. Make a `gym` bed (speed bag, skipping rope, a whistle, a bouncing ball, a distant pool echo) and use it for `p1_track`, `p1_pool`, `p1_wall_ring`; give the band a gym state with a shaker or kick (a `gym` state in `bands.js` astronaut parts) so the training montage has a pulse. Keep campus for the outside.
- Add entries for `p4_eva`, `p5_moonfield`, `p5_crevasse`, `p5_crater`, `p6_field` (`acoustics: 'open'`, bed `null` for the moon/crater and a `green` bed for the field) so the console beeps stop (see 2.2).

**A-S8. The ring: no round 1, same opponent.**
- File: `AstronautScene.js:666-688`.
- Case: first bout is "ROUND 2" (nerve starts at 1). Opponent is the same gym rat three times.
- Fix: start `stats.nerve` at 1 but label rounds `nerve` (1,2,3) and show Priya as ROUND 4. Give each round one variation: round 1 the rat jabs; round 2 he feints (a faster windup that is a bluff); round 3 he blocks while you are ducking. Costs a few lines of state. The cost is worth it: three identical bouts is a grind.

**A-S9. Cut the dead pieces.**
- `cards_done` flag (`:608`): either use it (Priya says on the physical "you did your cards" or the Board gives a hint for free) or delete the drill. I would turn it into the Board's first-year advantage: a card-reader gets one strike back.
- `rejectedTwice` (`:1515`): delete or implement (A-N1).
- `FLASHCARDS` duplicate the Board's answers; keep five cards, not ten.

### NICE
- A-N1. Implement `rejectedTwice` meaningfully: if Jo fails the year-two stat gate once more (three red blinks on the second attempt) set the flag and give a second grey interlude, short. A player who fails the Board twice earns that closing line.
- A-N2. Give the visor [Tab] one real use: in the survival forest and the dark crater it reveals the next hook, the beacon or the winch with a pulse. Right now it is a subtitle.
- A-N3. Priya's "thumbs up" on the stretcher (`:2079`) is text. A tiny sprite gesture would pay off the whole dream.
- A-N4. The launch has six key prompts; abort at 3 misses means you can fail the launch with no consequence but a retry. Consider making the countdown's chosen order random so it is not memorised.
- A-N5. Re-entry is "hold Space for 9 s" with no failure (`:1455-1461`). Let a release shake the screen and slow the counter; nothing else.

## 2.4 MAJOR flag (Astronaut)

**The rebuild on the framework (ROADMAP #7) is justified only by the sprawl, not the story.** The lead review proposes to cut the stat economy, flashcards, forest and tank. I disagree with cutting the stats and the Board: they ARE the first half's story and the second-year objective is already the best-written objective in the game. What smaller fixes cannot repair is the minigame sprawl and a first half that is a series of rooms with no shared verb: 9 different modal controls; four different physics models plus water; 28 to 32 minutes.
- **If rebuilt, keep:** the gym circuit and the stat-per-room design (with A-M1 applied), the Board and the grey year, the notebook, the tank panel carry, the station's zero-g with a tether, the crater rescue, the field, Osei's "copy" and "...Good", the silence design.
- **If cut or merged:** flashcards (dead flag), the physical's holds -> the doctor's reading (A-S6), the forest and the tank could share one "two-person carry" room (the tank hatch with F and the forest carry both teach "Priya needs you").
- **The one change to a story:** A-M1 (the rejection always happens) and A-M2 (the moon briefing) change the telling, not the plot. They do not need a rebuild.
- **Do not wait for the rebuild to do:** A-M1 to A-M4, A-S1, A-S4, A-S6, A-S7. They are small and they fix a story that currently works for half the players.

---

# PART 3: NOTES THAT COVER BOTH

- **Both dreams hand out the same kind of fetch quest** (saffron / panel / core). The astronaut gives it emotional weight (Priya); the Chef gives it weight only at the saffron. Use the Chef's lit pedestal and "item goes back to its pedestal when you are hit" in the astronaut's panel and core too (the core, once dropped, vanishes; check `dropCarry`, `AstronautScene.js:1872`).
- **The word "pass" and the word "stage"** need a gloss for a non-cook; the astronaut's "pips", "Board", "physical" are glossed by the coach. Do the same in d0.
- **Frame-rate dependent counters** that belong with the queued refresh-rate pass: `ChefScene.js:978` (rush clock), `AstronautScene.js:700` (boxing wind-up chance); `:1301-1302`, `:1459` (descent and re-entry are time-stepped by event, fine).
- **Verify list (could not tell from code):** the compressor hum (Chef 1.2 music); crate 3 vs beam clearance (C-S6); whether the orbit bed truly persists to the moon (A-S7); vents at cols 149/152/155 under the counter row 31 (they launch Jo -760 upward into the counter above; if so they read as hazards but are pads going nowhere).

## Summary table

| ID | Dream | Item | Kind | Size |
|---|---|---|---|---|
| C-M1 | Chef | Gold leaf blocks the service and is never delivered | Bug + story | S |
| C-M2 | Chef | "See your hands" payoff | Story | S |
| C-M3 | Chef | Marguerite and Aurelio are not on screen | Characters | M |
| C-M4 | Chef | The three small moments have no subject | Characters | M |
| C-S1..S8 | Chef | d0/d1/d6 rewrite, rail causes rush, prompt labels, piping start, pepper cloud, crate 3, silence at the reveal, rush sprites | Mixed | S each |
| A-M1 | Astro | The rejection is optional | Story | S |
| A-M2 | Astro | No reason given for the moon | Story | S |
| A-M3 | Astro | `g1` hint and objective lie | Objectives | XS |
| A-M4 | Astro | "The bus is waiting" | Objectives | XS |
| A-S1..S9 | Astro | Priya's injury shown, Q7 as a choice, EVA risk once, hinge answer printed, clue legibility, the physical reads numbers, gym sound and bed gaps, ring rounds, dead flags | Mixed | S each |
| Chef MAJOR | Chef | Rebuild (roadmap #6): no shared verb | Rebuild | L |
| Astro MAJOR | Astro | Rebuild (roadmap #7) only for minigame sprawl; keep stats and Board | Rebuild | L |
