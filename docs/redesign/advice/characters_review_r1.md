# Characters review, round 1

Reviewers: senior game designer and pro gamer. Judged from stills only (before/after strips, lineup, sheets, in-game captures). I cannot see motion. Walk weight, idle weight shift, hem lag, hat lift on the fall and climb alternation are unverified. Skills pixel-art-sprites and dreamcatcher-character-motion were not loaded; I judged by eye against the fresh review and the builder's report.

## Verdict: CONVERGED. No MUST.

Jo is better in every still. The cast now reads as different people. Nothing is clearly worse than before except a few small cases listed below.

## What looks good
- **Jo.** The lighter jacket, the brim raised so a brow shows, the lens glint with a skin gap and a nose pixel, and the two-row hat band all read in chars_jo_zoom_after.png. He is still a porkpie and still blue. On the painter's street and the Evening he is clear. On the quay the lit jacket now separates from the dusk-blue buildings, where before he was a dark slot.
- **Walk and run** (sheets/jo-walk.png, jo-run.png). Heel strike and passing are clear. The red tie and the rim on the leading limbs help. The run has real airborne frames and lean.
- **Cast lineup.** Aprons, epaulettes, cross-belts, hats, the olive scarf, the red tie and the cane give distinct silhouettes in the bottom half of the lineup. In the dark foe strip, the bouncer, the officer (epaulettes), the gendarme (cross-belt) and the top-hat man are now separable by shape, not only by colour.
- **Sit** and the sit_ground pose are believable now.

## MUST
None.

## SHOULD
1. **Climb reads as a jumping jack.** `jo-climb.png` and the first six frames of chars_poses_after.png show both fists up, elbows out and knees splayed, from behind. Alone on a sheet it looks like cheering or a jump. In chars_climb_ingame_after.png the ladder behind him saves it, but at game size one leg kicks sideways and it still looks like a hop. Square-on from behind is fine and correct, because he faces the rungs. The problem is that the hands do not alternate clearly. Fix: in `src/data/rigs/jo.poses.js`, make each climb frame put one hand high and the other near the chest, with the opposite knee raised, so the rhythm reads as a hand-over-hand climb. Do not splay both knees.
2. **Alert eye glow on pale-skinned foes looks like blood or blush.** The top-hat foe's last frames in chars_foes_dark_after.png show red patches across a white face. Fix: in `tones()` or the alert-eye layer in `src/art/rig/cast.js`, keep the 2x2 red eye but drop the 3x3 glow on light skin tones, or lower its alpha to about one third.
3. **Hat on the fall.** Keep the builder's choice (the hat lifts on the fall, because a hat lags its head). That is physically right and my fresh review had the direction wrong. The apex frame in chars_jo_zoom_after.png shows a stray 1-px speck above the hat that reads as dirt, not a hat. Fix: either make the hat lift at least 2 px so it reads as clearly detached, or drop the lift to 0 for the apex frame.

## NICE
- Jo's outline (k 0x0c0a16) is heavier than the cast's, and on the light lineup strip he looks like a sticker next to them. Accept it because the contrast probe measures the outline. Only if it bothers the owner, lighten it on the lit side (this was rejected once before, so do not do it unasked).
- `jo-idle.png` shows 16 near-identical frames at sheet scale. The breath and weight shift are 1-2 px and are only worth judging in motion. Do not add more until someone has watched it.
- Roadie load above the shoulder (`foe-roadie`) still missing. Low priority.

## Rulings on the builder's open items
- **Jo at 2.79:1 on the gambler's quay: accept.** He reads clearly by eye (chars_jo_night_after.png), and the builder's own `local` figure is 2.99, about 3:1. The probe is measuring a near-black outline against a dim mean, so no costume change can lift it much. If the owner wants more separation, move or tint the lamp near the arrival spot. Do not repaint Jo. Fix: a scene change in the quay room data, not art.
- **Evening probe: it is a probe fault, not an art fault.** In chars_jo_evening_after.png Jo is dark and plainly legible against the pale wall, and `local` 1.03 cannot be right. Likely the sampling window lands on the dev label or the wall behind the arch. Fix: log the sampled rectangle for that room in the `jo-contrast` scenario and move it onto Jo's body. Do not change the art for it.
- **Hat lifting on the fall: keep as built** (see SHOULD 3 for the speck).
- **Fidget timer: leave it.** A 17-frame fidget every ~10 s is fine for a hero people will watch idle. If it feels fussy in play, lengthen the interval in `AnimationController` to about 14-18 s with some randomness. That is a one-line number change, not an art task. I cannot judge from stills.

## Confidence and gaps
Stills only. Unverified: every motion claim, the in-engine landing squash (not done by the builder), and the dark-foe rim next to live foes in the musician's alley (the builder says it was not checked).
