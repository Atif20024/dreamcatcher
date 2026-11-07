# Redesign roadmap (living to-do)

Updated 2026-10-29 after the owner's change of direction. The owner's words override every other doc. Jobs run **one at a time** because the dev machine is an 8 GB Mac that overheats.

## The bar every dream must meet
- **The clock-house pattern.** Places you walk into, and the scene changes as you enter. Each area has one clear goal, shown before you commit to it, like "fix this, the door opens".
- **Real scale.** People, props, buildings and trees are sized against Jo (1 m = 44 px). The camera crops big things instead of shrinking them.
- **A world of its own.** Buildings, objectives, cast, costume and props come from the dream's era and place, not generic streets.
- **Motion.** Legs move with the distance travelled; nothing slides. Every foe type has its own gait, and every grab has a readable wind-up.
- **Identity.** Each place has its own palette and night grade. Checkpoints are platform lamps, titles use the split-flap board, and dreams open and close with the train wipe.
- **Sound that fits.**
  - Music suits the dream, its era, and whether you are inside or outside. Inside sounds muffled, with room echo.
  - Each room has an ambience loop: crowd chatter, birds, weather, machines, a fire, footsteps.
  - Sound is silent in development. The owner turns it on with `?sound=1`.
- **Readability.** Text at 9 px or more, on backing plates, at 4.5:1 contrast or better. Jo at 3:1 or better against every background.
- **Length.** 6–10 minutes. Invented names only.

## Done
- Foundations, cast and motion, the world framework, round 2 (WP1–WP7) and identity. See `round2/*_REPORT.md`.
- The station: full-scale trains and THE LAST STOP train. Jo walks there by default.
- THE STOPPED HOUR, the clockmaker dream, on platform 9. This is the pattern the owner likes.
- THE BIG STAGE, the Musician, on platform 2. This is the reference rebuild.
- Feedback 3: Jo carries a light per dream in dark rooms (no glow); a quieter mix with Music/Ambience sliders; restart from checkpoint or from the dream's start; a reading panel for notes and letters; ladder jumps. See `round2/FEEDBACK3_REPORT.md`.

## Done since
- Painter: THE MASTER'S LADDER (Renaissance) on platform 5.
- Gambler: THE LAST HAND aboard the *Lantern Queen*, 1884, on platform 7 (SHOWDOWN, the slate, TILT, standing up as the catch). See `round2/GAMBLER_REPORT.md`.
- Audio pass: a master chain, a band per place, ambience, chatter and acoustics.
- The game fills the browser window.
- Touch controls for phones and tablets: a d-pad, JUMP, E, X, Q and pause, drawn in the game's style. They press the same keys as the keyboard. Menus, choices, dialogue and the tables take taps. Holding a phone upright shows a "turn your phone sideways" card. Desktop is unchanged; `?touch=1` turns the controls on for testing. See `round2/TOUCH_REPORT.md`.

## In progress
- (done) Room transitions: dips through dark at real doorways; see round2/TRANSITIONS_REPORT.md. Legacy scenes still blend until rebuilt.
- The racer dream: design doc by a pro-gamer advisor (`docs/dream_racer.md`), then the build. Stage 1 is in (`round2/RACER_STAGE1_REPORT.md`): RaceScene, the car, one test road, platform 10, the garage. The four-race season and its ending are in (`RACER_REBUILD_PLAN.md` stage E): the station counts it.
- Open issue: on the painter's daylight street, Jo's contrast is 2.7:1, below the 3:1 target; recolouring his coat would fix it.

## Owner's list (2026-11-01), first
Jobs run in parallel: at most 2 with a browser, 1 without, reviewers alongside. Each fix gets a senior game designer and pro gamer review until they converge. Name the relevant skills in each brief; ask the owner before a major change. Things already fixed in Astronaut and Chef stay as they are.

Done: casino polish and phone keys; the ladder before the platforms; readable notes; the audit's repo fixes.

Also done: THE LAST STOP at scale; Jo and the cast; legacy dreams deleted.

Owner's decisions after the deep review (`advice/deep_review_*.md`), to do before the racer, athlete and doctor:
1. Chef: full rebuild on the framework around the ticket rail. Built: `round2/CHEF_REPORT.md`.
2. Astronaut and Writer: every MUST and SHOULD fix, no rebuild; the owner decides after playing. Writer keeps its length.
3. Painter: a way to play per craft job, plus the review's fixes.
4. Clockmaker: each gear its own place, people in the town, a staged payoff, plus the review's fixes.
5. Musician: real pitch and timing in the rhythm engine, results that change things, plus the review's fixes.
6. Station: counts every running dream (nothing closes at 5), staged return under the dreamcatcher, prompts with verbs, flower seller, shop, postcards for every dream, rewards on the roof and undercroft; boards get a length or mood word; the first visit points to a gentle dream.
7. Evening: teach sit and horn, gate the bench ending, `advice/laststop_review_r1.md`. Stays open from the start; the station reacts to it.
8. Casino: the deep review's small items (`deep_review_painter_clockmaker_gambler.md`).
9. Feel fixes (`advice/fresh_review_feel.md`), running. Extra fall gravity and corner correction wait for the owner.
10. Rest of `advice/fresh_review_design.md`; speed job: measure, fix the biggest cost.

Then build: racer (`docs/dream_racer.md`, a tenth platform: BAYS in `src/data/hub/rooms.js` is full), athlete (`docs/dream_athlete.md`, platform 3), doctor (`docs/dream_doctor.md`, platform 8).

## Next, in order
The build order follows `advice/lead_design_review.md` §5. One agent at a time.

| # | Build | Size |
|---|---|---|
| 1 | Astronaut track hotfix: the stairs, the track deck, real medicine balls, the poster, the g0 hint, the HUD stat block | S |
| 2 | Readability and object lint: no bare shapes at gameplay depths; redraw the top 10; signs clamped to their rooms | S |
| 3 | Lamp checkpoint at every room entrance; check the restart options from Feedback 3 | S |
| 4 | HUD diet, framework-wide | M |
| 5 | Clockmaker grows to six areas | M |
| 6 | Chef rebuild: the ticket rail as the verb | L |
| 7 | Astronaut rebuild: one circuit, the Board, the grey year, sim, EVA, the moon | L |
| 8 | Writer rebuild: keep the pen | L |
| 10 | Musician polish (busking, the road, Marcus sits) and painter polish | M |
| 11 | Hub between dreams: lamps for each catch, people on benches | M |
| 12 | The Evening payoff: the people from caught dreams appear in the town | M |
| 13 | Polish and release: a full scenario run, the owner's play-through, performance | M |

Each rebuild starts with a short advisor note on the career, as the painter's did.

## Open from earlier reports
- The night grade dims shop windows and stoves. Lights need to be exempt from it.
- The Musician lost busking, the road, the studio, the sound bridge and the breath meter. Marcus stands instead of sitting.
- Audio has never been heard during development. It needs a listening check with the owner.
