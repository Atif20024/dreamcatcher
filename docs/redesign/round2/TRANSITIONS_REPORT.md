# Room transitions: no more blends

The owner's note: "why there is gradient and as i walk the screen changes.
this never happens in real world." Seam-joined rooms crossfaded their
backdrops over about 600 px of floor, so two pictures showed at once. The
follow-up note: a frame must be part of the architecture. The room on each
side ends at the frame, nothing overlaps it, and nothing of the far room
shows past it before the dip.

The spec is `docs/redesign/advice/room_transitions_advice.md`.

## The rule now
- Only one room's backdrop is ever on screen. The station, the Clockmaker,
  the Musician and the Painter dreams have no blend code path left.
- Every room change happens inside a drawn frame: a doorway in a wall, an
  arch, or a gate. Jo walks into the frame and gets more than half a tile
  (`FRAME_HALF`, 16 px) past its centre. The screen then dips through dark.
  - Rooms, backdrop, horizon, camera clamp and zoom all swap at full dark,
    and the screen comes back up.
  - The streamer's `focus()` is called at the hold, through `commit()`.
- Jo is never stopped. There is no `[E]` press and no input lock.
- A jump over the frame waits until Jo lands (grounded or climbing).
- Standing in the doorway never flickers: the trigger has 16 px of
  hysteresis on each side.
- The dip lengths are in `src/world/thresholds.js` (`DIPS`):
  - Outside to inside: 120 / 60 / 160 ms
  - Outdoor to outdoor: 180 / 80 / 220 ms
  - Room to room: 90 / 40 / 110 ms
  - A dream's dip is picked from the two rooms: a room with a backdrop
    counts as outdoor.
- Audio may cross. The room's ambience loop is set by time, not by a blend
  value:
  - Going in or out of a building, the old loop ducks on the way down.
  - The new loop rises after the swap, and the old one fades out under it.
- Locked doors and story doors still use `[E]`. Stairs and lifts still use
  the 250 ms door fade (`TransitionDirector.go`). Neither was changed.
- Nothing of the far room pokes past a frame. Each kind of scene does this
  its own way:
  - Dreams use the camera clamp. `RoomGraph.viewX(room)` lets the camera
    show a room only out to the far face of each frame it meets. The far
    face comes from the frame prop's width in the prop library.
  - The station uses a cutaway, like a side-on house. Each doorway is a wall
    with a face on each side. From the left you see the left face, which
    covers everything past the doorway, and through the doorway only the
    light of the room beyond. The right side works the same way. The faces
    swap at full dark. The camera is not clamped, because the station is
    one continuous building and the roof is shared.

## What changed (files)
- `src/world/thresholds.js` (new). This is pure code: `FRAME_HALF`, `DIPS`,
  `dipFor`, `frameCrossing` (with hysteresis) and `sideOf`.
- `src/world/RoomGraph.js`:
  - Removed: `blendAt`, `commitRoom`, `smoothstep` and `DEFAULT_SEAM_HALF`.
  - New: `frameX(portal)`, which finds where the seam prop is drawn.
  - `seams()` now gives each seam its frame centre, its half-width, the
    band it applies in and its dip.
  - New: `crossing()` and `viewX()`.
  - The lint (`validate`) is stricter. A seam's prop must be placed in one
    of its two rooms, at most 6 tiles from the shared edge.
- `src/world/TransitionDirector.js`:
  - New: `dipThroughDark(scene, dip, onHold, onUp)`. Timers back up the fade
    callbacks, so a fade cut short by another one cannot strand the dip.
  - New: `walk(cross, onHold)`, the seam dip. It sets no input lock.
  - The `[E]` door path is unchanged.
- `src/world/BackdropDirector.js`:
  - `update(room, time, next)` shows one set at full alpha, with that
    room's horizon.
  - The set past a nearby frame is built in advance at alpha 0, so the swap
    never has to paint.
- `src/world/CameraDirector.js`:
  - The clamp is `viewX` across and the room's own extent up and down. It
    no longer blends.
  - `snap({ keepLook })` keeps the look-ahead through a walk-through dip.
