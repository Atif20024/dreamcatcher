# The proof dream at Crossroads: THE STOPPED HOUR, platform 9

The owner liked the proof dream: the lane, the green with its big trees and the house, and the clock house where the room changes around Jo. It is now a dream on the board, a train like the others.

## The dream
- **THE STOPPED HOUR**, the clockmaker's dream. Jo wants to keep a small town's time, which is work nobody sees until the evening it stops.
  - At six every lamp went out, and the clock with them.
  - The lamplighter, now named Nell (the writer's poet keeps the name Wren), needs steady hands to seat three gears.
  - Jo winds the clock, steps back out onto the lit green, and the gate opens.
  - Up in the bell yard he catches the dream.
- **Conductor:** "Keep its time, sir, and nobody will ever know your name. Still boarding?"
- **Ending card:** SEVEN O'CLOCK.
- **Moved to `src/dreams/clockmaker/`.** The id is `clockmaker`, and `?warp=proof:start` still works as an alias (`DREAM_ALIASES` in `src/dreams/index.js` and `src/dev/warp.js`).
- **Objectives** are clear from the first frame ("the lamps are out: find the lamplighter on the green").
- **Every gate has a sign**, and there is a lantern checkpoint in every room: THE LANE, THE GREEN, THE CLOCK HOUSE, THE BELL YARD.
- **Coin: brass cog, worth 3, budget 30–40. 30 are placed.** They follow the collectibles rules: coins sit on the harder way (on top of the wall, in an arc over the puddle dip, on the high ledge, in an arc over the well, at both ends of the mezzanine, on the hilltop behind the bell). There is one breadcrumb on the clock-house shelf.
- **DreamScene now supports coins:** room entities `coin` / `coins`, the HUD, the wallet, the death scatter, and resume.
- **The ending records the catch** (`completeDream('clockmaker')`). Jo returns to the hub, the train runs its return-and-die, and the board row reads CAUGHT.

## The train
- **Platform 9.** It has a green-and-brass livery and a new `clock` emblem in `trainArt.js`.
- **The hub had no free bay,** so the map is 17 tiles wider (150 → 167):
  - `platforms_b` now runs cols 110–156. Bays 9 and G stand past the luggage ramp, which now steps back down.
  - A separate 17-column room was tried first. It failed `blend-continuity`, because a narrow room's crossfade jumps.
  - The service gate room moved to cols 157–166.
  - `BAYS` gained 141 and 148, and `bayIndex()` maps a platform number or letter to its bay.
- **Hub return fix.** `HubScene.init` now clears `returnedFrom` after reading it. Phaser reuses a scene's last data when the scene is started again without any (the Evening's end, a dev warp), so an old return replayed: the train backed out again and Jo was locked for 7.5 s.
- **Arrival:** the WP3 full-scale arrival in `IntroScene` (dusk town, clock tower stopped at six), with the title card "THE STOPPED HOUR".

## THE LAST STOP (owner bug: "I press E and nothing happens")
- **Root cause.** The hub's own `handleModalUpdate` answered a card only on **X**. The last stop's card says "[E] Go through [Q] Not yet", so E did nothing and Q never closed it. Jo was stuck behind the card.
  - Reproduced with `__dc`: at the turnstile, the first E speaks, the second E shows the card, and the third E leaves `cardActive` still true.
- **Fix.** E or X confirms, and Q or Esc declines. The press that opened the card is ignored for 250 ms.
- **THE LAST STOP now has a real bay (platform G)** beside platform 9. It boards through the same gate, conductor and walk-in flow, then starts the Evening.
  - The turnstile and The Counter's line still work as a second way in.

## Also in this pass (hub and intro)
- **Hub NPCs step by distance.** Each one gets `attachStride` from the motion package, so its legs follow the ground actually covered and its `-idle#` task loop plays while it stands. Bilal no longer slides to the dumbwaiter, and the sweeper's hand-stepped walk is replaced.
- **IntroScene walk:** one frame per step of Jo's manifest walk (8 px), not 6 px.
- **Walk by default at the hub and in the Evening** (owner decision). `Player.walkByDefault` makes these two places walk at 80 px/s, and holding Shift (LB) runs at the scene's own speed: 280 at the hub, a 215 jog in the Evening.
  - A one-time hint reads "walking. hold SHIFT (LB) to run", and the hub pause card shows the keys.
  - The dreams are unchanged.
  - The hub has no jump gaps; its stairs are walked. The Evening's gaps keep a running jump on Shift.

## Scenarios
- **`src/dev/scenarios/proofTrain.js`:**
  - `clockmaker-board`: the hub bay and board row, [E] at the gate, the conductor, Intro, then DreamScene in the lane with the title card and coin HUD.
  - `clockmaker-coins`: 30 placed, worth 3 into the wallet.
  - `clockmaker-alias`: the old warp still opens the dream.
  - `last-stop-board`: walk from the hub spawn to platform G, board, and reach the Evening.
  - `last-stop-turnstile`: the old way in, with E on the card.
- **`phase3.js`:** the proof scenarios are renamed `clockmaker-*`. `clockmaker-playthrough` now also checks the caught flag, `returnedFrom`, and the board row CAUGHT, then un-catches the dream so the run can repeat.
- **`round2.js`:** the slope runs set their speeds explicitly, so they switch off walk-by-default while they run.

## Screenshots (`sheets/`)
| File | Shows |
|---|---|
| `proof-train-hub-bays.png` | Platforms 9 and G, the turnstile beyond |
| `proof-train-board-walkin.png` | Jo walking up platform 9 |
| `proof-train-arrival-door.png` | The arrival: Jo in the coach door |
| `proof-train-arrival-depart.png` | The green-and-brass coaches with the clock roundel |
| `proof-train-lane-title.png` | The lane: title card, objective, cogs on the wall |

## Verification
| Check | Result |
|---|---|
| `npm test` | 106/106 |
| `npm run lint:content` | 0 failures (framework dreams: clockmaker clean; scale 229 measured, 0 failures) |
| `npm run lint:rooms` | 0 failures (hub: 5 rooms) |
| `npm run lint:scale` | clean |
| `npx vite build` | OK |
| **Scenarios** (own tab, port 5194, dev silent) | **First full run:** 79 passed, 5 failed (`background-snap`, `blend-continuity` hub, `clockmaker-board`, `clockmaker-coins`, `last-stop-turnstile`).<br>**Fixed:** the narrow-room blend, the stale hub `returnedFrom`, and the coin magnet count.<br>**Re-run:** those 5, plus `clockmaker-playthrough`, `last-stop-board`, `boundary-no-flicker` and every hub/train scenario (`jo-route-hub`, `slope-hub-steps`, `readability-hub`, `scale-hub`, `train-scale`, `board-train`, `arrival-train`): all pass. |

## Files touched outside the hub, intro and dream
- **`src/entities/Player.js`** (motion agent's file): `walkByDefault`, a 3-line additive switch, for the owner's walk-by-default decision.
- **`src/scenes/EveningScene.js`:** walk by default, and the hint.
- **`src/scenes/DreamScene.js`:** coins.
- **`src/art/trainArt.js`:** the `clock` emblem.
- **`docs/redesign/FRAMEWORK.md`:** the path to the reference dream.
- **Scenario files:**
  - `scale.js`, `readability.js` and `round2.js`: the dream id.
  - `round2.js`: the slope runs switch off walk-by-default.
