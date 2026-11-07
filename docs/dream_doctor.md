# THE WHITE COAT (doctor dream, platform 8)

Design doc by a pro gamer and senior game designer. Docs only: nothing was built or run. Every name, street, firm and place is invented. No real person or hospital is used. The general shape (a young doctor alone on a cold night, a queue that outgrows the beds) is common to many stories; no beat comes from any real game, film or show.

Read with `docs/redesign/FRAMEWORK.md` (the DreamScene framework), `docs/redesign/ROADMAP.md` (the bar), `docs/redesign/advice/fresh_review_design.md` (F3, F4 and the ending notes), and `docs/dream_racer.md` / `docs/redesign/advice/gambler_champion_critique.md` (format).

**Care note.** Illness is shown the way a good drama shows it: through posture, colour, breath and a held hand. There is no blood, no injury close-up, no procedure, and no one dies on screen. The one death in the dream is a quiet cut-away. The rules of the game (the "Ferrow Card") are this game's invention. They are not medical advice, they are not true of real clinics, and the game never says they are.

---

## 1. Premise and who dreams it

- **The dreamer.** **Dr. Maud Ferrow**, 81, retired, a village doctor for fifty-one years. In her kitchen there is a drawer of cards, thank-you notes and one brass pin. Nobody in the town has ever said "Ferrow" without "the doctor" in front of it.
- **Her dream.** She is 29, and it is the first night she is alone in charge. The senior sister is off with the grippe, the other doctor is snowed in on the moor road, and the Infirmary's lights are failing. A queue is forming on the benches and the door keeps opening.
- **Jo's role.** Jo is the **night porter**. Maud has two hands and a Bay with one curtain; she cannot also stand in the hall. She says: "I need eyes, Jo. Tell me who can wait." Jo walks the hall, **reads** each person, and **tags** them. His tags decide who goes in next. She trusts them, which is the weight of the dream.
- **The thesis.** The calling is deciding, all night, who is seen first. The cost is the people you were not looking at: a supper going cold on a bench, and a name nobody asks for. The catch is small: at dawn, someone says her name aloud.
- **Tone.** Cold, lamplit, tender. Funny in places (a loud man with a cut thumb). Never hurried by a siren.

## 2. Era and place

- **Carrow Wick, a mill-and-harbour town in a hard winter, January 1947.** The cold has lasted nine weeks. Coal is short, the mill runs three days a week, and the power fails by turns. (The winter is a historical fact; the town and everyone in it are invented.)
- **The Hollin Street Infirmary.** A subscription-funded hospital of grey stone with a brick annexe, kept by the mill's owners and a charity committee. Everything is of the period:
  - iron cots, enamel basins, glass thermometers, a stethoscope with rubber tubes, a pocket watch used for the pulse;
  - hurricane lamps, a coal range, radiators that clank, a boiler in the cellar;
  - a bakelite telephone, a wireless set in the porter's lodge, a handbell on the desk;
  - hand-written tags pinned to coats with **brass pins**. The coin is the pin from the tag basket.
- **People arrive as they would in snow.** On foot, on sledges, carried on doors by two men in step, and in a brewery dray. There is no ambulance bell. The only electric hum is the failing bulb.
- **Palettes and grades** (painted in code):

| Place | Palette | Night grade |
|---|---|---|
| The Gate (exterior) | slate blue, snow white, one yellow lamp | deep blue, sharp rim light on snow |
| The Linen Loft | dusty grey wood, cold skylight blue | dim, shafts of snow light |
| The Admissions Hall | cream tile, bottle-green dado, brass, warm bulb | warm; goes to lamp-amber when the power dies |
| The Boiler Cellar | black iron, furnace orange | hot rim, dark corners |
| The Long Ward | pale green, white sheets, blue window ice | lamp pools, deep shadow between |
| The Hall at Four | the Hall, tinted pre-dawn blue-violet | cold, low |
| Dawn (ending, the steps) | rose and pale gold | warm, rising |

- **Sound of the era.** No electronic beeps. See §10 (audio). `ambientLoop: 'monitors'` in `src/data/dreams.js` is wrong for 1947 and must be replaced with `'ww_hall'`.

## 3. The core verb: THE ROUND (reading, then deciding who waits)

**One line.** Walk between people, read what their bodies and voices say, and tag each with a cord (white, amber, red) that decides where they wait. Places are few. Reading costs time. People who look fine are not always fine.

**Why this is not "press at the zone".** There is no moving marker, no zone and no reflex input in this verb. Every input is a **choice** among three or a **walk** toward someone. The skill is **inference under scarcity**.

**Why this is not the Chef's ticket rail** (`ChefScene`, `lead_design_review.md`): the rail has known orders, a visible countdown per order, and a fetch-and-plate action. THE ROUND is the reverse.

| | Chef ticket rail | THE ROUND |
|---|---|---|
| What you know | The order is printed on the ticket | The need is **hidden**; you infer it from signs |
| What you do | Run to stations and fulfil | Stand, look, ask, check, then **classify** |
| Pressure | A timer per ticket burns red | A **shared capacity** (cots, one Bay). Slow drift, with a warning, not a countdown |
| Wrong answer | The ticket is called back | The wrong **place** is taken for the right person |
| Players differ by | speed of execution | quality of reading and planning |
| Moving queue | tickets on a rail | **people** with gaits, manners and masks |

**Controls (two action keys, as the lint requires).**

