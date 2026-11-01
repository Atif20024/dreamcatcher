# Deep review: THE SECOND DRAFT (Writer) and THE BIG STAGE (Musician)

Reviewer: senior game designer and pro gamer, read-only. Branch `redesign`, 2026-11-01. **I did not play.** Everything below is read from room data, scripts and engine code; anything that needs eyes or ears is marked (inferred). Skills applied: level-design, platformer, game-feel, audio-design, dialogue-systems, game-balancing. Not repeated: `fresh_review_design.md`, `fresh_review_feel.md`, `fresh_review_art.md`. Where one of them already named a problem I say so in one line and only add the rewritten fix.

Owner's bar: "so that its very engaging and interesting. nothing should feel like its not well thought out".

---

## Verdicts

**THE SECOND DRAFT (Writer).** Engaging in ideas and story (the best payoff line in the game, "page three"), not yet engaging in play: the first half is strong, the second half thins out.
Biggest thing wrong: the two signature verbs are decorative. The pen opens with the right word already selected, typing pays the same pages however badly you type, and from the bag theft on the pen has nothing to do (the two labels in the city can never be solved, because their words do not exist).

**THE BIG STAGE (Musician).** Engaging: the best pacing curve in the game, a clear one-job-per-room structure, and a real moral choice (Marcus, Tally) that changes the set.
Biggest thing wrong: how well you play changes nothing, and what you play is not music. Gig results are read by nothing, the first two gigs are the same four taps six times, and the notes you "answer" with are not the notes of the call.

---

# PART 1: THE SECOND DRAFT (Writer)

Files: `src/scenes/WriterScene.js` (1960 lines, legacy imperative scene), `src/data/writer/{rooms,map,cast}.js`, `src/systems/{labels,typing,writerPuzzles}.js`, `src/entities/InnerEditor.js`, `src/audio/{bands,places}.js`.

## 1.1 Minute by minute, first-time player (inferred from code)

| When | What I see and do | What I want next | Mark |
|---|---|---|---|
| 0:00 | Dawn terrace. Jo says "Morning." to nobody (`cast.js` d0). HUD objective: "write chapter one (12 pages)" (`WriterScene.js:175`). | Where is a page? What am I? | Confusing: the objective names something I cannot do yet. The room's own objective ("the attic. the blank page.", `rooms.js` OBJECTIVES) is overwritten by line 175. |
| 0:05 | 900 px of empty street, a lamp, three coins, a checkpoint, then a fire-escape ladder (col 28). | The lit window. | Fine, short, readable. Slightly empty. |
| 0:30 | Attic. Mattress, typewriter labelled "jammed typewriter", coffee tin with the word "working" floating over it. Walking into the word picks it up and fires the PEN card. | Strike "jammed", write "working". | GOOD: the first lesson is a staged success, the label is the instruction. |
| 1:00 | Pen modal. The cursor opens on "working" because `labels.js:119` pre-selects `label.to`. Press Enter. | Sit and write. | Boring: no thought needed (see W-M1). |
| 1:15 | Desk 1: letters fall, I press them. Four pages arrive however I did. Objective: "the trunk. then the street." | Leave. | Nothing happened if I typed badly (W-M2). |
| 2:00 | Trunk labelled "heavy". Cereal box shelf holds "light". Pen: heavy to light, push it. Heavy trunk is also a step to three coins under the skylight. | Down the stairs. | GOOD: one object, two uses, the label decides which. |
| 2:30 | Copy shop street. Landlady patrols right outside the stairs and can grab me, yet also shows "[E] the rent" and says the rent was Thursday. Pigeon steals a page. | Pay her? With what? | Mixed signal: she is a foe with a sight cone and a conversation. Tomasz explains the job ("Fix what you can, kid"). Good brief. |
| 3:00 | Four jammed machines, a belt, hot rollers, a toner spill, a bound machine with a lever, a machine that wants toner. Each fix pays three pennies and a float text. | More. | The strongest 4 minutes of the dream. Varied: pen fix, hot to cold, slippery to dry, lever, carry the toner. |
| 5:00 | Landlady scene (`rent_yes`) and Moment 1 (a "pause" prompt at the back, text only). | The café. | Rent has no cost (W-S1). Moment shows nothing (W-S5). |
| 6:00 | Café. A talker in the doorway pushes me back; his bubble holds the word "wide" that opens the gate four tiles later. Wren at the piano gives "honest" and a napkin challenge. Emmerich: "Page three. Cut it." | What is page three? | GOOD: the obstacle gives the key to the next gate. Emmerich is funny. But I have never read a page three (W-M3). |
| 8:00 | Napkin puzzle (order eight fragments to read as one paragraph). Garden table: desk 3 with a cat that paws letters away. Dog gate: "wake the dog". | How do I wake a bound-label dog? | STUCK for many players: [Q] makes a noise and wakes it, and no card, hint or label says Q exists (W-M4). |
| 11:00 | Library reading room, structure cards (12 scenes, rise, dip once, end highest, two cards are not yours). The stacks: three guards on three floors, noise meter driven by Jo's own running and jumping, five sources, each behind a different trick (dark alcove, high shelf, glass floor, locked cabinet plus key on a dumbwaiter, the grief book from the card puzzle). | Which one first? | GOOD: five different answers, no repetition. Dense and long; backtracking from "lit" (far end) to the alcove (near end) is the main chore. |
| 17:00 | Post office: eight plates, "later", forty slips chase and steal two pages each. Wren's "Forty... Mine was a hundred and ten." | The way out. | Fine. The slips are the first real chase. |
| 19:00 | Bus: five paper platforms, then fade, "the bag is gone", draft 60 to 0, words wiped. | A reaction. | The dream's biggest beat gets a fade and a float text. Jo says nothing (W-S3). |
| 20:00 | Rain: 1600 px of flat walking, two lamps, the Editor at 60% speed. Music stops. | Something to do. | Nothing to dodge; the editor cannot catch a walking player (W-S4). The silence is GOOD. |
| 21:00 | Attic again, the wall of cards from memory, Wren and the soup ("Again."). | The way on. | Strong echo. GOOD. |
| 23:00 | Flat made of paragraphs: cut with the red pencil, page three is the biggest, warmest platform; Keep or Cut, door light turns green at 40 pages. | Which to cut. | The dream's best idea, delivered. Keep. |
| 28:00 | Agent, a 6 minute FRIDAY clock, city rooftops with a "narrow ledge" and a "slow crane" I cannot edit, then the press: feed plate, ink, press, fold levers in order, rollers, a folder blade, proofreaders who only see me if I have typos. | Do the levers. | Peak. Many clocks at once (see W-S6). The typo debt arrives here for the first time (W-M2). |
| 32:00 | Bookshop, nine chairs, lectern, any-key paragraph, claps, Wren: "Page three?" Jo: "Kept." or "Cut." Wren: "Good." Orb and card. | End. | GOOD ending. Wren's "Good." for either answer is the right call. |

