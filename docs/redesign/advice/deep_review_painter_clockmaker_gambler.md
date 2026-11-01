# Deep review: THE MASTER'S LADDER, THE STOPPED HOUR, THE LAST HAND

Lens: senior game designer plus pro gamer. Read-only. **I did not play.** Everything is read from room grids, dialogue, beats, music keys, `Player.js` (run speed 280 px/s, `Player.js:27`), foe kinds (`data/kinds.js`) and the engines. Items marked **(inferred)** are what I expect on screen, not something I saw. Avoided repeating `fresh_review_design/feel/art`, `lead_design_review` and `casino_review_r3` except where I add to them. The casino's rules and money are not touched.

Scale note that matters for all three: Jo runs 8.75 tiles/s. Lane (44 tiles) is 5 s end to end; the whole clockmaker is about 30 s of running. Rooms are scenes to arrive in, not distances to cross, so what a room asks of the player must come from what is in it.

## Verdicts

**THE MASTER'S LADDER (painter).** Engaging: yes, the best-written dream; the world, the climb of rank and the scaffold are right.
Biggest thing wrong: the four jobs are one button press (and a miss costs nothing), and promises the script makes (the lapis to guard, "he stands for you", "the face is the master's hand") never pay off on screen.

**THE STOPPED HOUR (clockmaker).** Engaging: charming for two minutes, then it ends. Pattern is right.
Biggest thing wrong: the town it saves has no people in it and the moment the clock starts happens off-screen, so the dream's one payoff is an instant prop swap and a caption.

**THE LAST HAND (casino, non-rules).** Engaging: yes, the most authored mood and the only dream where the music and rooms carry the story.
Biggest thing wrong: outside the card tables the world is a row of one-line NPCs on a flat floor; the player who refuses everything (no comp, no marker) gets the emptiest rooms, and tilt has no sound.

---

# 1. THE MASTER'S LADDER (painter)

## Walk-through (inferred from rooms and beats)

- 0:00 Bottega, spawn x6. Title card. Jo says the smell of the workshop, then "somebody in the loft is drawing". Gualtiero is eight tiles away. Clear: talk to him. Good first minute.
- 0:30 Talk, slab is at x25 (`bottega.js:62`). Grind: four taps on a bar (`jobs.js:22-30`). Slow and wide: a fair teach. After it, Jo is "bound to the shop" and sent for lapis. No dead time.
- 1:30 Via dei Pittori (70 tiles, 8 s to run). First foes: two green-cap rivals on the floor (patrol 19-35) and on a pentice (27-32), exactly between the bottega door (x9) and the colour-seller (x47). First time anyone can hurt Jo. The bark that names them ("Green caps. Dori's boys") fires only when Jo is within 900 px of the woman at x54 (`dialogue.js:138`), which is about x26: after the rivals are already in sight (inferred). The high road over the pentices pays coins: the dream's first "optional harder path". Good.
- 2:30 Colour-seller. Best room in the dream: dark, glittering, three shelves with ladders, a rival patrolling the middle shelf, a pigeon at the top, a heart shard over the still behind a 5-tile gap (`speziale.js:16-18, 55`). Clear goal, vertical, uses ladder and jump, secret with a visible lure. Keep as is.
- 4:00 Back through the street with the lapis. Identical to the outbound trip. Nothing about carrying it matters. This is where I would start to feel nothing happened.
- 4:30 Drapery at the altarpiece: five taps. The panel fills in. Gualtiero's "Who taught you that?" with a choice. Good moment, and the choice changes nothing but one line (see MUST 3).
- 5:30 Optional: watch Bice draw (`m_bice`). The best small scene in the dream.
- 6:00 Via a third time (chain now open), piazza (96 tiles, three doors, two inspectors, three studies, three one-line NPCs), guild hall: two inspectors, six-tap test piece, the seal. I would get bored in the walking here: the same cobbles and the same foes for the third and fourth pass.
- 9:00 Palazzo: stairs, gallery, two porters, Dori in the courtyard, Corso, the contract page, the gold. Strong scene, strong villain.
- 11:00 Piazza again, chapel. Six ladders up a 40-row scaffold, a foreman on the cartoon plank, two pigeons, a checkpoint halfway. The cartoon sits on the route next to the ladder, so it cannot be missed and the guard is unavoidable (`chapel.js:40-45, 75-79`). Excellent level logic.
- 13:00 Giornata: eight steps, plaster clock, Dori's bay filling, the tempo climbing 60 to 84. Bell, fade, two caption lines, the orb. Lands.

