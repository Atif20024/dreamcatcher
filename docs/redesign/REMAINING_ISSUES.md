# Remaining issues (branch `redesign`, 2026-11-02)

Read-only audit. Source: the round2 reports, advice reviews and ROADMAP "Open from earlier reports". Each open item was checked against current code by grep and reading; nothing was run (no server, no browser, no tests), so "open" means "no fix found in code", not "seen failing".
Out of scope by owner order: Racer stage 2, rivals/story races, Athlete, Doctor, all new level content, nice-to-haves with no visible effect.

Sizes: S under 1 hour, M a few hours, L a day. Items are ranked by what a player notices.

## Dropped MUSTs (fixed since, confirmed in code)

- Racer R2 M1 (skip the straw brake): `wearStraw: 0.1`, `src/engines/race.js:42,432`. S1 to S5 also in (`keepGoing`, `RaceScene.js:104,334,344`).
- Clockmaker R2: no MUST. S1 to S5 (k1 line, six on the gable, pie woman "since", count on the window, scenario) all in `dialogue.js:58,89`, `encounters/clockwork.js:20-60`.
- Design fixes R2 M1 (hold-Down immunity in Astronaut boxing): `AstronautScene.js:729,748,761` (`duckedAtTell`). S1 Continue calm: `BaseLevel.js:901`. S3 card text: `data/teach.js:20`.
- "Board from the start pays twice": `systems/wallet.js:70`.
- Chef M1/M2, Writer W-M1..M5, Astronaut A-M1..M3, Musician M1..M5, Station M1..M6: all marked done in their reports; no contrary evidence in code.
- Sleeper 54 px scale flag: now exempted, `dev/scenarios/scale.js:97`. Captions over context line, letterbox over objective, Nell's pole, child portrait, test panel shrink, Continue restores line stock: all in commit `c74800c`.
- "Fix four machines" vs five machines: the fifth is `bound: true` to the press lever (`data/writer/rooms.js:97`); fine.

## A. Bugs and failing checks a player (or the test run) can hit

| # | Area | Problem | Where | Size | Touches |
|---|---|---|---|---|---|
| A1 | All dreams, ROADMAP open item | The night grade (multiply layer at depth 11) dims lit shop windows, stoves and other light sources. No exemption exists. Lights need to draw above the grade, or the grade must mask them. | `src/art/look.js:67-91` (`setupGrade`), light props in `src/dreams/*/props.js` and `src/art/props.js` | M | look.js, BaseLevel.js (grade depth), the light props |
| A2 | Station, Evening road | Houses on the viaduct are see-through from about col 396 to 407 (11 tiles): the town band crossfade. Partly fixed, "remaining" per POLISH; not seen since. | `src/systems/horizon.js` (town/road band fade, around line 622) | S | horizon.js only |
| A3 | Chef | Service yard is the first thing seen and Jo reads 2.18:1 (bar is 3:1). `jo-contrast` still fails on the candle. Needs a lamp or a lit patch. | `src/dreams/chef/rooms/*` yard, lamp/light data | S | chef rooms only |
| A4 | Chef | Marguerite and Bastien idle frames `#7`, `#8` bake as a narrow headless body (22x58 vs 24x80). She flickers for 2 of 8 idle frames in the first room; makes `scale-chef` flaky (2 of 6 runs). Cause not found. | `src/art/rig/*` cast composition, `src/data/scale.js`; atlas script | M | art/rig, data/scale.js |
| A5 | Dev checks | `dream-ladders-both-ways` failed on a fresh port (painter chapel col 96 rows 89-92, down leg) and `jo-foot-slide` logged 0 plants in DESIGN_FIXES_R2. RECHECK says a tutorial card freezing the world was the cause and fixed the scenario, but the fresh-port failure came after. Not re-run. Also `panel-frame` order-dependent, `chime-events` needs a prior boarding. | `src/dev/scenarios/ladders.js`, `foeGrab.js` pattern, `wp6.js` | M | dev/scenarios only |
| A6 | Tests | `npm test` has no `hookTimeout`; `audioMix.test.js` `beforeAll` (line 176) renders every place and times out at the 10 s default when the machine is busy. Reports all say "pass with `--hookTimeout=180000`". | `vite.config.js:9`, `tests/audioMix.test.js:176` | S | vite.config.js |
| A7 | Gambler faro | Faro stakes a fixed $40 bank (`encounters/tables.js:49`) even when the stack is below it, so the stack can go negative; HUD can read `STACK $0` next to `ALL IN $8`. | `src/dreams/gambler/encounters/tables.js:49`, `src/engines/purse.js`, `verbs/purse.js` | S | gambler only |
| A8 | Gambler last table | While tilted at the last table the tilt creep can walk the cursor off STAND UP. Only the calm habit was changed. | `src/dreams/gambler/table.js` (~423) | S | gambler table.js |
| A9 | Astronaut | Core is dropped when Jo is hit and nothing returns it or fixes the narration: d4's "...Yeah." is then untrue. Not a lock. | `src/scenes/AstronautScene.js:2048` (`dropCarry`) | S | AstronautScene.js |
| A10 | Astronaut | Pool vault rise depends on frame rate: 163 / 154 / 145 px at 30 / 60 / 144 Hz. It still clears the lip. | pool vault in `AstronautScene.js` (feel job set 35 to 117) | S | AstronautScene.js |