Real length is about 25-30 minutes for a first run, against the spec's 18-22 (`docs/dream_writer_second_draft.md:3`) and the roadmap's 6-10 minute bar (`ROADMAP.md`, "Length"). That is a separate decision for the owner (see MAJOR).

## 1.2 Aspect by aspect

**Characters.** GOOD: Wren, Emmerich, Tomasz, the landlady each want something and say it in one line; the bookshop gathers nine distinct sprites (wren, tomasz, hat, emmerich, readers 1-4, landlady). Emmerich's "Page three. / Which part? / Page three." is the best joke in the game. Problems: the four café talkers are one sprite (`entities/foeArt.js:143`, `foe-talker` fedora and bottle) repeated, so "everyone in here is somebody's chapter" is illustrated with clones; the "man in the hat" is quoted by Wren, shown in Moment 2 as text, and seated in the bookshop, but never stands anywhere you can see him in the café. Isolde is on screen for one auto-dialogue and a clock. The Inner Editor is a silhouette and old Emmerich is a person with a similar name for the "editor" role; the dream never says whether they are the same person (see W-N1).

**Level.** 13 rooms in 640 columns, a clean left-to-right line of chapters. GOOD: the library (vertical, five different source puzzles, guards per floor, a hidden-by-darkness source); the copy shop; the flat built from Jo's own paragraphs. Weak: the arrival street, the bus (five hops), the rain (a walk), and the agent room (one dialogue, then a door). The library roof just raised at col 210 (`map.js` ladder-head) was a real fix; I have nothing to add except to check the same headroom lint passes for the other four ladder heads (209, 205, 244, 230).

**Obstacles.** Varied and mostly fair: landlady (sight cone, grab), pigeon (steals a page), talkers (push you back, duck under), guards that only hear (noise meter), glass floor (crouch-walk), slips (chase), rollers and folder (timed), proofreaders (see only if typos > 0). Escalation is good until chapter 4, then drops: rain and bus have no hazards, and the Editor in the flat is set to 40 px/s (`WriterScene.js:508`, `slow: true`), slower than a stroll. The press then stacks Editor (168 px/s, `follow`), a 6 minute clock, rollers, folder, proofreaders and a three-lever order in one room (inferred pressure, needs play).

**Story.** Told through objects: the napkin, page three, the bag, the paragraphs, the soup, "Again." It lands. It connects to the whole game through the same theme as the Musician (work nobody sees). Gaps: page three is told but never shown until chapter 5 (W-M3); the rent is paid with nothing; two of the three Small Moments show nothing.

**Objectives.** Good chain of gates with sign text (`GATE_HINTS`). Faults: the opening objective (above), `machine 5/4 running` (W-S2), and the wake objective set to `''` right when the player most needs direction (`WriterScene.js:1211`).

**Movement.** Uses the moveset well in the library (ladders, one-ways, crouch over glass, walk to stay quiet, hide in carts), the copy shop (jump belts, slide on grease, carry) and the press (ride webs). Chapters 4 and 5 ask only for walking.

**Music and sound.** The band is its own: solo felt piano in A Dorian at 60 bpm with the typewriter as pulse (`audio/bands.js:64`), a carriage bell, paper, crumple, clock bed. GOOD: the rain chapter stops the music (`WriterScene.js:1550`), the reading goes to solo piano. Problems (inferred, needs ears): nine of the thirteen rooms share one bed (`audio/places.js:57-69`), so the copy shop has no machine hum, the café has no espresso or chatter (yet noise is its mechanic), and the press has no roar; the typing minigame runs on its own clock (`typing.js:16`, 84-108 bpm) beside a 60 bpm piano, so the "typewriter is the pulse" idea is not what the player taps to.

