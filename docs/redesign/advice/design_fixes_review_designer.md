# Design review: the design-fixes round (designer's read)

Scope: `DESIGN_FIXES_REPORT.md` and the diff b7d237d..HEAD. Read from code and tests; nothing played. Where a claim needs a playtest it says so. Items the report lists as open are not repeated.

## MUST

### M1. Hearts and difficulty move in opposite directions after the second catch
- `src/systems/wallet.js:11-13` gives 3 + dreamsCaught hearts (cap 6) before shards. `src/data/tuning.js:4-5` stops at tier 2, so tier is flat from the second catch while hearts keep rising.
- Player experience: dream 1 is 3 hearts at tier 0. Dream 3 is 5 hearts at tier 2. Dream 6 is 6 hearts, plus tea (+1, `BaseLevel.js:128`), plus shard hearts (cap 8). Hearts go from 3 to 8-9 while the tuning stops at +16% painter speed or 86% window. The tables nudge timing; they don't touch hazards or foe damage. Late dreams therefore get easier to survive than the first, which is the opposite of the curve DESIGN.md §4 asks for. The report's own line "a dream picked late has more hearts too" admits this, but then says the table is "light on purpose", and the two effects don't cancel. Needs a playtest of a tier-2 dream at 6 hearts, but the arithmetic alone says hearts outrun tuning.
- Fix (smallest): cap the caught-dream hearts at 5 (`Math.min(5, 3 + difficulty)`), so shards and tea are what takes you to 7-8, and make tier 3 a real step (`tier` clamps at 3, one more column on each row in TUNING). Or keep hearts as is and add a tier-3 column for dreams caught 3+. Pick one; either closes the gap.

### M2. Older dreams (Chef, Astronaut, Writer) scale on a different curve than the four framework dreams
- `tuning.js:52` returns `1 + 0.08 * difficulty` for any dream without a table, and difficulty runs to 5 (`utils/save.js:34`). A Chef/Astronaut/Writer foe at five catches walks 40% faster, while a Painter foe tops out at +16% and a clockmaker foe never moves.
- Player experience: the same Jo is held to a plateau in four dreams and a ramp in three. Whichever dream you save for last gets a 40% faster Brann (80 -> 112) whose lunge is a fixed 150, so the dodge window also shrinks relative to his walk. `lunge.test.js` tests dodges at base speed only, so it doesn't catch this.
- Fix: give chef/astronaut/writer rows in TUNING (foePace [1, 1.08, 1.16]) so that all seven dreams use one tier function, and test `grabConnects` against the scaled pace as well.

## SHOULD