| Key | Does |
|---|---|
| Move | Walk the hall. The queue is real people at real positions. |
| **E** near a person | `LOOK` (first press), `ASK` (second press), `CHECK` (hold 1.2 s). A bedside card shows what you have learned. |
| **Q** near a person | Open the cord rack. Left/Right choose a cord. **Q** again fixes the tag. **Esc** cancels. |
| Esc | Pause menu as in the framework. A held **Q** in no menu does nothing. |
| **Q** with nobody near | The **Ferrow Card** (the rules pinned to the wall), readable at any time. |

Touch uses the existing E, Q and d-pad buttons. The card and rack take taps.

### 3.1 What a person shows (the four channels)

Each person has three **honest** channels and two **spoken** ones.

| Channel | Revealed by | Words (severity 0 / 1 / 2) | Honest? |
|---|---|---|---|
| BREATH | LOOK (and visible in the sprite's chest) | easy / quick / catching | yes |
| COLOUR | LOOK (and visible on the face) | pink / pale or flushed / grey | yes |
| PULSE | CHECK only (two fingers, a pocket watch) | steady / racing / thready | yes |
| HAND | LOOK (where the hand goes) | still / guarding / clutching | **spoken** (a manner can mask it) |
| VOICE | ASK | whole sentences / short / faint | **spoken** (a manner can mask it) |

**The need** of a person is `max(BREATH, COLOUR, PULSE)`: 0 = can wait, 1 = soon, 2 = now. HAND and VOICE are what people choose to show.

**Manners** change what HAND and VOICE show:

| Manner | Effect on HAND and VOICE | Lesson |
|---|---|---|
| plain | honest (shown = need) | read what you see |
| stoic | **understate** by 1 or 2 ("It's nothing.") | a calm face can hide a high need |
| loud | HAND shows 2 for theatre and VOICE "shouting"; neither counts | loud is not sick |
| child | VOICE is "shy" (no severity); the drift margin is **halved** | a child's night is shorter |

**Pulse-only people** (the hidden ones). Some people look pink and easy and are not (BREATH 0, COLOUR 0, PULSE 1 or 2). They are found by **contradiction**: a stoic whose hand is guarding while the mouth says "fine", or a person who is too quiet for how long they have sat. `CHECK` settles it. This is the game's best skill moment: *you notice the mismatch, you spend 1.2 s, and you save the bed*.

**The Ferrow Card** (a wall card the player can open with Q). Four lines only:
1. Trust breath and colour. People choose what to say and where to put a hand.
2. Loud is not the same as sick. Quiet is not the same as well.
3. Pink and easy and a guarded hand: put two fingers on the wrist.
4. Small ones go off faster.

The card is the whole rule book, as the hand strip is in SHOWDOWN.

### 3.2 Cords, places and capacity

| Cord | Meaning | Where they go | Capacity |
|---|---|---|---|
| WHITE | can wait | the benches (home at dawn) | unlimited, but the benches are visibly crowded past 6 |
| AMBER | soon | a **cot** | per room (Hall 4, Ward 5, Front Hall 3). Cots are **permanent for the wave** |
| RED | now | the **Bay** (Maud) | 1 in the Bay + 1 on the **trolley**. The rest wait on the floor, still drifting |

Cords are marked for colour-blind players: white has one knot and a round bead, amber two knots and a square bead, red three knots and a triangle bead. Words are on every card.

**Resolving a tag.**
- **Right tag** (cord = need): the person walks (or is wheeled) to their place. A red enters the Bay when it is free, in **tag order** (FIFO). Maud treats for `treat` seconds, then the person is settled.
- **Over-tag** (cord > need): not harmful, but it **burns capacity**. A white-need person on amber takes a cot for the rest of the wave. A white-need on red takes the Bay for 6 s ("Who sent this one in?").
- **Under-tag** (cord < need): they are placed, then they **drift** (below).
- **Re-tag.** Any person can be re-tagged for free, except a person in the Bay. A bedded need-0 person can be sent back to the benches ("Mrs. Hobb, you're well enough to sit"). A need-1 person moved out will drift.

**Drift** (the only clock). A person whose need is higher than what they have been given, or who is waiting for a place they have not got, runs a **margin**. At `warn` seconds before it ends, they show a tell (colour moves one step toward worse, the breath changes, a cough or a long sigh is heard, the sprite slumps). When the margin ends, their need rises by one and the margin restarts. If a need-2 person's margin ends, it is a **slip**. A slip is a chalk mark on the board, Maud breaks off for 4 s (the Bay patient's treatment is delayed 4 s), and the person is **kept in overnight** (a ledger line, never worse).
- **Nothing is drawn as a countdown.** The only warnings are the body, the cough and the margin tell.
- Margins never pause, not even while a person is being looked at. Reading costs time; that is the tension.

**Slip allowance.** If the slips in a wave reach `slipsAllowed` (3, see §5), **Sister Wynn takes the desk**: "Get your breath, porter." The wave restarts from its first arrival with the same people (§7).

### 3.3 Tuning numbers (tier 1 is the median; see §5 for the tiers)

| Number | Tier 0 | **Tier 1** | Tier 2 |
|---|---|---|---|
| Margin (s), adult | 44 | **36** | 30 |
| Margin, child (half) | 22 | **18** | 15 |
| Warn tell before the step (s) | 10 | **8** | 6 |
| `CHECK` hold (ms) | 900 | **1200** | 1500 |
| Bay treat (s) per red | 14 | **18** | 20 |
| Slips allowed | 4 | **3** | 3 |
| Arrival gap scale | ×1.15 | **×1** | ×0.85 |
| Reading overhead target (walk, E, E, Q, Q) | 5 s | **5 s** | 5 s |

A skilled reader spends **about 5 s per person** (walk, LOOK, sometimes ASK, tag). A full 7-person wave costs about 35 s of reading across 100 s of arrivals. The margin is tuned so that **reading everyone once** is comfortable, **CHECK on everyone** is not, and **never re-reading the quiet benches** is a slip.

