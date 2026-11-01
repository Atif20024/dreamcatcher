# FIVE-STAR DREAM: builder's list

One night at **Le Rêve**, the restaurant of the Hôtel Vauclerc, Saint-Orvain, October 1957. A brigade kitchen: gas range, copper, white tile, a steel ticket rail, a brass speaking tube, a wireless on the shelf. Jo is the new *stage* (trainee). 7 to 9 minutes. Platform 1. Save id stays `chef`.

Standard, the owner's words: "so that its very engaging and interesting. nothing should feel like its not well thought out".

## The one verb: the rail

Tickets come in. You read them. You walk the kitchen and do them with Jo's body. Every place uses the same rail on screen and the same engine (`src/engines/tickets.js`). There is no marker in a zone anywhere in this dream.

- A **ticket** is paper on the rail: table, dish, its stops in order, where it goes. The paper yellows, then reddens, as its time runs.
- A **stop** is a station in the room. Stand at it, [E]. Three kinds:
  - *quick*: done at once (spoon the sauce).
  - *work*: Jo's body is busy for some beats, in the open (chop, stir). He can't move, so it costs real time.
  - *fire*: lay it on, it cooks while you do something else, come back. Leave it and it burns: scrape the pan (work), lay another.
- **Hands** only ever hold a finished plate, one at a time. The last stop puts it in his hands; he walks it to the ticket's destination. Hands full can never deadlock: the pass always takes the plate.
- **The pocket** (the apron has one) holds what is for Chef: saffron, onions, gold. It can't be dropped, knocked out or blocked by anything. This is the fix for the gold leaf bug by design.
- A hit spills the plate. The plate goes back to its last stop and the ticket keeps the rest of its progress (the old "item returns to its pedestal" rule).
- **Late is never fatal.** A ticket that runs out is called back ("REFIRE") with its progress and fresh time. Two refires and Marguerite takes it herself, with a look. The service always ends. Being bad makes it longer and changes what is said at the end.
- **Aurelio answers every plate the same way: "Next."** He tastes, he spikes the ticket, "Next." Twenty plates teach the word, so the last one lands.

## The six places (one goal, shown on arrival, before you commit)

| # | Place | Goal, on the door before you go in | Rail | Body | Who's there, doing what |
|---|---|---|---|---|---|
| 1 | SERVICE YARD, then THE PIT | CLEAR BASTIEN'S RAIL, EARN AN APRON | 3 tickets, first two no clock. Plates to the rack, coppers scoured and hung, tureen to the hatch against a soft clock | Wet floor slides, the hooks are a climb, steam on the beat, the porter's trolley on a pattern | Marguerite smoking at the back door, gives the speech, later the apron. Bastien at the sink with a hose, singing |
| 2 | THE COLD STORE | SAFFRON, TOP SHELF. YOUR HANDS WON'T HOLD LONG | 1 ticket. From the speaking tube, no clock but the cold | Ladders and racks, COLD meter (zero: the hands let go), sides of beef sliding on the overhead rail with a rattle first. Warm pipe halfway: the only warm place | The cat is on the warm pipe, and Jo shares it. Lit pedestal at the top |
| 3 | THE PREP KITCHEN | STOCK THE LINE BEFORE THE DOORS (a real wall clock) | 3 mise tickets, 80 s, more than a first-timer finishes. Each done gives +3 portions to that station at the rush. **Choose** which | Sacks on a mezzanine, window box jump, oven door on a cycle; Brann walks the floor, his grab sends you to the door (duck under it, go over him) | Tomé chopping onions, crying, laughing at the wireless. Tomé says what the room will order (a hint worth reading). Brann checking |
| 4 | THE LINE | THREE SITTINGS, FOUR STATIONS. PLATE WHAT THE RAIL SAYS | Authored, teaching order: sauce, then grill, then grill+sauce, then overlaps, then a table that changes its mind, then TABLE 1 | Beat-synced burners between the larder and the pass, a plate rail above them (slower, safe, tips in the flames). Luc the runner: "BEHIND!" then he comes, hop him or lose the plate. Run out of stock and the reserve shelf is at the far end | Aurelio behind the hot window, tasting, spiking, "Next." Marguerite at the sauce, taking your strays. Brann calling tickets |
| 5 | THE PASS | HIS SIDE OF THE WINDOW. FINISH TABLE ONE | One ticket, no clock: finish it, wipe the rim, show your hands | No hazard. The tension room | Aurelio, facing you for the first time. **"Stage. Hands."** Plays out with Jo's actual hands |
| 6 | THE DINING ROOM | CARRY IT TO TABLE ONE. WALK. | One plate, in hands the whole way, walk only | The walk. Lamps click off behind him | Nobody. Every plate you sent tonight sits at its table, untouched |

## Story, in order

