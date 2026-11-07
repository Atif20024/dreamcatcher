# Design fixes: what was left of `advice/fresh_review_design.md`

Each item was checked against the code before it was touched. Browser checks ran on port 5181, silent.

## 1. Foe grabs: done
- True as written: a foe winds up at 70 px and reaches 42, so Jo standing still between the two was never grabbed.
- Every human foe that comes for Jo now has a `lunge` in `src/data/kinds.js`. The floor is 130 (the slowest step that closes the gap); after that it's character: Crake, porters and inspectors 130, Brann 150, the landlady 160, the proofreader 170, rivals stay at 240. The wind-up stays 0.4 s.
- The numbers live in `src/entities/grab.js`. A missed grab now leaves him off balance for 0.45 s, so dodging pays.
- Found on the way: a wind-up's timer ran on behind a conversation or a card, so the grab fired the moment it closed. Now a foe that hasn't updated for a while drops the wind-up and gives Jo 0.9 s (`Foe.update`, every scene).
- Tests: `tests/lunge.test.js` runs every kind through standing (grabbed from any gap), ducking (never), running with a 0.25 s reaction (never), and walking from wind-up range (never).
- `foe-grab-fair` (new scenario, real Foe, real Jo) passes for all 13 placed kinds across six dreams. `chef-busy-brann` and `painter-lapis-theft` pass.
- Room fairness: a bot crossed Chef's prep, Musician's backstage and the Painter's guild, palazzo and via. Running through: 0 throws in all five. Stopping to duck at the tell: 0 throws in all five. A bot that walks straight at a foe and never reacts is thrown, as it was before this change.
- Not checked this way: Astronaut and Writer rooms got the per-kind check only, not a crossing.

## 2. Difficulty scaling: done
- True: Chef and the older dreams read `difficulty`; the four framework dreams only got the 8 % foe pace.
- `src/data/tuning.js` is one pure table per dream, three tiers like Chef's. Encounters go through it in one place (`host.tune`).
  - Musician: window down to 86 %, nerve per miss +4, one retry fewer (never below one). Tempo stays, since it is the room's music.
  - Painter: sweep, zones, plaster clock and Dori's pace.
  - Casino: Lou's wrong tips (1 in 4 to 1 in 3), the pipes' warning and blow. The odds and the deal never move.
  - Clockmaker: the dial a touch livelier (+10 % at most), same windows, same patience.
  - People's walking pace is now in the table for those four. The older dreams keep 8 % a catch.
- `tests/tuning.test.js` covers the tables, level 0 changing nothing, the giornata still finishing inside its clock at the top tier, and the clockmaker's gentleness.
- Not played at higher tiers by a person.

## 3. Economy: done
Measured income (coin count × worth, seven running dreams): **1,855**, as the review said. A real run collects less.

| Thing | Found | Now |
|---|---|---|
| Postcard | **Did nothing in the five framework dreams**: only the old scene drew the marks. The clockmaker has no small moments, so its postcard would have been empty | Works everywhere; marks small moments and the heart shard; the mark goes when taken. 100 |
| Shard | 1,050 for one heart, and worthless from the third catch, when caught dreams already filled the row to 6 | 60/120/200 (380 a heart). A whole heart counts on top of the caught-dream hearts, cap 8 (`heartsMax`) |
| Ticket | Real value (Jo stays where he fell, scattered coins in reach) but nobody was told | 150, and Bilal says what it does |
| Tea | Worked, silently | 20, says so on arrival: "Bilal's tea: a heart to the good." |
| Hats | Ro's six lines were written and never spoken | Ro comments once per hat. Prices unchanged |

The shelf is now about 2,300 against 1,855: everything that changes play fits inside 70 % of income; hats are what you can't also have. Coins remain unrequired. `tests/economy.test.js` holds this. Tea, ticket, the heart and the postcard marks were checked in the browser.

