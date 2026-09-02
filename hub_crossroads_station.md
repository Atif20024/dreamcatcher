# DREAMCATCHER — SCENE SPEC: CROSSROADS STATION (the hub)

Follows the global standard (Parts A, C, D). This is the scene the player sees most often — every dream starts and ends here — so it must be the most *alive* place in the game at first, and it must visibly die a little every time Jo comes back with an orb. **The station is the game's message told in architecture.**

**Assumptions (correct me):** ~8 dreams, working names: Chef (Five-Star Dream), Musician (The Big Stage), Athlete, Painter, Founder, Pilot, Actor, Doctor. The Tutorial Street already exists and ends at the station's front steps. Jo starts the game with 3 hearts and `dreamsCaught = 0`.

---

## 1. What the station means
A cathedral built for leaving. Everyone here is going somewhere else; nobody is *here*. Trains leave for dreams every few minutes and almost none come back. The only people who stay are the ones who work there — and they are the happiest people in the scene. Jo never notices them until the end.

Three ideas the player should feel without being told:
1. **The departure boards are the loudest thing in the room** and they only ever say *where you could be*.
2. **Every dream Jo catches makes the station quieter.** A platform goes dark, a board stops flipping, a train never returns. The hall fills with tally marks.
3. **The people who live in the station are always at the edges** — a tea seller, a sweeper, a kid with a kite on the roof — and they get *warmer* as the hall gets darker. The last time Jo walks through, they are the only light left.

---

## 2. Layout (walkable, no hazards, no foes — the only fully safe place before the finale)

The station is **five screens wide and two tall** (150×34 tiles), read left to right, with a roof level and an undercroft.

```
 ROOF   [ clock tower ]  [ pigeons / kite kid ]  [ skylight ribs ]  [ water tower ]
 HALL   [ Front Steps ] [ Great Hall / Boards ] [ Platforms 1–8 ] [ The Service Gate ]
 UNDER  [ tea stall ]   [ luggage room ]        [ signal box ]     [ the Counter's tally wall (visible from below) ]
```

