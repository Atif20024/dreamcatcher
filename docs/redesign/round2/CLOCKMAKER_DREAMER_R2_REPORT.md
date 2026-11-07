# THE STOPPED HOUR, fix round 2

Against `docs/redesign/advice/clockmaker_dreamer_review.md`. **No person has played this.** Sound is untested (dev is silent); the count's `tick` has not been heard.

The review lives only in the main checkout (it is untracked), so it is not in this branch.

## What changed

| Item | Now |
|---|---|
| M1 | Copy fixed: supper on for six, a table for two; she went at half past six; he came down at seven; he went back up *after*, took the gears off and put the hands back to six, so "it does not get to be seven" follows. The last clause (the hands) is mine, not the review's: without it the gears come off after seven and the clock would not read six. The nine boxes are now three conversations with two looks between: the camera drops to the wheels Jo hung, turning under the gallery, then rises to the silent bell. No new art. Doc updated. |
| M2 | `pendulumToll` is gone. A knock is a shove, a shake and a dropped wheel: no heart, no coins. The playthrough checks hearts at the end (`knocks-cost-no-heart`). |
| S1 | The scenario logs each knock (see below). One real spot fixed: plank B runs two tiles further (x 2-16). |
| S2 | In "Strike it with me" he calls each stroke at the top of the swing: a big number by him, his name and the word on the caption bar, and a ring that closes on the number with the bob, lit when the window is open. His body dips on each stroke. The hint reads "[E] on his count". The number is called again until it is struck. The engine and its windows are untouched. "Go home" has none of this. |
| S4 | `bell4` is at tile 20 on the gallery, clear of the door. |
| S5 | Through a door: "I left the wheel where I found it. It belongs to that wall." |
| S6 | Carrying within 60 px and in reach of a peg, Jo walks (`walkByDefault`; Shift still inverts it). A faint copy of the carried wheel sits on the peg [E] would use. |
| S7 | `{act1}` in a conversation line becomes the live label, the same `input.label('act1')` as Interaction's prompts: [E] on keyboard and touch, [X] on a pad. One line in the shared `SceneBox`; no other dream's text uses the token. |
| S8 | Three copy slips fixed. |
| Held train | It now strains: winds up slowly about 14 degrees, snaps back, with touching wheels going opposite ways. The release no longer pops, because a train's angle now only advances while it runs. |

Not touched: the dial, gear 3, the strike's verbs (review S3, for the owner).

## Where the review was off

- S8 places the objective in `beats.js`; it is in `dream.js`.
- S1 estimated the chain's right shove at about 43 px. Measured, Jo lands at x 515, about 51 px out. The conclusion stands.
- The other claims checked out against the code.

## S1: where the knocks come from

**It is bot behaviour.** Across three logged playthroughs: 11, 12 and 13 knocks. The per-knock list for the last two is in the scenario's detail. In the last, all 13 were at three gates: the shaft floor (5), plank A (6), the bell chamber floor (2). **None were on the chain.** Three things cause them:

1. **The bot waits inside the swing.** `watchBob` stands wherever Jo is, including under the bob after a shove (speed near 0 at knock: 4 of the 13).
2. **It goes at either end of the swing,** whichever comes, so half the time the bob is on its way back into him at run speed (speed 280 at knock: 8 of the 13). A person would go after it has passed.
3. **In the bell chamber it never waits at all.**

So the numbers are not a human estimate, and no gate needed retuning because of them. The first log line I wrote read positions from the `postupdate` event and gave wrong positions; the log now wraps `knockback` itself, so it records the moment of the knock.

The chain's right shove is real, though the bots never hit it: Jo cleared plank B's end at x 480 and fell to plank A, leaving the wheel on B. With B longer he lands on it either way (`chain-shove-right`, `chain-shove-left`). Nothing else about the shaft moved, no pendulum included.

## Length (a bot's number)

| Run | Game time | Knocks |
|---|---|---|
| No reading, "go home" | 4.3 to 4.9 min (three runs) | 11 to 13 |
| No reading, "with me" | 5.1 min | not recorded |
| Reader's pace | 6.9 min (one run) | 19 |

The reader's-pace run was up from 5.8 to 6.4 min: the two looks add about 8 s, walking at the pegs a little, and this run took 19 knocks against 11 to 14 earlier, with the shaft at 145 s against 100 s. One run, so I would not read much into it.

## Checks, on a cleared save

vitest 642 passed, 39 of 39 Test Files; lint:content, lint:rooms (no warning in this dream), lint:scale and `vite build` clean.

Scenarios, all pass: `clockmaker-wheels`, `clockmaker-playthrough`, `clockmaker-choice-stays`, `clockmaker-length`, `clockmaker-shaft`, `clockmaker-door`, `clockmaker-coins`, `clockmaker-talk-on-e`, `clockmaker-seam-dip`, `clockmaker-perf`, `clockmaker-board`, `clockmaker-alias`, `restart-checkpoint-clockmaker`, `restart-dream-clockmaker`, `dream-packs-cover`, `slope-clockmaker-yard`, `scale-clockmaker`, `readability-clockmaker`, `dream-seams-dip`, `scale-evening`, `dialog-key-label`.

`tests/dream-checks`, `geartrain` and `tuning` gained `GameObjects.BitmapText` in their Phaser mock, because `clockwork.js` now imports `uiText`. `tuning.test.js` had no mock before.

## Seen in screenshots, and not

Seen, as stills: `bell4` on the gallery, the ghost wheel at a peg, the look at the train with Jo and Ansel in frame, the count with its ring and caption.

Not seen in motion, checked only by numbers: the strain, the ring closing, the bell look's framing, the walk at the pegs.

## For a person to judge

- Whether the count reads as "follow him" while the eye is on the plate. The number sits up and left of the plate, over a lamp post, about 100 px from Ansel.
- Whether two locked looks of about 4 s help the confession or get in its way. They cannot be skipped.
- Whether the strain reads as "held", or looks like a train that is nearly working.
- The strain is silent after the first clack. I did not loop a sound I can't hear.
