# Racer rebuild: designer and pro gamer review

Branch `redesign` at 6d46a34. Read only: no game code changed, no server, no browser.

**Ran** (numbers below are measured): `npx vitest run tests/race.test.js tests/rivals.test.js tests/script.test.js` (166 pass), and throwaway bots in the scratchpad (`b1.mjs` to `b15.mjs`, in `/private/tmp/claude-501/-Users-atifhsn-Documents-dreamcatcher/24eb88eb-4701-4564-ad2d-d34b369df333/scratchpad`) that drive the real engine, rivals and scripts through `raceFor`. Bots use `tests/raceBots.js` `tidy`, `gapBot`, `coppaBot` or small variants. All runs use the default car (untuned: top speed -4 percent after 60 percent of the race). Fix numbers marked "measured" were run by overriding `TUNE` or re-compiling the track in a scratch script.
**Only read**: RoadView drawing, the four pictures, touch behaviour (slide across the steering buttons), audio, the plan's prose, frame cost.

What is good, first, because it matters: the HUD speedo notch moves with the line you are on, so the call's speed is honest; the boards are real brake points (braking at the 50 board lands about 25 m spare and finishes Pinewood in 33.5 s, inside the gate); the three HUD plates and Ottavia's caption all sit above the horizon (y 52 to 120 against a horizon at 227) so none covers the road; kerbs on bends, edge lines on straights and the crest hiding the road read well in the pictures; the car stays put and the road moves; the touch pictures put GAS on the edge and the call text stays legible. Brake-less bots fail every gate (Pinewood no-brake 37.2 s, lift-only 36.3 s; Salt P4; Coppa P2 or an endless spin loop), so the brake pedal is a real input.

## The two reviewers' verdict in one line

Designer: the road and the view are built to the owner's brief, but the *driving* asks only one question (when do I brake), the steering does nothing, and every new verb (draft, block, crossing, pit, wall) has a path that ignores it. Pro gamer: the dominant strategy is "gas down, three or four brake taps, don't touch the wheel", and the finale is a procession unless you do the kind thing.

---

## MUST

### M1. Steering is decoration on Pinewood (and the push is not a force)
`src/engines/race.js:44` `curvePull: 0.6`.
Evidence (measured): a bot that **never steers** except round the cart finishes Pinewood in **32.47 s**, faster than the same bot steering its line (32.73 s) and 1.5 s inside the gate. Its worst drift in a bend is |x| 0.66, so the push never reaches the verge (1.0). The owner's "free steering" and the plan's "the push throws you outward, you hold against it" are not true at this number. Total decisions on Pinewood are three brake taps and one cart.
Fix (measured): `curvePull` 0.6 to **1.4**. The never-steer bot then reaches the straw in bend 1 and does not finish (at 1.0 it finishes 34.12 s, 0.1 s over the gate); a steering bot is unchanged (32.92 s, max |x| 0.50). Re-check `tests/race.test.js` after.

### M2. The last tight bend on Pinewood and Salt is free to ignore: the straw is a better brake than the brake
`src/engines/race.js:92-93` `strawLoss 0.65`, `strawHold 1.5`; `tracks.js:101` (blind right), `tracks.js:171` (the drop).
Evidence (measured, tidy elsewhere, flat out through one bend, cost against the tidy lap): Pinewood blind right **+0.18 s**, the crest's whole point; Salt the drop **-0.07 s** (faster than braking); Salt chicane out +0.32 s. Mid-track bends cost 1.5 to 3.2 s, so the problem is the last bend, where the 65 percent loss lands you near the corner speed anyway and nothing is left to lose. "Trust the board, you will not see it" teaches nothing if ploughing in costs less than a tenth of a second and the car lands back on the road.
Fix (measured): `strawLoss` 0.65 to **0.8** and `strawHold` 1.5 to **2.5**: the same skips cost **+1.8 s** (Pinewood blind right) and **+1.5 s** (the drop). Side effect: the late-brake cliff (M3) gets worse, so pair it with the fix there. A cleaner change that I did not run: in `offRoad` (race.js:529) set `c.v = Math.min(c.v * 0.35, b.safe * 0.4)` so the loss is a crash speed, not a share, and a small overshoot is not punished more.

