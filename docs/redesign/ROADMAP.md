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

## In progress
1. **Painter: a Renaissance dream** that replaces THE YELLOW HOUSE on platform 5.
   - Jo goes from apprentice to the guild to a commission.
   - It ends in a public competition against an invented rival master.
   - It has era music and ambience per room.

## Next, in order
2. **Audio pass for the whole game.**
   - Music by dream, era and inside/outside for every place: the station, every dream and the Evening.
   - Ambience loops: station announcements and crowd, rain, traffic, kitchen clatter, casino chatter, the hum of a space station, birds, bells.
   - One-off sounds tied to things in the world, by distance: a pigeon flaps, a door creaks, NPCs talk in short bursts as Jo passes.
   - A mix check by offline render: loudness per bus and no clipping.
3. **Chef** rebuilt to the bar. The dream moves from the dining room through the kitchen to the cold store, with era and place detail.
4. **Writer** rebuilt to the bar: the flat, the stairwell, the publisher's office.
5. **Astronaut** rebuilt to the bar: station corridors, the airlock, the hull.
6. **Gambler** rebuilt to the bar: the casino floor, the back office, the vault.
7. **Station and onboarding (phase 4).** The station's opening, its dreamcatcher, Jo's back-view walk, and per-room flip-board titles.
8. **The Long Evening (phase 6)** to the bar.
   - Check the gaps at walking speed.
   - Swap the turnstile's old fade for the train wipe.
   - Let windows and stoves glow through the night grade.
9. **Polish and release (phase 7).**
   - A full scenario run.
   - The owner's play-through of every dream.
   - Performance checks on the 8 GB machine.

## Open from earlier reports
- The night grade dims shop windows and stoves. Lights need to be exempt from it.
- The Musician lost busking, the road, the studio, the sound bridge and the breath meter. Marcus stands instead of sitting.
- Audio has never been heard during development. It needs a listening check with the owner.