## 1.3 MUST

**W-M1. The pen is a fetch quest, not a puzzle.**
`src/systems/labels.js:119`: `let idx = Math.max(0, words.indexOf(label.to));`. When Jo holds the right word it is already highlighted, so the whole "what word fits here?" thought is removed; the player presses Enter. Wrong words do nothing visible, and words are not used up.
Case: Jo holds "light" and meets "heavy trunk". The menu opens on "light".
Fix: open on index 0 (or the last word used), keep `to` for the answer only. Give wrong words a one-line wry result through `onEdit` default: `this.floatText(label.x, label.y - 20, "'" + word + "' " + noun + '. no change.', '#8a8478')` becomes a per-noun joke table, for example writing "quiet" on the jammed machine: "a quiet machine. still jammed. politely." That makes experimenting funny and costs one ink, which is the intended price. Size S.

**W-M2. Typing pays the same however you type, and the debt is invisible for 25 minutes.**
`WriterScene.js:736`: `this.addPages(desk.pages, ...)` runs on any result. Typos only matter in the press, where proofreaders see Jo only if `typos > 0` (`entities/Foe.js:173`) and each typo costs a 2 s desk visit (`WriterScene.js:692`). Stray keys also count as typos (`typing.js:63-66`), so a player who rests a hand on the keyboard builds debt. The typing card says nothing about it (`teach.js`, `typing`).
Case: a mediocre typist ends four desks with 25 typos and meets the press with 50 seconds of desk fixing, two homing proofreaders, the Editor and the Friday clock.
Fix, three small changes:
1. At the end of each desk, show one line: `hits/total clean. N typos.` and, if N > 0, Emmerich or Tomasz drops a bark once: **"Typos keep. They'll be waiting at the printworks."**
2. Cap carried typos at 8 (`this.typos = Math.min(8, ...)`) and ignore keys that are not letters near the line (a stray key with no letter within 400 ms of the line does not count).
3. Scale pages a little by accuracy so the desk feels like work: pages = `Math.round(desk.pages * (0.75 + 0.25 * hits/total))`; the pages gates already have 6 spare pages at 60 (30+30), so tune the gates to 55/27/11 to keep them fair. Size S.

**W-M3. Page three is planted and never shown.**
Emmerich says "Page three. Cut it." in the café. The page three text (`cast.js` PAGE_THREE) is only seen in chapter 5, and nothing Jo typed at desk 2 was that text: desk letters are a fixed nonsense ring (`typing.js:10`, WORDS). The strongest payoff in the dream does not remember what the player did.
Fix: make desks type the book. Replace the ring with the paragraph for that desk: desk 2 types the first lines of PAGE_THREE (so "the copy shop opened at six and the light in it was the colour of skimmed milk" is literally what the player writes), desk 1 the FIRST_PARAGRAPH (which the ending reuses, a nice rhyme), desk 3 and 4 other lines from `cast.js`. Show the typed text growing at the foot of the typing box. Then "Page three" in chapter 5 is a page the player has half-memorised. Size S-M (the `Typing` class already has a text ring and `nextChar()`).

**W-M4. The dog gate needs [Q], and nothing teaches [Q].**
`rooms.js` `g_dog` hint is "wake the dog"; the dog label is `bound` (`rooms.js` dog `bound: true`) so the pen is refused; the only way is `noiseBurst` on `keyQ` (`WriterScene.js:1352`). The Q key is not in `teach.js`; the fresh_review docs do not mention it.
Case: a player faces a sleeping dog behind a gate, tries E (nothing), X (nothing), the pen (refused) and leaves the dream or looks it up.
Fix: add a card `noise` triggered when Jo first stands within 3 tiles of the dog or the first talker: name "MAKE A NOISE", hint "knock to wake, distract, or turn heads", key "Q". Change the g_dog hint to "wake the dog (Q)". Size S.

**W-M5. Two labels in the city can never be solved.**
`rooms.js:273` ledge "narrow" wants "wide"; `rooms.js:276` crane "slow" wants "fast". `wake()` sets `this.words = this.words.filter((w) => w === 'honest')` (`WriterScene.js:1205`), so after the bag Jo holds "honest" and, later, "again". "wide" exists only on the first café talker; "fast" exists nowhere in any room or script (grep: only the label and `onEdit`). The dev warp hands both words out (`WriterScene.js:1907`), which hides this in testing. A player sees a pen prompt on two labels and no word that works. The ledge is bypassed by a jump (gap of 4 tiles) and the crane just rides slowly, so it is not a hard lock; it is a visible dead puzzle in the chapter after the dream took the pen away.
Fix: delete the ledge label and tiles (the jump is the lesson) and give "fast" to Jo in the agent scene: at the end of Isolde's d5 add `{ name: ISOLDE, text: 'Fast, Mr. Jo. Everything is fast now.' }` and call `addWord('fast', 'Isolde')`. Then the crane is the one rooftop pen puzzle, earned from a person in the same chapter. Size S.

