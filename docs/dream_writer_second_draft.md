# DREAMCATCHER — DREAM SPEC: WRITER — "THE SECOND DRAFT"

Follows Parts A, C, D and the three skills. Target first-run playtime: **18–22 minutes**. This is the dream about the slowest kind of work — and the one where the world itself is made of words the player can change. Names below are placeholders; rename in `src/data/writer/cast.js`.

---

## 1. STORY

**Logline:** Jo wants to write the book. He writes it, loses it, writes it again worse, cuts it in half, finishes it under a deadline he didn't set, and reads it aloud to nine people in a bookshop — and realises the book was never the thing he'd been making. The habit was. The mornings were.

**Theme:** revision. Nothing here is done the first time. Every section forces the player to go back through something they already crossed and change it. The level's own structure is a second draft: Section 4 literally makes you redo Section 1's work from memory.

**Arc (seven chapters — the level uses chapter cards, not day cards):**
1. **The Blank Page** — an attic room, a typewriter, a day job at a copy shop, the first chapter written between shifts. Jo learns the pen.
2. **The Café** — where he writes among strangers and steals their sentences. He meets **Wren** (a poet who has been "nearly published" for eleven years) and **Old Emmerich** (a retired editor who reads the paper and everyone's manuscripts, uninvited).
3. **The Library** — research, and the stacks: a vertical labyrinth where the book gets its bones.
4. **The Rejections** — forty envelopes, one at a time. Then the bag with the only copy left on a bus in the rain. The dark chapter. Rewriting from memory.
5. **The Editor** — Emmerich, finally invited, with a red pen: cut it by a third. Jo learns that half the world he built was scaffolding.
6. **The Deadline** — an agent, a publisher, a date. The printing press as a set piece. The book leaves his hands whether it's ready or not.
7. **The Reading** — launch night. A bookshop. Nine chairs. The orb is on the shelf, spine out, with his name on it.

**What the player should feel:** Chapter 1 — that the blank page is an actual place and it's frightening. Chapter 4 — real loss, then the odd relief of writing it again. Chapter 5 — that cutting hurts and then doesn't. Chapter 7 — that the room is small, and it was enough.

---

## 2. CAST
- **Jo** — player. Level tool: a **fountain pen** (the game-wide shove/interact tool, and this dream's unique mechanic).
- **Wren** — poet, café regular, friend. Funny, unpublished, generous with lines. Companion NPC in Chapters 2, 4 and 7.
- **Old Emmerich** — retired editor. Reads with a red pencil. Says "cut it" more than any other words. Mentor; runs Chapter 5.
- **Mrs. Adesanya** — landlady. Wants the rent. Foe-class (landlord: hurried gait, hide/distract) in Chapter 1 and 4.
- **Tomasz** — copy-shop manager, Jo's boss. Kind, exhausted. Small Moment NPC.
- **Isolde Marr** — literary agent. Fast talker. Chapter 6. Not a villain; a clock with a smile.
- **The Inner Editor** — not a person: a tall ink silhouette that appears in Chapters 4–6, walks behind Jo, and **erases the platforms he has already crossed** so there is no going back. Never attacks. Never speaks. Cannot be shoved. It is pressure, drawn.
- **Foes:** *Rejection Slips* (flying paper — creatures; one pen hit tears them), *The Landlady*, *Café Talkers* (wall-of-sound people who push Jo back when he stands too close — distract by playing a note or knocking a cup), *Library Guards* ("quiet" enforcers; noise = caught), *Proofreaders* (Chapter 6; they grab any misplaced word), *The Press Rollers* (machine hazard).

---

## 3. LEVEL MECHANICS (unique to this dream)

### 3.1 THE PEN — the world is labelled, and labels can be edited
Many objects in this dream carry a visible **word** above them in the `small` font (a floating typewriter label): `heavy crate`, `locked door`, `raging river`, `high shelf`, `sleeping guard`, `loud crowd`. Jo's pen can **strike through an adjective** and **write a new one** from a small vocabulary he has collected. Change the word, change the thing:
- `heavy` → `light`: the crate can be pushed / carried.
- `locked` → `open` — but `locked` is usually **bound** (underlined = can't be changed); you need the key, or to change something *else*.
- `raging` → `calm`: the river slows enough to swim.
- `high` → `low`: the shelf drops to a reachable height.
- `sleeping` → `awake` (why would you) / `awake` → `sleeping`: the guard nods off.
- `loud` → `quiet`: the crowd parts.
- `wet` → `dry`, `broken` → `fixed`, `dark` → `lit`, `narrow` → `wide`, `slow` → `fast` (conveyors, fans), `sharp` → `blunt`, `hot` → `cold`.
Rules that make it a puzzle instead of a cheat:
- **Ink** is a meter (the dream's resource). Each edit costs 1 ink; refill at inkwells (`V`-style interactables, one or two per section). Bad edits waste ink; the player must plan.
- **Vocabulary.** Jo can only write words he has **collected** — found on signs, overheard in the café (§5.2), read in the library. The satchel shows the current word list (max 8; drop one to pick another). Every section adds 2–3 words and takes one away.
- **Bound words** (underlined) cannot be edited. **Nouns** cannot be edited. Only adjectives, and only one per object.
- **Edits are permanent for the section** — and the **Inner Editor erases them** when he walks past (Chapters 4–6), which is why he is terrifying.
- Some objects have **two** adjectives (`heavy locked chest`) and only one slot can be changed. Some edits have side effects (`calm` river → the mill wheel stops → the bridge that ran on it drops). Chains are the puzzles.

### 3.2 THE DRAFT — the manuscript is a physical thing
Jo carries **the Draft**: a stack of pages in the satchel with a page count. Writing rooms (a desk with a typewriter) add pages when Jo sits and the player completes a **typing rhythm** (letters fall like notes; hit them; misses add "typos" that must be crossed out later). Chapters open when the page count reaches a threshold. The Draft can be **lost** (Chapter 4) and **cut** (Chapter 5). The final page count is printed on the book in Chapter 7.

### 3.3 NOISE (Chapters 2–3)
A meter: noise builds from crowds and machines; above a threshold Jo "can't hear himself think" — the label words scramble to nonsense and can't be edited until he finds quiet. Libraries invert it: **his** noise (running, jumping, dropping things) wakes the guards.

### 3.4 THE INNER EDITOR
From Chapter 4: a silhouette 3 tiles tall walks left→right at 60% of Jo's speed, starting 8 tiles behind. Everything it passes is **erased** — platforms become dotted outlines and fall; edited words revert; coins vanish. It stops at chapter gates and at any writing desk while Jo is typing (writing is the only thing that holds it). Standing still elsewhere lets it catch up, and being overtaken = "the page goes blank": a caught-style reset to the checkpoint with the section's edits undone. It is the level's clock, and it never shows a number.

---

## 4. SECTION MAP & TIMING

| # | Chapter | Time | Checkpoints | Flags |
|---|---|---|---|---|
| 0 | Arrival — the attic, 5 a.m. | 0:45 | CP0 | — |
| 1 | The Blank Page (attic + copy shop) | 3:00 | CP1a, CP1b | `wr.chapter1`, `wr.rent_paid` |
| 2 | The Café | 3:00 | CP2a, CP2b | `wr.met_wren`, `wr.lines` |
| 3 | The Library (the stacks) | 3:30 | CP3a–c | `wr.research`, `wr.structure` |
| 4 | The Rejections (post office → bus → rain → rewrite) | 4:00 | CP4a–c | `wr.rejected`, `wr.draft_lost`, `wr.rewritten` |
| 5 | The Editor | 3:00 | CP5a, CP5b | `wr.cut_done` |
| 6 | The Deadline (agent + press) | 3:00 | CP6a, CP6b | `wr.printed` |
| 7 | The Reading | 1:30 | — | `dreams.writer` |

**Palette:** attic — dust-grey and lamp-amber, one square of blue dawn → copy shop — fluorescent white, toner blue → café — brown, brass, steam → library — green lamps, oak, gold dust in light shafts → post office — institutional cream, red slips → bus/rain — grey-blue, sodium orange → the rewrite — the palette *returns* to the attic amber but thinner, ink-black Editor → editor's flat — paper white, red pencil → press — iron, oil, ink-black, hot orange → bookshop — warm wood, nine chairs, one lamp.
**Music stems:** (1) typewriter-as-percussion (rhythmic clacks that fall on the beat, always), (2) piano (attic, café), (3) clarinet (library, editor), (4) low strings (rejections, press), (5) solo piano (reading). Music **stops** whenever the Inner Editor is within 3 tiles.
**Coin:** a penny (writers are paid in pennies), **worth 2**, budget 100–120.

---

## 5. SECTION DETAILS

### CHAPTER 0 — Arrival (0:45)
The train stops behind a row of tall thin houses at 5 a.m. Rain has just stopped. A single attic window is lit. Title card: **DREAM — THE SECOND DRAFT**. Jo climbs a fire escape (marked `|`) past sleeping windows to the lit one. Inside: a mattress, a typewriter on a door laid across two crates, a wall of index cards, a coffee tin of pens. **D0** — Jo, to the typewriter: "Morning." (His second and last self-talk in the game.) **HUD objective:** *Write Chapter One (12 pages).*

### CHAPTER 1 — The Blank Page (3:00)
**The attic (1:15) — teaches the pen.** The room is small and everything is labelled. The typewriter is `jammed typewriter` — first edit: `jammed` → `working` (the pen tutorial card; `working` is the first word Jo has, printed on a coffee tin). The window is `stuck`; the trapdoor is `locked` (bound). A `heavy trunk` blocks the stairs; the vocabulary so far has no `light` — the player must find it (it's on a bulb label: `light bulb`… no: nouns can't be taken — it's on a cereal box, `light breakfast`. Words are collected by walking into them.) Then: sit at the typewriter — **first typing rhythm** (8 bars, slow); pages tick up to 4. Coins: pennies in the mattress (peek-down), on the roof beam (hang from the skylight).
**The copy shop (1:45) — the day job.** Mrs. Adesanya knocks: rent. Jo can't pay. Down the fire escape and across the street (a scalper-type pigeon steals the Draft page if Jo dawdles on the ledge). The copy shop: Tomasz at the counter, six machines, a queue. **The job is a conveyor set piece**: papers ride belts, Jo must jump the belts, cross-out `jammed` machines to fix them (ink is scarce — 4 edits, 6 machines; two must be fixed by hand via a plate-and-lever timed gate), carry the toner (`heavy`) up the stairs. Each fixed machine pays pennies. Enough pennies → back to the landlady (`wr.rent_paid`). Between shifts, a back-room desk: **typing rhythm 2** → 12 pages. Chapter gate opens.
**Small Moment #1 — "Tomasz's break":** the alley behind the shop, Tomasz eating a sandwich, reading a page Jo left in the machine, laughing at a line. 6 s. Text: *"He'd never told him it was funny."*
**Foes:** landlady (hide behind the water tank / distract by dropping a page), pigeon. **Hazards:** belts, hot fuser rollers (`hot` → `cold` if you have the word), a toner spill (`slippery`).
**CP1a** attic lamp; **CP1b** copy-shop bell.

### CHAPTER 2 — The Café (3:00)
A long room, deep as a church, all in brown and brass, with a mezzanine and a back garden. Steam from the machine, a cat on the piano, the regulars. **Noise** is introduced: the espresso machine and the *Café Talkers* build the meter; labels scramble above 70%.
**Mechanic — stolen lines.** Overheard conversations (speech bubbles over Talkers) contain **highlighted words**; walking into a bubble collects the word. This chapter's puzzles require words only found this way (`quiet`, `wide`, `dry`, `awake`). The Talkers push Jo back if he lingers — he must slide under a table, come up on the other side, and catch the bubble from behind.
**Layout & puzzles:** the counter (`narrow gap` → `wide` to get behind it), the mezzanine (`broken ladder` → `fixed`; but `fixed` is not yet collected — it's in a bubble on the mezzanine, so the route is up the shelves via hang-drops and along the picture rail), the garden (a `wet bench` and a `sleeping` dog blocking the gate; `sleeping` is bound, the dog must be woken by playing a note — the trumpet still works in this dream, one use only per section: a "noise burst").
**Meet Wren:** at the piano, writing on napkins. **D1** — Wren: "You're stealing lines. Good. Everyone in here is somebody's chapter. Take that one — the man in the hat's been saying 'it was never about the money' for a year and it's *always* about the money." (She hands Jo a napkin: word `honest`.) Companion from here.
**Emmerich** at the window table reads Jo's pages without asking. **D2** — Emmerich: "Page three. Cut it." Jo: "Which part?" Emmerich: "Page three." He goes back to his paper. (Plant.)
**Puzzle-box P1 — "The Napkin":** Wren's challenge. A 4×4 grid of overheard fragments; arrange them into a paragraph that reads (drag to order); the grid has one correct order and shows a "reads badly" underline on any adjacent pair that clashes. Success gives the word `true` and 6 pages. `wr.lines`.
**Writing desk** at the garden table (typing rhythm 3, with cat interference) → 30 pages.
**Small Moment #2 — "The man in the hat":** he is at the bar, alone, not saying anything for once. Jo sits one stool down. 8 s. Text: *"It was never about the money."*
**CP2a** the counter bell; **CP2b** garden gate.

### CHAPTER 3 — The Library (3:30) — THE LABYRINTH
The reading room, then **the stacks**: five floors of shelving in a vertical grid, iron stairs, rolling ladders on rails (rideable platforms), book carts, dumbwaiters, a glass floor on level 3. Green lamps. Dust in light. **Quiet rule:** the noise meter is Jo's own; guards patrol; caught = "escorted out" (thrown out to the reading room checkpoint).
**The research objective:** find **five sources** (key items — books with labelled spines) scattered through the stacks, in any order, bring them to the reading-room desk. Each is behind a word-puzzle chain:
1. *History* — on a `high shelf` (change to `low`; but the word `low` is in a book on level 4 — reach it first by riding a ladder rail while a guard passes below).
2. *Maps* — in a `locked` (bound) cabinet; the key is in a `heavy` cart that must be pushed onto a dumbwaiter and sent to level 5 — the noise of the cart wakes a guard; `sleeping guard` can be made to stay `sleeping` only if Jo has `quiet` from the café.
3. *Letters* — across the glass floor, which is `fragile` (bound) — cross only by careful-step; running = it cracks = a slow fall to level 2 (the level's "peek-down shard shaft" pattern).
4. *Weather* — behind a `dark` alcove (→ `lit`; the word is on the stairs).
5. *Grief* — the fifth book is not on any shelf. It's on Emmerich's table in the reading room, and he gives it to Jo only after **P2**.
**Puzzle-box P2 — "Structure":** Emmerich lays out Jo's thirty pages as **cards on a table** — a story-structure puzzle: 12 scene cards must be placed on a three-act line with rising tension (each card has a tension value 1–5 shown as a small graph; the line must rise, dip once, and end highest). Two cards are red herrings (they belong to *another* book — Wren's; putting them in gives a "not yours" flash). Solving adds `wr.structure` and the word `necessary`.
**Foes:** guards (post/patrol/alert per D6; hide in book carts; distract by dropping a book *elsewhere* — throw = E on a book while carrying). **Hazards:** ladder rails (they roll into walls), dumbwaiters (slice if you stand in the shaft), the glass floor.
**Writing desk** (reading room): typing rhythm 4 → 60 pages. Chapter gate.
**CP3a** reading room; **CP3b** level 3 landing; **CP3c** level 5 window.

### CHAPTER 4 — The Rejections (4:00) — THE DARK CHAPTER
**The post office (1:00).** Sixty pages in a bag. A hall of brass boxes. Jo posts the Draft to **forty** addresses (a quick sequence: a plate per box, a stamp sound per plate — the player runs the length of the hall hitting them). Cut to: the same hall, weeks later, labelled `later`. The boxes open and **Rejection Slips** come out — flying paper foes that chase, forty of them, in waves, and the hall is now a running gauntlet across the counters while slips tear at the bag (each hit steals 2 pages; the pen tears a slip). Wren is there. **D3** — Wren: "Forty. That's… that's a good number. Mine was a hundred and ten." Palette drops.
**The bus (0:45).** Rain. A night bus, Jo asleep, the bag on the seat beside him. The player controls a small **dream** (a two-screen platform section inside the bag, pages as platforms) — and when they wake, the bus is empty and **the bag is gone**. `wr.draft_lost`. HUD: page count 0. The satchel word list empties except `honest`.
**The rain walk (0:45).** The bus depot to the attic on foot in rain: the level's silent stretch. The **Inner Editor appears** for the first time — behind Jo, walking, erasing the pavement. Music stops. No dialogue. The landlady's light is on. Jo goes up the fire escape.
**The rewrite (1:30) — the chapter's big puzzle.** The attic. Typewriter. The wall of index cards is the interface: **Puzzle-box P3 — "From Memory"**: the player must reconstruct the book's structure they solved in P2 — the same 12 scene cards, but now **six are blank** and must be filled from fragments the player collected in Chapters 1–3 (stolen lines, the napkin, the five sources' spines). Fragments the player never picked up are simply unavailable — the rewrite is only as good as the attention paid. Any structure that still rises-dips-rises passes; the Draft returns at a page count equal to fragments used × 5 (max 60, more likely 40–50). The Inner Editor stands at the trapdoor the whole time and does not come in. Wren arrives with soup and the word `again`. `wr.rewritten`.
**Small Moment #3 — "The stairwell":** the landlady on the stairs, at night, reading a page that blew under her door. She doesn't knock. 6 s. Text: *"She'd stopped asking about the rent."*
**CP4a** post office; **CP4b** bus depot; **CP4c** attic (the lamp, once you've rewritten — no checkpoint on the rain walk; it must be walked whole).

### CHAPTER 5 — The Editor (3:00)
Emmerich's flat, above a laundrette: paper on every surface, a red pencil the size of a rolling pin (it's a real object — the pen is swapped for it this chapter; **edits now delete, not change**). **D4** — Emmerich: "Sixty pages. Forty of them are the book. Find them."
**The mechanic flips:** the world is built from Jo's own pages — platforms and walls are paragraphs, labelled with their scene names from P2/P3. Striking a label **deletes the paragraph** — the platform vanishes. Some paragraphs are load-bearing (other platforms rest on them); some are scaffolding (dead-end ledges with coins on them — tempting to keep). **The objective is to reach the far door with the manuscript at ≤ 40 pages**, which means the player must cut at least 20 pages' worth of world *while standing on it*, planning the order so they never delete what they're on or what they need. The Inner Editor patrols and erases what Jo hasn't decided about — indecision is punished.
**Puzzle-box P4 — "Page Three":** the paragraph Emmerich told him to cut in Chapter 2. It is the largest platform in the room and the most beautiful — coins, a Small-Moment-style vignette, warm light. It is scaffolding. The box shows the paragraph in full (`body` text, actually written, and actually good). Two buttons: KEEP / CUT. Keeping it means the player must find 6 more pages elsewhere and the room gets harder. Cutting it makes Jo wince (portrait) and the room's exit light turns green. Either works. The game records the choice (`wr.page_three = kept|cut`) and Emmerich's last line differs.
**Writing desk:** none — this chapter adds no pages. `wr.cut_done` when the door opens at ≤ 40.
**CP5a** the laundrette; **CP5b** mid-room, a paragraph labelled `necessary` (bound — cannot be cut).

### CHAPTER 6 — The Deadline (3:00)
**The agent (0:45).** Isolde Marr's office on the 14th floor: glass, a view of the city, a clock. **D5** — Isolde: "I love it. I've sold it. It's due Friday. It's Wednesday." A **deadline timer** appears in the HUD (the only visible clock in the dream): 6 minutes of real time to reach the press and print. The Inner Editor is now **in front** of Jo too — erasing the way ahead unless he keeps moving.
**The city (1:00).** A rooftop run to the printworks: fire escapes, `narrow` ledges (→ `wide` costs ink; ink is nearly gone — the last inkwell is in the agent's office, visible, easy to miss in the hurry), a `slow` crane (→ `fast` for a ride across the avenue), Proofreaders in the lobby who grab any player carrying a page with a typo (the typos from the typing rhythms come due here: each unresolved typo is a red mark on the Draft; Proofreaders home in on red — the player can fix typos at a desk in the lobby, 2 s each, if they have time).
**The press (1:15) — the machine set piece.** A four-storey printing press: paper webs running at speed (ride them), rollers (crushers on the beat), ink troughs (`~`, drown), drying racks (swinging platforms), the folder (a slicing gate), and the cutter. The Draft must be **fed in at the top** (a plate) and Jo must **ride the paper down** through the machine ahead of the Inner Editor, jumping between webs as they cross, and pull three levers in order (marked on the machine: *ink → press → fold*) to make it print. A wrong order jams the machine: the web stops, the rollers keep going, restart at CP6b. Success: a bound book drops into a tray at the bottom. `wr.printed`. The timer stops. The Inner Editor **turns and walks away**. Music: the low strings resolve.
**CP6a** the lobby desk; **CP6b** the press feed platform.

### CHAPTER 7 — The Reading (1:30)
A bookshop at night. Warm wood, one lamp, **nine folding chairs** (the Cellar's nine; Delphine's rule). Wren is in the front row. Emmerich is at the back, not reading a paper. Tomasz. The man in the hat. The landlady, in her coat, by the door. Isolde is not there.
Jo walks to the lectern. **The last typing rhythm** — but this time the letters are the book's first paragraph, in `body`, and they don't fall: they appear as he presses, any key, at any speed; there are no misses. The room listens. It is a short paragraph. It ends.
Nine people clap. Emmerich nods once. Wren says: "Page three?" Jo: "Cut." (or "Kept.") Wren: "Good."
The **orb** is on the shelf behind the lectern, spine out, in a row of other books, glowing just enough. Jo takes it down. White fade.
Text cards: *"[N] pages."* → *"Was it enough?"* → Small-Moment line, plus:
- `wr.page_three = kept` → *"He kept page three. Nobody noticed but him."* · `cut` → *"He cut page three. He still knows it by heart."*
- if the rewrite used every fragment: *"The second draft was the one he'd been paying attention for."*
Sets `dreams.writer = true`.

---

## 6. PUZZLE-BOXES
| Id | Where | Mechanic | Time |
|---|---|---|---|
| P1 The Napkin | café | order 16 fragments into a paragraph; clash underlines | 1:00 |
| P2 Structure | library | 12 scene cards on a three-act tension line; 2 red herrings | 1:30 |
| P3 From Memory | attic rewrite | P2 again with 6 blanks filled from collected fragments | 1:30 |
| P4 Page Three | editor | read the paragraph; KEEP / CUT; consequences | 0:45 |
| (the press) | deadline | lever order ink → press → fold while riding the web | in-world |

## 7. DIFFICULTY (slow work, not cheap deaths)
- Ink per section 6 (d0) → 4 (d≥2). Vocabulary cap 8 → 6.
- Noise threshold 70% → 55%; library guards +1 per d; Rejection Slips 40 → 60 at d≥2.
- Inner Editor speed 60% → 75% of Jo's at d≥2; starts 8 tiles back → 5.
- Deadline 6:00 → 6:00 × (1 − 0.1d). Proofreaders home faster.
- The rewrite (P3) never fails outright — a poor rewrite just yields fewer pages, which makes Chapter 5's cut *easier* and Chapter 7's page count smaller (the game quietly tells you).
- Fail states: caught/erased = checkpoint; press jam = CP6b; deadline expiry = Isolde's voice "Friday's Friday," restart at CP6a with the timer refilled to 4:00 (never less).

## 8. KEY ITEMS & COINS (collectibles skill)
| Chapter | Key item | Behind | Tool use | Flag |
|---|---|---|---|---|
| 1 | Toner (heavy) / rent pennies | belts + hot rollers | toner fixes machine 6 | `wr.rent_paid` |
| 2 | The napkin (word `honest`) | Talkers + mezzanine climb | — | `wr.met_wren` |
| 3 | Five sources | five stack puzzles | each adds a word | `wr.research` |
| 4 | Soup (Wren) — the word `again` | the rain walk, unbroken | — | `wr.rewritten` |
| 5 | The red pencil | Emmerich's door | replaces the pen | — |
| 6 | The bound book | the press | — | `wr.printed` |
Coins: pennies worth 2, budget 100–120, heavy on the stacks and the press; none in Chapter 4's rain walk.

## 9. IMPLEMENTATION (Part D stack)
- `src/data/writer/rooms.js`, `tiles.js`, `sprites.js`, `words.js` (object labels: `{ noun, adj, bound, slot2?, onChange(adj) }`), `cast.js`.
- **Label system** `src/systems/labels.js`: renders `small`-font labels above labelled objects; `Pen` interaction opens a 3-second edit micro-UI (strike animation, word list from the satchel, ink cost); `onChange` swaps the object's kind/physics (a registry in `words.js` maps `noun+adj → behaviour`). Scramble on noise.
- **Vocabulary**: `flags.wr.words[]` (max per difficulty); word pickups are `Carryable`-class glints on signs and in speech bubbles.
- **Draft**: `flags.wr.pages`, `flags.wr.typos[]`; typing rhythm reuses `rhythm.js` with a letter-fall renderer.
- **Inner Editor**: `entities/InnerEditor.js` — a non-foe with an `eraseFront` sweep: tiles and objects behind its x become `dotted` variants, then fall (reuse loose-tile behaviour); reverts labels; halts at `desk` objects while `player.state === 'typing'`.
- **Chapter 5**: rooms authored as paragraph-platforms with `loadBearing[]` dependencies; deleting a parent drops its children after 1 s (dotted → fall). Page counting = sum of remaining paragraph weights.
- **Press**: paper webs as moving one-way platforms with speed; rollers on beat; levers with an order check.
- Companion (Wren) reuses the Nia controller; she cannot edit words but can **hold a bubble open** (call her to stand in a Talker's line so a bubble stays up longer).

## 10. ACCEPTANCE
- First-time ≥ 18 min; at least one tester runs out of ink in the library and has to backtrack for an inkwell.
- A tester who skipped the café bubbles gets a thin rewrite and *notices* the page count.
- Testers split on KEEP vs CUT for page three, and argue about it afterward.
- The rain walk is completed in silence with no one asking "what am I supposed to do."
- Every label edit in the level has exactly one intended solution chain and at least one legal alternative that costs more ink.
