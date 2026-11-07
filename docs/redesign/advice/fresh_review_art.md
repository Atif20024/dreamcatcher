# Fresh review: art and characters

Lens: how it looks, above all the characters. Reviewed from pixels (public/atlas/jo.png, sheets/jo-*.png, sheets/gait-*.png, sheets/cast-lineup.png, screenshots) and src/art/rig, src/data/rigs, src/art/AnimationController. Did not read advice/ or round2/.

## Major revamp? NO.

The pipeline is sound: rig, IK, atlas bake, foot-anchored pivots, ground-locked strides. The weakness is that it is used at its *minimum*. One skeleton, one set of body-part grids, near-identical proportions, 1-px limbs. That is a content/part-library problem, not an engine problem. A replacement pipeline (hand-drawn frames, imported art) would cost far more than it earns and would lose the foot-lock. Do targeted rig upgrades (below). The ceiling of the string-art rig is "very good small-sprite adventure game" (Flashback / Another World / Prince of Persia family), not "painterly rotoscope"; reaching that ceiling needs part variety, not new tech.

Does the rig limit quality? Three real limits, all fixable inside it:
1. Limbs are generated capsules (human.js capsule, thighR 2.15, armR 1.7). Cannot carry costume detail (cuffs, sleeves vs. bare forearm, trouser break, knee patches). Fix: let a rig supply per-segment tint bands (cuff row, sleeve end), see FIX 4.
2. Heads are one 8x8 (Jo) or 9x9 (cast) grid shared by everyone, stamped as a whole; faces differ only by hair/hat letters. Fix: head variants per character (FIX 2).
3. One torso grid per body class (m/f/big/elderly/teen/child). Costume identity is colour only. Fix: per-look torso/over layers (FIX 3).

## What a player notices most (ranked)

1. Everyone is the same person in a different colour. cast-lineup.png: every adult walks, stands and gestures with the same silhouette (same torso grid TORSO_ADULT, same 16-px legs, same hands, same head grid). Only hat and colour change. Era/dream identity (1884 river, Renaissance workshop, 1920s jazz, Five-Star kitchen) lives in hat shape and tint only.
2. Jo himself is low-contrast and under-characterised in motion. See Jo section.
3. Dark-on-dark foes. gait-foe-bouncer.png: black coat, black trousers, black boots, skin the only light. At night scenes (casino_r2_quay.jpg, musician-alley-neon.jpg) the bouncer, gendarme, guard read as holes. The outline `k` (0x1a1828) is as dark as the fill; no rim light.
4. Idle is nearly static. sheets/jo-idle.png: 8 frames, difference is ~1 px chest. At rest the world's hero looks pasted. NPC "task loops" exist (taskLoop in gaits.js) but most NPCs in screenshots stand statue-still (quay: Lou, the woman in claret, the man at right).
5. Poses beyond walk/run are stiff or ambiguous: climb (sheets/jo-climb.png) is a side-view hop with both fists up, looks like a jump not a ladder; sit (jo-overview row 5) legs are two boxes; jump/fall poses are a bundle of straight limbs.

## Jo (src/data/rigs/jo.js, jo.poses.js, human.js)

Good: the portrait (jo.portrait.js; sheets/jo-portraits.png) is the best face in the game: glasses, porkpie with red band, cheek shade. Walk (jo-walk.png) reads clearly: heel strike, passing, bob. Hat lags a frame. Shading has a hue shift.

