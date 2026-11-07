# Station soft-lock and the astronaut pool's scale

Two owner reports:
- "i went using ladder, on top, and fell down. now i have nowhere to go"
- "we made jo bigger, but everything else remains same size like the hoop
  which jo need to cross in water"

## Bug 1: the soft-lock at the service gate

### What happened
I traced the station map in `src/data/hub/map.js`:
- The roof walkway (row 8) stopped at column 162.
- The service gate (columns 163-164) is solid from its lintel (rows 9-11)
  down to the concourse.
- The two columns past the gate (165-166) were open air from the sky down
  to the undercroft's earth at row 28.

When Jo walked off the roof's east end, he dropped onto the lintel and then
into that two-tile shaft. Its floor is the "stone ledge" in the owner's
screenshot, two tiles below the concourse. The gate stood 19 tiles over
him on one side and the world's edge on the other. A jump reaches about
4.7 tiles, so he had no way out.

### The fix
- **The map.** The station's east end wall now runs from the roof down to
  the earth (columns 165-166, rows 9-27). The roof runs on to the world's
  east edge, so Jo now walks into that wall instead of off an edge. The
  shaft is gone.
- **A reach map.** `src/world/reach.js` is new, and it is pure code. It
  models Jo on the tile grid:
  - He needs a 3-tile body over a floor, or a ladder.
  - A jump rises up to 4 tiles and carries up to 4 across. Drops are
    unlimited. Ladders work in both directions.
  - `pockets(rows, start, home)` lists every cell Jo can reach from the
    start but cannot get back to home from.
  - The model is generous on purpose: if it calls a cell stuck, the cell
    really is stuck.
- **A test.** `tests/reach.test.js`:
  - The station has zero pockets. Start: the street. Home: the hall's
    concourse.
  - Every roof cell is reached, and every one gets back home.
  - On a synthetic copy of the old gate end, the shaft is found.
  - The same shaft with a ladder added comes out clean.
  - Before the map fix, the station test failed with exactly `[165,27]` and
    `[166,27]`.
- **A safety net.** In `HubScene.buildSafetyNet()` and `updateSafetyNet()`:
  - The station builds the reach map once.
  - If Jo is grounded for 0.5 s on a cell with no way home, he is stuck.
  - If he is ever below the undercroft floor, he has fallen out.
  - Either way, `rescue()` runs the station's short dip (`DIPS.inin`,
    90/40/110 ms). At full dark it puts him back on his last safe footing,
    and the room, backdrop and camera clamp are set while the screen is
    still dark.
  - The last safe footing only ever records a cell with a way home
    (`isSafeHere`), so the net can never return him into a pocket.
  - Nothing is lost: the station has no hearts.

### Every drop off the top

| Edge | Lands on | Way back |
|---|---|---|
| Clock tower, west face | The front steps | The steps |
| Clock tower, east face | The bridge | It is the roof |
| Water tower, both sides | The roof | The roof |
| The hatch (column 62) | The hall floor | The hatch ladder |
| Roof, west end | The clock tower wall (no drop) | None needed |
| Roof, east end | The east end wall (no drop) | None needed |

### Scenarios
New file: `src/dev/scenarios/softlock.js`.
- `hub-roof-drops`: Jo walks off each of the 10 roof edges and lands.
  Each landing must have a way home, and the net must not fire. The test
  also checks that the shaft is walled.
- `hub-safety-net`: two cases.
  - Jo below the floor: one dip, and he is back on safe ground in the hall.
  - Jo standing in a pocket: a stand-in pocket is cut from the home set.
    He gets one dip, and is back.

Screenshot: `softlock_after.jpg`, Jo at the roof's east end against the wall.

## Bug 2: THE QUIET ABOVE at Jo's scale

### The pool (`p1_pool`)
- **Depth.** The water is now 8 tiles deep, which is 5.8 m. It was 4.4 m.
  - The basin has walls below the deck's crust. Before this, the bottom
    two water rows were open to the void at each side.
  - The mid-wall hangs 2.9 m from the surface, with a 2.9 m gap under it.
  - The deep-end shaft and the sunken locker moved down with the floor.
- **Hoops.** Each hoop is a 2 m ring (88 px) on a weighted stand.
  - They are drawn in code (`buildPool`), seen nearly side-on. The far
    half is behind Jo and the near half is in front of him, so he is
    plainly inside the ring as he swims through.
  - Hit area: his middle within 18 px across and 34 px up or down of the
    centre. That is a 68 px opening for his 44 px swim body.
  - The new route: (66,38), (70,40), (74,41) in the mid-wall's gap, (78,40)
    and (82,38).
  - Each hoop sits fully under water and clear of the surface, the floor
    and the wall.
  - The coins sit on the line between hoops.
- **Lane lines.** The lines 0.7 m apart were the liquid's lit "top" band.
  `RoomBuilder` drew it on every water tile.
  - It is now drawn only on the real surface: water with no water or solid
    above it.
  - This applies in every dream, and fixes deep liquid anywhere.
