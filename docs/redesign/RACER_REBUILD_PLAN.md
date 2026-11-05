# The Racer rebuild: the drive and the story

Plan only, revised 2026-11-05 for the owner's four-race season. Nothing here was run. Claims about the existing code are tagged: **[checked]** means I read the file and the line; **[assumed]** means I am inferring. Builders execute this without asking; where a choice is open, the default is stated.

The owner's decisions stand and are not reopened here: behind-the-car view into the screen, a curving road, free steering, the 1958 Calvessa Coast look, a separate driving scene, nuts never buy speed, the engine is the music on track, only Cassian blocks (tell of 0.4 s or more), touch needs steer plus gas plus brake, rivals renamed, Racer only. And now: **four races, each with its own objective from where Jo is in his life, told as a career, and he wins at the end.**

## 0. The one idea

**Every bend is a loan.** The road ahead asks the same question every few seconds: *how much speed do you carry into this?* Brake early and you pay in time. Brake late and you pay in tyres, which is grip you will want at the next bend. Don't brake and you pay in straw (speed and tyres) or a wall (three seconds, back at the lamp). The tyres are the race's only resource, the chalk is Ottavia's answer to the question, and the rivals are different ways of answering it badly. Everything below serves this. Nothing is won by hitting anything.

The journey is the same loan at the scale of a life: a borrowed car, a seat, a loss, a debt, a paper with his name on it, and the one race he has to win.

## 1. The race, minute to minute

### What the player decides, and how often

| Every | Decision | Risk | Reward |
|---|---|---|---|
| 4 to 8 s | **The bend.** A board says LEFT or RIGHT and a speed. Where do I brake, and how hard? | Late: slide wide, scrub tyres, straw or wall | Early: time lost. Right: the car "sings" (a small sting, a clean-bend count on the card) |
| in every bend | **The line.** Free steering: the push throws you outward, you hold against it. Enter wide, hug the inside, let it run out | Hug too early: slower exit. Run out too far: the verge (drag, wear) | A clean line keeps 2 to 3 m/s through the bend |
| 1 to 3 s when near a rival | **The draft.** Sit in his air (1.5 to 4 lengths, within a quarter road) for 1.2 s and the bar fills | He brakes earlier than you expect, and you are on his tail | Six percent while in it; break out with the bar full and the sling fires itself: 18 percent for 2 s |
| when the bar is full | **Where to pass.** Straight (Cassian blocks there) or the braking zone (nobody blocks there, but it is where the loan is called in) | A pass in a bend over the limit is a slide into him or the straw | The pass sticks |
| per hazard | **Avoid or lift.** A cart in the middle, the crossing's bell, Teo's oil: steer round, or brake | Steering at speed into the verge | No time lost |
| across the race | **Spend the tyres.** The grip bar sits by the speedo. Worn tyres brake longer and slide sooner (never worse than a fair 25 percent; soft tyres 15) | Burn them early, pay in every bend after | Save them, and the last bends are yours while the diver's are gone |

### The rivals, each a different wrong answer

Four people on the road across the season, none in every race, each paying off once in the story and once in the drive.