## 1.4 SHOULD

**W-S1. The rent costs nothing and the line is unclear.**
`WriterScene.js:559-568`, `cast.js` `rent_yes`: she says "The rent." and then "...Well. I'll not ask what it's about." Jo says nothing. Tomasz then says "Rent's covered" (`tomasz2`), so who paid?
Rewrite:
- MRS. ADESANYA: "The rent, Mr. Jo."
- JO: "Tomasz paid me. Four machines, in pennies."
- MRS. ADESANYA: (counts it) "Pennies. It's all here."
- MRS. ADESANYA: "And the book? ...No. I won't ask. Thursday, next time."
Optional: take 12 of the player's coins (never below zero) so paying is felt. The coin economy already has pickups everywhere.

**W-S2. "machine 5/4 running".**
`WriterScene.js:676` counts the lever machine and the toner machine into `machinesFixed`, so the player sees "machine 5/4" and "6/4". Count only machines 1-4 for the label and the rent test, or show `n/6`. Size XS.

**W-S3. The bag theft has no reaction.**
`WriterScene.js:1194-1214`: fade, pages 0, float text "the bag is gone.", objective blanked. Give Jo three beats when the fade lifts (a caption each, 1.5 s apart): "...", "The bag was on my knee.", "Sixty pages." and set the objective to `the rain. keep walking.` instead of `''`. Size XS.

**W-S4. The Editor teaches in a room with nothing in it.**
The rain room is flat walking (`rooms.js` rain room has only two lamps) and the Editor trails at 168 px/s against a run of 280 (`WriterScene.js:123`), so nothing in the tutorial can go wrong. The flat's Editor is 40 px/s. The first time it is dangerous is the agent chase.
Fix: in the rain add three props that cost a pause: a puddle jump, a bench to step over, a bus stop sign to hop. Do not add hazards. Raise the flat's editor from 40 to 70 px/s but keep its halt when Jo decides. Size S.

**W-S5. Moments show nothing.**
`rooms.js` m1/m2/m3 are text-only `pause` prompts. m2 ("the man in the hat, at the bar") sits at the café entrance on top of checkpoint CP2a (`rooms.js:110-114`, both x=129), where there is no bar and no hat man. Compare the Musician's Moment which is physical (sit on the stage edge).
Fix: stage each with a person: m1 Tomasz sitting on a crate behind the shop with a sandwich and a page; m2 the hat man sitting alone at the café's counter end; m3 the landlady sitting on the stair. The `person(id, {sit:true})` helper and `wr-p-*-sit` textures already exist (`WriterScene.js:235`). Move m2 off the checkpoint x. Size S.

**W-S6. The press stacks too many clocks.**
Friday timer (360 s * 0.9), Editor following at Jo's level, rollers, folder, proofreaders, lever order, feed plate first. Timer expiry costs a heart and resets to CP6a (`WriterScene.js:1671-1686`). Any one of these is fine. Fix: when Isolde's d5 ends, set the Editor to start only after the city rooftops (it already has `stop: 598`; start it at col 540, the press entrance, not 476). Then the city is the Friday clock alone and the press is the Editor, rollers and levers. Size S (`rooms.js:263` `from: 476`, change to 540).

**W-S7. Café "ladder" answer sits past the thing it fixes.**
`rooms.js` ladder broken to "fixed", but "fixed" is a talker's bubble on the mezzanine (x147) and the shelves (x133-136) reach it without the ladder. The puzzle has no use besides a shortcut. Either put the "fixed" bubble on the ground talker at x155 and move "awake" up (the dog word is used later anyway), or let the ladder be the only way to the picture-rail coins. Size S.

**W-S8. Wren's d1 introduces three things at once.** She gives "honest", a napkin, and a challenge in three bubbles, then the objective says "the napkin: her challenge". The first time the player meets the napkin, Wren is already gone from the dialogue: the second E triggers the puzzle with no preface. Add one line when the puzzle opens (Wren): **"Eight overheard lines. Make them one thought."** (the modal heading already says it; the line makes it hers).

**W-S9. Audio gaps (inferred).** Give the copy shop a machine bed (`['copier_thunk', 5, 9]`), the café a murmur + cup bed whose volume follows the noise meter, and the press a rhythmic roar that fades as each lever is pulled. The three beds can reuse `v.noise` as in `audio/events.js` `steam`/`paper`. Size S.

## 1.5 NICE

- **W-N1.** Make Emmerich the face of the Inner Editor in the last beat: after the book prints, the silhouette turns and for one frame is old Emmerich, who says "Good. Somebody should." only if page three was kept. Today the two are separate. Size S.
- **W-N2.** Sync the typing letters to the musicDirector beat so the typewriter pulse in the band is what the player is tapping. `typing.js` already has `beatMs`; read `musicDirector.clock` instead of its own `nextAt`.
- **W-N3.** Wrong-word jokes per noun (W-M1) as a list in `cast.js` (`JOKES`).
- **W-N4.** Make the four talkers four sprites (hat, bun, straw, cap from `PEOPLE` in `cast.js` already exist as rigs).
- **W-N5.** Card line when the player cuts every possible paragraph: "He cut everything he could. He still wrote it." Small, earned.

