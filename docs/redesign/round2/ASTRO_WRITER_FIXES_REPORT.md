# Astronaut and Writer: every MUST and SHOULD

Specs: `docs/redesign/advice/deep_review_chef_astronaut.md` (Part 2), `docs/redesign/advice/deep_review_writer_musician.md` (Part 1). No rebuild was needed. The Writer keeps its length. Built without a browser or a server: proved by pure tests (`tests/writerFixes.test.js`, `tests/astronautFixes.test.js`), room lints and code reading. **Nothing here has been played or heard.**

Checks: vitest 375 passed, lint:rooms 0 failures (11 existing warnings), lint:content 0, lint:scale clean, vite build passes.

## Writer

### W-M5, done first: did the city's labels block progress?

**No.** The city has no gate. The ledge is a 4-tile jump and the crane moves at 40 px/s either way. But they could not be solved: "fast" existed nowhere, and the bag wiped "wide". Only the dev warp had them.

**The same check found two more dead labels the review missed.** The copy shop's `hot rollers` and `slippery spill` wanted "cold" (library) and "dry" (café), both rooms past the point of use.

And one real softlock risk on hard: the satchel cap (6) could drop "lit" before Jo reached the alcove, and without that source `research`, and so the dream, could not finish. A full satchel now never drops a word a required edit still needs (`dropIndex`).