### 3.4 What makes it skilful

1. **Reading order.** Children first (half margin), then the quiet old, then whoever is loudest last. The player who goes to the loudest person first loses time.
2. **Reliable channels.** Learn that COLOUR and BREATH are honest and HAND and VOICE are not.
3. **The contradiction.** Notice a guarded hand under "I'm fine" and spend the 1.2 s on CHECK. Check everyone and you drift. Check nobody and you miss the hidden ones.
4. **Forecasting capacity.** Do not spend the last cot on a "maybe". Hold an amber on the benches for one more look when the knock of the next arrival is heard (a bell on the door = a person in 6 s).
5. **Re-rounds.** Walk the benches every 20-30 s. The quiet one drifts.
6. **Ordering reds.** The Bay is FIFO by tag time. Tagging the grey one first is a decision.
7. **The slow choices.** `STAY` with Mrs. Ede (§4.5) and telling Maud about Tomas (§4.3) cost the clock on purpose.

### 3.5 Where the engine runs

The sort is **free-walking**, not a boxed encounter, so it does not use the `encounter` entity. It is a **verb** (`verbs/triage.js`, `always: true`) that hosts a pure `ward` engine. People are a new `patient` entity type (like `audience`) handled by a dream adapter (§11). Each sort room has a **desk bell** (`{ type: 'moment' }`-style start) that begins the wave when pressed: this is the "shown before you commit" step (§4).

## 4. The areas (six places, walked into)

Scale: 1 m = 44 px, Jo 82 px, tile 32 px. Interiors have a floor-to-ceiling height of at least 10 tiles (7 m) for halls and 3+ tiles of headroom everywhere. Jo runs about 160 px/s inside; no leg slides (Stride).

Each room opens with an **arrival card** on the split-flap board (goal, resources, slips) before any person moves:

> THE ADMISSIONS HALL. Seven on the benches by two. Four cots. One Bay. Three slips and Sister takes the desk. [E] ring the bell.

### 4.1 THE GATE (exterior, snow, about 0:50)

- **Goal on the card:** "Three are standing in the snow. Say who goes in first."
- **Layout.** 48 x 20 tiles (35 m); ground at row 16. Jo spawns at x 3. An iron gate (x 8-9). Three people stand at x 13, 19, 25 beside a lamp post at x 21. The lodge door is at x 44 (a door portal to the Linen Loft, 15 s at a run). A snowdrift hump at x 31 forces a small jump. The Infirmary front is a long backdrop landmark.
- **Teaching beat.** Only this: **colour and breath tell you the truth, and loud is not sick.** Margins do not run. Cots and Bay are unlimited. There is no slip. If Jo tags the wrong person first, Maud shouts from the door: "Not that one, Jo. Look at her lips."
- **The three (fixed):**

| # | Person | Manner | BREATH / COLOUR / PULSE | Need | Cord |
|---|---|---|---|---|---|
| 1 | **Hask Dorrin**, a docker, a cloth round his thumb | loud | easy / pink / steady | 0 | white |
| 2 | **Edda Brannock**, 60s, a shawl | plain, quiet | catching / grey / (n/a) | 2 | red |
| 3 | **Wim Crale**, 8, on his sister's back | child | quick / pale / (n/a) | 1 | amber |

- **Pressure.** None. The loud man shouts the loudest and the card makes the point.
- **Cast gaits.** Dorrin stamps and swings his arms; Brannock stands very still and sways; Wim is carried, then slides down and hops on one foot; Wim's sister Josie shifts weight and rubs her arms.
- **Props.** Gate lamp, snow drift, a sledge, the cord basket (Jo takes the three cords here), a frosted lodge window (a Small Moment: hold E to breathe a clear patch, see the lit room inside).
- **Sound.** Wind, snow-squeak steps (a distinct `snow` surface), a far church bell tolling the hour. No music except one held note.

### 4.2 THE LINEN LOFT (interior, small platform room, about 0:45)

- **Goal on the card:** "Maud says: beds first. Bring down three bundles of blankets."
- **Why it exists.** Capacity is **made**, not given. Each bundle becomes a made cot in the Hall. Bring fewer than three and the Hall has fewer cots (a hard consequence, taught here, felt there). A gate to the Hall requires all three, so the player cannot skip it; a failure in the Hall can be partly traced to an easy-looking choice here.
- **Layout.** 36 x 22 tiles. Floor at row 20. Iron stair (a ladder `H` column) at x 6 to a mezzanine at row 14, a second at row 8. The three bundles lie on a shelf at x 28 row 19, on the mezzanine at x 12 row 13, and on the top rafter walk at x 30 row 7. A skylight above lets in blue snow light. The door to the Hall is at x 3.
- **Pressure.** Hearts. Icicles drop at the eaves: a drip sound, a pale telegraph shadow on the floor for 0.8 s, then the drop (1 heart, knockback). A loose plank on the mezzanine (a one-way tile) that swings once and can be seen from the stair. No foes.
- **Teaching beat.** *Walking and climbing is also the job.* Pins are placed on risky ledges (§6).
- **Props.** Linen shelves, a mangle, stacked folded sheets, a skylight, a coal-sack, hanging washing lines (decor), the ice-roof.
- **Sound.** Wind in slates, creaking beams, a cold muffled quiet. Hall sounds come through the floor from below, faint: a bell, a murmur.

### 4.3 THE ADMISSIONS HALL (interior, the main room, about 2:15)

