---
name: dreamcatcher-character-motion
description: How to build and animate every character in the Dreamcatcher game (Jo, NPCs, foes) so they read as real people with human gaits — walk/run cycles with proper leg mechanics, weight, anticipation, and no foot-sliding — using the project's string-art rig system compiled to PNG atlases at build time (Phaser 3, plain JS; see Part D §D11). Use this skill whenever you create or modify any character sprite, animation, walk/run cycle, jump/land/turn, ledge-grab, climb, carry, push, hurt/caught/death animation, foe patrol or chase movement, NPC idle behavior, or the Player/Foe/Npc state machines and physics tuning. Also use it when someone says "the character looks stiff", "legs don't move", "it slides", "make it feel like Prince of Persia / Contra", or "add a new enemy/NPC". Never draw a character as a single static grid — every character is a rig composed of parts.
---

# Dreamcatcher Character Motion

People in this game must look like they have weight, joints, and intent. The old cinematic platformers got that with rotoscoped frames; we get it with a **paper-doll rig** built from string-art parts, a fixed vocabulary of key poses, and one hard rule: **feet never slide.** Read `references/walk-run-tables.md` for the per-frame pose tables and `references/pose-examples.md` for drawn reference poses before authoring any cycle.

## 1. The rig (how every character is built)
A character is not one grid. It is `src/data/rigs/<name>.js`:
```js
export default {
  size: [20, 40],          // 1× chars; rendered at 2× → 40×80 px, 2.5 tiles tall (16-bit action-game scale)
  origin: [10, 39],         // feet anchor (bottom-center); Phaser origin (0.5, 1)
  palette: { H: hat, s: skin, e: eye, J: 'jo-blue', p: pants, b: boots, X: 'hazard-red' /* foes only */ },
  parts: {
    head:   { base: [...grid], variants: { look_down, look_up, wince } },
    torso:  { base, variants: { lean_fwd, lean_back, crouch } },
    arm_b:  { base, variants: { swing_fwd, swing_back, bent_fwd, bent_back, up, reach } },  // back arm (drawn first)
    arm_f:  { ...same },                                                                    // front arm (drawn last)
    leg_b:  { base, variants: { fwd_straight, fwd_bent, back_straight, back_bent, pass, crouch } },
    leg_f:  { ...same },
    extras: { hat, tool, case, cloth }                                                       // secondary-motion layers
  },
  frames: { walk: [ { leg_f:'fwd_straight', leg_b:'back_bent', arm_f:'swing_back', arm_b:'swing_fwd', torso:'base', head:'base', dy:0, dx:0 }, ... ] }
}
```
`Rig.compose(rig, frameSpec)` stacks parts in draw order (arm_b → leg_b → torso → leg_f → head → arm_f → extras) at each part's anchor + offset into one string grid, and `scripts/build-atlas.js` rasterizes every frame into the character's PNG atlas + JSON at build time (Part D §D11); the runtime loads the atlas, never the grids. Imported PNG sheets are allowed if they pass the same proportion, shading, and telegraph reviews — declare them in `art-src/imported/<pack>/manifest.json`. Facing is `scaleX = -1`; art is authored facing right.

**Proportions (1× chars, humans, 20×40):** hat/hair 5, face 6, neck 1, torso 11 (shoulders 12 wide, waist 8), belt 1, legs 16 (thigh 7, shin 7, foot 2, boot sole 1). Big characters (bouncer, roadie) are 24×44 with torso +4 wide; kids are 14×28 with head 9 (big head, short legs). **Legs are always ≥ 40% of height** — that is what makes gaits readable. Standard rooms need **3 tiles of headroom**; the room lint enforces it. See `references/pose-examples.md` for a shaded 20×40 Jo to calibrate against.

