# Racer stage 1: senior game designer review

Read-only review from code, the stage 1 report, the design doc, the ROADMAP bar and the screenshot at about 94 km/h. Nothing was run or played. Where a claim needs hands on the keys it says PLAYTEST.

Files read: `src/engines/race.js`, `src/scenes/RaceScene.js`, `src/dreams/racer/race/{tracks,result,RaceHud,RaceRoad}.js`, `src/dreams/racer/{dream,rooms/garage,verbs/garage}.js`, `src/input/touchLayout.js` (layoutRace).

## Verdict in five lines

- The engine is sound and honest: fixed step, edges that are never lost, soft bend then hard bend, a rival that follows the same rules. Not a prototype to throw away.
- As built, the loop is one good line: fill the draft behind the rival, pull out, sling, pass, then hold the lead. Lanes cost nothing, grip never leaves green, and a 43 s lap has about six events.
- The 18 m view is not fair on its own. The sight strip is what makes it fair, and the strip is placed and thresholded wrongly.
- The race looks like a modern European town road, not Calvessa 1958. The painted lane dashes and red/white kerbs are as wrong as the broadleaf trees.
- Before story races go on this: decide what a lane is, how a failure is recovered, how a script (the tragedy) enters a race, and how a track carries its own world.

## Numbers I checked (so the claims below are not guesses)

- Look-ahead: car at screen x 250 at top speed, zoom 0.9 (`RaceScene.js:37-38`, `:287-289`). Screen x of the car = 480 + (250-480)*0.9 = 273. Visible ahead = (960-273) / (44*0.9) = 17.3 m. The report's 18 m is right. The zoom to 0.9 buys about 2 m of that. Half a second at 36 m/s.
- Lane change to clear a thing: the hit test is `|y - lane| < 0.55` (`race.js:339`). Starting at lane 2 with a cart in lane 2, y must fall below 1.45, which is 0.55 lanes at 1 lane / 0.45 s = 0.25 s = 9 m at top speed. Add 0.25 s of reaction (9 m). You must decide at 18 m or more. The view gives 17 m. So an unseen cart is unfair, and the sight strip is not a nicety. It is the game's read-ahead.
- Test road: 43 s lap, events (2 bends, 4 obstacles) = 6. One decision every 7 s, with GAS held the rest of the time.
- Win margin on the test road: tidy line 43.2 s against the rival alone at 44.0 s (report). The gate is `passPlace: 1` (`tracks.js:13`). A 0.8 s margin is the whole gate for a first-time player. PLAYTEST.

---

## MUST

### M1. One mistake costs hundreds of metres, and a lost race has to be driven out
`tracks.js:15` (`lamps: [600]`), `race.js:380-410` (`recover`, `toLamp`), `RaceScene.js:433-440`.

- What happens: the cart at 540 m comes before the only lamp at 600 m. Spin there and `lampD` is 0, so Jo goes back to the grid after 3 s. That is a 540 m setback, about 15 s on a 43 s race, while the rival keeps driving (the rival is not reset). The wall bend at 850-935 sends him back to 600: 250 m plus 3 s, about 11 s. Either way the race is lost, and the player drives 20-30 s more knowing it. Restart is Esc, then a menu item. `restartFromLamp` on a grid-lamp also puts Jo back with the clock still running and the rival far ahead.
- Why it matters: this is the first minute of the dream, and the dream's tone is "fair fails". The design's own lamp spacing of 600 m is for a 4 km race. On a 1.2 km road it is a 50 percent reset.
- Fix: (a) a track rule, not a taste: a lamp before every hard hazard, and never more than about 250 m (7 s) between lamps; here lamps at 250, 500, 750, 1000. (b) after a spin, if the gap to the nearest rival is more than a sling can recover, say 10 m plus 12 m/s over the remaining straight, Ottavia asks "Again?" on the dark frame with one key (R, or the pedal-side button on touch) and an Esc-free path. Keep the three-tries soft aid.
- Playtest: confirm the lost-race feeling. If a second try costs 25 s the owner will hate it.

### M2. The sight strip is the read-ahead and it is mis-placed
`RaceHud.js:62-71` (placement), `:127-137` (threshold and text), screenshot.

