# Characters report

Spec: `docs/redesign/advice/fresh_review_art.md`, character fixes in its order. No rig or pipeline change was needed. Each claim was checked against the sheets first; the ones they did not support are listed below.

## What changed

**Jo** (`src/data/rigs/jo.js`, `jo.poses.js`)
- Jacket ramp one step lighter, still his blue (J 0x4d72a8, I 0x8ab0dc). Trouser rim lighter.
- Face: the brim moved up a row, so a brow shows. Lit skin, lens with glint, a skin gap under it, a nose pixel that sticks out. Glasses frame warmer.
- Hat: two-row band (bright row over a shadow row). Crown row kept, so it stays a porkpie.
- Lapel, red tie, pocket, and a back hem that swings on `pose.trail`.
- Rim light on leading limbs in run and jog (`rimPass` in `compose.js`).
- Outline darker than the cast's (k 0x0c0a16). The contrast probe measures his outline, so this is what moved the painter's street.

**Cast** (new `src/art/rig/costumes.js`; `cast.js` edits are line-local)
- `big` is wider: 4 columns of shoulder over the hips, the head sunk into them, arms hung off the body, more sway.
- Costume layers on `P.over`: aprons, bibs, badges, epaulettes, cross-belts, chains, ties, cravats, waistcoats, towels, scarves, shawls, coat tails, bustles, keys, holsters, plus tall boots.
- 76 characters are named in the table. Everyone else gets a stable hash-picked face.
- Seven faces: snub, hook, long, heavy, round, thin, plain.
- Props: a cane (named characters, plus any unnamed elderly person with empty hands). Keys are drawn at the belt, as a layer.
- The sous-chef gets a taller toque.
- Legacy `pt-p-` and `gm-p-` people are untouched in costume (see Gaps).

**Dark foes** (`tones()`)
- Dark cloth now has a real ramp, every step above the outline.
- Dark-clothed people get an `all` rim.
- The alert eye is 2×2 red with a faint glow.
- The scalper wears an orange scarf and hat band.

**Idle**
- Jo's idle is 16 frames: two breaths, a weight shift to the back foot (hips move, feet stay; there is a test), two blinks.
- The fidget is 17 frames, up from 8: hat, look back, pocket watch.
- NPCs with empty hands get a weight shift in their free loop.

**Poses**
- Climb: square-on torso, seen from behind, alternating hands, elbows out, knees splayed.
- Sit: thighs level, shins square, hands on knees.
- `sit_ground`: knees up, one hand behind.
- Jump: bent elbows; the hat floats at the apex and lifts on the fall.

**Walk and run notes**
- Jo's walk hips are [0,-2,0,1] and his arms swing 26 degrees. Hem lag on walk and run.
- The `point` boot has a longer toe.
- Skirts also trail.

## Numbers

| | Before | After |
|---|---|---|
| Jo frames (unique) | 880 (391) | 948 (411) |
| Wren frames (shares Jo's idle) | 101 | 135 |
| Rigged cast frames | 6471 | 6471 |
| All atlas PNGs | 1,590,058 B | 1,642,977 B (+3.3%) |
| Pack count and sizes | 12 | 12, same dimensions |

`jo-contrast`, edge median (`[none]` = no lamp carried):

| Place | Before | After |
|---|---|---|
| Painter's via `[none]` | 2.72 | **3.06** |
| Gambler quay `[none]` | 2.41 | **2.79**, under 3:1 |
| Evening `[none]` | 2.35 | 2.55, probe looks wrong (below) |
| Hub | 3.52 | 4.03 |
| Chef | 3.38 | 3.97 |
| Musician | 5.86 | 6.51 |
| Astronaut | 3.80 | 4.27 |
| Writer | 3.46 | 3.89 |
| Clockmaker | 4.53 | 5.10 |

These `jo-contrast` numbers were taken before the last tweak (the sous-chef's toque only). Jo's art did not change after them.

## Verification

- vitest: 308 pass, including 4 new character tests.
- `lint:rooms`: 0 failures, 38 warnings.
- `lint:content`: 0 failures.
- `lint:scale`: clean.
- `vite build`: passes.
- Scenarios, all pass: `jo-walk`, `jo-skid`, `jo-turn`, `jo-jump-arc`, `jo-land-soft-hard`, `jo-foot-slide` (worst drift 0 px on run, walk and jog), `jo-contrast`, `hub-ladder-roof`.
- Strips at game size, on real captured backgrounds and flat dark and light, compared by eye. Saved to the job's scratchpad as `chars_<name>_{before,after}.png`.

## Review claims the sheets did not support, or that I changed

- **"Breathing is invisible":** `chest: 1` already moves the torso and head 2 screen px. Kept, and added the weight shift.
- **"NPCs stand still":** the framework `Npc` already plays the `-idle#` loop. The real problem was how small the loop was.
- **"Hat lifts on rise, drags on fall":** I did the reverse, because a hat lags its head. It lifts on the fall.
- **"Front-facing climb":** the torso is square-on as asked, but seen from behind. He faces the rungs; a face to camera would have his back to the ladder. Owner may want to look at this one.
- **Selective or coloured outlines:** left out. One was already rejected (`feedback3-jo-outline-rejected.jpg`).

## Gaps

- **Gambler quay stays at 2.79:1 by the probe.** Edge pixels are his outline, and the place's mean is dim, so even a near-black line tops out around 2.8 there. It needs a lamp or a scene change, not costume. By eye he reads clearly, and `local` is 2.99.
- **Evening's probe looks broken.** `local` is 1.03 even though he is plainly dark on a bright wall. The Evening is under another job, so I did not chase it.
- **Fidget frequency unchanged.** It runs on `AnimationController`'s clock (about every 10 s), outside my edit area. I made the fidget bigger, not rarer.
- **Not done:** `hunch` alternation on walk contacts (would pop on a 1-px grid), the 1-frame horizontal landing squash, per-segment cuffs, scene-lit tints, Wren's walk variety, animals, the "!" alert mark, kids' bigger hands.
- **Legacy `pt-p-` and `gm-p-` people still change a little** through shared code: the new `tones()`, the big body, the sit pose, skirt trail. They get no costumes. The cleanup job removes them anyway.
- **`foe-roadie`'s load** is not drawn above the shoulder. He keeps the coil.
- **The dark-room foe strip** is a flat dark colour, not a live room. The rim was not checked next to live foes in the musician's alley.
- **Sheets:** only `cast-lineup`, `jo-overview`, `jo-climb`, `jo-idle` and `gait-foe-bouncer` are committed, to keep the merge easy. `npm run atlas` rebuilds the rest.
