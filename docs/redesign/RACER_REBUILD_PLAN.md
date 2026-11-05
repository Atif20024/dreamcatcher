# The Racer rebuild: the drive and the story

Plan only, 2026-11-05. Nothing here was run. Claims about the existing code are tagged: **[checked]** means I read the file and the line; **[assumed]** means I am inferring. Builders execute this without asking; where a choice is open, the default is stated.

The owner's decisions stand and are not reopened here: behind-the-car view into the screen, a curving road, free steering, the 1958 Calvessa Coast look, a separate driving scene, nuts never buy speed, the engine is the music on track, only Cassian blocks (tell of 0.4 s or more), touch needs steer plus gas plus brake, rivals renamed, Racer only.

## 0. The one idea

**Every bend is a loan.** The road ahead asks the same question every few seconds: *how much speed do you carry into this?* Brake early and you pay in time. Brake late and you pay in tyres, which is grip you will want at the next bend. Don't brake and you pay in straw (speed and tyres) or a wall (three seconds, back at the lamp). The tyres are the race's only resource, the chalk is Ottavia's answer to the question, and the rivals are three different ways of answering it badly. Everything below serves this. Nothing is won by hitting anything.

## 1. The race, minute to minute

### What the player decides, and how often

| Every | Decision | Risk | Reward |
|---|---|---|---|
| 4 to 8 s | **The bend.** A board says LEFT or RIGHT and a speed. Where do I brake, and how hard? | Late: slide wide, scrub tyres, straw or wall | Early: time lost. Right: the car "sings" (a small sting, a clean-bend count on the card) |
| in every bend | **The line.** Free steering: the push throws you outward, you hold against it. Enter wide, hug the inside, let it run out | Hug too early: slower exit. Run out too far: the verge (drag, wear) | A clean line keeps 2 to 3 m/s through the bend |
| 1 to 3 s when near a rival | **The draft.** Sit in his air (1.5 to 4 lengths, within a quarter road) for 1.2 s and the bar fills | He brakes earlier than you expect, and you are on his tail | Six percent while in it; break out with the bar full and the sling fires itself: 18 percent for 2 s |
| when the bar is full | **Where to pass.** Straight (Cassian blocks there) or the braking zone (nobody blocks there, but it is where the loan is called in) | A pass in a bend over the limit is a slide into him or the straw | The pass sticks |
| per hazard | **Avoid or lift.** A cart in the middle, goats on the verge, the crossing's bell: steer round, or brake | Steering at speed into the verge | No time lost |
| across the race | **Spend the tyres.** The grip bar sits by the speedo. Worn tyres brake longer and slide sooner (never worse than a fair 25 percent; soft tyres 15) | Burn them early, pay in every bend after | Save them, and the last bends are yours while the diver's are gone |

### The rivals, each a different wrong answer

| Rival | Livery | Style on the road | How you pass him | Story |
|---|---|---|---|---|
| **Cassian Roche** | black and gold | Smooth, fast. **Blocks**: when you are in his draft on a straight he looks in his mirror (the tell: brake lamps flash twice, his helmet turns), then 0.45 s later moves across to your side of the road over 0.8 s. Never in a bend, never twice within 4 s. If you sit in his air for 3 s he **brakes 8 m early** at the next bend: the gap | Under braking, after the tell: stay in his air to the braking board, then the inside | Rich, never told no. His car fails at the Gull Bend in the Coppa |
| **Marta Soli** | white and blue | Clean. Fast in bends (limit 1.06), slow on straights (top 0.95). Never blocks; holds her line through contact and fades back | On the straight, from the draft | The lesson in respect. Kind to Jo at the Gull Bend return |
| **Teo Brasca** | mustard, dented | **Dives** into any gap, weaves behind you (plus or minus a quarter road), rubs. Wears tyres at twice the rate and fades to top 0.9 once bald, about two thirds in. Drops **oil** from his dented sump: a dark patch where he braked hard (a 0.6 s wobble, recoverable) | Don't. Wait. He comes back to you | The hazard that tires out. The oil is the story reason for the road's one slick |
| **Dante Mir** | cream and teal, red number | Teammate. Clean, top 0.97. In race 4, if Sable's orders stand, the pit board says HOLD while he is ahead | Pass him and `broke_orders` is set | Whose car it is |

Rubber band: 6 percent at most, on top speed only, and visible: the HUD's rival dot and a pit-board gap, never a car that magically closes in a bend.

### Hazards, each with a reason to be there

