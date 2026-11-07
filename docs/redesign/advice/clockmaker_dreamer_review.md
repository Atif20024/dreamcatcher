# THE STOPPED HOUR: Ansel and the wheels, reviewed (designer + pro gamer)

Read-only review of commit 3279fcb on `redesign` (merged; the worktree branch was not needed). Read: both docs, `dialogue.js`, `beats.js`, `verbs/wheels.js`, `verbs/works.js`, `logic.js`, the rooms, `geartrain.js`, `tests/geartrain.test.js`, the scenario. Not played. Where I give numbers they come from small Node scripts that call the real `bobAt`/`bobHits`/`trainState` with Jo's body (24x44), run speed 280, ladder 150, as rooms and `Player.js` define them. They model Jo's path; they are not a physics run. Things only a playtest can settle are marked PLAYTEST.

Not repeated here: the three bugs the report lists as fixed, the open questions it already names (sound, touch not run, higher tiers).

## Verdict in five lines

- The shape is right and the owner's pattern holds: eight places, one goal each, the scene changes as you enter. The wheel rule is readable and well taught; the ramp 2 wheels / 2 wheels / 4 wheels is good.
- Ida's death is the right tone, and it is never shown. But the confession's own logic is muddled (see M1), and that is the one sentence the whole dream hangs on.
- The reveal is half earned by play (Jo literally re-hangs what he took down; the oiled stand, the wiped gear) and half told. The telling is good copy in one long block.
- The choice is beautifully written and changes only text. A gamer will notice that "Strike it with me" does not give a second man on the rope.
- The shaft is not brutal by my numbers, but its knock rule (hearts + coins + wheel) is heavier than a gentle dream needs, and the bots' 11 to 15 knocks do not match my model, so something is unmeasured.

## MUST

**M1. The confession contradicts itself in its key sentences.** `dialogue.js:89-93`.
- k3: "Ida laid the table for **six**." The window moment says "a table laid for **two**", k4 says "Two plates." "For six" reads as six places. It means six o'clock. A player stops on it.
- k2: "I took them off. This evening, at six." But k4 has him come down at seven, after she died at half past six. So when did he take them off? Read literally, he removed the gears at six, before anything had happened, and "it does not get to be seven" (k5) follows from nothing. "Why?" (j2) is then answered with why he was up the hill, not why the gears are off.
- Player experiences: the one beat that has to land as a quiet punch lands as a puzzle about the timeline.
- Fix (copy only, keep every other word): k2 "I took them off. After. I came back up the hill and took them off, one by one. This one I kept." k3 "Ida had supper on for six. Six is winding, so I came up." k5 "So it is not seven. It does not get to be. If it never gets to seven, I am not late." (k5 already works once k2 says "after".) Also fix `docs/dream_clockmaker_dreamer.md` ("laid the table for six").

