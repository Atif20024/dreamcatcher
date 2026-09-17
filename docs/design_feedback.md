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

### Round 3 — 2026-09-17 (walking, the swing, clutter)
Feedback: "core player walking seems very un-natural"; stuck on the swing;
"too many people and texts at one place — each person should have their
environment, groups only where a group is doing something."
Done: Jo's walk rebuilt from the four key poses of the motion tables —
contact, recoil, passing, high, then mirrored (8 frames): near leg lit, far
leg in shade, hips −1/0/+1 rows, arms opposite the legs, hat and tool one
frame behind the hips; the frame rate is locked to the body's actual
ground speed (a frame per 6 px) so feet never slide; footsteps and dust on
the contacts; a breathing idle; tuck and reach poses in the air. The
townsfolk share the same eight leg frames and hip bob. The swing: leaving
with E re-read the same press and sat him straight back down. The square:
Bo alone under his lamp, then the postbox, the fountain, the chess table
with its audience (the only crowd, by design), then the bakery; Adaeze
skips in the orchard grass, Bilal's tea is at the top of the canal steps,
Bastien washes a step on the steep street; only one overheard
conversation runs in the whole town at a time.
Rule from now on: one person per screen-third unless a group scene is
happening there; never two speech bubbles on one screen.

### Round 4 — 2026-09-17 (the rollout)
Feedback: "improve all the levels now with the same design pattern; the
theme would be dark but elements should look good in each one."
Done (src/art/levelArt.js): every level's ground is painted from its own
palette — cream stone with courses in the station, kitchen tiles with
grout, brick-and-board stone in the club, riveted steel plate in the
programme — with the lit lip, the shaded foot and grain; every parallax
layer (skylines, facades, walls, hanging things, railings, trusses) gets
a wash, light from the top-left on its silhouettes, weight at the ground
and grain after it is drawn; skies are painted gradients with a haze on
the lower third instead of eight-pixel bands; every gridded prop in each
theme takes the light pass; the vignette and grain sit on every camera.
The dark palettes stay dark: the pattern changes how a colour is laid
down, never which. The darkness-per-dream overlay is untouched.

### Round 5 — 2026-09-17 (the station)
Feedback: "Crossroads Station still seems like old. The design and painted
style like you created in the final level — I want the aesthetic to match
it. The people and everything should look better."
Diagnosis: the hub only got Round 4's generic pass (a wash and a light pass
over the old primitive drawings); the Evening was painted from scratch.
Done (src/art/hubArt.js, new; entities/hubArt.js rebuilt):
- Backdrops painted as pictures, hung from the concourse floor (the rooms
  now say where their horizon is; it used to be found at the undercroft, so
  every band sat under the floor): the vaulted hall as a 576-tall tile that
  repeats exactly at the roof — dado, arcade of round-headed windows with
  light coming through, piers throwing shadows east, string courses, a
  clerestory of niches that the undercroft sees as vents; the front facade
  with cornice and dentils, pilasters, arched windows lit from inside, rain
  darkening its foot; the ticket office in dark-green panelling with
  brass-grilled windows and gold TICKETS / ENQUIRIES; a near strip of
  trunks, a luggage trolley, a palm in a brass pot, a paper rack; the shed's
  iron columns with flared heads, lattice girders, rivets and rust; a low
  canopy girder with pendant lamps and enamel WAY OUT / TEA ROOM signs; the
  gate end in damp engineering brick with a barred vent's cold light.
- Landmarks painted: the great clock (brass bezel, cream face, a glass
  highlight) over a colonnade; the shed roof with its hanging PLATFORMS
  boards; the enamel CROSSROADS STATION sign with its row of bulbs (one or
  two dim); the NO PASSENGERS doorway with a chalk tally.
- Every prop repainted under its old key and size: benches, lanterns (lit
  and dark), postbox, the information desk, booths, phone box, fountain
  (wet and dry), carts, the flower cart, the kiosk, Ro's chair, the brass
  revolving doors, the café awning, dumbwaiters, cages, suitcases, levers,
  turnstile, counter, pigeon lofts, water tower, kite, pigeons, clock,
  grate, teapot; the trains as painted bodies (curved roof, lit windows,
  the emblem on the door, wheels and bogies, a contact shadow). The flat
  rectangles in the scene are gone too: brass columns and balustrade,
  the carved plinth, signposts and signboards, the platform signs, the
  gate's iron leaves, the tea kitchen, the signal frame, the slot corridor,
  the lost-and-found hatch, the per-platform props; glows are painted
  radial sprites and shadows are painted long shadows east.
- People: the same 16x24 rig as the Evening with the eight WALK_LEGS
  frames, a sit pose, a face with brows and a mouth; each cell is three
  tones (lit west, mid, hue-shifted shade east, darker under) and the
  outline is selective (cut on the shadow side, half on the lit side). Each
  NPC has a warm rim light from the west and a long shadow that follows
  them; so does Jo. The sweeper walks the eight frames by distance.
  Travellers are painted soft silhouettes with suitcases (smeared, fading
  toward the feet) that also walk the eight frames.
Follow-up (the street): "these regions seem vacant and the building feels
like flying" — the area left of the stairs was a void and the facade hung
from the platform. Now the steps room's horizon is the street; the facade
is the far layer, two screens tall with the sky left clear above its
roofline, its rusticated base standing on the pavement in the terrace's
shadow; a painted street band at ground level (pavement flags and kerb,
puddles catching the lamps, iron lamp posts, bollards, bins, a parked cab
with its light on, a poster board) fills the stretch under and left of the
stairs; the station sign hangs over the doors; CROSSROADS is incised into
the plinth (shadow above-left, lit lip below-right).
Learned: a wall band is tiled from its TOP edge by Phaser, so the horizon
lands at tile-y (4 x 540) mod height — the vault (576) and facade (1080)
paintings are laid down shifted onto that, not guessed.
Rule kept: the palette is the station's (cream stone, brass, dark green,
lamplight); only how the colour is laid down changed.
