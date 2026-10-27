# DREAMCATCHER — FINAL LEVEL SPEC: "THE LONG EVENING"

Follows Parts A, C, D and the three skills — and **breaks** several of them on purpose. Those breaks are listed in §10 so the project doesn't "fix" them. This is the last place in the game and the only fully beautiful one. Target playtime: **as long as the player wants** (12 minutes to see everything; some will stay an hour; the level never ends on its own).

---

## 1. What this level is

After The Counter, a door opens onto a small town at golden hour that never darkens. Jo arrives carrying nothing. There is **no objective, no HUD, no hearts, no coins, no timer, no enemies, no death, and no orb to catch**. The only verb is *help*, and even that is optional.

**The message, told in design rather than dialogue:** every dream level asked the player to *get through* people and places. This one asks them to *be with* them. Everything the game taught as a skill — running, timing, climbing, playing, carrying — comes back as a way to be useful to somebody. Nothing is scored. The satisfaction has to come from the act, or it doesn't come.

**The single design rule:** *nothing here is a task.* If it ever reads as a checklist, it has failed. Every "objective" is a person doing something ordinary who is happy to be joined and equally happy to be left alone.

---

## 2. The place

**Name:** the town has no name. The sign at the edge reads only **"you're here."**

**Shape:** a continuous horizontal world about **12 screens wide**, and at both ends it **wraps** — walk far enough east and you arrive back at the west edge, with the parallax quietly reseeding so it never feels like a loop and never feels like a wall. ("Infinite" in the pitch = wraps, plus procedural drift in the far layer, not endless generated content.) Three vertical layers: the **canal** below, the **street** level, and the **rooftops/hill** above.

**The light:** permanent low sun at about 8° above the horizon, behind and to the west, so everything is rim-lit and every shadow is long and blue. The sun **does not set** — but it *breathes*: a 4-minute cycle where the gold deepens and lifts by maybe 5%, enough that the player feels time passing without it going anywhere.

**Eleven places, west to east:**
1. **The Arch** — where Jo walks in. Behind him, a dark doorway; the moment he steps through it, it becomes a stone arch with ivy and stops being a door.
2. **The Orchard Slope** — long grass, three trees shedding leaves, a rope swing, a broken fence.
3. **The Laundry Lines** — courtyards between houses, sheets moving, a woman named **Fereshteh** hanging washing, cats asleep on warm stone.
4. **The Square** — a fountain that works, a chess table, a bench, a bakery with the door propped, a busker, an old dog.
5. **The Canal** — steps down to water, a moored boat, herons, kids skipping stones, a man fishing who catches nothing.
6. **The Steep Street** — stairs and railings climbing to the rooftops; a bicycle repair stall; a cart that is always about to roll.
7. **The Rooftops** — pigeon loft, water tanks, a kite, drying chillies, a man asleep on a charpoy.
8. **The School Yard** — after hours; a chalk hopscotch grid, a football, a swing, one kid waiting to be picked up.
9. **The Allotments** — vegetable plots, a greenhouse, bees, a scarecrow wearing someone's old coat.
10. **The Hill** — above the town, a single tree, a bench, the whole world visible below (vista: zoom 0.75).
11. **The Station That Isn't** — at the east edge, a platform with no rails and grass through the concrete, one bench, one departure board that reads only `— — —`. The wrap point.

Each place has its own ambience loop and at least one thing that only happens if you stay put: a heron takes off, a shutter opens, someone starts singing, a cat decides to follow you.

---

## 3. The people (and what they're doing)

Nobody has a quest marker. They have **activities**, and joining is an `E` when you're near. Every one of them is the emotional payoff of something earlier in the game.