## 1b. Detail & shading (characters must look like 16-bit action-game sprites, not icons)
Every part is drawn with these rules, and the sheet review rejects anything flatter:
- **Three tones per material + one highlight.** Skin, cloth, leather, metal each get base / shadow / highlight letters, and the shadow is **hue-shifted** (cooler and darker), never just a darker copy. Palette per character ≤ 16 letters including outline.
- **Selective outline.** A 1-px near-black (`k`, not pure black) contour on the silhouette and wherever two same-value materials meet; **no** outline inside a lit surface. Light comes from the top-left; the right/bottom edge of every limb is in shadow tone.
- **Anatomy you can read:** shoulders wider than hips, a visible neck, elbows and knees as 1-px direction changes, a belt line, calves wider than ankles, boots with a sole, hands as 3×3 blobs with a 1-px thumb, a face with 2-px eyes (1 px white + 1 px dark), a brow, a nose shadow, a mouth line. Hats have a band; shirts have a collar and one fold line at the waist; trousers have a crease down the front leg.
- **Rim light** on the leading edge of the front limbs when moving (1 px of highlight tone) — it sells speed.
- **Props are part of the character:** Jo's trumpet has bell / valves / mouthpiece in 3 tones; the case has a handle and clasps; a bouncer's earpiece, a cop's badge, a landlord's clipboard are drawn, and they animate (badge glints, clipboard pages flap).
- **Per-frame detail survives.** Folds, highlights, and the face are redrawn in every frame; if a variant loses the belt or the face, it is not done.
- **Foes read at a glance:** distinct silhouette (helmet/hat shape, body mass), a signature color block (never Jo's `J` blue), and the `X`-red eye glint on alert; groups of the same foe share a palette but vary one accessory letter so a line of three never looks cloned.

## 2. Ground speed lock (the no-slide rule)
For any cycle with N frames and stride S (px a planted foot travels backward relative to the hips per half-cycle):
```
animation fps = moveSpeed × N / (2 × S)       // all at 1× px
```
Set the fps **every frame** from the body's actual `velocity.x`, not from a constant. Below 8 fps blend to idle. Standard values: walk S=10, N=8; run S=16, N=8; sneak S=6, N=8; big-guy walk S=12, N=12. If a foot's contact pixel moves relative to the ground in the rendered sheet, the cycle is wrong — fix the art, not the fps.

## 3. The four key poses (every walk and run is built from these, mirrored)
1. **Contact** — legs widest, front heel down, back toe down; hips at 0; arms at maximum opposite swing.
2. **Recoil (down)** — front knee bends taking weight; hips **−1** (lower); back foot lifts.
3. **Passing** — legs together, back leg swings through bent; hips at 0; arms crossing.
4. **High (up)** — supporting leg straight, hips **+1** (higher); free leg extended forward, heel about to strike.
Then 5–8 repeat with legs swapped. Head follows hips **one frame late** (store last hip dy). Runs use the same four but with **two airborne frames** (both feet off, hips +2) replacing the passing frames, torso `lean_fwd`, arms bent and pumping.

## 4. Pose vocabulary (frames per animation; hold = frames shown at 12 fps unless velocity-driven)
| Anim | Frames | Notes |
|---|---|---|
| idle | 8 + 2 fidgets | chest rises 1 px on frames 3–6; fidget every 4–7 s (adjust hat, look back, shift weight) |
| walk / run / sneak | 8 | velocity-driven fps (§2); footstep events on frames 0 and 4 |
| run_start | 3 | torso lean_fwd, back leg pushes; plays while accelerating below 60% speed |
| run_stop (skid) | 4 | legs wide, torso lean_back, dust; plays when input releases above 60% speed |
| turn | 3 | weight shifts to back foot, torso rotates via `lean_back → base → lean_fwd`; feet cross; scaleX flips on frame 2 |
| jump_anticipate | 2 | crouch 2 px, arms back — **always** before leaving ground (60 ms) |
| jump_rise / apex / fall | 3 / 2 / 3 | legs tuck on rise, extend on fall; arms up on apex; head look_down on fall |
| land / hard_land | 4 / 6 | squash (scale 1.2/0.8 then recover); hard: knees to crouch, hands touch ground, hat tips |
| careful_step | 8 | slow walk S=4, arms slightly out, head look_down; stops at ledge with toes over edge |
| ledge_grab / hang / pull_up / hang_drop | 3 / 4 / 6 / 3 | grab: both arms `reach` above head; hang sways ±1 px; pull-up is a 3-stage push (elbows, knee up, stand) |
| wall_slide | 2 | back to wall, arm_f reach against wall, legs bent |
| crouch / slide | 3 / 5 | slide: full lean_back, one leg forward, dust trail |
| climb (ladder) | 8 | alternating hands and feet; hips sway ±1 |
| push | 6 | lean_fwd 3 px, legs digging, arms `reach` forward; moves only on frames 2 and 5 (grunt cadence) |
| carry_idle / carry_run | 4 / 8 | both arms `up` holding item; run leans less; item bobs opposite to hips |
| interact | 6 | reach, pull, recover |
| play (instrument) | 6 | tool to mouth, cheeks `wince` variant, torso lean_back 1 px |
| shove (tool swing) | 6 | anticipation 2 (tool back), hit 1, recovery 3 |
| hurt | 4 | knockback, hat flies (separate tween), head wince |
| caught | 8 + cinematic | foe's grab connects: arms flail 2, lifted 3, thrown 3 → screen wipe |
| death (fall / trap / drown) | 8 each | crumple / recoil / sink; then grid explodes into dream-dust particles |
| celebrate | 8 | one hop, tool raised, hat off and back on |

## 5. Physics & state machine (`src/entities/Player.js`)
States: `idle, walk, run, sneak, turn, jump, fall, land, ledge, hang, pull_up, wall_slide, crouch, slide, climb, push, carry, interact, play, shove, hurt, caught, dead`. Transitions come from input + `body.blocked` + tile lookups, never from animation completion alone.
- Run 140 px/s (1×), accel 900, air control 70%, jump impulse 300, coyote 100 ms, buffer 120 ms, variable height, fast-fall. Walk (Shift) 60. Sneak 40 (Down+move near foes).
- Standing jump clears 2 tiles; running jump (≥ 3 tiles of run-up) clears 4. Distances in levels are always 2, 3, or 4 — tune impulse/gravity until this is exact, then never touch it.
- Ledge grab: when falling past a tile whose top edge is within 4 px of the hands and the tile above is empty → snap to `hang`. Down+Space = deliberate grab-and-drop.
- Fall tiers by drop height (≤3 free, 4–6 hard_land, ≥7 death) measured from the last grounded y.
- Feel: hit-stop 60 ms, dust on footsteps/land/turn/skid, squash-stretch tweens, 1-frame hat lag, tool swings on land.

## 6. Foes and NPCs move like people too
Same rig, same key poses, **one gait per character** — the gait is the character:
| Character | Gait | N | S | Signature |
|---|---|---|---|---|
| Bouncer | heavy sway, arms hang wide | 12 | 12 | rolls shoulders in idle |
| Cop | measured, hands behind back | 10 | 10 | taps foot while waiting |
| Landlord | hurried, torso lean_fwd, small steps | 8 | 7 | checks watch |
| Roadie (carrying) | lean_back, wide stance, slow | 12 | 8 | wipes brow |
| Scalper | crouched skulk, then sprint | 8 / 6 | 8 / 18 | looks over shoulder |
| Sous-chef | quick pivots, arms up | 8 | 9 | wipes hands on apron |
| Kid | bouncy, hips ±2 | 6 | 6 | skips every 4th step |
Foe behaviors are states with animations: `post (idle) → patrol (walk) → alert (3-frame notice: head snaps, eye pixel → X-red, 0.4 s) → approach (walk fast / run) → grab_windup (3 frames, 0.4 s, arms reach — the tell) → grab (2 frames) → thrown (if Jo caught) → search (lost sight: scratch head, look both ways, return to post)`. Contact never damages; only a connected `grab` does. Foes never walk slopes or drop off ledges (edge check), and they climb stairs faster than Jo.
NPCs: `idle (with fidgets) → face_jo (turn) → talk (head nods on punctuation, arm gestures on `*emphasis*`) → resume`. Every NPC has a **task loop** (wiping, tuning, sweeping) as its idle so the world looks employed.

## 7. Authoring workflow (do this every time)
1. Write or extend the rig file: parts first, each variant a small grid with an anchor comment.
2. Fill `frames.<anim>` from the tables in `references/walk-run-tables.md`; do not freehand a cycle.
3. Run `node scripts/sheet.js <rig> <anim>` — it composes every frame and writes `sheets/<rig>-<anim>.png` as a strip plus an onion-skin image. **Look at it.** Check: feet contact pixels line up frame to frame; hips bob −1/0/+1; arms opposite legs; silhouette readable at 2×.
4. Wire the state machine transition and the footstep/hit events.
5. Play it against a tiled floor at three speeds; if the feet slip, adjust S in the rig, not fps.

## 8. Checklist before committing a character
- Built from parts via `Rig.compose`; no monolithic frames except death-dust source.
- Walk and run use the 4 key poses, hips bob, head lags, arms oppose legs.
- fps is velocity-driven; no foot sliding on the sheet.
- Every attack/grab has a 0.4 s readable windup; every foe has a signature idle; every NPC has a task loop.
- Jump has anticipation frames; landing has squash; turn has a weight shift.
- Reserved palette letters respected (`J` only on friendlies, `X` only on foes/hazards).
- Sheet PNG reviewed and committed under `sheets/`.
