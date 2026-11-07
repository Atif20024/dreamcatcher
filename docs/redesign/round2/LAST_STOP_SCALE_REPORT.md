# THE LAST STOP: scale pass on the Long Evening

Owner: "last stop is out of proportions. like swing."

The Evening's world kept old string art drawn when Jo was about 40 px tall. He
is now 82 px with his hat (1 m = 44 px), so a shed came up to his chest, a
tractor to his knee and the swing's rope hung from below his shoulder. This
pass walked every place with the harness, listed what was wrong and redrew it
from real metres, in the prop kit's shaded 2 px cells (`src/art/propKit.js`).
Route, story and room crossfade are untouched.

## Sizes

Current = before this pass. Target and new are drawn px at scale 1, w × h.

| Thing | Real size | Target px | Was px | Fix |
|---|---|---|---|---|
| Rope swing: bough height | 2.4 m | 106 | 66 (below Jo's head) | hung from a painted bough off the apple tree |
| Rope swing: seat height | 0.45 m | 20 | 16 | rope 84 px (was 50) |
| School swing set | 3 × 2.3 m | 132 × 101 | 56 × 52 | redrawn: A-frame, two seats at 0.45 m |
| Arch (where Jo arrives) | 2.6 × 3.05 m, opening 2.4 m | 116 × 134, opening 106 | 80 × 92, opening 78 | repainted; the dark doorway is now the opening's shape |
| Fence | 2.4 × 1.1 m | 106 × 48 | 64 × 24 | redrawn |
| Clothes post | 2.3 m | 101 | 56 | redrawn with a crosstree |
| Washing line | 2.2 m | 96 above ground | 144, floating over 56 px posts | tied to the posts |
| Sheets | 1.35 × 1.1 m | 60 × 48 | 30 × 27 | redrawn |
| Awnings | 0.7 m deep, w tiles wide | 160 / 224 × 30 | 80 / 112 × 20 | as wide as the shelter they give; laundry one raised over Jo's head |
| Tea stall | 2.4 × 2.5 m | 106 × 110 | 64 × 36 | redrawn: canopy, counter at 1.05 m, samovar |
| Bicycle stall | 3 × 2.4 m, bicycle 1.7 m | 132 × 106 | 64 × 32 | redrawn with a real bicycle |
| Narrowboat | 8.4 × 2 m | 370 × 88 | 104 × 24 | redrawn, moored behind the towpath |
| Rowing boat | 3.2 × 0.6 m | 140 × 26 | 56 × 16 | redrawn |
| Pigeon loft | 2.4 × 2.4 m | 106 × 106 | 48 × 40 | redrawn |
| Water tank | 1.6 × 2.4 m | 70 × 106 | 40 × 44 | redrawn |
| Chilli rack | 1.8 × 1.5 m | 80 × 66 | 40 × 32 | taller posts, strings of chillies |
| Radio crate | 0.7 m | 30 | floating 19 px off the roof | stands on the roof |
| School gate | 2 × 1.5 m | 88 × 66 | 40 × 32 | redrawn |
| Hopscotch squares | 0.4 m | 18 | 12 | wider |
| Greenhouse | 3.2 × 2.4 m | 140 × 106 | 80 × 40 | redrawn; rain shelter widened to match |
| Beehive | 0.55 × 0.95 m | 24 × 42 | 20 × 24 | redrawn |
| Scarecrow | 1.2 × 1.9 m | 52 × 84 | 40 × 64 | redrawn |
| Shed | 3 × 2.6 m | 132 × 114 | 48 × 32 (its 99 px door stood taller than it) | redrawn; rain shelter widened |
| Tractor | 4 × 2.6 m | 176 × 114 | 64 × 32 | redrawn |
| Farm cart | 3.6 × 1.5 m | 158 × 66 | 56 × 24 | redrawn with hay and a 1.2 m wheel |
| Mill | 6 × 6.5 m | 264 × 286 | 64 × 44 | redrawn; moved 3 columns east, off the bridge |
| Mill wheel | 3.5 m | 154 | 40 | redrawn, on the east wall |
| Wheat | 0.9 m | 40 | 18 | painted clumps, up to Jo's belt |
| Sheep | 1.3 × 0.95 m | 58 × 42 | 27 × 15 | redrawn |
| Goat | 1 × 0.85 m | 44 × 38 | 27 × 21 | redrawn |
| Deer | 1.5 × 1.6 m | 66 × 70 | 33 × 33 | redrawn |
| Signpost | 1.3 m to the board | 58 | 40 | taller post |
| Handrail on the steep street | 1 m | 44 | 26 | raised |
| Campfire flames | 0.55 m | 24 | 10 | taller |

Already right, left alone (measured by `lint:scale` or by eye): bench 80 × 38,
street lamp 198, doors 99, house and bakery fronts, trees, postbox 68, fountain
176 × 88, chess table 44 × 34, chair 40, handcart 40, charpoy 22, departure
board, cairn 36, fire ring, people, cats, dog, heron, pigeons, owl.

## Seats

A sitting Jo's seat is 14 px above the ground with his feet on it (frame
`jo/street/side/sit/00`: hips 16 px over the soles, the soles 2 px into the
ground).

- **Rope swing:** seat 20 px off the ground, Jo's hips on it, feet just clear at
  rest. Checked seated, pumped to 0.61 rad and jumped off.
- **Bench:** raised by 6 px, so his hips land on the 0.45 m slats (it was 10 and
  he hovered). Checked at the square bench.
- **Station's low wall:** the same 6 px, it had no lift at all and he sat inside it.
- **Rowing boat:** hull drawn in front of his legs, seat on the thwart. His drift
  stops 80 px from each bank so the longer boat stays on the water.
- **Charpoy:** the roof sleeper had a chair under him, on top of the bed. No chair now.
- **Chess:** Hamid and Wren moved to 1.5 tiles either side so their knees meet at
  a table you can see.
- **Camera on the hill bench:** rests on the seat.

## Layout changes

Swing column 96 to 97 (it clears the trunk), mill 601 to 604, Hamid 166 to 166.5,
Wren 170 to 169.5, washing line row 26 to 27.5, laundry awning row 28 to 27.
Props have no physics, so nothing blocks a path; the anchors that moved are the
swing's (checked) and the rain shelters'.

## Keeping it right

`lint:scale` now measures all of these: `PROP_TABLE` and new `PROP_CLASSES` in
`src/data/scale.js`, and the arch, the arch's opening against Jo, the swing's
bough and seat and the wheat in `scripts/lib/scale-check.js`.

## Checked

`vitest`, `lint:content`, `lint:rooms`, `lint:scale`, `vite build`; scenarios
`scale-evening`, `evening-object-budget`, `restart-evening`, `slope-evening-arch`,
`slope-evening-hill`. Before and after shots of 25 stops were looked at.

## Not done

- `ev-chess` still has no pieces on it: the kit's table replaced the old drawing
  before this pass.
- The bicycle stall's east post sits behind the first step of the steep street.
- The mill wheel turns over dry ground; the stream is west of the mill, under the
  bridge, and moving either is a terrain change.
- Pigeon and goat perches were left as they are; pigeons on the loft were not
  tuned to its new roof.