## Aspects

**Characters.** Good: Gualtiero ("keep your hands off the gold"), Bice ("Your drapery will be wrong"), Orazio, Dori ("Tell your master I shall be gentle with him"), Folco and Corso are distinct and each wants something. Tonio's "someone who likes glue" is a perfect one-liner. Weak: Gualtiero disappears after the bottega (never at the trial where Jo says "He does" stand for him, never on the scaffold, never at the bell). Woman, friar, beggar, consul, steward each have one line that never changes as Jo rises. Bruno has the same art as the porters (`kinds.js:42-43`: both `foe-rn-foreman`), so the boss on the cartoon plank is a porter.

**Level.** Good: bottega (loft and ladder), speziale (see above), the chapel scaffold, the gate-chain that drops for rank (`via.js:75`), pentice high road. Weak: via and piazza are crossed five times with the same foes; the piazza's three doors are a hub, which is right, but nothing in it changes with rank.

**Obstacles.** Fair and readable: inspectors' cones, rivals' sight ranges, pigeons. Varied by room (shelf run, scaffold) but not escalating inside a room, and the foes are not tied to the story: the rivals are "sniffing round" the lapis and never touch it.

**Story.** Told well in the dialogue and the contract page. It breaks in three places: the lapis is not at risk, the master is absent, and one Bice line contradicts the branch (MUST 3, 4).

**Objectives.** Every room has one clear goal and the HUD text matches. Good.

**Movement.** Ladders, pentices, shelves, scaffold use climb and jump; the middle of the dream (via, piazza, palazzo, guild) is mostly walking past foes. The upper-body verb is [Q] silverpoint, never taught (MUST 5).

**Music.** Excellent and per place (`music.js`): lute dance, recorder saltarello in the street, glassy shimmer in the speziale, one-note organ in the hall, and the chapel pad that gains a pulse and a tempo as the giornata goes. Keep all of it. One gap: the street, piazza and palazzo never react to progress (SHOULD 6).

**Else.** Props are well used (cast hand, trestle, pigment table). The contract page and the HUD ultramarine/gold countdown (`contract.js`) are the best "scarcity" idea in the game; it is spent only in the finale (see MAJOR).

## MUST

1. **The four jobs are one verb, and a miss costs nothing.** `craft.js` header: "never fails"; `jobs.js:22-100` differ in numbers only. A first-time player feels it by the second job. Fix: see MAJOR.
2. **The lapis is never at risk.** `gualtiero_lapis` ("Don't drop it"), `orazio` ("Dori's boys have been sniffing round it all morning"), `orazio_after` ("Hold it like a bird") set up a theft. The return trip is identical to the outbound one: rivals hurt Jo the same way with or without the stone (`kinds.js:40`, no `steals`). Fix (buildable, M): while `F.lapis && !F.drapery_done`, a rival hit knocks the stone out as a pickup that lands 3 to 4 tiles away (`keyitem` respawn at the hit point); Orazio's line then pays off. Cheaper: give the `rival` kind `steals: true` only in that window and return the lapis to the top shelf on a successful theft; Orazio says "I put it back. Climb." Either way add one bark when a rival first notices Jo with the stone: Jo: "They're after the blue."
3. **Gualtiero is absent from the climax, and two lines contradict the branch.**
   - Gualtiero stands for Jo (`folco_first` j1 "He does.") but is not there. Fix: add `gualtiero_deck` on the chapel deck (`chapel.js` entities near x34, y7), and a post-contest line in the coda branching on `choice_bice`:
     - choice_bice: `"I told them the fold was mine. It was never mine. It is hers, and it is in my vault."`
     - else: `"The Gualtiero workshop. I said it myself. I will not sleep tonight."`
   - `bice_deck_after` (`dialogue.js:132`) says "Nobody will ever know which star was yours" even when Corso has just said her name aloud in the choice_bice branch (`beats.js:63`). Fix: list a `bice_deck_named` first, `if: 'choice_bice'`: `"He said my name. Out loud, to the whole nave. Look up, Jo: the third star is yours."` Keep the current line for the silent branch.
   - `told_master` (set at `dialogue.js:48`) is read nowhere (grep: no other use). "Bice did" and "I saw it" produce one different line and nothing else. Fix: `dori_deck_after` currently repeats Gualtiero's question ("Who taught you that?", `dialogue.js:134`) with no answer. Make it a node with the same two choices; if `told_master` the answer is `"Bice."`, Dori: `"The girl. Good. Then I lost to a better hand than yours."`; else `"I saw it."`, Dori: `"Nobody sees that. Somebody showed you."`