### S1. Tea at 20 and ticket at 150 are not choices
- `wallet.js:19`. Tea is a heart for a dream's first stretch at 20, against about 265 income per dream (1,855 / 7). Every sane player buys it every time, so it is a tax, not a decision. Ticket (150, 8% of income, once) is the same shape: at tier 2 with 5-6 hearts, the first wipe-out is rarer, so the ticket may sit unused until the end.
- The real decisions are shard-vs-hat-vs-postcards, and that is where 380 + 700 + 1,200 against a realistic 1,100 does bite (the economy test's 70% line is against the theoretical 1,855). OK as it is.
- Fix: tea 20 -> 40, and its value should rise with the run (e.g. tea buys a heart AND makes the first checkpoint free). Or leave tea cheap and let it be the always-buy; it is a fine tutorial of "coins buy hearts". Your call; if left, say so in the report.

### S2. Once the eight world shards are collected, bought shards do nothing at the cap
- Seven dreams carry 8 shard pickups (grep `type: 'shard'`; astronaut has two). 8 shards = 2 hearts, so a player who collects them all and has 6 caught-dream hearts is at 8 (cap) with no purchase. The 380-coin heart is only useful before the cap, which means the best moment to buy is early (60 coins for the first shard, trivial), and the later 120/200 prices are almost never paid by anyone who has been thorough.
- Player experience: a thorough player sees the shard price rise and decides the endgame shard is pointless, which makes the escalating 60/120/200 read as arbitrary.
- Fix: either lower the cap interaction (cap 8 counts shard hearts first: `min(8, shardHearts + min(5, 3+d))` with the base capped at 5, per M1, makes 6 shards = cap and bought shards useful until then), or say in Bilal's line when you're at cap ("You're full, friend.") instead of letting people pay 200 for nothing. Check `HubScene.js:1573` takes the money when `heartsMax` is already 8 now; it does.

### S3. The per-kind lunge difference is imperceptible
- `kinds.js`: lunge runs 130-200 over a 0.25 s grab, so the extra reach is lunge x 0.25: 33 px (130), 38 (150), 43 (170), 50 (200), 60 (rival). Between Brann (150), landlady (160) and proofreader (170) the difference is 2-5 px. Nobody can feel that. The character shows in the pace and the sight, not the grab, because all humans share a 0.4 s wind-up and the same tell.
- Player experience: the claim "after that it's character" is true in the numbers and false at the controller. What the player does feel: runners/scalpers/farmers (180-200) and the rival (240) reach noticeably further, so a walk-away that works on a porter fails on a runner. That is a fine rule. It should be on purpose.
- Fix: differentiate on wind-up length, which the eye can read (heavy kinds 0.55 s with a slower, longer lunge, quick kinds 0.3 s), keep `MIN_LUNGE` as the floor, and extend `lunge.test.js` to read `windup` per kind. Playtest first: a 0.4 s tell for all humans may be what keeps the game readable.

### S4. The Maren choice is cosmetic as built, and its flag isn't saved
- `WriterScene.js:794-797`: both answers reconverge on `d1_end` and the napkin; the only memory is `d1b_listening` ("Mr. Only Listening"). It reads as a choice, and it echoes once, which is fine for a small dream beat; just don't call it a branch. The flag is written straight to `this.F.only_listening` without `setFlag`, so a Continue between meeting her and the napkin falls back to the plain `d1b`. Low cost, easy fix: route it through `setFlag`.
- "Mr. Only Listening" assumes the player is Jo as a man; fine for Jo, but see how the line sits with the woman-led dialogue elsewhere. Minor.
- Fix: `this.setFlag('only_listening')` when the answer is "listening", and read `this.F.only_listening`. Optionally pay it off at the pen ("the pen's word"): Maren says the honest word is "listening" if they chose it.

### S5. "Maren" now sits among several M-names
- Marguerite (Chef), Marcus (Evening kid), Marenna Coast and Coppa Marenna (racer doc, `docs/dream_racer.md:9,102`), Maren (Writer). The racer's coast is a place, not a person, so it is OK in the game, but on the Station board, in credits and on postcards the Marenna/Maren echo will be read as a mistake. Cheap to fix on the place: rename the coast (e.g. "Costa Verdello"). Also `docs/dream_writer_second_draft.md:15,28` and `src/art/characters/nell/manifest.js:1` still say Wren ("Wren, the lamplighter") for what is now Nell/Maren. Not player-facing, but the next author will re-introduce the collision. Update the comments.

## NICE

- N1. Evening Lou's roast (`evening/cast.js`, "Forty-eight years...") repeats the dream's line (`gambler/dialogue.js:228,231`) nearly word for word. Fine as an echo; one new beat would pay the dream back better: what he does with the steady hands (e.g. "I dealt a hand of patience this morning. I let it win."). Fenn's "It came once, in seventy-nine. It will again." is a straight copy of `dialogue.js:132`; the Evening adding "tomorrow is my night" is the new part and is good.
- N2. `src/systems/puzzles.js:152` still has the old "Soufflé" ticket rail. Not player-facing unless that puzzle is reachable (nothing imports it except as `Modal`); delete the dead puzzle when convenient so `eveningCast.test.js`'s "nobody remembers the old kitchen" test means what it says (it only scans CAST).
- N3. `tuning.js:6-7` comment says "nothing here can stop anyone finishing"; Musician retriesOff/nerve +4 at tier 2 can in a bad run; the Musician's floor of one retry is kept, so it's still true. Keep as is.

## Sections that are fine (judged from code, not played)

- **Economy shape.** Prices vs income: heart 380 (about 20% of income, 3 purchases of 60/120/200) is the right price for the strongest thing on the shelf; the 7 postcards at 100 are the "completionist tax" they should be; hats as the sink for coins you don't need is honest. The wallet test makes the shelf-over-income claim stick. Postcards marking the shard turns the heart into a thing you can plan for, which is a real, chosen item.
- **Heart inflation, shard side.** Cap 8, whole hearts counted on top of caught-dream hearts is correct; the earlier "worthless from the third catch" bug is gone. The only issue is the M1 interplay and S2.
- **Tiers, framework dreams.** The kind of scaling is right for the dreams that need it: the gambler's odds never move, Lou misreads more, the vent gives less warning; the clockmaker stays gentle on purpose; the Painter's four knobs move together and the giornata test keeps it finishable. These change how the room plays (Lou lies more, so you listen more; the vents leave you less warning), not only the numbers. The 3-tier shape is sensible *per dream*; the order-of-play question is moot because difficulty depends on count, not which dream, and the intentionally gentle clockmaker has foePace 1 so it can be anyone's first or last. Needs a playtest at tier 2 for the Musician (window 86%, nerve +4, one fewer retry together).
- **Evening cast.** Lines land: Gualtiero ("Sit. You will not be made today"; "Flour, with gravel in it") calls back the dream's slab and grind lines; Nell's "He never did ask who" answers the man with the watch's "whoever you are"; Bastien's "That was a promise" is the sink line (`chef/dialogue.js:29`); Marguerite's "Read the rail, Jo, not the room" ties the rail verb. Placement is meaningful (Nell at a lamp that doesn't need her, Gualtiero on the bench not on his knees, Lou at the rail with nothing to hold, Bice at the laundry copying Fereshteh's sheets). Whether Bice's `sit` has a seat and whether Lou's rail position reads next to Bilal's stall (x 189 vs 185) needs eyes. Gating is by dream caught (`knows`), not by whether Jo spoke to the person; that is acceptable.
- **Wren rename.** No Wren left in on-screen text from the dream (`NAMES.wren` is MAREN; interaction label, napkin modal and status text are Maren). The remaining "wren" strings are ids, flags, and the Evening's own Wren (`activities.js:394`), which is as intended. See S5 for comments and docs.
- **Grab fairness mechanism.** The step-in plus the 0.45 s off-balance after a miss plus the dropped wind-up behind conversations is a sound set: standing still gets you grabbed, ducking always beats it, running always beats it. Duck-always-beats-it makes the duck a universal answer; that is the game's stated rule (`slide_under` tutorial) so it's fine, but it means any later "harder" foe needs a different verb, not a longer lunge.

## Not checked
- No playtest of any tier or any foe. Did not verify Bice's seat, Lou's placement, or the tea +1 rendering over max (`BaseLevel.js:129` bumps `lives` without raising `maxLives`; the report says it was seen in the browser).