## 4. The Evening's cast: done
- Added, only if Jo met them: **Nell** at a lamp that doesn't need her, with a lamplighter's pole; **Bice** drawing Fereshteh's sheets; **Gualtiero** off his knees on the arch bench; **Lou** at the rail with nothing to hold; **Fenn** at the fountain, one coin. Lines were checked against each dream's dialogue. The clockmaker now marks Jo as having met it.
- Chef: Marguerite and Bastien are still the right names. What was wrong was the old kitchen in their lines (the soufflé, Bastien singing roast). Replaced with lines from the rebuilt dream, including Wren's roast in `talk.js`.
- `tests/eveningCast.test.js`. Seen in the browser in the square and on the arch bench.

## 5. Dialogue: done
- **Wren:** the Evening's Wren keeps the name. The Writer's mentor is **Maren** on screen (name, prompt, napkin, the pen's word). Her code id and `met_wren` stay as they are, so saved runs keep working. The racer's dreamer in `docs/dream_racer.md` is **Ottavia Castellane**. Nell's rig had already been renamed.
- **Nia's line** is now said once (`nia_backstage_after`); the wing and the stage have their own.
- **Choices:** Chef and Astronaut already have them. The Writer had none, so Maren's first line now asks ("I'm only listening." / "Is it that obvious?"), with its own reply and an echo at the napkin. No story change.
- **Narration:** Marcus's lines were already fixed. "Jo closes the tin" was the last one in the third person; it now says "I". The other observations are Jo's own, in his caption.

## 6. Variety of verbs: flag only
- Painter (mash, hold, double, stock), Musician (pitch and timing, rests, blind, held note) and Chef (the rail) have moved past it.
- **The Clockmaker** is the one still mostly "press when the marker is in the zone": the dial, the third gear and the seven strikes (the second gear is a climb). This sits with the owner's pending answer on its length, so nothing was changed.
- The Writer's typing lane and the Astronaut's medical holds were not re-examined.

## 7. Leftovers
| Item | Result |
|---|---|
| Captions over the job hints and `[ESC] PAUSE` | Fixed: captions sit above the bottom strip (`CaptionBar`) |
| Letterbox clipping the objective plate | Fixed: the HUD steps aside during a conversation (`HudGrid`) |
| Nell and the pole | Fixed: she takes a pole, walks over with real legs, and lights the lamp; the line is rewritten. The pole is only there during this beat |
| The child's caption portrait | Fixed: the window child is repainted to match the chip (bun, skin, blue) |
| Test panel shrinking at job's end | Fixed: the finished panel stays (`work.keep`). After a Continue only the trestle prop shows |
| Continue during the rush resetting stock | Fixed: the line's stock is saved with the run. `chef-no-twice`, `chef-continue` pass. No scenario asserts the stock itself |
| Astronaut's dark crater | Fixed: Priya's helmet lamp lights a pool round her |
| Board verdict silhouettes | Fixed: dark figures against a lit window. Still plain shapes |
| Birds in the grey year | True by state: the campus bed kept firing. Fixed: place sounds stop while `greyHold` is on. Not heard (dev is silent) |
| FOLD overshoot | Fixed: web 3 runs on to col 596 with a stop at its end, so a run off web 2 lands on it. The hazard tile at col 591 is gone. A wall was tried first: Jo hangs on it while holding right. `writer-press-route` now asserts the landing |
| Casino `jo-contrast` on the quay | Fixed without a carried lamp: the gas lamps at columns 4 and 18 now cast light. Edge 2.76 → 3.06 |
| `readability-astronaut` (added by the coordinator) | Reproduced with a wide goal. Fixed in the shared layout: the level line drops by the goal's real height. The scenario passes |

## Still open
- **`jo-contrast` fails on Chef's candle** (edge 2.1, needs 3). I didn't change Chef's lamp and did not check whether it failed before this branch. It isn't on this list. The Painter is 3.06 now.

## Gates
vitest, `lint:content`, `lint:rooms`, `lint:scale`, `vite build`: see the final report. Only the scenarios named above were run, not the full set.
