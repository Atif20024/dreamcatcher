# The Racer, stage 2: the walk-in places and their story

The story now runs from the garage to the pit lane, in six places on a new quay, with a real cast. Every race in it is the old test road standing in. The dream stays `unfinished: true`, and the headline is unchanged.

**Nobody has played or heard this.** Everything below comes from scenarios and bots. Dev is silent, so TUNE's beat, the room music and the ambience have never reached an ear.

The owner changed the plan partway through: the drive will be rebuilt later from behind the car, with free steering. So work on side-on scenery stopped, and no dialogue or teaching depends on lanes. See "What the rebuild discards".

## The hospital dialogue, for the owner to read

Jo presses [E] at the chair on the upper landing ("put the gloves on the chair"). Aldo is behind a shut door and is never shown. No injury appears anywhere.

Before the stairs, in the corridor below:

> **SISTER AGNESE:** Visiting was at four. Not through the ward. If you must go up, the iron stairs at the end, and quietly.

If Jo drops off the iron stairs (the fail state, no heart lost):

> **SISTER AGNESE:** Quietly, or not at all. From the bottom, please.

On the landing:

> **OTTAVIA:** You brought them.
> **JO:** Is he awake?
> **OTTAVIA:** He looks at the wall. He knows me. He asked what the tide was doing.

If Jo kept the new tyres:

> **OTTAVIA:** He told me to put the new set on you, and I bolted them on myself. His old ones were on his car. So.

If Jo gave them to Aldo:

> **OTTAVIA:** He had your tyres on. Good tyres. I keep wanting it to be the tyres.

Then:

> **JO:** A car moved on him, late. I saw it.
> **OTTAVIA:** Everybody saw something.
> **OTTAVIA:** His engine was flat on Saturday. A hair. I heard it, and I thought: tomorrow. I'll tell him tomorrow.

Jo chooses:

| Choice | Ottavia |
|---|---|
| You couldn't have known. | I could. It is the whole of what I can do. |
| Why didn't you say? | He was tired. It was a hair. He has been kind to me. |
| Say nothing. | Thank you. |

Then:

> **OTTAVIA:** Put them on the chair. He will see them or he won't.
> **OTTAVIA:** Go to my mother. The Cup money is on her dresser and she won't touch it.
> **JO** (caption): On the chair, fingers together. They look like something left out for the morning.

Afterwards, if Jo talks to her again: "Go on. I will sit a while." Sister Agnese: "That is all he needs tonight. Go on home."

The kitchen tells the rest:

> **SIGNORA CASTELLANE:** At the cafe they say it was the money. At the harbour they say it was the boy in the black car. She says nothing. She washes her hands, and the black stays.

And the morning after, in the garage:

> **NINO:** They took him up the hill before it was light. His gloves were on the bench. Nobody has moved them.
> **JO:** Tail lights, at the Gull Bend. Then no tail lights. Then the dust in my lamps, and his engine stopped.
> **NINO:** He is alive. Sister says he is alive. Will you take them up? I do not want to.

## The order of play

