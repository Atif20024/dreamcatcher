# THE LONG STRAIGHT (racer dream, working title)

Design doc by a pro-gamer advisor. Read-only on code: nothing was built or run. All names, teams, cars, sponsors and places are invented. The general shape (small team, rich rival, a loss that changes the driver) is common to a hundred racing stories. No character, car, city or plot beat comes from any real game.

## 1. Premise
- **Platform.** 10 (new). Platforms 2, 5, 7, 9 and G are taken, and 1, 3, 4, 6 and 8 already hold board lines in `src/data/dreams.js`. If the hub cannot hold a tenth, the fallback is 8: THE WHITE COAT is only a board line and has no scene.
- **The dreamer.** **Wren Castellane**, 71, bus-garage fitter, with a ring of old black under her nails. For forty years she has listened to engines and said "that's a quarter-tone flat" to people who never asked.
- **Her dream.** In 1958 she was 22 and the only person at the Pereval garage who tuned by ear. She never drove. The seat was Aldo's, then Dante's. In the dream the car is hers for one season, with her on the pit-wall radio and Jo at the wheel.
- **Era and place.** The **Marenna Coast**, spring 1958. A pine-and-cliff road circuit run on closed public roads: stone villages, a harbour, terraced vineyards, a salt road, a level crossing. Straw bales and a few flags are the only safety. Cars are cigar-shaped, open-wheeled or cycle-winged, with thin tyres and drum brakes. No seat belts. Races are called *coppe* (cups).
- **Jo's role.** Jo is the driver the garage can afford: a stranger with good hands who plays by ear (the trumpet). He drives; Wren, on the radio, tells him what the engine is saying. Mechanics and drivers are one body here: neither works alone.

## 2. Story arc
A small independent garage, **Pereval Corse**, owned by **Aldo Pereval** (52, driver, mentor, kind, tired, in debt). The works team **Roche Motori** has money, new tyres, and a driver, **Cassian Roche** (26, brilliant, never been told no).

| # | Beat | What happens |
|---|---|---|
| 1 | Hope | Aldo hands Jo the second car for a hill-climb. Wren tunes it. Jo wins a small cup. |
| 2 | **The tragedy** | The Harbour Night Cup. Aldo leads, Jo drafts him. His car runs wide at the Gull Bend, on tyres that Pereval Corse could not afford to change. A rival moved late into his line. Aldo's tail lights leave the road, the lights go dark, and the engine stops. We never see him hit anything. Dust, then silence. |
| 3 | The corridor | Hospital. Aldo is alive but will not drive again. His hands are bandaged and his eyes are far. Nobody says whose fault it was; everyone is quietly sure it was somebody else's. |
| 4 | Fear | Jo must return to the Gull Bend. His nerve is a real number. |
| 5 | Politics | Roche Motori offers Jo a works seat: money, new tyres, safety. The condition is team orders for Cassian's title. Home: Wren's family needs the rent. |
| 6 | The cost | Weather, a long night, the pit stop, and the question of who the car is for. |
| 7 | **The Coppa** | The final race has Cassian beside Jo, and the Gull Bend. His car fails there. Jo chooses between the line and the man. |

Blame is shared, on purpose: money (tyres), politics (the late move), Aldo's tiredness, and Wren's own unsaid doubt (she heard a flat note and said nothing). **Handling with care:** nothing graphic; the crash is lights, dust and sound. The hospital scene is quiet and short, and nobody is a villain. Cassian is a spoiled boy, not a monster.

**Real struggles shown:** money (tyres are the budget), sponsors (the contract verb), the mechanic's craft (tuning by ear), fear after a crash (the Nerve meter), team politics (orders), family cost (rent), physical toll (hands and vibration, a long night, heat).

## 3. Racing mechanic (a new sub-mode, RaceDirector)
**View.** Side-on, the car drives right, the screen scrolls like the train. The road is a band with **3 depth lanes** (near, middle, far) drawn stacked, like a wide street seen from the side. The far lane is drawn 8 percent smaller, the near lane 8 percent larger. Collisions only happen within a lane.