- **Goal on the card:** "Seven on the benches by two. Four cots. One Bay. Read them, tag them. Three slips and Sister takes the desk."
- **Layout.** 44 x 14 tiles (32 m), floor row 12, ceiling row 2. From left: the street doors (x 1-3, a shutter and a bell that rings on every arrival); the **queue marks** (x 5-10, a worn line on the tiles where people stand and shuffle forward when someone leaves); the desk and bell at x 4; three benches (x 12-15, 18-21, 24-27); a coal stove with a kettle at x 20; four **cots behind a rail** along the back wall (x 28-37); the **Bay** on the right (x 38-43), a curtain with Maud's lit silhouette; the **door to the cellar** at x 33 (locked until the wave ends). Tomas Wray's bench is x 10 near the door.
- **The wave (seven people, tier 1, seeded).**

| # | t (s) | Person | Manner | BREATH / COLOUR / PULSE | Need | Notes |
|---|---|---|---|---|---|---|
| 1 | 0 | **Sam Pike**, mill hand, a wrapped hand | plain | easy / pink / steady | 0 | white |
| 2 | 0 | **Odile Frane**, 60s, "It's nothing, I came for the others" | stoic | easy / pink / **thready** | 2 | pulse-only. Hand guarding, voice "I'm all right." CHECK needed. |
| 3 | 0 | **Nan Corrow**, 6, with her mother | child | quick / pale / steady | 1 | amber, margin 18 s |
| 4 | 25 | **Gus Harrow**, a carter | loud | easy / flushed / steady | 1 | amber; looks like a red |
| 5 | 55 | **Ruth Aldane**, 20s, brought on a door by two men | plain | catching / grey / (n/a) | 2 | red; carried in step |
| 6 | 80 | **Perrin Sloe**, 80s, hat in hand | stoic, quiet | easy / pale / racing | 1 | amber; slumps and **drifts** if unread |
| 7 | 100 | **Owen Teale**, a student with a cough | plain | easy / pink / steady | 0 | white; talks a lot |

Needs: two reds, three ambers, two whites. Resources: four cots, one Bay, one trolley. The wave is solvable with zero slips by reading each person once, a `CHECK` on Frane only, and a second look at Sloe. A player who tags by loudness (Harrow red, Frane white) gets one slip and a jammed Bay.
- **Tomas Wray** (not a patient). At t = 45 Tomas, 30, a schoolmaster, comes in with a covered plate and sits on the end bench. Maud has missed their supper. He says "I'll wait." Jo can **tell Maud** at the Bay curtain (see below).
- **Mid-wave event.** At t = 70 the bulb flickers once. When the seventh person is tagged, the lights fail: the Hall goes to hurricane-lamp amber and the cellar door unlocks.
- **Teaching beats** (one new idea at a time inside the wave):
  1. Frane teaches **CHECK**. Maud barks: "Two fingers, Jo. The wrist."
  2. Harrow teaches **loud is not need**.
  3. Sloe teaches **drift** (a quiet man slumps; his colour moves a step in the warn tell).
  4. The queue marks teach that the room is a **moving queue**: when someone is tagged, the line shuffles forward one step each, people turn, a child slips back to her mother.
- **Pressure.** The wave itself: capacity, drift and the choice of Bay order. Hearts are not used here.
- **The Tomas choice.** At the Bay curtain, E when the Bay is occupied: "Tell her?" `Not now` (nothing), or `Tell her he's here` (Maud: "Tell him, tell him I'll… I can't, Jo." Her hands slow: **+2 s treat for the next wave**, shown as the Bay animation running slower). Telling is a real cost, small and visible. Flag `tomas_told`.
- **Cast gaits.** Pike: heavy, steady plod. Frane: very upright, careful steps, a hand on the rail. Nan: skip, then still. Harrow: stomp, pace, big gestures. Aldane's bearers: in step with the door between them (carry gait). Sloe: shuffle, stoop, rest-stops. Teale: loose and quick, never still. Tomas: hat turned in his hands, shifts weight, sits, folds paper. Orderlies Bertie Lamb and Cass Orme: wheel the trolley at one pace, together.
- **Props.** Benches, tags on hooks, cord rack, chalk board of slips ("Slips: III"), stove and kettle, hall clock, bakelite telephone, trolley, door-stretcher, enamel basin, umbrella stand with snow on it, notice "QUIET, PLEASE", the Night Book on the desk.
- **Sound.** Hall murmur (low-passed), clock tick, radiator clank, the stove ticking, the shutter bell on each arrival, the pocket-watch tick on `CHECK` (steady 72 per minute, racing 120, thready faint and uneven), a distinct breath loop per BREATH value, a cough on `warn`.

### 4.4 THE BOILER CELLAR (platform room with a service task, about 0:50)

- **Goal on the card:** "The lights have gone. Feed the boiler: three scuttles of coal."
- **Why it exists.** A different body for the player: a platformer breather between two long sorts. It lets the sort wave settle and gives a first look at the lamp-lit world.
- **Layout.** 40 x 18 tiles. Iron stair from the Hall (x 2). Three coal heaps at x 8, 18 and 26 on different levels (floor, a gantry at row 11, a low pipe-walk). The boiler door at x 36. Overhead pipes run along the ceiling. Furnace glow lights the right half.
- **Pressure.** Hearts. Steam vents on a rhythm (a wisp, a hiss, then the blow after 0.9 s, as in `src/dreams/gambler/verbs/boat.js`); a hot pipe (visible heat shimmer, a heart if touched). No foes.
- **Verb.** Pick up three coal items (key items `coal1..3`), then E at the boiler. Not the main verb: this is a place to walk and climb.
- **Result.** The Ward lights come back dim. A flag `boiler_lit` sets the lamp-lit grade for the rest of the night and tells the player that colour will be harder to read.
- **Props.** Boiler (large), coal heaps, scuttles, shovel, steam pipes, gauges (period dials), a coat on a nail.
- **Sound.** Boiler roar and thrum, pipe knocks, steam hiss, a faint voice from above through a grating.