- `src/scenes/DreamScene.js`:
  - New: `updateThreshold()`. It handles the frame crossing, the
    grounded-only rule, and teleports (respawn, put), which commit at once
    to the correct side of a frame.
  - New: `nearFrame()`, used to pre-build the next room's backdrop.
  - Timed ambience; no `ambience.blend` with a fractional value.
- `src/builders/parallax.js`: a `cut` mode, used by the station.
  - `setRoom()` snaps the horizon.
  - Rooms that share one set (platforms A and B, the same train shed) show
    their scenery and landmarks side by side at full strength.
  - The legacy scenes still use the blend; see Known issues.
- `src/builders/hubThresholds.js` (new). `doorway()` draws a wall with one
  doorway per floor it crosses, plus the two faces (`FACES`). All of it is
  drawn in code at 1 m = 44 px.
- `src/scenes/HubScene.js`:
  - New: `buildThresholds()`, `enterHubRoom()` and `updateThreshold()`.
  - The station's room is now set by the doorways, not by the camera centre.
  - The first visit's vista now starts once Jo is inside the hall, after the
    doorway's dip has come back up.
  - The "LEFT LUGGAGE" sign moved to the hall side of the grate, so it is
    clear of the end wall's doorway.
- `src/data/hub/rooms.js`: `hall_entry` moved to column 29, where the front
  doorway is.
- `src/art/props.js`: new `yard_lychgate`. This is a tiled lychgate roof on a
  tie beam over the bell yard gate's two stone posts. It is the green|yard
  frame, which used to be a fence.
- `src/actors/DreamGate.js` and `src/play/GateSigns.js`: a gate knows its
  room, and its sign is drawn only while that room is on screen. Without
  this, the green's "OPENS WHEN THE CLOCK STRIKES" sign showed, cut off, at
  the yard's left edge.
- Dream room data:
  - The `seam.width` blend widths are gone.
  - The green|yard seam prop is now `yard_lychgate`.
  - Clockmaker green: the lychgate is placed. The fg foliage that covered
    the gate area is gone. The checkpoint lantern moved from tile 6 to
    tile 8, and the bench from tile 8 to tile 11, both clear of the hedge
    arch.
  - Musician street: `alley_arch` moved from tile 69 to tile 68, so the
    room edge no longer cut off its right pier.
  - Painter via: the guild's chain gate `g_chain` moved from tile 64 to
    tile 62. Its right post overlapped the city arch.
- `src/audio/Ambience.js`: comment only.

## Each seam

The 3 m screenshots were taken standing 132 px before and after each frame's
centre.

| Seam | Frame | Dip | Before / after (3 m) |
|---|---|---|---|
| Hub steps → hall | The front doorway: a 1.45 × 3.4 m arched opening in the station's front wall (x 944). Outside face: the stone flank with quoins and lit 6 m windows. Inside face: plaster over oak panelling, with the rainy street in its windows. | inout 120/60/160 | Clean. The steps view ends at the station wall, and the hall view starts at the front wall's inside face. Ro, the kiosk and the doors stay outside. |
| Hub hall → platforms A | The hall's end wall (x 2528), with a 1.45 × 3.4 m doorway at the concourse and a 1.1 × 2.7 m arch for the undercroft passage below. Hall face: cream ashlar, signed "TO THE TRAINS". Shed face: sooty brick with iron pilasters, signed "WAY OUT". | inin 90/40/110 | Clean after a re-layout. The old arch overlapped the clock, ring, plaque and "LEFT LUGGAGE" sign; it is now a wall at the hall's end. The sign moved, and the undercroft ladder and grate stay clear of the doorway. |
| Hub platforms A → B | None, by design: this is one train shed with the same backdrop set. Both rooms' scenery and landmarks show at full strength, as one place. | none | No change and no dip. |
| Hub platforms B → gate | The shed's end wall (x 5024), with a concourse doorway and an undercroft arch. Shed face: brick, signed "STAFF ONLY". Gate face: bare brick, with the shed's lamplight through the arch. | inin 90/40/110 | Clean. Platform G's gate, lamp and board stay on the shed side; the turnstile stays on the gate side. |
| Clockmaker lane → green | The hedge arch (`arch_hedge`, 5.1 m wide), at the start of the green. | outout 180/80/220 | Clean. The lane view ends at the arch's far post, and the green view starts at its near post. The checkpoint lantern and bench have been moved clear. |
| Clockmaker green → bell yard | The new lychgate over the iron gate `g_yard`, with the fence running up to it. | outout | Clean. The gate sign shows only on the green side. |
| Musician street → alley | The alley mouth (`alley_arch`: brick piers, an iron arch, "STAGE DOOR >"). | outout | Clean after moving the arch one tile, so both piers are drawn. |
| Painter via → piazza | The city gate (`city_arch`: a 7 m stone arch in a battlemented wall). | outout | Clean after moving the chain gate two tiles clear of the arch. |

