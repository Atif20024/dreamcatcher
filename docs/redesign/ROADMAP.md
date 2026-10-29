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
- Audio pass: a master chain, a band per place, ambience, chatter and acoustics.
- The game fills the browser window.

## In progress
- Nothing. Feedback 3 is done (see round2/FEEDBACK3_REPORT.md). Open issue: on the painter's daylight street, Jo's contrast is 2.7:1, below the 3:1 target; recolouring his coat would fix it.

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
| 9 | Gambler rebuild: two games, the comp lounge, walking away as the catch | L |
| 10 | Musician polish (busking, the road, Marcus sits) and painter polish | M |
| 11 | Hub between dreams: lamps for each catch, people on benches | M |
| 12 | The Evening payoff: the people from caught dreams appear in the town | M |
| 13 | Polish and release: a full scenario run, the owner's play-through, performance | M |

Each rebuild starts with a short advisor note on the career, as the painter's did.

## Open from earlier reports
- The night grade dims shop windows and stoves. Lights need to be exempt from it.
- The Musician lost busking, the road, the studio, the sound bridge and the breath meter. Marcus stands instead of sitting.
- Audio has never been heard during development. It needs a listening check with the owner.
