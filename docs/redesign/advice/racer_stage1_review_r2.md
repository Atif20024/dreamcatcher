# Racer stage 1, second-round review (designer and pro gamer)

Read-only. I read the two round-1 reviews, `docs/redesign/round2/RACER_STAGE1_R2_REPORT.md`, `src/engines/race.js`, `src/scenes/RaceScene.js`, `src/dreams/racer/race/*`. Every number below is from the real `Race` class driven in Node by scripted drivers (scripts in the session scratchpad, not the repo). My drivers are bots with injected human error: the brake point is early by a margin plus Gaussian noise ("sd", in metres, so sd 3 is about 0.09 s at top speed), the dodge point is jittered, and the launch tap is on or off. They are not people. Where only a drive can tell, I say so.

## Verdict

The round-1 fixes held: lines, the slip model, the lamps, the sight strip and the hit-stop do what the report says, and I found no stuck state, no softlock and no input loss. **One round-1 problem has come back in a smaller form (M1):** braking is optional at two of the three bends. After that it has converged on the engine side. What is left is balance of one number, a few modal and copy rough edges, and the questions only a drive answers (the beat, the fade, the feel of the strip).

## MUST

### M1. The two straw bends can be driven without braking, for almost nothing (race.js:416-420; tracks.js:35-36)

A bot that never touches the brake at a straw bend and brakes properly for the wall bend:

| Plan (alone on the road) | clean | no brake at bend 1 | at bend 2 | at both |
|---|---|---|---|---|
| mid, mid, mid | 45.27 | +0.38 | +0.05 | **+0.61** |
| out, in, chg | 44.63 | +0.42 | +0.19 | **+0.66** |

For comparison, braking **8 m too early** at all three bends costs +1.0 s and 4 m early costs +0.4 s. So skipping the brake at both straw bends is cheaper than a sloppy brake. With the rival on the road, 200 runs each, mid lane, sd 5, margin 8 m, launch tapped:

- Brake everywhere: P1 **74 %**.
- Skip the brake at the two straw bends: P1 **87 %**.
- Same without the launch tap: **36 % against 71 %**.

Why: the straw hit takes 40 % of the speed exactly where you were going to slow anyway, puts the car back at 2.45 lanes with the slide cleared, and costs only 0.03 grip (`t.wearBale`, race.js:419, shared with the bales). Only the wall bend forces a brake, so the design's central skill is enforced by one bend in three. The gamer's M1 from round 1 was the same class of problem.

**Fix (one number, one line):** give the straw its own tyre wear, `wearStraw`, and use it at race.js:419 (leave `wearBale` for the bales at :433). Measured on the same bots, with `baleLoss` unchanged:

| `wearStraw` | skip both straw bends, mix | skip both, mid |
|---|---|---|
| 0.03 now | +0.66 | +0.62 |
| 0.06 | +1.52 | +0.92 |
| 0.08 | +1.72 | +1.19 |
| 0.10 | **+1.96** | **+1.44** |
| 0.12 | +3.18 | +1.67 |

Take 0.10. Skipping then costs about the gate's slack (2 s), so a brake is worth taking. The grip meter appears the moment the tyres leave green, so the cost is also visible. Re-run `tests/race.test.js`: the "never brakes" and "within 0.8 s" pins may need a nudge. The straw is still a soft thing (no spin, no dark).

## SHOULD

### S1. "Again?" nags after "Drive on" and after "Restart from the lamp" (RaceScene.js:327-331, 336-338, 542-553; race.js:508)

`toLamp` emits `reset` even when `now` is true, so a deliberate "Restart from the lamp" runs `raceLost` and, if the race is out of reach, opens "He has the road now. Again?" on top of the player's own choice. Choosing "Drive on" does not stick: the next spin asks again, and the next. A player practising the wall bend in a lost race is asked every attempt.
Scenario: lose the race at the kink, Drive on, spin at the wall bend, prompt, Drive on, spin again, prompt.
Fix: `this.keepGoing = true` in the "Drive on" action, and skip `askAgain` in the `reset` case when it is set or when the reset came from `restartFromLamp` (pass `now` in the event: `emit('reset', {..., now})`). Reset the flag in `create`. Three lines.

### S2. The rival is off the screen on the grid (tracks.js:46; RaceScene.js:37-38, 250)

