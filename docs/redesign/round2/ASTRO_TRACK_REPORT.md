# Astronaut track hotfix (ROADMAP build #1)

Room `p1_track` in THE QUIET ABOVE. This follows `advice/lead_design_review.md` §3 and the owner's screenshot notes (1: the stair, 2: the broken thing, 3: the circle, no objective).

## What changed

**1. Stairs to the deck** (`src/data/astronautData.js`)
- Both flights are now five steps, so the top tread is flush with the deck. The old four-step flights left a 0.7 m riser at the top on the left and a 2-tile wall on the right.
- `S` flights already walk as 45° stair slopes and draw their treads (`legend.slopeRoleAt` and `RoomBuilder.stairTexture`), so they read as stairs and are walked as stairs.
- The deck now runs over cols 36–54.
- `Player.lowCeiling()` (`src/entities/Player.js`) no longer counts the stair tread at Jo's feet as a ceiling. Before, Jo ducked up every `S` flight. With a flush top step he would also have run upright into the top tread (`jo-route-astronaut` caught this). A slope tile is skipped only when it sits within one tile of the foot line, so a real stair underside still counts.

**2. The deck as a running track** (`AstronautScene.buildTrack`)
- Red-brown rubber over the deck top, with two white lane lines and a dark edge.
- A chequered start/finish band across both lanes.
- A handrail at the back of the deck: posts every 2 m, rail at 1 m.
- A lap board hung on wires above the line: "THE TRACK / LAP n / 3". It reads "LAP 3 / 3 DONE" in green when finished, and flashes "LAP n · GO" and "LAP LOST".
- A wire ball bin at the far end marks the turn.

**3. The objective**
- The room objective is "run 3 laps for Coach Adaeze — dodge the medicine balls". It becomes "three laps. the pool is next door" once the flag `track_done` is set.
- A cream wall sign by the line says "RUN 3 LAPS / JUMP THE BALLS".
- After the intake talk (`d0`), Coach Adaeze jogs from the arrival hall, up the stairs, to the start line. She is rigged and played with `attachStride`, so her feet don't slide. On a warp or a continued run she is placed at the line directly.
- At the line she barks the rules once when Jo reaches the deck, and pressing E on her repeats them.
- A lap means: cross the line going right, reach the bin end, then come back over the line. Each lap gives a LEGS pip (3, 4, 5) as before.

**4. Lap feedback**
- A lap can be lost two ways: a ball hit during a lap, or leaving the deck.
- When that happens, the lap phase resets and three things show it: the `fail` sound, a red line at Jo ("medicine ball: lap lost. back to the start line"), and "LAP LOST" on the board while the start line flashes red.
- Nothing resets silently any more.

**5. Medicine balls**
- `astro-medball` is a texture drawn in code: 0.4 m (r = 9 px), with leather in three tones, cross and curved panel seams, stitches, a lit top and an outline.
- Adaeze lifts one from a rack behind her and leans back for a readable 0.4 s wind-up, then lobs it down the lane.
- In flight, the ball:
  - bounces with a `thump` on each impact (heard within 520 px of Jo)
  - rolls with rotation = distance / r
  - casts a ground shadow that shrinks with height
  - drops into the bin at the far end
- All motion uses delta time (dt is capped at 50 ms).
- A hit uses the ball's circle against Jo's body box, so jumping over a ball works.
- She throws at most two balls at a time, never while Jo is at her elbow, and stops once the laps are done.

**6. The LV-3 poster**
- The old drifting landmark is gone: a navy box with a white bar and a bare white triangle.
- `buildLv3Poster` hangs a framed poster on the wall beside the deck, at scroll factor 1. It has a pin at each corner and a three-stage rocket with orange interstage rings, fins and a flame.
- The caption "MERIDIAN LV-3 / THREE STAGES" sits inside the poster above the deck line, so the Board quiz clue still reads.
- The room's backdrop landmark is now `gym_pennants`, a red and gold pennant line high under the roof (no white points).

**7. The g0 hint**
- The gate sign now reads "INTAKE · talk to Coach Adaeze first". There is no desk.