- What the player experiences: in the screenshot the Corsa is 10 m ahead, fully visible, and a "10 M" plate with a chevron sits on top of its tail. The strip draws things at 10-160 m, so for 10-17 m it duplicates what is on screen and covers it. Further out, each lane has a chevron at x 932 (742 on touch), 660 px from the car at x 273. The eye has to leave the car, read "140 M" (rounded to 10 m, flickering every 0.28 s at top speed), convert metres to seconds, and come back. Fair in principle, hard in practice.
- Fixes, smallest first:
  1. `a.dist > 10` becomes `a.dist > VIEW_AHEAD` (about 20 m, one constant that the camera also reads), with a short fade-in, so the strip is a radar for what you cannot yet see and never a label for what you can.
  2. Replace the metres with time-to-contact: chevron size and a pulse that starts under 1.5 s. Drop the digits, or round to a second.
  3. Move the strip in from the edge, to about x 640-700, nearer the eye's path. Keep its lane-height alignment, which is the right idea.
  4. Add one audio tick per lane panned by lane, at 1.5 s. The game's pillar is the ear and none of this reads by ear yet.
- Bends: the 150/100/50 boards (`RaceScene.js:133`) are the in-world cue but at 36 m/s they appear 0.5 s before you pass them. Keep them (they are good period detail and teach the rhythm after one lap) but do not count them as the read-ahead.

### M3. Decide what a lane is, before rivals and stories, or the dream stays a lane-swap
`race.js:313-319` (lane change is free: 0.6 percent grip), `:295-304` (a bend ignores your lane), `tracks.js`, design §3.