| # | Where | Goal on the card | Verb | Fail state | What opens next |
|---|---|---|---|---|---|
| 1 | Pereval Garage | get her singing: tune the carburettor by ear | **TUNE** at the bench: hold [E], let go when the beat stops | Hold too long and she floods. Drive untuned and she runs hot | The door |
| 2 | Test road, stand-in for the Pinewood hill-climb | | | | Aldo's offer |
| 3 | Garage | Aldo wants a word | **The choice:** keep the one new set of tyres, or give it to him | | The door |
| 4 | Test road, stand-in for the Harbour Night Cup | | | | The morning after; the hospital |
| 5 | Corridor | bring Aldo his gloves | Walk, climb the iron stairs, gloves on the chair | Drop off the stairs: Sister Agnese sends him back to the foot | The kitchen |
| 6 | Castellane Kitchen | carry the prize tin to the table | **SPLIT:** 12 coins, 3 jars that want 16 | Short the rent and she says nothing. It is remembered for the ending | The door |
| 7 | Test road, stand-in for the Gull Bend return | | | | Sable Oil |
| 8 | Sponsor's Table | sign the sponsor: read the paper | **READ and INITIAL:** 3 papers; strike one clause or sign whole | A clause left standing binds later | The door |
| 9 | Test road, stand-in for the Salt Road | | | | Ottavia's question |
| 10 | Garage | Ottavia has a question | Choice: whose car is it? | | The door |
| 11 | Test road, stand-in for the Terraces in rain | | | | The Gull road and the pit lane |
| 12 | The Night Before | walk the corner: chalk your marks | **CHALK** board, turn-in, apex, in order | A washout in the dark: back to the lamp. Skipping leaves no marks | |
| 13 | Pit Lane | stop, change, go | **PIT STOP** drill, 4 beats on her call, the clockmaker's bob | More than one miss: again | "the Coppa is still being written: back to the station" |

- **THE QUAY is an addition.** The design has no street, but the places needed to be on one. Each door says what opens it. Roofs and the awning pay.
- **Coins:** 67 nuts placed (budget 60 to 80). All of them are on the harder way.
- **Pit lane:** the design puts it inside race 6. That race waits, so this is a drill the crew runs the week before.

### The stand-ins

`HOOKS` in `src/dreams/racer/season.js` lists each race's place in the story. Every entry says `track: STAND_IN`, and the comment says so. There is no fake race. To hook a real race, change that one field.

- A stand-in opens the story on **any finish**, not only first place. A real race will bring its own gate. The code marks this as a shortcut.
- The player drives the same road five times. Some of the story lines describe a night race on a daylight test road until the real races exist.

### The choices and what they change

| Choice | Pays off |
|---|---|
| Keep or give the tyres | Keep: the soft set on the Heron, free. Give: buy it later. The corridor line differs either way |
| Couldn't have known, why, or nothing (corridor) | Ottavia's opening line when she returns to the bench |
| The tin | The tyre jar takes 2 nuts per coin off the soft set, down to 12. Rent and medicine change what the Signora says. All are flags for the ending |
| Sable's clauses | Money now (a left-standing bad clause pays 10 nuts, a harmless one 2). A fifth of later prizes goes to Sable. Orders and debts are flags for races 4 and on |
| Whose car | A flag for the ending |

## What nuts buy: tyres and chalk, never speed

| Item | Where | Price | What it does |
|---|---|---|---|
| Soft tyres | Rack | 24, less the tyre jar, never under 12 | `gripMin` 0.75 to 0.85: bald tyres stay fairer. New tyres are the same |
| Ottavia's chalk | Bench, once tuned | 16 | Chalk marks on the road at every braking point, for good |

- **Second place keeps its 6 nuts.** Pinned by a test.
- **No speed:** `carTune` in `race/car.js` merges the base tune, `track.tune`, then these. A test pins that no speed number changes. A tidy bot's lap on soft tyres differs from stock by under 0.25 s.
- **Spending:** out of this dream's count, saved with the flag that says what was bought. No save format change.
- **Running hot:** untuned, the race shows a HOT meter and one radio line. It is a warning only, because the car was not to be retuned. Whether it should cost something is an owner's call after the first drive.

## Cast

Every name was checked against the source and is clear.

| Person | Gait | Task loop | Where |
|---|---|---|---|
| Ottavia Castellane, 22 | Busy | Spanner on a nut | Bench; sits on the landing in the corridor |
| Aldo Pereval, 52 | Plod | Rag at his hands | Garage, until the Cup |
| Tullio, chief mechanic | Carry, tyre on his shoulder | Hitching the tyre | Paces the garage; pit lane |
| Nino, 15 | Kid | Broom | Garage; pit lane |
| Mr Sable | Measured | Reads a ledger | Office |
| Signora Castellane | Stroll | Ladle at the stove | Kitchen |
| Sister Agnese | Hurried | Clipboard | Paces the corridor |