### 4.5 THE LONG WARD (interior, re-sorting, about 2:00)

- **Goal on the card:** "Five cots, all full. A boy is on his way on a door. Make a cot for him."
- **Layout.** 40 x 12 tiles; two rows of five cots on the back wall; a centre aisle; the **side Bay** at the right (x 36-39); the Hall door at x 2 (a door portal). Lamps pool at each cot. The room is dark between pools.
- **The resort.** Here the verb **reverses**: you decide who leaves. Patients are already in cots. A boy, **Eli Marl, 15**, is carried in at t = 15 (RED, need 2); another arrival comes at t = 55 (AMBER). Cots: 5, all full. Occupants:

| Cot | Person | Manner | Need | Notes |
|---|---|---|---|---|
| 1 | **Joss Teague**, 82 | stoic | 0 | "Give my bed to the lad." He is right and he means it; releasing him is correct |
| 2 | **Hannah Hobb**, 40s | stoic | 1 (pulse-only, racing) | "I'm much better" -- she is **not**; CHECK shows it. Releasing her is a trap |
| 3 | **Sam Pike** (from the Hall) | plain | 0 or 1 | his tag carries over |
| 4 | **Nan Corrow** (from the Hall, if she was tagged amber) | child | 1 | margin 18 s; her mother sits by her |
| 5 | **Hannah Ede**, 79 | plain | 2 but **comfort only** | past the Bay; see `STAY` |

- **The dilemma.** The red goes to the side Bay. The second arrival (amber) needs a cot. Release Teague (need 0, correct). Hobb is the trap. Pike may go back to the benches if his hand is fine. The player may end the wave with the second arrival on a chair and a margin running: a real cost.
- **STAY (the only verb that is not a choice among cords).** Mrs. Ede is not in the sort. She is dying and not afraid, and the ward sister has said so quietly. **Hold E near her** to sit. There is no timer, no meter and no reward on screen. The world keeps running. Leaving is free (Esc or walk away). If Jo sits for the full thirty seconds, Maud's voice from the aisle says: "Thank you." Then: the lamp over her cot dims to a pinpoint, a caption reads *"She goes quietly, a little before four. Nobody hurried her."* The cost is the clock: the Bay and the arrivals continue. Flag `stayed_with_ede`. If Jo does not stay, Maud sits with her at the end and the ledger says so (§8).
- **Teaching beat.** *Capacity can be taken back.* Also, one more wall: a person who feels better is not necessarily better.
- **Pressure.** The clock on the arrival and the drift on Nan and Hobb. Hearts not used.
- **Cast gaits.** Aggie Lowe, a student nurse of 19: quick, soft-soled, always carrying something. Teague stands up slowly, a hand on the rail, and insists on walking himself. Hobb sits on the cot edge, swinging her feet.
- **Props.** Iron cots, bedside lockers, screens, a night lamp, a chart board, a hot-water bottle, a window with ice-ferns, a child's drawing on the wall (Small Moment).
- **Sound.** The ward at night: breathing, a clock, a far cough, rubber soles, a blanket's rustle, the wireless from the lodge (a thin dance tune, low-passed). STAY drops all other sound but the clock and her breath.

### 4.6 THE HALL AT FOUR (the big sort and dawn, about 2:00)

- **Goal on the card:** "The snow has brought a shed roof down at Marl & Dyce's yard. They are coming on doors."
- **Layout.** The Hall, reused: `rooms/front.js` imports the Hall's grid and overrides the lights, props and entities. The grade is pre-dawn violet. Cots: 3 (the rest are full). The Bay, the trolley and the rail are as before.
- **The wave (seven within 40 s, tier 1).**

| # | t (s) | Person | Manner | Need | Cord |
|---|---|---|---|---|---|
| 1 | 0 | **Jed Ruddock**, carried, grey, catching | plain | 2 | red |
| 2 | 4 | **Amos Teller**, loud, hand clutching | loud | 0 | white |
| 3 | 10 | **Rafe Marl, 15**, Eli's brother,, pale, quick | plain | 1 | amber |
| 4 | 16 | **Corbin Dyce**, the yard owner, "see to my men" | stoic (pulse-only, thready) | 2 | red |
| 5 | 22 | **Hester Voll**, carried, grey, catching | plain | 2 | red |
| 6 | 30 | **Kit Aubrey**, a scraped hand, talkative | plain | 0 | white |
| 7 | 38 | **Nance Pell**, the cook with a tea tray, pale, racing | stoic | 1 | amber |

Three reds need three Bay slots at 18 s each (54 s) against a Bay and a trolley. One red **must wait on the floor**: that person's margin (36 s at tier 1) must outlast the Bay. Tagging the right order (the grey ones first, Dyce second because his hidden need is real) is the whole puzzle. A perfect run has zero slips; a competent run has one.
- **Pressure.** The highest in the dream: all three resources are tight, arrivals are fast, the room is dim. Hearts not used.
- **Tomas.** He is still on the end bench, now with a coat folded beside him. He can be told here too; it is the most expensive moment to do it.
- **Dawn.** When the last person is placed and the Bay is quiet, the bulb comes back, then the shutter lifts and a grey-pink line shows under the door. Maud sits at the desk and writes in the Night Book. The **orb** is the desk lamp's flame: touching it starts the ending.
- **Props and gaits.** As the Hall, plus the doors-as-stretchers (in-step carry gait), a sledge, snow melting on boots, steam off wet coats.
- **Sound.** Quicker footfalls, voices overlapping then hushed, the bell ringing four times quickly, then the room's sound drops away at dawn until only the clock and a kettle remain.