At rest the camera shows (960 - 360) / 44 = 13.6 m ahead. The Corsa starts at d = 20, and his rear bumper is at 18.1 m, about 200 px past the right edge. During the whole countdown and the first second or so of the launch there is no black Corsa on screen, only a white chevron in the sight strip (a car 18 m away is beyond the view). The brief's headline ("beat the black Corsa") has no picture at the start line, and the round-2 move from d = 9 to d = 20 caused it.
Fix options, cheapest first: (a) rival d 13 and recheck the launch margin (the draft test for a perfect launch, `racer-launch`), (b) hold the camera at zoom 0.9 and camX 300 during the countdown (14.8 m, still short), (c) a short camera pan to the Corsa and back on the second light. I prefer (c) with a stagger of the grid for story races. A drive decides; I have not seen it.

### S3. The "lifts" count on the card is noise and can be gamed (race.js:358-359; RaceScene.js:63)

`lifted` is every throttle release above 20 m/s, so braking for a bend counts, and so does feathering the gas in a bend. My clean bot logs **112 lifts** for a P1 run (it pulses the throttle at the limit); a person feathering through three bends will log dozens, and Ottavia says "I heard you lift 14 times", which reads as a rebuke for braking that the road forces. Holding the gas while braking logs **0**, so "you never lifted" is what a left-foot braker, or someone who skipped the straw bends (M1), gets.
Fix: count a lift only when the throttle is released **and the brake is not pressed** for at least 0.3 s above 25 m/s **outside the bend zones** (from `b.from - 120` to `b.to`). The "Don't lift." call on the first straight then means something. Failing that, drop the number from the card and keep the word.

### S4. The wall bend has no temptation; the lane trade is solved on the first bend (tracks.js:37; the round-2 table)

Brute force over all 64 line plans (120 runs each, scored as median time + 6 x spin rate + 1 x straw rate):

| Plan | sd 4, margin 4 m: time, spin, straw | sd 2, margin 2 m |
|---|---|---|
| out, in, in | **44.52, 0 %, 11 %** (best) | 44.22, 0 %, 8 % |
| out, in, chg | 44.52, 3 %, 16 % | 44.19, 0 %, 9 % |
| mid, in, in | 44.72, 0 %, 0 % | 44.45, 0 %, 0 % |
| mid, mid, mid | 45.09 | 44.83 |
| out, out, out | 45.10, 16 %, 16 % | 44.88, 15 %, 10 % |
| in, in, in | 45.23 | 44.94 |

At every skill level the answer is **outside at the sweeper, inside at the kink and the wall bend**. The line change at the wall bend, "inside in, outside out", wins by 0.02 s at perfect play and loses to plain inside once there is human error (3 % spin for nothing), so it is a decoy. The outside by the wall is slower **and** more dangerous than the inside, so the one place where risk could tempt is the place with no reward. The real choice is one bend: outside at the sweeper (+0.2 s over mid, 11 % chance of a straw, a straw costing about 1 s once M1 is fixed) against mid. That is a near-even bet, which is good, but it is one bet and it is learned in two races. Do not read "a different winner at each bend" as three choices.

**Fix:** set bend 3 `lineSpeed` to 3 (the wall bend only). With it, at sd 4 / margin 4:

| Line at the wall bend | time | spin |
|---|---|---|
| inside | 44.87 | 0 % |
| mid | 44.62 | 0 % |
| line change | 44.63 | 6 % |
| **outside** | **44.43** | **14 %** |

Now there is a ladder where each rung pays and the top rung is a wall. Re-bench `target` (44.5 moves to about 44.2) and the test pins ("each bend a different winner" will break at bend 3: the winner becomes the outside, which is the point). Try values from 2.5 to 3.5 before locking.

### S5. A faint grid of "how much does a mistake cost" is not on the card (RaceScene.js:61-74)

A player who loses by 0.4 s gets "He has the road and you have the next try." They cannot tell whether it was the launch (worth 0.4 s, and 30 percentage points of P1 for a mid-lane driver: 100 % with the tap, 64 % without, sd 3 / margin 4), a 5 % undershoot at a bend (about 0.2 s per percent, spread over three bends), a rub (about 0.3 s) or a straw. The report's rule of thumb for the owner is the table below. For the player, one extra card line ("Slowest into the kink: 9 km/h under. The green was missed.") turns the next try from guessing into learning. Needs the per-bend entry speed and the launch flag; both are in the engine already (`vIn`, `launchTried`). I rank it SHOULD because the gate is near-binary for a careful player (see the pacing section).