## 1.6 What is GOOD, keep it

The copy shop. The talker whose word opens the next gate. The library's five different source puzzles and the guards that listen. Page three KEEP or CUT with the door light, and Wren's "Good." for both. The bag as a single cut. Music stopping in the rain. The flat built from Jo's own paragraphs, where `on:` makes cut paragraphs drop what rests on them. The Small Moment texts themselves. The any-key ending paragraph that rhymes with the first line.

## 1.7 Balance notes (game-balancing)

- Pages: desk 4 + 8 + napkin 6 + 12 = 30, +30 = 60 exactly, so the gates at 12, 30, 60 have zero slack. One pigeon bite (`WriterScene.js:1797`, -1 page) before desk 3 forces a replay of the napkin or a desk; there is no second source of pages. Either give the pigeon back its page when Jo shoves it, or lower the gates by 3.
- Memory puzzle: pages = 30 + used*5 (`WriterScene.js:809`), the cut target is 40, and the flat's paragraphs sum to 60 regardless. A player who places only three fragments needs a 5 page cut (one paragraph); a player who places six needs 20. Being thin is strictly easier and only the final card line rewards attention. Make the flat's door need `pages - 40` pages cut OR leave the card as the only reward and say so in the puzzle ("thinner book. easier edit. fewer lines on the card.").
- Typo debt (W-M2) is the one hidden cost; surface it.

---

# PART 2: THE BIG STAGE (Musician)

Files: `src/dreams/musician/{dream,beats,dialogue,music}.js`, `rooms/*.js`, `encounters/sets.js`, `verbs/trumpet.js`, `src/engines/rhythm.js`, `src/play/encounterPresenters.js:118-262`.

## 2.1 Minute by minute, first-time player (inferred)

| When | What I see and do | What I want next | Mark |
|---|---|---|---|
| 0:00 | Rain, the Meridian marquee "SATURDAY - THE BIG STAGE". Jo: "Saturday. Big stage. That's... that's the whole thing." 3 s later: "Everything before that is just waiting." | Go. | GOOD: the thesis is spoken in the first ten seconds, in character. |
| 0:20 | Horn in a shop window; bark "[Q] plays the horn". Q rings it back. | The Cellar. | GOOD, a tiny reward for curiosity. |
| 0:40 | Bouncer: "Case like that, you are a musician. Musicians go round the back." | Round the back. | GOOD: characterisation in one line. 2300 px of street with one NPC; the high road (shelter, car, awning) pays coins. Light but readable. |
| 1:30 | Alley. Dead neon over the stage door. "[E] play the dead neon". Two phrases of four notes, 3 retries. Door lights. | In. | GOOD teaching: listen, answer, safe. |
| 2:30 | Cellar. Delphine: "If the bartender stops washing glasses, you were good. If Ray looks up, you were very good." Ray at the end of the bar, back turned. | Play. | GOOD setup. The room reads. |
| 3:30 | Open mic: six phrases, [1,1,1,1], [1,1,1,1,1], repeated. About 40 s. | Variety. | Boring after phrase two (M-M1). |
| 4:15 | "Nine people clap." Ray puts his coat on and goes. Delphine: "Come back Tuesday." | Why did Ray leave? | GOOD: the reward is a quiet sting. But five people sit in nine chairs (M-M3). |
| 4:45 | Alley, Ray with a cigarette: "You played every note right. ... A player piano plays every note right." | Ok, rests. | The lesson is told, not played (M-S1). The line is false if I missed notes (M-S1). |
| 5:30 | Loading door opens to Saturday. Marcus by the dock with news and a choice. Roadies. Catwalk with the laminate. | The laminate? | Where did a laminate come from? (M-M4). |
| 6:30 | Marcus: "Then go" / "Play this one. Then go" / [say nothing]. Narration is spoken as Marcus's line. | Tally. | Strong scene, wrong delivery (M-M5). Marcus is optional: a player can walk past him. |
| 8:00 | Tally: "Nine people at the Cellar. I count. It's what I'm for." Two conditions. "Deal" or "Nia plays or I don't." | The stairs. | GOOD: a choice with a mechanical cost on both sides. |
| 9:00 | Fire stairs: ten landings, three wisps, crowd roar rising, a ledge for coins. Halfway lamp. | The top. | GOOD set piece. Repetitive footwork, and the sound is the reward (inferred). |
| 10:30 | The Big Stage. Play the set: three songs, the blank, a held note. About 70-90 s of play. | The end. | The climax is the shortest segment (M-S3). |
| 12:00 | Work lights, crew striking, "Who was that?" "Dunno. Trumpet guy." A folding chair, the case, the orb. | The card. | GOOD. The best anticlimax in the game. |

About 11-13 minutes first run. Inside the roadmap's 6-10 bar plus a little; I would not cut anything.

## 2.2 Aspect by aspect