| Who | Doing | You can | Echoes |
|---|---|---|---|
| **Fereshteh** | hanging washing in wind | hold the basket, hand her pegs, chase a sheet that escapes down the lane | the Chef's carry |
| **Bo** (busker, from the tutorial street) | playing badly, cheerfully | play with him — **free-form, no phrases, no score**; whatever you press sounds right | the Musician's Call & Response, released from judgment |
| **Adaeze** | skipping, slowly | skip beside her; the beat is easy and never speeds up | the Astronaut's ring |
| **Marcus** (if he left in the musician dream) | teaching his daughter to ride a bike | run alongside holding the seat, then let go | the drummer's reason |
| **The Fisherman** | catching nothing | sit; he offers a second rod; you also catch nothing; it's fine | — |
| **Two chess players** | mid-game, arguing | move a piece for the losing one; both laugh at your choice | the Counter's counting, refused |
| **The Baker** | closing up | carry the tray of unsold bread to the square and hand it out (NPCs take one each, one is left for you) | the Chef's service, inverted |
| **Kite Kid** (from the station) | trying to get a kite up | run the length of a rooftop with the string until it catches | the hub's Small Moment |
| **Bilal** | tea stall with no prices | drink tea; sit through it (10 s); he sits too | "keep the change" |
| **The Waiting Kid** | last one in the school yard | kick the ball with her until her mother comes | — |
| **Priya / Nia / Delphine / Ray / Marguerite / Bastien** (whoever the player met) | ordinary things — reading, tuning, watering plants, washing a step | one line each, no task | their dreams' worth |
| **The Sweeper** (from the station) | sweeping leaves that keep falling | sweep with him; the leaves never stop; he doesn't mind | the game's thesis, in one action |
| **The Old Dog** | asleep, then follows you | it follows you for as long as you like; it leaves when you sit on the Hill bench | — |

**The Counter's absence:** he is not here, and he is never mentioned. One detail only: on the fountain's rim, someone has scratched tally marks — and someone else has drawn a flower over them.

**Animals:** cats (7, each with a named routine — one follows Jo, one refuses to be touched, one sleeps through everything), dogs (3), pigeons, herons, bees, a goat on a roof nobody explains, moths near the lamps at the east end, and **leaves** — always falling, from off-screen, across every layer, at three different speeds.

---

## 4. What the player does

- **Walk.** Movement is unchanged mechanically but retuned: slightly slower top speed, longer idle fidgets, and Jo **looks at things** — his head turns toward whatever is nearest and interesting (a cat, a person, the sun) without the player doing anything.
- **Sit (Down, held, on any bench/step/ledge/grass).** Sitting is the most important verb in the level. When Jo sits: the camera drifts out 5%, the music thins to one instrument, the ambience comes forward, and after 8 s **something happens near him** from a per-location pool (the heron, the shutter, a cat arriving, someone starting to sing, a leaf landing on his hat). Sitting is never rewarded with an item. It is rewarded with an event.
- **Help (E).** 14 activities, each 10–40 s, each with a small success that is never announced — no panel, no sound cue, no counter. The person just says something short and goes on.
- **Play (the level tool comes back).** Jo still has the trumpet. Playing anywhere makes birds lift, cats look up, a window open, and somebody somewhere join in for a bar. There are no resonant puzzles. It just sounds nice.
- **Carry.** Anything carryable can be carried anywhere and put down anywhere; nothing needs to go anywhere. A player who carries a watering can for ten minutes has done nothing wrong.
- **Photograph (C).** From the moment Jo finds the camera on the Hill bench (§A4.1). No targets, no score.
- **Sit in a conversation.** Sitting near talking NPCs (§A3) makes them include Jo with a look and slows their exchange down.
- **Leave.** At the Station That Isn't, sitting on the bench for 20 s brings the ending (§7). It is the only way to end the game, it is never signposted, and the board still says `— — —` while you do it.

---

## 5. What is *not* here (and the game tells you, once)

On arrival, the HUD elements fade out one at a time over 6 s — hearts, coins, objective slot, meters — each with a soft sound, in the order they were introduced across the game. Nothing replaces them. That 6 seconds is the entire tutorial for this level.

No: enemies, hazards, fall damage (long drops end in a roll and a laugh), locked doors, gates, timers, puzzle-boxes, collectibles, difficulty scaling, or a pause-menu objective. The darkness shader that has been dimming the world since dream one is **removed here entirely, whatever `dreamsCaught` is** — this is the one place the tally doesn't reach.

---

## 6. Sound

- **Ambience first.** Every location's loop is a real soundscape (wind in the lines, water, distant kids, bicycle bell, bees, a radio two streets over playing something you can't quite hear).
- **Music is a small ensemble that wanders.** One stem at a time: solo piano, then muted trumpet, then upright bass, then nothing for a full minute, then a guitar. Stems change on **time**, not on location or action. The player is never told where the music comes from — except twice, when they turn a corner and it's Bo, who was playing it.
- **When Jo sits, the music steps down**; when he plays, whatever is playing **stays in key with him**.
- **The town has one shared melody** — the Orb theme from every dream ending — but nobody plays it whole. Bo has the first four notes. Adaeze hums the middle while skipping. A window radio has the end. The player who sits in three places has heard the whole thing without noticing.