1. Yard: Marguerite at the back door, cigarette. "You're the new stage? Good, we're drowning." Her warning: "Whatever you hear on the tube: Chef never says 'good'. Don't wait for it."
2. Pit: Bastien. Clear the rail. Marguerite gives the apron: "It's got a pocket. Anything for Chef goes in the pocket. Your hands are for plates."
3. Speaking tube: "Saffron. The cold store. Now." Cold store. Halfway, the warm pipe and the cat.
4. Prep: Tomé. "Everyone orders the bass when the Carnet's in the room." Clock on the wall. Marguerite: "Doors!"
5. Line: the rush. "Next." "Next." "Next." Tables sent out through the hatch. Madame Lisle of the *Carnet* is in Table 1 (a name on a card, nobody has seen her). Tube: "Stage. Bring it to the pass. Yourself. I want to see your hands." Marguerite, quieter: "...He's never asked to see anyone's hands."
6. Pass: the plate. **Choice**: gold, as on the menu. Or Tomé's staff-meal onions under it, only if you stopped to watch him and took the spoon he offers. Or send it plain.
7. "Stage. Hands." The camera closes. Jo's hands on screen, painted from the run: burn on the thumb, frost on the cuff, flour in the nails, onion. Aurelio reads them, line per mark. Clean hands read differently. "The risotto. The saffron. The gold. It's... correct."
8. **Choice**: "Is it good?" or say nothing. Either way: "...Next." The kitchen's noise rushes back as he turns.
9. Marguerite: "The runner's gone. It's your plate." The swing door. Through it the kitchen **drops out**. Silence, a long room, candles, all the tables laid. On each table you served tonight, your plate, untouched, going cold.
10. Table 1: a card with a name. An empty chair. [E] set it down. The lamps click off, one at a time. The orb, over the plate.
11. Ending image: one plate, one lamp, a white cloth.
    - Menu: the fork has not moved. "Nobody came. It was correct."
    - Own dish: one forkful gone. Marguerite at the swing door, wiping her mouth, looking away. She says nothing. Neither of you ever mention it.
    - Plain: a clean plate, a clean rim.

## Small moments (each has a person, each is easy to find; ids `m1 m2 m3` kept so old saves count)

- `m1` Tomé, onions, crying, laughing at the wireless. [E] watch Tomé. "He wasn't crying about anything." He offers a spoon: pocket gets the onions.
- `m2` The cat on the warm pipe, cold store. [E] sit with the cat. "It found the only warm place, and stayed."
- `m3` Bastien, hose arc and soap, singing terribly. [E] listen to Bastien. "Nobody was listening. He didn't need them to."

## Sound

| Place | Bed | Music | Change |
|---|---|---|---|
| Yard | rain, drain, far street | wireless through the wall | |
| Pit | water, plates, steam | wireless low | |
| Cold store | compressor hum, no people | none, wall filter | it's the quiet one |
| Prep | knife, sizzle far off | wireless, clear | |
| Line | sizzle, plates, order calls | swing up, horn in, tempo up each sitting; burners on its beat | |
| Pass | kitchen muffled, heat lamp | quiet pad | the kitchen ducks under his voice at "Hands." and rushes back on "Next." |
| Dining | **nothing**. One candle-quiet room tone | none | the door is the cut. One click per lamp |

## Difficulty (scene.difficulty, dreams caught)

0: tickets at authored time. 1: dues ×0.9, burners every 3 beats instead of 4. 2+: dues ×0.8, burners every 2, Luc faster, one more ticket in the last sitting. The prep clock shortens ×0.9 per tier, floored at 0.7. A bot test keeps every tier finishable.

## Soft failure

No fail state ends the dream. Refire, Marguerite's bail, thrown out = back to the room's lamp with the rail intact. Zero hearts = the shared death card and back to the lamp, service still running. A prep with nothing done still opens the doors; you just live off the reserve shelf.

## Coins

60 to 80 brass tips (worth 5). Over the burners on the plate rail, up the cold racks past the warm pipe, the mezzanine in prep. None on the forced path except a couple of breadcrumbs. A plate sent with time to spare drops a tip at the pass.

## Build list

- [x] `src/engines/tickets.js` pure, `tests/tickets.test.js` with a seeded bot: expert, ordinary, slow, at each difficulty; refire and bail; stock; hands-full can't deadlock; hands reading.
- [x] `src/dreams/chef/`: dream, rooms (yard, pit, cold, prep, line, pass, dining), dialogue, beats, verbs (rail, kitchen hazards, life), props, materials, music, people.
- [x] People in `src/dreams/chef/people.js`, `CAST_BODIES`, `costumes.js`, `cast-bake.js`.
- [x] HUD rail widget: real paper tickets, top centre, hud.region. Readable signs per the ui-type skill, station boards, prompts with verbs.
- [x] Beds and loops additive in `places.js`, `eraLoops.js`.
- [x] Platform 1 boards the dream. `EndingSequence`: `ending.variant(F)`.
- [x] Delete `ChefScene.js` and what only it used. Old saved Chef run: dropped quietly, station offers a fresh boarding.
- [x] Scenarios: `chef-places`, `chef-rail`, `chef-pocket`, `chef-playthrough`, `readability-chef`; `shadow-slope` and `slope-chef-*` point elsewhere.

## As built (differences from the list above)

- Eight numbered tables out front (2 to 9). Each shows a plate if it was sent that night; a table served twice shows one plate.
- The grease blobs that split, on the review's keep list, are not in. They belong to the candy-world tone the rebuild cut, and Luc and the burners already put a plate on the floor. Brann's duck-under grab keeps the dock hand's idea.
- The doors back from the pass and out of the dining room stay shut, on purpose: the plate can't go back.
