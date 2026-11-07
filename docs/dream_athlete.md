# THE FINISH LINE (athlete dream, platform 3)

Design doc by a pro-gamer / senior designer advisor. Docs only: nothing was built or run. All names, clubs, towns, parks and events are invented. The shape (a mill girl, a city favourite, a photograph that decides) is a common sports story; no athlete, team, meeting or record comes from the real world.

Read with: `docs/redesign/FRAMEWORK.md`, `docs/redesign/ROADMAP.md` (the bar), `docs/redesign/advice/fresh_review_design.md` (the no-timing-bar rule), `docs/dream_racer.md` (what this must not overlap), `src/dreams/gambler/` and `src/dreams/clockmaker/` (code pattern).

## 0. The one-page version

- **Who.** Tove Ardal, 71, groundskeeper of Brindle Park. In 1953 she was 20, a rope-works hand who ran 400 m, and she came second in the Games final by the width of a photograph.
- **Where and when.** Vennholm, an invented mill-and-quarry town, October 1953. Cinder track, leather spikes, hand-held stopwatches, a starter's pistol, the first photo-finish camera in the county.
- **The verb: PACE.** Jo's own legs are the mechanic. Three gears (WALK, RUN, KICK), one lung bar (WIND), and the ground decides what each gear costs: hills, belts, wind and 11-tile gaps. No marker, no zone, no press-on-cue. You plan a route through your own breath. It is a platformer verb: it changes what Jo's jump can cross and what a hill costs.
- **The arc.** Training (ropewalk, quarry), the cost (a friend covers your shift; a sore shin), the night before, the heat, the final. The best honest run is second by a photograph. You may win, by running the last 40 m on a leg that will break. Either way the dream is caught by something small: holding the tape up for the last girl in.
- **Length.** About 9 minutes first play, 6 on a clean replay.

## 1. Premise and the dreamer

**Tove Ardal**, 71, rakes and rolls the cinder at Brindle Park and has done for forty-six years. She knows every runner's name from the Wednesday club runs. People ask her, kindly, about 1953; she says "I was second" and rakes. She has never told anyone she did the sum: if she had risked the leg, she would have won.

**Why this is her dream.** Her whole working life has been spent keeping the place where she lost fair for people who will mostly lose too. The dream asks what she thought "nobody remembers second" meant, and whether she was right.

**Jo's role.** Jo is the legs. Tove's voice is at the rail at the edge of every place, an old woman with a rake, a cardigan and a stopwatch she does not click. "I can't run it any more, so you do. Don't be me. Or do. I want to see."

**Not the racer.** The racer dream is a vehicle on a depth-lane road with drafting, a slingshot and rivals who block. Here: no vehicle, no lanes, no draft, no blocking, no collisions with other runners (they are drawn in the next lanes and pass through nothing; the contest is a clock and a schedule). Only two of six areas are races. The rest are the same body in different ground.

**Not "press in the zone".** There is no bar, no marker, no cursor, and no key that is judged against a moving target. Every input is held (a gear) or is the existing jump/crouch. The nearest thing to a timing input is the start (section 4.7), and that is waiting for a sound, not hitting a window.

## 2. Era and place

**Vennholm, on the river Varn, October 1953.** Rationing has just ended, so there are sweets in jars again. A cordage works (Sunder & Co.), a slate-and-granite quarry above the town, a tramway, a cinder track in Brindle Park beside the gasworks. Brick, soot, slate roofs, enamel signs, a brass band in the park, women in headscarves and men in flat caps. Colour: tar black, rope hemp tan, quarry grey, a brick-red, chalk white, one sharp club-green (the city club).

**The athletics.** Cinder track, 400 m lap, lime-marked lanes. Women's athletics is amateur and under-funded: Tove trains on the ropewalk (a long shed where ropes are laid), the quarry steps and the tram road. Runners wear cotton vests, wool shorts and plimsolls or leather spikes. Times are taken by three stopwatch holders (they disagree by a tenth), with the new **Eye**, a slit-scan photo-finish camera borrowed from the city, set up at the line for the first time. The county has never used it. It is the machine that makes "second" official.

**World of its own.** Rope walkers who walk backwards paying out yarn, line-shafting and belts, a quarry cart on rails, a gas-lit dressing shed with a tin bath, Pim's father's tin whistle. No neon, no phones.

## 3. Story arc

| # | Beat | What happens | Where |
|---|---|---|---|
| 1 | Hope | Anders Kell, ropewalk foreman and the club's one coach, clocks Tove running the shed at dawn. "Twenty-six seconds, door to door. Do it again and I'll put your name down." | Ropewalk |
| 2 | Work | The quarry steps. Anders's idea of training: the rim run, the scree chute. Tove's shin starts to talk on the way down. | Quarry |
| 3 | Cost, other people | A Saturday shift is in the way of the last training day. Lena Ostrom, who sits at the next loom, offers to cover it and punch Tove in. If the gaffer finds out, it is Lena's place, not hers. | Loom floor |
| 4 | Cost, the body | The night before. Dr Hale looks at the shin. Gitta Sallow, the city favourite, is polite at the sink. Pim Rudd, 14, who has no spikes, asks to borrow Tove's laces. | Dressing shed |
| 5 | Proof | The heat. The field goes out too fast and dies. Tove does not follow. | Brindle Park |
| 6 | The photograph | The final. Gitta runs the race she has run since fifteen. The honest best Tove can do is a photograph. | Brindle Park |
| 7 | The small moment | The crowd turns to the podium. Pim is still running, 70 m back, alone, to a line where the tape has been dropped. | Brindle Park, dusk |