## Tests and scenarios
- `tests/framework.test.js`: the smoothstep blend test and the camera-commit
  hysteresis test are replaced with these four:
  - "Never blends": no `t`, no `blendAt`. A crossing is found only past the
    frame, never across the shared edge alone. It has hysteresis in both
    directions, and never reaches a room behind a door.
  - `viewX` stops at the frames.
  - The dip kinds (`dipFor`), plus `sideOf` and `frameCrossing` with a band
    and an open join.
  - The lint test now also checks for a seam prop that is never placed.
- `tests/dream-checks.test.js` is unchanged and still catches a missing
  seam prop.
- `src/dev/scenarios/phase3.js`: `clockmaker-seam-no-snap` is now
  `clockmaker-seam-dip`. Walking from the lane to the green, it checks:
  - The rooms go lane>green with one dip.
  - No frame shows two backdrops (0 frames).
  - The swap happens at fade 1.0, with zero frames locked.
  - With the screen up, the camera, zoom and layers only move with the follow.
- `src/dev/scenarios/backgroundSnap.js`: the station is out of
  `blend-continuity` and `boundary-no-flicker`. Those now cover only the
  legacy scenes, which still blend.
- New `src/dev/scenarios/transitions.js`:
  - `dream-seams-dip`: every seam in every framework dream, walked both
    ways.
  - `hub-thresholds-dip`: every station doorway, walked both ways.
  - `hub-threshold-no-flicker`: Jo shuffling in each doorway for 120 frames.
  - Each walk-through asserts all of these:
    - Exactly one dip each way.
    - The swap happens at fade ≥ 0.99.
    - Zero frames with two rooms' backdrops visible. On the parallax this
      means one sprite per slot, one sky, one face per wall, and no
      off-room decor.
    - Zero locked frames.
    - Jo never stops.

Results:
- `npx vitest run`: 161 passed.
- `npm run lint:content`: 0 failures.
- `npm run lint:rooms`: 0 failures (37 warnings, as before).
- `npm run lint:scale`: clean.
- `npx vite build`: built.
- Full scenario run: see the end of this file.

## Known issues
- The legacy scenes (Chef, Astronaut, Writer, Gambler, Evening, and the old
  Musician and Painter scenes) still blend their parallax across room
  boundaries. They have no frames in their art, and the brief covered the
  station and the framework dreams. `Parallax` takes `{ cut: true }`, so a
  legacy scene can opt in once its rooms have doorways drawn.
- On the station's roof (above row 9), the doorways do not apply. On the
  roof, the backdrop stays that of the room Jo climbed up from. If he steps
  off the roof's west end onto the street, he gets one dip when he lands.
- A behind-the-wall backdrop element can sit right at a wall's edge, such as
  the hall's "TICKETS" lettering beside the front wall's inner face. These
  are parallax layers passing behind the wall as Jo walks, not overlaps.
- The Painter's via shows a thin vertical seam between two façades, near
  x ≈ 1700. This already existed and is unrelated to transitions.
