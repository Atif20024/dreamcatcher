# Room transitions: advice from a level designer / pro gamer
The owner is right. A backdrop that dissolves into another while you walk
shows two pictures at once. Nothing in a real place does that. Players read
it as a rendering bug, not as travel.

## 1. How good 2D games move you between places
- Door and cut with a dip to black. Zelda (top-down and side-view), Metroid,
  Symphony of the Night, Hollow Knight. Jo touches a door, the screen dips for
  about 150-300 ms, he appears on the far side. Fast, honest, readable.
- Flip-screen. Zelda 1, Prince of Persia, Flashback. Walk off the edge and the
  whole screen swaps to the next one, with no blending. Edge = border.
- One continuous painted world with a cutaway. Shovel Knight villages, Ori,
  Owlboy, Studio Ghibli-style shots. The house front is one layer of the world.
  Step inside and the front wall drops out or the roof lifts, in about 150 ms,
  showing the interior that was always there. The camera does not move.
- Threshold with a hidden swap. Mario, Castlevania. Jo walks through a doorway
  or arch. The frame covers the swap, so the player sees "I went inside",
  not "the sky changed".
- Real architectural seam. Dark Souls 2D-likes, Blasphemous, Hollow Knight.
  A long dark tunnel, a gate, or a door-frame fills the screen. The area swap
  happens while it covers the view, then the camera scrolls out the far side.
- Rule: during travel the player sees ONE place at a time. If anything
  blends, it blends to black (or a wall), never picture into picture.

## 2. What is here now
- `RoomGraph` has two portal kinds. `seam`: rooms side by side, `blendAt()`
  returns `t` (smoothstep over `seam.width` px each side, default 300, so about
  600 px of double image). `door`: `TransitionDirector.go()` does fadeOut
  250 ms, move Jo, snap camera, fadeIn 250 ms, input locked. The door path is
  already the right feel (the clock-house pattern).
- `BackdropDirector.update(room, blend)` and the Hub's `parallax.js`
  (`blendAt` ~1191, `update` ~1267: `pair()`, sky laid at alpha `t`) draw both
  sets at alpha `(1-t)` and `t`. That is the ghost. `Ambience.blend(a, b, t)`
  and `CameraDirector.bounds()` lerp on the same `t`.
- DreamScene already routes `door` portals through `[E]` prompts. Seams are
  just walked through.

## 3. Recommendation: one rule, three tunings
Rule: no seam ever shows two backdrops. Every room change is a short dip
through dark that Jo walks through, covered by a physical frame (door, arch,
gate, tunnel mouth) drawn in the room art.

Trigger for all three: Jo's body overlaps the frame's trigger rect (about
1 tile wide). No button press for walk-through frames. Keep `[E]` only for
locked or story doors that need a decision (clock-house keeps its door).
(a) Outside to inside a building (steps to great hall, lane to a house)
- Jo walks into the door frame. On overlap: control stays ON, he keeps walking.
- Dip: 120 ms to black (alpha 0 to 0.9 on a camera fade), swap rooms and
  backdrop at full dark (hold 60 ms), 160 ms back up. About 340 ms in all.
- Camera: snaps to the interior framing during the hold. Interior zoom
  applies at the snap, no zoom lerp.
- Jo: on the far side he is at the inside face of the same frame, already
  walking the same way, one tile in. Never teleports mid-air.
- Sound: exterior ambience ducks to 0 in the 120 ms down. Interior ambience
  rises over 250 ms after the swap. A door/footstep change (hard floor) at
  the swap. Footsteps are the cue that sells "inside".
- Hub steps to hall specifically: make the facade a drawn layer with a real
  doorway (the doors already exist, `HubScene` ~244). The hall backdrop is
  swapped at the doorway, not across 600 px of floor.
(b) Outdoor area to another outdoor area (lane to square, green to meadow)
- Use a landmark in the art: a gate, arch, bridge, hedge gap, or alley mouth
  wide enough to cover Jo. Put the edge inside it.
- Dip: 180 ms down, 80 ms hold, 220 ms up (about 480 ms). Slower than (a)
  because the whole sky and horizon change.
