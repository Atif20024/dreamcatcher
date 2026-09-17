# Dreamcatcher — the look, and what we learned making it

This is the running record of the art direction. Decisions live at the top;
every round of feedback goes in the log at the bottom, with what was changed
in response. When the look is settled on THE LONG EVENING it gets rolled out
to the hub and the three dreams using the same toolkit.

## The decision
**Painterly world, pixel people.** Jo, the cast, the foes and the animals stay
string-art pixel rigs (that work is done and a pixel character over a painted
world is a proven pairing). Everything else — sky, clouds, horizon, ground,
trees, props — is *painted*: soft edges, layered light and shadow, texture,
never a bare primitive. Nothing in the world may be a plain rectangle or an
ellipse with a flat fill.

**Painted in code, replaceable by PNG.** There is no budget and no artist,
so the paint is procedural (`src/art/paint.js`), which also keeps it
deterministic and hot-reloadable. Any texture can be replaced by a real
painting: drop `public/art/<level>/<key>.png` in and list the key in that
folder's `manifest.json` (`src/art/overrides.js`). The painters skip any key
that arrived as an image.

## The style bible
- **Light.** One sun, low, from the west (the left of the screen). Every
  lit face is on the left, every shadow falls right and long. Rim light is
  warm gold; the moon's is blue. This is a rule for every level, not just
  the Evening: a level with a different sun states it in its theme.
- **Value before hue.** Things read by their light-and-shadow first. A tree
  has a deep shadow mass, a mid body and lit clusters on the sun side — the
  green is incidental.
- **Atmosphere.** Far things wash toward the horizon colour (aerial
  perspective): sea 35%, mountains 50%, town 25%, near facades 8%. Nothing
  far away is as contrasty as something near.
- **Texture everywhere, loudly nowhere.** Paper grain on every band and tile
  (3–8%), a slow colour wash on walls so no fill is one flat colour. It must
  be felt, not seen.
- **Edges are soft where they are far, cut where they are near.** Clouds
  and mountains have no hard edge. Stone courses and window reveals do.
- **The camera's own look** is a painted vignette (multiplied, 0.8) and a
  moving grain (overlay, 4%). Camera post-pipelines (bloom, colour matrix)
  were tried and dropped: rendering the camera through a framebuffer dimmed
  and greyed the whole frame, and Phaser's bloom has no threshold so it
  glows everything. Glow is done with additive sprites where it belongs
  (the sun, lamps, lit windows).
- **Ground.** The tileset is painted cut limestone (courses, lit lip, deeper
  lower half). Where a place is turf the same masks swap to packed earth
  (`evd_`) and grow a painted grass fringe along the lip. The town's zones
  still tint the ground, and the sky's ambient tints all of it.

## The toolkit (`src/art/paint.js`)
`noise2/fbm/fbmTiled` (deterministic, tileable), `stamp` (soft round brush),
`dab` (flat brush mark), `clump` (leaf cluster), `gradientV`, `grain`,
`wash`, `foliage` (a whole canopy with a light direction), `trunk`,
`paintTexture` (canvas → Phaser texture, override-aware).

## Feedback log
### Round 1 — 2026-09-17 (the Evening, arch)
Feedback: "all the items feel like they are built with fixed shapes … the
trees look so bad … i want this to look amazing."
Diagnosis: everything was drawn from primitives (clouds = five ellipses,
trees = a rectangle with circles, mountains = flat fills).
Done: the painting toolkit; painted clouds (noise-grown, lit tops, tinted
bellies), a real sun disc and wide glow, horizon haze; mountains with lit
western faces, haze at the foot, pines; the town band's hill, lit/shaded
walls, tiled roofs; near facades with plaster wash, window reveals, sills,
base shadow; painted broadleaf, apple and hill trees, pines, hedge, ivy
arch, grass tufts; cut-stone and earth tilesets with grass fringes; the
road band repainted (wheat rows, hedgerows, pine fans, snow); the lake as a
smooth mirror with ripples; vignette + grain.
Open: near-band balconies/awnings still flat; NPC props (benches, carts,
stalls) still gridded; the sea's shallows; snow accumulation sprites.

### Round 2 — 2026-09-17 (the Evening, in play)
Feedback: the sea showed under the facades when the camera rose; an NPC
floated at the hedge gap; a rainbow at night beside the aurora; "there
should be more things to do — compete in football, collect something"; the
weather and events should all happen inside one visit; the character should
walk like walking.
Done: a ground band under the facades that follows the camera; NPCs no
longer stand on the opened hedge; the rainbow lives only in daylight;
penalties against Noor (five each, she keeps score, ↑/↓ aim and dive, E to
shoot); twelve lost things across the town and road that go in his pocket,
counted on the child's map (saved across visits); a "things you could do"
note pinned beside the map, ticked as he does them; the first-visit weather
plan shortened (rain at ~2 min, snow at ~6), sit events at 6 s, dinner at
13 min; four-frame walk cycles for Jo and everyone in town, stepped by
distance so feet never slide, a quiet footstep on each contact.
Open: a proper rig-based walk (the character-motion skill) is still the
right end state; NPC props still gridded; the sea's shallows.