**Controls (keyboard only):**
| Key | Action |
|---|---|
| Right / D (hold) | Throttle |
| Left / A (hold) | Brake (drum brakes fade if held for long) |
| Up / Down | Change lane (a 0.45 s glide) |
| Space | One key, two meanings: tap in the green zone on the launch light (a good start), then **slingshot** when the draft bar is full |
| Esc | Pause and restart options (already in the framework) |
No gears. A shift light blinks at red-line as feedback for sound, not an input. Keep it to four keys and one context key.

**Speed and scale.** 1 m = 44 px. Cars are 3.8 m long = about 167 px and 1.1 m high = about 48 px. Top speed 36 m/s (130 km/h), honest for 1958 small sport cars. That is 1580 px/s, so one km is 28 s and a 2 km race is a minute. A pine costs 4 m of road, a bale 1 m.

**Sense of speed:**
- Three parallax layers at 0.1, 0.35 and 0.7 of the road speed (cliffs, villages, roadside poles).
- Foreground blur streaks of kerb stripes and mile posts.
- The camera leads ahead by up to 40 percent of the screen and zooms from 1.0 to 0.9 near top speed.
- Heat shimmer and dust on gravel.
- The engine pitch climbs with revs and the road noise rises. Wheels spin with distance travelled, never faster or slower (the motion rule).
- Motion lines appear only when slingshot is on.

**Drafting and overtaking.**
- Stay 1.5 to 4 car lengths behind someone in the same lane for 1.2 s. The draft bar fills, the lead car's air is drawn as faint streaks, and you gain 6 percent speed.
- Space on a full bar releases a slingshot: 18 percent for 2 s, then a 4 s cool-down.
- To pass, drop out of the draft into another lane while the bar is full, and slingshot alongside.
- A pass is clean if you are a car length clear before returning to the lane. A tap beside a rival is a **rub** (a small push, a sound, both lose 10 percent). A real hit slows both.

**Tyre wear and fuel.**
- A **grip bar** drains with hard braking, lane changes at speed, and slides. It has three bands drawn on the tyre sprite: green, worn, bald. Worn tyres lengthen braking distance and slide earlier, never above a fair 25 percent.
- Fuel and engine heat matter only in race 6 (the long one); a gauge sits beside the grip bar.
- Wear is a story object: tyre choice at the garage (harder compound = less wear, slower) is the budget made playable.

**Nerve (from race 3 on).** After the tragedy a Nerve ring sits by the speedometer. Hard braking and rivals close behind raise it. High Nerve narrows the screen edges (tunnel vision, never below 80 percent of the view), and makes the car shake slightly at the braking marks. It is lowered by clean laps, **a slow breath** (hold Down for 1.5 s on a straight, which gives up 0.4 s), and by chalk marks from the Night Before. Fear is a debuff you can manage, as in the Gambler's tilt, but it is not copied from it: it is about your own information, not your betting.

**Rivals (three personalities, plus the teammate):**
- **Cassian Roche** (black and gold). Smooth, fast, a hunter of apexes. He **blocks**: when you are in the draft he moves to cover your lane. He looks in his mirror (a head turn on the sprite) every 3 s. If you sit in his draft for 3 s he makes a **mistake**, a late brake and a wide line, and gives you the gap. He is never random.
- **Lena Aurelio** (white and blue). Clean, a perfect line, never blocks. She is predictable and a lesson in respect: pass her cleanly and she lifts to let you through. Hit her and she holds her line and fades back.
- **Bruno Varga** (mustard). Aggressive dives into any gap, rubs on purpose, but drains tyres early. He is the hazard that tires out.
- **Dante Mir** (teammate, cream and teal like Jo). In race 4 the team orders say hold station behind him. Ignore the order and he fights you, and it costs you the sponsor.
Rubber-banding is capped at 6 percent and never invisible to the player: if Jo is far ahead, rivals simply don't give up. Rivals follow a spline per lane with seeded randomness; there is no cheating on corners.

