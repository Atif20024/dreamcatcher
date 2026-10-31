# THE LAST HAND, rebuilt: the Lantern Queen, 1884

The spec is `docs/redesign/advice/gambler_champion_critique.md` (owner approved). The neon casino is gone from platform 7. In its place is Lou Verrick's dream. It is set on the paddle steamer *Lantern Queen*, on the river Verrane, in autumn 1884, with the Port Merrow quay. The game is SHOWDOWN three-card poker. Only STAND UP catches the dream.

Code: `src/dreams/gambler/`. The rules are pure engines in `src/engines/showdown.js`, `faro.js`, `slate.js` and `purse.js`. The old `GamblerScene` still plays with `?legacy=1` or `?warp=gambler_legacy`.

## The night, place by place

Each place has one goal, shown on arrival, that names only what can be seen. Rooms change at drawn doors: a cabin door, the companion stair, or the pilot house door. Every change dips through dark; nothing crossfades.

| Place | Kind | The goal | What happens |
|---|---|---|---|
| **PORT MERROW** (quay) | exterior, dusk, fog, gas lamps | "the man in the claret coat by the gangway is Lou: talk to him", then "chalk your line on the gangway slate" | Lou explains the dream. Jo chalks three numbers on the slate: buy-in, stop-loss and goal. The saloon door on the main deck opens. The band is heard through the hull. |
| **THE MAIN SALOON** | interior: walnut, a clerestory, chandeliers, runners | "double $40 at the faro bank: get it to $80" | The faro bank. The beginner's run is real (55% for two bets, then 47%), and a split is the house's edge. There are two comps on Mr Pell's book: a whisky (it adds TILT) and the house staking the first bet. A four-piece band plays the whole time. Mrs Fenn plays her one coin (a Small Moment). |
| **THE CARD ROOM** | interior: green baize, a green lamp over each table | "win a pot at each table: the Judge, then Sorrel and Nico", then "the third table: all three of them" | SHOWDOWN at three tables. Jo sits in Lou's chair and Lou stands at his shoulder. Out past the French doors is the guard rail, where TILT comes down. |
| **THE PURSER'S OFFICE** | interior: the brass cage, the safe | "through the corridor to the hurricane deck stairs" | Mr Pell offers a marker: $50 on Jo's word. Each marker lowers the corridor ceiling by a tile (to three tiles at the least) and dims its lamps. Crake then walks the corridor. He never runs. |
| **THE HURRICANE DECK** | exterior, first grey light | "reach the pilot house with a clear head" | Jo jumps an open hatch (a fall costs a heart and puts him back on safe ground), climbs the ladder onto the texas roof, and gets past two escape pipes that blow steam on a beat. Tilted, there is no warning wisp and the blow lasts longer. The ratlines up to the crosstree are optional; the heart shard is up there. |
| **THE PILOT HOUSE** | interior, glass on three sides, the wheel | "stand up from a table you are winning" | Judge Voe deals one more hand: kings and nines face up for both, and the third card decides. CALL plays for the night's profit and RAISE plays it all. FOLD and BLUFF are dark. STAND UP is the only way out of the room. There is no orb here. |
| **THE LANDING** | exterior, dawn, no music | "Lou is at the rail on the quay", then "count the night on the quay: the coin by the bales" | Lou says "I'd have stayed." The orb is one small gold coin. The ending prints the honest ledger. |

**The finale, both ways.**
- **Stand up.** The Judge laughs and deals himself a hand. The lamp dips, the stair door opens, Lou says his line, and the coin is the catch (`dreams.gambler`).
- **Take the hand.** The odds are fair: identical up-cards, and the third card comes off a shuffled deck.
  - A win pays one note, no fanfare, and the Judge slides another hand across.
  - A loss takes the night's profit and puts Jo back on the quay. He is told so on the split-flap board.
- No path through the hand ever shows an orb.

## SHOWDOWN, the slate and TILT

**The table panel.** It sits on a solid ground above the table, so the people stay visible below it. All of its text uses the bitmap fonts at the §8 screen size. It shows:
- each player's name, the card they show, and their tell in words;
- Jo's three cards, each with its rank, and what they make;
- the pot and the HOUSE slot. On every pot won, a brass coin drops into the slot: that is the 5% rake, rounded up.
- the five verbs;
- one line underneath: Lou's whisper, what just happened, or the rule strip "THREE OF A KIND > A PAIR > HIGH CARD".

**The tells are true every time.** They are also drawn on the people:

| Player | Tell | What it means |
|---|---|---|
| The Judge | hums (notes rise) | strong |
| The Judge | (nothing) | He calls everything. |
| Sorrel | pinky off the glass | She has something. |
| Sorrel | hand still | She folds to a raise. |
| Nico | touches his collar | Scared: he folds to a raise. |
| Nico | hands flat | strong |

**The verbs.**
- RAISE is lit only with a pair or better. BLUFF is lit only without one.
- A bluff works only when every tell at the table says the player will fold. It cannot work on the Judge, or on Sorrel with her pinky off the glass. When it fails, the panel says which tell called it.
- A fold shows what it did. "FOLDED. SAVED $10" in gold, with a low chime: the loudest sound in the room. Or, dimmed: "that hand would have taken a pot of $N".