| Hazard | Race | What it does | Why it is there |
|---|---|---|---|
| Hay cart | 1, 4 | Stopped in the road, 3 m long. Fast: spin to the lamp. Slow: a bump and a stop | Closed public roads; a farmer did not hear |
| Straw bales | all bends | On the outside; soft: 40 percent of speed and some tyre, back onto the road | The only safety there was |
| Stone wall | 3, 6 (the Gull Bend's outside) | Spin, dark, back at the lamp in 3 s | The cliff road |
| Goats | 3 | A bell 2 s ahead; two goats cross the verge to mid-road over 1.5 s. Slow: a bump | A dawn road over the terraces |
| Fog bank | 3 | 200 m where the draw distance drops to a third; the boards and the chalk are what you have | Dawn on the cliff. Fear is not being able to see the Bend |
| Level crossing | 4 | Bell and red lamps 3.5 s ahead, the gate closes for 4 s, a drawn train crosses. Arrive at a shut gate: a bump and a stop (never a spin). Brake and wait, or make it | The Salt Road is a real road |
| Oil | 4, 5, 6 | Teo's, where he braked. A 0.6 s wobble | His sump |
| Puddles | 5 | On the outside half of every bend: grip 0.7 inside them | Rain on the Terraces |
| Headlight pool | 2, 6 | Night: draw distance halves outside lamp pools; the quay and the pit straight are lit | The Harbour and the Coppa are night races |
| Cassian's wheel | 6, lap 2 | His car sheds a wheel at the Gull Bend, slews into the straw; a dry crack, a puff of smoke, no flag yet | The finale's choice |

### What changes the feel between races

- **Tuning by ear.** Untuned (no `tuned` flag): the engine note carries a 2 Hz beat (two oscillators, as TUNE's bench does), the tacho needle flickers, and after 60 percent of the race the HOT meter reaches red and top speed drops 4 percent. Tuned: a clean note. The warning exists today **[checked RaceScene.js:101,135,246]**; the beat in the note and the 4 percent are new. It costs something now, and you can hear why.
- **Tyres.** Stock: `gripMin` 0.75. Soft (bought, or Aldo's set kept): 0.85. `tyres_short` from the kitchen: race 5 starts at grip 0.6 (the worn band). The rack's price logic stays **[checked season.js:55]**.
- **Chalk.** Bought, or the whisper after three tries: a chalk tick on the road at every braking point for Jo's own speed, as today's `chalkAt` does per lane **[checked race.js:112]**, now one mark on the road at the braking distance from the top speed, plus the player's own three marks from the Night Before at the Gull Bend in race 6.
- **Light and weather across a race.** Race 2 goes dusk to night with distance (the sky's three colours interpolate by `d / length`; lamp pools grow). Race 5's rain thickens in the second half (puddles widen by 20 percent). Race 6's second lap has the dawn coming up behind the cliffs. All are palette interpolations in the road painter, no new art.

### Comebacks and failing

- **Lamps** every 250 to 350 m. A spin is 3 s of dark, then back at the lamp with the rivals where they were when you passed it (today's `toLamp` and `lampRivals`, kept **[checked race.js:501-524]**). The clock does not rewind, so a spin costs about 2.3 s, never the race.
- **Gates are top three, not first**, except the two-car race 3. Below the gate: "He has the road and you have the next try", one key to go again (today's `askAgain` and card, kept). After three tries short, the whisper: chalk on every brake point. Never called easy.
- **Lost early** (`raceLost`, kept): Ottavia asks on the dark frame; Drive on is always allowed and counts for the story's "done" flag only when the gate is passed.
- **Race 2 cannot be failed.** Race 1 has no rival: the gate is finishing, and Ottavia's time is a target, not a wall.

### Cut, on purpose

- The **sling key**. The sling fires itself when you leave a full draft. One less button on a phone, and the decision ("when do I pull out") is the same. The draft bar is still armed by sitting in his air for 1.2 s.
- **Lanes**, the lane buttons, the sight strip, `lineOf`, `bendLen`, lane-scaled sprites.
- The **Nerve ring**, breath, tunnel vision. Fear is the fog and the dark lamp at the Gull Bend (§3), not a meter.
- **Fuel and heat** as a gauge in race 6. The pit stop stays (a box you must brake into), fuel does not.
- **Gears, a shift light.** One long pull, as today.
- The **four-key pit rhythm** inside a race. The crew's drill lives in the pit lane room and sets `pit_clean`; in race 6 the stop is a braking test (§2).

## 2. The season

Six races. The story spine (hooks, doors on the quay, the flags the rooms gate on, Sable's orders needing a race with Dante, "whose car" needing a race after Sable) is built for six **[checked season.js HOOKS, rooms/quay.js portals]**, and each race teaches one new thing. Five would lose either the orders race or the fear race. The cost is length: at a tidy bot's pace the six races take about 6:00, the walk-in places about 3:20 (the stage 2 report's figures), so a first play is 9 to 10 minutes, the top of the bar, where the Gambler sits (8 to 10, `GAMBLER_REPORT.md:193`). The lever if it must come down is one number per track (`length`). Race 2 and race 1 cannot be retried into a wall, so only four races can add retry time.

| # | Track | Light | Length, time | New | Shape | Hazards | Rivals | Gate |
|---|---|---|---|---|---|---|---|---|
| 1 | **Pinewood hill-climb** | day | 800 m, 0:35 | steer, gas, brake, the boards, the push in a bend | two sweepers, a crest that hides a tight right (the board tells you), a short run to the line | one cart | none; Ottavia's time on the card | finish |
| 2 | **Harbour Night Cup** | dusk to night | 1200 m, 0:50 | the draft (Aldo is the first draft you learn), the sling by breaking out | the quay straight, the Gull Bend (a long right by the wall), the harbour hairpin | night, lamp pools | Aldo ahead, Teo behind | scripted, cannot fail |
| 3 | **Gull Bend return** | dawn | 1300 m, 0:52 | braking points, chalk, the wall, passing a clean driver on the straight | the cliff road: fog on the straight before the Gull Bend, the wall on its outside | fog, goats, wall | Marta | first of two |
| 4 | **The Salt Road** | noon glare | 1400 m, 0:56 | Cassian's block and its tell, team orders, the crossing | flat, two long straights, a chicane, the level crossing before the last straight | crossing, cart, Teo's oil | Dante, Teo, Cassian | top 3 of 4 |
| 5 | **The Terraces in rain** | rain | 1600 m, 1:04 | grip as a resource: puddles, worn tyres, a diver who fades | three hairpins down the terraces, a wet S, a flat-out run along the vines | puddles, oil | Cassian, Marta, Teo | top 2 of 4 |
| 6 | **The Coppa Calvessa** | night to dawn | 2 laps of 1000 m plus the pit, 1:35 | the pit stop, the whole coast at night, the choice | the pit straight, the harbour hairpin, the Salt straight, the terraces S, the Gull Bend, the line | lamp pools, oil, the wheel | Cassian, Marta, Teo | top 3 (with Cassian out after lap 2, finishing is the gate) |

**Race 1 in detail** (the feel is everything; this is the track `S1` tunes on). Board at 150, 100, 50 m before each bend, a chevron line through it. The first bend's board says BRAKE NOW once (today's `teachBrake`, kept). The crest at 520 m: the road rises 6 m over 80 m, and the right-hander's boards start on the climb, so the player must trust the board before seeing the bend. The cart at 300 m, mid-road, visible 150 m out.

**Race 2** is a script on top of a real drive: Jo drives; the engine emits `cue` events at distances; the scene turns them into radio lines and the lights. Aldo's car holds 2 to 3 lengths ahead at Jo's pace whatever Jo does (`station` style with the player as the station), so the draft fills and the first sling is taught on the quay straight. At the Gull Bend on the way back (d 1040 m), Aldo's tail lamps drift to the outside over 1.5 s, go out, the engine note from his car stops, dust in the headlights, and the race ends there: no finish line, no card, a 2 s hold on the dark, then the garage with `done_race2`. Teo passes Jo somewhere before that (the late move Jo "saw"). The player's only input in the last 3 s is the brake; the car stops by the verge on its own if not.

**Race 6 in detail.** Lap 1 ends at the pit box (a painted rectangle on the pit straight, 12 m long): brake to a stop with the nose in the box and the crew's 3 s pass (2 s with `pit_clean`); stop short or long and it is 5 s, while the board says SHORT or LONG; drive through and Ottavia says "You have no tyres for a second lap" and grip drops to 0.4. On lap 2, at the Gull Bend, Cassian's wheel goes when he is within 60 m ahead of Jo (the script waits for that, up to the bend's exit; if Jo is ahead of him by then, Cassian goes off behind Jo and the choice is whether to stop at all: both branches still exist). Hold the brake to a stop beside him within 40 m of his car: Jo pulls up, runs back, Cassian waves him off, two marshals arrive, 8 s on the clock, `helped_cassian`. Drive through: `passed_cassian`. Either way, the lamp at the Gull Bend lights, and the last 300 m to the line.

## 3. The story

What is built stays: the garage opening, Aldo's tyres, the hospital corridor, the kitchen tin, Sable's papers, "whose car", the Night Before's chalk, the pit lane's drill. The rebuild adds the six drives between those places, five scripted moments inside them, and the ending. Nothing in the walk-in dialogue mentions lanes **[checked dialogue.js, grepped: none]**.

### Renamed rivals
Lena Aurelio becomes **Marta Soli**. Bruno Varga becomes **Teo Brasca**. No source file or design doc uses Soli, Teo or Brasca **[checked by grep]**; "Marta" appears once elsewhere (one hit in src/docs; the builder checks it is not a cast name before using it, and falls back to **Ines Soli** if it is).

### What the player learns, race by race

| Before | In the drive | After |
|---|---|---|
| **1.** Ottavia: TUNE, "Don't lift." Aldo: a stranger with good hands | Her radio: the first bend's brake, then "Don't lift." On the card: the lifts she heard, her time | Aldo's offer: the one set of tyres |
| **2.** Aldo: "Follow me for the first lap." Ottavia (if tuned): a hair flat tonight, Aldo | Aldo over the radio, then Ottavia; the Gull Bend; the lights go | Nino: the gloves. Hospital. Kitchen |
| **3.** The kitchen's tin. Nino chalks the road if you bought it | The dark lamp (below). Marta lifts for a clean pass and holds her line if hit. Fog | The quay's talk changes (the black car, the money). Sable's door opens |
| **4.** Sable's clauses | The pit board: HOLD if orders stand and Dante is ahead; Cassian's tell; the crossing | Ottavia's question, her anger, whose car |
| **5.** "She is a hair flat, by the way. Not today. I have fixed it." | Rain, the jar's cost (worn start if `tyres_short`), Teo fades, Cassian races clean here (no straight to block on) | The Gull road at night; the pit lane drill |
| **6.** Chalk, pit drill | The pit, the Gull Bend, the choice, the lamp, the line | The ending |

### The lamp that means something
The Gull Bend has a lamp post on its inside, a checkpoint like every other. In race 2 it goes dark the moment Aldo's lights do (the one lamp in the dream that unlights). In race 3 it is unlit from the start, the only dark lamp on the road, and it lights when Jo passes it: the chime, and Ottavia says nothing for once. In race 6 it is lit from the start, and it is where Cassian's car stops. A test pins all three states.

### The radio and the pit board
Ottavia's captions stay the voice (today's `RADIO` table, kept in shape **[checked RaceScene.js:45-59]**; the Space and SLING lines go). New: a **pit board** sprite at the pit wall on the start straight, a slate with one word or a gap, shown as Jo passes it each lap: `P2 +1.4`, `HOLD` (orders), `TYRES` (grip under 0.4), `LIFT` (two lifts heard), `ALDO` (race 3, once, as Jo passes the box: Tullio's hand). It is drawn in the game's bitmap type on a plate, in the world, not the HUD.

### Draft lines (the key moments, in the voice that is there)

Race 1, the card, first place: *"First, and you never lifted."* (exists). New, on the crest: **OTTAVIA:** "Right, over the top. Trust the board. You will not see it."

Race 2, the quay straight: **ALDO:** "Stay in my air. Don't look at the water." Then **OTTAVIA:** "You are in his air. Now out, and she sings." At the Gull Bend: **ALDO:** "Wide. I'm wide." Then nothing. Then, after the dark: **OTTAVIA** (caption, no name): "…" Then the garage.

Race 3, the grid: **OTTAVIA:** "The lamp at the Bend is out. Nobody has been up to fix it." At the lamp: the chime, no line. The card, first: *"First. I heard you lift once, at the Bend. I would have too."* Marta, if Jo rubs her: **MARTA** (pit board, next lap: none; the card): *"Soli held her line. She always does. That was yours."*

Race 4, Dante ahead with orders: pit board **HOLD**. If Jo passes: **OTTAVIA:** "That was the paper you signed. I read it. I read everything now." If Jo holds to the line: **OTTAVIA:** "You held. He will put that in the paper too." Cassian's first tell: **OTTAVIA:** "He has seen you. He will shut the door. The door is not in the bend."

Race 5, the grid, tyres short: **OTTAVIA:** "They are last month's. I said what the jar said. Brake early and they will last." Teo fading: **OTTAVIA:** "Brasca's gone off his tyres. Told you. Let him come back to you."

Race 6, the grid: **OTTAVIA:** "Two laps. The box at the end of the first. Stop with your nose on the paint." The pit: **TULLIO** (board): `GO`. Lap 2, the Gull Bend, the crack: **OTTAVIA:** "That's a wheel. That's his wheel." If Jo stops: **CASSIAN** (caption): "Go. Go on, I'm up. Go!" **OTTAVIA:** "Eight seconds. Drive." If Jo passes: **OTTAVIA:** "…Drive." The line: the engine note alone, one clear note, and **OTTAVIA:** "That's it. That's dead on."

The ending (the framework's `EndingSequence`, `ending.lines(F)` **[checked EndingSequence.js:10,96]**): the orb is the note. Lines from the flags, one each: the tyres (kept or given), the chair (gloves left), the jars (rent short or paid; medicine), the papers (whole or struck; orders held or broken), the marks (chalked or not), Cassian (helped or passed), the place. No score as glory. Last line, always: *"Forty years later she still says it. A quarter-tone flat. Nobody asked."*

### Existing text that must change
- `RADIO.lights`, `RADIO.armed`, `TOUCH_RADIO` (Space, SLING): the sling has no key. New: `armed: "You are in his air. Out, when you're ready."`
- `hud.set('objective', 'beat the black Corsa to the line')` and `cardLines`'s "The Corsa": per track, from the rivals present **[checked RaceHud.js:50, RaceScene.js:66]**.
- `costliest`'s "Rubbing the Corsa": "Rubbing him".
- `dreams.js` racer entry: `unfinished: true` goes in the last stage; `BOARD_WORD.racer` stays FAST.
- `beats.js` `pit_done` else-branch: "Three seconds a miss" now true in race 6 (the stop is 3 s clean, 5 s otherwise); the line can stay.
- `objectives.written` ("the Coppa is still being written: back to the station") goes; `to_race6`: "the Coppa: the Heron is at the shutter".

## 4. The tech design

### The road: segments and a projection, in code, no textures for the road itself

`src/engines/road.js` (new, pure, vitest):
- A track is written as a list of pieces: `{ straight: 200 }`, `{ bend: 'R', len: 90, safe: 24, outside: 'straw' | 'wall', hill?: +6 }`, plus a list of things at distances (lamps, boards are derived, carts, goats, oil, puddles, the crossing, the pit box, the lamp that goes dark). `compile(track)` turns it into segments of **4 m** (1000 m = 250 segments): each has `curve` (signed, in road-widths of drift per segment at full speed, from `safe`: a bend's `curve = K / safe²`, K chosen so a tight 19 m/s hairpin is about 0.9), `y` (height, from hills, eased), and what stands on it.
- `project(camera, segment, playerX, playerZ)`: the classic pseudo-3D projection: camera height 1.4 m behind the car, a horizon at 42 percent of the screen, field depth 0.84; each segment's screen `y` and `scale` from its distance, its screen `x` from the accumulated curve (`dx += curve`, `x += dx`, per segment from the player out). Pure arithmetic on numbers, so a test can pin that a 24 m/s bend's inside edge lands within the screen and a hill crest hides the segments behind it (`y` smaller than the last drawn `y` is skipped, which is what hides the bend).
- Draw distance 60 segments (240 m, 6.7 s at the top speed). The fog and the night cut it.

`src/dreams/racer/race/RoadView.js` (replaces `RaceRoad.js`): one `Phaser.GameObjects.Graphics` cleared and refilled each frame, back to front: sky plate (two `rectangle`s and a painted sky strip as today's `paintSky` does, reused **[checked painted.js:656]**), the far land (two of the existing `coast_*` painted layers, parallaxed by the curve, as the quay rooms use them: kept), then per segment three trapezoids: verge, road, the kerb stripe on bend segments, alternating light and dark every 2 segments for the sense of speed. Puddles and oil are darker quads on the road segment. Chalk ticks are 2 px quads. About 60 segments by 3 fills is one Graphics batch; Phaser flushes a Graphics as one draw call unless a texture interrupts it **[assumed from Phaser 3's WebGL batcher; measure]**.

Sprites: a pool of 48 `Image`s for roadside things (poles, bales, boards, lamp posts, chevrons, carts, goats, the crossing's gate and train, the pit counter, bunting, the finish gantry), each a canvas painted in code at two sizes (near about 200 px, far 64 px) and added with `textures.addCanvas` under a `race-` key, freed on leaving (today's `freeTheme` pattern, kept). Cars: rear view, five liveries by three steer frames (straight, left, right) by two sizes, painted in code in `race/carArt.js` by the same rules as `carKit.js`'s side view (cream Heron, black and gold Corsa, white and blue, mustard and dented, cream with a red number). The garage and the pit lane rooms still use the side-on `cars` pack frames **[checked verbs/garage.js:105-115]**: the pack is unchanged. Jo's car is one Image at the bottom, nearly 300 px wide at scale 1, with a 2 px squat on the throttle and a nose-down on the brake, a 3 degree lean on steer, and the wheels drawn into the frame (no separate wheel spin in a rear view; the kerb stripes carry the motion rule).

Budget: no new pack art, so the packs stay at 76.4 MB. Runtime canvas textures: about 1.5 MB per race theme on the GPU **[assumed: 60 small canvases plus 30 car frames]**, freed on leaving. Measure with a new `racer-textures` scenario: the byte size of every `race-*` texture while racing (under 6 MB) and that none exists after leaving to the garage. Frame time: `racer-frame-time` kept, same budget (avg under 8 ms, p95 under 12 ms on the dev Mac, as today's 2.1 and 4.6). The slowed-CPU case: if the last ten frames averaged over 14 ms, the view draws every second segment beyond 20 (30 fills instead of 60) and halves the roadside pool; the engine never changes (fixed 120 Hz steps with the 50 ms cap, as today). On touch, the view starts in that mode and leaves it only when ten frames average under 9 ms.

Resolution: the canvas is 960 by 540 (`GAME_W`, `GAME_H` **[checked touchLayout.js:17]**, not 480), with the UI on its own camera. Text is the bitmap type via `uiText` on plates, as the HUD does today.

### What happens to the engine and the scene

`src/engines/race.js`, rewritten in place, same shape (a `Race` with `advance(input, ms)` at fixed 120 Hz, `events`, `drain`, `alpha`), same tests driving it with bots:
- **Stays**, near-verbatim: `TUNE` as the one table, `gripFactor`, `gripBand`, `brakeDistance`, `revs`, `draftBeat` (the lane term becomes `(jo.x - r.x) / 0.25`), `raceLost`, `newCar`, the launch window, the drum fade, the lift count, `spin`, `recover`, `toLamp` with `lampRivals`, `drafts`, `checkFinish`, the hit-stop and ghost rules, `costliest` and all of `result.js` and `car.js`.
- **Goes**: `y` as a lane, `lane`, `fromLane`, `laneTime`, `changeLane`, `lineOf`, `bendSafe`'s lane term, `bendLen`, `slipSteer`, `rivalInput`'s lane logic, `ahead()` per lane, the `sling` input.
- **New**: `x` in road widths (0 the middle, ±1 the edges, ±1.25 the straw or wall), `steer` in −1..1 (analog if a pad gives it, −1/0/1 from keys and touch), the lateral step (§5), rivals in `src/engines/rivals.js` (pure: the four styles above, each a function of the race's state to `{ throttle, brake, steer }`, plus the block tell as an event), `cue` events for scripted moments (`track.cues: [{ d, id }]`), `script.js` per race for the few things that are not data (Aldo's drift, the wheel).
- The engine keeps a bend's `safe` as data (as now) and derives `curve` from it; over the limit the car slides outward (today's `slipPush`), under it the curve pulls outward at a fifth of that, which is the "hold the wheel" feel.

`src/scenes/RaceScene.js`, kept as the owner of menus, saves and audio; the drawing moves out:
- **Stays**: `create`'s wiring, `update`'s input and hit-stop, `onEvent` (fewer cases), `radio`, `saveFlags`, `onFinish`, `showCard`, `openPause`, `askAgain`, `restartFromLamp`, `restartRace`, `leaveToGarage`, `leaveToStation`, `teardown`, `updateAudio`.
- **Goes**: `buildTrackside`, `makeCar`, `renderWorld`, `drawAir`, `drawCar`, `puff`'s lane maths, the bank and lean camera, `viewAhead`.
- **New**: `this.view = new RoadView(this, track, race)` with `view.update(dt)`; `this.cueHandler` from `script.js`; the pit board; the touch profile's new layout.

The view reads the engine; the engine never reads the view. Bots run the engine in node. Any number a test pins lives in `TUNE` or a track.

## 5. Feel numbers (starting values, for tuning)

| What | Value | Note |
|---|---|---|
| Top speed, pull, brake, coast, drum fade | 36 m/s, 8.5, 8, 0.6 + 0.0025 v², 2.5 to 5 s to 0.7 | as today, kept |
| Steer rate | 1.3 widths/s at the top speed, times (0.35 + 0.65 v/vMax) | slow cars steer less, so parking is calm |
| Curve pull, under the limit | 0.2 × curve × (v/vMax)² widths/s outward | the wheel must be held |
| Slide, over the limit | `slipPush` 0.22 widths/s per m/s over; `slipScrub` 0.6 m/s² per m/s over; steering fights it at half rate | from today's lane numbers, scaled to widths |
| Verge, |x| over 1.0 | drag 4 m/s², grip −0.04/s, dust | a mistake you can drive out of |
| Straw, |x| over 1.25 | speed ×0.6, grip −0.1, x set to 1.2, one hit per bend | as today |
| Wall, |x| over 1.25 | spin, 3 s to the lamp, rivals rewound | as today |
| Draft | 1.5 to 4 lengths, |Δx| under 0.25, fill 1.2 s, +6 percent, leak 0.25/s | as today |
| Sling (on breakout with a full bar) | +18 percent for 2 s, pull ×1.8, cool 4 s, needs v over 10 | as today, no key |
| Tyre wear | brake 0.02/s over 12 m/s; slide 0.015/s per m/s; verge 0.04/s; straw 0.1; bale 0.03 | `gripMin` 0.75, soft 0.85 |
| Lamps | every 250 to 350 m, one per bend's entry at least | spin cost about 2.3 s |
| Rival tops (× vMax) | Cassian 1.0, Marta 0.95 (bend ×1.06), Teo 1.02 then 0.9 when bald, Dante 0.97, Aldo as Jo | rubber band ±0.06 on top |
| Cassian's block | tell at t; the move starts at t + 0.45 s; across in 0.8 s; not in a bend or 60 m before one; not within 4 s of the last | the test pins ≥ 0.4 |
| Cassian's mistake | 3 s in his draft, then he brakes 8 m early for the next bend, once per race | the gap you are given |
| Launch | gas tapped within 0.35 s after the green: pull ×1.25 for 2.5 s; gas held before the green: a 0.3 s bog | replaces the Space tap |
| Hit-stop | rub 40 ms, hit 80 ms, spin 90 ms | as today |
| Camera | horizon 42 percent; car's screen y fixed; a 2 percent zoom-out at the top speed; shake 0.003 to 0.014 by event; the land parallax follows the curve at 0.1 and 0.35 | the car never moves on screen except its lean and squat |
| Hills | Pinewood's crest +6 m over 80 m; Terraces −12 m over the three hairpins; none elsewhere | optional: if the crest costs feel, flatten it and keep the board |

## 6. Restarts, lamps, HUD, touch, audio

**Restarts.** Unchanged in rule: pause gives Resume, Restart from the lamp, Restart this race, Back to the garage, Back to station. A spin hands the car back at the lamp at 12 m/s with a 1 s ghost. The grid is the lamp before the first one. The result is saved on the line before any card (kept).

**HUD** (bitmap type, plates, as today's `RaceHud`): the speedo bar with the next bend's speed notched; the call, one line: `RIGHT 150 M: 70 KM/H`, counting down in the boards' 50 m steps; GRIP (shown once it leaves green, or from the start on races 5 and 6) and DRAFT meters; `P2  0:41.3`; the race strip with every car's dot and the lamps; the lights; Ottavia's caption. Gone: the sight strip (the road is in view). The static plates fade after 5 s (kept).

**Touch** (`layoutRace`, rewritten): right thumb GAS (tall, at the edge) and BRAKE beside it, as today **[checked touchLayout.js:109-118]**; left thumb a wide **steering slab**: two halves, left and right, with a dead strip of 12 px between; a thumb that slides across it changes side without lifting. Pause stays top-left. Taps answer cards. `?touch=1` tests it with synthetic touches (today's `racer-touch` scenario, rewritten).

**Keyboard and pad.** Left/Right or A/D steer; Up/W or Shift gas; Down/S or Ctrl brake; Esc pause. Pad: `ax0±` steer (analog, dead zone 0.18), `b7` or `b0` gas, `b6` or `b1` brake, `b14`/`b15` as steer too. The existing `InputMap` reads `ax<n>±` **[checked InputMap.js:76]**, so a pad that gives its d-pad as an axis is a binding line, not code: add `ax9` hat values only if a builder has such a pad to test; otherwise skip.

**Audio.** The engine synth stays the music on track: `EngineSynth` with up to three audible cars, pitch by `revs`, pan and gain by `dx` **[checked engineSynth.js:9-49]**. Add: the untuned 2 Hz beat (two detuned voices on Jo's car when `!tuned`, the garage's own TUNE numbers), the tyre squeal by slide, the verge's gravel noise, Cassian's tell as a short horn sting, the crossing's bell, the wheel's crack, the finale's single note (the engine's voice held at one pitch for 2.5 s with the detune at zero). No music bed in races: stings only (`gate`, `lamp`, `fail` exist). Between races the felt piano stays. **Checked silently**: `racer-engine-offline` and `racer-beat-offline` render the real graph offline and assert level and pitch; extend them with the untuned beat (the signal's envelope shows a 2 Hz modulation) and the final note (one peak in the spectrum). Nobody passes `?sound=1`; nothing sets `dreamcatcher.devSound`.

## 7. How the bots verify it

| Promise | Where | What it asserts |
|---|---|---|
| A bot can finish every race without touching anything | `tests/race.test.js` `tidy bot` | For each of the six tracks and `test`, a bot that brakes at `brakePoint` and steers to hold x at the inside third finishes with `rubs`, `spins`, `offroads` all 0, and passes the gate against the real rivals |
| A bot that never brakes does not win the hard bends | `tests/race.test.js` | On tracks 3 to 6 a flat-out bot spins or straws at least once per wall bend and finishes behind the tidy bot by 3 s or more |
| No line wins everywhere | `tests/race.test.js` | On race 1, a hug-the-inside bot and a run-wide bot each beat the other on at least one bend (the loan has two answers) |
| Cassian's tell is at least 0.4 s | `tests/rivals.test.js` | Time from the `block_tell` event to the first step his x moves towards Jo's is ≥ 0.4 s, over 50 seeded races; never in a bend; never twice within 4 s |
| Only Cassian blocks | `tests/rivals.test.js` | Marta, Teo, Dante and Aldo never emit `block_tell` and never move towards Jo's x while he is in their draft |
| Teo fades | `tests/rivals.test.js` | His grip is under 0.3 by two thirds of race 5, and his top is 0.9 after |
| The restart is fair | `tests/race.test.js` (kept) and `racer-fail-fair` (kept) | A wall is back at the lamp, driving, within 3 s; rivals rewound to the lamp; the clock not |
| Race 2 cannot be failed | `tests/script.test.js` and `racer-tragedy` (new) | Any input stream (none, flat-out, brake only) ends with the dark and `done_race2`; no `finish` event |
| The Gull lamp | `tests/script.test.js` | Dark after Aldo's cue in race 2; dark at the start of race 3 and lit on passing; lit from the start of race 6 |
| The finale's choice | `racer-finale-brake`, `racer-finale-pass` (new) | Both reach the ending; `helped_cassian` or `passed_cassian` set; the stop costs 8 s ± 0.5 |
| The pit box | `tests/script.test.js` | Stop in the box 3 s (2 s with `pit_clean`); short or long 5 s; through: grip 0.4 |
| Touch works | `racer-touch` (rewritten) | Synthetic touches on the slab's halves steer; GAS moves; BRAKE stops; a slide across the slab changes side without a lift |
| No stuck state | `racer-pause`, `racer-again`, `racer-spin-pause` (kept, re-aimed), `racer-quit-anywhere` (new) | Quit to garage and to station from the grid, a spin, the dark, the card, the pit, the choice: the next scene is live and the run resumes at the garage lamp |
| Old saves | `tests/racerSeason.test.js` | A run with `done_race1..3` and `race_test_*` flags continues at race 4 on the Salt Road; `prizeOwed` pays per track; no flag is read that an old run lacks |
| Textures and frame time | `racer-textures` (new), `racer-frame-time` (kept), `speed-budget` (kept) | §4's numbers; the packs' total unchanged |
| Audio by numbers | `racer-engine-offline`, `racer-beat-offline` (extended) | §6 |
| Length | `racer-length` (new) | The tidy bot's six races total under 6:30 of race time |

**Replaced or dropped**: `racer-draft`, `racer-touch`, `racer-sight-strip`, `racer-bend-visible`, `racer-beat`, `racer-card`, `racer-hud-diet` rewritten for the new view; `racer-theme`, `racer-coast-props` dropped (side-on art). `tests/race.test.js` rewritten (lane tests go, the rest re-aimed); `tests/raceResult.test.js` kept; `tests/racerSeason.test.js` extended.

**Save compatibility.** No format change: flags only. `HOOKS` entries get real track ids (`pinewood`, `harbour`, `gull`, `salt`, `terraces`, `coppa`) and a `gate` per race; `applyResult` sets `done_<hook>` only when the gate passes (the stand-in shortcut goes); a sixth hook `race6` with `needs: ['pit_drilled']`. `payPrize` walks every track id instead of `STAND_IN`. A player mid-season under the stand-ins keeps `done_raceN` and goes on to the next real race; `race_test_*` flags stay unread and harmless.

## 8. Build order

Each stage is playable and mergeable alone, sized for one builder. At most 2 browser builders and 1 without at a time. Every builder: read this file and `docs/dream_racer.md` §1, §2, §7; dev stays silent (`dev-silent`); after each stage a designer and a pro gamer review until converged (`review-loop`).

| Stage | Builder | Browser | Files | Skills |
|---|---|---|---|---|
| **A. The engine** | 1 | no | `src/engines/road.js` (new), `src/engines/race.js` (rewrite), `src/engines/rivals.js` (new, stub styles: `clean` only), `src/dreams/racer/race/tracks.js` (the new format, `test` and `pinewood`), `tests/road.test.js`, `tests/race.test.js` | `disciplines:physics-tuning`, `game-balancing` |
| **B. The view and race 1** (after A) | 2 | yes | `src/scenes/RaceScene.js`, `src/dreams/racer/race/RoadView.js` (new; `RaceRoad.js` and `themes.js` deleted), `race/carArt.js` (new), `race/RaceHud.js`, `src/input/touchLayout.js`, `src/dev/scenarios/racer.js`; `verbs/garage.js` loses `paintSteps`/`freeTheme` | `disciplines:game-feel`, `disciplines:camera-systems`, `disciplines:input-systems`, `pixel-art-sprites`, `disciplines:performance-optimization` |
| **C. Rivals and tracks 2 to 6** (after A, parallel with B) | 3 | no | `src/engines/rivals.js` (all four styles, the block, the mistake, the fade), `race/tracks.js` (all six), `race/script.js` (new: cues and the three scripts as pure state machines), `tests/rivals.test.js`, `tests/script.test.js` | `disciplines:game-ai`, `disciplines:level-design`, `game-balancing` |
| **D. Rivals, hazards and weather in the view** (after B and C) | 2 | yes | `RoadView.js`, `carArt.js`, `RaceScene.js` (events, the pit board, the air streaks), `src/audio/engineSynth.js` (beat, squeal, tell, note), `scenarios/racer.js` | `disciplines:game-feel`, `disciplines:audio-design`, `disciplines:game-ai` |
| **E. The season and the ending** (after C; parallel with D, touching no view file) | 3 | yes | `src/dreams/racer/season.js`, `dialogue.js`, `beats.js`, `dream.js` (ending, objectives), `verbs/garage.js` (`payPrize` per track, the Coppa door), `rooms/quay.js` (the gull and pit doors on `done_race5`, already), `src/data/dreams.js` (`unfinished` off), `tests/racerSeason.test.js`, `src/dev/scenarios/racerPlaces.js` (`racer-tragedy`, `racer-finale-*`, `racer-quit-anywhere`, `racer-length`) | `disciplines:dialogue-systems`, `disciplines:save-systems`, `dreamcatcher-ui-type` |
| **F. Balance and polish** (after D and E) | 1 | yes | numbers in `TUNE` and `tracks.js` only, plus review fixes anywhere | `game-balancing`, `disciplines:game-feel` |

Parallel plan: A alone first (it is the contract). Then B (browser) and C (no browser) together. Then D (browser) and E (browser) together, since E's files are the season's and D's are the view's; E runs races through the real door only to check the flow. F last. Stage E's builder reads the stage 2 review (`advice/racer_stage2_review.md`) for the open text items that touch the ending (S2 money, S4 Sable's clauses) and fixes S2 by giving the money a sink: the wet set for race 5 at 30 nuts (`tyre_wet` flag, grip 0.85 in puddles), soft up to 32, chalk 20.

The `test` track stays through B as the flat tuning road and is dropped in F.

## 9. Questions for the owner

Decided by default; say so if you want otherwise.

1. **Six races at 9 to 10 minutes, or five at about 8.** Default six (§2). Five would drop the Salt Road and fold Cassian's block and the orders into the Terraces.
2. **The sling has no key.** Default: it fires when you leave a full draft. The alternative keeps a fourth touch button.
3. **Hills.** Default: one crest on Pinewood and the drop through the Terraces; flat elsewhere. The alternative is an all-flat road, which is cheaper and loses the hidden bend.

Skipped: I did not read the six `disciplines` skills' files or the stage 1 reports in full, nor run any test or scenario; the Phaser Graphics batching claim and the texture sizes in §4 are estimates to be measured in stage B.