4. **The scaffold boss is not a boss.** Bruno and the porters share a texture (`kinds.js:42-43`). Give `foreman` its own look (red sash, bigger) or a name plate. One bark at first notice: Bruno: `"Gualtiero's boy. The cartoon is under the lime, where it belongs."`
5. **[Q] silverpoint is never taught.** Inferred: no teach card or prompt names it; `sketch.js` has no hud widget, and `resonant` only glows (`dreamAdapters.js:13`). The beggar's "Draw my hands if you like" (`dialogue.js:86`) is the only nudge and comes after the torso. Fix: when Jo first stands in the torso's ring, caption once: `"I should draw this. [Q]."` Give each study a one-line payoff in the book at the ending (it has one for all three at `dream.js:197`); also give one for one or two studies so the player is not punished for missing the third: `"A torso and a pair of hands, kept in a book."`

## SHOULD

6. **The streets never notice your rank.** One-line NPCs (`woman`, `woman_square`, `friar`, `beggar`, `consul`) keep the same line from minute one to minute thirteen. Add a second line behind `if:` flags (the framework already supports `talk: [{conv, if}]`):
   - `woman` after `assistant`: `"You're Gualtiero's boy. The one who paints cloth like cloth. The street talks."`
   - `beggar` after `guild_master`: `"You wear a seal now. Draw my hands anyway. Nobody did, before."`
   - After `seal`, drop the inspectors' hostility: `inspector` foes get `unless: 'seal'` and an NPC "nodding inspector" at the same spot. The ladder then changes the world, not only a chain.
7. **The giornata's contest has no live drama.** The rival bar fills (`craft.js:132`) but nothing happens when it completes. In `giornata.onRender` (`jobs.js:98`): when `st.rival >= 1` before Jo is done, one bark from Dori: `"Done, boy. Take your time."`; when Jo finishes first, Dori stops painting for a breath. Cheap and it makes the bar mean something.
8. **Via is crossed five times.** After the seal, remove the rivals on the floor (they respect the seal like the inspectors) or open the guild's side door in the piazza so Jo does not retrace via. Also move the `via_rivals` bark to the room entry (`when: room via`), not the woman at x54.
9. **The master is "the contract says so" before any contract.** `gualtiero_drapery` g2 (`dialogue.js:44`) says "The contract says so" while the only contract in the dream is signed at the palazzo, later. Rewrite: `"The face is mine. The master paints the faces. That is how the shop is paid."`
10. **Gualtiero never reacts when Jo returns from the guild with the seal.** `gualtiero_after` is the same line forever. Add `gualtiero_sealed` (`if: 'seal'`): `"A seal on a boy from my slab. I will tell the street it was my idea."`

## NICE

- A tiny change to Tonio: after `seal` he says `"Seven years now. Six for the floor, one for waiting for you."` (`bottega.js:63`).
- The chapel pigeons are comic; fine. Keep.
- The coda lines could name Gualtiero once the item above is in.