**Name collisions in the design, for later.** These rivals are not built and not named in any dialogue, but they need new names before they are:
- **Lena Aurelio:** Chef Aurelio is in the Chef dream.
- **Bruno Varga:** the Painter's dream has a Bruno.
- **Lena:** also in `docs/dream_athlete.md`.

**Rivals:** only Tullio's line touches style: "the Roche boy covers his mirror better than he drives. The others just race you." That agrees with only Cassian blocking.

## Measured

| Check | Result | Budget |
|---|---|---|
| All packs, by the build's index | 76.4 MB (`speed-budget` reads 76) | 80 |
| `people-racer`, 7 people | 3.5 MB | |
| `cars` | 1.4 MB (was 1.32) | |
| Race frame at speed, 600 frames | avg 2.11 ms, p95 4.6 ms, worst 6.2 ms (29.1 ms on an earlier run) | 16.67 ms |
| Worst frame through the race door | 37.7 ms (29.4 ms on an earlier run) | 60 ms |
| Worst of 12 racer door crossings | 23 ms (28 ms lit, on an earlier run) | 60 ms |
| Objects in a room | 227 to 449 (the quay) | |

Frames were stepped by hand and include the wait on a 1-pixel read, with other jobs on the machine. They are work times, not on-screen rates.

**The budget is now tight:** 3.6 MB left. A telegraph pole baked into `cars` took it to 77.4 MB, because one 308 px frame made the whole sheet taller, so poles are painted with the road and freed with it.

**Jo's contrast, 3:1 target:**

| Room | Where he arrives | Three other spots |
|---|---|---|
| Garage | 3.27 | 4.22, 5.74, 7.79 |
| Quay | 4.54 | 3.23, 3.33, 3.05 |
| Corridor | 4.85 | 8.0, 7.9, 9.72 |
| Kitchen | 3.58 | **2.5**, 3.87, 3.19 |
| Sponsor | 3.51 | 3.29, 4.03, 3.82 |
| Night Before | 3.69 | 3.3, 4.1, 3.3 |
| Pit Lane | 8.89 | 7.3, 6.1, 4.77 |

- **Kitchen at 2.5:** in front of the dark dresser. Not enforced; the scenario enforces the arrival spot, as `jo-contrast` does.
- **To reach 3:1:** Jo carries the inspection lamp in the garage, corridor and sponsor's office, as well as on the Gull road. The corridor's wall is much paler than the design's "cold blue night grade". The owner may want it darker, at the cost of the 3:1.
- **The probe needs settled frames:** one run read several spots lower while the arrival caption was up or the page was busy. These numbers are from settled frames.

## Checks

One clean run on this Mac, on the final code, port 5183, all pass, 43 of 43:

