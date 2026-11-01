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