## MAJOR (the one): give each craft job its own rule

Smaller fixes cannot do it: `craft.js` has one input (tap on a mark) and `jobs.js` only tunes `speed`/`zone`/`at`. Changing numbers is what `fresh_review_design` F3 already called monoculture. Keep the engine, add a step `mode` and give each job a signature:

| Job | Signature mode | How it plays | What it teaches / costs |
|---|---|---|---|
| Grind (slab) | `mash` then `hold` | "crush": press 5 times inside the zone to fill a meter; "grind": hold act while the brush crosses the bar, release in the zone | Rhythm and patience; slow and wide as now |
| Drapery | `double` | "fold, from the knee, then it breaks": two marks per step, press at each in order | Prediction; Bice's line becomes the hint ("from the knee, then it breaks" is where the second mark is) |
| Test piece | scarcity | Pick 2 of 3 materials before starting (ultramarine, gold, bone white); each step needs a specific one; a missed step spends it. Reuse `CONTRACT` bookkeeping (`contract.js`) | The panel now has a cost, and the consuls' reaction can differ |
| Giornata | keep the plaster clock and the rival | already unique | stays the climax |

Order of work: `mode: 'hold'` (engine plus presenter), then `double`, then the material pick. Cost M to L. Without this the painter's last third is the first third again.

---

# 2. THE STOPPED HOUR (clockmaker)

## Walk-through (inferred)

- 0:00 Lane, x3. Dusk, fireflies, a title card ("THE LANE, AFTER SIX"). Bark: "Every window lit, and every lamp out." **No person is here.** The only things to do: hop the low wall (4 coins), cross a small dip (5 coins). The next place is the hedge arch five seconds east. Not bored, but nothing is wanted yet.
- 0:10 Green. Nell at x18 faces Jo. Bark: "Evening! Over here, by the dark lamp." [E]. Five lines, one choice. Objective: wind the clock.
- 0:50 Across the terrace to the clock house door (x33). Inside: shelf, table, mezzanine (two climbs), coins as breadcrumbs. Pleasant. Press [E] on the dial: camera closes in, a hand sweeps, three seats. Rejection costs nothing. About 15 s.
- 1:40 Beat: Jo says "Three gears, seated. Listen to it go." Objective: back out. Walks out the door: lamp post by Nell is lit, the gate is open. A bark: "There! The lamps!" Jo has seen the single most important consequence of the dream as a swapped sprite (`green.js:41-42`, `when: clock_wound`).
- 2:00 Gate, bell yard, hill climb 34 tiles, orb. Ending: "The clock struck seven, an hour late."
- Total about 2.5 minutes. Already noted by `fresh_review_design` F2. I add specifics below.

## Aspects

**Characters.** Nell is a good first line ("Every lamp on the green went out at six, and the clock with them") and "You're the only one awake" is the best line in the dream. But she is the only person in a town "that runs on that clock". The lane has nobody, the green has nobody else; houses have lit windows and no one in them. She does not react to Jo winding it other than "Listen. That's the town breathing again." (`wren_done`), after which she repeats it forever.

**Level.** Lane (cobbles), green (terrace, door), clock house (mezzanine, a clear vertical beat), yard (hill) are four distinct places with one aim each: this is the owner's pattern, keep it. Weak: lane and yard are corridors; the green's 52 tiles contain Nell, a well, a bench and a hedge. No secret, no dead end, no reason to look anywhere; coins are the only reason to leave the route. Checkpoints (`cp_lane`, `cp_green`, `cp_clock`, `cp_yard`) guard a dream where nothing can hurt Jo.

**Obstacles.** None. The "gears slipped" setup (three gears, "watch for the brass") is a single dial. A tutorial for nothing.