**Handling with care.** Nobody is a villain. Gitta is frightened of losing; Anders loves the sport and cannot see the child in it; the gaffer is never seen. Lena's cost is told, not shown. The shin is a fact, not a punishment.

## 4. The core verb: PACE

### 4.1 Rules in plain words

- Jo has three gears. **WALK** (hold Shift, the game's existing walk, 80 px/s). **RUN** (default, 280 px/s, which is 6.4 m/s: an honest 400 m pace, so no dream re-tuning). **KICK** (hold Q, 340 px/s, 7.7 m/s).
- One bar: **WIND**, 0 to 100, drawn as two small lungs plus a number-free bar under the hearts. Breath puffs on Jo's sprite show it too (more and bigger when low).
- The ground sets the price. Flat RUN is free in training rooms (a small cost on the track, see 4.4). Uphill RUN costs. KICK always costs. WALK and standing give wind back.
- At 0 Wind Jo has **dead legs**: every gear is 62 percent (RUN 174 px/s) and KICK is off, until Wind comes back to 30. It is slow, never a stop, never a death.
- KICK is the only thing that crosses a **kick gap** (11 tiles wide, ground to ground, same height). At RUN, Jo's longest jump is about 9.6 tiles including coyote; at KICK it is about 12 tiles. Kick gaps are 11 tiles. The landing lip is the same height as the takeoff lip, never higher.
- Air speed equals takeoff speed (the Player already holds x speed in the air). KICK must be on before the jump, not only in the air. Starting KICK at the takeoff tile and jumping at once does not work: the gap is crossed only if KICK was held for the last 0.25 s before takeoff. (A body rule: you need a run-up. The pure engine enforces it with `kickBuilt`.)
- A **clip**: tipping reels, trip yarn and a dog are soft hazards. A clip is a stumble: speed x0.4 for 0.5 s, back to full over 0.7 s, Wind -10. No heart.
- Real hazards (a cart, a loom beam, a fall of scree) cost a heart and use the framework's knockback. These are rare.

### 4.2 Numbers (the starting table; all in `src/dreams/athlete/tuning.js`)

| Name | Value | Notes |
|---|---|---|
| WIND_MAX | 100 | -6 if the Loom shift was worked, -0 to -16 from the shin (section 4.8) in the final only |
| GEAR_WALK / RUN / KICK | 80 / 280 / 340 px/s | WALK is Player's existing `WALK_SPEED` |
| DEAD_MULT | 0.62 | applies to all gears |
| DEAD_EXIT | 30 (+2 per difficulty) | |
| RUN_FLAT_COST | 0 in training rooms; 0.4 per s on the track | the track is "race pace" |
| UPHILL_COST | 18 x grade per s, grade = rise/run, so a 1:1 stair is 18/s | x(1 + 0.05 d) |
| HEADWIND_COST | +0.5 per s (track back straight, 100-260 m) | |
| KICK_COST | 20 + 2d per s, on top of the above | |
| WALK_REGEN | 12 - 0.4d per s | |
| STAND_REGEN | 18 - 0.6d per s | |
| DOWNHILL_REGEN | 5 x grade per s while running | the only free recovery while moving |
| TROUGH | +30 per s standing next to a water trough | 2 s to refill a gap's worth; troughs are the designed rests |
| KICK_BUILD | 0.25 s | required for kick-gap jumps |
| STUMBLE | x0.4 for 0.5 s, then 0.7 s ramp; Wind -10 | |

A kick gap costs about 26 Wind (0.25 s build + 1.0 s air at 22/s). Four in a row would empty the bar, so designed chains have two to three gaps and a trough in between.

### 4.3 What makes it skilful (and readable)

- **Route economy.** The designed rooms offer a cheap, long way and a dear, short way. Every dear way is a plan: where to spend, where to rest.
- **The run-up.** Starting the KICK early enough, and landing on the far lip with Wind left to keep going. An 11-tile gap has 36 px of margin at KICK; a mistimed or late-started KICK drops Jo in the pit (a ladder, 3 s).
- **Reading the ground cost.** Slope steepness is shown by the chalk grade marks on the wall, and by the colour of the lung gauge dipping in real time. A good player drops to WALK on a landing before a flight of steps, not after.
- **Never starting on the line.** In the races the field's schedule is public and the same every time. It is a plan, not a reflex.
- **Floor time.** A dead-legs player is still moving. Skill is knowing the price, not surviving a bar.
- **Feel.** Each gear has its own body: WALK a heel-first stroll; RUN the existing cycle; KICK a forward lean (pose `kick`, built on the run cycle), longer stride, arms driving, cinder spray from the heel. Camera look-ahead rises with the gear (72 / 100 / 140 px) and the zoom pulls to 0.96 at KICK on the track. Footsteps follow distance. Breath is a filtered-noise loop whose rate rises as Wind falls. Landing a kick gap gives a small camera dip (2 px) and a boot-thud.

### 4.4 Why not a slingshot (racer) and not a bar (timing dreams)

- The racer's slingshot is a one-key burst filled by being behind another car. KICK is held, paid in lungs, and only matters because the ground makes it matter (kick gaps, hills, belts).
- Painter, writer, clockmaker, musician: a marker crosses a zone and you press. Here nothing is judged on its position in time. You hold what the ground asks for.
- Gambler: a slate and tilt are about money. Wind is about your body and has no stake.

### 4.5 Skill check against others in the game

No other dream has: a movement economy over terrain, walk-run-kick gears, a jump length that depends on a held key, and a resource that is refilled by standing still. Jo's existing jump, coyote, buffer, ladders and wall-jump all still work and are part of the routes.

### 4.6 Module split

`verbs/pace.js` reads input and ground slope, calls `engines/pace.js` for the numbers, sets `player.speed` each frame, forces the gear's pose and forwards `windChanged` and `gearChanged` to the HUD and audio. All maths is in the engine and is tested in Node.

### 4.7 The start (races only)

Mr Quill, the starter, calls three things in order, as in 1953: "On your marks" (Jo crouches: hold Down on the line, and the camera lowers a notch), "Set" (hold; Quill raises the pistol arm), then the pistol. The wait between Set and the pistol is 1.0 to 2.4 s, drawn from a seed per attempt, so a retry is not a memorised tape. Leaving the line before the pistol is a **false start**: Quill recalls, the field is brought back, and the crowd groans once; no penalty except 6 s. After the pistol, standing up and running gives a reaction time: 0.12 s ideal to 0.4 s slow, which is cosmetic (the clock counts it), so "waiting for a sound" is the entire skill. It is not a window; there is nothing to aim at.

### 4.8 The shin (the cost mechanic)

- **Extra reps.** Six hard-route clusters in the training rooms (ropewalk rafters 1, quarry 3, loom 2) are each an "extra rep": the player chooses them for the medal chips. `ache = 0 if reps <= 2, 1 if reps 3-4, 2 if reps >= 5`.
- **The doctor (Dr Hale, dressing shed).** Three answers: **REST IT** (ache -1, floor 0; the leg bar is visible in the final; the heat starts cold: first 3 s at x0.9); **STRAP IT** (ache unchanged, red lasts 1.0 s longer, but the leg bar is hidden: you must remember the number); **SAY NOTHING** (baseline).
- **The red gear (final only, last 100 m).** From 300 m, with Q held and Wind at 0 or not, holding Q + Down for 0.3 s releases RED (365 px/s, 8.3 m/s). It lasts `RED_SEC = 5.5 / 4.0 / 2.6` s for ache 0 / 1 / 2 (+1.0 strapped). When the leg timer ends, the leg cracks: Jo falls and hobbles (x0.25) to the tape, which loses the race if the tape is not yet reached. At the tape the leg always goes afterward: a collapse, never a death.
- **No hint says "go".** The tape distance boards at 50, 30 and 20 m, the leg bar (if visible) and Tove's lines are the only information.

## 5. The areas

All rooms are 20 rows tall at 32 px/tile with ground at row 16 unless noted; 1 tile = 0.73 m; Jo is 82 px (2.5 tiles) tall. Headroom 3 tiles. All art is painted in code. Each place opens with the split-flap arrival card (goal in 64 characters or fewer) before anything moves.

### 5.1 THE ROPEWALK (interior, dawn)

- **Card.** "RUN THE ROPEWALK. Door to door. Chalk time: 26 seconds."
- **Teaching beat.** First tutorial card: "RUN. The shed is long. Hold Shift to walk and get your wind back." The chalk board by the door lists the three gears. Then the shed teaches them in order: hop a reel, KICK a pit, WALK at the trough.
- **Layout.** 170 tiles wide (124 m; the real ropewalks are three times longer: the far door is open on grey daylight). Long panelled shed, windows high in the walls, ropes in laid-out lines stretching along the floor in the background, yarn bobbins, tarred spars.
  - x 0-14: the start, Anders and the chalk board; a lamp (checkpoint).
  - x 14-58: flat run. Tipping reels at x 26, 38, 49, 58 (1 tile tall). Hit one: stumble. The first has a chalk "HOP".
  - x 58-84: the **winding pit**, 11 tiles wide at x 70-80, 2 tiles deep, with a ladder out. A chalk sign "KICK (Q)". 20 tiles of clear run-up. Anders: "Hold it before the edge."
  - x 84-120: **walkers**. Three ropemakers walking backwards paying out yarn along the floor, in a line with taut trip yarn at ankle height between them. Their gait is a slow, backward shuffle with arms out; they turn at the ends. Jump the yarn (clip = stumble) or time the gap.
  - x 120-128: **trough** (a tin water trough and a stool): Tove is here with a cup; stand to refill.
  - x 128-150: two kick pits (11 tiles each) 8 tiles apart. 52 Wind. Not doable without having stood at the trough.
  - x 150-170: flat run to the far door and a gate that opens on the card. Gate sign: "OPENS WHEN YOU REACH THE DOOR" (it is open on arrival; no time gate).
- **Hard route (extra rep, 4 chips).** Up a tarred spar at x 30 to the rafters; a run along the one-way beams over reels and pit one (x 30-90), dropping at x 96. No Wind cost, but 4 narrow 2-tile beam gaps; a miss drops Jo to the floor and costs the pits. Chips sit on the beams.
- **Breadcrumb.** 1 chip over the far-door threshold.
- **Hazards.** Reels, trip yarn, pits (no heart). No hearts are lost here.
- **Cast.** Anders Kell (gait: stiff right leg, upright, clicks the watch; stands at the start, then at x 160). Walkers (backward shuffle, anders palette). The starter's whistle at 26 s is a sound and a caption, not a fail.
- **Props.** Spinning wheels, yarn hanks, spars, a clock marked 5:50, tarred barrels, a kettle.
- **Sounds.** Ambience `rope_shed`: long creak of twisted line, a slow wheel hum with a 4 s cycle, far hammering. Footsteps on boards. A stopwatch tick-click on the card and at the door (the "26" is read aloud by Anders). Music: none; the room hums.
- **Time.** 1:20 including the card.

### 5.2 THE QUARRY STEPS (exterior, cold sunrise)

- **Card.** "UP THE STEPS, ROUND THE RIM, DOWN THE CHUTE. Chalk time: 70 seconds."
- **Teaching beat.** Wind falls visibly on the first flight and a landing has a bench and water barrel: a tutorial card says "Hills cost wind. Walk on a landing to get it back." That is the one new idea of this room.
- **Layout.** 130 tiles wide, 44 tiles tall (the camera scrolls vertically); the quarry face is 31 m (41 tiles).
  - x 0-8: the foot, lamp, Anders with a flask.
  - Flight 1: slope 1:1 up 12 tiles, x 8-20, to landing A (x 20-26, bench and barrel, a trough).
  - Flight 2: back the other way, up 12, x 26-14 (going left), landing B (x 14-8, a trough).
  - Flight 3: up 12, x 8-20, to the rim.
  - Rim run: flat, 60 tiles to x 80. A **blast gap** (11 tiles) at x 56-67. Nothing can be crossed by RUN. No trough after the gap: it is what you carry from the landings.
  - The **chute**: a long downhill slope, grade 0.5, x 80-124 and down to the base lamp. Scree tiles (a rough surface) that give a skid sound and slow RUN x0.9 while standing on loose stone.
  - Total Wind: three flights 25 Wind each if run (75), plus the gap (26): 101. Landings are the only refill. Perfect play stands for 2 s on each landing.
- **Hazard.** A rail cart crossing landing A and landing B every 7 s (interval -0.3 s per difficulty). It is a 1.4 m wooden cart with iron wheels (wheel spin = distance); a hit is one heart and knockback. The rail is lit by a flat red lamp as the cart enters.
- **Hard routes (3 clusters, 8 chips).** (1) Chimney: a 2 tile wide cleft between flights 1 and 2, a wall-jump climb of 10 tiles (3 chips); skips flight 2 and costs no Wind. (2) The ledge scramble over the blast gap's underside, a one-way ledge chain 2 tiles apart (2 chips, 1 heart shard at the end for the first dream; see 7.3). (3) The scree skid: run the chute on the outside edge where the slope is steeper (grade 0.9), speed-up chips in a line (2 chips). Each is an extra rep.
- **Breadcrumb.** 1 chip at the top of flight 3.
- **Foes.** The cart. A quarryman with a barrow at landing B, walking uphill with a plod (leaning, small steps, stops to rest every 6 steps). He is never hostile; his barrow is a one-way platform when he is stopped.
- **Props.** Granite blocks, a derrick, hung lamps, a blasting hut, a steam crane, quarry signs, snow on the high ledges, a water barrel and trough on each landing.
- **Sounds.** Ambience `quarry_wind`: high wind, a distant steam hammer, a pick on stone. Gravel footsteps on scree. A dull blast horn at 55 s that is only a caption bark ("Blast at the half minute. Not you."). Music: none. The cold open sky helps.
- **Time.** 1:40.

### 5.3 THE LOOM FLOOR (interior, noon, night grade: warm yellow)

- **Card.** "CROSS THE LOOM FLOOR TO THE CAGE. Mind the belts."
- **Teaching beat.** A belt moves the floor. Running with it adds 60 px/s; against it, -60 px/s and the cost of a hill (grade 0.8 equivalent). A tutorial card says "Belts carry you. Run against one and you pay."
- **Layout.** 110 tiles wide, 24 tall, two floors. Line-shafting and leather belts overhead; looms in rows; a gallery with the foreman's cage at the far side.
  - Floor 1 (x 0-110): a run of five belt sections (x 10-28 with, 30-44 against, 48-66 with, 68-84 against, 88-100 with). Between them, 3 tile stretches of still floor.
  - **Picker sticks:** each loom bay's overhead picker stick sweeps down on a 4 s cycle in the aisle (a loud hazard: one heart; dark band marks the aisle). Bays at x 36, 60, 92. With the belt, you cross in time at RUN; against it you need KICK.
  - **Gallery** (hard route): a one-way beam up a stair at x 12 to the gallery at 6 tiles up, running above the looms (2 clusters of 3 chips each); two kick gaps (x 36-47 and x 70-81) between gallery sections, 25 tiles apart with no trough: you must walk the gap between.
  - The cage (x 104-110): Lena at the last loom.
- **Hazards.** Belts, picker sticks, a boy sweeping fluff (a plodding walk, a soft obstacle).
- **Cast.** Lena Ostrom (shuffle-step at the loom, one hand always on the shuttle; the only loud person in the room, because she has to be). Weavers at the looms (idle task: shuttling; do not move).
- **Props.** Looms with moving shuttles (live animation), bobbins, a tea urn, a wall clock, a lamp over the cage, overhead belts.
- **Sounds.** Ambience `loom_clatter`: the shed's four-beat rattle, so loud that speech is muffled by a low-pass on the sceneBox voice ticks. The whole Loom Floor has no music; the machines are the rhythm. Pickers crack.
- **Choice here (Lena).** See section 9. Time: 1:30.

### 5.4 THE DRESSING SHED (interior, evening before, cold lamp)

- **Card.** "THE NIGHT BEFORE. Have the doctor look at the leg. Then up to the track."
- **Teaching beat.** None new. A quiet room. The camera is closer (zoom 1.15). Tove at the door says one line.
- **Layout.** 54 tiles wide, 20 tall. Wooden benches, pegs of vests and coats, a tin bath, a stove, a wireless on a shelf with a dance band, lockers (green ones are the city club's), a shelf of spikes.
  - x 0-8: the door in (from the Loom floor's exit).
  - x 8-30: the **sink and mirror** with Gitta, Marta Ilves and Ruth Dace getting ready. Gitta's brief scene.
  - x 14-24: a bench with Pim, lacing plimsolls with string.
  - x 30-42: the doctor's table (Dr Hale).
  - x 42-54: the stairs up to the track and the final door. A small platform climb up to the locker tops (one hidden chip, a few jumps).
  - Gate to the track: "OPENS WHEN THE DOCTOR HAS SEEN YOU" (flag `seen_hale`).
- **Cast and gaits.** Dr Hale (brisk, short steps, hands behind back). Gitta (even, long stride, heel-first, a runner's walk with no waste). Ilves (a rolling swagger). Dace (bounces on her toes). Pim (heel-slap, hurries, trips on the string).
- **Sounds.** Ambience `dressing_shed`: a tap drip, a stove tick, boots on boards, the radio (a muffled dance band). Music: the radio is the music, a three-piece in C major, far and tinny.
- **Time.** 1:00.

### 5.5 BRINDLE PARK, THE HEAT (exterior, bright overcast morning)

- **Card.** "THE HEAT. 200 metres. Top two go through."
- **Teaching beat.** The scoreboard on the line shows the runners and the Chalk board shows the splits of the last year's heat. A tutorial card: "The field goes out fast. You can't follow everyone."
- **Layout.** The park track is one 590-tile strip (18,880 px): lap 400 m from the **line at x 12** to the **tape at x 562**. Stands behind (the backdrop), a brick gasworks beyond, the brass band at the far stand, floodlight-less. Each 50 m has a board on a post with a big numeral (plate, 18 px type). The heat runs from the 200 m mark (x 287) to the tape; it is 200 m (8,800 px) and takes Jo 31.4 s at RUN.
  - Field: Jo, Marta Ilves (33.4 s, even), Ruth Dace (31.0 s to 100 m, then fades to 37 s), Pim Rudd (41 s), one more (40 s).
  - Top 2 go through; Jo at RUN wins by 2 s; a player who follows Dace's start and kicks is in trouble.
  - 4 chips: arcs of 2 over the track at 40 m and 150 m from the start, each only reachable at KICK speed (a 10-tile arc, 3 tiles high). Taking them costs about 50 Wind and does not win the race. They are the lure.
  - The start: blocks scraped in the cinder, the starter, Mr Quill, in a white coat with a raised pistol arm.
- **Fail.** Third or worse: the field is called back ("a stewards' enquiry", i.e. a retry), at most twice; after the second failure a chalk board of the splits is set at the first 100 m (section 8).
- **Cast and gaits.** Mr Quill (rocks heel to toe, steady). Ilves, Dace, Pim, runner extras (all runner-rig palette swaps). Spectators in the stands (flat painted, tiny idle loops).
- **Sounds.** Ambience `pistol` (existing, the stadium roar plus wind) with chatter; crowd swell proportional to nearness of the tape; a brass-band march far off; the starter's pistol (existing `starter_pistol`); the hand-bell at the line.
- **Time.** 1:10.

### 5.6 BRINDLE PARK, THE FINAL AND THE TAPE (the same strip, afternoon, then dusk)

- **Card.** "THE FINAL. 400 metres. One lap."
- **Teaching beat.** None. The heat taught everything; the shed gave you the plan. A second set of Quill's calls.
- **Layout.** The whole strip, line to tape. The track's colours are a deeper green and a longer shadow. The Eye stands at the tape (a boxy tripod with a lens and a cloth).
  - 0-100 m: Gitta goes out in 14.9 s. A tailwind banner (limp flags fluttering with it).
  - 100-260 m: **headwind** (flags snapping at Jo, grass lean, a cost of 0.5 Wind per s on top of the pace cost).
  - 215-250 m: the **dog**. Biscuit, the groundsman's terrier, trots across at x 242 and stops (soft clip; a bark gives warning). It crosses once.
  - 300 m: a board "100"; **RED** is available from here.
  - 350, 370, 380 m: boards "50", "30", "20" with a bigger numeral.
  - 6 chips on KICK arcs: three in the first 100 m (the lure; a player who takes two has 60 Wind spent before the back straight), two at 230-270 m, one at 330 m.
  - Gitta's splits: 14.9 / 30.9 / 46.9 / 62.5 s (the actual last is solved by `solveGitta`, section 11, so that the best legal run without red is second by 0.02 s). She has a very good, flat, even stride. She breaks the tape at the end.
  - Others: Ilves 63.8, Dace 64.4, a fifth runner 66, Pim 72.
- **After the line.** The result card (section 10) and the podium call. Quill announces the winners from the platform; the crowd and all the cast turn to it. A short beat, then the small moment (section 10).
- **Fail.** Fourth or lower: "RUN IT AGAIN" card, in place, no hearts lost. Wrong-way or bust is never a failure of the dream.
- **Sounds.** The same stadium bed at higher swell; the Eye's slow motor whirr only at the line; footfalls with the cinder; breath loop; at red a heartbeat in the low register and no music. After the finish, silence, then a distant band.
- **Time.** 1:50 plus 0:40 ending.

## 6. Difficulty scaling

`scene.difficulty` is `dreamsCaught` capped at 5. Read it once in `create`; scale as follows. Placement scales more than amounts, as the collectibles skill says.

| Setting | d = 0 | d = 3 | d = 5 |
|---|---|---|---|
| Hearts (framework) | 3 | 6 | 6 |
| KICK cost per s | 20 | 26 | 30 |
| Uphill cost | x1.00 | x1.15 | x1.25 |
| Walk/stand regen | 12 / 18 | 10.8 / 16.2 | 10 / 15 |
| Dead-legs exit | 30 | 36 | 40 |
| Cart interval | 7.0 s | 6.1 s | 5.5 s |
| Picker cycle | 4.0 s | 3.6 s | 3.4 s |
| Heat rivals (Ilves) | 33.4 s | 32.8 s | 32.4 s |
| Final Gitta | solved so the best is second by 0.02 s at every d | same | same |
| Chip placement | breadcrumbs on | 30 percent of safe chips moved to the risky line (d >= 2); breadcrumbs removed (d >= 3) | same |

The final does not become harder: it is a photograph at every difficulty. Difficulty changes the road to it. At d = 0 the teach cards play in full and a first-timer is told the same thing three ways (card, chalk board, Anders). At d >= 3 the cards play once and only Anders speaks.

## 7. Economy and placement

### 7.1 Coin

The dream's coin is the **medal chip**, worth 20, budget 25-35 (from `src/data/dreams.js`). 30 chips are placed (600 worth if all taken).

| Area | Chips | Of which breadcrumb | Hard route |
|---|---|---|---|
| Ropewalk | 5 | 1 | rafters (4) |
| Quarry | 8 | 1 | chimney 3, ledges 2, scree skid 2 |
| Loom floor | 6 | 0 | gallery, 2 clusters of 3 |
| Dressing shed | 1 | 0 | locker tops |
| Heat | 4 | 0 | KICK arcs |
| Final | 6 | 0 | KICK arcs |

Note for the owner: 600 worth is more than a dream usually pays (the heart-shard prices are 150, 300, 600). If it is too rich, set the budget to 25 and drop the heat's chips to 2.

### 7.2 Hearts and shin

Hearts are only lost to the cart and the pickers. Chips are the temptation, and each hard route that adds an "extra rep" raises the ache. The economy therefore leans into the story: the more medals Tove chases, the sorer the leg.

### 7.3 Heart shard

One. It is at the end of the quarry's ledge scramble. Shard rooms hold the shard and 5 chips, so the ledge route has 2 chips and a shard.

### 7.4 Placement rules applied

- The safe route pays nothing (breadcrumb chips aside).
- Chips draw the line the body should take: KICK arcs are the exact jump arc.
- The track chips cost Wind: greed is paid for in the same coin the plan needs.

## 8. Failure

- **Soft failure everywhere.** Pits: 3 s back to the ladder, no heart. Dead legs: slower, not stopped. Stumbles: speed only.
- **Hearts.** The cart and pickers take one heart and knock Jo back. At zero hearts: the death card, respawn at the room lamp with full hearts. Never lose the dream.
- **Races.** A false start costs 6 s (the field is called back to the line). A heat result worse than 2nd, or a final worse than 3rd, offers "RUN IT AGAIN?" (E) or "KEEP IT" (a worse ending line, but the dream continues; the dream cannot be failed). In the final a worse result is allowed to stand: the catch does not depend on place.
- **Soft aid.** After two retries of the same race, a **chalk board** appears at the kerb at 100, 200 and 300 m showing Gitta's split. Never labelled "easy". Anders mentions it: "I chalked it for you."
- **Red cracked early.** The leg cracks, Jo hobbles, the race is lost and the same retry card appears. The red gear is not offered a second time with a visible warning; the Eye still records it.
- **Reset options** from Feedback 3 (restart from checkpoint or from dream start) work as-is.

## 9. Dialogue samples (the voice)

Format follows `dialogue.js`: scene conversations and caption barks. Jo speaks little.

**Conductor (hub board).** "The Finish Line. Nobody remembers second." (existing)

**Ro (hub).** "Cinder on the soles. You ran somewhere." (existing)

**Tove (arrival, rail, once).**
- TOVE: "That's the ropewalk. A hundred and twenty metres of shed, and I used to think that was long."
- TOVE: "I can't do it any more. You do. Don't be me. Or be me; I'd like to see."

**Anders, ropewalk start.**
- ANDERS: "Door to door. Twenty-six seconds. I've put it on the board so you can hate it."
- ANDERS: "Hold the Q before the edge, not at it. Lungs are a purse, girl. Spend it where it buys something."

**Anders, trough.**
- ANDERS: "Stand. Don't pace about. Standing is free and it's the only thing that is."

**Quarry bark (barrow man).** "Up's up. Nobody's invented a way round." (caption)

**Lena, the loom floor (a node graph with choices).**
```
start: LENA: "Saturday's your last day on the steps. They'll miss you on the line, you know. Not me; the gaffer."
j1: JO choices:
  - "I'll work it." -> l_work  (set: worked_shift; effect: wind -6 in the final)
  - "Would you cover me?" -> l_cover (set: lena_covers)
l_work: LENA: "Fool. All right. Eat something."   // (Tove tired in the final)
l_cover: LENA: "I'll punch you in at the bell. If he looks at the clock it's my place, not yours. Go on."  // she pays later
```

**Dr Hale (the choice).**
```
start: HALE: "Sit. Don't tell me it's fine. Tell me where."
j1: JO: "The shin. Going down the steps."
h1: HALE: "It's a stress line, early. Tomorrow is forty seconds of effort. I can strap it, or I can say rest. I'll write what you tell me."
choices:
  - "Rest it." -> set: rested        ("Good. You'll start cold. It's cheap.")
  - "Strap it." -> set: strapped     ("You won't feel it. That is what a strap is. Remember I said so.")
  - "Say nothing." -> set: silent    ("Then I've written nothing.")
```

**Gitta, the sink.**
- GITTA: "I haven't lost since I was fifteen. I'm told that's good."
- GITTA: "They'll print my name. They'll print yours small. Do you mind that?"
- JO: "A bit."
- GITTA: "Good. So do I, from the other side."

**Pim (shed).**
- PIM: "I've no spikes. Mr Kell says plimsolls are fine to try. Have you got a string?"

**Tove at the line (final).**
- TOVE: "Don't follow her. I did. That's the whole story, really."

**Tove, 300 m (caption, only if red is available and not strapped).**
- TOVE: "That's the leg. There's a bit more in it. It won't be there after."

**Quill (starter).**
- QUILL: "On your marks."
- QUILL: "Set."
- (pistol)

**Barks.** "Mind the dog." (on the 215 m). "Twenty to go." (at the board). "She's gone out in fifteen. Let her." (caption on the line, once). "Heat, second heat, let me see the board." (stands)

## 10. Ending

### 10.1 The result

After the tape:
- **Win (red used):** the Eye is not needed. Jo breaks the tape and the leg goes: a slow drop on the cinder. Gitta crosses a step behind. Quill's PA: "First, number four."
- **Photograph (best honest run):** both break the line together. The crowd is silent; Quill: "The Eye will decide." The Eye's motor whirrs for 3 s. The photograph is shown, one long narrow strip. A vest's width. "Second, number four."
- **Second by clean margin, or third:** the result is read plainly. The margin is in the ending line.
- **Fourth or worse:** the retry card.

No score is shown as glory.

### 10.2 The small moment

The crowd goes to the podium. The stands thin. Pim, last of the final, is still on the back straight. The tape is lying on the cinder where Quill's boy dropped it.

Jo is made to walk back to the line. The walk is the moment; the camera lowers and widens. At the line the tape lies slack. Jo presses **E at the tape** and lifts it taut at chest height with both hands (a pose, `hold`, held as long as E is held). Pim runs the last 70 m alone, plimsolls slapping, in her one pair of colours, through the cinder dust, and through the tape. Tove's voice, quiet: "Nobody remembers second. I remember everybody."

This is the catch. The **orb is the tape**: a white strip that lifts, drifts to Jo and flashes (`record: true`). The podium call is heard from far away and nobody here goes.

### 10.3 The ending image (560 x 300)

The cinder at dusk: the white tape strung low across the lane, a single small figure running into it from the left, a rake leaning against the post at the right with a cardigan hung on it. Lamp on the post. The Eye's tripod, covered with its cloth, in the far distance. Title in the split-flap type.

### 10.4 The ending lines (each from flags; two or three of these show)

1. By result: "Second, by the width of a vest." / "First. The leg took a season to knit." / "Third, and glad of it."
2. By Lena: "Lena Ostrom lost her place at the works that winter. She never said. She comes to the park on Thursdays." (lena_covers) / "Tove worked the Saturday shift and ran on nothing." (worked_shift)
3. By the doctor: "She rested the shin and ran for another thirty years." (rested) / "She strapped it. She felt nothing. That was the strap." (strapped) / "She told the doctor nothing." (silent)
4. Always: "Pim Rudd came in last, alone, and was held a tape. She is the one who runs the Wednesday club now."

## 11. Pure engine modules and their unit tests (Node, vitest; no Phaser)

All in `src/engines/` or `src/dreams/athlete/`, pure functions with plain data in and out.

1. **`engines/pace.js`.** `createPace(params, difficulty)` returns `{ step(dt, input), state() }`. `input = { gear: 'walk'|'run'|'kick', moving, grounded, grade, belt, headwind, onTrough, kickHeldMs }`. `state = { wind, speed, dead, kickBuilt, stumble }`. Tests:
   - RUN on flat in a training room does not spend wind; RUN up a 1:1 stair spends 18 per second at d = 0.
   - KICK costs 20 per second at d = 0 and 30 at d = 5.
   - Wind reaches 0 -> dead; dead exits at 30; speed is 0.62 x gear while dead; KICK is rejected while dead.
   - WALK for 2.5 s from 0 gives 30 at d = 0.
   - A stumble sets speed x0.4 for 0.5 s then ramps over 0.7 s; wind -10.
   - `kickBuilt` is true only after 0.25 s of continuous KICK; false after any release.
   - A belt of +60 gives speed 340 at RUN; against -60 gives 220 and 18 x 0.8 cost.
   - Determinism: the same inputs give the same wind.
2. **`engines/jumpreach.js`.** `reach(gear, coyoteMs, kickBuilt)` returns the farthest same-height landing in px: assert RUN is 308 +/- 8, KICK is 388 +/- 8, an 11-tile gap (352 px) is crossable only with `kickBuilt`, and a 10-tile gap is not safe at RUN. The reachability lint reads this to allow kick gaps (see build step 1).
3. **`engines/racecalc.js`.**
   - `positionAt(schedule, t)` and `scheduleFor(splits, distance)`: runner position in metres at any t from splits (linear within each 100 m).
   - `classify(joTime, field)` returns `{ place, margin, photo }`. `photo` is true when `|margin| < 0.06`.
   - `solveGitta(params, d)` returns Gitta's final time `G` such that the best legal Jo (full wind, best kick placement, no red) is second by 0.02 s; asserted at d = 0, 2 and 5. A greedy search over kick placements.
   - All-RUN Jo is second by at least 0.2 s at every d.
   - A Jo who kicks in the first 100 m and then runs finishes worse than all-RUN.
   - A Jo with red (365 px/s for `RED_SEC`) started inside the allowed window wins; started too early, the leg cracks and Jo loses by more than 2 s.
   - The heat: all-RUN Jo wins by at least 1.5 s at d = 0; at d = 5 still top two.
   - `falseStart(seed, attempt)` returns a wait between 1.0 and 2.4 s, repeatable per seed, different per attempt.
4. **`dreams/athlete/shin.js`.** `ache(reps)`, `redSeconds(ache, strapped)`, `finalWindMax({ ache, rested, workedShift })`. Tests: reps 0-2 -> 0, 3-4 -> 1, 5-6 -> 2; rested lowers by one, floor 0; red seconds 5.5 / 4.0 / 2.6 (+1.0 strapped); Wind max 100, 94 if worked, 92 / 84 for ache 1 / 2 with the -8 per level.
5. **`dreams/athlete/endings.js`.** `endingLines(flags, result)` returns the set of lines; test that every flag combination yields 3 or 4 lines, each 140 characters or fewer, and a win without Lena or shin flags still reads.
6. **`dreams/athlete/placement.test`.** A data test over the rooms: 30 chips total (+/- 5), a hard route chip count per room, no chip on the critical-path floor except breadcrumbs, no kick gap wider than 11.5 tiles, every kick gap has a trough within 40 tiles of the chain before it, every gap has a ladder.

## 12. Build list (one agent, in this order; one merge point per step)

| # | Step | Size | Verify |
|---|---|---|---|
| 1 | Spike: a `verbs/pace.js` stub that sets `player.speed` per gear and reads `player.walking`; confirm the Player honours `speed` set by a verb each frame and that `walking` clamps to 80; extend the on-foot reach lint with `reach.kick` (11 tiles at KICK allowed) | S | a 3-line test room, `?warp=athlete:rope` |
| 2 | `engines/pace.js` + `engines/jumpreach.js` + unit tests | M | vitest |
| 3 | HUD widget (lungs and a thin bar under hearts; 9 px type if text), gear pose `kick`, breath puffs, camera look-ahead and zoom, footstep surface `cinder`, kick audio | M | warp, a recording |
| 4 | Dream shell: `dream.js`, `index.js` registration, `dreams.js` (add `scene: 'Dream'`), `DREAM_WARP`, material `cinder` and `boards_dark` palettes, backdrops, props | M | `?warp=athlete:start` |
| 5 | Ropewalk room, reels, pits, walkers, Anders, trough, the arrival card, chips | L | scenario `athlete-rope` (a scripted run finishes under 40 s) |
| 6 | Quarry room: slopes, cart, landings, troughs, scree, chimney, barrow man | L | scenario `athlete-quarry` (gap crossable at KICK, not RUN; wind never negative) |
| 7 | Loom floor: belts, pickers, gallery, Lena conversation and flags | M | scenario `athlete-loom` |
| 8 | Dressing shed: Gitta, Pim, Hale, the doctor choice, flags | M | scenario `athlete-shed` (gate opens after `seen_hale`) |
| 9 | `engines/racecalc.js` + `shin.js` + tests | M | vitest, including `solveGitta` |
| 10 | `Field` (runner NPCs on schedule, gait speed-locked, ghost lanes), the start (marks, set, pistol, false start), the finish (tape and Eye), the track room, board posts, the heat | L | scenario `athlete-heat` |
| 11 | The final: Gitta, headwind, dog, chips, red gear, the result card, retry card, chalk board aid | L | scenarios `athlete-final-photo`, `athlete-final-red`, `athlete-final-crack` |
| 12 | The tape: Pim, the hold pose, the orb, the ending image, ending lines | M | scenario `athlete-ending` |
| 13 | Sound: starter pistol (reuse), stopwatch clicks, rope shed, quarry wind, loom clatter, dressing shed, band, heartbeat; music keys per room | M | `?sound=1` listening check |
| 14 | Rigs: `runner` (4 palettes), `anders`, `tove_old`, `lena`, `hale`; terrier; portraits; `npm run atlas` | L | characters test |
| 15 | Polish: difficulty table, contrast scenario (Jo at 3:1 on every backdrop; Jo's colour is not the club-green), length scenario (6-10 min), the HUD diet pass | M | scenarios `athlete-contrast`, `athlete-length` |

Steps 5, 6, 10 and 14 are the cost. Everything else is data and short modules.

**Scenarios to add** (`src/dev/scenarios/`): the list above, plus `athlete-difficulty` (the table at d = 0, 3, 5 matches section 6) and `athlete-flags-ending` (all choices reach an orb).

## 13. Risks and open questions

- **Does the Player honour `speed` from a verb each frame?** `Player.speed` is a field and line 702 uses `walking ? min(speed, WALK_SPEED) : speed`, so it should; step 1 proves it. If not, the verb sets `body.velocity.x` after the Player's update.
- **Jump air speed equals takeoff speed.** True of the current Player (x speed set each frame by input). Confirm in step 1; if the Player damps in the air, add `airSpeed = takeoffSpeed` in the verb.
- **A 550-tile room.** The chef's strip was 320 tiles; chunked baking (1024 px) should handle 18,880 px. If not, split the track into two rooms by a seam at 200 m, with the heat starting in the second.
- **Runners that pass through each other** can look wrong. Mitigation: ghost lanes 10 px higher and 4 percent smaller, a different shadow; no one overlaps Jo's lane.
- **The red gear is a two-key chord** (Q + Down). It is the only chord in the dream. If it is cumbersome on touch, change it to a second Q press after 0.3 s of a released Q, or a dedicated touch button.
- **Photograph tuning.** The 0.02 s target relies on `solveGitta`; a change to any Wind number shifts it, which the test catches.

## 14. What I would cut first

1. **The dog.** Pure charm.
2. **The loom floor's belts and pickers.** Reduce the room to a 40-tile corridor with the Lena conversation, and the quarry becomes the only "terrain" room. The Lena choice survives.
3. **The doctor's STRAP hidden-bar rule.** Keep the three answers but make the leg bar always visible.
4. **The photograph strip** in the ending: keep the text.
5. **The podium call** and the heat's second chip pair.
6. **The chimney and ledge hard routes in the quarry** (the scree skid stays).
7. Last: the heat as its own race (replace with a short jog-through card). The final and Pim must stay; they are the dream.
