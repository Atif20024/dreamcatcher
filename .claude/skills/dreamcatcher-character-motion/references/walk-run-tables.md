# Walk / run frame tables (1× px; "hips" = vertical offset of torso+head+arms; feet are described relative to hips x)

## Walk (N=8, S=10, velocity-driven fps = v×8/20 = v/2.5)
| F | Pose | leg_f | leg_b | arm_f | arm_b | hips dy | Notes |
|---|---|---|---|---|---|---|---|
| 0 | contact | fwd_straight, heel at +5 | back_straight, toe at −5 | swing_back | swing_fwd | 0 | footstep event |
| 1 | recoil | fwd_bent, foot at +4 | back_bent, toe lifting −4 | swing_back | swing_fwd | −1 | lowest point |
| 2 | passing | pass (under hips) | back_bent swinging, knee at 0 | crossing | crossing | 0 | |
| 3 | high | base straight, foot at −2 | fwd_bent reaching, heel at +3 | swing_fwd | swing_back | +1 | highest point |
| 4 | contact (mirror) | back_straight, toe −5 | fwd_straight, heel +5 | swing_fwd | swing_back | 0 | footstep event |
| 5 | recoil | back_bent lifting −4 | fwd_bent +4 | swing_fwd | swing_back | −1 | |
| 6 | passing | back_bent swinging | pass | crossing | crossing | 0 | |
| 7 | high | fwd_bent reaching +3 | base straight −2 | swing_back | swing_fwd | +1 | |
Planted foot moves −2.5 px per frame relative to hips (10 px over 4 frames) — this is the value the ground-speed lock enforces.

## Run (N=8, S=16, fps = v/4; torso lean_fwd, arms bent pumping)
| F | Pose | legs | hips dy | Notes |
|---|---|---|---|---|
| 0 | contact | front heel +7, back leg trailing high (bent, toe −6) | 0 | footstep, dust |
| 1 | drive | front leg bends and pushes (+3), back knee comes forward | −1 | |
| 2 | airborne | both feet off: front leg back (−4), back leg forward bent (+4) | +2 | |
| 3 | reach | forward leg extends, heel about to strike (+6) | +1 | |
| 4–7 | mirror of 0–3 | | | footstep on 4 |
Head lag 1 frame; hat lag 1 frame; tool/case bobs opposite hips.

## Sneak (N=8, S=6): walk poses with torso `crouch`, hips −2 throughout, arms `bent_fwd`, half-height steps.

## Big walk (N=12, S=12): insert one extra hold frame after each contact and each high (12 frames), hips dy sequence 0,0,−1,0,+1,+1 …, shoulders roll ±1 px opposite hips.

## Kid (N=6, S=6): contact, recoil, passing, contact', recoil', passing' — hips ±2, every 4th cycle replace passing with a 1-frame hop (hips +3).

## Turn (3 frames): F0 weight on back foot (legs contact pose, torso lean_back) · F1 feet crossed, torso base, head already facing new direction · F2 flip scaleX, torso lean_fwd, legs recoil pose of the new direction.

## Ledge sequence
- ledge_grab (3): F0 arms reach up, legs fall pose · F1 hands on ledge, body swings in 1 px · F2 hang pose.
- hang (4): sway dx −1,0,+1,0 with legs relaxed bent.
- pull_up (6): F0–1 elbows bend, head rises above ledge · F2–3 knee_up variant of leg_f onto ledge · F4–5 stand, torso lean_fwd then base.
- hang_drop (3): F0 let go (arms up) · F1 fall tuck · F2 land.