**Characters.** Delphine, Ray, Nia, Marcus, Tally, the bouncer are each one voice with one wish: Delphine wants a good night, Ray wants truth, Nia wants the third bar, Marcus wants his kid, Tally wants a schedule. That is the dream's real strength. They do react to Jo: nine people turn on every phrase landed; Ray leaves; Marcus changes the drummer; Nia disappears in the Tally path; Nia hands you a coffee in hers. Problems: Marcus stands (known); the session bassist is the Scalper sprite (`stage.js` `cast: 'npc-scalper'`) and the session drummer is the Roadie sprite, so the replacement musicians are other people's faces (inferred; fine if intended, say so); "napkin" is paid off in the ending and never set up (M-M5).

**Level.** Six rooms: street, alley, cellar, backstage, stairs, stage. Each is a different world with one job, gated by a thing you did one room earlier (neon opens the door, the gig opens Ray, laminate and Tally open the stairs). Dead ends are all coin-paid high roads. Weak spots: the street's 40 columns between the bouncer and the arch hold nothing but coins; backstage has a sofa, a mirror station, a double bass and an amp nobody touches (`backstage.js` props).

**Obstacles.** Few and one kind: feedback wisps (alley x2, backstage x2, stairs x3), all answered by the same [Q], plus two roadies. Fair and readable, never escalates; the third wisp room is the same puzzle as the first. The stairs are the dream's only platforming and they are ten near-identical landings (`escape.js`). This is the lightest dream on the body, which suits a night about listening (GOOD), but the stairs are the climb to the climax, so give them one change of rule: say, landing 6-7 has a wisp you cannot silence by Q because Jo is on a gap (ring radius 150 versus a wisp over a jump); or a lit landing where the roar is loud enough that Q is muffled for 3 s. A single sentence of difficulty, not new art.

**Story.** Told through people, not text: Ray's coat, Delphine's "Tuesday's the whole job", Tally counting, Marcus's kid, the stage door that opens on work lights. Lands. The ending ("Eleven minutes, and then the next act.") is excellent. Gaps: the refrain "don't rush the third bar" has no mechanical form (M-S2); the laminate and napkin are unplanted.

**Objectives.** The best in the game: one line per room, shown before commit, rewritten on every state change (`dream.js` objectives). Clean.

**Movement.** The body is asked for hops, climbs, a few jumps; it never uses run, slide, crouch or ladder (known light). Fine for a dream about waiting, as long as the set is the payoff.

**Music and sound.** Designed per place with real intent (`music.js`): jazz noir D Dorian in the street, a closer slower trio in the cellar, rock heard through the door backstage, arena power chords on stage; the alley hears the cellar through the wall (`alley.js` `music.wall`). GOOD: this is exactly what audio-design asks for. Problems below (M-M2, M-S4).

## 2.3 MUST

**M-M1. The first two gigs are the same four taps.**
`encounters/sets.js` neon: `[[1,1,1,1],[1,1,1,1]]`; cellar gig: `[[1,1,1,1],[1,1,1,1,1],[1,1,1,1],[1,1,1,1,1],[1,1,1,1],[1,1,1,1,1]]`. With one key and no rests, a phrase of all notes is "tap evenly four times" (or five). Six of them in a row, 40 seconds, is the dream's first test of skill and it has no rhythm in it.
Fix, rhythmic and buildable in `sets.js` only: give phrases real syncopation using the half-beat the engine can represent if beats are subdivided (`beats` entries per half-beat) or, without engine change, use rests earlier. Cellar gig as three tiers: phrases 1-2 even taps, 3-4 `[1,1,0,1]`-style gaps taught by Delphine, 5-6 a push into the next bar `[1,0,1,1]`. This also fixes the teach-then-test gap in M-S1 (rests appear in the Cellar, Ray names them in the alley, the set uses them). Size S.