**Story.** The thesis ("the work nobody sees") lands in the ending. Two problems: `ending.lines[1]` "Nobody on the green noticed it had stopped" (`dream.js:94`) contradicts Nell, who is on the green and noticed. And there is no dreamer: every other dream belongs to a person (Bice, Lou, Marcus) whose waking regret frames it; this one belongs to "Jo has always wanted to be the one who keeps a town's time" (header). Who rides the train in the clockmaker's seat? That is a connection to the whole game, which this dream lacks.

**Objectives.** Clear, one at a time, in the right order. Good. The one wobble: "OPENS WHEN THE CLOCK STRIKES" on the gate (`green.js:62`), but nothing strikes.

**Movement.** Wall hop, dip hop, shelf and mezzanine climb. Honest and small. [Q] whistle (`verbs/whistle.js`) does nothing except turn nearby people (and there is no one near): a verb with no purpose.

**Music.** Per place and good: lazy folk waltz with a music box on the green, slower in the lane, fiddle in the yard, glass box alone over an escapement in the clock house (`music.js`). Two unused features: (a) the clock house key sets `dangerEvery: 1` ("danger is the tick-tock speeding up"), but no encounter sets the tense state, so it never speeds up. (b) the green key has `tick: 'tick'` (`music.js:26`) so a stopped clock is audible before it is wound (inferred). Fix: the tick should be the payoff.

**Else.** The lamp posts on the lane (`lane.js` x10, x34) light too when the clock is wound, but Jo is not there to see it. Signpost at x41 has no text (inferred; no sign entity).

## MUST

1. **The payoff happens off-screen.** `beats.js:10-18` flips `clock_wound` while Jo is in the clock house; the green changes silently. Add a `green_lit` beat that fires on the first exit door (`when: room green, flag clock_wound, once`): the camera pans from Jo to the gate (`camera: { to: 'anchor:gate' }`), a church bell strikes seven times with a pause (`sfx: 'bell'`, 7 x 600 ms), lamps light in order west to east, then Nell's line. This is the single moment the dream is built for. The lamp swaps are already `live: true`, so it only needs sequencing.
2. **The ending contradicts its own dream.** Rewrite `dream.js:94` lines:
   - `'The clock struck seven, an hour late.'`
   - `'By morning nobody on the green could say it had ever stopped.'`
   - `'Nell knew. Nell lit the first lamp.'`
3. **There is nobody in the town.** Add three people on the green and lane, each with a reason and a reaction to `clock_wound`. Use `npc` entities with `talk: [{conv, if: 'clock_wound'}, {conv}]`:
   - A man with a pocket watch outside the station gate at the lane's end: `"Six o'clock. It has been six o'clock for an hour. I did not miss the train. The train missed me."` After: `"Seven! The train will come now. Thank you, whoever you are."`
   - A woman with a pie in a cloth on the bench (`green.js:60` already has a bench): `"The oven bell never rang. The pie is perfect and cold."` After: `"Warm again. You do not know how that feels."` (swap her pose to eating).
   - A child at an upper window: `"Why did the lamps go out?"` Jo cannot reach her; she waves after the lamps come on.
   Cost: three NPCs, six lines, reuses existing rigs.
4. **Give the encounter the room it deserves.** The three gears are three places, not one dial. See MAJOR.

## SHOULD