## B. Review MUST/SHOULD still unfixed, by dream and station

No open MUST remains in any review I could trace. Open SHOULDs and visible leftovers:

| # | Dream or station | Item | Where | Size | Touches |
|---|---|---|---|---|---|
| B1 | Musician | First run is about 10-11 min against a 6-10 bar (clean run 9:30). The review's S5; further cuts need the stairs shortened and a browser to test jumps. | `src/dreams/musician/rooms/*` | M | musician rooms |
| B2 | Astronaut | The crater is very dark and Priya is hard to see without the light; Jo's hat is not dimmed there. | `AstronautScene.js` crater room, dim layer | S | AstronautScene.js |
| B3 | Astronaut | Pool, wall and ring objectives still read "train it up: ..." (gym wording outside the gym). | `AstronautScene.js:846` | S | AstronautScene.js |
| B4 | Astronaut | `failure.js` has no Astronaut row, so the shared failure checks skip it. | `src/dev/scenarios/failure.js` | S | scenarios |
| B5 | Evening | Last-stop scale leftovers: `ev-chess` has no pieces on the board (the pawn at `data/evening/rooms.js:16` is separate), bicycle stall east post behind the first step, mill wheel turns over dry ground. | `data/evening/rooms.js`, `src/art/eveningArt.js` | S | evening data and art |
| B6 | Painter | Thin vertical seam between two facades in the via near x about 1700 (pre-existing). | via room art, `src/dreams/painter/rooms/via.js` | S | painter rooms |
| B7 | Painter | Pie woman stays seated and never laughs; second-line SHOULD 6 for streets/inspectors music gap not done. | `src/dreams/painter` | S | painter only |
| B8 | Gambler | Quay bale ledge reads as a plank; deck hatch reads as a gap, not a skylight. | `src/dreams/gambler/rooms/quay.js`, `deck.js` | S | gambler rooms |
| B9 | Chef | `THE LINE: DOORS 7:30` body type at x1 reads soft under the bulb glare; larger burner warning ellipse not done. | `src/dreams/chef/railHud.js`, `verbs/kitchen.js` | S | chef only |
| B10 | Chef | Vent can pin Jo under a shelf (feel review: land the vent cooldown first). Corner help covers it only within 4 px. Not verified. | `src/dreams/chef/verbs/kitchen.js:133` | S | chef only |
| B11 | Shared | Shards past the heart cap still float "heart shard 1/3" and read as a reward (N2). | `BaseLevel.js` (~491) | S | BaseLevel.js |
| B12 | Shared liquids | `RoomBuilder` surface-band change affects every liquid; only hub and astronaut were run. Chef and Writer liquids need a look. | `src/builders/RoomBuilder.js` | S | RoomBuilder |
| B13 | Station | Dark two-tile patch under the hedge is older and untouched; Ro's shoe tint skipped. | `HubScene.js` / `bayProps.js` | S | station art |

## C. Needs the owner

