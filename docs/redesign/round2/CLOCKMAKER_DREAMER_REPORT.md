# THE STOPPED HOUR: the dreamer and the wheels

Design: `docs/dream_clockmaker_dreamer.md`. **No person has played this.** Everything below comes from scripted runs, unit tests and a few screenshots. Sound was off (dev is silent).

## Who, and what

- **The dreamer:** Ansel Dunmarrow, 74, keeper of the clock for forty-one years. He took the gears off himself: if it never strikes seven, he is not late home to his wife Ida, who died at half past six while he was up winding.
- **The new action: hang a wheel.** Jo takes a brass wheel on his back, carries it where he can go, and hangs it on a peg with [E]. Wheels that touch turn each other the opposite way; a pawl lets the last wheel turn only one way; three that all touch lock. No timing bar. Works through the existing E button and d-pad.
- **Taught, then tested:** his bench (no hazard, he explains the pawl) → the shaft (a big and a small wheel carried past the pendulums; a knock drops what Jo carries) → the bell chamber (four wheels, seven pegs, an even count).
- **The choice** comes under the bell, after he says why. "Go home. I'll strike it." or "Strike it with me."

| | Go home | Strike it with me |
|---|---|---|
| The rope | He walks down the hill as Jo strikes, lamp by lamp | He stands at the rope and counts the strokes aloud |
| The green | "I know." | "I know. I had a second man on the rope." |
| His door | He has gone in; the door is on the latch; nobody saw | He waits, and asks Jo to stand there till it is shut |
| Ending, second line | "Nobody saw him go in." | "...and someone saw him do it." |

- **The ending:** the orb is on his doorstep in the lane. Catching the dream is letting the hour end.

## What changed

- `src/engines/geartrain.js` (pure, Node-tested) and `src/dreams/clockmaker/verbs/wheels.js`.
- Each place keeps its goal and gains something: the lane has his house (table laid for two, a Small Moment), Nell warns about him, the pie is Ida's receipt, the watch man's second line, a caged gear in the shaft.
- `npc-sh-keeper` in the clockmaker pack: an elderly body, his own `hitch` gait (a stiff hip), a task loop of turning a small wheel over in his hand.
- **Evening:** Ansel stands near Nell in the square, only if Jo saw him home (`save.met.ansel`, not boarding the train). Nell's lines are unchanged.
- `Npc` gained `walks` and `walkTo(x, speed, floorAt)`, used only here. Legs still go by ground covered.

## Decisions to check

1. **The orb moved from the hilltop to his doorstep.** Jo follows him west instead of walking back up the hill. The ending picture still looks at the town from the hill.
2. **One difficulty number moved.** The chain's pendulum went from 3400 to 4400 ms. `tuning.js` and every window are untouched. Measured at 3400 ms, the chain was clear for about a quarter of the swing, and the climb takes 1.5 s; with a wheel lost on each knock that was too hard for the gentle dream.
3. **The dial now waits for the bench train** (one wheel-hanging step before the first gear).
4. **Wheels belong to their room.** Going through a door with one sends it back to where it started. This was the simple choice, not a discovered need.

## Length (a bot's number, not a person's)

| Run | Game time | Knocks |
|---|---|---|
| No reading (skips each line), one wrong try at the bench, "go home" | 4.7 min | 15 |
| The same, "strike it with me" | 5.5 min | not recorded |
| Reader's pace (each line types out and sits), talks to everyone, whistles, looks in the window | 5.8 to 6.4 min (two runs) | 11 to 14 |

By room at reader's pace, last run: green 57 s, clock house 43 s, shaft 100 s, bell chamber 80 s, yard 22 s, lane 21 s, plus the lane before Nell, which that list leaves out. The 5.8 is that sum plus about 25 s for the lane: my probe cut the total off on that run. The 6.4 was printed.

The bot knows every answer, never looks around, and times the bobs by reading the clock. It never stops to think at the wall, and thinking is what this action adds. So a person should take longer than the bot. My guess is 7 to 10 minutes, but that is a guess: nobody has timed it. The earlier estimate for this dream was 3 to 4 minutes.

## Checks, on a cleared save

vitest 576 passed, 37 of 37 Test Files; lint:content, lint:rooms, lint:scale and `vite build` clean.

Scenarios, all pass: `clockmaker-wheels`, `clockmaker-playthrough`, `clockmaker-choice-stays`, `clockmaker-length`, `clockmaker-shaft`, `clockmaker-door`, `clockmaker-coins`, `clockmaker-talk-on-e`, `clockmaker-seam-dip`, `clockmaker-perf`, `clockmaker-board`, `clockmaker-alias`, `restart-checkpoint-clockmaker`, `restart-dream-clockmaker`, `dream-packs-cover`, `slope-clockmaker-yard`, `scale-clockmaker`, `readability-clockmaker`, `dream-seams-dip`, `scale-evening`. New ones: `clockmaker-wheels`, `clockmaker-choice-stays`, `clockmaker-length`; `clockmaker-playthrough` is rewritten and now does the climb and carrying for real (the old one skipped the shaft).

## Bugs the runs found (fixed)

1. **A softlock at his door.** The beat locked input and opened a conversation, and the box reads the same input, so nobody could ever finish it. Only on the "strike it with me" branch. A unit test now checks every beat for it.
2. **A wheel on Jo's back at a save** came back stuck on his back after Continue, because a run's flags are restored after the verb is created. It goes home now; `clockmaker-wheels` covers it with a real Continue.
3. **The ending's lines ran off the screen** and over the [E] hint; the picture is shorter now. Seen in a screenshot, and no scenario would have caught it.

## Seen in screenshots (the pane was hidden; shots still came back fine)

The bench train with a wheel on Jo's back, the shaft's train and cage, the bell chamber with Ansel on his chair, the yard with him at the rope, his window and open door with the orb, the ending card, Ansel in the Evening. Not seen in motion: his gait, the wheels turning, the judder, the knock's fall, his walk down the hill, the green beat. Those are only checked by numbers.

## What nobody has played or checked

- **Whether the wheels are fun, and whether the rule is clear** from the arrow and his two lines. This is the biggest open question. The bell chamber in particular could confuse.
- **The shaft's feel with a wheel.** Bots took 11 to 15 knocks a run and ended on 1 heart. Nothing can fail and knocks at 1 heart are free, but it may not feel gentle; if so, drop the wheel only on a second knock, or slow the bobs.
- **Choosing a peg.** Pegs are a tile apart in x and Jo picks by standing near one, with a ring showing which. Fine for a bot; fiddly on touch is possible.
- **Touch:** the same E button by construction; not run on a touch device.
- **Sound:** all of it. The judder uses `knock`, the train `tick`.
- **Whether Ida's death fits the gentlest dream,** which the station points first-time players to. It is told in two quiet lines, never shown, but the owner should read `keeper_why` in `dialogue.js`.
- **The higher tiers** with dreams already caught. Nothing new scales, but it was not run there.
- The wider scenario set, per the low-resource rule: named scenarios only.