- All 36 `racer-*`: the 20 from stage 1, plus `racer-theme`, `racer-coast-props`, `racer-tune`, `racer-shop`, `racer-season`, `racer-choice`, `racer-cup-morning`, `racer-corridor`, `racer-kitchen`, `racer-sponsor`, `racer-chalk`, `racer-pit`, `racer-rooms`, `racer-contrast`, `racer-touch-verbs`, `racer-coins`.
- `dream-packs-cover`, `speed-budget`, `room-entry-budget` (70 crossings, worst 50 ms, the musician's), `readability-racer`, `readability-hub`, `jo-contrast`, `continue-pays-once`.
- `racer-rooms` walks every room's length and runs the text audit: no violations. `readability-racer` alone only reaches the rooms near the garage, because of where they sit on the map.
- **Bug found by the scenarios:** the reading panel doesn't block [E], so a paper on Sable's desk could open twice and pay the advance twice. Fixed with a guard in the verb. The shared panel was left alone.

- vitest: 40 test files, 711 tests, all passing. New: `tests/racerSeason.test.js`.
- `lint:content`, `lint:rooms`, `lint:scale`: clean, with the existing 7 warnings.
- `vite build`: passes.
- `racer-garage-lines` was rewritten, because the bench and rack now do something. `dream-packs-cover` no longer excuses the racer for having no people. `room-entry-budget`, `jo-contrast` and `readability-*` now include the racer.

**Not run:** the full scenario set (as briefed), and any production page. The new chunks ran on the dev server only. No real phone: TUNE was tested with synthetic touches on the real E button, and the other verbs are [E] or tappable menus, by reading the code and not by a touch run.

## Pictures

In the scratchpad, `/private/tmp/claude-501/-Users-atifhsn-Documents-dreamcatcher/24eb88eb-4701-4564-ad2d-d34b369df333/scratchpad/racer2/pics/`:
`garage.jpg`, `quay.jpg`, `corridor-floor.jpg`, `corridor-landing.jpg`, `kitchen.jpg`, `sponsor.jpg`, `nightbefore.jpg`, `pitlane.jpg`, `coast-race-sideon.jpg`.

The pane was hidden, so the plain screenshot came back black. These are the game's own canvas snapshot laid over the page, with black bars above and below.

## What the rebuild discards

These are committed. Removing them would have been more work than leaving them, and they are harmless until then.

| Thing | Where | Fate |
|---|---|---|
| Road, verge and kerb painters, parallax, wires, `paintSteps`, `freeTheme` | `race/RaceRoad.js` | Discarded with the side-on drive. Freeing a theme on leaving is an idea worth keeping |
| Road, verge, kerb and scenery data | `race/themes.js` | Discarded. The palette may carry over |
| `milestone`, `rope` frames | `art/carKit.js` | Discarded unless the new view uses them as roadside sprites |
| Scenery and wire calls, `keepTheme` | `scenes/RaceScene.js` | Discarded with that scene's drive |
| `racer-theme`, `racer-coast-props` | `dev/scenarios/racerPlaces.js` | Discarded |

**Kept, because the walk-in rooms use them:** the `coast_cliffs`, `coast_village` and `coast_pines` layers in `painted.js` are the quay's, the pit lane's and the night road's backdrops. `forgetPainted` goes if `freeTheme` goes.

**Also kept for the rebuild:** `carTune` and its `track.tune` merge, TUNE, the season hooks, the flags. Chalk marks are drawn per lane in `RaceScene`, so the rebuild must redraw them, but the purchase and the flag stay.

No side-on road art was added after the owner's change. Only the quay's vine rows were softened, because they showed as a repeating pattern in the walk-in rooms.

## Not done, or short of the design

- **Races, rivals, the tragedy race, the Coppa, the ending:** waiting, as decided.
- **Race bed:** none, so nothing is sustained between 45 and 110 Hz. No new stings were added.
- **Flags that nothing reads yet:** `rent_short`, `med_short`, `tyres_short` (the design's worn start in race 5), `sable_orders`, `sable_lien`, `mark_*`, `ward_noise`, `car_for`.
- **Pit stop:** one key on a beat, not the design's four keys. Touch has only one E, and this reuses the clockmaker's engine.
- **The arrival card** is the board title plus a plate with the goal. It uses the framework, no new system.
- **Audio** is written but unheard. TUNE's two oscillators, six new ambience loops and four music keys have never played.

## Known rough edges

- **The caption bar covers Jo's feet** in these rooms, as the room's floor sits low on screen. The framework places both, so I left it. The chef's rooms are built the same way, though I did not look at them for this.
- **The corridor is bright** for night (see contrast above).
- **Prompt words:** `[E] the Castellanes: shut` reads a little oddly as a prompt, but [E] then explains it.

## One decision for the owner

**Should a stand-in need first place?** Right now any finish opens the next part of the story. I recommend keeping this until the rebuild: the owner has not driven yet, and five retries on one road would stop the story being read. The alternative is one line in `applyResult` to require the gate.