**M-M2. Gig results are read by nothing, and the notes you play are not the notes of the call.**
Results: `engines/rhythm.js:117` returns `perfect`, `misses`, `freezes`, `passes`. grep finds no reader: `scene.onGigPhrase` (`encounterPresenters.js:241`) is never defined, and `cellar_done`, `set_done` and the ending lines (`beats.js`, `dream.js` ending) are fixed. Case: Jo freezes three times in the Cellar and "Nine people clap. The bartender has stopped washing glasses." plays the same as a clean run; Delphine and Tally say the same lines.
Notes: the call previews `trumpet((ev.i * 2) % 12, ...)` (`encounterPresenters.js:228`), so every phrase plays 0,2,4,6,8 from the start; Jo's answer plays `trumpet((pitch++ * 2) % 12, ...)` (`:232`) where `pitch` starts at 0 and never resets (`:199`). Phrase 1: call 0,2,4,6, answer 0,2,4,6 (match). Phrase 2: call 0,2,4,6,8, answer 8,10,0,2,4 (no match). So after the first phrase "call and response" is two different tunes. Also `TRUMPET_SCALE` is C major (`systems/audio.js:229`): fine over D Dorian (same notes), and in the stage's E Mixolydian band the C, F and G are a semitone off C#, F#, G#, so the climax lead rubs against its own band (inferred, needs ears).
Fix:
1. Write real melodies in `sets.js`: each phrase carries `notes: [0,2,4,2]` (index into the room key's scale), and `rhythm()` passes `note` in `preview` and `hit` events. The player's hit on beat i plays `notes[i]` — so playing correctly plays the tune that was just played to him.
2. `trumpet(pitchIdx, ..., key)` takes the room music key's `mode` and `root` (`music.js` already has them) so the stage's lead is E Mixolydian, the street's D Dorian.
3. A tiny result hook: `onWin` gets `result`; set `F.gig_clean` (no freezes) and `F.gig_perfect`. Use them:
 - `cellar_done`: if not clean, Jo's line becomes "Nine people clap. Politely." and the bartender's glass stays in his hand; if perfect, add "The bartender has stopped washing glasses."
 - `delphine_after`: unchanged for clean, **"You came back from it. That's the job, honey. Come back Tuesday."** for freezes.
 - `ray_lesson` first line (see M-S1).
 - `set_done`: if freezes > 1, Jo's line "Eight thousand people. I think they forgave me." (Not a fail state: the engine promise "always finishes" stays.)
Size M (touches engine events, presenter, sets, three beats).

**M-M3. "Nine chairs" holds five people.**
`cellar.js` seats five audience (`a1-a5`), the report says "five taken", but Delphine, Jo, Tally and the ending all say nine ("Nine people clap", "Nine chairs", "Nine people at the Cellar. I count."). Tally's line is a hook; the player counts five.
Fix: add four more `audience` entities (the Evening cast already supplies `ev-p-*` faces; reuse four others) so all nine chairs are taken. Then the Moment line "A woman with her coat on, eyes closed, still in hers" can point to one of them: tag `a2` with `coat: true` and have the moment camera push to her. Size S.

**M-M4. The laminate is unexplained.**
`backstage.js` header: "Jo's laminate fell up on the catwalk". Nothing before this sets up that Jo had a laminate; the first mention is the objective text. A player asks "what laminate?"
Fix: give it a cause in a line Marcus says on first contact. Replace Marcus's `start` with: **"Jo! Your laminate went up on the catwalk when a roadie shoved the sofa. You go on in an hour. Get it before Tally finds you without."** and, in `BARKS`, change `roadie_mind` so the bark that plays on entry is Marcus (one voice, not two). Size XS.

**M-M5. Narration spoken by Marcus, and the napkin never planted.**
Known (`fresh_review_design.md` F-dialogue): `go`, `stay`, `silent` are spoken by Marcus but describe him ("He hugs you, hard, and goes out through the loading door."). Rewrites that keep the choice, the beat and the Evening flag:
- `go` (Marcus speaks): **"Then I'm gone, Jo. Tell the kid I tried the drums."** Then a caption (not a speech box): `He hugs you hard and goes out through the loading door.`
- `stay`: **"One more. Then I'm gone. Don't rush the third bar."** (keep)
- `silent`: Marcus: **"...Okay."** Caption: `He waits. Then he picks up his sticks and walks.`
Napkin: `m3` says "a kid who thinks daddy's a drummer because he saw a napkin", and the ending says "He kept the napkin" (`dream.js:149`). Nothing sets up what the napkin is. Rewrite `m3`: **"You've got the set. I've got a kid with our first set list on his wall. I wrote it on a napkin. He thinks daddy's a drummer. I'm telling you what I need."** and the ending line: **"Marcus drove home Sunday. The napkin is still on his boy's wall."** Also: Marcus is not gated (`backstage.js:` gate needs laminate and offer only). A player can ignore the dream's emotional centre. Make him walk to Jo when the loading door opens (an `auto` conversation as the Writer's `d5 auto: true`), or add `marcus_call` to the gate's `requires`. Size S.

## 2.4 SHOULD

**M-S1. Ray's lesson should be played, and it should not lie.**
`dialogue.js` `ray_lesson` r1: "You played every note right." is false after a freeze; and rests are lectured here and tested for the first time at 120 bpm in the climax. Ray's lecture is the right length; give it a rehearsal. In the alley after `r3`, Ray claps a two-phrase rest drill (`[1,1,0,1]`, `[1,0,1,1]`, retries 3, no nerve) as a third `encounter` ("Ray's lesson", `onWin: 'ray_drill_done'`) and the gate opens on that instead of on the dialogue. And branch r1 on `F.gig_clean` (M-M2): clean: "You played every note right." not clean: "You played most of the notes. That isn't what I'm about to say." Then `r2` works either way. Size S-M.

**M-S2. The third bar is the refrain and has no mechanical form.**
Nia says it five times (`nia_rush`, `nia_after`, `nia_backstage_after`, `nia_wing`, bark `nia_set`), Marcus says it, the ending says "You didn't rush the third bar". The engine cannot rush: `press()` records only true/false.
Fix: in `rhythm.js`, store each hit's offset (`t - best*B`) in `s.offs`, add `rush` (mean offset of hits on beat 3, negative is early) to the result, and set `F.rushed` if mean < -35 ms across the set. Ending: rushed gets **"Third bar. Every time. Somebody was listening."**; clean gets the current lines. Also the ring on the HUD for the beat during the set could show a faint "3" on each third beat of the phrase when Nia is in the band. Size M.