- What the player experiences: three lanes that differ only in what is in them. There is no reason to be in the inside lane of a bend, no price for hopping, no line. Lane use is: dodge, draft, pull out. With one rival that is one best line (the report's own bots show it: tidy 43.2 s, no draft 46.4 s).
- Fix (a decision, then small code): make a lane a line.
  - A bend's `safe` per lane: inner lane lower by about 2 m/s but a shorter way, outer higher and longer. Then braking choice and lane choice are the same choice.
  - A lane change at speed scrubs 1-2 percent of speed (and raise `wearLane`, now 0.006, so it is felt on a long race). Weaving costs, so a pass is a commitment.
  - Keep the discrete lanes: two buttons is right for touch.
- This is a major change under the owner's rule. Ask the owner, with this single paragraph.

### M4. The world is not Calvessa 1958 (stage 2 must fix, and the first screen already shows it)
`RaceRoad.js:17` (`PINEWOOD` is shared-painter colours), `:77-80` (layers `far_ridge`, `town_row`, `tree_band`), `:20-38` (road paint), `:56-64` (kerb).

- What the player sees: the title says Pinewood and the screen says a modern avenue: broadleaf canopies, pale six-storey blocks with terracotta roofs. You have noticed this. Two things the report does not list:
  - The road is a three-lane modern road with dashed white lane lines and red/white rumble stripes on both edges. Closed public roads in 1958 had one centre line at most, crowned dust, whitewashed stones, straw and sandbags. The lane lines are also what makes it read as a motorway.
  - The HUD and the Heron are period-right (cream, teal roundel, drum-brake wording) but the world around them is not, so the car looks pasted in.
- Stage 2 art list (each one is a thing the player can point at):
  - Far: limestone cliffs with sea haze and a thin blue strip of sea. Mid: stone village with a campanile, terraced vines. Near: umbrella pines and cypress, not round broadleaf. Add telegraph poles, a stone wall, whitewashed milestones and rope-and-post spectators for the front kerb parallax.
  - Road: no red/white kerbs. A faint worn centre line or none, tyre-dark crown, gravel edge, straw bale lines at corners. If three lanes must be visible, draw them as worn tracks (two darker wheel-paths), not painted dashes. The player must still read the lane in the middle.
  - Grade: a slightly warm, soft print grade (the look layer exists: `setupLook`), a sepia-tinted haze, not sky-blue modern.
- Structural fix that must come first: `RaceRoad` hard-codes one theme in three places. Give a track a `theme` object (layers, road, kerb, sky, grade, night flag) and have the road read it, or race 2 (harbour night) and race 5 (rain) will be a copy-paste of this file. `PAINT_STEPS` is also module-level and keyed by fixed texture names, so two themes cannot coexist in one page. Budget: all packs were 73 of 80 MB in the report, so each new theme needs to be freed on leaving the race.

### M5. The ear, the game's one idea, is not in the race at all
Design §8 "The verb is the ear". `RaceScene.js:379-385` feeds the engine voices, but nothing a player must hear is asked of them.

- What the player experiences: a good-looking arcade race. Eyes only. The dream could be any racer with a trumpet theme. Ottavia talks but does not listen.
- Decision before stories (not a bug): pick one decision the race hands to the ear. My pick, which costs almost no code: the draft is a beat. Give the rival a base pitch a few Hz off Jo's and let the two beat; the beat slows to nothing across the draft window, and the sling "locks". Players learn to find the slot by listening, with the bar as backup. It is the garage tuning idea, in a race, and it is nobody else's. The `base`/`detune` fields in `updateAudio` are already per car. PLAYTEST (silent dev, never heard); the owner has to listen.
- If this is not chosen, state in the design that the race is a visual game and the ear lives in the garage. Either is fine. "Not decided" is the defect.

---

## SHOULD

### S1. HUD: too much static, too little of what the brake needs
`RaceHud.js` (the whole), screenshot. About 13 things on a screen that has three verbs.

- Static and low-information: the level name (top left), the objective plate that never changes ("BEAT THE BLACK CORSA TO THE LINE") in the best real estate at top centre, the GRIP meter (the report's tidy bot ends at 0.85, so it never leaves green: it tells the player nothing), and `FULL`/`SLING READY` which say the same thing twice. The `FULL` label also hides what the bar is: DRAFT turns into FULL. Label it `SLING` or keep `DRAFT`.
- Missing: when to brake. The call `BEND 90 M: 86` (`:120`) is two numbers with no unit, one flickering, and the player must compare 86 to the bar's notch and then to the distance. The one useful cue, `BRAKE NOW` (`:121`), is hidden behind three failures.
- Fix: (a) objective and level name fade after the first 5 s (ROADMAP's "HUD diet, framework-wide" is this); (b) hide GRIP until it is below about 0.8 or the track is long enough for it to matter, or raise wear (see S5); (c) `TAKE AT 86` with a units tag, and a bar under the speedometer that fills as you pass the brake point (the same maths as the chalk at `RaceScene.js:143`) so the player brakes on a graphic and not on arithmetic; (d) give the first race a light version of `BRAKE NOW` for the first bend only ("teach in a calm moment", design §5), then not.
- Bank/zoom: HUD objects are `setScrollFactor(0)` in the same scene as a camera that zooms 1 to 0.9 and rolls (`RaceScene.js:289-295`). I did not find a UI camera. Probe whether the HUD breathes with speed. PLAYTEST.

### S2. "A second dim strip under the HUD plate": cannot be explained from the code
- Facts: the speedometer plate is y 482-528, region claimed 480-530 (`RaceHud.js:17`, `:34`). Game height is 540. In the screenshot a thin dark strip sits under the plate with the same x range, and another under `[ESC] PAUSE` at the right, so it appears to come with every bottom plate, not with the speedo. The kerb tile is y 522-602 at depth 60 (`RaceRoad.js:105`), under the HUD.
- I could not tell which of three causes it is: (a) a plate or shadow drawn twice (grid slot plus the HUD's own rect) with an offset; (b) the main camera's zoom or roll applied to HUD objects (no UI camera found: `grep` finds none); (c) the kerb tile showing under the HUD at the canvas edge.
- Check with: `game.scene.getScene('Race').cameras.cameras.length` and `.children.list.filter(o=>o.depth>=140)`, then hide the kerb with `scene.road.kerb.setVisible(false)`. If the strip stays, it is the HUD. Say what it is before anyone moves plates.

### S3. A stage 1 card that says untrue things and shows nothing of the race
`RaceScene.js:411` ("I heard you lift only twice"), `:407-417`.

- The card says Ottavia heard "only twice" every time Jo wins first, whether he lifted 0 or 9 times. A player will catch it in two runs. The result already holds `clean`, `rubs`, `spins`, `slings` (`race.js:468`) and the rival's time. None are shown.
- Fix: derive the line from data (count lifts, throttle released above 20 m/s, in the engine). Show the gap to the rival, the number of slings and "clean/not clean". One line each. Cheap and makes the replay mean something.

### S4. Launch and the pre-start are untaught and silent
`race.js:194-205`, `RaceScene.js:206-277` (no `jump_start` case), `:41-52`.

- The launch tap (Space in a 0.45 s window around GO) is never explained. "Don't lift." is the only start line. A tap before -0.1 s sets `launchTried` and emits `jump_start`, and the scene ignores it: nothing happens and the chance is gone with no word. A good launch pulls 25 percent harder, which on this grid is also straight into the rival (centre gap is 9 m, a launch closes about 5.5 m by 2.5 s), so the reward for a good start is a rub unless Jo changes lane. PLAYTEST.
- Fix: Ottavia on the third light, "Green, then Space." (one race only), a `jump_start` radio line ("Early. Next time."), and an engine lock so a perfect launch can't rub: `launchTried` plus a 1 s ghost, or start the rival at 12 m.

### S5. Grip and the free sling make two of the three systems decorative on a short road
`race.js:29-35`, `:222-230`, tracks.js.

- Grip: wear for a clean race is about 15 percent, and the grip factor is 0.75-1.0, so a 0.96 effect. Nothing is lost by braking hard or hopping lanes. Either hold the meter back until a long race (S1) or raise `wearBrake` and `wearLane` so a hard braker is worn by 600 m.
- Sling: free to use whenever it is armed, and it stays armed for 2 s after the draft ends (`draftKeep`). The only real choice is "just before a bend or not" (a sling into bend 1 at 24 m/s is a real decision: you are at 42 and need to shed 18). Good. Say so in the design: a sling into a bend is the intended risk, and put the next track's bends where a draft ends.

### S6. Rivals do not defend, so passing is trivial and Jo cannot lose the lead
`race.js:234-251`. Rival top ×0.96, Jo's top 1.0, no draft for the rival, no block. After the pass Jo wins by pure speed difference.

- Not a stage 1 defect (the rival is a placeholder, the report says so). But the design's Cassian "blocks when you are in the draft" and Aldo and Lena need behaviours the engine has no verbs for: change lane to cover, look in the mirror (telegraph), lift for you. Decide the API now (see "Decide before story races").

### S7. The garage gives the race no reason, and its props promise verbs they don't have
`garage.js:24-29` (tyre rack, work bench, lamp), `verbs/garage.js:59-84`, `tracks.js:14`, `result.js:25`.

- The player walks about 19 tiles right and presses E. The tyre rack and the bench are decor with no interaction and a Heron that is a still. A player will press E at the bench. It is the clock-house pattern, but the first room of the dream has no goal other than "go".
- The prize: `prize: { 1: 12, 2: 6 }` but `applyResult` only writes a prize when `place <= passPlace` (=1), so the 6 for second can never be paid: dead data. 12 nuts go in a tin, buy nothing (the shop and jars are later) and "Race it again" pays nothing for a better time. No reason to replay a passed race.
- Fix for stage 1 (cheap): give the bench and the rack one E line each from Ottavia (the engine, the tyres: "Flat as a bad note. Not today."), which also seeds the later TUNE. Drop the second-place prize or let it be paid at passPlace 3 (the real design). Add one replay hook that costs nothing: a target time on the card, "Ottavia's time: 0:42", in the garage's tin.
- Fine already: the door, the dip through dark, the saved-then-paid-once flow, the radio line at the shutter. "Don't lift." is a good first order.

### S8. Make the bend visible
`RaceScene.js:292-295`. The "lean" is 0.018 rad, about 1 degree. A bend is currently shown by a number, boards, chevrons and the car being pushed. The player never sees the road turn.

- Fix: during a bend, slide the road band and the far hills a few px vertically, toward the outside side, and let the near verge grow on the outside. In a side-on view a corner is the road sliding in depth. The slide that pushes the car along `y` then reads as the car going toward the verge it can see. Roll 1 degree stays as a hint. Check the HUD does not roll with it (S1).

---

## NICE

- N1. Auto-throttle or toggle-throttle in settings for touch and accessibility: GAS is held for the whole race. Quick to add (`input.throttle` is one boolean), important for thumbs.
- N2. Draft made visible: faint streaks behind the rival (design §3 says so, not built). It also makes the "FULL" HUD redundant.
- N3. Engine pitch and a slight screen-edge hum at the sling cool-down, so the player knows when it is ready by ear, in line with M5.
- N4. Rival's mirror glance (head turn on its sprite) as a block telegraph for Cassian. Cheap in the car kit.
- N5. A wet or night variant of the same road as a free test of the theme object (M4): "same road, night" is a good proof before race 2.
- N6. Spin dust trail for lane glides (design risk "depth lanes in side view can read as vertical movement"): you have a puff on lane change (`:225`); add a skid shadow smear.

---

## Does a 3-lane side-on view feel like driving?

Honest answer: not yet, and I can't say from code. What I can say:

- What reads as driving: wheels that turn with distance (`:348`), nose-dip, squat, the throttle weight (pull fades on a power of 1.7), a brake with drum fade, slide that wins over the glide. These are good and not common.
- What reads as a lane-swap: discrete 0.45 s hops with no cost, no line through a bend, no consequence for a lane change. The lane is a switch, not a steering position.
- What would make it distinctive, in order of value:
  1. Lanes as lines (M3): the inner lane and the outer lane are different roads.
  2. The ear (M5): the draft as a beat you tune out. Nobody else does this, and the whole dream is about it.
  3. The road that turns on the screen (S8) and your car sliding toward a verge you can see.
  4. Keep it a side-on picture of a person who drives by ear: Ottavia's voice is part of the controls, not a caption.
- Continuous steering (hold Up to drift across the road) would feel more like driving. It is a larger change to rival AI, drafts and chalk, and a poor fit for two touch buttons. I do not recommend it. Say it to the owner as a choice that was considered.

## Decide before story races get built on this

1. Lane model: discrete hop with a price, per-lane bend speeds (M3). Everything downstream assumes it.
2. Failure unit: lamp spacing rule, who resets with Jo (rival too?), the "again" path (M1).
3. Scripted races: the tragedy "cannot fail" (design §3). The engine has no script. Add a `track.script` of distance-triggered events (force the brake, spin a rival, lock input, cut the camera). Decide it before race 2 or it will be bolted on as flags in the scene.
4. Track theme object: sky, layers, road paint, kerb, grade, night, wet grip multiplier (M4). The road reads it. Free it on leaving to hold the 80 MB pack budget.
5. Rival behaviour API: block, mirror, yield, with a telegraph on the sprite (S6). Cassian, Lena and Bruno are different at the engine level.
6. The ear: beat-in-draft or not (M5).
7. What nuts buy, and what the second place is worth (S7), so the prize tin has a destination.
8. Music: `musicDirector.stop()` at race start (`RaceScene.js:97`). The design has a 140 BPM track and "the engine is the music" for the finale. Decide whether races have music, so the engine's pitch stays readable.

## What is fine and should stay

- Engine: fixed 120 Hz step with an accumulator, a 50 ms frame cap, edges that wait for a step (`race.js:146-160`). Pure and testable.
- The teaching order: bend 1 has straw (soft, costs 40 percent speed, Ottavia says "Straw. Slower into that one."), bend 2 has a wall. A lesson first, then a rule. That is well thought out.
- Radio lines are contextual and short; the draft line arrives at the moment it matters.
- The sling not being safe in the same lane (a rub or a hit at more than 6 m/s closing) is a good, quiet constraint.
- Hit-stop and shake on contact are small and sized well. Wheel rate follows distance. The wheel blur stays turning.
- Save and pay-once flow, soft aid after three tries, three audible engines, frame cost (3.2 ms average, 5 draw calls).
- Touch pedals: GAS at the thumb's edge, BRAKE beside it, lanes and SLING on the left, same keys as the keyboard.

## PLAYTEST list (what only hands can tell)

1. Is the 18 m view plus the strip readable at speed? Run with the strip off and see how many carts hit.
2. Brake feel at 8 m/s² (4.5 s from top to zero): too long or fine; and the slide push.
3. Is the win margin (0.8 s) reachable for a first-time player, or is first place a wall?
4. A perfect launch into the rival's tail (S4).
5. The sling as an event: does 2 s of +18 percent feel like a launch or a nudge?
6. Does the HUD breathe or roll with the camera? What is the second dim strip (S2)?
7. Phone: rolling the thumb from GAS to BRAKE; the strip and the pedals together.
8. Sound: does the engine read as an engine, and is the beat idea (M5) audible?

*Skipped: playing it, the sound, and measuring the HUD in a browser. The strip explanation (S2) is open.*
