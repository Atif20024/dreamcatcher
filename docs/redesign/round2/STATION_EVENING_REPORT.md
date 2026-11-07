# Station and THE LAST STOP: report

Specs: `advice/deep_review_station_evening.md`, `advice/laststop_review_r1.md`, M1 of `advice/fresh_review_design.md`. Scenarios: `src/dev/scenarios/station.js`. Pure tests: `tests/hubState.test.js`. Nothing was heard: dev is silent, so every sound item below is wired and checked by state, not by ear.

## Browser check of the merged feel work

Passed: `jo-jump-arc`, `jo-land-soft-hard`, `jo-walk`, `jo-skid`, `jo-foot-slide`, `hub-ladder-undercroft`, `hub-ladder-roof`, `dream-ladders-both-ways`, `writer-ladders-both-ways`, `hit-knockback`, `zero-hearts-checkpoint`, `volume-sliders`, `restart-death-card`, `restart-evening`, `astro-pool-scale`, `astro-pool-hoops`, `eva-tether-trap`, `dream-seams-dip`, `hub-thresholds-dip`, `hub-threshold-no-flicker`.

- **Settings menu:** six rows fit inside the panel with room to spare (looked at the shot).
- **Pool vault:** Jo lands on the deck at 30, 60 and 144 Hz (same spot, y 1130). Measured rise from a swimmer's start was 163, 154 and 145 px, so it is not a flat 117 px across rates in this measurement. It clears the lip every time, the deck beat is there. The file belongs to the Astronaut job, so left alone.
- **Station deadzone (HubScene.js opening):** no snap. Largest camera move after the opening hands back: 1 px a frame; walking and turning: 2 px a frame; a jump: 0 in y.
- **Fixed:** `__dc.step` left `game.loop.delta` at 0, which froze the old `easeFollow` camera in every stepped run. One line in `harness.js`.

## M1 of the fresh review: nothing closes at 5

| Item | Done |
|---|---|
| Cap removed (`HubScene.js:91`, `hubState.js`) | `N` counts running dreams caught; `k = N / running`. |
| State table stretched | `hubState(n)` interpolates the six rows over `DREAMS.filter(d => d.scene)`. Every catch moves saturation, crowd, tally, music. Fountain and skylights step at their row. The clock stutters only at the last. |
| Headlines, Pemberton, Bilal | `headline`, `pembertonLine`, `teaLine`: authored none-to-all, stretched by `stretch()`. Today every N of 7 has its own line. At 9 or 10 some middle lines repeat; first and last stay right. No table edit needed. |
| Shop | Open at every N. At all-caught the shelf is free: `Everything left on the shelf is yours. I never found a price for it.` |
| Dreamcatcher | `WEB_ORDER` takes any new running dream as the next round. |
| Old saves | A caught id that no longer runs counts for nothing; past-the-table saves clamp; missing flags read false. `tests/failure.test.js` still passes. |
| `getDifficulty` cap at 5 (`utils/save.js`) | **Left.** It is the heart and difficulty cap, not the station's count, and the dreams read it. |
| The review's "board takes five" recommendation | Not done: the owner decided against it. |

## MUST