## 5. Difficulty scaling

The engine reads `scene.difficulty` (set in `BaseLevel` from dreams caught, 0..5) through `night.tuning(difficulty)` and maps it to a **tier**: difficulty 0-1 is tier 0, 2-3 is tier 1, 4-5 is tier 2. Wiring: the sort verb calls `tuning(scene.difficulty)` when a wave starts. (Fresh review F4: the framework dreams ignore difficulty. This dream reads it from the first build, with no change to `DreamScene`.)

| Knob | Tier 0 (first dream) | Tier 1 | Tier 2 (fifth dream) |
|---|---|---|---|
| Margin / warn / treat | 44 / 10 / 14 | 36 / 8 / 18 | 30 / 6 / 20 |
| Slips allowed | 4 | 3 | 3 |
| Cots in the Hall | 5 | 4 | 4 |
| Pulse-only people | 1 (Frane) | 2 (Frane, Sloe) | 3 (adds Owen Teale as a quiet hidden need-1) |
| Extra person in the Hall | none | none | **+1 red** (a fourth in the line, needing a trolley) |
| Stoic mask depth | 1 | 1-2 | 1-2 |
| Arrival gaps | x1.15 | x1 | x0.85 |
| Loud decoys in the Front Hall | 1 | 1 | 2 |

**The soft aid.** After **two restarts** of the same wave: all margins +25%, and Sister Wynn chalks a small tick above the sickest unread person ("Look at that one, porter"). It is never labelled.

**What does not scale.** The reading rules and the Ferrow Card. A tier-0 player learns the same truth as a tier-2 player. Hearts scale as in the base (3 + difficulty, cap 6) and matter only in the Linen Loft and the Cellar.

## 6. Economy and placement

- **Coin.** The **brass pin**, worth 25, budget 20-30. This design places **24** (600 total).
- **Rule.** Pins are the reward for **walking away from the queue**. They are never within 5 tiles of a waiting person, so taking one costs reading time. The player decides what that detour is worth.

| Room | Pins | Where |
|---|---|---|
| Gate | 3 | one on the sledge, one on the drift, one at the lodge door |
| Linen Loft | 5 | on each mezzanine and rafter step; two beside the icicle drops |
| Hall | 4 | behind the stove, under the far bench, on the cot rail at the far end, in the tag basket by the Bay |
| Cellar | 5 | on the gantry, beside two steam vents, on the pipe-walk |
| Ward | 4 | at the far end of the aisle; under a cot at the door; on the window sill; in the chart board's tray |
| Hall at Four | 3 | quiet places only; each costs a long walk when three reds wait |

- **Key items** (`keyitem`): three blanket bundles (Linen Loft), three coal scuttles (Cellar), the cord rack (Gate; this one is a story pickup).
- **Heart shards.** Two: one in the Linen Loft on the top rafter, one in the Cellar behind a steam vent.
- **Small Moments** (three, `moment`): the frosted lodge window at the Gate; the child's drawing on the Ward wall; the cold cup of tea on the Night Desk. They feed the Evening's count.
- **Sinks.** None added. The pins are a faucet for the hub shop.
- **No economy inside the sort.** Tags cost nothing and win nothing. The sort's reward is the ending.

## 7. Failure (soft, never a lost dream)

- **Slips.** Chalk marks on the board in the Hall, the Ward and the Front Hall. At `slipsAllowed` Sister Wynn takes the desk. The wave restarts from its first arrival with the same people and the same order (seeded). Pins already taken stay. Nothing else is lost. The room's lamp is the checkpoint.
- **Hearts** exist only in the Loft and the Cellar. A fall or a steam hit takes a heart and sends Jo back to the lamp as in the base game.
- **No death of a person comes from the player's tags.** A slip is "kept in overnight", a ledger line.
- **Hall and Ward use no timer on screen.** The player may leave a room's wave only through the door, which resets it.
- **Esc** offers "start this wave again" and "from the dream's start" as the framework does.

## 8. Dialogue samples

(`Conversations` use the node graph; barks use the caption bar. Narration is a caption, not a speech box, per fresh review F8.)

**Maud, Hall, first bark**
> MAUD: Two hands, Jo, and a curtain. I can't be in the hall.
> MAUD: So you be the hall. Who can wait?

**Gate, the loud man (bark)**
> HASK DORRIN: I've cut my thumb and I want it seen to *now*!
> JO: He is pink and breathing easily.
> MAUD (from the door): Not that one, Jo. Look at her lips.

**Frane (ASK, then CHECK)**
> ODILE FRANE: It's nothing. I only came for the others.
> JO: Her hand is guarding her side. Her face is calm.
> MAUD: Two fingers, Jo. The wrist.
> JO: (the watch ticks, slow, uneven)

**Gus Harrow (ASK)**
> GUS HARROW: Do you know who I am? I deliver the coal!
> JO: He is flushed, loud and breathing easy.

**Perrin Sloe (ASK)**
> PERRIN SLOE: No bother. I'll wait my turn. I've nowhere to be.

**Sister Wynn, taking the desk (after the third slip)**
> SISTER WYNN: Get your breath, porter. I'll take the benches.
> SISTER WYNN: Start again from the door. You'll know them this time.

**Tomas at the bench**
> TOMAS: I brought her supper. It's gone cold, I expect.
> JO: Shall I tell her you're here?
> TOMAS: Don't tell her. She's busy. I'll wait.