---

## 7. The end of the evening (REVISED by Addendum B — this is now the *middle* of the level, not the end)

Sit on the bench at the Station That Isn't for 20 s. The board flickers once and, instead of a destination, shows a line of text in the `display` font: **`YOU'RE HERE`**.

Then, slowly, the people Jo helped walk past on their own business — not toward him, not looking, just going home along the platform: Fereshteh with an empty basket, the baker with an empty tray, Marcus's daughter riding ahead of him, the kid with her mother, the sweeper. Each takes two seconds. The dog trots after the last of them. The screen doesn't dim.

Then the text cards, in `body`, on the still-golden world (not on black):

> *"You caught [N] dreams."*
> *"You noticed [M] small things."*
> *"This one you didn't have to catch."*

And the last card, after a long pause:

> *"Stay as long as you like."*

The game **does not exit.** It returns control.

**Then the board flickers a second time** and shows one more line: **`THERE'S A ROAD`** — and the hedge at the end of the platform, which was always there, now has a gap in it. See Addendum B. The player can still ignore it and walk back into the town forever; the road waits.

---

## 8. Replayable variation (so "forever" means something)

- Each entry reseeds: which cats are where, which NPC is at which location, what the fisherman says, which stem starts, where the goat is, the pattern of falling leaves.
- Three **rare events**, each about a 1-in-6 chance per visit, never announced: a wedding party crossing the square; a sudden 60-second warm rain (everyone runs for cover, then comes back out, everything shines); a hot-air balloon crossing the sky so slowly that only a sitting player sees it arrive *and* leave.
- Every NPC has 3× more idle lines than the player will hear in one visit.

---

## 9. Small things to get right (the level lives or dies here)

- Leaves land **on** surfaces and stay for 20 s before fading.
- Cats respond to the player's stillness, not proximity: stand still 4 s and one comes to you.
- The fountain's water makes a different sound from three distances.
- Jo's shadow is long and it moves right when he does — the sun is a real light source in every scene.
- Sheets on the line have four states of wind and cast moving shadows on the wall behind.
- NPCs greet Jo by name from Phase 2 onward — **only** those who'd know it.
- The bakery smell is a visible shimmer, and cats drift toward it.
- If the player just stands still for 60 s anywhere, someone comes and stands next to them for a while. Nothing is said.

---

## 10. Deliberate rule breaks (do not "fix" these)

| Rule | Broken because |
|---|---|
| Part C §C7: ≥1 encounter every 2 screens | no enemies exist here |
| Part C §C9: every screen has a trap or foe | replaced by "every screen has something alive" |
| Collectibles skill: every screen has a pickup | replaced by "every screen has something to sit on" |
| Part A: HUD always present | HUD is removed in the first 6 s |
| Part A: difficulty scales with `dreamsCaught` | no difficulty; darkness shader disabled |
| Part D §D6: foes on the critical path | there is no critical path |

Lint gets a per-level exemption flag: `room.finale = true`.

---

## 11. Implementation notes (Part D stack)

- `src/data/evening/rooms.js`, `tiles.js`, `sprites.js`; `scenes/EveningScene.js`.
- **Wrap:** rooms 1 and 11 share an edge trigger that teleports Jo across with a 1-frame camera continuity trick and reseeds the far parallax layer's landmark set.
- **Sun:** a single `sunAngle` constant drives every shadow's skew and every rim-light offset; shadows are sprites, not shaders.
- **Leaves:** one pooled emitter per parallax layer (far/mid/near/fore), each with its own speed, plus a `settle` behavior that parents a leaf to a surface for 20 s.
- **Activities:** `src/systems/activities.js` — `{ id, npc, location, verb, duration, onJoin, onFinish(line), repeatable: true }`. All repeatable, none tracked, none saved. The only thing saved is `flags.evening.visited`.
- **Idle-watching:** `Player` gains a `look_at` behavior (head part variant toward the nearest `interesting` object within 6 tiles, 1-frame lag per the motion skill) and `sit` (8-frame sit-down, idle-sitting with breathing, 4-frame get-up).
- **Ambient director:** `src/systems/evening.js` runs the sit-event pool, the 60-s stand-still event, the rare events, and the 4-minute light breath.
- **Counts in the ending:** `dreamsCaught` and the total Small Moments across all levels, read from the save.

---