- **M1 staged return.** After `returnAndDie`: the short dip, Jo under the dreamcatcher, locked while the strand is woven with a halo in the dream's colour, then control. A return with nothing caught just gives control. Pemberton is off screen from there, so his call is a line at the west edge: `from the desk, down the hall: "Welcome back, sir."` Scenario `station-return-staged`.
- **M2 the Evening's way out.** One-time `hold ↓ to sit` by a bench after 3 s still, `Q — the horn` after 25 s still; both also on the pause screen. The station bench ends the evening only after 6 places or 2 people helped; until then it is a bench. When the rule first comes true: one chime. Near the board afterwards it flickers `STAY AWHILE`, then dashes. Scenario `evening-bench-gate`.
- **M3 prompts.** `[E] talk`, `ask`, `board`, `continue`, `push the gate`, `go through`, `browse`, `pull`, `look`, `have tea`, `a flower`, `play along`, `hold the kite`, `read the tags`. Ids stayed as they were (scenarios and Bilal's lookup use them); the verb is a new option. Raised above heads so it no longer covers faces. Scenario `station-prompts`.
- **M4.** See above. Pemberton's six lines used as written. `Mind the gap.` is the floating last-walk line only.
- **M5.** Flower seller: `E` gives a flower, worn on the lapel in the station and the Evening; `flags.hub.lastFlower` is now read, Wren says `Nice flower. Where'd you find that?` once at the hedge. Her float only says "the last one" while it is true. Sleeper: `E` gives `…mm. five more minutes.`, and after the three moments `…is it still evening? good.` (both his Evening lines). His waking no longer waits for N.
- **M6.** Bilal's first tea tells him about the stall. The review's "grate by the fountain" is wrong (fountain col 56, grate col 77), so: `On the house. The real stall's under the floor: the grate past the fountain, by the Left Luggage sign. Bring change.` The off-screen float is gone. Postcards offered for every running uncaught dream, three to a page; `BaseLevel` reads them by dream id, so they work everywhere it places moments.

## SHOULD

- **S1.** Within 5 tiles of an uncaught train that dream's `ambientLoop` rises with distance on the ambience bus, including platforms 3 and 8. A caught train is silent. Each bay has its own painted corner from `propsKind` (`src/art/bayProps.js`); an unknown kind gets crates.
- **S2.** Ro moved from the street to col 74 beside the dreamcatcher: everyone passes her going to a train, and she is at Jo's elbow on a return (`You. Over here.`). `E` is a real shine: 1.5 s, brush sound, a glint at the toe, then her line. The shoe tint was skipped: Jo's shoes are not a separate part of his sprite.
- **S3.** `NOT IN SERVICE` on board and sign. Conductor lines as written, from `WAITING_LINE` in `dreams.js`.
- **S4.** `finished`: Pemberton's end-of-the-line line, once. `trumpet_left`: Bo's note goes brass with a faint horn, he keeps playing past the point he would stop, and says the line. Finds show on two shelves in the Lost & Found window; `E` lists them with `pocket: n/12`; empty, it hints at the last stop. The optional early-Evening line is in: `You've been through the gate. The board noticed. Back for the rest?` on the first catch after an Evening visited at N=0.
- **S5.** Emoji padlock replaced by a painted one. At all-caught: chains fall the first time he sees the doors (once, saved), amber through both side doors, both go through to the last stop; sleeper gone, coat folded, `(a coat, folded. still warm.)`; objective `the last stop`.
- **S6.** Gate room: own bed `gate_hum`, no PA, a low hum loop, a counter click every 20 to 40 s. Card shortened as written.
- **S7.** Bo and Bilal lines in. Wren's four drafted lines, checked against the dialogue and changed where wrong:
  - writer: page three can be cut, so she reads the flag. `Page three. You kept it. I read it. Don't look like that.` / `Page three. You cut it. I read it anyway. Don't look like that.`
  - painter: kept, but `like a boy`, which is what Gualtiero calls him.
  - gambler: the draft had Lou at the table. Jo sits in Lou's chair and Lou stands. Now: `Lou says you got up from his chair. He's still telling people.`
  - clockmaker: there is one clock, on the green, and it gets fixed. Now: `Nobody thanked you for the clock on the green. Nell says that's how you know it's working.`
  - All four only after that dream is caught.
- **S8.** Postbox: `post what's in your coat`, a confirming second press because it empties the wallet the stall needs. Chime, wallet to 0, ridge card `You carried $N. You posted it.` Pemberton remarks once. Scenario `evening-postbox`.

## Owner's decisions

- Boards: new column `THE NIGHT`: HOT, LONG / LOUD / LONG / PATIENT / VERY LONG / RISKY / GENTLE / WARM (`BOARD_WORD`, a block at the end of `dreams.js`, no existing line touched). Also on the platform signs.
- First visit: objective `the board, in the hall`; after the desk Pemberton adds `Though platform 9 is a gentle one, sir. If you were asking.` and the objective reads `platform 9: a gentle one` until the first catch.
- Rewards (N1, N2, major note B), modest and hinted:
  - **Roof:** 15 busker coins from the hatch both ways, in plain sight, each paid once ever.
  - **East end:** bench and lamp; sit 4 s: chime, a window lights in the leads and stays lit. `one window came on, over the last stop. nobody asked it to.`
  - **Clock tower:** a coin arc shows the jump from the bridge; bench, pigeon (sit 5 s: `The pigeon let him stay.`), and one heart shard.
  - **Hint:** the Kite Kid says it once as Jo reaches him, and on `E` afterwards. `[↓] sit` shows by the three benches.
  - **Below:** each caught dream's tagged case holds 5 of that dream's coin, paid once (`read the tags`). Chef $25, musician $5, about $145 for all seven: some dreams pay, some don't. Text is built from `dreams.js`.
  - Hub small moments stay three, so `MOMENT_TOTAL` is unchanged.

## NICE

| Item | Done |
|---|---|
| N3 clock tick | Only on the steps and in the hall. |
| N5 Bo's name | Shown before the duet. The duet no longer closes at N>=3; a stopped busker would have made the sleeper's wake impossible. |
| N4 phone rings, N6 levers, N7 map hints | **Not done.** Levers still clang: the board they would flip cannot be seen from below. |

## THE LAST STOP review

| Item | Result |
|---|---|
| MUST mill screenshot | Shot and judged: `station_mill.jpg`. Reads as a mill at Jo's scale, door fits him. MUST closed. |
| Mill wheel | Stone race under its lower third, water strip, moving foam. Terrain untouched. |
| Chess | Six pieces, light and dark. |
| Station hedge | Leaf-clump crown (`ev-hedge-top`). Still 3× Jo and two tiles wide; the review offered crown or cut, crown taken. The dark two-tile patch under it is older and untouched. |
| Bike stall | Moved a tile west; post clear of the step. |
| Radio crate | Dial, grille, aerial. Not looked at closely: Jo stood in front of it in the only shot. |
| Laundry | Sheets 6 px apart. The line now holds 6, not 8. |
| Narrowboat ripples, pigeon perches, wall lift | Not done (ruled leave or optional). |

## Kept as the review asked

Opening vista, doorway dips, Pemberton's call, tally, desaturation, board, conductor's choice, train walk-in, the Evening's premise, HUD ritual, wrap, road, pause map, Wren at the hedge.

## For the owner

- **Ghost town over the mountains on the road:** at the mill, a see-through row of houses hangs over the range to the west (`station_mill.jpg`). Reached by teleport, so a real walk may differ. Not mine to change here, worth a look.
- **`scale-hub`** flags the sleeper at 54 px (he is lying down). His art is unchanged in this work and the scenario was not on the list.
- **`[E]` in the Evening reads `e · label`**, the hub `[E] label`. The review said they match; they differ in form. Left.

## Verification

`vitest` 336 passed. `lint:content`, `lint:rooms` (11 existing warnings), `lint:scale`, `vite build` clean. Scenarios passing: `slope-hub-steps`, `opening-skippable`, `readability-hub`, `readability-evening`, `bark-one-at-a-time`, `evening-object-budget`, `clockmaker-board`, `last-stop-board`, `last-stop-turnstile`, `hub-dreamcatcher`, `restart-evening`, `hub-thresholds-dip`, `hub-threshold-no-flicker`, `hub-roof-drops`, `hub-safety-net`, `hub-ladder-undercroft`, `hub-ladder-roof`, and the six `station-*` and `evening-*` above. Full set not run.

Not played by hand end to end; the new sounds not heard; the Evening's ending after the new gate not watched to the credits.