Problems, each with a fix:
- **Colour value too close to backgrounds.** Jacket J/j (0x3d5a86/0x2b3d6a), trousers P/p (0x4a4560/0x332f4a) and hat H/h (0x2c2c4a/0x1e1e36) are all low-value blue-purples. In casino_r2_quay.jpg and musician-alley-neon.jpg only the jacket highlights separate him. Fix: raise the jacket base/hi one step (J toward 0x4d72a8, I toward 0x86aad6), keep trousers dark but add a 1-px light rim (`Q`) on the leading edge of both legs in run/jog frames (skill 1b "rim light", currently only the near arm/leg highlight). Optionally a pale scarf or a warm shirt collar W accent that is bigger than 1 px: Jo's one warm note (the red hat band) is 1 row high and vanishes.
- **Face in the world is a dark smudge.** Head grid `base` (jo.js lines 78-87): two rows `GGLlG`/`GGGGG` of near-black glasses, nothing else. The portrait is lovely; the 2x sprite has no eye, no brow, no nose shadow. Fix: shrink the frame to a 1-px lens line with a visible 1-px skin gap and put a `l` glint pixel on the lens; add a 1-px brow `a` over the lens and a nose pixel `S` that protrudes. Keep the glasses (they are his identity) but make them lighter (lens `L`, frame a dark-warm `k`) so they do not merge with the hat shadow.
- **Hat covers the head; head is hard to read.** Hat is 4 rows high on an 8-row head; at 2x it is 8 px of black over the face. The hat shadow line `h` row sits on the eye row. Fix: hat brim rows one px up on idle, or make hat band `y` 2 rows high for a stronger colour accent.
- **Torso is a flat slab.** TORSO_BASE (jo.js 49-61): 11 rows of identical `IJJJJJWw`. No lapel, no pocket, no tie/shirt contrast beyond the 1-px W column, no jacket hem swing. Fix: add lapel notch row 2 (`IJJWWWWj`), pocket flap row 8 (`jJJwwJjj`), and a hem that swings 1 px in walk/run (use a second torso variant selected on contact frames). A tie line in `y` is a cheap second accent.
- **Walk hips/arms are timid.** Arms swing amplitude 20 deg (plain gait); Jo walk has hips [0,-1,0,1] only. Real walk weight needs 2 px vertical on the down frame at this height. Raise `lift` and hips to [0,-2,0,1] for Jo's own walk only. Add a shoulder counter-rotation (torso 'base' to 'hunch' alternation on contact frames).
- **Run (jo-run.png) is good** (airborne frames, lean, fists) but the back leg's 'point' boot is a 2-px stub; extend the toe row. Head stays level: add 1-px headDy dip on the landing frame.
- **Idle**: add a second, slower layer: weight shift (hx 1 on frames 3-6, other foot toe-out), hat hand-adjust fidget every ~6 s is already present (idle_fidget) but needs a rarer, bigger tell (look back at camera, check pocket watch). Breathing at chest 1 px every 16 frames is invisible at 2x; make it 2 frames of chest 1 + head 1.
- **Climb**: add a front-facing or three-quarter climb strip (hands alternate high/low, feet alternate), not side view with both arms up. In human.js the skeleton is side-only, so author this as a `torso:'front'` variant (symmetric torso grid + two legs side by side). This is one new part, not a pipeline change.
- **Sit/sit_ground**: legs are two stiff segments. Give the shin a 90 deg bend with the boot flat on the seat/ground; hands on knees. Pose table only (jo.poses.js).
- **Jump/fall**: rise has legs tucked but arms are straight sticks; add elbows bent 40 deg and the hat lifting 1 px (hat {dx,dy}) on rise, hat dragging down on fall. Skill table calls for jump_anticipate (present, 4 frames), apex, land with squash; landing squash is only ~2 frames of lower hips, add a 1-frame horizontal squash (stretch the torso grid 1 px wider via a variant).

## Cast (src/art/rig/cast.js, gaits.js, public/atlas/people*.png, foes.png)

General fault: shape sameness. BODIES.m torso grid = Jo's. Look differences = hat, hair letter, colour, a held prop.

By character (names from the lineup/gait sheets):
- **Bouncer / security** (foe-bouncer, foe-lounge-bouncer, gait-foe-bouncer.png): body class `big` exists but TORSO_BIG is only 2 columns wider; at 2x the bouncer is the same shape as Jo with a black coat. Needs: shoulders 4 columns wider than hips, no neck (head sunk), hands as fists hanging forward, a lighter shirt collar or tie so the black coat has a landmark, earpiece wire in `i`, and the 12-frame heavy gait amplified (sway 1.4 to 2.2, arms hang off the body 3 px). Fix in BODIES.big (cast.js 95) and TORSO_BIG (54-67); add a `wide` torso variant for his alert/grab pose.
- **Guard / gendarme / security** (gait-foe-guard.png): green sweater and cap, no uniform identity (no badge, belt, holster, boots differ not). Fix: add a belt-and-badge overlay `over` layer (the rig already supports `P.over`), shoulder epaulette pixel, tall boots (black leg to the knee) so a uniform reads at 2x. The gendarme should wear a kepi (exists) with a white cross-belt diagonal on the torso.
- **Landlady / manager / collector** (hurried gait): the hurried lean of 2 px and big arm swing already tells; but all three have the same torso as every adult. Landlady needs a skirt (SKIRT exists) or apron with a bunch of keys; collector a ledger under the arm as a hand prop; manager a clipboard that flaps.
- **Sous-chef** (busy gait): white coat reads; add the toque (exists) with a bigger height (toque 5 rows), a towel over the shoulder in `W` and an apron stain; arms-up pose is correct for the tell.
- **Scalper / runner** (skulk): hunch torso + lean 3 reads as "skulking"; but colour is tan on tan. Needs a signature colour block (a red or orange scarf/cap) so a lookout can tell him from civilians. X-red reserved for alert glint, so use `y` orange.
- **Roadie / dock hand** (carry): lean back with load: the load prop (case, crate) must be a part drawn above the shoulder in the carry frames, otherwise he is a man walking oddly. Check tool-horn-case in cast atlas; only used as a held item.
- **Kids**: child body 9/16 scale with a 'big head' 9x9 head grid: head is ~35% of height, fine, but the skeleton is the adult one shrunk (thigh 5, shin 4, upper 4). Needs a bouncier idle (hips +-2 present) and bigger hands.
- **Women / elderly**: f/elderly bodies differ by 1 column and hair letter; the skirt hides the legs; elderly stoop (TORSO_HUNCH) is the only real silhouette difference. Add a cane part (prop in hand, 3 px) and a shawl layer.
- **Wren** (public/atlas/wren.png, src/data/rigs/wren.js): separate rig, good colour, only 4 animations; extend with walk before she is seen moving.
- **Animals** (ev-cat*, ev-dog, ev-heron, ev-pigeon in cast.json): 2-frame walks. Acceptable; cats have sit/sleep/up which is lively. Dog has only lie/sit/walk0/1.