**8. Unexplained objects**
- The gate's status lamp and its bar show green for 0.7 s, then fade with the gate.
- The gate's sign reads OPEN for 1 s, then fades to 0. This is opt-in per gate (`fadeSign`) in `GateSigns`. Astronaut gates set it; other dreams are unchanged.
- The yellow "LAP" stick-post and the unused `sheet` mark are gone.

**9. The HUD**
- The four-line LUNGS/GRIP/LEGS/NERVE block is now one line: the stat this room trains.
  - track: LEGS
  - pool: LUNGS
  - wall half of `p1_wall_ring`: GRIP
  - ring half: NERVE
- Between the gym rooms it shows the single lowest stat.
- It is hidden in the arrival room and before the coach has explained the stats.

**Dev**
- `?warp=astronaut:p1_track` (and `:p0_arrival`) now lands on the gym phase. Before, the unknown `at=` value fell through, and the plain intake played instead.

## Screenshots
These were taken with the browser pane at the default size. The files are kept outside the repo, since the project ships no image files:

- `/private/tmp/claude-501/-Users-atifhsn-Documents-dreamcatcher/24eb88eb-4701-4564-ad2d-d34b369df333/scratchpad/astro_track_before.jpg`
- `/private/tmp/claude-501/-Users-atifhsn-Documents-dreamcatcher/24eb88eb-4701-4564-ad2d-d34b369df333/scratchpad/astro_track_after.jpg`

**Before**
- A plain concrete ledge, reached by a white block stair that stops a step short.
- Two flat red circles on the ledge.
- A yellow "LAP" stick sign.
- The four-line stat block, top right.
- The objective "train it up: the track".
- The intake dialogue playing, because the warp did not apply.

**After**
- The deck is a red track with lane lines and a chequered line.
- Coach Adaeze stands at the line with a ball raised in her wind-up, the rack behind her.
- The lap board reads "THE TRACK / LAP 0 / 3", with the "RUN 3 LAPS / JUMP THE BALLS" sign beside it.
- A stitched ball rolls down the lane.
- The framed LV-3 poster hangs on the wall by Jo, and the wire bin and right-hand stairs are at the far end.
- The HUD shows "LEGS ●●○○○" and the objective "RUN 3 LAPS FOR COACH ADAEZE — DODGE THE MEDICINE BALLS".
- The pennants hang high under the roof.

## Tests
- `npx vitest run`: 15 files, 161 tests passed. On one earlier full run `audioMix.test.js` hit its `beforeAll` timeout under load. That file doesn't touch this change; it passed alone and on the rerun.
- `npm run lint:content`: 0 failures, no default text.
- `npm run lint:rooms`: 0 failures, 37 warnings.
- `npm run lint:scale`: clean.
- `npx vite build`: built.
- Astronaut scenarios only: `jo-route-astronaut` PASS (ducks 0; it was 6 before the `lowCeiling` fix), `eva-tether-trap` PASS, `readability-astronaut` PASS (100 screens, 0 violations), `scale-astronaut` PASS.
- Checks by hand with `__dc.step`:
  - Jo walks from the floor up the left flight onto the deck with no step or riser (y runs smoothly 1130 → 970).
  - A ball hit mid-lap gives "LAP LOST".
  - Three scripted laps give LAP 1, 2 and 3 / 3 DONE, LEGS 3 → 4 → 5, the flag `track_done`, and the objective switches.
  - The coach's path from the arrival hall jogs up the stairs to (1174, 992) on run frames, then idles.
  - The g0 sign is invisible after it opens.

## Known issues
- `lint:rooms` warns about headroom under the two stair flights (row 35, world cols 33 and 57). These are the closed wedges beneath each flight, where Jo doesn't walk; the same warning class existed under the old flights.
- Adaeze has no throw frames in her rig. The wind-up and follow-through are a lean of the whole sprite (−6°, then +6°) about her foot pivot, with the ball moving from the rack to over her shoulder. A proper throw pose belongs to the character-motion pass.
- The `lowCeiling` change is in the shared `Player`. It only drops slope tiles within a tile of the feet, but only the astronaut scenarios were run, per the task rules. The hub's `k`/`K` stairs should get a `jo-route-hub` check in the next full scenario run.
- The visor text and the other HUD layers are untouched (ROADMAP #4). The pool and the wall/ring objectives still read "train it up: …" (outside this room).