*Choice at the curtain (Bay occupied):*
- *Not now.* (nothing)
- *Tell her he's here.* MAUD: "Tell him… tell him I'll be out. Just… I can't, Jo." (Bay +2 s)

**Mrs. Ede (STAY, held E)**
> HANNAH EDE: There you are. Sit, you're making the room untidy.
> HANNAH EDE: Is the lamp low? I like it low.
> (caption) She goes quietly, a little before four. Nobody hurried her.

**The ward dilemma**
> JOSS TEAGUE: Give my bed to the lad. I've had eighty-two years of it.
> HANNAH HOBB: I'm much better, truly. I'll sit up.
> JO: (the watch ticks, quick) She is not.

**Dawn, the family at the door**
> MRS. BRANNOCK'S SON: Thank you, doctor. Thank you.
> *Choice:* `(say nothing)` / `Her name is Dr. Ferrow.`
> SON: Ferrow. Yes. Ferrow. Thank you.

## 9. The ending (the catch)

- **The orb.** The desk lamp's flame, on the Night Desk. Touching it starts the `EndingSequence`. `orb.tint` is a pale, warm gold.
- **Beat.** Maud sits. She turns to the Night Book, where each person is a line. For everyone Jo **asked** (ASK always gives a name), the line carries a **name**. For everyone he did not, the line carries a **number**. The book is the lasting image of the night.
- **The painted image (560 x 300).** The open Night Book on the desk under the lamp, its last page in pencil. Beside it a brass pin lying in the gutter. Two possibilities in the corner:
  - `tomas_told`: two cups, one with a spoon in it, and a hat on the bench behind;
  - not told: a covered plate, cold, with a folded note against it that says "Eat something. T."
- **Title and lines.** Title: `THE WHITE COAT`. Lines are a function of the flags and tally (`ending.lines` may be a function):
  1. *"All night they thanked her, and none of them knew her name."* (always)
  2. *"Names in the book: {n} of {total}. The rest are numbers."*
  3. If `maud_named`: *"One person said it aloud. She heard."* Otherwise: *"She wrote it herself, at the foot of the page."*
  4. If `stayed_with_ede`: *"Mrs. Ede had company."* Otherwise: *"Mrs. Ede slept; Maud sat with her at the end."*
  5. If `tomas_told`: *"She went out to the bench."* Otherwise: *"The plate was cold by morning."*
  6. If `slips_total === 0`: *"Not one page went red."* Otherwise: *"{n} were kept in overnight, and mended."*
- **The thesis, in an image.** The doctor's name is a thing someone has to say. She does not say it herself; Jo does, or does not.
- **Persist for the Evening** (`persist: { maud_named: 'cast.maud_named', tomas_told: 'cast.maud_tomas' }`): in the Long Evening, Maud sits on a bench with a man in a schoolmaster's coat if `maud_tomas`, and a nameplate on a shopfront reads FERROW if `maud_named`. (Roadmap item 12.)
- **Hub.** The conductor line stays. The platform board row reads `CAUGHT: HER NAME` or `CAUGHT: THE BOOK`.

## 10. Audio (era-appropriate, silent in development)

- **Ambience loops** (new recipes in `src/audio/eraLoops.js`, replacing `monitors`): `ww_gate` (wind, snow, a far hourly bell), `ww_linen` (slates, creaks, hall sounds below), `ww_hall` (murmur, stove tick, radiator clank, clock, a telephone ringing once in a long while), `ww_cellar` (boiler thrum, pipe knock, steam), `ww_ward` (breathing, clock, a far cough, a wireless dance tune).
- **Music** (`src/dreams/doctor/music.js`, a `keys` table): slow and sparse, `bpm 60`, voices `glass`, `organ_flute`, `drone`, mode `dorian` for the Hall and `aeolian` for the Ward. The Gate and the Cellar have only a held note. The Hall at Four goes to `tense` and falls to `quiet` at dawn. **The wireless** in the lodge and the Ward is a muffled foxtrot in `glass` + `lute_pulse`, low-passed, never louder than ambience.
- **Acoustics.** Gate `open`, Linen `room`, Hall `hall`, Cellar `room`, Ward `room`.
- **Sounds with meaning.** Each BREATH value has its own loop (easy, quick, catching with a rattle). The pocket-watch tick on `CHECK` is the pulse (steady, racing, thready). The tag pin makes a small metallic snick. The cord rack makes a wooden click. The shutter bell rings when someone arrives (6 s before they come in).
- **Dev silence.** Obeys `?sound=1`. No test unmutes.

## 11. Pure engine modules to unit-test

All under `src/engines/` (no Phaser), tested in `tests/ward.test.js`.