## 11b. Implementation — weather, horizon, talk, extras

- `src/systems/weather.js`: states `clear | wind | rain | snow`, a director with a ~20-min cycle; **first visit is scripted** clear → rain → clear → snow. Each state drives: emitter configs per parallax layer, ambience mix, music stem limit, NPC reaction table, palette shift, and a `surfaceAccumulation` buffer for snow (a per-tile float that a settle layer renders and that persists until the next `clear`).
- Rain puddles: pre-authored low spots per room; a puddle is a sprite plus a flipped, dimmed, wobbling `RenderTexture` copy of the room's near layer. Rain-on-material audio: four loops crossfaded by a raycast above Jo (`stone | tin | water | cloth`).
- `src/systems/horizon.js`: four bands with parallax 0.05 / 0.10 / 0.18 / 0.25; `windowLighter` lights background windows on a Poisson timer over ten minutes, 10 of them getting a 2-frame silhouette loop; mountains take snow 30 s before the town does.
- `src/systems/talk.js`: NPC pairs within 4 tiles for 8 s start a conversation from a pooled script set (`src/data/evening/talk.js`), 2–5 exchanges, `body` speech bubbles, laugh = animation + per-character synth laugh. Roast lines are gated on `flags.dreams.*` so only cast the player actually met can reference it. Group scenes are location-scripted with 3–6 slots filled by whoever is present.
- Jo's responses: `shrug / grin / eye_roll / toot` animations chosen by a small reaction table — he never has dialogue options.
- Camera: `src/systems/album.js`, photos as `RenderTexture` snapshots downscaled and saved to localStorage (cap 40, FIFO); pause-menu album; three random photos render behind the ending text.
- Dinner cycle: at ~20 min of play, `evening.js` sends NPCs to door markers one at a time with an exit line; 10 min later they return. The town must look composed and beautiful with zero NPCs on screen — check every room empty.
- Dropped trumpet: a persistent world object; a kid NPC has a `pickup_if_left` behavior after 3 min; `flags.evening.trumpet_left` changes one word on the last ending card.
- Map: a `crayon` art layer per location, revealed on first visit, drawn deliberately wrong (wobbly lines, wrong proportions) in the `body` handwriting variant.
- Kindness memory: `evening.kindness[]` records item-drops near NPCs within a visit; a matching NPC picks the item up 2–5 min later and uses it in an idle. Never saved, never mentioned.

---

## 12. Acceptance

- A tester left alone with no instructions **sits down** within 3 minutes without being told the button exists (if not, the sitting affordance isn't readable — put more benches in sightlines and have an NPC sit first).
- A tester stays after the credits-text appears.
- No tester describes anything here as a "task," "mission," or "objective" when recounting it.
- Someone cries. That's the bar.
- A tester sees both rain and snow on their first visit without being told weather exists.
- A tester repeats one of the roast lines back to you afterward, laughing.
- A tester's photo album is full of cats. (This is the correct outcome.)

---

# ADDENDUM A — WEATHER, HORIZON, AND TALK

## A1. The horizon (three things behind everything)

The far layer is built in **four bands**, all at parallax ≤ 0.25, and it is the reason this place feels bigger than every other level:

1. **Band 4 (0.05) — the sea.** A calm sea filling the lower third of the sky-line to the west, catching the sun in a long gold road that shifts with the light-breath cycle. Three sails, none of them moving fast. At the far west end of the town the streets *reach* it: the canal's last steps go down to actual sand, and a player can stand in the shallows (ankle-deep, footprint splashes, no drowning, no danger — this is the one water in the game that can't hurt you).
2. **Band 3 (0.10) — the mountains.** Behind and east: a ridge line in four receding blues, the nearest with visible snow on top and pine texture, the farthest almost the color of the sky. When it snows in the town (§A2), the peaks whiten first, half a minute ahead — the weather arrives from up there and you can watch it coming.
3. **Band 2 (0.18) — the town itself, seen from inside.** Layered rooftops climbing the hill: tiled roofs, chimneys with smoke, water tanks, satellite dishes, hanging laundry, minaret/steeple/clocktower silhouettes, and **windows that light up one by one** over the first ten minutes of a visit — never all of them, and never in a pattern. Each lit window has a tiny warm rectangle and, in about ten of them, a 2-frame silhouette doing something: cooking, hugging someone, reading, dancing badly.
4. **Band 1 (0.25) — near buildings.** Full-detail facades with balconies, shutters, awnings, painted signs, cracked plaster, ivy, wires strung between them, and pigeons on every ledge. Balconies are **occupied**: people lean on them, water plants, call down to the street, pull in washing when it rains.