**Lou.** He gives one tip a hand, and is wrong about one hand in four. At the third table his first tip is always wrong.

**The slate.** The stack is a HUD bar with a red post at the stop-loss and a gold post at the goal. The slate's numbers sit on the tool line. Under the stop-loss the table's frame darkens; at the goal it glows. Nothing ever tells Jo to leave.

**TILT.**
- It rises on:
  - a bad beat (a pair or better that loses);
  - a called bluff;
  - a pot of $40 or more lost;
  - a comp;
  - a marker.
- Tilted, the game gets harder:
  - the tells blur and their words become "· · ·";
  - Lou is drowned out;
  - the cursor creeps toward the big bet by itself;
  - the edges of the screen darken and breathe;
  - the deck's pipes stop warning before they blow.
- It comes down only by walking in the air: ten seconds on the card room's guard or on the deck takes it from full to nothing.

**A bust** (the stack can't ante, or the faro bank is empty) sends Jo to the quay with Lou's bar reset. The dream's flags are kept.

**The ending ledger**, from the playthrough:
> "I'd have stayed." Lou, at the rail. | 1 hour at the tables. 11 hands, 32 turns at the bank. | The house took $24 in rake. 1 comp on Mr Pell's book. | 9 folds; the good ones kept $70. | Home with $100: up $0.

## Readability and materials (the owner's two complaints)

- **Signs.** Every sign is a `sign` entity: uiText at body ×2 (cap 18 at zoom 1), on its board, with the board declared as the backing so the audit checks it at 4.5:1. No words are painted into any prop.
  - The signs: PORT MERROW WHARF, LANTERN QUEEN, SALOON, THE SLATE, BAR, FARO BANK, CARD ROOM, NO CREDIT AT THE TABLES, THE GUARD: TAKE THE AIR, PURSER, MARKERS ON YOUR WORD, HURRICANE DECK, PILOT HOUSE.
  - `__dc.readability()` is clean in every room and on the slate, faro, two-player and three-player panels.
  - `readability-gambler` passes. It sweeps 15 screens of the quay.
- **Materials.** There is no lattice anywhere. The surfaces are:
  - granite quay blocks;
  - caulked pine decks (oiled inside, grey up top);
  - oak floors under claret Brussels runners;
  - walnut panelling;
  - white-painted pine with gingerbread fretwork;
  - brass, cut glass, stained-glass clerestory lights, green baize and sheet-iron chimneys;
  - the river and the sky.
- **B** is not bound in this dream. The table verbs use the arrows and [E].

## Scale, people and sound

- **Scale.** Everything is drawn in code at 1 m = 44 px. `lint:scale` is clean. Some sizes:

  | Thing | Size |
  |---|---|
  | The Lantern Queen | 30 m shown, cropped by the camera; 14 m chimneys |
  | Doors | 2.3 m |
  | Card tables | 1.6 m across and 0.78 m high |
  | The pilot wheel | 3.6 m |
  | Gas lamps | 3.9 m |

- **People.** The cast is 19 people plus Crake, on the WP2 rig in 1884 costume. New hats: bowler, silk hat, planter's hat. New held things: cards, a glass, a banjo, a clarinet.
  - Lou follows Jo at his shoulder in the saloon, the card room and the pilot house.
  - The steward, Dev and the porter pace.
  - Legs are stepped by the distance walked (Stride), so nothing slides.
  - Crake walks the `measured` gait and never runs.
- **Jo's light.** He carries a tin bull's-eye lantern only in the corridor and on the deck before dawn.
- **Music.** Each place has a key in `music.js`:
  - the saloon: a schottische in G on parlour piano, banjo, upright bass and clarinet;
  - the quay: the same tune through the hull;
  - the card room: one low string pad;
  - the deck: the pad with a clarinet line;
  - the office, the pilot house and the landing: nothing.
- **Ambience.** Seven new era-loop recipes:
  - the quay: lapping water, creak, a bell buoy, gulls;
  - the saloon: chatter, glasses, chips;
  - the card room: a fan, riffle, chips;
  - the office: a quill and timbers;
  - the deck: wind, rope and the paddlewheel;
  - the pilot house;
  - the landing at dawn.
- **Acoustics.** The rooms use the room acoustics. The game was silent throughout development and nothing was heard.

## Files

- **New:**
  - `src/dreams/gambler/`:
    - `dream.js`, `dialogue.js`, `beats.js`, `people.js`, `props.js` (36 props), `materials.js`, `music.js`, `table.js`;
    - `encounters/tables.js`;
    - `verbs/purse.js` (the HUD, the air, derived flags, the tilt vignette);
    - `verbs/boat.js` (the pipes, the corridor, its lamps);
    - `rooms/*` (7 rooms).
  - `src/engines/showdown.js`, `faro.js`, `slate.js`, `purse.js`.
  - `tests/showdown.test.js` (22 tests).
  - `src/dev/scenarios/gambler.js`.
- **Framework** (see `FRAMEWORK.md` §20):
  - `Encounters.js`: menu arrows;
  - `DreamScene.js`:
    - `onFail`;
    - the `call` step;
    - `sign`;
    - `pace` and `follow`;
    - `always` verbs;
    - orb tint;
  - `dreamAdapters.js`: `spawnSign`;
  - `Npc.js`: walking;
  - `hud.js` and `HudGrid.js`: meter ticks;
  - `encounterPresenters.js`: three views;
  - `JoLight.js`: the bull's-eye.
- **Shared:**
  - `art/rig/cast.js` (3 hats, 4 held things);
  - `rig/gaits.js`;
  - `entities/foeArt.js`;
  - `data/scale.js` (bodies);
  - `scripts/lib/cast-bake.js`;
  - `audio/instruments.js` (parlour, banjo, clarinet, strings_low);
  - `audio/eraLoops.js` (6 sounds, 7 loops);
  - `data/joLights.js`;
  - `data/kinds.js` (crake);
  - the rebuilt `public/atlas/people*`.
- **Wiring:**
  - `data/dreams.js`: `LEGACY_GAMBLER`, the half dime (worth 5, 44 placed, budget 40–55), the livery and the conductor;
  - `dev/warp.js` (`gambler_legacy`);
  - `scenes/IntroScene.js` (the quay arrival);
  - `dreams/index.js`;
  - `entities/Train.js` (the blind now reads MERROW).
- **Scenarios moved to `gambler_legacy`:** `betCard`, `backgroundSnap`, `backdrops`, `phase2`, `round2` (stairs and carpark), `failure`. The place sweeps (`readability`, `scale`, `wp6`, `round2` contrast) now use the new quay.

## Checks

| Check | Result |
|---|---|
| `npx vitest run` | 188 passed. New: `tests/showdown.test.js`, covering rank and tells, rake, the fold's saving, bluff as a read, the creep, Lou's error rate, the last table's fair coin, the faro schedule and split, the slate, purse cooling and the ledger. `audioMix.test.js` sits near its 10 s hook limit and timed out once while the browser was busy; it passes alone. |
| `npm run lint:content` | 0 failures. Framework dreams: `clockmaker, musician, painter, gambler`. |
| `npm run lint:rooms` / `lint:scale` | 0 failures (36 warnings, as before) / clean. |
| `npx vite build` | Built. |
| Gambler scenarios | All 11 pass: board, places, coins, legacy, quay, saloon, cards, tilt, office, deck, playthrough. `readability-gambler`, `scale-gambler` and `jo-contrast` pass too. |
| Room budgets (`gambler-places`) | 215–297 objects and 65–103 draw calls per room. Rooms paint in 23–92 ms. |
| Full scenario run | See the end of this report. |

**`gambler-playthrough`** uses real inputs throughout. It goes:
1. Lou, then the slate (chalked to stop $50 and goal $160).
2. The saloon door, the whisky comp, and the faro bank. The bank busted once and sent Jo back to the quay; he came back and doubled it.
3. The three tables, played on the tells, standing up after each pot.
4. Declining the marker, then the corridor.
5. The jump over the hatch, the ladder, and timing the pipes.
6. The pilot house. The last hand is taken twice: the first win slid another hand across; the second loss sent Jo to the quay. In both cases there was no orb and `dreams.gambler` was not set.
7. Back at the table. STAND UP: the lamp dips, the landing, Lou's line, the gold coin, CAUGHT, and back at the station.

The scripted run takes 2.6 minutes of game time without the walking a player does. A first play should take 8 to 10 minutes.

## Screenshots

Taken while I worked, in the scratchpad:
- `gambler_quay.jpg`
- `gambler_saloon.jpg`
- `gambler_cards.jpg`
- `gambler_office.jpg`
- `gambler_deck.jpg`
- `gambler_pilot.jpg`
- `gambler_landing.jpg`

## Known gaps

- **The faro goal is luck.** The spec calls the saloon "pure luck". With $20 bets the bank busts about half the time, and a bust sends Jo to the quay (the scenario busted once). A player may walk the quay twice. Worth a play-test. A softer option is a longer beginner's run.
- **Seated poses.** Seated players sit on the chair props but don't hold their cards. The tells are overlays (notes, a glass with a lifted little finger, a hand at the collar, hands on the baize), not rig animation.
- **Jo stands at the table** to sit down: the encounter pose is `sit`, and he sits in the chair's place.
- **Esc during a hand** opens the pause menu, as in every dream. STAND UP is the way out (Backspace also steps away). The last table can't be left by Esc.
- **The quay's bale ledge** is a one-way plank laid over the bales and crates. It reads as a plank, not as the bales' own tops.
- **The deck's hatch** reads as a gap in the deck, not yet as a framed skylight.
- **Audio** has not been heard (dev is silent): the band, the pad, the river loops, the fold chime and the rake's coin are code only.
- **The legacy `GamblerScene`** is untouched and reachable. It now carries the bull's-eye lantern in its dark rooms instead of the phone.