## NICE

- **N1. Hide "Restart from the lamp" during a spin** (RaceScene.js:542-545). Choosing it in a spin quietly closes the menu and acts as Resume. Show it greyed or leave it out while `state !== 'run'`.
- **N2. The lamp line is said four times** (RaceScene.js:309-314, RADIO.lamp). Say it at the first lamp only and let the chime carry the others. The 700 m lamp also sits 20 m before the kink (720), exactly on the braking point (chalk for the kink starts about 645 to 650), so the chime and the caption land on the foot. Moving it to 790 to 800 changes nothing in the race (see "failure unit") and puts the chime on the straight.
- **N3. Stale state after `toLamp(c, true)`** (race.js:488-509): `slingT`, `slingCool`, `armed`, `draft`, `steerT` survive. A sling fired just before the restart still pulls at 1.8 x for the rest of its 2 s from 12 m/s. Not an exploit (you lose far more than you gain), but clear them with the slip.
- **N4. Grip does not refill at a lamp.** A spin costs about 0.1 grip; the next attempt starts with limits about 2.5 % lower, and on this road that does not matter because the race is lost. In a longer race, "a lamp is a tyre stop" (grip +0.2) is a cheap lever for the failure unit.
- **N5. "Early. Next time." on a jump start and a miss with no tap say nothing** (race.js:196-200). A player who never learns the green (first-race teach is spoken once) is down 0.4 s forever and does not know it. S5 covers this.

## The questions

### Racing lines: a real choice or a near-tie?

A real but narrow choice, as detailed in S4. Uniform inside, outside and change finish within 0.34 s (44.87 to 45.21); that spread is smaller than human noise, so **no uniform line matters**. The 0.02 s margins at bends 2 and 3 are ties at perfect play and are pure risk for people.

Does risk separate them? Yes, and sharply, but it is a cliff, not a ramp. Brake lateness, uniform line, perfect lane timing, my drivers (the survival point is the largest lateness that did not strike straw or wall):

| Line | survives up to | in seconds at top speed | first failure |
|---|---|---|---|
| inside | 10 to 12 m late | 0.3 s | straw at the kink, wall spin at bend 3 |
| middle | 8 m late | 0.22 s | wall spin at bend 3 at 10 m |
| outside | **under 2 m** | **under 0.05 s** | straw at bends 1 and 2, spin at bend 3 |

The report's 40 / 25 / 5 % overspeed holds; in metres, the outside leaves about 3 frames at 60 Hz, which is below any human's repeatability. So **the outside cannot be played at zero margin by a person**; with a 4 m margin and sd 3 it spins 7 % and straws 9 %, and gains nothing over mid (45.05 against 44.99). It only pays where it fails soft, at the sweeper.

What a skilled player does: brake 3 to 5 m early, take the outside at the straw sweeper for the exit speed onto the straight, hold the inside through the kink and the wall bend, and weigh the sweeper outside against mid at 11 % straw for 0.2 s. That is interesting once, then solved. What would keep it interesting: S4 (a tempting wall line), different authored trades on later tracks, and rivals that drive the lines (see decisions).

### Braking: is there a dominant trick?

- **No-brake and lift-only:** none. Never braking, and lifting up to 260 m before every bend, both end in spins on every line.
- **Late brake / ride the slide:** on the inside and the middle, **carrying 2 to 12 % over the limit and braking inside the bend costs no more than 0.0 to 0.3 s** against perfect braking (inside 44.89 at 1.0 and at 1.12; middle 44.77 to 45.09), and it is faster than a cautious brake (+1.0 s at 0.95). The price is grip: it drains to 0.05 to 0.4. The slide is self-healing on these lines (the car slides outwards into a line with a higher limit), which is lovely design. Because the grip price is real (each 0.2 of grip is about 1.1 s later in the lap, see below) this is a fair gamble, not a dominant trick. On the outside, anything over 1.02 is a DNF.
- **The only dominant thing is M1.**

Grip is a heavy tax (start-of-lap grip against lap time, the mix line): 1.0 gives 44.63; 0.8 gives 45.71; 0.6 gives 46.90; 0.3 gives 49.00; 0 gives 50.14. Each 0.2 is about 1.1 s. A clean lap ends at about 0.8. It is a good lever and the meter is hidden until it matters, which is right.

`slipOver` / `slipSteer`, by the numbers, are fair:

- A driver who notices an overspeed within 0.4 s and brakes survives 15 % over in the middle at the sweeper and the kink, **20 % at the wall bend**, and 40 % on the inside lane at the wall bend (outcome tables, ok to straw at 30 %, spin at 30 % over mid at the wall).
- A lane press toward the inside during the slide (at half rate) saves the straw at up to 30 to 40 %, and saves the wall at 30 % over with 0.4 s reaction.
- 1 m/s over starts a drift of 0.56 lanes/s; 2.5 m/s over about 1.4 lanes/s. That is a visible, readable slide (a lean up to 5 degrees and dust), with about a second to act before the straw.
- The asymmetry to know: being 2 m late costs about 0.4 s over the lap (the hysteresis makes you drive well under the limit afterwards), while being 2 m early costs 0.08 s. The chalk leaves 0.2 s (7 m), which puts a person on the safe side of that asymmetry. Good.

### The rival and first place for someone who is not a bot

Rival alone: 46.47. Best mix: 44.47, so the slack is **2.0 s for perfect play**, about 1.2 to 1.5 s for a clean mid-lane driver (45.0 to 45.3). The costs, measured:

| Mistake | cost to the gate |
|---|---|
| 1 % of speed under the limit, at all bends | about 0.2 s |
| A straw hit (after M1, about 1 s) | 0.4 s now, about 1 s fixed |
| A rub | about 0.3 s |
| A missed launch | 0.4 s |
| A spin | about 2.3 s relative to the rival (see below), the race is lost |

So a person has the budget of one straw, or 6 % of total undershoot, or a missed launch plus a rub. Simulated P1 with the rival on the road, 200 runs: a driver who brakes 4 m early with sd 3 wins 98 to 100 %; sd 5 with 8 m early wins 74 to 88 %; a scared driver who brakes to 95 % of the notch wins 42 to 59 %; to 90 % wins about 1 %; sd 8 with a 12 m margin wins 21 to 28 %.

This is **sensibly tuned**: a confident-but-imperfect driver wins most races, a cautious one is a coin flip, a scared one cannot win, and after three tries the chalk (7 m early, 0 to 1.5 m/s under) puts the cautious band within reach. The spin-equals-lost is deliberate (below). What I cannot tell is how a first-time human fares against the first bend, and the two things I flag: the launch carries 30 points of P1 and is taught once (S5), and "scared" (90 %) never wins and gets no feedback (S5).

One structural note: after about 8 s Jo is ahead and the Corsa falls behind the screen's left edge (the camera shows 5.7 m behind Jo); from t = 20 s he is 16 to 44 m back, never seen. After the first pass the race is a time trial against a dot on the progress strip. That is a story-race question (decision 5), not a stage-1 defect.

### "On a road this short nearly every spin ends in Again?": is that right?

Yes, and it is right for a deeper reason than the report gives. The rival is rewound with Jo to the lamp (race.js:501-507), so **a spin costs a fixed amount relative to the rival whatever the lamp spacing**: the 2 s of spin are erased for both; Jo loses the 1 s of dark in which the rival runs, plus the roll-out at 12 m/s instead of about 29 (about 1.2 s): **about 2.3 s**, measured as place 2 by 0.5 s for a driver who had 2.0 s slack. The distance to the lamp costs the clock and the best time, but not the place. The slack of a race is `L x (1/(36 x top) - 1/36)`: 0.00164 s per metre at top 0.94, so 1200 m gives 2.0 s, about one spin. That is exactly why "Again?" appears every time. It is also why the unit scales for free: `raceLost` is arithmetic on what is left, so it will not ask on a longer road where there is slack.

For longer races: choose `top` and `length` so slack is **about 1.5 spins at clean pace** (a 3.5 km race at top 0.94 has 5.7 s, 2.4 spins; at top 0.96, 1200 m gives only 1.4 s and 3.5 km gives 4.1 s). Keep lamps at 500 to 700 m; spacing only moves the clock. Add the "Drive on is sticky" fix (S1). `rollCost` (3) and `catchSlack` (0.5) in `raceLost` are constants and ignore the bends; they are symmetric for both cars so it works, but pin a test per track that the prompt does not appear on a clean run at the tuned pace.

### The draft's beat: readable? Should the slot pay?