| Item | What I did |
|---|---|
| W-M5 | "fast" from Isolde at the end of d5 (the review's line). "wide" on a torn billboard on rooftop B, before the ledge. Kept the ledge rather than deleting it, because you asked for it solved. Warp no longer gifts "wide". "cold" and "dry" now pick up in the copy shop. **Test:** every label's word has a source in its room or earlier, and past the theft only a source after it (or a kept word) counts; spoken words are checked against the scene's real `addWord` calls. |
| W-M1 | Pen opens on index 0. A wrong word costs one ink, shows for 1.4 s, does not take, and gets a per-noun line (`wrongWordLine`, also W-N3). "honest" and "again" have their own forms: "an honest crane. it admits it's still slow." A solved label no longer offers the pen. This also prevents a softlock: a wrong word sticking on the typewriter would have hidden the pen behind the desk prompt for good. |
| Pen after the theft | Ink refills at the theft. New label in the rain: `lying timetable` wants "honest" (the one word she told him to keep), pays 3 coins, and the Editor reverts it walking past, which shows what the Editor does. Then ledge and crane. |
| W-M2 | One line per desk: `+7 pages — 18/24 clean. 3 typos.` Once: "Typos keep. They'll be waiting at the printworks." Caps: 3 per desk, 8 carried. Keys more than 400 ms from any letter are ignored. Pages = `desk × (0.75 + 0.25 × accuracy)`. |
| Gates | **10 / 25 / 50**, not the review's 11/27/55. At 0 hits the desks pay 47 in all, and a desk once sat could not be re-sat, so the review's numbers could lock a poor typist out. Desks can now be redrafted: best counts, each redraft gains at least 1 page. Flag names stay `pages12/30/60` so saves and warps keep working. All visible text updated. |
| W-M3 | Desks type the book: desk 1 the first sentence of FIRST_PARAGRAPH, desk 2 and 4 most of PAGE_THREE, desk 3 the napkin. **One word = one key:** the letter falls with the rest of its word trailing, and the word prints at the foot of the box; a miss prints with two letters swapped. Word counts 20/24/26/28, against 16/20/24/28 letters before. The page-three modal now says "The paragraph you typed in the copy shop." |
| W-M4 | Card `noise` (MAKE A NOISE, Q) by zone at the first talker and at the dog. `g_dog` says "(Q)". **Also:** touch had no Q at all, so the dog gate was a hard block on phones; the café now shows a Q button. |
| W-S1 | Review's rent lines (names check out). 12 coins go to her, never below zero, and Tomasz says "Rent's paid, then." |
| W-S2 | Machines 5 and 6 no longer count; they float "and one more, for luck." |
| W-S3 | Three captions after the fade, objective "the rain. keep walking." The third caption uses the real count (`48 pages.`) because slips can bite, instead of "Sixty pages." |
| W-S4 | Bench on a kerb, a puddle dip, a bus stop plinth; no hazards. Flat Editor 40 to 70 px/s, halt kept. **Added:** the Editor no longer erases page three, and a player who never chooses now reads "Kept." It said "Cut." before, which at 70 px/s would have been common. |
| W-S5 | Tomasz on a crate, the hat man at a table by the espresso bar (moved off CP2a), the landlady on the stair, all seated `wr-p-*-sit`. |
| W-S6 | Editor removed from the city. **Differs from the review's col 540:** moved to the press with `from: 561`, past the typo desk and ladder, and it walks away at the PRESS lever. At col 540 it reaches the ladder in about 3 s and catches every climber; left running, it would walk through Jo when web 2 doubles back. |
| W-S7 | "fixed" is now on the ground talker at x155, "awake" on the mezzanine. |
| W-S8 | Wren's line before the napkin, first time. |
| W-S9 | Beds `copyshop`, `cafe` (loudness follows the noise meter), `press` (down a step per lever), plus `library` and `post`. New shots `copier_thunk`, `murmur`, `press_roar`. `PlaceAudio.loudness` is one additive line. |
| Opening objective | "the attic. the blank page." no longer overwritten at the start. |
| Rain silence | `music.stop()` only clears boosts, so the band played on at the room's `quiet` mix. The rain now mutes for real (`setMix({})`), cleared at the attic. |
| Balance notes | Pigeon: covered by gate slack. d2b and d4 no longer claim "Thirty" or "Sixty"; d4 says the real count. |
| Kept as listed good | Copy shop, talker's word opening the gate, library sources, page-three choice, the bag cut, the flat, the moment texts, the ending. |
| NICE not done | W-N1 (Emmerich as the Editor), W-N2 (typing on the band's beat), W-N4 (four talker sprites), W-N5. W-N3 came with W-M1. |
| Not changed | The landlady is still both a foe with a sight cone and a conversation (table note, not on the MUST/SHOULD list). Tomasz's "four jammed" while the room has five jammed machines. |

## Astronaut

| Item | What I did |
|---|---|
| A-M1 | **Decision:** the first attempt always ends in `rejection()`, on every branch. Trained and passed hears: "Your numbers meet the minimum. We have one seat this intake. It is not yours." Short on stats hears the Board plus Halvorsen's list. `statsReady` still does its job: it gates the door at attempt 2, sets the objective in the second year, and picks which line plays. Stats persist, so a diligent player goes straight to "the numbers are there." The verdict is a still frame: three silhouettes, three red blinks, one stands. Fixed a duplicated d_rejected. [Esc] from the Board is now walking out, not a rejection. |
| **Grey overlay bug** | The grey-year overlay (40 %, depth 89) was never removed: every rejected player saw it to the end of the dream. With rejection now universal that would be everyone. It fades when he is selected. |
| A-M2 | `d_moon` from Osei once at the airlock before the descent; objective "the airlock. Osei is calling." **Rewrote the review's lines:** Priya was on comms at the hatch minutes earlier, and she is not with the core, so Osei says she went down after the probe's core "since you started on that hinge". |
| A-M3 | g1 "THE PHYSICAL · Dr. Halvorsen"; study objective "the physical, then the Board", then "the Board. Thursday." Opening objective no longer "reach 3 pips". |
| A-M4 | "the training campus is through the gate", in scene and rooms. |
| A-S1 | When the shelter goes up Priya drops where she stands, with a sound; she stops following and the E prompt moves to her. **Line differs:** "You carried me out of there." The review's "through the whole forest" is also untrue at about 11 tiles. Reply and Osei unchanged. |
| A-S2 | Six keyed questions, then a dialogue choice (review's text) with no strike; only the reply changes. `gave_seat_twice` adds "He'd have given it away twice." to the ending. |
| A-S3 | On hook 3, past it: telegraphed streak, Osei's warning, 0.9 s later the line parts. 2.2 s to clip, "clip!" and a ring on hook 4 (only fires within 6 tiles of it; reach is 6.5). Miss it in free flight and it is the real drift, a heart; holding the hull, "the hull held you." Re-arms after a miss. The teaching net is untouched. |
| A-S4 | Order gone from the modal, [Esc] named as the way to go and read it. **Instead of a camera nudge:** a ring and a line on the plate at first approach (the camera follow is shared code). |
| A-S5 | "EST. 1974 · LANE 1", and the Board's source says "the sign over the pool lanes". |
| A-S6 | Bar over Jo, Halvorsen reads the real numbers and the minimum, clipboard lights. Better lungs now mean a shorter hold. |
| A-S7 | `gym` bed (speed bag, rope, whistle, ball, pool) on the three gym rooms; a kick via `hum` in the astronaut band, raised only in those rooms and cleared on shutdown. `p4_eva` and `p5_*` have no bed, `p6_field` has `green`. Test: every room of the dream is in the table. Grey year holds real silence until 2.6 s after TWELVE MONTHS LATER. |
| A-S8 | Rounds run 1, 2, 3 by Nerve, Priya is 4. The gym rat, the southpaw (40 % feints), the old pro (blocks a jab from a crouch), each tinted. One more bout than before, but 3 pips is still reached after two. Same rat sprite, tinted: no new art. |
| A-S9 | `cards_done` is alive: 4 of 5 buys one strike back. Five cards, the Board's own. `rejectedTwice` deleted. |
| Wind-up | `windupChance(delta)`, same per second at 30/60/144 Hz, 0.012 at 60 Hz. |
| Kept as listed good | Track, pool, props, Adaeze, notebook, Osei's copy, crater, field, "...Good", the stat-per-room design. |
| NICE not done | A-N1 (deleted instead), A-N2 to A-N5. |
| Not done (Part 3 note) | The core is lost if Jo is hit (`dropCarry`, no pedestal). Nothing checks for it afterwards, so it is not a lock, but d4's "...Yeah." would then be untrue. |

## Rerun in a browser

- **Writer:** `writer-ladders-both-ways`, `readability-*` (the typing box is taller, with new text), `bark-one-at-a-time`, failure scenarios for `writer`, round2 and phase2 per-dream ones, touch scenarios (the new Q button), audio mix.
- **Astronaut:** `eva-tether-trap`, `astroPool`, feedback3's notebook, round2flow, wp6, phase2 `jo-float`.
- **No scenario exists yet, play by hand:**
  1. Train to 3 everywhere, pass: verdict, seat line, grey year, second Board, selected, grey lifts.
  2. Forest: Priya drops; her pose and the prompt.
  3. EVA strike: hit it, then miss it.
  4. Ring rounds 1 to 4.
  5. A whole typed desk: falling words, wrapping at the foot, overlap at the box edge.
  6. Wrong word on the typewriter, then the right one.
  7. Rain: hops, timetable, Editor reverting it.
  8. Press: Editor from the feed plate, gone at PRESS.
  9. The three staged moments.

## Unverified

- Everything by eye or ear: bed levels, the kick against the band, the new shots, whether the silences hold.
- Sprite placement: the crate perch, table, bench, bus stop and puddle art, seated figures, the timetable label's reach from the ground.
- Whether the flat at 70 px/s is fair, and whether the press chase feels right (Jo on web 1 against the Editor and rollers).
- Whether the rain hops really cost a pause: the Editor still walks slower than Jo runs.
- Priya's rotated pose against her stride rig (`setAngle` on a foot-pivot sprite).

## Round 2

Asked to work from `docs/redesign/advice/astro_writer_review_r1.md`. **That file does not exist** in the main checkout, this worktree or git history, so M1, S1, S2 and S3 were taken from the one-line descriptions in the request and verified against the code. The NICE items arrived afterwards in a message from the coordinator; they are in the second table below.

| Item | Verified | What I did |
|---|---|---|
| M1 | Real, and older than round 1. Picking Priya up hid her sprite, the pick-up prompt required that sprite to be visible, and a catch or respawn runs `dropCarry`, which clears the carry and never shows her again. The alarm fix and the winch both need her carried, so the finale could not be finished. | One pure rule, `priyaLiesInCrater(F, carrying)`, drives the sprite, the light and the prompt every frame. This also covers a resumed run, where `rescue_on` is saved but the sprite started hidden. The objective says "the crater. go back for her."; picking her up again with the alarm already off says the winch. Unit test on the rule, plus source checks that the scene uses it. |
| S1 | Real, mine. The snap took whatever line was current, so a player who obeyed "clip the next one" during the 0.9 s telegraph lost the new line. | The strike only cuts the hook it was aimed at. Clipping ahead in time is the dodge: "the old line goes. yours holds." The one-time strike stays spent. |
| S2 | Real, mine. "The questions were never the problem." also played after a failed quiz. | Failed quiz: "The answers, and then the numbers." The old line now plays only after a passed quiz. |
| S3 | Real, and listed under Not changed above. The room has six machines: five jammed, one empty; four take the pen. | Tomasz: "Six machines. Five jammed, one empty, one queue. Fix the four on the floor, kid. It pays in pennies." Test checks the line against the room data. |

Rerun or play in a browser: `eva-tether-trap`; get caught carrying Priya in the crater, then go back for her; clip ahead during the EVA streak; fail the first Board with short stats. The core is still lost on a catch.

### Round 2, the NICE list

| Item | Verified | What I did |
|---|---|---|
| N1 | Real: the Editor reverted the timetable with no word said. | A float when it reverts: "lying, again. what it walks past, it takes back." It sits on the label, or over Jo if the label is off camera, since he may be up the fire escape by then. The edit itself costs almost nothing: the menu stops the clock (N2) and neither a right nor a wrong word locks Jo. Left where it is. |
| N2 | **Already true, no code change.** `Labels.open` sets `puzzleActive`, `handleModalUpdate` then returns before `ed.update` runs, and `InnerEditor` also checks `puzzleActive`. | Pinned with a test. |
| N3 | Real. **Also worse than listed:** no modal is up during the verdict or the fade after the letter, so [E] at the door could open a second Board. | Controls locked for the verdict and the fade. The door's prompt is off while a Board visit is running (`boarding`). |
| N4 | Real: the pennies are coins on the floor, so Jo could say "all here" with none. | `rentScene(paid, rent)` has three versions: all of it, some ("5 pennies. I heard the machines. The rest by Thursday."), none ("I seem to have left them on the floor."). She still accepts in all three, so the gate does not hang on coins. Tomasz: "Rent's seen to, then." |
| N5 | Real. A one-liner plus a small helper. | `applyRunExtra` calls `greyOverlay()` when `rejected` and not `selected`. |
| N6 | Real: Esc resolves `false`, which floated "false/5". | Returns early, with no float. |
| Winch | **My finding was wrong as stated.** The crater is `phys: 'moon'`, and `moonPrep` turns gravity back on every frame, so gravity was never stuck. **The real bug:** `reeling` stayed set after a catch, and with [F] held, a respawn above the rim line (the crevasse checkpoint, if the crater's is unlit) would play the rim scene and mark Priya safe with nobody on the line. | `dropCarry` ends the reel (and restores gravity). |

Play in a browser: the timetable revert, seen from the ladder; Esc from the cards; all three rent versions; [E] mashed during the verdict; a resumed second-year run; a catch during the reel. None of this has been played.

## Browser check

Run on this branch merged with `redesign` at df0384e (merge clean, teach-card count and `places.js` needed nothing), in one tab on port 5183, sound off. The first look found real bugs; every line below is on the final code. `failure.js` covers Chef and Writer only, so the Astronaut's failure path was driven by hand (Priya, the drift, the hull).

### Found and fixed

| Bug | Evidence | Fix |
|---|---|---|
| **The press chase could not be won on the first pass.** Off web 1's east end Jo always missed web 2: 24 tries, run or walk, jumped or steered, landed on web 3, the floor or back on web 1 (which also ended in a hazard tile). Going back west to the ladder meets the Editor at col 563, 1.9 s in. Forced catch, for every player. The old route only worked because the Editor started in the city, far behind. | `__dc` drive | Web 1 ends at col 581 over web 2; hazard at col 591 removed. Web 2's east end still drops to web 3 for FOLD. |
| **The Editor woke on the floor.** Walking the floor past col 561, unfed, started it behind Jo with the only ladder on its side. | drive | It starts only once the Draft is fed, as the room's comment already claimed. |
| **The floor the Editor erased stayed gone** after it left at PRESS (gantry, and a trench by the ladder). | `s.erased` | Restored at PRESS. |
| **The city's gaps were a trap.** With the Editor gone from the city, nothing brought Jo out of the three gaps between the roofs: no way up, 6 minutes on the clock. | drive | A fall below row 30 there costs a heart and returns him. |
| **"narrow ledge" could not be reached with the pen** from the roof (64 px reach, nearest 66). | drive | Label one column west. |
| **Riding the crane threw Jo to its trailing edge.** Scene code and Arcade friction both carried him: +33 px/s against the crane, then hung by the last pixels. | drive | Scene's carry deleted. Rider's offset now holds at 40 and 150 px/s. |
| **Standing foes sank a whole tile** (all talkers, the landlady): a rig spawned with feet 8 px into the floor passes the separation limit. Their word bubbles fell in standing reach, so "jump for the word" was never needed; the "awake" talker fell off the mezzanine (W-S7 was not true). | positions, screenshot | `addFoe` lifts the feet to the tile's foot; that talker spawns on the plank and collides with one-ways. Words now take a jump. Shared code: this applies to every dream's foes. |
| **The pen opened on the answer** on every machine, since "working" is always first in the satchel. | drive | Starts on the next word when the first is the answer. |
| **Typing box header overprinted itself** (label wider than the box, over the counter). The prompt also stuck out under the box. | `aw_typing_box` | Box 480 wide, shorter label, prompt hidden. "+1 page" singular. |
| **"Clip the next one" clipped the same hook.** `[F]` takes the nearest, which at the strike is the hook being cut, so obeying still lost the line. | drive | The aimed hook is out of `[F]`'s choice until the strike re-arms. |
| **Stale objectives.** Rent paid at 4 pages said "the café" (the room data beat the scene's desk line). Picking Priya up again still said "go back for her". | drive | A list of flags in `roomObjective`; a pick-up always sets the objective. |
| Restart inside the Editor's wipe left `blanking` set, and no catch ever fired again. | drive | Reset per run, with `desks`. |
| Two scenarios were false: `panel-frame` passed only on a leftover panel (the pause menu never carried the flag), `slope-writer-attic-stairs` flaked once the landlady stood on the floor (her patrol reaches the stair foot). | repeats | Flag set; foes passive in slope runs. 4 of 4 after. |

### Scenarios

| Scenario | Result |
|---|---|
| `astro-first-board`, `astro-priya-carry`, `writer-pen-gates`, `writer-press-route` (new, `astroWriter.js`) | pass |
| `writer-ladders-both-ways`, `ladder-jump-writer`, `readability-writer`, `readability-astronaut`, `bark-one-at-a-time` | pass |
| failure set: `hit-knockback`, `zero-hearts-checkpoint`, `checkpoint-label`, `continue-run`; `restart-dream-writer` | pass |
| phase2: `jo-walk`, `jo-skid`, `jo-turn`, `jo-jump-arc`, `jo-land-soft-hard`, `jo-float`, `jo-foot-slide`, `jo-route-writer`, `jo-route-astronaut` | pass |
| round2: `slope-writer-arrival`, `slope-writer-attic-stairs`, `shadow-jump`, `shadow-gap`, `shadow-slope`, `shadow-places`; `scale-writer`, `scale-astronaut` | pass |
| `touch-walk-jump-talk`, `eva-tether-trap`, `astro-pool-scale`, `astro-pool-hoops`, `reading-panel` | pass |
| round2flow (4), wp6 (7) | pass |

### Driven by hand

| Flow | Result |
|---|---|
| Pen menu, wrong word | pass. Costs 1 ink, 1.4 s on the thing, its line, does not take; "honest" and "again" forms read right. |
| Desk | pass. No keys: +3, `0/20 clean. 20 typos.`, carries 3, "Typos keep" once, `redraft it (3/4 pages)`. Redraft, all hit: +1, done. |
| Page gates | pass at 10, 25, 50, shut one below. |
| [Q] card, dog gate | pass. Card on entering the café; gate blocks at col 175.6; Q wakes the dog, adds noise, gate opens. |
| "fast" from Isolde, "wide" from the billboard | pass. Both words picked up. Ledge solves, tiles solid, walkable. Crane fast: 1.77 s a way against 6.4 s. The ledge's 4-tile gap is also jumpable (8 tiles measured), so it stays optional. |
| Lying timetable | pass. Reachable from the ground, menu stops the Editor (0 px in 1 s), 3 coins. Revert and its line seen from the ladder at row 26. |
| Three rents | pass. 20 coins leaves 8, 5 leaves 0, 0 leaves 0, never negative; Tomasz's line; flag set in all three. |
| Esc from the cards | pass. Closes, no float. |
| First Board, trained and passed | pass. Verdict, seat line, grey year, second Board, selected. |
| Failed quiz, short stats | pass. Numbers listed in the objective; door refuses a second attempt until trained. |
| [E] mashed in the verdict and the fade | pass. Nothing opens, no drift. |
| Second-year resume | pass. Grey back, objective and stats kept. |
| Grey lift at selection | pass. Fades in 1.8 s, gone. |
| Osei | pass. Once, at the airlock, before the descent. |
| Priya: caught, going back, a catch in the reel | pass. She lies there again with the prompt, "go back for her", reel ends with gravity on, no rim scene, including a respawn above the rim line with [F] held. |
| EVA streak | pass. Clip ahead holds; missed in free flight 2.07 s then the drift and a heart; on the hull, no heart. |
| Gym bed by state | pass, state only. Gym bed and hum 0.8 in the gym, 0 under the grey hold and on leaving; no bed on EVA or crater; green on the field. Not heard. |

### Fairness, in numbers

Jo runs 280 px/s, walks 120. Editor 168 (210 on hard).

- **Rain:** 44 tiles in 4.8 s, Editor then only at col 349. Lead never below 134 px (0.8 s), at the mark, then it grows. A 1 s stop at both the bench and the bus stop is safe; 2 s at the bench is caught. Fair, but the hops barely cost anything: the threat is stopping, not the terrain.
- **Flat (70 px/s, computed):** 14.4 s for the Editor to reach col 458, plus 2 s per real cut; Jo crosses in about 4 s. Fair and quiet. Not raced by a bot.
- **Press:** the Editor reaches PRESS at 5.9 s. With the fix Jo pulls it at 2.5 s (3.4 s of slack), 2.1 s after a 2 s dither at INK, 0.5 s after 4 s. Tight enough to feel, with room to fumble once. An untimed roller at col 575 hits about half the time and only knocks back.
- **Idle Editor at col 553:** fair. Invisible and inert until the feed.
- **Landlady at the attic stairs:** running or jumping past is clean; walking gets caught at col 67.

### Not fixed, larger or a call for you

- **Getting to FOLD is awkward.** Off web 2's east end Jo must steer back onto web 3; holding right lands on the floor past it, and the walk back is ladder, web 2, again. No lock (Editor is gone, only the Friday clock), but it is a re-climb. A hop from the ladder cannot reach web 3 (rows 26-27 pass under it, 23-25 land on web 2).
- The Editor's erase reaches the ceiling row and gantry too (the "top tile of a column"). Harmless now that they return at PRESS, but visible.
- The crater is very dark and Priya hard to see without the light; her pose reads fine at that size. Jo's hat is not dimmed with him there.
- The verdict's silhouettes are low contrast, near black on near black. Deliberate-looking, your eye to judge.
- Bed birds keep going in the grey year's "real silence" (campus bed): music is silent, the bed is not. Not heard, read from state.
- `failure.js` has no Astronaut row.