### M3. Braking has a cliff on the late side and nothing on the early side, so the dominant play is "brake early"
Evidence (measured, Pinewood, centre line, `m` = spare road before the maths says brake): m 40 early 34.25 s; m 15 33.25 s; m 0 **32.62 s** (the best); m -3 32.86 s; m **-6 35.22 s** (one straw); m -10 40.22 s (three). The window between perfect and a straw is about 6 m, 0.2 s of driving. Early costs about 0.04 s per metre, late costs 0.4 s per metre. A pro gamer brakes 15 m early everywhere, loses 0.5 s of a 1.3 s slack, and never touches the limit. "Every bend is a loan" is a cliff, not a loan. The grip loss is graded (grip 0.66 at m -3) but then the straw ends it.
Fix: soften the late side and give the limit a reward. `strawHold` back to 1.0 only if M2 uses the crash-speed version above; and give the near-limit line a visible payoff the player can chase: raise `lineSpeed` on the sweepers or pay `SHE SINGS` (`RaceScene.js:228`, a count today) a real reward, for example +0.3 s off the card's time per sung bend, or +5 percent pull for 2 s after a sung bend. Without a reward for the limit, the best strategy is a safe margin.

### M4. "No line wins everywhere" is true by 0.06 s, and the outside is the fast line on two of three bends
`tracks.js:95-101`; the plan's table says "hug the inside". Evidence (measured, outward share per bend, others centre): first sweeper outside 32.42 / centre 32.73 / inside 33.04 s; second sweeper outside 32.79 / inside **32.67 s** (0.06 s); blind right outside 32.43 / inside 33.04 s. All bends outside is 32.23 s, all inside 33.42 s. The bots and the plan teach the inside line, the slow one. A pro gamer finds "hold the outside" in one lap and stops thinking.
Fix (measured): `lineLen` second sweeper 0.14 to **0.22**, blind right 0.08 to **0.30** (first sweeper stays 0.03). Result: first sweeper outside wins by 0.6 s, second sweeper inside wins by 0.55 s, blind right inside wins by 0.8 s. Now the line is a per-bend question. Note the HUD notch only shows the speed of the line, not its length, so say it in a board or Ottavia's line ("the inside is shorter here").

### M5. The finale's two branches are not the same race, and the kind choice is the hard one
`script.js:196-218`, `race.js` `stopHelp: 3.4`, `tracks.js:243`.
Evidence (measured, tidy driver, default car): Coppa pass branch: Jo 86.2 s, Dante 93.9, Teo 96.6, **7.7 s clear**. Stop branch: Jo 92.3 s, **1.6 s clear**. A cautious driver (margin 15 m, 95 percent) still wins by 4.2 s if he drives through Cassian and **loses** (P2, 96.2 s) if he stops. Cassian is `doomed`, so the whole race is "beat Dante and Teo", and Dante was slowed to 0.91 to make the stop survivable. Result: passing is a procession, stopping is nearly a loss, and the owner's story choice carries a penalty the player cannot see. A gamer who plays to win drives through every time.
Fix: make the two branches equal. Cut `stopHelp` 3.4 to **2.4** (stop costs about 5 s, not 6) and slow the pack when the wheel goes: on the `wheel` event set Dante and Teo `top` x0.9 for 6 s (a yellow flag, the marshals), so both branches keep about 3 s. Pin both with the existing `tests/script.test.js` tidy-bot test and add the cautious bot (m 15, k 0.95) winning both branches. Dante's 0.97 in the plan could then come back up to 0.94 so the pass branch is not a 7 s walkover (not run).

## SHOULD