### 2.1 Front Steps (screen 1)
Where the Tutorial Street ends. Wide stone steps up to three brass revolving doors (only the middle one turns — the other two are chained, a **Gate** with the padlock icon; they open in the finale). Rain-wet stone at the bottom, dry at the top. A **shoeshine stand** (NPC: Auntie Ro, who never leaves), a newspaper kiosk with headlines that change per `dreamsCaught`, a queue of silhouette travelers with suitcases moving *in* (never out). The **clock tower** above shows a real clock that runs only while Jo is in the station (it stops when he's in a dream — the station is the only place where time is real).

### 2.2 Great Hall (screens 2–3, two screens tall)
The set-piece. Vaulted iron roof, skylight ribs casting long light bars across a checkered floor (the light bars move slowly — a 6-minute day cycle). A central **departure board**: a wall-sized split-flap board (animated flaps, clacking sound on update) listing every dream:

```
 PLATFORM  DESTINATION           DEPARTS      STATUS
   1       FIVE-STAR DREAM        NOW          BOARDING
   2       THE BIG STAGE          NOW          BOARDING
   3       THE FINISH LINE        NOW          BOARDING
   ...
   8       THE WHITE COAT         NOW          BOARDING
   —       ———————————            —            —
```
A caught dream's row flips to **`CAUGHT — NO RETURN SERVICE`** in dim letters and its flap never moves again. The row for the finale is blank dashes until the gate opens, then reads **`??  THE LAST STOP  ——  WHEN YOU'RE READY`**.

Under the board: a brass **information desk** (NPC: Mr. Pemberton, station master, keeps a ledger), a bench where an old man sleeps under a coat (he is the same person every visit; on the last visit the bench is empty and the coat is folded), a fountain that works at 0 dreams and drips at 5, a flower seller with a cart (fewer flowers per dream caught), lost-and-found window, ticket booths with green-shaded lamps, a shoeshine chair, phone booths, luggage carts (pushable, cosmetic), pigeons that scatter, a busker at the far pillar playing a **resonant** accordion (Jo can play with him — Small Moment).

Vertical: iron staircases up to a mezzanine café (NPC: tea seller Bilal, upstairs and downstairs via a dumbwaiter he calls "the express") and a ladder to the roof through a maintenance hatch (`|` climbable rib).

### 2.3 Platforms (screens 3–4)
Eight platforms fan out under a train shed, each with its own **destination board on a post**, its own bench, lamp, and a **train** idling with steam. Boarding is walking to the train's open door and pressing E; a short cinematic (doors, whistle, steam, screen wipe) loads the dream. Each platform is themed by its dream in small ways so the player can read them from a distance:
- **P1 Five-Star Dream** — crates of produce on the platform, a chalkboard menu, smell-lines rising from a vent.
- **P2 The Big Stage** — a poster wall, a case-shaped shadow, a lamp with a trumpet silhouette cut into the shade.
- **P3 The Finish Line** — a starting-block-shaped bench, a stopwatch clock instead of a station clock.
- (…one identifying prop set per dream, defined with the dream.)
**A caught dream's platform goes quiet:** its train is gone (empty rails, oil stain), its lamp is out, its bench has a "RESERVED" sign, its board post shows the dim `CAUGHT` line, its steam is gone, and the sound of that platform (each has a unique ambient loop — sizzling, tuning, a starter pistol far off) is silenced. Pigeons roost there. The platform's tint overlay drops to 60% brightness permanently.

### 2.4 The Service Gate (screen 5) — The Counter's door
At the end of the shed, past Platform 8, an iron **service gate** taller than the others, painted green once, now scratched. Its surface is covered in **tally marks** — scratched in groups of five, hundreds of them, more each visit. Above it a hand-lettered sign: **`NO PASSENGERS`**. Beside it, a turnstile with a mechanical counter that reads Jo's `dreamsCaught` in real digits.
- At `dreamsCaught < 2`: chained; the padlock icon shows a **ribbon with "2"**; pushing on it makes a hollow knock and something on the other side knocks back once.
- At `dreamsCaught = 2`: the chain drops in a cinematic when Jo first re-enters the hall (camera pans to the gate, one long metallic scrape, the departure board adds the `LAST STOP` row). The gate is now **ajar** — a bar of cold blue light and a sound like an adding machine.
- The player may take more dreams first (up to 5). Each extra dream adds tally marks and the light behind the gate gets brighter; the gate itself never closes again.

### 2.5 Undercroft
Reached by the luggage-room stairs. Storage cages, a signal box with levers (cosmetic, clank), the tea seller's real kitchen, a wall of **lost dreams** — suitcases with name tags, hundreds, one row per dream catchable (a tag reads "JO" after each catch, added to the wall). And a slot through which the player can see **the far side of the Service Gate**: a long corridor of tally marks under a single bulb, receding. Nothing moves in it. This is the only preview of The Counter.

### 2.6 Roof
A kid flies a kite in wind that moves with the day cycle. Pigeon lofts. The water tower. From here the whole train shed is visible (a **vista room** — zoom 0.8) and you can count the dark platforms.

---

## 3. People of the station (all `Npc`, none ever leave)
- **Mr. Pemberton** (station master, information desk) — courteous, formal, keeps a ledger. Gives the objective at each visit. Says "Mind the gap" about the gate.
- **Auntie Ro** (shoeshine, front steps) — talks to everyone, remembers Jo's shoes ("Kitchen grease. You've been somewhere hot."). Her lines reference whichever dream Jo just returned from.
- **Bilal** (tea seller, mezzanine) — gives Jo a free tea on every return. The cup gets described differently each time. On the last visit he says nothing and just hands it over.
- **The Busker** (accordion, far pillar) — Small Moment #1.
- **The Sleeping Man** (bench) — never wakes. Small Moment #2 is sitting next to him for 8 s.
- **Kite Kid** (roof) — Small Moment #3: hold the kite string for her while she ties her shoe.
- **Sweeper** (everywhere, moves between screens) — hums the Orb melody. Never speaks. Never noticed. He is the last NPC standing before the finale.

---

## 4. How the station changes (state = `dreamsCaught`, 0 → 5)

| | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Palette | full warm gold/cream/brass | −12% sat | gate light appears (cold blue) | half the skylight bars gone | brass goes gray-green | only lamps, tea stall, and NPCs in warm color |
| Travelers (silhouettes) | 40 | 30 | 22 | 15 | 8 | 0 — only the workers |
| Departure board | all BOARDING, clacking | one CAUGHT | LAST STOP row, gate ajar | | | mostly dim, clack every 20 s |
| Fountain | flowing | | trickle | | drip | dry |
| Flower cart | full | | half | | one flower | gone; the seller sits with an empty cart |
| Music | full band swing, busker audible | lose ride cymbal | lose piano | busker stops | bass only | ambience + sweeper humming |
| Tally marks on gate | ~50 | +50 | +100 | +150 | +200 | gate is solid tally |
| Clock tower | ticking | | | | | ticks, then stops for 2 s, then ticks |

The NPCs' warmth runs **the other way**: their dialogue gets shorter and kinder, their sprites keep full saturation while everything else desaturates, and their lamps stay lit.

---

## 5. Scripts

**Opening (first arrival from the Tutorial Street, `dreamsCaught = 0`)**
Jo climbs the front steps in rain. The middle door turns; the hall opens with the camera pulling back to the vista — light bars, the board clacking through every destination, steam from eight trains at once, the busker faintly. Title card fades in over the board: **DREAMCATCHER**. Then a smaller line: *"Crossroads Station. Everyone here is going somewhere else."*
- **D_hub_0** — Pemberton: "New face. Which dream, sir? They all leave at the same time." Jo: "How do I choose?" Pemberton: "People usually don't. They just get on the first one that stops." (Objective HUD: *Board any train.*)

**Return from a dream (`onDreamCaught`)**
The train arrives at its platform with Jo — the only returning train the player ever sees — and the moment Jo steps off, the train's lamps go out one by one, the doors close, and it reverses out of the shed slowly and does not come back. The board flips its row to CAUGHT. Tally marks appear on the gate with a scratching sound. Then, and only then, the tint overlay darkens.
- **D_hub_return_N** (Pemberton, one per N): 1 — "Back already. Was it everything?" 2 — "Two. The service gate will have noticed." (chain drops) 3 — "Three. You look… thinner around the eyes." 4 — "Four. Most people stop at two." 5 — "Five. The board's out of dreams, sir."
- **D_hub_ro_N** (Auntie Ro) references the dream: after Chef — "Kitchen grease. You've been somewhere hot. Sit, I'll get it off." After Musician — "Your fingers are shaking. Big room?" etc.
- **Bilal's tea, per N:** 1 "On the house." 2 "Still on the house." 3 "You're not sleeping." 4 "Drink it here. Don't take it on the train." 5 — silence, then: "You know the sweeper's been here longer than the trains?"

**The gate (`dreamsCaught ≥ 2`, first approach)**
- **D_hub_gate** — a voice through the gap, flat, pleasant: "Two. Come in when you're done counting. Or don't. I'll count for both of us." The turnstile clicks once by itself.

**Last walk (before boarding the LAST STOP)**
The hall is nearly dark; the sweeper is humming; Auntie Ro, Bilal, Pemberton, the flower seller, the kite kid are each under their own lamp. Passing each one triggers a single line with no dialogue box, just floating text: "Mind the gap." / "Sit a minute." / "It's still on the house." / (the flower seller offers the last flower — a Carryable Jo keeps into the finale). If all three hub Small Moments are collected, the sleeping man is awake, sitting up, and nods.

---

## 6. Small Moments (hub, 3 — counted separately, shown on the finale screen)
1. **Duet** — play with the busker (resonant accordion, one Call & Response phrase). Text: *"He'd been playing to the board for years."*
2. **The Bench** — sit next to the sleeping man 8 s. Text: *"He wasn't waiting for a train."*
3. **Kite** — hold the string on the roof. Text: *"Up there, the platforms looked like piano keys."*

---

## 7. Implementation (Part D stack)
- `src/data/hub/rooms.js`: 5 rooms (`steps`, `hall`, `platforms_a`, `platforms_b`, `gate`) + `undercroft`, `roof`. Legend as D2; roof ladder via `|` ribs.
- `src/scenes/Hub.js` reads `dreamsCaught` and `flags.dreams.*` on `create()` and applies the state table (§4) via a `HubState` function — one place, table-driven, no per-N branches scattered in code.
- Departure board: a `SplitFlapBoard` display object — each cell a string-art glyph with a 4-frame flip animation and one `clack` per cell; rows built from `src/data/dreams.js` (`{ id, platform, title, propsKind, ambientLoop }`).
- Platform trains: `Train` object with `idle / departing_with_jo / returning / dead` states; `dead` removes the sprite and leaves an oil-stain decal + the RESERVED sign.
- Service gate: a `Gate` with `requires: ['meta.dreamsCaught>=2']`, a `tallyLayer` that draws `50 + 100*(N-1)` marks procedurally (seeded), and a mechanical counter sprite.
- Day cycle: a 6-minute tween on the light-bar sprites' x and on the sky tint behind the skylight; pauses when the scene sleeps.
- Travelers: a pooled `Silhouette` class, count from §4, walking left→right between doors and platforms on splines, never toward Jo.
- Audio: hub stems `bass / piano / ride / busker / ambience / sweeper_hum`; `MusicDirector.hubState(N)` sets gains per §4.
- Save: hub Small Moments in `flags.hub.moment1..3`; sleeping man awake in finale walk if all three.

**Acceptance:** at 0 dreams a tester calls the station "beautiful"; at 5 the same tester should be able to say *who* is still there by name. If they can't, the NPC warmth isn't reading — brighten them, not the room.