Faces: cast heads are 9x9 with a 2x2 eye (white+pupil), brow, mouth, nose. They read at 2x but all share the same nose/jaw. Add 3-4 jaw/nose variants (long jaw, snub nose, heavy brow) and a chin-beard variant per era character (headSet already has beard options but is rarely used). The portraits (src/data/ portraits, atlas portrait-*) are much stronger than the world sprites; keep them as the identity carrier, but make the world heads echo their most distinctive feature (the portrait's hair/glasses/moustache must appear on the sprite).

Foes' tells: the alert glint (X pixel on the eye) is 1 px and the grab windup is arms-reach (gait-foe-guard.png row 4 shows it: good). Add a 2-frame whole-body "notice" with a 2-px head jerk plus a "!" mark; and for dark foes make the eye glint 2x2 with a faint 3x3 red glow, otherwise it disappears.

## Hue-shifted shadows and outline

tones() in cast.js mixes toward COOL 0x262046 at 0.28: correct. Jo's palette ramp I/J/j/q is hue-shifted. Good. Fail: skin shade `s`/`t` (0x6e4234, 0x4a2c30) are warm-dark and fine; but `deep` tones on dark clothing (lum<0.18) are nearly the outline colour, so the internal cloth shading collapses into the outline. Fix: in tones(), for dark materials raise the base lift (LIGHT mix 0.24 -> 0.4) and lift `hi` so there is a visible 3-step ramp; set outline per character to a *darker* version of the base rather than one global `k`.

Selective outline: outline(body,'k') is a full 1-px contour including on the lit side (see Jo on bright backgrounds in hub screenshots: hard black edge). A coloured outline (dark version of the adjacent material) on lit edges would soften. The skill says selective; the code is all-around. Tried and rejected once (feedback3-jo-outline-rejected.jpg exists); try the per-material approach rather than white/other outlines.

## Animation controller and gaits

- Ground-locked stride and 8/12/16-frame cycles are exactly right. Foot-slide scenarios exist. No change.
- Frame counts: Jo walk 16 (8x2 mirrored) = fine; idle 16 but near-identical. Cast: walk 8-12, run 8, idle 8: fine.
- What is missing is **secondary motion**: no coat tail, no hat bounce on run besides one-frame lag, no loose-arm follow-through, no breathing at 2x scale. Add a `trail` layer: 1-2 px jacket hem offset frames (alt torso variants on 2 of 8 frames).
- Anticipation/landing: present as frames, but check in-engine that `jump_anticipate` plays (60 ms) and that `land` has a visible squash.

## Environment art and palette cohesion

Strong. Quay (casino_r2_quay.jpg), roofs (wp4-evening-roofs.jpg) and the chef street (feedback3-light-chef.jpg) have real depth, atmospheric perspective, warm window light, rain. Each dream owns a palette (violet-night, terracotta, warm brown, rust-brick) and still sits inside the same grain/vignette finish. Issues:
- Characters sit *on top of* backgrounds without a shared light model. In the roofs screenshot Jo and the NPCs are lit as in a flat shade, no warm rim from the setting sun; on the quay the street-lamp does not tint the figures. Add a per-scene character tint/rim (a pixel-shader or a pre-baked 'lit' atlas variant, tint multiply on a copy of the frame) so people take the scene's key light. Cheapest: Phaser sprite `setTint` with a warm top and cool bottom gradient (tintTopLeft/BottomLeft).
- Foreground/background character value contrast: Jo's blue vs. dusk-blue buildings (quay) is a near-match. Combine with the Jo contrast fix above and consider a 1-px light rim pass on the hero only.
- Chef/painter indoor scenes (painter-bottega-grind.jpg): Jo reads well against warm walls (blue vs. orange complement). That contrast is the model for the rest.
- The painter shot was captured at 800x600 with big letterbox; fine.

## HUD / UI

Consistent with dreamcatcher-ui-type: brass-framed panels, small caps font, hearts top-left, objective top-centre, bar top-right. Issues:
- Objective panel is two lines of all-caps small text in a wide 380 px box; it dominates the top of the screen on the quay shot and wraps awkwardly ("THE MAN IN THE CLARET COAT BY THE / GANGWAY IS LOU: TALK TO HIM"). Shorten to <=24 chars per the HUD rule (a short verb: "TALK TO LOU") and put the identifying detail in the world.
- Bottom hint row ("[ESC] PAUSE [M] on") overlaps dialogue box in quay shot (the dialogue panel and hint share the bottom edge at right). Move the hint up or hide it while dialogue is open.
- Text sizes: small-caps HUD at ~14 px cap on screen is at the floor; objective text in the painter shot is clipped ("WASH IT IN THE BOWL..." cropped under the dialogue box) and the slab-bar label "THE SLAB 3/4" is cropped by the right edge of the room. Check the HudGrid.
- Icon set and bars are cohesive; HALF DIMES row with coin icon is nice. Debt bar tick marks (red, white) are tiny; add labels or colour fill.
- Dialogue portrait (Jo) is crisp, nicely framed; the speaker's portrait is vastly more expressive than the in-world sprite. Use that as the target.

## FIX list (ordered)

1. **Hero contrast and face** (jo.js PALETTE I/J/j, head.base rows 2-4, FAMILIES; human.js outline pass): brighter jacket ramp, lens glint + brow + nose, rim light on leading limbs in run/jog. Rule: skill 1b (rim light, face 2-px eyes + brow + nose shadow), game-assets "gameplay read over real backgrounds".
2. **Distinct silhouettes per cast member** (cast.js BODIES/TORSO_*, HAIR, HATS, per-look overlays): per-character head variant (jaw/nose), a signature prop in every look, and widen `big`. Rule: skill "foes read at a glance: distinct silhouette, signature colour block".
3. **Costume layer** (`P.over` already stamped in human.js line 79): use it for aprons, badges, cross-belts, coat tails, capes, bustles, so era identity is shape not tint. Rule: create-game-assets "shape language and silhouette priorities".
4. **Per-segment tints** for limbs (sleeve cuff row, bare forearm, trouser break, sock band) in human.js capsule(): add optional `cuff` row in the rig's FAMILIES.
5. **Dark-on-dark foe ramp** (cast.js tones(): raise LIGHT mix on lum<0.18, add rim row on leading edge): bouncer, guard, gendarme, roadie.
6. **Idle life**: weight shift + breathing at 2 px + gaze changes; give every NPC a taskLoop at rest (sweep, wipe, tune) instead of a standing frame. Rule: skill 6 NPC task loop.
7. **Climb, sit, jump poses** in jo.poses.js (front-facing climb torso; sit with bent shins; elbows and hat on rise/fall).
8. **Secondary motion**: 2-px coat hem/tail alternates, hat bounce on run, cuff/cloth follow-through.
9. **Scene-lit characters**: a tint gradient or lit atlas per dream so characters take the key light and a rim in the scene colour.
10. **HUD**: objective text shortening, bottom hint vs dialogue overlap, cropped labels in the painter scene.

## NICE

- 3/4 turn frames for NPCs facing the player when they speak (a front torso + front head, symmetric, 6 parts).
- Era-specific walks: a stiff 1884 gait, a swaggering 1920s jazz gait (arms swing 28 deg), a gliding Renaissance robe (skirt layer plus step 2).
- Dust and footstep decals by surface (cobble, wood, tile) using the existing contacts data.
- A drop shadow ellipse under every character (1-px dark ellipse, 40% alpha) to anchor feet into the scene.
- Cloth sim: a 3-frame flap for scarves and aprons during run.
- A "wet" tint pass for the rain scenes (darker, specular rim).

## Verdict on the string-art rig

It can reach a good result. What limits quality is not the rig but the part library and how little each character varies from the base. Spend the effort on: (a) a part catalogue (per-character heads, torsos, overlays, props), (b) lighting/contrast treatment, (c) idle and secondary motion. No pipeline replacement and no from-scratch redraw is required.

Caveats: not verified in motion in a browser (read-only; no servers). Judged from still sheets and screenshots only.