Rule: from any spot in the town, at least two of the four bands are visible. From the Hill, all four at once — that's the shot the whole level is built toward.

## A2. Weather (four states, cycling)

Weather is **not** a rare event. A weather director runs a slow cycle over ~20 minutes of play, and the first visit is scripted: **clear → rain → clear → snow**, so every player sees both before they leave.

**Clear (default).** Leaves falling, warm gold, long shadows, dust in the light shafts.

**Rain (60–90 s, warm, gorgeous).**
- Arrives: the sea goes matte, the mountains blur, wind picks up the laundry, a shutter bangs, then the first fat drops make individual splash sprites on stone.
- Three rain layers at different speeds; drops land and *splash*, roofs drip at their edges, gutters run, the canal gets rings, puddles grow in the same low spots every time and **reflect** the buildings and the sun (a flipped, dimmed, wobbling copy — the single most beautiful thing on screen).
- People react: the baker pulls his tray in, cats bolt for the arch, the chess players stay and play on under an umbrella, the fisherman doesn't move at all, Fereshteh runs for the sheets — **and this is the best help in the level**: grab sheets off the line with her, one armful each, both laughing. Kids stay out and stamp in puddles.
- Jo gets wet: darker palette variant, dripping hat, a shake-off animation. Standing under an awning with an NPC is its own moment — they shuffle over to make room, neither says anything for a while.
- Sound: rain on stone, on tin, on water, on cloth — four different loops that mix by what's above Jo. Music drops to piano only. **The rain stops mid-bar**, and for five seconds there is no sound but dripping.
- After: steam off warm stone, everything saturated 15% higher, doubled rainbow over the sea if you're on the Hill, everyone comes back out, somebody starts singing.

**Snow (90–120 s, late in a visit, the quiet one).**
- Mountains whiten first. Then the light goes from gold to a pale rose; the wind stops completely.
- Big slow flakes at four depths, some drifting *upward* briefly in eddies. Flakes **settle**: a white accumulation layer builds on every upward-facing surface over ~90 s (roofs, railings, the bench, the swing, the scarecrow's hat, Jo's own hat and shoulders), and it stays until the next clear.
- Footprints in it. Snow slides off a roof with a soft thump if you play a note near it. Cats leave tiny prints and hate it. The dog loses his mind with joy.
- Sound: near-total silence — snow eats the ambience. The only audio is Jo's footsteps crunching and, from a long way off, a single bell.
- The kids build a snowman; help by carrying the head. It's lopsided. Nobody fixes it.
- **Snow ends by simply stopping**, and the last flake is allowed to fall alone for a full three seconds.

**Wind (between states, 20–30 s).** Nothing falls but everything moves: laundry horizontal, leaves in spirals, the kite finally flying properly, hair and coats, a door banging somewhere, the awnings snapping. Free, and it makes the town feel alive between the big events.

## A3. Talk — the town has to sound like people who like each other

The dreams were full of people who wanted something from Jo. Here, nobody does. What's left is **banter**, and that's the warmth.

**Three systems:**

**1. Overheard conversation (the main one).** NPCs talk *to each other*, not to the player. Any two NPCs within 4 tiles for more than 8 seconds start a conversation from a shared pool — speech bubbles above their heads with `body` text, 2–5 exchanges, with **laughs**: a laugh is not text, it's an animation (head back, shoulders) plus a synth laugh sample per character. Jo can stand there and listen; if he does, one of them eventually turns and includes him with a look. Conversations continue whether he's there or not. The pool is big — teasing about the chess game ("you've moved that bishop four times"), roasting the baker's bread, gentle mockery of Bo's playing, someone's nephew, the weather, the goat.

**2. Roasting Jo (affectionate, and *earned*).** Every returning cast member has 2–4 lines that only make sense because of what they went through with him in a dream — this is the payoff for the whole game:
- Adaeze: "Three rounds. *Three.* And you told everyone it was five."
- Nia: "Rushing the third bar again. In *retirement*."
- Marguerite: "He plated a soufflé with a gloved hand. I still think about it."
- Priya: "Twelve months he made me wait. Twelve."
- Bo: "You got famous and I *still* have the better hat."
- Ray: — says nothing, and just smiles at whatever roast lands. That's his whole bit.
- Delphine (to anyone): "He asked me if nine people was good." (Everyone laughs. Jo laughs.)