| Module | API | Tests |
|---|---|---|
| `signs.js` | `needOf(p)`, `shown(p, channel)`, `view(p, level)` (levels `look`, `ask`, `check`), `contradiction(p)` | need is the max of BREATH, COLOUR and PULSE. Stoic understates HAND/VOICE; loud overstates; child VOICE is `shy` (ungraded); a pulse-only person looks like need 0 until `check`. Every word is in the Card's table. |
| `night.js` | `tuning(difficulty)`, `tier(difficulty)`, `waves` (gate, hall, ward, front), `margin(p, tuning)`, `slipsAllowed` | Tier boundaries (0-1, 2-3, 4-5). Child margin is half. Every wave has the same roster at every tier (except tier 2's extra red). Rosters are fixed data. |
| `ward.js` | `ward({ wave, tuning, cots, bay, seed })`, `update(dt)`, `look/ask/check/tag/retag(id, ...)`, `state()`, `done`, `result` | Right tag places a person. Over-tag burns a cot or 6 s of Bay. Under-tag drifts after the margin and the `warn` tell appears first. A need-2 expiry is a slip and delays the Bay 4 s. Reds enter the Bay FIFO by tag time. Slips at the allowance end the wave with `result.ok = false`. The same seed gives the same arrivals. Re-tag a bedded need-0 frees a cot. |
| `nightbook.js` | `ledgerLines(tally)`, `endingLines(F, tally)`, `namesCount` | Named vs numbered lines, every flag combination of `tomas_told`, `stayed_with_ede`, `maud_named`, `slips_total`. |
| `bots` (test helper in the same test file) | `perfect()`, `allRed()`, `allWhite()`, `lazy()` | **The balance proofs.** `perfect` (5 s per person) clears every wave at every tier with 0 slips. `allRed` jams the Bay and fails the Hall at tier 1 and 2. `allWhite` fails every wave. `lazy` (never re-reads) slips only at tier 2. A bot that `CHECK`s everyone slips at tier 2 (the cost of checking is real). |

## 12. Build list (a builder can follow in order; each step ends with `npm test` and `npm run lint:content`)

1. **Registration.** Add the dream to `src/data/dreams.js` as `scene: 'Dream'`, `ambientLoop: 'ww_hall'`. Add `doctor: { scene: 'Dream', param: null, framework: true }` to `DREAM_WARP` in `src/dev/warp.js`. Register in `src/dreams/index.js`. Remove the hub's "nothing runs on them yet" line for platform 8 (`HubScene.js` ~1150) once the dream boots.
2. **`signs.js` + tests** (§11). Pure.
3. **`night.js` + tests.** Rosters and tuning. Pure.
4. **`ward.js` + tests**, including the four bots. Pure. Do not touch Phaser until the bots pass.
5. **`nightbook.js` + tests.**
6. **People and props.** `src/dreams/doctor/people.js` (cast bakes, `npc-wc-*`, with a foot pivot as `painter/people.js`; breath, colour, hand and slump variants), `props.js` (cots, benches, stove, trolley, door-stretcher, cord rack, chalk board, tag basket, boiler, coal heaps, hurricane lamp, pocket watch). Check Jo against every background (≥ 3:1, especially the snow).
7. **Rooms.** `rooms/{gate,linen,hall,cellar,ward}.js` and `rooms/front.js` (imports the hall's grid). Use the real-scale numbers in §4. Run `npm run lint:content` (headroom, reachability including the ladders, perf).
8. **The `patient` entity and adapter.** In `dreamAdapters.js` (like `audience`). It spawns a cast person with `manner`, `cond` and a waypoint list, draws the breath, colour and slump variants, and exposes the person to the verb. Teach `scripts/lib/dream-checks.js` the new type.
9. **`verbs/triage.js`** (`always: true`, `keys: ['act1', 'act2']`). Hosts a `ward` engine per room. It owns: the desk bell (start), the bedside card, the cord rack, the chalk board, STAY, the slip handling and the restart. Pass `scene.difficulty` to `night.tuning`. Add a small hook so `Interaction` offers `[E] look` / `[Q] tag` on patients.
10. **Dialogue, beats and conversations** (§8), the arrival cards, the ward-room `moment` entities, the Tomas flag, the ending lines. Build the `ending.paint` image.
11. **Audio.** Recipes in `eraLoops.js`, `music.js`, the pocket-watch and breath sounds. Verify silent by default.
12. **Scenario `doctor-playthrough`** in `src/dev/scenarios/` (real inputs from the Gate to the orb), plus `doctor-slips-restart` (three deliberate slips restart the wave with the same roster) and `doctor-perf`.
13. **Balance pass.** Run the bots against the live engine at the three tiers and tune only numbers in `night.js`.
14. **Review loop** (designer and pro gamer), then the Evening hook (`persist` flags).

Size: engines ~600 lines, dream data ~700, verb and presenters ~500, art ~400. One agent can build this in a long session; steps 2-5 can be done and verified without a browser.

## 13. What I would cut first

1. **The Boiler Cellar.** Fold the "lights fail" beat into the end of the Hall. Lose 0:50 and 5 pins. It is the least necessary room.
2. **The Linen Loft.** Give the Hall four cots from the start; keep one blanket bundle as a Small Moment on the Gate's lodge door.
3. **The Tomas cost (+2 s treat).** Keep him on the bench as a story and the plate in the ending; drop the mechanical cost.
4. **The `CHECK` pulse channel.** Keep LOOK and ASK only. This is the last cut because the contradiction puzzle is the skill. Without it the verb becomes a colour-matching task.

Do **not** cut the STAY verb, the hidden pulse people, or the Night Book ending. They are the dream.

## 14. Risks and handling

- **Not a timing game, not a rail.** The verb has no marker and no per-person countdown; capacity and inference are the pressure. Review `ward.js` bots to make sure a timing-only strategy never beats a reading strategy.
- **Medical authority.** The Ferrow Card is invented. The dream's text never states a real medical fact or recommends action. The doc and the Card say so.
- **Reading load.** All words are on the bedside card at 9 px or more on a backing plate; icons and colour are never the only channel. The lamp-lit rooms keep the card at full brightness.
- **Jo's contrast on snow.** Check in the Gate; the open issue about Jo's coat on bright backgrounds (ROADMAP) applies.
- **Restraint.** Mrs. Ede's passing is a caption and a dimmed lamp. No one else dies. A slip is "kept in overnight".
- **Name reuse.** Avoid "Wren" and the names already used by other dreams (fresh review F9). The names above are all new.