By the maths, readable: 0 Hz in the slot (about +/- 0.95 m, the middle fifth of the window), 4 Hz at the edge, up to 9 Hz at 3 half-widths off; 1 Hz is about 1.9 m off the centre. A rival one lane away at the right distance reads about 7.8 Hz, and two lanes away is silent (the lateral term is /0.4 lanes). The streaks duplicate it in pictures, still and cyan in the slot, which is the right redundancy. Offline, the signal carries it (depth 0.45 at 1, 4 and 9 Hz, 0.006 at 0 Hz).

Three honest limits, none fixable from here:
- **Whether it can be heard over road noise and the sub-oscillator is a drive.** The test I would run: eyes shut, streaks hidden, pass the rival ten times and press a key when the throb stops.
- The ear cannot tell "too close" from "too far" (a beat has no sign). The streak length and the gap on screen do that; do not promise the ear alone.
- **The slot is crossed, not held.** Jo is faster than the Corsa (36 against 33.8), so he closes at 2 to 4 m/s and spends 0.3 to 0.5 s in the slot and about 1 s under 2 Hz. To dwell in it he must lift to the Corsa's pace. With a perfect launch Jo is in the window 1.05 to 3.9 s (2.8 s) and **arms at 2.25 s without trying**, and stays armed for 2 s after leaving it. So the draft arms itself every race; the skill is the pull-out and the Space, not the slot.

What draft and sling actually pay: the draft is +6 % on top speed (+2 m/s, about +17 % pull at 28 m/s); the sling over its 2 s is worth **about 0.2 to 0.3 s** at 24 to 28 m/s and a little more at lower speeds. The launch is 0.4 s, the best line mix 0.5 s, 1 % of undershoot 0.2 s. Draft plus sling is worth about 1.5 % of braking. That is the right order for a flourish.

Should the slot give more? **Not now.** Information only is correct while the Corsa is slower than Jo, because dwelling in the slot costs more (lifting) than it gains. When the rival is as fast as Jo or faster, dwelling is the natural play and the slot should pay then. The cheap, continuous way, when it is needed, is to scale the draft by the slot: `draftSpeed` 6 % in the slot falling to 3 % at the edge, so the beat is the guide to hold. I would not add a faster bar fill (the bar already fills before you leave the window).

### Sight strip timing: fair?

The arithmetic holds: view at top speed (480 + 480/0.9 - 250)/44 = 17.35 m; pulse from 1.5 s of contact = 53.9 m; point of no return 11.7 m. The strip itself pulses for about **1.02 s** (53.9 to 17.3 m at 36 m/s); the "1.17 s" of the report is the whole span to the point of no return, including 0.16 s where only the road shows the thing. A visual reaction is about 0.25 s, the lane change needs 0.32 s, so the budget is 1.17 - 0.25 - 0.32 = 0.6 s spare from the first pulse. That is fair, and the chevron starts growing at 4.5 s of contact (162 m). The one thing the numbers cannot settle is **whether a pulsing 16 px chevron at x 664 is noticed while the eye is on the speedometer and the bend call**, and the first cart (540 m) comes 110 m after the first bend (3 s). Only a drive tells. The numbers say the geometry is safe; the attention is not measurable here.

### Did a fix open a new hole?

Checked, with results:

- **Restart:** `restartFromLamp` returns during a spin (good, the 3 s are not for sale) and rewinds the rivals; no gain from it (the roll-out loses 1.2 s and the clock does not go back). New friction: S1 (the prompt), N1 (the dead menu item), N3 (stale sling).
- **"Again?":** appears on the dark frame and when the rival gets home with Jo over 100 m short; the guard of 350 ms covers a mashed Space, which is also the sling key (a late sling press at the moment the rival gets home is the only way to take "Again" by accident, and only after 350 ms). Choosing "Again" starts a `fadeOut` on a camera that may already be black; in Phaser the fade restarts at alpha 0, so there may be a visible flash of the rewound lamp scene before the dark. **A drive checks this.**
- **Lamps:** the "never more than 250 m back" rule holds (250, 500, 700, 950). The 700 m lamp sits on the kink's braking point (N2).
- **Hit-stop:** `advance(input, 0)` latches the edges and runs no step; a lane or sling press during the 40, 80 or 90 ms is kept. Checked the code path and the frame-rate test; fine.
- **Gamepad:** `RACE_PAD` binds triggers and d-pad sides as pedals, the stick's X as a pedal, d-pad up and down as lanes, A as the sling. The stick's Y no longer changes lanes. Both thumbs are not asked for two things. One assumption to check on a real pad: a pad with no d-pad bits at `b12` to `b15` (some controllers expose the d-pad as an axis or a hat) would have no lanes at all. Needs one real pad.

