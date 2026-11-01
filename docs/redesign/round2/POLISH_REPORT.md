# Polish round: characters, station, corner help

No browser in this job. vitest, lint:content, lint:rooms, lint:scale and vite build were run. **No scenario was run and nothing was seen in play.** The only visual checks were the baked sheets.

## A. Characters

| Item | Done | Checked |
|---|---|---|
| Climb, jumping jack | `jo.poses.js`: each frame has one hand high and one at the chest. The knee opposite the high hand is raised and the other leg is straight. The raised knee bends inward, so there is no splay. Feet stay at ±3 from the hips, on the rungs. `climb_idle` matches. | `sheets/jo-climb.png`, by eye. On the ladder itself: not seen. |
| Alert glow on pale skin | `cast.js` `alertGlow`: on skin with luminance 0.5 or above, the glow is the skin colour, so it is gone. The 2×2 eye stays. Darker skin keeps the glow. Costume palettes are covered too. | `cast-lineup` and `gait-foe-guard` sheets rebaked. I did not zoom in on the top-hat foe. |
| Speck over the hat | Apex lift is now 0. The first fall frame went from -1 to -2, because it had the same 1 px lift. That frame was not in the brief. | `sheets/jo-apex.png` enlarged: speck gone. |
| `jo-contrast` Evening reading | **Not done as briefed**, see below. | Unrun. |

**The Evening's `local` 1.03.** There is no sampling rectangle to move. `local` compares each pixel on Jo's mask edge with the same pixel with Jo hidden; the 120 px box only feeds `edge`. A value near 1 means the mask is not on top of Jo in the first snapshot. My best guess is that the Evening's camera is still easing between snapshots (zoom over 1.4 s, follow lerp 0.08), since each snapshot steps the game. This is a hypothesis, not a measurement. So I:
- let the Evening settle for 240 steps before probing
- added `drift` (camera movement across the snapshots) and `box` (the sampled box) to the output

If `drift` reads 0 and `local` is still about 1, the guess is wrong and this needs another look.

## B. Station

- **SHOULD 1, ghost houses.** The band is in `src/systems/horizon.js`, not `EveningScene.js`.
  - **Cause:** the town and near bands crossfade with the road band across cols 396 to 470, so the houses are see-through for all of that stretch. The mill is at col 604, where a walk has already finished the fade. `station_mill.jpg` was reached by teleport, so it most likely caught the fade mid-way. The review's claim that every player sees it at the mill is probably wrong. The ghost on the viaduct was real, though.
  - **Fix:** the town bands are gone by 15% of the fade, and the road band is solid by 50%. The sea keeps the old curve because it has no houses on it.
  - **Remaining:** the houses still fade over about 11 tiles at the start of the viaduct. Not seen.
- **SHOULD 2, lapel flower.** 12 px, with a green stem and a dark rim, still pink. Not seen.
- **SHOULD 3, roof coins.** All 15 lead coins, including the tower arc, are worth 5 each, so $75 in total. They use the coin's own `n`, so the wallet and HUD follow, and the save keys don't change. No test broke.
- **NICE.**
  - "Back again." now plays after a return with nothing caught. It keys off a new `returnCaught` flag, because `weaveNext` is already spent by the time Jo reaches the desk. A replay of an already-caught dream still counts as caught, as the weave does.
  - The postbox confirm line sits 14 px higher.
  - `hub-sleeper` is listed as a pose, not judged, in `scale.js`.
- **Clock tower.** By `reachGrid` on the map: the bench, shard and arc cells (cols 12 to 21) are reached from the hall, and there is a way back. A full jump rises about 150 px and the tower is 128 px above the bridge, so it clears by 22 px. `station-roof-rewards` is the real check.

## C. Corner help

`cornerNudge` in `motion.js` is pure. `Player.tryCorner` calls it.

- **When it fires:** rising at 100 px/s or more on the previous frame, blocked above, airborne, not locked, not floating, gravity on, body moving. Ladders return before it. It only runs on a frame where physics stepped.
- **What it does:** tries ±1 to ±4 px and takes the first spot where the body clears both solid and hazard tiles, then restores the rising speed.
- **Previous speed:** read from `prevVy`, recorded each postupdate.
- **Hazards:** every static hazard body comes from a `^` tile, so a tile check covers them. Moving foes and flames are not checked.
- **60 Hz arcs:** no velocity or position is touched unless a nudge fires. The existing `feel.test.js` arcs still pass.
- **30 Hz:** `wasTouching` covers two-step frames. A frame of three or more steps can miss the nudge, which just gives the old stop.
- **Side effect:** a head-height snag on a wall seam also counts as a corner hit, so that jump now carries on.
- **Tests:** `feel.test.js` covers 1, 4 and 6 px clips, a run of tiles, hazard and wall cases, a soft rise, and a non-tile blocker.

**Owner decision still pending:** this went in on "unless they object".

**Vent:** the feel review says to land the vent cooldown first, because a vent can pin Jo under a shelf. The chef scene is out of bounds here. A pinned Jo only moves if he is within 4 px of a corner, and then he slips out. Worth a look in `chef` on the branch that holds it.

## Scenarios to rerun

- **Corner help:** `jo-jump-arc`, `jo-land-soft-hard`, `jo-float`, `hub-ladder-roof`, `hub-ladder-undercroft`, `dream-ladders-both-ways`, `writer-ladders-both-ways`, `hub-roof-drops`, `station-roof-rewards`
- **Other changes:** `jo-contrast`, `scale-hub`, `station-return-staged`, `evening-postbox`, `evening-bench-gate`
- **By eye:** the viaduct walk from col 390 to 470, the lapel in the hall, a ladder climb at game size, and the top-hat foe's alert