| Rival | Livery | Style on the road | How you pass him | Races | Story |
|---|---|---|---|---|---|
| **Aldo Pereval** | cream, red number (the team's first car) | Holds 2 to 3 lengths ahead of Jo whatever Jo does (`station`, with Jo as the station). The first draft you learn | You don't. You follow | 2 | The mentor. His lights go out at the Gull Bend |
| **Teo Brasca** (was Bruno Varga) | mustard, dented | **Dives** into any gap, weaves behind you (plus or minus a quarter road), rubs. Wears tyres at twice the rate and fades to top 0.9 once bald, about two thirds in. Drops **oil** where he braked hard (a 0.6 s wobble, recoverable) | Don't. Wait. He comes back to you | 2, 3, 4 | The late move Jo "saw" at the Harbour. The hazard that tires out |
| **Dante Mir** | cream and teal, red number | Teammate, `clean`: holds his line, top 0.97, never blocks. In race 3, if Sable's orders stand, the pit board says HOLD while he is ahead | Pass him and `broke_orders` is set | 3, 4 | Whose car it is. The second car Jo drove in race 1 is his after |
| **Cassian Roche** | black and gold | Smooth, fast. **Blocks**: when you are in his draft on a straight he looks in his mirror (the tell: brake lamps flash twice, his helmet turns), then 0.45 s later moves across to your side of the road over 0.8 s. Never in a bend, never twice within 4 s. If you sit in his air for 3 s he **brakes 8 m early** at the next bend: the gap | Under braking, after the tell: stay in his air to the braking board, then the inside | 3, 4 | Rich, never told no. His car fails at the Gull Bend in the Coppa |

Cut: Lena Aurelio / Marta Soli, the clean rival who never had a race of her own with four. Dante carries "clean" and the `clean` style stage A builds is his. Rubber band: 6 percent at most, on top speed only, and visible: the HUD's rival dot and a pit-board gap, never a car that magically closes in a bend.

### Hazards, each with a reason to be there

| Hazard | Race | What it does | Why it is there |
|---|---|---|---|
| Hay cart | 1, 3 | Stopped in the road, 3 m long. Fast: spin to the lamp. Slow: a bump and a stop | Closed public roads; a farmer did not hear |
| Straw bales | all bends | On the outside; soft: 40 percent of speed and some tyre, back onto the road | The only safety there was |
| Stone wall | 2, 4 (the Gull Bend's outside) | Spin, dark, back at the lamp in 3 s | The cliff road |
| Level crossing | 3 | Bell and red lamps 3.5 s ahead, the gate closes for 4 s, a drawn train crosses. Arrive at a shut gate: a bump and a stop (never a spin). Brake and wait, or make it | The Salt Road is a real road |
| Oil | 3, 4 | Teo's, where he braked. A 0.6 s wobble | His sump |
| Headlight pool | 2, 4 | Night: draw distance halves outside lamp pools; the quay and the pit straight are lit | The Harbour and the Coppa are night races |
| Cassian's wheel | 4, lap 2 | His car sheds a wheel at the Gull Bend, slews into the straw; a dry crack, a puff of smoke, no flag yet | The finale's choice |

Cut with the six: fog, goats, rain and puddles. The tyre lesson they carried moves to race 3's worn start.

### What changes the feel between races

- **Tuning by ear.** Untuned (no `tuned` flag): the engine note carries a 2 Hz beat (two oscillators, as TUNE's bench does), the tacho needle flickers, and after 60 percent of the race the HOT meter reaches red and top speed drops 4 percent. Tuned: a clean note. The warning exists today **[checked RaceScene.js:101,135,246]**; the beat in the note and the 4 percent are new.
- **Tyres.** Stock: `gripMin` 0.75. Soft (bought, or Aldo's set kept): 0.85. `tyres_short` from the kitchen: race 3 starts at grip 0.6 (the worn band). The rack's price logic stays **[checked season.js:55]**.
- **Chalk.** Bought, or the whisper after three tries: a chalk tick on the road at every braking point from the top speed (today's `chalkAt` **[checked race.js:112]**, one mark instead of one per lane), plus the player's own three marks from the Night Before at the Gull Bend in race 4.
- **Light across a race.** Race 2 goes dusk to night with distance (the sky's three colours interpolate by `d / length`; lamp pools grow). Race 4's second lap has the dawn coming up behind the cliffs. Palette interpolations in the road painter, no new art.
- **The car.** Race 1 is the team's second car (the `dante` livery, red number, borrowed). From race 2 it is the Heron with the teal roundel. In race 4 she carries SABLE OIL on the bonnet if that clause stood, and the chalk.

### Comebacks and failing

- **Lamps** every 250 to 350 m. A spin is 3 s of dark, then back at the lamp with the rivals where they were when you passed it (today's `toLamp` and `lampRivals`, kept **[checked race.js:501-524]**). The clock does not rewind, so a spin costs about 2.3 s, never the race.
- Below the objective: "He has the road and you have the next try", one key to go again (today's `askAgain` and card, kept). After three tries short, the whisper: chalk on every brake point. Never called easy.
- **Lost early** (`raceLost`, kept, now against the race's gate): Ottavia asks on the dark frame; Drive on is always allowed.
- **Race 2 cannot be failed.** It is the one race you cannot lose, because losing it is the story.

### Cut, on purpose

- The **sling key**. The sling fires itself when you leave a full draft. One less button on a phone, and the decision ("when do I pull out") is the same.
- **Lanes**, the lane buttons, the sight strip, `lineOf`, `bendLen`, lane-scaled sprites.
- The **Nerve ring**, breath, tunnel vision. Fear is the dark and the dark lamp at the Gull Bend (§3), not a meter.
- **Fuel and heat** as a gauge. The pit stop stays (a box you must brake into), fuel does not.
- **Gears, a shift light.** One long pull, as today.
- The **four-key pit rhythm** inside a race. The crew's drill lives in the pit lane room and sets `pit_clean`; in race 4 the stop is a braking test (§2).

## 2. The season: four races, four objectives

Each objective is what Jo needs from that day of his life, and the engine checks it. None could be swapped with another's. The gate is in the track as `gate: { time } | { place } | { scripted: true }`.

| # | Track | Life | Objective (the gate) | Light, length | New | Shape | Hazards | Rivals |
|---|---|---|---|---|---|---|---|---|
| 1 | **Pinewood hill-climb** | A stranger with good hands and no seat. Aldo lends him the second car for the morning | **Earn the seat: under Aldo's time on the sheet** (`time <= target`, 0:34 on 800 m, the bots find it) | day, 800 m, 0:35 | steer, gas, brake, the boards, the push in a bend | two sweepers, a crest that hides a tight right, a short run to the line | one cart | none; Aldo at the start, watching |
| 2 | **Harbour Night Cup** | His first start for the team. One new set of tyres in the building, his or Aldo's | **Stay in Aldo's air to the Gull Bend** (`held_aldo`: the draft bar full at the cue; not failable, it sets a line) | dusk to night, 1200 m, 0:50 | the draft, the sling by breaking out, night | the quay straight, the Gull Bend (a long right by the wall), the harbour hairpin | night, wall | Aldo ahead, Teo behind |
| 3 | **The Salt Road Cup** | Aldo is in the hospital. The rent, the medicine and the tyres want sixteen and the tin has twelve. Sable's paper has his name on it | **On the sheet: top 3, because the sheet pays** (`place <= 3`), on the tyres the jar left him, holding station behind Dante if the orders stood | noon glare, 1500 m, 1:00 | Cassian's block and its tell, team orders, worn tyres, the crossing, a diver who fades | flat, two long straights, a chicane, the crossing, then the hairpin drop to the line | crossing, cart, Teo's oil | Dante, Teo, Cassian |
| 4 | **The Coppa Calvessa** | Whose car it is. The debts at thirty days if Sable's lien stood. The chalk, the drill, the Bend | **Win** (`place === 1`) | night to dawn, 2 laps of 1000 m plus the pit, 1:35 | the pit box, the whole coast at night, the wall, the choice | the pit straight, the harbour hairpin, the Salt straight, the terraces S, the Gull Bend, the line | lamp pools, oil, the wheel | Cassian, Teo, Dante |

Why four races is enough: each race has a different verb (beat a time, follow, hold a place under pressure, win), the life between them carries the rest, and the whole dream fits the middle of the bar. At a tidy bot's pace the four races take about 4:00; the walk-in places about 3:20 (the stage 2 report's figures), so a first play is **about 7:30 plus retries**, where the Musician sits (7 to 9, `MUSICIAN_REPORT.md:76`). Only races 1, 3 and 4 can cost retry time.

**Race 1 in detail** (the feel is everything; this is the track stage A and B tune on; unchanged from the six-race plan). Board at 150, 100, 50 m before each bend, a chevron line through it. The first bend's board says BRAKE NOW once (today's `teachBrake`, kept). The crest at 520 m: the road rises 6 m over 80 m, and the right-hander's boards start on the climb, so the player must trust the board before seeing the bend. The cart at 300 m, mid-road, visible 150 m out. The gate is the time, not a place: a slow clean run is "not yet", with Aldo's time and Jo's on the card. Three tries short and the chalk whispers.

**Race 2** is a script on top of a real drive: Jo drives; the engine emits `cue` events at distances; the scene turns them into radio lines and the lights. Aldo's car holds 2 to 3 lengths ahead at Jo's pace whatever Jo does, so the draft fills and the first sling is taught on the quay straight. Teo passes Jo on the harbour hairpin's exit (the late move Jo "saw"). At the Gull Bend (d 1040 m), Aldo's tail lamps drift to the outside over 1.5 s, go out, his engine note stops, dust in the headlights, and the race ends there: no finish line, no card, a 2 s hold on the dark, then the garage with `done_race2`. The player's only input in the last 3 s is the brake; the car stops by the verge on its own if not. `held_aldo` is true if Jo's draft bar is full (or he is in the draft) at the cue, and it changes one line in the corridor.

**Race 3 in detail.** The grid is four cars: Cassian on pole, Dante second, Jo third, Teo fourth. Worn tyres (`tyres_short`) start at grip 0.6 and show the GRIP meter from the lights. If `sable_orders`: the pit board says HOLD each time Jo passes it while Dante is ahead; passing Dante sets `broke_orders`, and the orders cost nothing on the clock: holding behind Dante still reaches P3 (Dante is P2 behind Cassian at a tidy pace), so the objective is met either way, and the difference is money and a line. Cassian blocks on the two straights; his mistake comes at the chicane. Teo is bald by the crossing and fades. The crossing's gate shuts for 4 s once, timed so a car at the top speed from 180 m out makes it and a car that braked for the cart does not: brake and wait, or go. The prize (`prize: { 1: 18, 2: 12, 3: 8 }`) pays the rent line in the kitchen's reckoning (§3).

**Race 4 in detail.** Lap 1 ends at the pit box (a painted rectangle on the pit straight, 12 m long): brake to a stop with the nose in the box and the crew's 3 s pass (2 s with `pit_clean`); stop short or long and it is 5 s, while the board says SHORT or LONG; drive through and Ottavia says "You have no tyres for a second lap" and grip drops to 0.4. The rivals pit on the same lap for 3 s each, by script. On lap 2, at the Gull Bend, Cassian's wheel goes when he is within 60 m ahead of Jo (the script waits for that, up to the bend's exit; if Jo is ahead of him by then, Cassian goes off behind Jo and the choice is whether to stop at all). Hold the brake to a stop within 40 m of his car: Jo pulls up, runs back, Cassian waves him off, two marshals arrive, **6 s** on the clock, `helped_cassian`. Drive through: `passed_cassian`. Either way the lamp at the Gull Bend lights, and the last 300 m to the line.

**The win is always reachable, whatever the choice.** The script and the rival numbers guarantee it: Teo is bald and at top 0.9 by lap 2; Dante is top 0.97 and pits like everyone; so a tidy run is 9 s or more clear of both at the wheel cue, and the 6 s stop leaves 3 s. `tests/script.test.js` pins that the tidy bot wins both branches by 1.5 s or more. A run that is not near the front at the cue (Cassian out and still P2) is "not yet", and it is run again: the Coppa cannot end in a loss because the story does not go on until it is won.

## 3. The story: a career in four days

### The journey, beat by beat

| | Life | The drive | After |
|---|---|---|---|
| **Nothing** | Jo is the stranger with good hands. Ottavia: tune by ear or run hot. Aldo: "A stranger with good hands is all this garage can afford." The second car, borrowed, red number | **Race 1.** Aldo's time. Ottavia on the radio; Aldo at the start in his jacket | The card: the seat, or not yet. Aldo's offer: the one set of tyres, his or Jo's |
| **The start** | The Heron is his. The soft set, kept or given. Ottavia: a hair flat tonight, Aldo | **Race 2.** Follow him. The quay's lamps, the draft, the sling. The Bend. The lights go | The morning after: the sheeted car, the gloves on the bench. Nino cannot take them up |
| **The loss** | The corridor: Aldo behind a shut door, the gloves on the chair, Ottavia's confession. The kitchen: twelve coins, three jars that want sixteen | | Something goes short. The Signora says what she says |
| **The paper** | Sable Oil, over the cafe: three papers, strike a clause or take the money. Orders, a fifth, the garage's debts | **Race 3.** The sheet. HOLD on the pit board, or not. Cassian shuts the door; the crossing; the tyres the jar paid for | The prize tin. The rent paid or not. Ottavia's anger, her question: whose car. "She is a hair flat, by the way. Not today. I have fixed it" |
| **The weight** | If the lien stood: Tullio: "Sable has been asking about the debts. Thirty days, he said. The Coppa is in nine." The Night Before: the Gull Bend on foot, three marks. The pit lane: the drill | | |
| **The dream** | The Coppa: the whole coast, bunting on the quay, the pit counter, the gloves on the chair at the pit wall | **Race 4.** Two laps. The box. The Bend, the wheel, the choice. The lamp lights. The line | The one note. **THE LONG STRAIGHT: CAUGHT.** Ottavia at the bench: "That's it. That's dead on" |

### What visibly changes, and what it costs

| What | Race 1 | Race 2 | Race 3 | Race 4 | How |
|---|---|---|---|---|---|
| Jo's car | the second car, red number | the Heron, teal roundel | the Heron, worn-tyre dust on the arches if `tyres_short` | the Heron, SABLE OIL on the bonnet if that clause stood, chalk on the road | `track.joLivery` and two flag-driven paint passes in `carArt.js` |
| The crowd | nobody: bales and a farmer's cart | lamps along the quay, a few figures at the harbour | a stand at the crossing, bunting | eight crowd strips, bunting, the pit counter, a PA murmur | a `crowd` roadside canvas (a strip of painted heads), placed by the track's data; the count is the difference |
| The pit wall | Aldo standing at the start | Ottavia with the radio; Tullio | Ottavia, Tullio, Nino; an empty chair | Ottavia, Tullio, Nino; the chair with the gloves on it | three small painted figures and a chair, one canvas each, listed per track |
| The garage | Aldo's car beside the Heron, his gloves on its cowl | | the sheeted car (exists); Ottavia gone until the corridor (exists) | a Coppa poster on the wall; a Sable banner over the shutter if signed whole | props with `when` flags, as `sheeted_car` already is **[checked rooms/garage.js:38-40]** |
| The quay | | the hospital door opens | the cafe talk: the money, the boy in the black car | bunting, the pit lane and the Gull road open | the doors' `requires` (below); two quay lines keyed on `done_race2` and `done_race3` |

### The walk-in places: what stays, changes, moves or goes

All seven stay; none is added. The journey has its places already; what moves is the order and the gates.

| Place | Fate | Change |
|---|---|---|
| Garage | stays | The door counts for the next hook (four now). `payPrize` pays per track. The poster and banner props. The second-car livery in race 1 only touches the race |
| Quay | stays | `quay>sponsor` requires `jars_done` (was `done_race3`); `quay>gull` and `quay>pit` require `garage_again` (was `done_race5`); `quay>hospital` and `quay>kitchen` unchanged **[checked rooms/quay.js:52-64]** |
| Hospital | stays | One corridor line keyed on `held_aldo` |
| Kitchen | stays | Unchanged; the prize of race 3 answers the rent: after `done_race3`, a Signora line in the garage's prize caption or on the quay: "The rent is paid" if `rent_short` and the tin's prize covers 6 |
| Sponsor | moves earlier | Before race 3, not after. Sable's first line gains the reason: "Pereval Corse has had a difficult spring" already says it |
| Night before | stays | Before race 4, after Ottavia's question. The marks read in race 4 |
| Pit lane | stays | Before race 4. Tullio's lien line lives here when `sable_lien` |

### The season's hooks and goals (the rewrite of `season.js`)

```
HOOKS = [
  { id: 'race1', story: 'Pinewood hill-climb', track: 'pinewood', needs: [] },
  { id: 'race2', story: 'Harbour Night Cup',   track: 'harbour',  needs: ['tyres_settled'] },
  { id: 'race3', story: 'The Salt Road Cup',   track: 'salt',     needs: ['gloves_left', 'jars_done', 'signed'] },
  { id: 'race4', story: 'The Coppa Calvessa',  track: 'coppa',    needs: ['garage_again', 'chalked', 'pit_drilled'] },
]
SEASON_GOALS: tune → drive(tuned) → aldo(done_race1) → drive(tyres_settled) → take_gloves(done_race2)
  → to_hospital(item:gloves) → to_kitchen(gloves_left) → to_sable(jars_done) → drive(signed)
  → ottavia_again(done_race3) → to_gull(garage_again) → to_pit(chalked) → coppa(pit_drilled)
```

`done_<hook>` is set only when the gate passes (the stand-in shortcut in `applyResult` goes). `ottavia_again` plays on `done_race3` (today `done_race4` **[checked rooms/garage.js:59]**). Old flags `done_race4`, `done_race5` are never read again (compatibility in §7).

### The lamp that means something
The Gull Bend has a lamp post on its inside, a checkpoint like every other. In race 2 it goes dark the moment Aldo's lights do (the one lamp in the dream that unlights). In race 4 it is dark from the start, the only dark lamp on the road, and it lights when Jo passes it on lap 1: the chime, and Ottavia says nothing for once. On lap 2 it is where Cassian's car stops. A test pins the three states.

### The radio and the pit board
Ottavia's captions stay the voice (today's `RADIO` table, kept in shape **[checked RaceScene.js:45-59]**; the Space and SLING lines go). New: a **pit board** sprite at the pit wall on the start straight, a slate with one word or a gap, shown as Jo passes it each lap: `P2 +1.4`, `HOLD` (orders), `TYRES` (grip under 0.4), `LIFT` (two lifts heard), `ALDO` (race 3, once: Tullio's hand). Drawn in the game's bitmap type on a plate, in the world, not the HUD.

### Draft lines (the key moments, in the voice that is there)

Race 1, the grid: **ALDO** (caption, at the start): "Thirty-four seconds, I did it in. In that car. Go on." On the crest: **OTTAVIA:** "Right, over the top. Trust the board. You will not see it." The card, under the time: *"Thirty-three eight. He is pretending not to smile. The seat is yours."* Over it: *"Thirty-five one. He says again. He says it kindly."*

Race 2, the quay straight: **ALDO:** "Stay in my air. Don't look at the water." Then **OTTAVIA:** "You are in his air. Now out, and she sings." The hairpin, Teo through: **OTTAVIA:** "Brasca. Let him go. Stay with Aldo." At the Gull Bend: **ALDO:** "Wide. I'm wide." Then nothing. Then, after the dark: the garage.

The corridor, one line added before "A car moved on him, late": if `held_aldo`, **JO:** "I was in his air. I was right there." Else **JO:** "I was back. I saw it from back there."

Race 3, the grid, tyres short: **OTTAVIA:** "They are last month's. I said what the jar said. Brake early and they will last." Dante ahead with orders: pit board **HOLD**. If Jo passes him: **OTTAVIA:** "That was the paper you signed. I read it. I read everything now." If he holds to the line: **OTTAVIA:** "You held. He will put that in the paper too." Cassian's first tell: **OTTAVIA:** "He has seen you. He will shut the door. The door is not in the bend." Teo fading: **OTTAVIA:** "Brasca's gone off his tyres. Let him come back to you." The card, top 3: *"Third. On the sheet. The sheet pays. Go and put it on her dresser."*

Before race 4, if the lien stood, **TULLIO** (pit lane): "Sable has been asking about the debts. Thirty days, he said. The Coppa is in nine. I did not say anything. There was nothing to say."

Race 4, the grid: **OTTAVIA:** "Two laps. The box at the end of the first. Stop with your nose on the paint." The pit: **TULLIO** (board): `GO`. Lap 1, the lamp lights: nothing. Lap 2, the crack: **OTTAVIA:** "That's a wheel. That's his wheel." If Jo stops: **CASSIAN** (caption): "Go. Go on, I'm up. Go!" **OTTAVIA:** "Six seconds. You still have it. Drive." If Jo passes: **OTTAVIA:** "…Drive." The line, first: the engine note alone, one clear note, and **OTTAVIA:** "That's it. That's dead on." Not first: *"Second. The Coppa is not second. Again, and you have it."*

### The ending

The framework's `EndingSequence`, `ending.lines(F)` **[checked EndingSequence.js:10,96]**; the orb is the note. Title: `THE COPPA CALVESSA: WON`. The board: `THE LONG STRAIGHT  CAUGHT`. Lines, one each from the flags, the win first and last:

- *The Coppa Calvessa, 1958: Pereval Corse, first. A garage with one car and a fitter who tunes by ear.*
- Tyres: *He drove it on the set Aldo gave him* / *He gave Aldo the set, and bought his own.*
- The chair: *The gloves were on the chair. Aldo saw them.*
- The jars: *The rent was paid* / *The rent was late, and the Signora never said* ; *and her chest was only her chest.*
- The paper: *Sable's clauses stood, every one* / *He read the paper. Almost nobody reads the paper.* ; if `broke_orders`: *He passed Dante with HOLD on the board, and Sable kept his fifth.*
- The marks: *Three chalk marks at the Bend, and he used every one* / *No chalk. He found the Bend with his foot.*
- Cassian: *He stopped for Roche, six seconds, and won by less than that* / *He went by Roche. Roche was on his feet. He would say so, later.*
- Always, last: *Ottavia heard the note from the pit wall before the flag came down. Dead on. Forty years later she still hears it, and now somebody asks.*

The old bittersweet close ("Nobody asked") goes: it undercut the win. The existing flags all point the right way: nothing in `dialogue.js` assumes a loss; `ottavia_again`'s "He will not drive again" is Aldo, and stands.

### Existing text that must change
- `RADIO.lights`, `RADIO.armed`, `TOUCH_RADIO` (Space, SLING): the sling has no key. New `armed`: "You are in his air. Out, when you're ready."
- `hud.set('objective', 'beat the black Corsa to the line')` **[checked RaceHud.js:50]**: per track, from `track.gate`: "under Aldo's time: 0:34.0", "stay in his air", "on the sheet: top three", "win the Coppa".
- `cardLines`'s "The Corsa" and `costliest`'s "Rubbing the Corsa" **[checked RaceScene.js:66, result.js:65]**: the nearest rival's name, or "him".
- `cardLines`'s "The gate wants first": from the gate.
- `dreams.js` racer entry: `unfinished: true` goes in stage E.
- `rooms/nightbefore.js` comment "race 6 reads them": race 4. `rooms/pitlane.js` "The stop itself belongs to race 6": race 4.
- `objectives.written` goes; add `coppa: 'the Coppa: the Heron is at the shutter'`.
- `corridor.late` stays; the `held_aldo` line goes before it.
- `beats.js` `pit_done` else-branch "Three seconds a miss": now true (the stop is 3 s clean, 5 s otherwise).

## 4. The tech design

Unchanged by the four-race season except where marked.

### The road: segments and a projection, in code, no textures for the road itself

`src/engines/road.js` (new, pure, vitest):
- A track is written as a list of pieces: `{ straight: 200 }`, `{ bend: 'R', len: 90, safe: 24, outside: 'straw' | 'wall', hill?: +6 }`, plus a list of things at distances (lamps, boards are derived, carts, oil, the crossing, the pit box, crowd strips, pit-wall figures, the lamp that goes dark). `compile(track)` turns it into segments of **4 m** (1000 m = 250 segments): each has `curve` (signed, in road-widths of drift per segment at full speed, from `safe`: `curve = K / safe²`, K chosen so a tight 19 m/s hairpin is about 0.9), `y` (height, from hills, eased), and what stands on it.
- `project(camera, segment, playerX, playerZ)`: the classic pseudo-3D projection: camera height 1.4 m behind the car, a horizon at 42 percent of the screen, field depth 0.84; each segment's screen `y` and `scale` from its distance, its screen `x` from the accumulated curve (`dx += curve`, `x += dx`, per segment from the player out). A test pins that a 24 m/s bend's inside edge lands within the screen and a hill crest hides the segments behind it (`y` smaller than the last drawn `y` is skipped).
- Draw distance 60 segments (240 m, 6.7 s at the top speed). The night cuts it.

`src/dreams/racer/race/RoadView.js` (replaces `RaceRoad.js`): one `Phaser.GameObjects.Graphics` cleared and refilled each frame, back to front: sky plate and a painted sky strip (today's `paintSky`, reused **[checked painted.js:656]**), the far land (two of the existing `coast_*` painted layers, parallaxed by the curve), then per segment three trapezoids: verge, road, the kerb stripe on bend segments, alternating light and dark every 2 segments. Oil is a darker quad; chalk ticks are 2 px quads. About 60 segments by 3 fills is one Graphics batch **[assumed from Phaser 3's WebGL batcher; measure]**.

Sprites: a pool of 48 `Image`s for roadside things (poles, bales, boards, lamp posts, chevrons, carts, the crossing's gate and train, the pit counter, bunting, crowd strips, pit-wall figures, the chair, the finish gantry), each a canvas painted in code at two sizes (near about 200 px, far 64 px), added with `textures.addCanvas` under a `race-` key, freed on leaving (today's `freeTheme` pattern). Cars: rear view, four liveries (heron, dante/second car, roche, brasca) by three steer frames by two sizes, in `race/carArt.js` by the side-on kit's colours; the Heron gains two flag-driven passes (dusty arches, the Sable name). The garage and pit lane rooms still use the side-on `cars` pack **[checked verbs/garage.js:105-115]**: the pack is unchanged. Jo's car is one Image at the bottom, about 300 px wide, with a 2 px squat on the throttle, nose-down on the brake, a 3 degree lean on steer, wheels drawn into the frame (the kerb stripes carry the motion rule).

Budget: no new pack art, so the packs stay at 76.4 MB. Runtime canvas textures about 1.5 MB per race on the GPU **[assumed]**, freed on leaving. Measure with `racer-textures` (new): every `race-*` texture's bytes while racing (under 6 MB) and none after leaving. Frame time: `racer-frame-time` kept (avg under 8 ms, p95 under 12 ms on the dev Mac). Slowed CPU: if the last ten frames averaged over 14 ms, the view draws every second segment beyond 20 and halves the roadside pool; the engine never changes (fixed 120 Hz steps with the 50 ms cap). On touch, the view starts in that mode and leaves it when ten frames average under 9 ms.

Resolution: the canvas is 960 by 540 (`GAME_W`, `GAME_H` **[checked touchLayout.js:17]**), the UI on its own camera. Text is the bitmap type via `uiText` on plates.

### What happens to the engine and the scene

`src/engines/race.js`, rewritten in place, same shape (`Race`, `advance(input, ms)` at fixed 120 Hz, `events`, `drain`, `alpha`), the same tests driving it with bots:
- **Stays**: `TUNE` as the one table, `gripFactor`, `gripBand`, `brakeDistance`, `revs`, `draftBeat` (the lane term becomes `(jo.x - r.x) / 0.25`), `raceLost`, `newCar`, the launch window, the drum fade, the lift count, `spin`, `recover`, `toLamp` with `lampRivals`, `drafts`, `checkFinish`, hit-stop and ghost, `costliest` and `result.js`, `car.js`.
- **Goes**: `y` as a lane, `lane`, `fromLane`, `laneTime`, `changeLane`, `lineOf`, `bendSafe`'s lane term, `bendLen`, `slipSteer`, `rivalInput`'s lane logic, `ahead()` per lane, the `sling` input.
- **New**: `x` in road widths (0 the middle, ±1 the edges, ±1.25 the straw or wall), `steer` in −1..1, the lateral step (§5), rivals in `src/engines/rivals.js` (pure: `station`, `clean`, `dive`, `block`), `cue` events (`track.cues: [{ d, lap?, id }]`), `script.js` per race for the three things that are not data (Aldo's drift, the pit box, the wheel), and **the gate**: `track.gate` is `{ time }`, `{ place }` or `{ scripted: true }`; `checkFinish` puts `passed` in the result from it, and `raceLost` reads it (a time gate is lost when the flat-out arithmetic cannot make the time).
- The engine keeps a bend's `safe` as data and derives `curve`; over the limit the car slides outward (today's `slipPush`), under it the curve pulls outward at a fifth of that, the "hold the wheel" feel.

**For the stage A builder, already building from the earlier plan:** the engine, the feel numbers and the `pinewood` and `test` tracks stay as they are, with three additions: (1) `track.gate` as above, and `pinewood.gate = { time: 34 }` in place of `passPlace` (if `passPlace` has already shipped, stage E maps `passPlace → { place }` and nothing else moves); (2) `result.passed` from the gate; (3) the `clean` style is Dante's, not Marta's, and nothing else about it changes. `held_aldo` needs nothing new: `jo.draft` and `jo.inDraft` already exist at the cue.

`src/scenes/RaceScene.js`, kept as the owner of menus, saves and audio; the drawing moves out:
- **Stays**: `create`'s wiring, `update`'s input and hit-stop, `onEvent` (fewer cases), `radio`, `saveFlags`, `onFinish`, `showCard`, `openPause`, `askAgain`, `restartFromLamp`, `restartRace`, `leaveToGarage`, `leaveToStation`, `teardown`, `updateAudio`.
- **Goes**: `buildTrackside`, `makeCar`, `renderWorld`, `drawAir`, `drawCar`, the bank and lean camera, `viewAhead`.
- **New**: `this.view = new RoadView(this, track, race)`; `this.cueHandler` from `script.js`; the pit board; the touch profile's new layout; `onFinish` reads `result.passed` instead of `place <= passPlace` **[checked RaceScene.js:515]**.

The view reads the engine; the engine never reads the view. Bots run the engine in node.

## 5. Feel numbers (starting values, for tuning; unchanged)

| What | Value | Note |
|---|---|---|
| Top speed, pull, brake, coast, drum fade | 36 m/s, 8.5, 8, 0.6 + 0.0025 v², 2.5 to 5 s to 0.7 | as today, kept |
| Steer rate | 1.3 widths/s at the top speed, times (0.35 + 0.65 v/vMax) | slow cars steer less |
| Curve pull, under the limit | 0.2 × curve × (v/vMax)² widths/s outward | the wheel must be held |
| Slide, over the limit | `slipPush` 0.22 widths/s per m/s over; `slipScrub` 0.6 m/s² per m/s over; steering fights it at half rate | from today's numbers, scaled to widths |
| Verge, |x| over 1.0 | drag 4 m/s², grip −0.04/s, dust | a mistake you can drive out of |
| Straw, |x| over 1.25 | speed ×0.6, grip −0.1, x set to 1.2, one hit per bend | as today |
| Wall, |x| over 1.25 | spin, 3 s to the lamp, rivals rewound | as today |
| Draft | 1.5 to 4 lengths, |Δx| under 0.25, fill 1.2 s, +6 percent, leak 0.25/s | as today |
| Sling (on breakout with a full bar) | +18 percent for 2 s, pull ×1.8, cool 4 s, needs v over 10 | as today, no key |
| Tyre wear | brake 0.02/s over 12 m/s; slide 0.015/s per m/s; verge 0.04/s; straw 0.1; bale 0.03 | `gripMin` 0.75, soft 0.85; `tyres_short` starts at 0.6 |
| Lamps | every 250 to 350 m, one per bend's entry at least | spin cost about 2.3 s |
| Rival tops (× vMax) | Cassian 1.0, Teo 1.02 then 0.9 when bald, Dante 0.97, Aldo as Jo | rubber band ±0.06 on top |
| Cassian's block | tell at t; the move starts at t + 0.45 s; across in 0.8 s; not in a bend or 60 m before one; not within 4 s of the last | the test pins ≥ 0.4 |
| Cassian's mistake | 3 s in his draft, then he brakes 8 m early for the next bend, once per race | the gap you are given |
| Launch | gas tapped within 0.35 s after the green: pull ×1.25 for 2.5 s; gas held before the green: a 0.3 s bog | replaces the Space tap |
| The stop for Cassian | 6 s; the gap to P2 at the cue 9 s or more at a tidy pace | pinned by a test |
| Hit-stop | rub 40 ms, hit 80 ms, spin 90 ms | as today |
| Camera | horizon 42 percent; the car's screen y fixed; 2 percent zoom-out at the top speed; shake 0.003 to 0.014 by event; land parallax at 0.1 and 0.35 | the car never moves on screen except lean and squat |
| Hills | Pinewood's crest +6 m over 80 m; the Coppa's terraces S −8 m; none elsewhere | optional: if the crest costs feel, flatten it and keep the board |

## 6. Restarts, lamps, HUD, touch, audio (unchanged)

**Restarts.** Pause gives Resume, Restart from the lamp, Restart this race, Back to the garage, Back to station. A spin hands the car back at the lamp at 12 m/s with a 1 s ghost. The grid is the lamp before the first one. The result is saved on the line before any card.

**HUD** (bitmap type, plates, as today's `RaceHud`): the speedo bar with the next bend's speed notched; the call, `RIGHT 150 M: 70 KM/H`; GRIP (shown once it leaves green, or from the lights when `tyres_short` and in race 4) and DRAFT; `P2  0:41.3` (race 1 shows Aldo's time beside Jo's instead of a place); the race strip with every car's dot and the lamps; the lights; Ottavia's caption. Gone: the sight strip. The static plates fade after 5 s.

**Touch** (`layoutRace`, rewritten): right thumb GAS (tall, at the edge) and BRAKE beside it, as today **[checked touchLayout.js:109-118]**; left thumb a wide **steering slab**: two halves with a 12 px dead strip; a thumb that slides across changes side without lifting. Pause top-left. Taps answer cards.

**Keyboard and pad.** Left/Right or A/D steer; Up/W or Shift gas; Down/S or Ctrl brake; Esc pause. Pad: `ax0±` steer (dead zone 0.18), `b7` or `b0` gas, `b6` or `b1` brake, `b14`/`b15` steer too. `InputMap` reads `ax<n>±` **[checked InputMap.js:76]**; a pad's d-pad-as-axis is a binding line, added only if a builder has such a pad.

**Audio.** `EngineSynth` with up to three audible cars **[checked engineSynth.js:9-49]**. Add: the untuned 2 Hz beat, tyre squeal by slide, gravel on the verge, Cassian's tell as a short horn sting, the crossing's bell, the wheel's crack, the finale's single note (the engine's voice held at one pitch for 2.5 s, detune at zero), a PA murmur under race 4. No music bed in races; stings only. Between races the felt piano stays. **Checked silently**: `racer-engine-offline` and `racer-beat-offline` render the real graph offline; extend them with the untuned beat (a 2 Hz envelope) and the final note (one spectral peak). Nobody passes `?sound=1`; nothing sets `dreamcatcher.devSound`.

## 7. How the bots verify it

| Promise | Where | What it asserts |
|---|---|---|
| A bot can meet every objective without touching anything | `tests/race.test.js` `tidy bot` | On `test` and the four tracks, a bot that brakes at `brakePoint` and holds x at the inside third finishes with `rubs`, `spins`, `offroads` all 0 and `passed` true: under 34 s on Pinewood, `held_aldo` on the Harbour, top 3 on the Salt Road (orders held and broken, worn and stock tyres), first in the Coppa (both branches) |
| A bot that never brakes does not meet them | `tests/race.test.js` | On Pinewood the flat-out bot is over the time; on the Salt Road and the Coppa it spins or straws at least once per wall bend and finishes behind the tidy bot by 3 s or more |
| No line wins everywhere | `tests/race.test.js` | On Pinewood an inside-hugger and a run-wide bot each beat the other on at least one bend |
| Cassian's tell is at least 0.4 s | `tests/rivals.test.js` | `block_tell` to the first step his x moves towards Jo's is ≥ 0.4 s over 50 seeded races; never in a bend; never twice within 4 s |
| Only Cassian blocks | `tests/rivals.test.js` | Teo, Dante and Aldo never emit `block_tell` and never move towards Jo's x while he is in their draft |
| Teo fades; Dante holds station; Aldo holds Jo | `tests/rivals.test.js` | Teo's grip under 0.3 by two thirds of race 3; Dante's x never crosses Jo's while HOLD; Aldo 2 to 3 lengths ahead for any Jo input stream |
| The restart is fair | `tests/race.test.js` (kept), `racer-fail-fair` (kept) | A wall is back at the lamp, driving, within 3 s; rivals rewound; the clock not |
| Race 2 cannot be failed | `tests/script.test.js`, `racer-tragedy` (new) | Any input stream ends with the dark and `done_race2`; no `finish`; `held_aldo` true for the tidy bot and false for a bot that lifts on the quay |
| The Gull lamp | `tests/script.test.js` | Dark after Aldo's cue in race 2; dark at the start of race 4 and lit on passing; Cassian stops at it |
| The win survives the choice | `tests/script.test.js`, `racer-finale-brake`, `racer-finale-pass` (new) | The tidy bot wins by ≥ 1.5 s in both branches; the stop costs 6 s ± 0.5; `helped_cassian` or `passed_cassian`; both reach `CAUGHT` |
| The pit box | `tests/script.test.js` | In the box 3 s (2 s with `pit_clean`); short or long 5 s; through: grip 0.4 |
| Orders | `tests/script.test.js`, `tests/racerSeason.test.js` | HOLD shown only with `sable_orders` and Dante ahead; passing him sets `broke_orders`; holding still passes top 3 |
| Touch works | `racer-touch` (rewritten) | Synthetic touches on the slab's halves steer; GAS moves; BRAKE stops; a slide across the slab changes side without a lift |
| No stuck state | `racer-pause`, `racer-again`, `racer-spin-pause` (kept, re-aimed), `racer-quit-anywhere` (new) | Quit to garage and to station from the grid, a spin, the dark, the card, the pit, the choice: the next scene is live and the run resumes at the garage lamp |
| Old saves | `tests/racerSeason.test.js` | Runs with `done_race1..3` and `race_test_*` continue at the right place (below); runs with `done_race4` or `done_race5` continue at Ottavia's question; `prizeOwed` pays per track; no flag is read that an old run lacks |
| Textures and frame time | `racer-textures` (new), `racer-frame-time` (kept), `speed-budget` (kept) | §4's numbers; the packs' total unchanged |
| Audio by numbers | `racer-engine-offline`, `racer-beat-offline` (extended) | §6 |
| Length | `racer-length` (new) | The tidy bot's four races total under 4:20 of race time |

**Replaced or dropped**: `racer-draft`, `racer-touch`, `racer-sight-strip`, `racer-bend-visible`, `racer-beat`, `racer-card`, `racer-hud-diet` rewritten for the new view; `racer-theme`, `racer-coast-props` dropped. `tests/race.test.js` rewritten (lane tests go); `tests/raceResult.test.js` kept and extended for `gate`; `tests/racerSeason.test.js` rewritten for four hooks.

**Save compatibility.** No format change: flags only. An old run (stand-ins, hook ids `race1..race5`):
- `done_race1` or `done_race2` only: the next hook is the same number, now a real race, and the story goes on in order.
- `done_race3` without `signed`: the Salt Road is counted done; Sable's door opens on `jars_done` (already true); signing sets `signed`; `nextHook` finds `race4` needing `garage_again`; `ottavia_again` plays on `done_race3`. He skipped the Salt Road, which an old run already drove as a stand-in. Acceptable.
- `done_race4` or `done_race5`: unread; `done_race3` is set in those runs too, so the same path. The gull and pit doors require `garage_again`, which `ottavia_again` sets.
- `race_test_*` flags stay unread; `payPrize` walks the four track ids plus `test`, so a stand-in prize still owed is paid once.

## 8. Build order

Each stage is playable and mergeable alone, sized for one builder. At most 2 browser builders and 1 without at a time. Every builder reads this file and `docs/dream_racer.md` §1, §2, §7; dev stays silent (`dev-silent`); after each stage a designer and a pro gamer review until converged (`review-loop`).

| Stage | Builder | Browser | Files | Skills |
|---|---|---|---|---|
| **A. The engine** (in progress) | 1 | no | `src/engines/road.js` (new), `src/engines/race.js` (rewrite, plus `track.gate` and `result.passed`), `src/engines/rivals.js` (new, `clean` only), `src/dreams/racer/race/tracks.js` (`test`, `pinewood` with `gate: { time: 34 }`), `tests/road.test.js`, `tests/race.test.js` | `disciplines:physics-tuning`, `game-balancing` |
| **B. The view and race 1** (after A) | 2 | yes | `src/scenes/RaceScene.js`, `src/dreams/racer/race/RoadView.js` (new; `RaceRoad.js` and `themes.js` deleted), `race/carArt.js` (new, with `track.joLivery`), `race/RaceHud.js` (the time gate's readout), `src/input/touchLayout.js`, `src/dev/scenarios/racer.js`; `verbs/garage.js` loses `paintSteps`/`freeTheme` | `disciplines:game-feel`, `disciplines:camera-systems`, `disciplines:input-systems`, `pixel-art-sprites`, `disciplines:performance-optimization` |
| **C. Rivals, scripts and tracks 2 to 4** (after A, parallel with B) | 3 | no | `src/engines/rivals.js` (`station`, `dive`, `block` with the tell and the mistake, Dante's HOLD), `race/tracks.js` (`harbour`, `salt`, `coppa` with cues, crowd and pit-wall lists), `race/script.js` (new: Aldo's drift, `held_aldo`, the crossing, the pit box, the wheel and the stop, as pure state machines), `tests/rivals.test.js`, `tests/script.test.js` (the win in both branches) | `disciplines:game-ai`, `disciplines:level-design`, `game-balancing` |
| **D. Rivals, hazards, night and the crowd in the view** (after B and C) | 2 | yes | `RoadView.js`, `carArt.js` (three liveries more, the flag passes), `RaceScene.js` (events, the pit board, the air streaks, the dark and the dawn), `src/audio/engineSynth.js` (beat, squeal, tell, bell, crack, note, murmur), `scenarios/racer.js` | `disciplines:game-feel`, `disciplines:audio-design`, `disciplines:game-ai` |
| **E. The journey and the ending** (after C; parallel with D, touching no view file) | 3 | yes | `src/dreams/racer/season.js` (four hooks, goals), `dialogue.js` (the lines in §3), `beats.js`, `dream.js` (`ending`, objectives), `verbs/garage.js` (`payPrize` per track, the Coppa door), `rooms/garage.js` (poster, banner, `ottavia_again` on `done_race3`), `rooms/quay.js` (door gates, two lines), `rooms/pitlane.js` (Tullio's lien line), `src/data/dreams.js` (`unfinished` off), `tests/racerSeason.test.js`, `tests/raceResult.test.js`, `src/dev/scenarios/racerPlaces.js` (`racer-tragedy`, `racer-finale-*`, `racer-quit-anywhere`, `racer-length`, old-save continues) | `disciplines:dialogue-systems`, `disciplines:save-systems`, `dreamcatcher-ui-type` |
| **F. Balance and polish** (after D and E) | 1 | yes | numbers in `TUNE` and `tracks.js` only, plus review fixes anywhere; drop the `test` track | `game-balancing`, `disciplines:game-feel` |

Parallel plan: A alone first (it is the contract). Then B (browser) and C (no browser). Then D (browser) and E (browser), since E's files are the season's and D's are the view's; E runs races through the real door only to check the flow. F last. Stage E's builder also takes the stage 2 review's money items (`advice/racer_stage2_review.md` S2, S4): the race 3 prize is the sink the jars needed, so soft tyres go to 32 and chalk to 20, and one of Sable's `b` clauses costs something (the oil clause: the HOT meter sits a notch higher).

## 9. Questions for the owner

Decided by default; say so if you want otherwise.

1. **Race 2 is the one race you cannot lose.** Its objective (stay in Aldo's air) is checked and changes a line, but the race ends at the Bend whatever you do. Default: keep it so; the tragedy is the story. The alternative is a fifth, ordinary race before it, which is the six-race length again.
2. **The sling has no key.** Default: it fires when you leave a full draft.
3. **Hills.** Default: one crest on Pinewood and a drop through the Coppa's terraces; flat elsewhere.

Skipped: I did not read the `disciplines` skills' files or the stage 1 reports in full, nor run any test or scenario; the Phaser Graphics batching claim and the texture sizes in §4 are estimates to be measured in stage B.