- Camera: scroll normally up to the landmark, snap on the hold, then scroll
  out the far side with the normal follow (no lerp across the swap).
- Sky colour and horizon change at the hold only. Outdoor ambience and music
  crossfade over 600 ms (audio may crossfade; pictures may not).
- Jo keeps walking. Control is never locked for walk-through frames.
(c) Indoor room to indoor room (hall to ticket office, house room to room)
- Interiors have no backdrop, so there is no ghost. Use the quickest option:
  a door or arch, 90 ms down, 40 ms hold, 110 ms up (about 240 ms).
- Camera snaps to the new room bounds in the hold. Room music "through the wall"
  (`room.music.wall`) stays, it is audio only.
- Stairs and lifts use the existing `door` portal with the 250 ms fade.

Do not: use long fades, lock input on walk-through frames, or start fade-in before the swap.

## 4. Files a builder would touch
1. `src/world/RoomGraph.js`: `blendAt()` must stop returning mid values. Easiest:
   return `t` as 0 or 1 only (step at the shared edge) so everything downstream
   sees a hard cut. Or add `kind:'frame'` portals that reuse the `door` path.
   `DEFAULT_SEAM_HALF` becomes a small frame width.
2. `src/world/TransitionDirector.js`: add a `walk(portalId, {down, hold, up})`
   variant: fade, swap, fade, no `input.suspend`, Jo keeps velocity.
3. `src/scenes/DreamScene.js`: ~354-375 (room change), ~427 (door entity), ~765-775
   (the per-frame `blend`, `backdrop.update`, `ambience.blend`). Trigger the
   walk transition when Jo overlaps a seam frame; stop calling
   `ambience.blend` with fractional `t`; do audio crossfade by time.
4. `src/world/BackdropDirector.js`: `update()` / `state.t`: draw one set at
   alpha 1. Delete the second layer pass.
5. `src/builders/parallax.js` (Hub): `blendAt()` ~1191, `update()` ~1267 (`pair`,
   sky overlay at `t`), `half()`, `updateEdges()`. Collapse to a step at the
   doorway x. Per-room values at ~1334 follow.
6. `src/scenes/HubScene.js`: ~1394 `parallax.update()`; `hallEntryX` ~260 and the
   opening trigger ~1258 (`p.x > hallEntryX`) assume a continuous floor.
7. `src/world/CameraDirector.js`: `bounds(roomId, blend)` lerps y0/y1 on `t`.
   With a step it stays correct; add a `snap()` on swap (already exists).
8. `src/audio/Ambience.js` `blend(a, b, t)`: keep, drive with a timed `t`.
9. Dream room data (`src/dreams/*`): seam entities get a frame prop and a
   narrow `seam.width` (the lint in `tests/dream-checks.test.js` wants a
   "physical seam prop" already: good, keep and strengthen it).

## 5. Risks: tests and scenarios that assume the blend
- `tests/framework.test.js` line 34: "blends across a seam ... smoothstep",
  asserts `t` ~0.5 at the edge and monotone small steps. Must be rewritten for
  a step or for the new frame rule.
- `tests/dream-checks.test.js` line 18: seam width and "physical seam prop".
- `src/dev/scenarios/backgroundSnap.js`: `blend-continuity` (max dalpha 0.1,
  needs `sc.parallax.blend.t` mid-values and "crossed === n"),
  `boundary-no-flicker` (120 frames at each boundary, 0 room changes: a
  trigger rect at the edge must keep hysteresis).
- `src/dev/scenarios/phase3.js` `clockmaker-seam-no-snap`; also `painter.js`
  (~366, gate seam) and `musician.js` (~307, alley mouth seam) walk seams and
  assume no input lock and no snap. Their "no snap" asserts must allow a
  covered snap during the hold.
- Walk-through with a camera snap while Jo is mid-run: guard for a jump or
  fall at the frame (only trigger when grounded, queue otherwise).
- `RoomStreamer.focus()` must be called at the
  hold, not earlier, or the old room unloads under a visible frame.