Jo **laughs back** — he has a laugh animation and he uses it. He has no dialogue options; his responses are shrugs, grins, an eye-roll, a two-note toot on the trumpet that always gets a groan.

**3. Group scenes (the set pieces of the level).** Four places where 3–6 NPCs are together and the talk runs longer, and joining means just sitting down in it:
- **The bakery step at dusk** — five people, bread, a story someone tells wrong and three people correct.
- **The chess table** — permanent argument, rotating audience, never finishes.
- **The rooftop after rain** — everyone comes up to look at the rainbow; someone brings tea; someone's phone-equivalent (a radio) plays; someone dances badly and is roasted for it.
- **The snowman** — the whole cast drifts in for this one, including people who don't otherwise meet.

**Rules for the writing:** short lines, overlapping, unfinished sentences, callbacks to earlier lines in the same visit, no exposition, nobody explains the theme, and **nobody thanks Jo for anything he did in a dream**. The closest anyone comes is a hand on the shoulder.

## A4. Extra features — ALL OF THESE ARE IN. Build them.

### A4.1 The camera
Jo finds a small camera on the Hill bench. Pressing a key takes a photo — the screen flashes, the shot is saved to an album in the pause menu, and that's it. No objectives, no photo targets, no score. Players will fill it with cats. On the ending screen, three of their own photos appear behind the text.

### A4.2 Everyone's dinner
Around the twentieth minute, windows light, smells rise, and NPCs slowly go inside — one by one, each saying something ordinary on the way. The streets empty. The town is *still beautiful* empty, and the player is allowed to feel that. Ten minutes later they all come back out. Nobody comments.

### A4.3 The instrument goes down
If Jo sets his trumpet on a bench and walks away, it stays there. Anyone can pick it up — a kid does, eventually, and plays it terribly. Jo can take it back whenever, or never. (Leaving it behind when you sit at the station changes one word on the last card.)

### A4.4 The map is a child's drawing
The pause menu map is a child's crayon drawing of the town, taped up, with the places labelled in wobbly handwriting, and it gets **more detail added** the more places you visit — because the kid keeps drawing.

### A4.5 Skimming stones
A mini-action at the canal: timing-based, 1–7 skips, and the kid you're with is better than you and doesn't let it go.

### A4.6 The sea
Take your shoes off (an actual animation). Stand in the shallows. That's the whole feature.

### A4.7 Napping
Sit on the Hill bench for 90 seconds and Jo falls asleep. The screen goes soft and gold, the sound goes underwater, and a few seconds later he wakes with a leaf (or snow) on his hat and a cat asleep next to him.

### A4.8 The town remembers kindnesses
A post box in the square. Nothing to post. But if the player carries the baker's spare loaf, the kid's ball, anything at all, and drops it near someone who needs it, the town notices — an NPC picks it up and uses it later in the visit. The world remembers small kindnesses within a single visit, silently.

---

# ADDENDUM B — THE ROAD, THE NIGHT, AND THE TWO WHO COME WITH HIM

Evening was the town. **Night is the walk out of it.** The road east is the last twenty minutes of Dreamcatcher, and it is where the game stops arguing and just shows you the sky.

The rule of this half: **distance is time.** Every screen east is a few minutes later in the evening. The player doesn't wait for night — they *walk into it*. Nothing chases them, nothing is timed, and they can turn back at any point (walking west runs the sky backwards, which is its own small wonder).

## B1. Structure — eleven more screens, west to east

| # | Place | Light | What's there |
|---|---|---|---|
| 12 | **The Gap in the Hedge** | low gold | a lane between two walls, last streetlamp, moths, a hand-painted sign: *"the long way home"* |
| 13 | **The Orchard Road** | gold going amber | apple trees, a wall to walk on top of, a cart with no horse, the last houses behind |
| 14 | **The Fields** | amber, first pink in the east | wheat to the horizon, a scarecrow, swallows, a tractor asleep, the town now small behind you |
| 15 | **The Lake** | pink and violet, sun finally touching the water | a jetty, a rowboat, still water that mirrors the whole sky, frogs starting up |
| 16 | **The First Stars** | violet, sun gone, afterglow on the ridge | a stone bridge, a mill, fireflies, **the first star appears here and the player will notice** |
| 17 | **The Foothills** | deep blue, horizon still warm | a shepherd's path, sheep bells, a fire someone left, pines starting |
| 18 | **The Pine Road** | blue-black, stars filling in | pines both sides, snow in patches, an owl, breath visible |
| 19 | **The Frozen Stream** | night, moonlight | crescent moon rises here, ice, the stream sounds under it, deer that watch and don't run |
| 20 | **The Switchbacks** | night, blue snow | climbing, the world opening below, the town a handful of orange dots, wind |
| 21 | **The Treeline** | night, **aurora begins** | last trees, a cairn, the sky starts to move for the first time |
| 22 | **The Ridge** | full night, full aurora | a flat shoulder of rock, one bench, everything visible, the end |

