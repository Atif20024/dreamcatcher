# Ladders: climb both ways, lead somewhere

Owner, verbatim: "before i enter the platform, there is a ladder. but as i
reach there, i move back to upper level where platform is. fix it."

## Root cause

The ladder is the undercroft one at col 77, just before the arch onto the
platforms. It hangs under the grate, which is a **solid** floor tile (row 26).
The Player can climb through that tile because HubScene turns the colliders
off while he climbs. `src/world/reach.js` could not. It treated the lid tile
as a wall, so no edge in its graph went down through the grate or back up.
That left the whole undercroft (rows 28-32) outside the station's home set.

The safety net (`HubScene.updateSafetyNet`) saw Jo standing at the ladder's
foot on a cell "with no way home" for 500 ms and called `rescue()`. That dip
put him back on his last safe footing, which was the concourse beside the
grate. The pocket lint did not catch it either: the undercroft was not
reachable in the model, so it was never counted as a pocket.

I reproduced it with the harness before the fix (`hub-ladder-undercroft`):
`net 1`, and Jo was back on the concourse.

A second hub fault turned up in the same pass. The roof ladder (col 62, up
the skylight rib) ends at a hatch with nothing on its top rung. Holding UP,
Jo popped off the top, fell back into the hatch and caught the ladder again,
forever. Letting go of UP dropped him the full 17 rows to the concourse.

## Fix

- **reach.js models a lid hatch.** It now has a downward edge from the cell
  over a one-tile solid lid to the first rung node under it, and an upward
  edge out of the top of a ladder whose head is under such a lid. The
  undercroft is now reachable and gets home, so the net leaves it alone. The
  net itself is unchanged.
- **Ladder caps (`src/world/ladders.js`).** A ladder with open air over its
  head gets an invisible one-way ledge on its top rung. `RoomBuilder` builds
  it for the hub and the legacy dreams, and `Terrain.colliders` builds it for
  the framework dreams. It is also entered in `oneWayGrid` so the ground
  solver sees it. Jo stands on the hatch and walks over it; DOWN climbs in.
- **`ladderPass` process callback.** While Jo climbs, the plank, cap or
  one-tile cover on his ladder column does not collide with him. A plank
  under a ladder's foot still does. This is wired in DreamScene (per room),
  Writer, Astronaut and Painter-legacy, and in `BaseLevel.setupCommon` for
  the caps. Hub and Evening already switch every collider off while he
  climbs.
- **Player** (`src/entities/Player.js`):
  - DOWN on top of a ladder is read from the body's own feet, because the
    legacy body and the 82 px body sit differently, and the Writer's planks
    sit 10 px above their row.
  - A solid lid is grabbed only where the scene sets `ladderLids` (Hub,
    Evening). Elsewhere DOWN on one pinned Jo on it in the climb pose.
  - Climbing up to the ladder's head, he steps out and stands on the cover
    or cap instead of popping into mid-air.

## Every ladder checked (scan of all room grids + scenarios)

| where | ladders | before | after |
|---|---|---|---|
| hub undercroft (col 77, lid) | 1 | net snapped Jo back up | down, walk, up: ok, net 0 |
| hub roof rib (col 62, open hatch) | 1 | pop/re-grab loop at the top | stands on the leads, down again ok |
| painter (framework): chapel x6, bottega, guild, speziale x3 | 11 | DOWN on the plank pinned Jo in the climb pose | both ways ok |
| gambler deck (framework) | 2 (one open-topped) | same pin from the top | both ways ok |
| clockmaker, musician (framework) | none | | |
| writer | 9 | DOWN from a library plank never grabbed (legacy body) | 7 both ways ok; see below |
| evening (school, station) | 2 lids | already passed through (ladderLids) | unchanged |
| astronaut p4_pad | 1 open top | top rung not standable | capped |

Two ladders are not covered by the new scenario:

- **Writer col 141**: the café's broken ladder, which only exists once it
  is fixed.
- **Writer col 210** (the library's top shelf): its plank has 22 px of
  headroom under the ceiling, so Jo cannot stand there. This is a headroom
  item for the Writer's level design, not a ladder fault.

The Writer's press ladder (col 555) ends under the solid press roof. Jo
climbs to the roof and jumps off sideways, and DOWN on that roof no longer
pins him.

Legacy GamblerScene (`src/scenes/GamblerScene.js`, behind
`LEGACY_GAMBLER`) still has the plank pin. I left it alone because the
gambler is another agent's review area. The fix there is one line: pass
`ladderPass(this)` to its oneWays collider.

## Tests

- `tests/reach.test.js`: two new tests. One checks that the grate ladder
  leads down to the undercroft and every undercroft floor cell gets home;
  the other checks a lid hatch in a small grid, down and up, and that a
  two-tile slab is not a lid. Both fail on the old `reach.js`. The whole
  file is green, the safety-net tests included.
- New scenarios, in `src/dev/scenarios/ladders.js`:
  - `hub-ladder-undercroft`: walks the concourse to the grate, climbs down,
    stands 1.5 s, walks the undercroft, comes back and climbs up. Net 0.
  - `hub-ladder-roof`
  - `dream-ladders-both-ways` (13 ladders)
  - `writer-ladders-both-ways` (7 ladders)
- Re-run and passing:
  - hub: `hub-roof-drops`, `hub-safety-net`, `hub-thresholds-dip`,
    `hub-threshold-no-flicker`
  - transitions: `dream-seams-dip`
  - ladder jumps: `ladder-jump-writer`, `ladder-jump-painter`
  - painter: `painter-ladder`, `painter-places`, `painter-playthrough`
  - gambler: `gambler-deck`
  - walking: `slope-hub-steps`, `slope-writer-arrival`,
    `slope-evening-arch`, `jo-walk`
- vitest: 257 pass. lint:content, lint:rooms and lint:scale are clean
  (0 failures). vite build ok.

Screenshots (scratchpad): `ladder_hub_after.jpg` shows the undercroft foot
and the top of the roof ladder. `ladder_chapel_down.jpg` shows Jo climbing
down from a chapel plank.