**Hazards.** Oil slicks (a dark ellipse, gentle spin, recoverable), goats on the road (two-second warning bell), rock fall (a shadow and a dust puff), fog banks that dim visibility, puddles in the rain race, hay bales on corner outsides (soft), a **level crossing** with a train (a nod to the game: a bell, red lamps, a timed gap), and the tunnel (headlight pool only).

**Fair fails.**
- Hitting a hard wall or a ditch spins the car: 3 s of recovery to the last **lamp** checkpoint (the platform-lamp style, one every 600 m).
- Your finish place matters only for the gate: top 3 passes, with a "Wren says" line, and anything lower is a retry of that race only.
- After three retries, a soft aid appears: *"Wren whispers the brake marks"*. It is never labelled easy mode.
- The tragedy race is scripted: Jo cannot fail it. Aldo's crash happens whatever the player does, and the only input is to brake (the car stops on its own by the verge).

## 4. Life off the track (walk-in places)
The clock-house pattern. Each place has one goal on an arrival card, a verb, a fail state, and one lesson. Rooms are entered through a drawn frame (door, arch, gate) with the 340 ms dip through dark. There are no crossfades. Car-in-garage exits roll the shutter up and dip to the race.

| # | Place | Goal on the card | Verb | Fail state | Teaches |
|---|---|---|---|---|---|
| A | **THE PEREVAL GARAGE** (interior: pit, benches, hanging tyres, a radio) | "get her singing: tune the carburettor by ear" | **TUNE**: hold E on a jet knob; the engine note beats against a reference tone (a trumpet note Jo knows). Release when the beat stops. | A wrong jet overheats in the first race (a visible temperature warning). | The mechanic's craft is hearing. Jo's trumpet ear is the skill. Also tyre choice at the rack. |
| B | **THE SPONSOR'S TABLE** (Sable Oil office over the cafe) | "sign the sponsor: read the paper" | **READ and INITIAL**: three contracts; pick which of two clauses to strike on each. | Sign everything and a clause binds you in race 4 (team orders), or you lose 20 percent of prize money. | Money is never free. Reading the small print is the career. |
| C | **THE HOSPITAL CORRIDOR** (night grade, green tile, one lamp) | "bring Aldo his gloves" | Walk the corridor, climb the service stairs (a small platform climb), put the gloves on the chair. | None. This room is quiet by design. | Loss and silence. A world that goes on. |
| D | **THE CASTELLANE KITCHEN** (home: a table, a stove, a letter) | "carry the prize tin to the table" | **SPLIT** the tin: coins into three jars (rent, tyres, mother's medicine). | Underpay rent and mother says nothing (the ending notes it). Leave tyres short and race 5 starts worn. | The cost to family; budgets. |
| E | **THE PIT LANE** (exterior, open, in race 6) | "stop, change, go" | **PIT STOP**: stop in the box, then a timed 4-key rhythm (wheel, wheel, fuel, flag) on Wren's call. | Mess the rhythm: +3 s. | Teams win races; the crew is the car. |
| F | **THE NIGHT BEFORE** (the Gull Bend on foot, torch and a chalk stick) | "walk the corner: chalk your marks" | **CHALK**: stand at the braking board, the turn-in and the apex, and press E at each. Marks appear in the finale. | None. Skipping it leaves no marks and a higher Nerve. | Racing is mostly walking and looking. |

**How racing and walking alternate:** garage (A) → race 1 → garage (tyres) → race 2 (tragedy) → hospital (C) → home (D) → race 3 (fear) → sponsor (B) → race 4 → garage again → race 5 → night before (F) → race 6 with pit (E) inside it. After each race Jo walks out of the car into the next place: the cars never leave the scene, they stand at the arch.

## 5. The race ladder
| # | Race, track | Rival | New | Difficulty (1-5) | Time | Story beat |
|---|---|---|---|---|---|---|
| 1 | **Pinewood hill-climb**, day, 1.2 km | Clock only | Throttle, brake, lanes | 1 | 0:40 | Hope. Wren: "Don't lift." |
| 2 | **Harbour Night Cup**, 1.6 km, dusk to night, lamps on the quay | Aldo ahead; Bruno behind | Drafting (Aldo is the first draft you learn) and slingshot | 2 | 0:55 | **The tragedy** at the Gull Bend |
| 3 | **Gull Bend return**, dawn, 1.8 km, cliff road | Lena | Nerve ring, brake marks, breath | 3 | 1:00 | Fear. Lena is kind to you |
| 4 | **The Salt Road**, noon glare, 2.0 km, flat, long straights, level crossing | Dante (orders), Bruno, Cassian arrives | Blocking, rubs, team orders | 3 | 1:00 | Politics and the sponsor clause |
| 5 | **The Terraces in rain**, 2.2 km, hairpins and puddles | Cassian, Lena | Wet grip, tyre choice pays or hurts | 4 | 1:10 | Cost: your jar choices show |
| 6 | **The Coppa Marenna**, night, 4.0 km (two laps with a pit), the whole coast | Cassian, Bruno, Lena | Fuel and heat, pit stop, the Gull Bend again | 5 | 1:40 | The finale |

**Ramp.** One new idea per race, always taught in a calm moment before it matters. Each race adds one thing and keeps the previous ones.

**Minutes budget (first play, about 9:45).**
- Garage 0:45, Sponsor 0:35, Hospital 0:45, Home 0:30, Night Before 0:45 (3:20).
- Races: 0:40, 0:55, 1:00, 1:00, 1:10, 1:40 (6:25).
- Pit lane is inside race 6. Retries add time, which is accepted.

## 6. The finale and the catch
**Race 6, the second lap, the Gull Bend.** Cassian's car sheds a wheel with a dry crack on the bend's outside. He slews into the straw. He is on his feet, but the engine is on fire in a small way, a puff of smoke. The marshal flag is late.

- **The choice, no menu.** Jo can brake and stop beside him (hold Left for 2 s: the car pulls up, Jo runs back, Cassian waves him off, two marshals arrive, 8 s lost). Or he can go through (Nerve spikes, the screen narrows).
- **Both are fair.** The first lap time is not lost for good, and there is still a quarter lap to the line. A clean finish is possible either way. The dream catches **whichever you do**; the difference is the line Wren says, and the ending text.
- **What catching means.** At the line, the engine note, which Wren could always hear and no one ever believed, plays alone: one clear note. Wren says: "That's it. That's dead on." **The orb is the note.** It is Jo's trumpet and Wren's ear in tune. `dreams.racer = true`.
- **What Jo learns.** The road is not the finish; it belongs to everyone on it. Speed without listening is a way of not hearing the people you drive beside. A career in motorsport is mostly the crew, the sponsors, the family, and the people who aren't there the next season.
- **Ending text** follows: tyres bought or rent paid, Cassian helped or passed, marks chalked, Aldo's gloves delivered, final place. No score shown as glory.

## 7. Cast, cars, art and environment
**Cast.** Wren (radio voice, a head at the pit wall), Aldo Pereval, Cassian Roche, Lena Aurelio, Bruno Varga, Dante Mir, Mr Sable (sponsor, polite), Signora Castellane (mother), a marshal with a flag. 8 NPC sprites, rig-built like the others.

**Cars (all drawn in code, vector layered as in `src/art/trainKit.js`).**
| Car | Look | Parts |
|---|---|---|
| Jo's **Heron 750** | cream body, teal number roundel, wire wheels | body polygon, tail fin, windscreen, driver helmet, exhaust pipe, number disc |
| Roche **Corsa**, Cassian | black with gold stripe | longer nose, bigger exhaust |
| Lena's **Aurelio S** | white with blue stripe | rounder tail |
| Bruno's **Varga** | mustard, dented | patched bonnet, spare wheel |
| Dante's Heron | cream and teal, red number | same chassis as Jo's |
Wheels are spoked discs, rotated by distance travelled. Suspension squat and a nose dive under braking are 2 px offsets, not new art.

**Props.** Straw bales, kerb posts, start gantry, lamp posts, signal flags, a level crossing with a drawn train, goats (4 frames), hay carts, bunting, a pit board (the signalling slate), tyre stacks, tools.

**Per-area palette and night grade.** Names are the ones used for room art.
| Place | Palette | Grade |
|---|---|---|
| Garage | oil-brown, cream, teal, a hot-bulb orange | warm, low, a strip light |
| Sponsor | green leather, brass, cigar haze | warm, dim |
| Hospital | pale green tile, one yellow lamp | cold blue night grade |
| Kitchen | terracotta, cream | evening amber |
| Pinewood (race 1) | pine green, sky blue, gravel gold | daylight |
| Harbour | indigo, lamp amber, sea black | dusk to night |
| Gull Bend dawn | grey pink, cliff violet | cold dawn |
| Salt Road | white, bleached yellow | glare, heat shimmer |
| Terraces | slate, wet green | rain, desaturated |
| Coppa | night navy, headlight white | night grade with lamp pools |
Jo (teal and cream overalls, leather cap) reads at 3:1 or better against every background; keep the tunnel and night backdrops brighter around his car by a headlight pool.

**Sound (silent in development; `?sound=1`).**
- **Engine, synth-only.** A sawtooth plus a detuned square, run through a low-pass filter that opens with revs, plus filtered noise for the intake and a sub for the exhaust. Pitch follows RPM. A slight flutter (LFO) adds age. Each car has its own base pitch and detune, so rivals pass with a doppler-like pitch swoop from the volume pan.
- **Tuning beat.** Two oscillators a few Hz apart in the garage. The beat slows to nothing when you are right. This is the one place the trumpet and the engine are one sound.
- **Skid and gravel:** filtered noise bursts. **Tyre squeal:** a band-pass sweep, volume by slip.
- **Crowd.** Murmur noise and clap bursts along stands; a PA with an announcer in a muffled, crackly band (a mid-band voice-like formant babble, no speech).
- **Garage:** ratchet clicks, a hammer on metal (a short noise ping), a radio playing a swing tune, air tools hissing.
- **Hospital:** a ventilation hum and one footfall echo. **Home:** a kettle and a clock.
- **Music.** Racing: a fast walking bass and brushed snare, 140 BPM, a clarinet or muted trumpet line in a minor key. Dips to silence at the tragedy. Between races: a single piano. The finale: the engine note is the music.

## 8. What makes it unique
- **The verb is the ear.** Every other dream grows one hand craft; this one grows listening: tuning by ear, hearing the engine, and the single note that is the orb.
- **Two games alternating.** A fast reflex race and a slow walking day, each making the other matter (a jar choice becomes tyre wear; a chalk mark becomes a brake board).
- **A forward-scrolling vehicle level with depth lanes,** which no other dream has. It looks like the train because it moves like it.
- **A tragedy that is nobody's fault alone,** and a finale where the right choice is not a win condition.
- **The lesson** is the cost of the career to everyone near it, not the pride of the winner: the opposite of the "glory" ending the gambler critique warned against.

## 9. Build plan
**Files to add** (the DreamScene framework, as in `src/dreams/clockmaker/`):
- `src/dreams/racer/dream.js`, `beats.js`, `dialogue.js`, `music.js`, `materials.js`, `props.js`
- `src/dreams/racer/rooms/garage.js`, `sponsor.js`, `hospital.js`, `kitchen.js`, `nightbefore.js`, `pitlane.js`
- `src/dreams/racer/encounters/tune.js`, `contract.js`, `jars.js`, `chalk.js`, `pitstop.js`
- `src/dreams/racer/verbs/breath.js` and `listen.js`
- `src/dreams/racer/race/RaceDirector.js` (the sub-mode: takes over input, camera and HUD, runs a track, returns a result `{place, time, flags}` to the beats)
- `src/dreams/racer/race/CarModel.js` (speed, lanes, grip, draft, nerve), `RivalAI.js` (personalities), `tracks.js` (data: segments, hazards, lamps), `RaceRoad.js` (lane band and parallax layers), `RaceHud.js` (gauges in the game font)
- `src/art/carKit.js` (cars, wheels, props, drawn in code) and `src/audio/engineSynth.js`
- Register in `src/dreams/index.js`, add the platform to `src/data/dreams.js` with livery teal and cream and a wheel emblem, and add a coin: **brass nut**, worth 3, budget 60 to 80, always on the harder way (garage rafters, hospital service stairs, kitchen roof, race pickups only on far-lane or risky lines).

**Race as an encounter.** `race` is wrapped as an encounter kind, so `beats.js` can call it from a door or an arch. It pauses platformer physics and restores them on exit. The finish line arch is the door back.

**Milestones.**
| # | Milestone | Size |
|---|---|---|
| 1 | CarModel + RaceRoad + RaceHud with one empty track (throttle, brake, lanes, parallax, wheel spin) | L |
| 2 | Car art kit, five cars and props | M |
| 3 | Engine synth and tyre/skid sounds | M |
| 4 | Drafting, slingshot, rubs, grip bar, lamps and fair fails | M |
| 5 | RivalAI: Cassian, Lena, Bruno, Dante; tracks 1 to 3 | L |
| 6 | Garage room + TUNE encounter; race 1 end to end | M |
| 7 | Race 2 scripted tragedy; hospital and kitchen rooms | M |
| 8 | Nerve ring, breath, night-before chalk walk, race 3 | M |
| 9 | Sponsor room + contract; race 4 (orders, level crossing) | M |
| 10 | Rain and tyre choice; race 5 | M |
| 11 | Race 6, fuel, heat, pit stop, the finale choice and the orb | L |
| 12 | Music, ambience, arrival cards, ending text, polish and balance | M |

**Scenarios to add** (the existing scenario harness): `racer-garage-tune` (a tune completes in under 90 s), `racer-race1-win` (a scripted input run finishes in the top 3), `racer-tragedy` (the player can never fail race 2; the hospital opens), `racer-draft` (3 s behind a rival fills the bar), `racer-fail-fair` (a wall hit returns to the last lamp in 3 s), `racer-contrast` (Jo at 3:1 or better on every backdrop), `racer-finale-brake` and `racer-finale-pass` (both reach the orb), `racer-length` (a first play stays within 10 minutes plus retries). Warp: `?warp=racer:<place>` with `garage sponsor hospital kitchen nightbefore pitlane race1..race6`.

**Risks.**
- **Feel is everything.** If the car does not feel good in milestone 1, nothing else matters. Tune it before building anything else; test on a flat road with no rivals.
- **Depth lanes in side view** can read as vertical movement. Mitigation: scale and shadow per lane, and a lane-change glide with a drawn dust trail.
- **Framework fit.** DreamScene may assume platformer physics. A small spike (an empty encounter that owns the camera) should come first. If it cannot, the fallback is a separate scene like the legacy ones.
- **Length creep.** Race 6 is the risk; keep it to 1:40 and skip nothing else.
- **Tone.** The tragedy must stay offscreen and brief. Have the owner read the hospital dialogue before polish.
- **Audio cost.** Several engines at once on the synth; cap at three audible cars, with the rest as noise.
- **Performance.** Parallax layers plus up to four cars are cheap; keep wheel sprites pre-baked as atlases.
