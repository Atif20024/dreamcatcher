# Recheck report: the cleanup, in a browser

Run on the `redesign` tree at 3348571, in one tab on port 5183, sound off, one batch at a time. Each batch started from a cleared save and a cold load. The final state passes everything below, with no console errors.

Other checks: vitest 311 tests pass (with `--hookTimeout=180000`), `lint:content`, `lint:rooms` and `lint:scale` 0 failures, `vite build` clean.

## What the cleanup broke

**Boarding any train crashed.** `0ca54bd` removed the line importing `dreamById` from `src/scenes/IntroScene.js` along with `LEGACY_PAINTER` and `LEGACY_GAMBLER`. `IntroScene.create` then threw `ReferenceError: dreamById is not defined`, so no dream could be boarded from the hub. Restoring the import fixed it. A scan of every import line the cleanup removed found no other lost name.

## Pass/fail table

"First run" is the first time this job ran it, so the later batches already had the `ready()` fix. "Final" is on the committed tree.

| Scenario or set | First run | Final | Cause of the failure |
|---|---|---|---|
| `background-snap` (writer:attic) | FAIL | pass | Already there: the `__dc.ready()` race, see below. Not the retarget |
| `shadow-slope` (chef ramp) | pass | pass | |
| `round2` stair sites (`slope-*`, 9) | pass | pass | |
| `shadow-jump`, `shadow-gap`, `shadow-places` | pass | pass | |
| `round2flow` (4) | pass | pass | |
| `objective-room-entry` | pass | pass | |
| `backdrop-scale` | pass | pass | |
| `jo-route-*` (6) | pass | pass | |
| `failure` set (4) | pass | pass | |
| `scale-*` (9) | pass | pass | |
| `musician-*` (5) | not run | pass | Run after the import fix |
| `painter-*` (5) | not run | pass | Run after the import fix |
| `gambler-*` (10) | not run | pass | Run after the import fix |
| `train-wipe` (wp6) | FAIL | pass | Cleanup: the lost import |
| `panel-frame` (wp6) | FAIL | pass | Probably cleanup: failed only in the page where the Intro had crashed, with 0 panels. Passed in all 4 later runs, but the mechanism was not traced |
| other wp6 (5) | pass | pass | |
| `clockmaker-board` (proofTrain) | FAIL | pass | Cleanup: the lost import |
| other proofTrain (4) | pass | pass | |
| `readability-chef` | FAIL | pass | Already there, see below |
| `dream-ladders-both-ways` | FAIL on a clean save | pass on a clean save | Already there, see below |
| `writer-ladders-both-ways`, `hub-ladder-*` | not run | pass | Rerun because `climb()` changed |

### Boarding each dream from the hub

Each was boarded through the gate's own interact, past the arrival, then walked. No console errors.

| Dream | Scene | First room | Jo walks |
|---|---|---|---|
| chef | Chef | arrival | yes |
| musician | Dream | street | yes |
| astronaut | Astronaut | p0_arrival | yes |
| writer | Writer | arrival | yes |
| painter | Dream | bottega | yes |
| gambler | Dream | quay | yes |
| clockmaker | Dream | lane | yes |

## `readability-chef`

The text is the gate sign `ROOF · survive service` (g5), cap 7.2 at the rooftop's zoom of 0.8. Under zoom 0.9 the zoom rule hides text on its own board, but `GateSigns.update` set it visible again every frame. The sign now leaves zoom-hidden text alone, and nothing else in Chef changed.

A player still reads it: on the approach the zoom is 1 and the text shows. It hides only when looking back from the roof.

## `dream-ladders-both-ways`

Neither of the two suspects: the race and a climbing bug both turned out not to be the cause.

Foreman Bruno's plank is at the head of col 96, rows 89-92. As Jo climbs into his sight on a clean save, his first notice opens the SHOVE card, which freezes the world until a key is pressed. The scenario held UP and pressed nothing, so its 600 frames ran out with Jo frozen. The `down` leg then did the same on SLIDE UNDER. Once those two cards are marked seen, they never open, which is why later runs passed.

The game is correct, so the fix is in the scenario: `src/dev/scenarios/ladders.js` now presses a key when a card is up, as a player does. It passes on a clean save with both cards shown, which also proves Jo climbs on after a card closes.

## The `__dc.ready()` race

It is real, and it was the cause of the `background-snap` failure rather than the ladders. With the pane hidden there is no rAF, so Boot's `scene.start` sat in the queue. `ready()` timed out after 10.8 s and still returned true. The next warp then ran the Hub beside the warped scene, and the Hub's `hud.bind` wiped the Writer's tool lines (`reading 'text'` in `hud.js`).

`ready()` now steps the game once Boot is done, wakes the loop again if it stepped, and returns whether the scene really settled. A cold load now takes about 0.5 s.

## Leftovers

- **Dev params:** `initFlags` in `main.js` and the Evening's whole `params` are behind `import.meta.env.DEV`. In `dist`, `get("flags")` is gone and the Evening reads `new URLSearchParams("")`, so its four params do nothing there.
- **Comment:** the `?legacy=1` lines are gone from `src/dreams/gambler/dream.js`.
- **Riverboat audio:** three new shots in `src/audio/events.js` (`steam_whistle`, `paddle_wheel`, `deck_bell`) and four new beds in `BEDS`. All seven rooms set `events`, and `PLACE_BED.gambler` is now `river`. The browser confirmed each room's bed is selected. Nobody has heard them, because dev is silent.

| Rooms | Bed |
|---|---|
| quay, deck, landing | `river` |
| saloon | `boat_saloon` |
| cards | `boat_cards` |
| office, pilot | `boat_cabin` |

- **Notes hints:** no overflow, so no change. Checked on page 2 of a 16-page document at 1280×720 (S 3) and 667×375 at 2× (S 3). The widest footer is 239 font px against the narrowest measure of 240.

### Dead code

Removed, with no reference anywhere in `src`, `scripts` or `tests`:

- `BEDS.casino`, which the new beds replace
- the `cicadas` loop
- the foe kind `metronome_walker`
- 23 background names in `src/builders/parallax.js`: `booth_glass pavilion flightcases bar_rail mic_stands wheat_far wheat_grey garden_wall bare_boards cafe_chairs wheat_near wheat_grey_near office_rail iris_beds village_roofs stacked_canvases slot_banks brass_rails low_lamps curtains numberless_doors bare_bulbs car_decks`

Kept, because the grep does not prove them unused:

- The other nine foe kinds. Their names are in `src/entities/foeArt.js` and `src/art/rig/gaits.js`, and the rig folder belongs to the cast job.
- The `slots` loop, which a test lists.
- About 60 more background names of the 83 in the cleanup report. Each name matches a word elsewhere in the tree, so a grep cannot separate them. Some may still be dead.
- The shots only `BEDS.casino` fired: `slot_jingle`, `win_bell` and `dice`. A grep finds no other caller, so they are dead now, but they were not on the list.