1. Listening: audio has never been heard anywhere (dev is silent). Needs one `?sound=1` pass over: every dream's beds and levels, the Gambler riverboat beds, the Chef dining-room drop, the Musician tunes against the band, Racer engine and draft beat, Evening level (hotter, about -16 dBFS).
2. Feel on a real keyboard: Racer launch tap, the 16 px sight chevron, the draft beat with eyes shut, the flash on "Again?", a speedometer read to 3-5 % at bend entry. Needs one drive.
3. Real gamepad: the Racer assumes the d-pad is buttons 12-15; a pad that exposes it as an axis would have no lanes. One real pad test.
4. Real phone: touch controls (TOUCH_REPORT) and the SPEED report's slowed-CPU case were never measured on a phone. Also the wipe hold on a slow load.
5. Corner help (1-4 px ledge clip nudge) went in "unless they object". Decide keep or revert.
6. Hearts versus difficulty (design review S2): 3/4/5 hearts rise but no table touches damage or foe density, so later dreams play more forgiving. Say if intended.
7. Foe dead zone: inspectors, the foreman, Crake and others cannot grab a still Jo. A `lunge` on each fixes it but changes balance in every dream. Decide.
8. Racer: the 700 m lamp sits on the kink's braking point (moving it breaks the "no lamp more than 250 m back" rule). Keep or break the rule.
9. Roadmap item: Musician cut busking, road, studio, sound bridge, breath meter. Owner has stopped new level work, so the decision is "drop it from the ROADMAP" or not.
10. Musician M-N3: both dreams say "nine chairs". Decide which keeps it.
11. Casino: Esc at a table opens pause (only Backspace steps away); faro goal is luck (a bust sends Jo to the quay). Play-test.
12. Chef first-run length (estimate 9:30 to 12; nobody has played it by hand).
13. Climb faces away from camera ("front-facing climb"): owner to look.
14. Feel: extra fall gravity, apex hang, hit-stop tiers: left for the owner's call.
15. Eyes: Musician Marcus/Nia seat height, the spot on Nia, Evening lapel flower at game size, viaduct fade (A2) after any fix.

## Suggested parallel groups (no overlapping files)

| Group | Items | Files |
|---|---|---|
| G1 Light and look | A1, B12 | `src/art/look.js`, `BaseLevel.js` grade call, light props in `src/art/props.js` and dream `props.js`, `src/builders/RoomBuilder.js` |
| G2 Chef | A3, A4 (cast side excluded), B9, B10 | `src/dreams/chef/**` |
| G3 Cast art | A4 | `src/art/rig/**`, `src/data/scale.js` |
| G4 Astronaut | A9, A10, B2, B3 | `src/scenes/AstronautScene.js`, `astronautData.js` |
| G5 Gambler | A7, A8, B8 | `src/dreams/gambler/**`, `src/engines/purse.js` |
| G6 Evening and station | A2, B5, B13 | `src/systems/horizon.js`, `src/data/evening/**`, `src/art/eveningArt.js`, `HubScene.js`, `bayProps.js` |
| G7 Painter and Musician | B1, B6, B7 | `src/dreams/painter/**`, `src/dreams/musician/**` |
| G8 Test and scenario hygiene | A5, A6, B4 | `vite.config.js`, `src/dev/scenarios/**`, `tests/audioMix.test.js` (no game code) |
| G9 Shared HUD tidy | B11 | `BaseLevel.js` (do not run beside G1; both touch it) |

G1 and G9 share `BaseLevel.js`: run G9 after G1, or fold B11 into G1.

## Top 10 by player visibility

1. A1 night grade dims windows and stoves.
2. A4 Marguerite flickers headless in the first room (Chef).
3. A3 Chef yard too dark to read Jo.
4. A2 see-through houses on the viaduct.
5. B1 Musician run longer than the bar.
6. B2 Astronaut crater too dark, Priya hard to see.
7. A9 Astronaut core lost on a hit, wrong line follows.
8. A7 Gambler faro stakes more than the stack.
9. A8 Gambler tilt walks cursor off STAND UP.
10. B5 Evening: empty chess board, mill wheel over dry ground.
