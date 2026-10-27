# DREAMCATCHER — DREAM SPEC: PAINTER — "THE YELLOW HOUSE"

Follows Parts A, C, D and the three skills. Target first-run playtime: **18–22 minutes**. This is the dream that looks like nothing else in the game: **every tile, sky, and character is drawn as if painted** — thick strokes, swirling skies, violet shadows under yellow light, outlines in blue instead of black. It is the prettiest dream and, in proportion, one of the darkest. Names are placeholders; rename in `src/data/painter/cast.js`.

**Style note for the whole level:** post-impressionist, in the spirit of the painter who lived in a yellow house in the south and painted the night. **We borrow the way of seeing, not any specific picture** — no recreated canvases. The rule is: *if a screen could be cut out and hung, it's right.*

---

## 1. STORY

**Logline:** Jo moves south to paint light. He paints the fields, the café at night, the sunflowers; sells nothing; takes in a friend who leaves after a quarrel; is boarded out of his own house by neighbours; recovers in a hospital garden one colour at a time; and climbs, on the last night, into a sky that finally moves the way he always saw it — and the orb is a star he painted. One canvas sells. He never knows.

**Theme:** seeing. Everyone else looks at the same field and sees wheat. The dream is about what it costs to see colour nobody else does, and whether the seeing is its own payment. The darkness is real — poverty, rejection, loneliness, exhaustion — and the level does not pretend otherwise. (It does not depict self-harm. The hospital is a garden with a doctor, and it's where colours come back.)

**Arc (seven canvases):**
1. **The Studio** — a yellow house with no furniture and no paint. Letters from his brother **Isak** arrive with money and tubes. Jo learns the brush.
2. **The Fields** — wheat, sun, cypresses, the wind. The postman **Roulin** becomes a friend. Ten canvases in ten days; the dealer in the city wants none.
3. **The Café at Night** — the first night section. Blue sky, yellow terrace, a sky with swirls. **Paul**, a painter from the north, arrives to share the house.
4. **The Quarrel and the Wind** — the two paint the same chair differently; it ends badly; Paul leaves on the night train. The mistral comes. Crows over the wheat. A petition: the neighbours board up the house. Jo's palette is **emptied** and the world goes to underpainting.
5. **The Garden** — a hospital with a walled garden, irises, a kind doctor. Colours recovered one by one, each one a puzzle.
6. **The Night** — the cypress climb into a sky that moves; stars as platforms; the orb is one of them.
7. **Isak's Room** — far north, a small flat full of stacked canvases facing the wall. One hangs. A visitor buys it. The orb's light is in its frame.

---

## 2. CAST
- **Jo** — player. Level tool: a **brush** (shove = a swipe that leaves a streak; interact; and the dream's unique mechanic).
- **Isak** — Jo's brother, a dealer's clerk in the north. Never seen in person until Canvas 7; present as **letters** (readable, with money and pigment inside). The level's lifeline and its quiet tragedy: he believes, and it isn't enough.
- **Roulin** — the postman. Big beard, blue uniform, a family. Brings Isak's letters, sits for a portrait, says what he thinks. The friend. Small Moment NPC.
- **Paul** — the painter from the north. Confident, generous, cruel when tired. Companion NPC in Canvases 3–4 (he can paint the colours Jo hasn't collected — and he paints over Jo's work).
- **Dr. Rey** — the hospital doctor. Young, patient, keeps a notebook. Canvas 5.
- **Madame Ginoux** — runs the café. Lets Jo paint at night for the price of one drink he can't pay.
- **M. Vautrin** — the dealer's man in the city. Looks at ten canvases for eleven seconds. "Who would hang this?"
- **Foes:** *The Mistral* (wind hazard — pushes, tears canvases off easels, blows pigment away), *Crows* (creature class; dive, steal a pigment tube), *The Petitioners* (person class; neighbours in groups who board doors and "see him home" — caught = escorted to the house, which is now locked), *The Gendarme* (patrols Canvas 4 only), *Gardeners* (Canvas 5; gentle; catch = "back to bed" reset), *Night Shutters* (Canvas 6: windows that slam when Jo paints near them).

---

## 3. LEVEL MECHANICS (unique to this dream)

### 3.1 UNDERPAINTING — the world starts unfinished
Every room begins as **underpainting**: umber and grey-blue wash, forms blocked in, no colour. Painted surfaces are the only coloured things. The level progresses by Jo *finishing* the world, and the world's finished state **persists** within the dream — walk back through the fields and they're gold because you made them gold. (Canvas 4 undoes this. That's the point of Canvas 4.)

### 3.2 PIGMENT — carry three, mix to six
Jo carries a **palette** (HUD, bottom-left: three wells). Pigments are collected as **tubes** — from Isak's letters, from the ground, from shop shelves he can't afford (steal = foe alert), from flowers (yellow from sunflowers, violet from irises, red from poppies, blue from the sky at a specific hour). Three wells max; dropping one to take another is a real decision. Mixing two wells on the brush gives a **secondary** (yellow+blue=green, red+yellow=orange, blue+red=violet). Each colour **does** something when painted onto a surface:

| Pigment | Painted on a surface… | Painted in the air (a stroke, §3.3)… |
|---|---|---|
| **Yellow** | lights it (dark rooms become navigable; sunflowers bloom into platforms; warmth melts frost) | a glowing stroke — a light bridge that also lights the room |
| **Blue** | cools/wets it (fills a channel; a hot surface becomes safe; night falls over that surface — Night Shutters open) | a stroke you can **swim** through (slow, drifting; good for vertical gaps) |
| **Red** | heats it (lights a stove; burns a rope; a cold hazard becomes a hot one) | a stroke that **launches** (a short, hard upward kick) |
| **Green** (Y+B) | grows it (vines on a wall → a ladder; grass → soft landing; a seed → a tree platform in 3 s) | a stroke that **holds** longest (8 s) — the structural one |
| **Orange** (R+Y) | the sun on it: it **vibrates** when touching blue (§3.4) | a stroke that fades in 2 s but counts as **ground for a running start** |
| **Violet** (B+R) | shadow: Jo is **hidden** standing on/in it; shutters close; crows won't dive | a stroke no foe can see Jo on |
| **White** (rare; from Isak only) | **primes** — erases colour back to underpainting; the only undo | — |
| **Black** (never collectable) | — | — (the painter outlines in blue; black doesn't exist here) |

**Paint** is finite: a tube holds **12 strokes**. Empty tubes stay in the well but do nothing; refills are tubes. The HUD shows each well's fill as a smear.

### 3.3 THE STROKE — painting platforms
Hold the brush button while moving and Jo paints a **stroke in the air** following the cursor/direction: a ribbon 1 tile thick, up to 6 tiles long, that is a platform while **wet** (duration by colour, §3.2) and then dries and falls away as flakes. Strokes can be chained (jump from one to the next). Impasto rule: painting the **same stroke twice** (second pass while wet) makes it **thick** — permanent for the room, but costs double paint. Wet strokes are **slippery** for the first 0.5 s. The Mistral bends wet strokes downwind.

### 3.4 COMPLEMENTARIES — colour against colour
When two complementary colours touch (yellow/violet, blue/orange, red/green), the shared edge **vibrates**: a visible shimmer and a hum. A vibrating edge is a **launcher** — stand on the yellow side of a yellow/violet edge and jump: triple height. Painting the complement next to a hazard **neutralises** it (a red stove goes dormant if green is painted beside it). The level's harder puzzles are built on placing the right complement in the right spot with the paint you have.

### 3.5 THE LIGHT — hours of the day
The dream has a **clock** that only moves when Jo paints (each stroke advances it ~1 minute). Dawn → noon → evening → night. Some pigments are only collectable at some hours (sky-blue at dusk, the yellow of the fields at noon), some surfaces only accept paint at some hours (the café terrace only at night), and shadows lengthen on a real sun angle (shadows are violet, always — never grey, never black). A player who paints carelessly runs the clock out and finds the fields in the dark. Night is not a fail; it's just harder, and more beautiful.

### 3.6 THE CANVAS — the deliverable
Each canvas section has an **easel** (interactable). Painting the section's assigned subject (a *subject marker* floats over it — the sunflowers, the terrace, the chair, the irises, the stars) **with at least two of the right colours on screen** captures a canvas: a thumbnail of the actual rendered screen is stored (the room, as the player painted it). Canvases are carried in a **crate** (satchel) to be sent north or shown to the dealer. The Mistral and the crows target the crate. The player's own screenshots are the level's collectible — and they appear in Isak's room at the end.

### 3.7 THE PALETTE AS HEALTH
No hearts in this dream. **The palette is the health bar.** Every hit from a hazard, every catch by a foe, every fall, **spills one well** (empties it, pigment gone). All three empty = Jo "can't see colour": the world drops to pure underpainting, the music drops to one instrument, and he must find any tube at all to recover (checkpoint-reset with the last tube restored). It makes losing paint *feel* like losing blood, which is correct for this man.

---

## 4. SECTION MAP, TIMING, AND THE LIGHT/DARK RATIO

The dream is pretty **and** dark, and the two must be in proportion per section. Each canvas has a mandated **light:dark ratio** — the share of the finished screen in warm/saturated colour versus cool/desaturated underpainting and shadow. The art lint measures it on the room's reference render.

| # | Canvas | Time | Light:Dark | Lead colour | Checkpoints | Flags |
|---|---|---|---|---|---|---|
| 0 | Arrival — the station in the south | 0:45 | 50:50 | chrome yellow on umber | CP0 | — |
| 1 | The Studio (the Yellow House) | 3:00 | 60:40 | yellow / Prussian blue | CP1a, CP1b | `pt.brush`, `pt.letter1` |
| 2 | The Fields | 4:00 | 80:20 | gold / cypress green / sky | CP2a–c | `pt.ten_canvases`, `pt.vautrin` |
| 3 | The Café at Night | 3:00 | 45:55 | cobalt night / lamp yellow | CP3a, CP3b | `pt.paul`, `pt.terrace` |
| 4 | The Quarrel and the Wind | 3:30 | 15:85 | underpainting / crow black-blue | CP4a, CP4b | `pt.quarrel`, `pt.boarded`, `pt.emptied` |
| 5 | The Garden | 3:00 | 35:65 → 65:35 (rises) | iris violet / grey-green | CP5a–c | `pt.colours_back` |
| 6 | The Night | 2:30 | 40:60 (but every light is a halo) | ultramarine / star yellow | CP6a, CP6b | `pt.climbed` |
| 7 | Isak's Room | 1:00 | 70:30 | warm wood / one framed light | — | `dreams.painter` |

**Music stems:** (1) an accordion drone + brushes (the south; always), (2) cello (the house, the garden), (3) clarinet (fields, café), (4) a solo violin with no vibrato (the quarrel, the wind — it is the only "ugly" stem in the game), (5) muted trumpet over a harp ostinato (the night), (6) solo piano (Isak's room). Music **thins as the palette empties**: one well = one stem.
**Coin:** a **paint tube cap**, worth 2, budget 100–120. Tubes themselves are key items, never coins.

---

## 5. THE PAINTED LOOK — rules for every asset in this dream (art lint enforces)
This section overrides the character-motion and tile rules only where stated.
1. **Everything is strokes.** No tile is a flat fill. Every 32×32 tile is drawn as 4–8 visible brushstrokes with direction (wheat strokes go up-right; sky strokes swirl; stone strokes are short and stacked; wood strokes follow the grain). Each stroke has a **ridge**: a 1-px lighter line on its lit edge and a 1-px darker line on the other — impasto.
2. **Outlines are Prussian blue** (`#1F3A5F`), never black, never near-black. The `k` outline letter in rigs maps to this blue in `palettes.js` for this dream. Pure black appears nowhere in the level.
3. **Shadows are violet.** Every shadow tile and every character's shadow is a violet (`#5B3A7A`) wash at 60%, never grey. Shadow length follows the clock (§3.5).
4. **Lights have halos.** Every lamp, star, window and sun gets concentric rings of short radial strokes (3 rings, alternating the light's colour and its complement at 40%) rather than a soft glow circle. The halo strokes *rotate* at 1 rpm.
5. **The sky is a current.** Sky layers are stroke fields that **move**: slow swirls at parallax 0.1, drawn as 6–10 looping spiral paths of strokes that advance along the path (texture-scroll along a spline). At night, the swirls become **currents Jo can ride** (§6, Canvas 6).
6. **Complementary palette per section**: each canvas picks one dominant hue and uses its complement for all shadows and outlines-of-emphasis. Yellow rooms have violet shadows; blue rooms have orange lamps. The lint checks hue distribution against the table in §4.
7. **Characters** follow the motion skill's rig and proportion rules, but their shading tones are **hatched** (2-px diagonal stroke texture instead of flat tones), their outlines are the blue, and every character has one **impasto accent** (Roulin's beard, Paul's red hair, Jo's straw hat) drawn with thicker ridged strokes.
8. **Underpainting state**: an unfinished tile is the same stroke structure in umber (`#6B4E2E`) and grey-blue (`#4A5566`) only, at 70% contrast — forms visible, colour absent. The painted state is the full-colour version. Transition is a 6-frame wipe along the stroke direction when paint is applied.
9. **Text in the world** (signs, letters) is in the `body` font but drawn in a **handwritten variant**: 1-px jitter and a slight slant, Prussian blue ink. Isak's letters use it. The HUD stays plain.
10. **Nothing is tidy.** Easels lean, frames are cracked, the house's walls are uneven, the café chairs don't match. Perfect verticals are a lint warning.

---

## 6. SECTION DETAILS

### CANVAS 0 — Arrival (0:45)
The train stops at a southern station at the first hour of light. The platform is underpainting; the only colour is a **strip of chrome yellow** where the sun hits the far wall. Title card: **DREAM — THE YELLOW HOUSE**. Jo walks into the yellow strip and the title's letters fill with it. A plane tree, a man asleep against a wall with a dog, a shuttered café. One tube on the platform: **yellow** (breadcrumb, first pigment). The brush tutorial card: paint the wall; it lights; a door that was a shadow becomes a door.
**D0** — a station clerk, pointing: "The yellow house? Two streets. It's the one with no curtains. Nobody's lived there since—" (he shrugs).

### CANVAS 1 — The Studio (3:00)
The yellow house: two floors and an attic, bare, and the square outside. **Teaches:** pigment, strokes, the clock, the easel, letters.
**Ground floor:** no furniture. The front room is dark; paint yellow on a wall → light. A **channel** in the floor (an old gutter) is dry: blue fills it and a floating board becomes a lift. Stairs are missing three steps: strokes.
**Isak's first letter** (on the mat; readable, handwritten): money, two tubes (**blue**, **red**), and three lines about the north. `pt.letter1`. The player learns letters are both story and supply; from here every letter has a tube.
**Upstairs — the bedroom:** the level's first **subject**: an empty room with a bed, two chairs and a window. The subject marker says: *paint it so you'd sleep in it.* Puzzle-in-the-world: the room has three surfaces (walls, floor, bedding) and Jo has three pigments; the easel accepts the canvas only when the walls are **one** colour and the bedding its **complement** (the lint describes it to the player as "it needs to rest"). The first capture — the room becomes the player's own picture.
**The attic:** a cracked skylight (blue painted on it at the right hour = a view of the first stars; Small-Moment-adjacent). A crow gets in; shoo it with a swipe; it drops a cap.
**The square:** Madame Ginoux's café (shuttered by day), the shop with pigments in the window (`heavy` price tag; stealing one = the shopkeeper is a Petitioner from here on), the postman's route. **Roulin** arrives with the second letter. **D1** — Roulin: "Letters every week from the north. He must think you're a good investment." Jo: "He's my brother." Roulin: "Same thing, in a good family." He hands over **green** (Isak mixed it for him).
**Puzzle-box P1 — "The Palette" (1:00):** a mixing exercise on a wooden board: three target swatches, six wells, drag-to-mix with proportion (two parts yellow to one blue gives a different green than one-to-one). Matching all three unlocks mixing on the brush. Fails show the muddy result ("that's mud") and reset the board.
**Small Moment #1 — "The chair":** the kitchen, dawn; Jo has painted a chair yellow and sits on it; the light moves across the floor for 8 s. Text: *"He'd never had a chair that was his."*
**Foes:** the shopkeeper (if provoked), crows. **Hazards:** missing steps, the dry channel (fall), the cold stove (red lights it; it's also a hazard once lit).
**CP1a** the mat; **CP1b** the easel.

### CANVAS 2 — The Fields (4:00) — THE BRIGHT ONE
Out past the square: a long horizontal world of wheat, a road with plane trees, a canal with a drawbridge, sunflowers, a cypress line, a hill with a view. **80:20 light** — this is the dream's bright heart, and it must be *overwhelming*: strokes of gold going up-right across the whole screen, a sky of moving swirls, heat shimmer, cicadas.
**Objective:** **ten canvases in ten days** to send north. The clock (§3.5) runs across the section; each day ends at night and the player sleeps at the easel (checkpoint) to begin the next. Subjects are scattered across the fields — the bridge, the sunflowers, the harvest, the cypresses, the road, the sower at dusk, the haystacks, the plane trees, the canal, the hill — each with its colour requirement and its hour. The player plans a route by the sun. Ten in ten is tight; eight is the pass; ten is the shard.
**Mechanics in play:**
- **The Mistral** starts gently: a wind that bends strokes; on days 6–10 it rises and tears unframed canvases out of the crate (carry the crate under the canal bank; use violet to pin it).
- **Sunflowers:** paint yellow on a bud → it blooms into a platform; it faces the sun, so it turns with the clock, and at dusk the platforms tilt and drop. Cross the sunflower field at noon or not at all.
- **The canal:** blue fills a dry lock; the drawbridge needs red (burn the rope) and then green (vines to climb the counterweight).
- **The hill:** the vista room (zoom 0.75): the whole plain painted or unpainted according to the player's work. From here the player can see which fields they've finished.
- **Crows** in waves on days 8–10: dives steal tubes; violet keeps them off.
**Roulin's portrait (Small Moment #2):** he sits on a crate at the end of his round, in uniform, too proud to admit he likes it. Painting him (any two colours; blue uniform is traditional) is a canvas and a moment. 8 s. Text: *"He sat for an hour and said it was for the letters."*
**The dealer:** on day 10, a cart to the city. M. Vautrin's office is one screen, grey, with a brass bell. He looks at the crate (the player's actual ten canvases scroll past as thumbnails) for **eleven seconds of silence**, then: **D2** — Vautrin: "Who would hang this?" and the door. `pt.vautrin`. The clock is dusk on the ride home; the fields are still gold.
**Puzzle-box P2 — "The Hour" (1:00):** at the hill easel, a sundial: the player must set the hour at which three subjects (given) all have the right colour available at once — a scheduling puzzle with a shadow that moves. It teaches the clock properly before the Mistral days make it matter.
**Foes:** crows, a farmer who chases Jo off the standing wheat (person; outrun). **Hazards:** the Mistral, the lock, sunflower drop at dusk, heat (red on the ground at noon burns).
**CP2a** the bridge; **CP2b** the sunflower field edge; **CP2c** the hill easel.

### CANVAS 3 — The Café at Night (3:00) — THE FIRST NIGHT
The clock locks to **night**. The square: the café terrace is lit yellow under an ultramarine sky full of swirling stars; cobblestones in blue and violet; the lamp halos rotate. **45:55** — the pretty-dark balance exactly. This is the screen most testers will screenshot.
**The terrace** only accepts paint at night and only in yellow/orange — but Jo's yellow is low after the fields. Madame Ginoux: **D3** — "Paint it. Pay me in the painting. Not because it's worth anything — because I like the lamp." The terrace is the subject; the puzzle is **complementaries**: the sky must be blue and the terrace orange-yellow so the edge **vibrates** — and the vibrating edge is the launcher up to the balconies and the rooftops where the night's tubes are (blue from the sky at this hour, a rare **white** on a windowsill — an Isak letter).
**Paul arrives** on the night train with a trunk and a red beard. **D4** — Paul: "Your brother wrote. I'm to share the house and cost nothing. I cost something." Companion from here: Paul can paint colours Jo hasn't got (he has a full palette, and he's stingy with it: call him with F and he paints one stroke of what's needed, then says "you owe me one"). He also **paints over** Jo's strokes if he thinks they're wrong (a scripted beat on the rooftops: Jo's green ladder becomes Paul's red launcher; it works better; it stings).
**Rooftops:** blue-violet tiles, chimneys, a bell tower (`|` climbable), Night Shutters that slam when Jo paints too near them (a window with a sleeper; the first petitioner). **Puzzle-box P3 — "Vibrato" (1:00):** a tile grid of mixed colours; place six given tiles so that every shared edge is a complementary pair (a graph-colouring puzzle with three complement pairs). Solved → the whole terrace sings (a sustained chord) and the bell tower door opens. On top: the first view of the real night sky's currents, not yet rideable. `pt.terrace`.
**Small Moment #3 — "Madame Ginoux's lamp":** after hours, she sits under the one lamp with the painting Jo paid with propped on a chair, looking at it, drink in hand. 8 s. Text: *"She hung it where the lamp hit it."*
**Foes:** Night Shutters, one gendarme (patrol; caught = "go home, painter"). **Hazards:** roof slopes (slippery when painted blue), the bell (rings if you land on it — wakes shutters).
**CP3a** the terrace lamp; **CP3b** the bell tower.

### CANVAS 4 — The Quarrel and the Wind (3:30) — THE DARK ONE
**15:85.** The only section in the game with a mandated ugliness.
**The quarrel (0:45):** the house, morning, two easels, one chair. Both paint the chair. **Puzzle-box P4 — "The Same Chair":** two canvases side by side; the player paints Jo's with his wells; Paul's fills itself as the player works, always one step "better" (more saturated, more decided). The box offers two buttons at the end: **AGREE** (Jo's canvas is replaced by Paul's) / **DISAGREE**. Agreeing: Paul nods, stays one more day, and leaves anyway. Disagreeing: the argument (speech bubbles overlapping, no choices, the violin stem), and he leaves tonight. `pt.quarrel = agreed|disagreed`. Either way Paul takes **his palette** — and in the fight the wells spill: **Jo's palette empties.** `pt.emptied`. The house goes to underpainting. The music drops to the violin.
**The wind (1:30):** the Mistral at full force. The fields again, but now in underpainting and dusk, the wheat grey, the sky a stroke-field of near-black blue, **crows in hundreds** (particles with a few real foes among them). Jo must cross back from the station (where Paul's train leaves without a wave) to the house with **no paint at all**: no strokes, no colour — pure platforming in the wind, hang-drops, careful steps on the canal bank, the sunflowers dead and tilted. One tube exists in the whole section — **yellow**, in Roulin's bag, and Roulin is on his round at the far end. Getting to him is the section.
**The petition (1:15):** the square. The neighbours (Petitioners, groups of three, person-class, slow, blocking) have signed a paper. The house is being **boarded**: planks go up on the door while Jo watches from the square. He has one yellow tube. The puzzle: get inside. Routes: the attic skylight (needs the cypress by the wall → green; he has no green → climb the bare tree in wind, hang-drop to the roof), the channel (dry; no blue), the kitchen window (a shutter; a Petitioner on it; hide in… no violet; so: distract — throw the empty tube; it rattles; they turn). Inside: the bedroom from Canvas 1, in underpainting. The one yellow tube, on the one wall. The room lights. **D5** — Roulin, through the boards: "They're sending a doctor. Not a bad one. Go with him. I'll mind the letters." The gendarme opens the door. The screen goes to underpainting entirely. `pt.boarded`.
**No Small Moment in this section.** No coins after the station. **CP4a** the station; **CP4b** the square.

### CANVAS 5 — The Garden (3:00) — RECOVERY
A walled garden with a fountain, iris beds, a stone bench, a corridor of arches, the doctor's office; the sky visible over the wall, swirling. **35:65 rising to 65:35** — the section *becomes* bright as the player works, and that's the mechanic.
Jo arrives with an empty palette. **Dr. Rey**: **D6** — "You see colour other people don't. That's not the illness. The not-sleeping is. Paint one thing a day. I'll find you tubes." The garden is a hub of six small puzzles, each returning **one colour**, each a different ask:
1. **Violet** — the irises. They're underpainted. The subject marker: *paint them without violet* — impossible; the solution is to find the bed where one real iris already blooms (a tiny saturated spot in the whole grey garden) and sit by it (Down, held) until the clock moves and the light touches it: the tube appears in Jo's hand. Seeing, not painting.
2. **Blue** — the fountain. Dry. A gardener waters it from a can; follow him (stealth, gentle; caught = back to bed), take the can, pour; the water is blue; blue returns.
3. **Yellow** — the corridor of arches at noon: the sun comes through one arch at a time; stand in it as it moves (a slow timing walk) to the end wall, where a yellow is painted on the stone by the light itself.
4. **Red** — the poppies on the wall top. Climb the wall (`|` ivy), a hang traverse along the top past a gardener, collect.
5. **Green** — Dr. Rey's puzzle-box **P5 — "What the Tree Is"**: an underpainted tree; four colour options to paint it; the "right" one is whatever the player chooses — the box accepts any and Rey writes it in his notebook: "Green. Or blue. He sees it blue today." Green returns anyway (he has a tube). The point is the question.
6. **White** — a letter from Isak, held at the office, with a photograph of a baby (Isak's son, named for Jo). One white tube. **D7** — Rey, reading it to him: "He says the paintings are in his flat. Facing the wall, but all there. He says — he says come north when you're well."
With six colours back, the garden is painted (the wall, the beds, the fountain) and **65:35** — and over the wall, the night sky's currents have started moving in a way that can be climbed.
**Small Moment #4 — "The bench":** the stone bench at dusk, Dr. Rey sitting on the other end, not writing, for once. 8 s. Text: *"The doctor didn't say anything either."*
**Foes:** gardeners (gentle). **Hazards:** the wall top, the fountain basin (deep when full).
**CP5a** the gate; **CP5b** the fountain; **CP5c** the office.

### CANVAS 6 — The Night (2:30) — THE CLIMB
From the garden wall at night: a **cypress** rises against the sky like a flame, taller than anything — and the sky above the village is a field of **moving currents**, swirl paths of thick strokes, ultramarine and cobalt with stars in yellow halos.
**The cypress tower** (vertical, 3 screens): climbable (`|` on the dark side), swaying in wind (±1 tile sine), crows roosting (violet hides). Strokes in the air are needed to cross from branch to branch and the Mistral still bends them. At the top: the village below, every window the player ever painted lit in the colour they painted it.
**The currents** (the set piece, 1:30): jump from the cypress into the sky. **Swirl currents are rideable**: entering one carries Jo along its spiral path at speed (a conveyor in the air); exit by jumping at the right moment toward the next. **Stars are platforms** (halo = solid), the **moon** is a slow-rotating platform, and the **eleven stars** of the night are the eleven canvases the player captured, hung in the sky as faint thumbnails inside the halos — the player's own pictures, up there. Night Shutters on the village below slam at every stroke; shutters that slam shut *dim a star*; so the final climb must be painted sparingly, with violet strokes (silent). **Puzzle-box P6 — "Which Star"**: at the top of the highest current, the sky holds twelve stars and one is Jo's: a thumbnail grid of his captured canvases plus one he never painted (the bedroom as Paul painted it, if `agreed`; the chair as Jo painted it, if `disagreed`). Choose the one that's his. Any of his canvases is correct; the one that isn't is "not yours." The chosen star brightens; it's the **orb**.
He doesn't take it yet. **CP6a** the cypress base; **CP6b** the moon.

### CANVAS 7 — Isak's Room (1:00)
Cut to the north: a small flat, winter, a stove, a child's cot. **Canvases stacked facing the wall** — the player's own captures, backs showing, dozens, with their titles chalked. **One** hangs over the stove: the one the player chose. Isak, finally seen, is reading a letter at the table; he doesn't look up. A knock. A visitor — a woman with a scarf — looks at the hung one for a long time. **D8** — Visitor: "How much?" Isak: "…It isn't—" Visitor: "How much." Isak names a number. She pays. She takes it off the wall, and in the gap it leaves there's **light** — the orb, in the shape of the frame.
Jo (not there; this is the one scene in the game he isn't in) — the player walks Jo across the garden wall at night to the star, in the same moment, and takes it. White fade.
Text cards: *"One sold."* → *"Was it enough?"* → Small-Moment line, plus:
- `pt.ten_canvases` (all ten): *"Ten in ten days. The wind took two. Eight went north."*
- `pt.quarrel = agreed`: *"He painted the chair Paul's way. He still thinks about his own."* / `disagreed`: *"He painted the chair his way. Paul's was better. He'd do it again."*
- all four Small Moments: *"The irises were the point."*
Sets `dreams.painter = true`.

---

## 7. PUZZLE-BOXES
| Id | Where | Mechanic | Time |
|---|---|---|---|
| P1 The Palette | studio | proportional mixing to three targets | 1:00 |
| P2 The Hour | fields | set the sundial so three subjects' colours are available at once | 1:00 |
| P3 Vibrato | café roofs | graph-colouring: every shared edge a complementary pair | 1:00 |
| P4 The Same Chair | quarrel | paint vs. Paul's auto-fill; AGREE / DISAGREE | 0:45 |
| P5 What the Tree Is | garden | any answer accepted; the question is the point | 0:30 |
| P6 Which Star | night | identify your own canvases among the stars | 0:45 |

## 8. DIFFICULTY (less paint, more wind)
- Tube capacity 12 strokes (d0) → 8 (d≥2). Wells 3 → 2 at d≥3 (mixing still works; carrying doesn't).
- Clock advance per stroke 1 min → 2 min at d≥2 (the fields' day is shorter).
- Mistral starts day 6 → day 3 at d≥2; crow waves +1 per d.
- Canvas 4's wind section loses its one checkpoint at d≥3.
- Currents in Canvas 6 move 20% faster per d; Night Shutters dim two stars at d≥2.
- Fail states: palette empty = recover the last tube at checkpoint; caught by Petitioners = escorted to the locked house (CP4b); back-to-bed = CP5a; falling off a current = the cypress top (never the base).

## 9. KEY ITEMS & COINS (collectibles skill)
| Canvas | Key item | Behind | Flag |
|---|---|---|---|
| 1 | Isak's letters 1–2 (blue, red, green) | the mat; Roulin's round | `pt.letter1` |
| 2 | Ten canvases (the crate) | ten subjects across ten days + the Mistral | `pt.ten_canvases` |
| 3 | White (Isak's letter on the windowsill) | the vibrating launcher | — |
| 4 | The one yellow tube | Roulin, across the wind | `pt.emptied` → recovery |
| 5 | Six tubes (violet, blue, yellow, red, green, white) | six garden puzzles | `pt.colours_back` |
| 6 | The star | the currents + P6 | `pt.climbed` |
Coins: tube caps worth 2, 100–120, tiered per the skill; none in the wind section of Canvas 4; the sunflower field pays only at noon.

## 10. IMPLEMENTATION (Part D stack)
- `src/data/painter/rooms.js`, `tiles.js` (two tilesets per room: `under` and `painted`, same stroke structure), `sprites.js`, `cast.js`, `subjects.js` (`{ id, room, marker, requires: [colours], hour: [from,to] }`).
- **Paint state**: `paintLayer` — a per-room grid of `{ colour, thick, wetUntil }`; rendering swaps tile variant `under → painted[colour]` with the 6-frame directional wipe; persisted in `flags.pt.paint[roomId]` for the dream; **Canvas 4 clears it** (`emptied`).
- **Strokes**: `entities/Stroke.js` — ribbon colliders (one-way) along a polyline the player draws; duration by colour; `thick` on second pass; Mistral applies a downwind offset to wet strokes.
- **Complementaries**: `complements.js` checks adjacent painted tiles each frame paint changes; marks edges `vibrating`; vibrating edges add a launcher behaviour and a hum; a complement adjacent to a `hazard` kind sets it `dormant`.
- **Clock**: `flags.pt.hour` advanced by `strokes × rate`; drives sun angle (shadow skew + violet length), pigment availability, subject hours, and `MusicDirector` filters.
- **Palette-as-health**: `Player.health` replaced by `palette.wells[]` in this dream; hazard hits call `spillWell()`.
- **Canvas capture**: `scene.renderer.snapshotArea()` of the room at the easel → downscaled thumbnail saved in `flags.pt.canvases[]` (cap 12); used by Vautrin's scroll, the night sky halos, P6, and Isak's stacks.
- **Sky currents**: spline paths with a `flow` speed; entering a current sets `player.state = 'riding'` with velocity along the spline; jump exits.
- **Art lint** additions: `strokeRidge` check (every tile has ≥4 strokes with ridge pixels), `noBlack` (no pixel below value 10% that isn't the Prussian blue), `shadowHue` (shadow tiles in the violet band), `lightDarkRatio` per room versus §4, `haloRings` on every `light` object.
- Companion (Paul) reuses the Nia controller with `paints: true` and the `overpaint` scripted beat.

## 11. ACCEPTANCE
- A tester screenshots the café terrace without being asked.
- At least one tester runs the clock out in the fields and finishes a day in the dark, and reports it as beautiful rather than as a failure.
- The wind section is completed with zero paint and testers describe it as "grey" or "empty" — and the garden's first iris as a relief.
- Testers split on AGREE/DISAGREE and argue about which chair was better.
- The light:dark ratios in §4 pass the lint on every room's reference render, and no pixel in the level is black.
