# THE LAST STOP scale fix: review round 1 (designer + pro gamer, eye only)

Looked at 25 `laststop_*_after.jpg` shots (swing, swing2, canal, boat, boatsit, mill-less set: fields, cart, gardens, hives, shed, hill, orchard, steep, station, school, roofs, roofs2, laundry, charpoy, chess, hedge, lake, stream) against `src/data/scale.js`. `laststop_chesszoom_after.jpg` is a black frame, so no close read of the chess table. There is no mill screenshot at all (see MUST 1).

## Verdict: converged on scale, one MUST that is a missing proof, not a visible defect

Next to Jo nothing reads wrong any more. The swing bough, rope and seat, the school A-frame, shed door, tractor, tea stall, narrowboat, greenhouse, water tank, laundry posts and the steep-street bike stall all sit at believable fractions of an 82 px man, and the painted props sit in the same shaded 2 px style as the trees and houses around them. Seats and poses line up (swing, bench, rowing boat, charpoy, chess pair). Nothing crowds a place.

## MUST

1. **The mill, the biggest prop (264 x 286, 3.5x Jo), has no screenshot in the set.** Nobody has looked at it, and the owner's complaint is about the whole stop. Fix: shoot the mill and its wheel at Jo's walk-up and read it before calling this closed (scene key `mill` in `src/scenes/evening/world.js:545`). If it reads fine this MUST disappears.

## SHOULD

1. **Mill wheel over dry ground** (`src/scenes/evening/world.js:545`, `ev-mill`). A 154 px wheel turning in air is the one thing a player will question, and it is the loudest prop on the map. Ruling: do not move terrain. Fix: put a painted millrace (a 1-tile stone trough with a dark water strip and a few foam pixels) under the wheel's lower third, or shrink the lower arc behind a stone sill, so the wheel dips into something.
2. **Chess table without pieces** (`src/art/propKit.js`, `ev-chess`). The prompt says "move a piece", and the table is a bare dark slab. Ruling: fix it, it is cheap. Fix: draw 6 to 8 two-pixel pieces (light and dark) on the top in the kit's table painter.
3. **Station hedge is a flat green slab** (`laststop_station_after.jpg` right edge, about 230 px tall, 3x Jo, no outline or leaf shading). It is the one prop in the set that does not match the painted trees. Fix: give the hedge a leaf-cluster top edge and 2 shades like the orchard trees, or drop it to 1.2 m (53 px). Not in the builder's list; check whether it is old art.
4. **Bike stall east post behind the first step** (`world.js:369`, `ev-bikestall`). In `laststop_steep_after.jpg` the post is half buried and the canopy reads as leaning on the stair. Ruling: fix by moving the stall 1 tile west (or narrowing the canopy by one tile); Jo and the owner already fit under it.

## NICE

1. **Pigeon perches on the loft** (`world.js:392`, `ev-loft`, flocks in `EveningScene.js:353`): ruling, leave them, but pull the perch y up to the new roof line (106 px) if any bird is seen hovering; I saw none in the shots.
2. **The 6 px lift on the station low wall** (`EveningScene.js:854`, `p.artDy = bench || onWall ? -6 : 0`): ruling, keep. It puts the hips at 20 px, which is right for a 0.45 m seat as long as the wall top is 20 px high. Fix if needed: have `lint:scale` assert the wall top is 20 px; nothing to change visually.
3. **Radio crate on the rooftop** (`laststop_roofs2_after.jpg`, grey striped lump by the tank) reads as a dish or a stack of grey slats, not a radio. Fix: add a dial and an aerial so it reads as a radio at 30 px.
4. **Narrowboat water strip** (`laststop_canal_after.jpg`, boat at right): the boat floats over a dim olive band; give that band a few ripple pixels so it reads as water.
5. **Sheets overlap each other** on the laundry line (`laststop_laundry_after.jpg`): space them 6 px apart.

Not looked at: chess table at close range (black frame), the mill, the awning rain shelters in motion.