- **Lane ropes.** There are two ropes of real floats on the surface.
  - Floats are 0.25 × 0.2 m. They are blue and white, and red for the
    last 5 m at each end.
  - The near rope is over Jo's lane. The far rope is 2.5 m behind it,
    smaller and dimmer.
  - Neither rope crosses the mid-wall's top.
- **Bubbles.** Bubbles are rings 6-10 px across with a lit fleck. They rise
  to the surface and stop there. They only appear while Jo's head is under
  water. The vault's splash drops are larger too.
- **Pickups.** The coins are 21 × 18 px and the shard is 21 px. That is
  the top of the coin class (12-22 px), so I left them at that size and
  put them on the route.
- **Unchanged.** The breath meter and "[SPACE] at the surface to climb out"
  work as before: the surface row did not move, so the surface check still
  holds.

### The rest of the dream, swept

| Prop | Before | Now (1 m = 44 px) |
|---|---|---|
| Ring corner posts | 24 px | 1.3 m (57 px), padded, on the canvas |
| Ring ropes | 10 px apart | 0.45 / 0.85 / 1.25 m |
| Station handrails (handholds) | A 6 px bar | A 4 px bar on standoffs every 0.8 m |
| Centrifuge housing | A 40 px stepped dome, on the slope | A 3.2 × 2.4 m dome with a 2 m door, on the plinth (drawn in code) |
| Spare solar panel, and its slot | 24 × 12 px; 30 × 30 px slot | 0.9 × 0.45 m; a slot it fits in |
| Simulator | 60 × 44 px | A 2.4 × 2 m cockpit shell with a window, on the floor |
| Survival kit: bag, cone, life ring | 12-15 px | 0.7 m, 0.65 m, 0.55 m |
| Shelter tent | 60 × 36 px | 2.2 m long, 1.3 m to the ridge |
| Beacon | 18 px | 0.55 m |
| O₂ wall ports | 20 × 26 px | 0.65 × 0.8 m |
| Comms panel | 18 px | 1 m (its sign moved below it) |
| Probe | 48 px | 1.4 m |
| Winch | 18 px | 0.8 m |
| Lunar lander on the moon | 48 × 32 px | A 4.4 m lander: gold-foil descent stage, four legs, ladder, cabin, hatch (drawn in code) |
| Re-entry capsule in the field | 50 × 30 px | 3.9 m across the heat shield, 3.3 m tall, scorched, chute lines slack |

These were left at their size because they are already at real size, or
are held items:
- the bell
- the valve wheel (0.4 m)
- the wrench
- the data core
- the patch kit
- the flare
- the tether hooks
- the notebook
- Priya's desk (the prop kit's 1.4 m desk)

The descent puzzle's lander icon (on screen, not in the world) keeps the
small sprite.

### Objectives
- `p1_pool`: "swim through 5 hoops on one breath". It was "train it up:
  the pool".
- `p1_wall_ring`: "climb to the bell · box in the ring". It was "train it
  up: the climbing ring".
- The track's objective and the laps for Coach Adaeze are untouched.

### Scenarios
New file: `src/dev/scenarios/astroPool.js`.
- `astro-pool-scale` checks:
  - Each hoop is 70-90 px and fully under water.
  - Its far half is drawn behind Jo and its near half in front.
  - The opening fits Jo's body.
  - The pool is at least 5 m deep.
  - There is no lit band under the surface.
- `astro-pool-hoops` swims the line:
  - All 5 hoops light up on one breath, and the breath meter falls.
  - [SPACE] at the surface climbs out.
  - LUNGS goes from 2 to 3.

Screenshots:
- `pool_before.jpg`
- `pool_after.jpg`. The lane floats were drawn as rounded rectangles when
  it was taken. They are ovals now, because the identity lint keeps
  rounded-rectangle drawing to `Panel.js`.

## Checks
- `npx vitest run`: 165 passed. This includes the 4 new reach tests.
- `npm run lint:content`: 0 failures.
- `npm run lint:rooms`: 0 failures, 36 warnings.
- `npm run lint:scale`: clean.
- `npx vite build`: built.
- Scenarios run: only hub, transition and astronaut ones, one at a time,
  silent, on port 5181. All of these passed:
  - `hub-roof-drops`, `hub-safety-net`
  - `hub-thresholds-dip`, `hub-threshold-no-flicker`
  - `jo-route-hub`, `slope-hub-steps`, `hub-dreamcatcher`
  - `readability-hub`, `scale-hub`
  - `dream-seams-dip`, `clockmaker-seam-dip`
  - `astro-pool-scale`, `astro-pool-hoops`
  - `jo-route-astronaut`, `eva-tether-trap`
  - `scale-astronaut`, `readability-astronaut`

## Known issues
- The `RoomBuilder` change to the surface band affects every dream with
  liquid. Only the hub and astronaut scenarios were run, so the next full
  run should look at the Chef's and the Writer's liquids.
- The lander and the capsule are scenery. Jo still appears at the lander's
  foot and beside the capsule, at the same marks as before.