5. **Choice changes nothing.** Both choices go to `w3` (`dialogue.js:19-30`). Fix: "Why me?" sets `asked_why`, and Nell's `wren_done` branches on it: `"Because you were awake. That is all anyone is, at the start."` Else (`"I'll seat them."`) she says the current line. Cheap, honest.
6. **The tick is the music's payoff.** Remove `tick` from `green` and `lane` until `clock_wound`; add it, quietly, from the first exit. In the clock house, set `scene.music.setState('tense')` while the hand sweeps (the encounter's `onRender`, as `jobs.js:98` does) so the dangerEvery tick speeds up as intended. Zero new assets.
7. **The whistle needs a job.** Candidates, cheapest first: whistle at the child in the window and she waves back and drops a coin; whistle in the lane and a cat on the wall (the lead plan's guide) steps down and walks to Nell. Or cut the verb.
8. **Nell's rig id is `wren`** (`dialogue.js:6`) and the name Wren is used by three other characters (`fresh_review_design` F9). Rename the rig id to `nell`.
9. **Nell's `wren_after` ("Watch for the brass")** is a hint with no brass visible until the encounter. In the dial presenter show the brass window glowing for half a second at the start of each sweep.

## NICE

- The lane could hold the first bit of tutorial: a dark lamp Jo winds by hand (one press) before meeting Nell, which is the lead plan's area 1. Quicker than a new room.
- A faint ticking from the clock house heard through the door on the green before it is wound (a stopped clock gives a "ting" at one-minute intervals).
- Gate hint "OPENS WHEN THE CLOCK STRIKES" will be true after MUST 1.

## MAJOR: grow it by making each gear a place (already on the roadmap as #5, here is the cut)

Smaller fixes cannot do this: one encounter, one dial, no hazard is the structure. Keep the pattern the owner likes (a place per aim, inside opens outside). Concrete cut, reusing the existing clock house and adding two rooms:

| # | Place | Goal | Moveset used | Fail state (soft) |
|---|---|---|---|---|
| 1 | Lane | wind the first lamp by hand (one press) | walk, hop | none: teaches the press safely |
| 2 | Green | find Nell; meet the three townsfolk (MUST 3) | walk | none |
| 3 | Clock house: ground floor | gear 1, the dial (existing, tap on the brass) | jump to the mezzanine | none |
| 4 | Weight shaft (new, vertical) | gear 2: climb the falling weight's chain; a swinging pendulum case sweeps the shaft on a readable period (the pendulum is already art: `pendulum_case`) | climb, slide under, timing | hit knocks back one ledge (hearts finally matter) |
| 5 | Bell chamber (new) | gear 3 and the hammer; seat the gear while the pendulum above ticks at the player's own press rhythm | jump, timing | the escapement slips: Jo re-winds the last gear |
| 6 | Bell yard | strike seven, one press per beat, as the green below lights street by street | timing | none |

This is the existing plan's idea made concrete as "one gear, one place". It also puts `Shove`, hearts and the pendulum hazard in front of the player, which the cards in `data/teach.js` never currently teach in this dream.

---

# 3. THE LAST HAND (casino: characters, level, deck, story, movement, music)

## Walk-through (inferred; money and table rules skipped)

- 0:00 Quay at dusk. Fog, gas lamps, a white boat with every window lit. Jo narrates: "A man in a claret coat, holding his hands like they hurt." Lou at x26. Five paced or still NPCs (porter, clerk, lady, Dev). Great opening image.
- 0:40 Lou: "Look at my hands. I can't hold a card like this." Slate (reviewed). The door is locked until chalked (`quay.js` portal). The gangway and the deck are one continuous floor, the saloon door at x70 is the next goal. Clear.
- 2:00 Saloon: a long hall, a band that never stops, a faro table at x44, steward and dealer offering comps with real cost (choice with consequence: good), Fenn's coin. Lou follows. Straight to the bank.
- 5:00 Card room: three tables, a guard door to cool off, coins on the guard. Tables 1, 2, 3 (reviewed).
- 12:00 Office: Pell in the cage; a corridor; markers narrow the ceiling and call Crake. Stairs.
- 14:00 Hurricane deck: a pit, a ladder, two steam pipes, a door; ratlines to a shard.
- 15:00 Pilot house: the last table. Stand up (or lose). Dawn landing. Lou at the rail. Coin. Ledger.

## Aspects

**Characters and actions.** Good, keep: Lou standing at the shoulder with whispers; Pell's soft menace; Dev as the only person who tutors (quay: "Folk go out there to cool off. Or don't, and wish they had"); the lady's "He always only watches"; the clerk's "Most of them don't"; Fenn's one coin (and the camera moment). The band as set dressing is right for the era.
Weak, concrete:
- The barman and the steward are the same person twice: both `cast: 'npc-lq-steward'` (`saloon.js:73`), and the barman's lines run under the cast "THE STEWARD" (`dialogue.js:119`: "I'm only the bar").
- The casekeeper is silent (`saloon.js:81`, no `talk`). He is the only person aboard the lady on the quay could mean ("He said he'd only watch").
- The pilot is a single line and never turns.
- Sorrel and Nico, the second table, have one line each and repeat it at table 3.
- Lou is not in the office or on the deck (he comments on markers only in a pre-warning, `dream.js` `tables`).

**Level.** Good: the quay-to-deck continuity is a real place; the deck is the dream's only real platform room (pit, ladder, roof, ratlines with a shard). Weak: saloon, card room and pilot house are flat corridors; the saloon has no vertical, secret or detour except three single coins (`c_bar`, `c_bank`, `c_cards`); the guard is the only place that asks Jo to do something with the body, and the ask is to wait ten seconds. The office, for the player who signs no markers, is 24 tiles of empty corridor (`office.js:37`, Crake only `when: 'marker1'`): the refusing player gets the emptiest room. That is backwards for a dream that rewards refusing.

**Obstacles and hazards.** Corridor plus Crake is the best: fair (a slow foe, `speed: 38`, never runs), readable (the ceiling visibly drops, the lamp dims) and escalating per marker. The deck: two pipes 8 tiles apart with 2600 ms periods and phases 0 and 1300 (`deck.js:22-25`). The gaps are generous and the tutor (Dev) stands right there. But there are exactly two, with no escalation, in the one place the dream tests the body: after a lost last hand Jo replays this stretch (`dream.js` `SPOTS.deck`) and it never changes. Also tilt: the pipes lose the warning wisp when tilted (`boat.js`), but the whole deck is `air`, which cools tilt as Jo walks, so the penalty is mostly gone by the pipes (inferred).

**Story.** Strong and told: the slate, the comps that are not free, the markers, "I'd have stayed". The ending ledger (reviewed) is the right closing image. Gaps: the opening says Lou's hands shake and he cannot sit; the ending never returns to them. And the dream has no moment where Lou's 1884 night differs from what Jo does (what did Lou do that night? we are told "I'd have stayed" only at the end).

**Objectives.** Each room has one goal shown on arrival. Good.

**Movement.** Mostly walking to chairs. Bales and crates give optional hops on the quay; the deck gives the only mandatory jump (the hatch pit), a ladder and two timed passes. The shard on the crosstree (13-tile ladder, `deck.js:62`) is a fine optional.

**Music.** The best-fitted dream score: schottische through the hull on the quay (`wall: 900` low-pass), full band in the saloon, one low pad in the card room, nothing at all in the office, pad and clarinet on the deck, silence in the pilot house and at the landing (`music.js`). Silence as the finale is right; keep all of it. Two gaps: tilt has no sound at all (the key has `danger: null` everywhere; `verbs/purse.js` never touches the music, grep: no `music` call), and the comps do nothing to the band.

## MUST

None. Nothing in these aspects would make a first-timer think the dream was not considered, except the duplicate barman, which is visible.

1. (Closest to a MUST) **Barman and steward are the same sprite and the same nameplate.** `saloon.js:73`: change the barman to a distinct rig/cast (`npc-lq-barman` with sleeve garters; add `barman` to `CAST` with `name: 'THE BARMAN'`) and move `dialogue.js:119` to him. Lines: barman: `"Mr Pell's whisky is the steward's department, sir. I only pour the honest kind."`

## SHOULD

2. **The refusing player gets the empty office.** Add hidden brass in the lit corridor: `{ type: 'coins', id: 'c_clean', x: 24, y: 10, n: 5, unless: 'marker1' }` in `office.js`. The lamps are at full glow with no marker (`boat.js` glow alpha 0.5 minus 0.14 per marker); a clean book shows you more. One line from Pell when Jo passes with no marker (`pell_first` p_no already: `"The stairs are at the end of the corridor."`): add a second beat on the way back: `"Nothing signed. Remarkable. The book hardly knows you."`
3. **Dev's deck line is wrong for the calm player.** `dev_deck` (`dialogue.js:172`) says "Hot-headed, you'll misjudge it every time" to everyone. Split: `dev_deck` (default): `"Escape pipes on the texas blow on a beat. Watch the wisp, then go between."` and `dev_deck_tilted` (`if: 'tilted'`, F.tilted exists): `"You are steaming, and so is the pipe. Walk the rail a minute and you will see the gaps."`
4. **The casekeeper pays off "He always only watches".** Give him `talk`: casekeeper: `"I keep the case, sir. I only watch. If a lady on the quay asks, tell her I only watch."` Jo: `"I'll tell her."` and the lady's line (`dialogue.js:81`) after `faro_done` becomes `"Only watching! That is what he told you? He always only watches."` Two lines, one real joke, one real person.
5. **The deck needs one more beat.** Add a third pipe at x35 with a 2200 ms period and phase 700 so the three do not align (`deck.js:22`), and make the pipes read as a pair then a trio: pair on the way up, trio only on the way back from a lost last hand (`when: 'lost_nights'` flag). The "habit" the dream is about is that the way back is short; the pipes should answer that by being harder, not the same.
6. **Tilt needs a sound.** In `cards` and `deck` keys set `danger: 'throb'`, and in `verbs/purse.js` call `scene.music.setState(isTilted(p) ? 'tense' : 'quiet')` where the flag is already set (`purse.js:105`). Comps: `comp_drink` beat raises saloon bpm 108 to 116 and `gain` by 20% until the faro is done. Zero new voices; the throb already exists in the clock house key.
7. **Lou's hands.** Opening: "Look at my hands. I can't hold a card like this." Ending: add to `lou_end` after l3:
   - Jo: `"Your hands."`
   - Lou: `"Still. First time since 'eighty-four. It took a boy who could leave."`
   Set the landing Lou `task` to a still pose (`landing.js`, `lou_end` entity) so the idle fidget stops. The opening image is answered.
8. **The guard is a waiting room.** The tilt walk is ten seconds of nothing. On the guard add `{ type: 'moment', ... }` at the rail ("watch the wake") so the cool-down has a Small Moment, and Lou's cue (`LOU_TILT_FIRST`) is followed by a once line at the rail: Lou: `"Count the lamps on the far bank. I used to. It only got me to forty."`

## NICE

- Table swap (`cards.js:80-89`): voe1/sorrel2/nico2 vanish and the third table's players appear on a flag flip (inferred, instant). A 400 ms fade and Lou's line already there would make it a stage change.
- Pilot turns to face Jo as he stands up. The pilot's line ("men come up here at five") would be heavier after the stand-up.
- Fenn's coin: after `faro_done` she says "Well done" (`fenn_after`); after the landing she could be at the quay (Evening hook).
- Quay NPC `lady` has `pace`-less standing; give her a pace toward the gangway.

## MAJOR

None. The casino's frame holds. The two things I would watch (deck variety, the empty office for the clean player) are small content, not structure.

---

# Cross-cutting

- **People who should change with the player's progress**: the painter's street, the clockmaker's town and the casino's quay/saloon all use a single `once` line per NPC. The framework already has `talk: [{conv, if}]`; the cost of a second line is one conversation. Target: every dream gets one "second line" for at least three NPCs.
- **Verbs without a reason**: clockmaker whistle (does nothing), painter silverpoint (untaught), casino boat (no keys). One for each dream: give it a purpose or cut it.
- **Soft failure that does not fail**: clockwork and craft never fail; checkpoints and hearts exist in all three dreams. Painter and casino have foes that bite; clockmaker has no biting thing at all (hearts and checkpoints are dead weight there).

# What I did not check

Any visual or audio output; whether foe hits really knock the lapis free (it does not; `kinds.js` has no steal for rivals); whether the NPC swap at table 3 is instant; the tilt/air numbers in play; the actual jump reach for the speziale gap and the 3-tile corridor, which should be measured with the planned refresh-rate physics fix before I would trust them.