**M2. In a dream meant to be gentle, knocks 2 and 3 cost hearts and coins, and the HUD sits on one heart for the second half.** `works.js:55-60`, `logic.js:23-25`, `BaseLevel.js:542-556` (`hurt` also calls `scatterCoins`, which deducts wallet value for coins since the last checkpoint).
- Sequence: knock 1 free, knock 2 and 3 each take a heart and scatter the cogs just picked up (the three on the first bob's arc are the likeliest), then everything is free. Player ends the shaft on 1 heart, and carries that into the bell chamber.
- The wheel dropping is already a real, readable cost. Hearts on top is a second penalty for the same thing, in the one dream the station points a beginner to, and "free" knocks at 1 heart are still a shove plus a dropped wheel, so the one heart is only a mood.
- Fix, owner's choice (it is a feel decision): (a) `pendulumToll` always returns 0 here; a knock is a shove and a dropped wheel, never a heart. Or (b) keep the lesson that things can hurt, but refill hearts when the cage rises (`cage_up` beat) so the bell chamber starts at full. (a) is one line and removes the coin scatter too.

## SHOULD

**S1. The knock numbers: what it really costs, and the gap in the bots' count.** Geometry in `shaft.js:25-33`, `works.js`, `wheels.js:248-257`.

Safe windows, from the real functions. "Blind" = a player who runs at it without looking, random phase. "Slack" = the longest stretch of start times that clears it.

| Gate | Pendulum | What Jo does there | Blind knock chance | Slack |
|---|---|---|---|---|
| Floor, wheel pickup (stand east of wheel, x 460) | 3800 ms | stands 0.35 s | 32% | 1830 ms |
| Floor, pickup from the west (x 372) | 3800 | arrives, grabs | 40% | 1515 ms |
| Floor, wheel to the ladder (460 to 560) | 3800 | 0.36 s run | 16% | 2175 ms |
| Plank A, ladder 17 to ladder 7 | 3600 | 1.14 s run | 48% | 940 ms |
| Chain, B to C (4400 now) | 4400 | 1.49 s climb, 0.6 s of it exposed | 49% | 1115 ms |
| Chain at the old 3400 | 3400 | same | 55% | 760 ms |
| Bell chamber, door side to the wheel | 3000 | 1.2 s | 63% | 690 ms |

- The 3400 to 4400 change is real: the window grows 47% (760 to 1115 ms). Good call. The chain is fine for someone who watches one swing from the foot, as the room intends.
- Per knock, in time. Left-shove at the chain (about half): Jo lands on plank B, wheel beside him, about 1 s lost. Right-shove (the other half): after the 0.24 s control lock he has moved about 43 px, which is past B's right edge (B ends at x 480, Jo is at 464), so he falls seven tiles to plank A and the wheel stays on B. Walking back is plank A's gate (940 ms slack, 48% blind), the A-to-B ladder (1.5 s), 224 px of plank, then the chain again (49% blind). About 6 to 7 s and two more gates for one knock. PLAYTEST: whether he lands on A or overshoots to the floor depends on air drag I did not model (the air lerp is 0.35 a frame); the shove is small enough that A is likelier.
- For a blind first-timer on the big wheel: P(at least one knock) is about 87%, expected knocks about 1.5 on the big wheel and 0.5 on the small, plus the knock chains. A player who waits one swing at the foot of the chain and at each plank: near 0.
- **The report's 11 to 15 knocks is 5 to 7 times my model.** Either the bot is much less patient than "times the bobs by reading the clock" suggests, or one gate is worse than I computed (a wheel dropped and picked up again inside the same swing; the bot standing at x 416, dead under the pivot, instead of 44 px to the side). Do not treat 11 to 15 as the human number, and do not fix the shaft because of it. Instead make the scenario log room, x, y and phase on each `pendulum_hits` increment (`works.js:54`), and read which gate it is.

**S2. "Strike it with me" does not change the action.** `clockwork.js:73`, `beats.js:72,92,116`.
- Player experiences: Ansel says "It is a two-man rope... I never had the second man." then Jo strikes all seven alone and a caption says "One.", "Two.". The promise of a second man on the rope is a caption.
- The choice changes: a yard line, a caption count (or a walk down the hill), one green line, whether Ansel waits at the door, one ending clause. Five places, all text or cutscene, no play. That is fine for the "go home" branch (no one is there to help). It is thin for "with me".
- Fix: make his count the beat. In the "stays" branch say each number on the bob's crossing, with a `bell`-low tick as cue, so the player hears the rhythm. Also widen the strike window (`clockwork.js:55`, `window: 0.14`) a little for that branch. Now having him there is felt in the hands, and the "go home" branch (alone, lamps lighting ahead of him) keeps the quiet. Small change, no new system.

**S3. Two timing-bar actions back to back at the climax, and a third at the start.** `clockwork.js:19,39,55`.
- Answer to "is any verb still press when the marker is in the zone": yes, three of the six. The dial (`[E] when the hand is in the brass`), the third gear (`[E] as the bob crosses`, slips if off), and the seven strikes (the same escapement engine, same view, 25 s later). Only the wheels are not.
- Player experiences: the best new idea sits in the middle and the last two steps are the same minigame, the second right after the emotional high of the choice. "Here. On the beat, mind." is the emotional beat handing the player a stopwatch.
- This is a bigger call, so for the owner: either leave it (the strike can't be failed and finishes itself if left alone, and it is a ritual), or turn the third gear into a physical act (Jo hangs gear 3 on the escapement arbor, no bar), so the dream's one timing moment is the strike. S2's fix is the lighter alternative.

**S4. The belfry: wheel 4 sits on top of the door.** `belfry.js:37` (bell4 x = 27*32 = 864) and `belfry.js:82` (the door at tile 26, about x 848). `Interaction.nearest` picks by horizontal distance only.
- Player experiences: walking east along the gallery with the wheel unlifted, the prompt reads the locked door ("Not yet. There is nothing out there to strike...") until about x 856, only then "take the wheel". A player who presses E at 840 gets the refusal line, not the wheel.
- Fix: move bell4 to about x = 20*32 (the gallery tile 20), clear of the door (848) and the keeper's chair (24, about 784).

**S5. A wheel carried through a door goes home with no word.** `wheels.js:258-263`.
- Player experiences: leaves the shaft with the big wheel on his back, comes back, it is on the floor where it started. Not a softlock; it feels like a bug.
- Fix: say it once, on the caption bar, in Jo's voice: "It is the wall's wheel. I'll leave it." (Same code path; one `s.caption.say`, once per run.)

**S6. Choosing one peg out of seven on touch, and with a run speed of 280.** `belfry.js:32`, `wheels.js:95-112`, `Interaction.js:nearest`.
- The pegs are 32 px apart in x, one per column across 592 to 784, and the nearest-in-x one wins, so a half-gap is 16 px. Jo runs 280 px/s, about 4.7 px a frame, and the tap that starts him moves him at least 15 to 25 px. A d-pad tap lands you one peg off as often as not. Keyboard players can hold Shift to walk (80 px/s); touch has no equivalent that I can see. The ring (`wheels.js:333`) is the only help.
- Fix (either): while carrying and within 60 px of a peg band, set `p.walking` true so Jo slows to 80 px/s only there (the pendulum gates are far from the pegs, so the hazards are not touched). Or draw the carried wheel as a faint outline at the targeted peg (the ring becomes a ghost circle of the wheel's radius), so a wrong peg is seen before it is pressed. PLAYTEST on a real touch device.

**S7. "[E] both ways" in the lesson is literal text.** `dialogue.js:73`.
- The prompt text above pegs uses the live label; dialogue text does not substitute. On touch or a pad that line says a key the player does not have, in the line that teaches the verb.
- Fix: "Take a wheel on your back and hang it on a peg; the same button lifts it off again."

**S8. Three small copy slips that a careful reader will catch.**
- `dialogue.js:79` and `beats.js` objective `belfry_wheels` ("four wheels under the gallery"): two of the four lie on top of the gallery, one on the joists. "Mine. Four wheels, about the room."
- `belfry.js:29` "Three that all touch. You know that one." The player only knows it if they tried a wheel beside another at the bench. Make it standalone: "Three that all touch cannot turn. Lift one off."
- `wheels.js:191` / `shaft.js:43` "The other one." after a foul is ambiguous (other wheel? other peg?). "The other peg."

## Designer answers

**Does Ansel's story earn its reveal?** Mostly yes. Seven earlier touches (the table for two, Nell's "be kind", the pie "Ida sent me up with it at five", the watch man's "never once been wrong. That is what worries me", the oiled stand and wiped gear, the floor strewn with wheels, "Gears don't slip onto stands") all point at "he did it himself" and keep the *why* back. Ida's death is the single thing nobody has said, which is right. The reveal's own words are the strongest copy in the dream ("I could have left it. Nobody looks up." sits directly against the dream's thesis, the work nobody sees, and the ending's "nobody on the green could say it had ever stopped"). That tension is the best thing in the design. Fix M1 and it stands.

**Told through play?** Half. Play supplies the premise (Jo re-hangs what he took down; "You hang a wheel like a man who was told") and the clues are in the rooms. The confession itself is nine speaker boxes in a row (k1 to k5, then the choice), three of them Ansel alone with no interruption (k3, k4, k5). That is a lot of text at once for a player who has just worked 80 s. NICE: have Jo answer the pause with a one-word line between k4 and k5, or let the `going_train` tick (the train the player just hung) sound under k3 to k5 so the text is spoken over the thing they built. Not required.

**Ida's death in the dream the station points beginners to.** Right in tone: two plain lines ("She went at half past, the doctor said. Quiet, at the table. Two plates."), nothing shown, no one blamed, and nothing in the play can fail. "The doctor said" keeps it factual rather than sentimental. The gentleness of this dream is in its rules, not in its subject, and that is the honest choice. One caution for the owner: after M2 is done, nothing in the dream is harsh, so the content is the only weight. That is the right way round.

**Does the choice under the bell change things?** Yes in the story, no in play (S2). The two options are not good/bad: "Go home" sends a widower to an empty table, "with me" gives him a witness. Both end at the same door with a different last clause ("Nobody saw him go in." / "someone saw him do it"). The door scene in the "stays" branch ("Stand there a minute. Till I've got it shut.") is the best use of the choice. The "go home" branch makes the player watch a door they cannot see him enter: correct and quiet.

**Does the wheel rule read from what's on screen? Taught before tested?** Yes to both, with one gap.
- On screen: wheels that touch spin opposite ways (hung and connected wheels turn, partly connected chains visibly counter-rotate), the pawl's arrow is drawn at the output, it goes red when the train arrives the wrong way, the train shudders and a line fires once.
- Taught: the bench has no hazard and has exactly the mistakes a player makes. One wheel on the top peg reaches the output and goes the wrong way (the bench has 3 single-wheel placements: 1 wrong-way, 2 nothing). Two wheels: 1 right, 2 triangles that lock ("Three that all touch can't turn at all"). Then the shaft is the same parity with a size rule, and the belfry extends to four. Each step adds one thing. This is a good ramp.
- Gap: when the train is held (wrong way or locked) the whole train stops (`wheels.js:281`) so the counter-rotation, the thing that shows why, disappears at the exact moment the player needs to see it. NICE fix: keep it turning at quarter speed while held, or flash small arrows on each wheel for the 500 ms judder.

**The bell chamber: puzzle or trial and error?** A small puzzle with an obvious answer. From `trainState` over every placement of four wheels on seven pegs: 35 placements, **6 run**, 16 lock (triangles), 13 reach nothing, 0 are merely wrong-way (with four wheels the parity is always right; wrong-way only shows with three). No placement with fewer than four runs. So: the "even count" hint is true, and the answer is "the low row, four in a line"; the top row of three is the one tempting wrong way. Thinking beats brute force by a lot: a thinker is done in 2 attempts (try the top three, judder, "count again", lift and use the low row), roughly 10 presses. A random guesser needs about 35/6 = 5.8 placements at about 8 presses each, about 46 presses, and 13 of 35 give no feedback at all. It will not be solved by accident but it is not hard. Honest verdict: the interesting part of this room is carrying the four wheels from four places (floor in the bob's swing, joists, two on the gallery, hang only from the floor), the puzzle is the short second half. For the gentlest dream that is the right size. One more thing the gamer will want: the six solutions come as three mirrored pairs, so there is no "second solution" surprise.

**The orb on the doorstep vs the hilltop.** Better. The hilltop ending paid off the strike but not the person. The doorstep pays off the person, and the walk home is a victory lap through the lit town, about 11 s of running, with Nell in the middle. Cost: after the climax the player is locked for about 25 to 30 s across `seven_struck`, `green_lit` (about 14 s of waits plus Nell's walk) and `at_his_door`, with a walk between. Fine once; the second play will feel it. NICE: let the player walk on during `green_lit` after Nell's first line ("You're late, Ansel." / "I know." can play as barks as Jo moves off).

## Gamer answers

**Softlocks, in order.**
- Wheel on back after Continue: fixed per report. I read `sync` (`wheels.js:151-163`); it is right.
- A door with a wheel: not a softlock (`wheels.js:258`), see S5.
- A dropped wheel in an unreachable spot: I found none. `drop` puts it on the first floor under Jo's feet at his x (`floorUnder`, ladders are not floors), and every such column on the shaft, the belfry and the clock house has a floor Jo can reach. At the chain the wheel always comes to rest on plank B (col 14 is B's last column) even when Jo is shoved off the edge, which is the S1 detour, not a lock.
- A wheel set on a peg that fouls (shaft): the small wheel on p1 does not touch the drive (8 px gap, no turn) and the big then fouls at p2 and stays on his back. Solvable: walk 41 px or more from p2, the "set it down" prompt appears, lift the small, hang it on p2, then the big on p1. Not obvious but findable, and S8's wording helps.
- Both branches of the choice: both reach `at_his_door`, which now unlocks input before the talk (the fixed bug). "Go home" sets `home` at once, so the orb appears while the camera is still pushing in; it should be fine. I could not find a state with neither `keeper_goes` nor `keeper_stays` after `keeper_why`; the choice has no cancel.
- Bench: pegs and wheels are dead until `met_keeper`, so a player who walks to the wheels first sees no prompt. The caption bark and objective cover it; PLAYTEST whether people notice.

**Is any verb still "press when the marker is in the zone"?** Yes, three: S3.

**Touch.** S6 and S7. The single E button works by construction (`Interaction` is one nearest-item rule). Empty pegs are only active while carrying and hung pegs only while not, so "hang" vs "lift" never collide, and occupied pegs do not steal the choice. That part is clean.

**Smaller things worth knowing.**
- NICE: when a held train is released the wheels jump to the new angle (`wheels.js:281-284`, `base` switches from the frozen `t.angle` to `ctx.state.angle`); one frame of pop. Advance `t.angle` while held and only freeze the drawing, or ease it.
- NICE: `dream.js:2` header still says "Jo has always wanted to be the one who keeps a town's time". The dreamer is Ansel now.

## What is fine, and I checked

- The chain pendulum number (4400 ms) is a sound change: 760 to 1115 ms of slack.
- The shaft's solution is unique and its geometry forces it (big at p1 only, small at p2 only; the test at `geartrain.test.js:101` holds). The top of the ladder lands next to p1 and p2, 16 and 40 px away.
- The wheel pickup spot on the floor sits 16 px off the pivot (x 416 vs 400), which is deliberate and works: standing east of it, the hit zone is a 13% slice of the swing.
- Ansel's walk home, the door beat, the orb, the lane window, Nell's "Slipped, I said. It's what you say." all work together; I found no continuity error among them.
- The `pendulumToll` rule "never the last heart" is correct as far as it goes; M2 is about what is left over.
- No wheel-related state survives a quit in a way that can strand a run.

## Playtest only

Whether people stand on the right peg on touch (S6); how the gate at the bell chamber door side feels (690 ms slack is the tightest in the dream, on its fastest pendulum, with a wheel to pick up inside the swing); where the bots' extra knocks come from (S1); whether the half-minute of locked beats after the strike feels like a reward or a wait; whether the confession's nine boxes feel long after 80 s of wheel work.