### S1. Each new verb has an ignore path
- **The crossing** (`tracks.js:182`, `race.js:121` `crossingBell`): Jo is at 35.4 m/s when the bell rings 110 m out; he needs 31.4 to arrive before the gate shuts, so every driver makes it with 0.4 s spare (measured: tidy, and all three cautious variants, 0 bumps). Braking at the bell, the natural reaction to red lamps, costs **+6.8 s** (61.2 against 54.4) and still reaches P3. So the crossing is a reflex that rewards ignoring the lamps. Also the plan says "from 180 m out"; the data is 110 m. Fix: ring at 150 m (`bell: 150`) and `crossingBell` 3.5 to 4.6 s, so a car at 33 m/s arrives with 0.1 s to spare and at 30 m/s is shut out; and shorten `crossingShut` 4 to 3 s so waiting costs about 4 s, not 7. Not run.
- **The pit box** (`race.js:139-143`, `tracks.js:246-251`): a perfect stop finishes 86.2 s, driving through finishes **86.5 s**, a stop 8 m short 88.4 s (measured). Stop or skip is a wash, and a pro gamer skips for the safety. Without `pit_clean` (the garage drill) a clean stop gains nothing. Fix: `pitThrough` grip 0 already floors at `gripMin` 0.75; make the through-run honest with `gripMin 0.6` after the pit (script.js:172, not 0.75) and `pitBox` 3 to 2.5 s so a clean stop wins by about 2 s and a miss (5 s) still loses by about 1.5 s. Not run.
- **Cassian's block** (`rivals.js:126`): he blocks only if you sit in his air. A driver who stays out of it never meets it, finishes 54.4 s, P2 against Cassian's 53.3, and the gate is met. The block is a mechanic you opt into. Fine if the card pays the pass (S5).
- **The sling** has no cost and is automatic; in race 2 it gains nothing, because Aldo is a rail (S2).

### S2. Race 2 asks nothing and holds one hidden rule
`script.js:34-108`, `rivals.js:89-93`. Aldo is a rail: 2 to 3 lengths ahead of Jo whatever Jo does, never braking for a bend himself, so there is no braking-point to learn from him; no clock, no gate, no way to pass or lose him; the quay is 420 m of gas with the draft full by 1.2 s (events: armed at 1.2 s, first brake about 14 s). That is by design (the story) but the player is not told what "stay in his air" means. `held_aldo` is a single instant at 1040 m (script.js:80): inside the draft box (1.5 to 4 lengths, within 0.25 widths) with the bar armed or filled. Measured: a driver who follows Aldo's line (the `air:'aldo'` bot) gets `held_aldo` true; a bot that merely steers round him (the default `tidy`) gets **false**. A sling in the 1.2 s before the cue also gives false. Fix: say it on the HUD, "IN HIS AIR" lit on the DRAFT meter whenever `jo.inDraft`, and keep the check as a window (true if the bar was full for any 1.5 s in the last 8 s before the cue), so one pull-out cannot cost the line.

### S3. Dead stretches
Measured quiet stretches (gas down, no bend within 110 m, no hazard or rival within 60 m): Pinewood **620 to 800 m, 6.4 s, a fifth of the race**; Coppa the last 2 laps' finish 1890 to 2000 m, 4.0 s. Scripted content leaves gaps on Salt: 470 to 640 m (5 s), **980 to 1260 m (about 9 s)** and 1330 to 1500 m (5 s); on those the only content is Cassian or Teo's oil. Harbour's quay is 12 s of "stay in the draft" (teaching, acceptable).
Fix: Pinewood, a pair of bales at x -0.45 and a cart at x +0.55 at 700 m (a gap of about 0.5 widths: threadable at 30 m/s, so the steer matters); Salt, a cart at x +0.4 at 1100 m and a second pit-wall figure line so the long straight has a lane choice. Not run; check the bots still pass.

### S4. Salt's "top 3" is "beat Teo, by under a second", and the HOLD branch rides on it
`tracks.js:158-199`. Measured: tidy Jo on worn tyres 56.6 s P3; Teo 57.3 s: **0.7 s**. Cautious (m 15, k 0.95) 58.6 s P4, a fail by 1.3 s; on stock tyres the same bot passes (P3, 56.1 s) and m 40 k 0.9 fails (59.3 s). Cassian (53.4 s) and Dante (54.8 s) are out of reach unless you exploit Cassian's mistake. The plan's promise that "holding behind Dante still reaches P3 either way" is true to 0.1 s (the hold bot is P3 at 57.4 s). The crossing also helps whoever is ahead: its bell rings only for Jo (`race.js:595`), so a rival 0.4 to 4.4 s behind Jo is stopped by it (Dante lost 6.5 s in the default tidy run, 54.8 to 61.3) and one ahead never is; that is a hidden rule that is also a rubber band in the player's favour.
Fix: `wornStart` 0.6 to **0.7** or Teo `wear 3` to **4** so he is bald earlier; target a 2 s slack for the worn-tyre tidy bot, 1 s for the cautious bot (Stage F already tunes Pinewood and the Coppa; add Salt).