No wrap out here. The road has an end, and the end is the point.

## B2. The sky (the real protagonist of the second half)

Built as its own system, drawn above every parallax band, and it must be the best-looking thing in the game by a distance.

- **Sunset stages.** Eight authored gradients (gold → amber → coral → rose → violet → indigo → navy → black-blue), crossfading by the player's x-position with a 20-second lag so the sky is always slightly *behind* the walk. Clouds catch the light from underneath and go from white to gold to pink to grey to invisible.
- **Stars.** They arrive in the right order — one, then three, then a dozen, then hundreds, then the **Milky Way** as a soft band across the whole sky by screen 20. Three brightnesses, gentle twinkle, and real constellation shapes placed by hand (not random noise) so returning players recognise them. Two or three **satellites** crossing steadily. A **shooting star** every 40–90 seconds; if Jo is sitting when one goes, he looks up.
- **The crescent moon.** Rises at screen 19, thin, tilted, with **earthshine** — the dark part faintly visible. It casts a real second light: blue rim-light on everything, and a moon-path on the lake and the ice.
- **The aurora (screens 21–22).** Curtains of green with violet and rose at the edges, drawn as 5–7 vertical ribbons that ripple on independent sine waves, brightening and fading over 30–60 second swells with occasional fast "flare" moments where a curtain snaps and races across the sky. It **lights the snow** — the ground under it shifts green and violet, and Jo's shadow is coloured. It reflects in the frozen stream and in the lake if you go back down. It is never the same twice.
- **Sound of the sky:** none. The aurora is silent and that silence is the design.

## B3. The two who come with him

**Nobody appears from nowhere.** Both companions are earned in the evening half, and both join at the gap in the hedge.

**The dog** — the old dog from the square. He's been following Jo since the player first let him. At the hedge, Jo stops, and the dog looks at him, and Jo goes on, and the dog comes. (This replaces the earlier beat where the dog left at the Hill bench — **he stays now**.) He runs ahead and comes back, the whole road. He drinks at the stream. He rolls in the snow. He sits when Jo sits, leaning on his leg.

**Her.** She is a person from the town — not a stranger, not a prize, and **not named in this spec** because the cast is being renamed (put her name in `src/data/evening/cast.js`). She's been in the evening the whole time: the one at the chess table who kept losing on purpose, or the one who was up on the roof for the rainbow, or the one who handed Jo the tea. The player will have talked to her without knowing.

How it happens: at the gap in the hedge, she's already there, sitting on the wall, coat on, as if she'd assumed he was coming. One line — something dry, not romantic, in keeping with the roasting of §A3. Then she gets down off the wall and walks with him. **That's the whole event.** No cutscene, no confession, no kiss, no swelling music.

What she does on the road:
- Walks beside Jo at his speed, falls behind on climbs and catches up, goes ahead on the flat.
- **Talks.** Not quest dialogue — the conversation of a long walk: about nothing, in fragments, with gaps of comfortable silence that last minutes. She teases him about the dreams (the roast lines, gated on what he actually did). She points things out: the first star, the owl, the moon, the deer, *"look"* for the aurora. She's wrong about a constellation and won't be corrected.
- **Holds his hand** if the player walks into her (a gentle collision) — a small animation where their sprites' hands join and the walk cycles sync. Press the direction away and they let go, no fuss. This is the entire romance mechanic and it should be the single most understated thing in the game.
- Sits when he sits. On the bench at the end, she leans on his shoulder. The dog puts his head on their feet.
- **She can be left behind.** If the player runs ahead, she doesn't teleport — she jogs, calls out, and catches up eventually, slightly out of breath, and says something about it. If the player goes back to the town, she comes too.