## Where only a real drive can tell

- Whether the beat is heard and understood as "tuning in", over the road and the engine (eyes shut, streaks hidden).
- Whether the white chevron stands in for a missing Corsa at the grid (S2) and whether the grid feels empty.
- The flash on "Again" from the dark frame.
- Whether the 16 px sight chevron is noticed in the bends.
- Whether a person reads the speedometer notch to within 3 to 5 % at bend entry, which is the whole gate (1 % is 0.2 s).
- Camera shimmer from the continuous zoom and 1 degree rotation over pixel art (carried over from round 1).
- The launch tap: easy to hit in a bot, unknown for a person on a keyboard.

## Decisions before story races

Short list, each with a recommendation, from the report's open questions plus the ones this review adds.

1. **Lane model (report Q1).** Author each bend's trade freely, as now, but add a track lint (a bot test per track): no single uniform plan wins; every `outside: 'wall'` bend must pay its outside at least 0.3 s (S4) or it is not worth drawing; and a straw bend costs at least the slack of the race to skip (M1). Do not make the outside's trade fixed.
2. **Failure unit (Q2).** Keep the lamp and the rewound rival; set slack per race to about 1.5 spins by `top` and length (above); make "Drive on" sticky (S1); optionally a lamp refits tyres (N4). Do not shorten the dark.
3. **Scripted races (Q3).** Put it in the engine as data, `track.script`, before race 2: a list of `{ at: { d | t }, do: ... }` that `step` reads (force a lead, spin a rival, say a line, `noFail` that turns a spin into a stumble). The bots can then pin "cannot fail" and "the rival always wins by 0.2 s"; flags in the scene cannot be tested by the node bots.
4. **Track theme (Q4).** Move `PAINT_STEPS` and the sky, layers, kerb, grade and night into a `theme` object on the track before the second track exists; the wet-grip variant is **not** a theme but a tune: `track.tune` merged over `TUNE` in the `Race` constructor (it already takes `tune`). One mechanism for rain, ice and the car upgrades below.
5. **Rival behaviour (Q5) and the rival's pace.** Give a rival a profile in data, not a class: `{ top, lines: [per bend], brakeMargin, mistakeChance, block: none | mirror | yield }`. Start with lines and margin only: a rival that **takes the outside at the sweeper and brakes later than Jo** teaches the lane model by being seen (the cheapest teacher there is), and a rival that is fast on straights and slow in bends stays near Jo and makes the draft and sling real. Today the Corsa is behind the screen from about t = 20 s. Blocking only for one named rival, and only with a telegraph on the sprite of at least 0.4 s.
6. **The ear (Q6).** Information only for now; revisit when a rival is as fast as Jo. If the slot is to pay then, scale `draftSpeed` by closeness to the slot (6 % at the slot, 3 % at the edge).
7. **What nuts buy, second place (Q7).** No speed upgrades (they invalidate every bot table and every track's slack). Sinks that change *skill*, not pace: a tyre compound (less wear, a higher `gripMin`), and Ottavia's chalk as a permanent unlock; the rest cosmetic. All of them go in as `tune` overrides on the car, so the bots can pin them. Keep second place at 6 until a shop exists.
8. **Music in races (Q8).** The engine is the music: keep it off in the race body (the beat, the sight cues and the bend call all live in the same band). Allow stingers at the lights and the card, and for a story race at most a thin rhythmic bed with no sustained pitched content between 45 and 110 Hz, ducked 6 dB while a rival is within the beat range.
9. **New: grid layout for several rivals.** Decide it now: the first row sits within the 13.6 m the camera shows at rest (S2), staggered by lane, with the camera pan on the second light. A 20 m gap does not scale to three rivals.
10. **New: the lifts line and the card's lessons (S3, S5).** Decide that the card teaches cost, not scolds: one line on what cost the most.

## Converged?

The engine, the lines model, the slip model, the lamps, the rewind, the sight strip and the hit-stop have converged: I could not find a stuck state, a lost input or an exploit that pays, and the numbers the report quotes reproduce. **Not yet converged on one point: M1**, where the straw bends can be skipped for 0.6 s. With M1 fixed, S1 and S2, and S3 cleaned up, the stage is ready for a real drive; S4 and S5 are balance and copy that the drive may overrule, and everything in the last section needs hands and ears.