### S5. The wall is not a threat in a place race: a spin is nearly free against rivals
`race.js:627-632` (`lampRivals`), `race.js:688-692` (`toLamp` rewinds rivals), `tracks.js:49`, `:126`.
Measured (Coppa, deliberate wall crashes at the Gull Bend): none 86.2 s with Dante 93.9 (margin 7.7); one crash Jo 90.2 s, Dante 96.4 (**margin 6.2**); two crashes Jo 97.1, Dante 103.6 (**margin 6.5**). Jo loses 4 to 7 s, but the rivals are put back with him, so the margin barely moves. Against a place gate (Salt, Coppa) the wall is a clock penalty on a card nobody reads. The plan says "a spin costs about 2.3 s, never the race", which is the intent, but it also makes hitting the wall deliberately harmless.
Fix: on `toLamp` put rivals back to 60 percent of the distance they gained while Jo was away (`r.d = lamp.d + 0.4 * (r.d - lamp.d)`), so each wall costs the margin about 3 s. Not run; `racer-fail-fair` and `tests/race.test.js` assert rewound rivals and would need the number changed.

### S6. HUD: radio chatter at the busiest moment
`RaceScene.js:50` (the `lamp` line), `tracks.js:104` (lamps at 90 and 270). In `pinewood_bend.png` Ottavia's 52-character lamp line, the BRAKE NOW plate and the progress strip sit together at the one instant the player must brake for the first bend (lamp at 90 m, bend at 100 m). Both plates are off the road, but that is three things to read at 1 s of warning. Fix: the lamp line only on the first lamp of a race and never within 150 m of a bend's `from`; cap the radio at 28 characters while the call is in braking range. The same for `armed`: "You are in his air. Out, when you're ready." (44 characters) fires over the first sling.

## NIT

- The call rounds the distance up (`RaceHud.js:172` `Math.ceil(dist/50)*50`): `pinewood_straight.png` shows "LEFT 150 M" with the "100" board already beside the road. Use `Math.round`.
- The bend picture's "BRAKE NOW" shows at 87 km/h when the limit for that line is about 83: it is a tap, not a brake. For bend 1 only; fine, but the first bend (25 m/s) costs +3.17 s if ignored, so the lesson is true.
- Touch (`pinewood_hud_touch.png`): two separate steering buttons, not the plan's slab with a dead strip and slide-across. I could not check the slide by reading; the picture shows a gap of about 12 px between them, which fits. GAS at the edge with BRAKE beside it means the thumb rolls to brake: fine.
- Lifts are counted (`race.js:458`) and spoken on the card ("I heard you lift 3 times") but cost nothing in the drive: a stat the player can't act on.
- `RaceHud.js:34` goalLine says "first over the line" but the Coppa gate is a place, not the line: fine, but the Harbour reads "stay in his air" with no place or clock, so there is no failure state in the HUD: see S2.
- The plan §2 says Salt is 1:00; the tidy bot runs 54 s and Pinewood 32.7 s of 34 (known). Coppa 86 s against 1:35. Length is under the plan, so there is room for S3's extra hazards.

## What I would do first

1. M1 (curvePull 1.4) and M4 (lineLen on two bends): steering becomes a decision per bend. Both measured, two numbers each.
2. M2 and M3 together: straw loses the free last-bend skip and the late side gets a reward.
3. M5: make the finale's two branches equal before stage F tunes the numbers, so the tuning does not chase two moving targets.
4. S1 crossing and pit: tune from the measured margins above so each is a real call.