**If the player wants to walk alone:** at the hedge, walking past her without stopping means she stays on the wall and says "…suit yourself" with a smile, and the whole road is solo. The ending still works, and its last card is different. Nobody is punished for it — but the world is quieter.

## B4. What you can do on the road

Fewer verbs than the town, and deliberately so. **Walk, sit, look up, play, hold hands, throw a stick for the dog.**
- **Look up (hold Up).** New verb, and the best one. The camera tilts up, the ground leaves the frame, the music thins to almost nothing, and Jo just stands there with the sky. Holding it for 15 s at the ridge is what the whole game was built for.
- **Skimming stones at the lake**, on still violet water, with her betting she can beat you. She can.
- **The rowboat** — you can push off and drift. No destination. The sky is in the water; the boat turns slowly.
- **Fireflies** at screen 16 — they gather if Jo stands still and scatter if he plays.
- **The fire** at the foothills — sit at it, and it's warm, and neither of them says anything for a while.
- **Snowball**, once, at screen 18. She starts it. She wins.
- **The camera** (§A4.1) still works; every photo out here is a good one.

## B5. Sound on the road

- Music thins as the light does: piano in the orchard, bass alone by the lake, one held trumpet note at the first star, then **nothing from screen 18 to the ridge except footsteps, wind, bells, breath and the dog.**
- At the treeline, as the aurora starts, the full band from the game's beginning comes back — but slow, quiet, unhurried, the theme the whole town had in pieces (§6), finally whole, played like nobody's performing it.
- Her footsteps are a second footstep sound, slightly out of phase, and it is the most comforting audio in the game.

## B6. The ending, on the ridge

The bench on the ridge. Sit. (No prompt. There is only one bench and twenty minutes of walking behind it.)

The camera pulls back and up, slowly, for a long time: the two of them and a dog, small, on a rock, under an aurora, with the town a handful of orange lights an entire world below.

Then, in `body`, on the sky — never on black:

> *"You caught [N] dreams."*
> *"You noticed [M] small things."*
> *"You walked [D] kilometres tonight."*

*long pause*

> *"Nobody was watching."*
> *"It counted anyway."*

Then three of the player's own photographs (§A4.1) fade in and out over the aurora.

Then the logo, small, at the bottom. **The sky keeps moving under the credits, and the credits are slow.**

After the credits: control returns, on the ridge, with her and the dog and the aurora, and no text at all. The player can sit back down. Whenever they quit, the save records only: `finished: true`.

**Last-card variants:** walked alone → *"You walked it alone. It still counted."* · left the trumpet in the town (§A4.3) → *"You left the horn on a bench. Somebody's playing it."* · every hub and dream Small Moment found → one extra card, first: *"You were paying attention the whole time."*

## B7. Implementation (Part D stack)

- `src/data/evening/road.js` — screens 12–22; `src/systems/sky.js` — a single `skyPhase` float driven by `max(playerProgressEast, timeInLevel)` (so a player who turns back doesn't rewind the *stars*, only the gradient); drives gradient crossfade, star count, moon rise, aurora amplitude, and the ambient light colour used by every shadow and rim-light.
- **Aurora:** 5–7 ribbon meshes (or tiled sprite strips with per-column vertical offsets) driven by summed sines with independent phase, plus a `flare` event; additive blend; a ground-tint sampler feeds the level's ambient colour so the snow actually changes hue. No shaders required — sprite strips with alpha ramps are enough and stay in the pixel-art register.
- **Companion:** reuse the Nia/Priya companion controller with `mode: 'walk'` — no puzzles, no call button; behaviours `follow_abreast | ahead | behind | catch_up | hold_hand | sit | point_at(target)`. `holdHand` syncs both walk cycles' frame index. Her dialogue is an **ambient line pool** on a distance-and-silence timer, not a dialogue box — floating `body` text, no panel, no pause.
- **Look up:** camera tilt + `Player.look_up` pose + a music duck; a held-input state, not a cutscene.
- Distance walked is tracked from level entry for the ending card.
- The town half (§1–§11) is unchanged; the road is a separate room set that shares the scene, the weather director (rain and snow both work out here — **snow on the switchbacks under the aurora is the shot of the game**), and the talk system.

## B8. Acceptance

- A tester holds Up at the ridge without being told the verb exists.
- A tester takes a photo of the aurora unprompted.
- No tester describes her as a "reward."
- The stretch from screen 18 to 22 has no music, no dialogue, and no mechanics, and no tester calls it boring.