**M-S3. The climax is the shortest segment.**
Set: about 13 phrases at 120 bpm is roughly 60-90 seconds against "eleven minutes" in the title and card. This is a feel choice (the dream says the best part was before) but the rule "the set is the dream" is undercut. Fix: do not lengthen; add two beats of staging. (a) A count-in with the crowd: for the first 2 beats, the chant from the crowd band (`crowd_front` prop exists); (b) after each song, a 1.5 s breath with a camera push (song 1 to 2 to 3), so it reads as three songs, not 13 phrases. The engine already has `phrase` events; group by `songIndex` in `bigSetPhrases`. Size S.

**M-S4. The street is flat for 40 columns.** Between the bouncer (x29) and the arch (x71) there is nothing to do except coins. Put the horn shop's lesson to use: a second resonant object (a bus-stop glass pane that rings, a bin lid) so Q has a second answer before the first wisp; or move the bouncer to x55 so the player has to cross the street's props to meet him. Size S.

**M-S5. Backstage props that do nothing.** Sofa, mirror station, double bass, amp (`backstage.js` props). Put Nia on the sofa tuning (she is "beside Tally" now), Marcus on the case stack next to the roller door (the roadmap's "Marcus sits"), and the mirror station as a one-line interact where Jo sees himself before the set: **"Tuesday's face. Saturday's jacket."** Size S.

**M-S6. The stage's replacement musicians.** `session` uses `npc-scalper` and the drummer `npc-roadie`. If Jo takes Tally's deal he is flanked by a ticket seller and a stagehand. Make it a joke on purpose: the stagehand drummer says **"Click track's on. I do weddings."** and the bass **"I read the chart, I play the chart."** (existing). Size XS.

**M-S7. Stairs: one change of rule.** See Obstacles. Choose a landing (index 6, `[22,19,29]`) where the roar is loud enough that [Q] works with a 1 s breath (`BREATH_MS` 380 to 1000) so wisps there must be jumped. Size S.

## 2.5 NICE

- **M-N1.** The ending line when Jo took Tally's deal and Nia is gone: add Nia on the wing coat rail watching, no dialogue, `when: choice_tally, after: set_done`. One sprite.
- **M-N2.** The folding chair in the ending: a prompt "sit" that plays `sit_down` (the anim exists in `moment_nine`) and holds on the empty room for 3 s before the orb. Makes the last beat an action, not a walk.
- **M-N3.** Echo: both dreams use "nine chairs" (Writer bookshop and `SCENES s12 'nine chairs'`; Musician Cellar). If deliberate, let the Evening mention it once; if not, change one.
- **M-N4.** Coin sound: busker coins could ring in the room key, reusing the M-M2 scale.

## 2.6 What is GOOD, keep it

The one-job-per-room objective text. The neon as a safe tutorial. Delphine's setup and Ray's coat. The Cellar's "house lights down, a spot finds Jo, chairs turn one by one". Tally's two-sided deal with different rests/blank mechanics. Nia's three possible voices. The stairs with the crowd roar from the far side. The strike-down ending and "Dunno. Trumpet guy." The music per place, with the alley hearing the cellar through a wall. The [Q] verb being useful against wisps, roadies and the shop horn.

---

# MAJOR changes (ask the owner first)

1. **Writer: rebuild on the framework (roadmap item 8, "keep the pen").** Why smaller fixes cannot do it: `WriterScene.js` is a 1960-line imperative scene (not data-driven like `src/dreams/musician/`). Pen, typing, puzzle boxes, the Editor, the press and all flags live in one class, with a dev warp that hides defects (W-M5). The fixes above are all small and I recommend doing them **first** and cheaply in the current scene, because they decide what the rebuild keeps. The rebuild would then move: pen labels to a verb (`verbs/pen.js`), typing and the three puzzle boxes to encounters with presenters (like `rhythm`), rooms to `rooms/*.js` with `entities`, the Editor to a hazard type, and dialogue to the node graph with choices (page three, the rent). Trigger for a rebuild: the owner decides on the length question below.
2. **Writer length.** Real length is 25-30 minutes against a 6-10 bar. If the bar is firm, chapters 4 and 5 must compress (post office + bus + rain + rewrite + flat become two rooms), which changes the story shape. Options: (a) keep the length and update the bar for the Writer only; (b) fold bus and rain into the post office's "later" with the bag taken inside the same room. I recommend (a): the dream is about slow work, and the middle is where the story lands.
3. **Musician: gigs with pitch and offsets (M-M2, M-S2).** Not a rebuild, but it changes `engines/rhythm.js`'s event shape and the presenter, which the Gambler/Clockmaker do not share. Safe if tests in `tests/rhythm.test.js` are updated alongside. Listed so it is a conscious change.

# Priority order for the next job

Writer: W-M4, W-M5, W-M2, W-M1, W-M3, W-S1, W-S2, W-S3. Musician: M-M4, M-M3, M-M5, M-M2, M-M1, M-S1, M-S2. Both jobs are independent files and can run in parallel.

# What I did not check

No play-through, no screenshots, no audio listening. Jump and landing reach on the stairs and the catwalk (4-row hops) was taken from the repeated 4-tile spacing, not measured; the trunk-on-the-stair case in the attic (a pushed trunk rolling onto the first stair at col 48) and the dumbwaiter ride were not simulated. Pressure in the press room (Editor + clock + hazards) is a read, not a measured death rate.
