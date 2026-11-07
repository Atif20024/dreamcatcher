# Fresh review: the game as a player's whole experience

Reviewer's lens: design, pacing, economy, variety, story, dialogue. I did not play the game. Everything below comes from reading code and data, so anything about how it feels, or how long it takes, is marked **(inferred)**. I did not read `advice/` or `round2/` before writing this. Checklists applied: gamedev:platformer, level-design, game-balancing, dialogue-systems, puzzle.

## Does this lens suggest a major revamp? NO

The frame holds. The room-and-door framework, the four rebuilt dreams, the hub and the Evening are a coherent game. What I found is a mismatch between the hub's progression rules and the amount of content, plus tuning and variety gaps. One item (M1) is a core-design decision, not a rewrite. The rest are fixes.

## Scorecard (inferred from data)

| Dream | Rooms / size | Length (inferred) | Tension shape | Core verb | Verdict |
|---|---|---|---|---|---|
| THE STOPPED HOUR (clockmaker) | 4 rooms, 166 tiles | 3-4 min, below the 6-10 bar | Flat. No foe, no hazard, a patient dial that "never fails". | Timing sweep, once | A good opening line and a thin game. |
| THE BIG STAGE (musician) | 6 rooms, strong escalation (neon, cellar, backstage, stairs, stage) | 10-12 min | Best curve: small room, then a bigger room, then the arena. | Call and response, 3 gigs with a growing verb (rests, blind phrase, held note) | The reference. |
| THE MASTER'S LADDER (painter) | 7 rooms | 12-15 min | Rungs of a trade, ending in a contest with a clock and a rival. | Same timing bar 4 times | Great place and writing. The mechanic is monoculture. |
| THE LAST HAND (gambler) | 7 rooms | 15-20 min | A real money arc with its own stakes (slate, tilt, marker). | Faro, poker, the slate, standing up | The best-designed dream, and the steepest to learn. |
| FIVE-STAR DREAM (chef) | One 320x40 strip, 6 gates | 12-15 min | Fetch chain. Rush, lift, 3 service waves. | Valve, ticket rail, rush, waves | Most mechanic variety per minute; old presentation. |
| THE QUIET ABOVE (astronaut) | One 522x64 strip, 6 phases | 20+ min | Stat grind, a rejection and retry, then a sim, EVA and the moon. | Many | Most ambitious. Sprawls. |
| THE SECOND DRAFT (writer) | Large, 4 desks plus chase | 20 min | Rising: writing, loss, rewrite, cut. | Typing lane, label-editing, pencil | Best conceit and best payoff line ("page three"). |
| THE LONG EVENING | Open town | Free | None, by design | Help | Right ending, not yet fully fed (see F10). |

## MAJOR REVAMP

### M1. The hub's progression model is built for 5 dreams; the game has 7 playable (and more coming)

Evidence:
- `src/scenes/HubScene.js:91` has `this.N = Math.min(5, this.save.dreamsCaught)`. `src/systems/hubState.js` is a table for N = 0..5. `src/utils/save.js:34` caps difficulty at 5.
- `HubScene.js:1232` closes Bilal's shop at `N >= 5` ("Keep the change"). Pemberton says "Five. The board's out of dreams" (`HubScene.js:55`). Seven trains still run. After the fifth catch the station has nothing left to show, so dreams six and seven play with no hub consequence.
- `docs/DESIGN.md` still describes a Counter boss, 3 lives and a tutorial street. None of them exists. `src/data/hub/rooms.js:150` has the service gate `alwaysOpen`, and `LAST_STOP` is "no count to clear" (`src/data/dreams.js`). So the Evening is reachable at minute two. The "each dream was not enough" arc only works if the player chooses it.
- Two board lines (athlete, platform 3; doctor, platform 8) have no scene. They show as `DELAYED` with a conductor line "nothing runs on them yet" (`HubScene.js:1150`). They sit in the first screens of the platforms.

Why smaller fixes cannot solve it: the station tint, the crowd, the music, the shop, the heart cap, the difficulty cap and the Evening's cast all key off one count. Rescaling the table to 9 leaves the problem: "caught" means "stopped being a choice".

Recommendation (owner's call): make it **"the board takes five."**
- Any 5 of the N running dreams. After the fifth catch the remaining trains show "NOT TONIGHT" and the station goes silent. The table at 0..5 then stays correct.
- This matches the thesis: you cannot catch everything.
- It also gives the order of play meaning and gives replay value.
- Keep the Evening open from the start only if the owner wants it as a standing escape. Otherwise gate it behind one catch.
- Delete the athlete and doctor board lines until they are built, or make them clearly dead props with no conductor dialogue.

## FIX

**F1. A first-time player's first choice is unguided and ordered against gentleness.** (Inferred.)
- At first visit the objective is blank (`HubScene.js:171`). The only help is Pemberton "How do I choose? People usually don't" (`HubScene.js:1070-1078`). Platform 1, nearest the entrance, is the Chef, a 10,240 px, 6-gate gauntlet. The gentlest dream (clockmaker) is platform 9, a minute's walk away at the 80 px/s default (`HubScene.js:124`). Platforms 3 and 8 are dead.
- Rule: level-design "teach, then test"; game-balancing "first failure no earlier than 10-15 minutes".
- Fix: swap the platform numbers in `src/data/dreams.js` so the clockmaker is platform 1 and the live dreams are contiguous. Add a mood or length word to each board row (`boardRows`, `HubScene.js:702`): "A SHORT ONE", "A LONG NIGHT".
- Set the first-visit objective to "the board in the hall: choose a train" instead of blank.

**F2. The clockmaker is too short and too flat to be a dream.** (Inferred.)
- 4 rooms, one NPC, no foe or hazard. The one encounter cannot fail (`src/engines/clockwork.js` header: "never fails"). The only dialogue choice is cosmetic: "Why me?" and "I'll seat them" both go to `w3` (`src/dreams/clockmaker/dialogue.js`).
- It also teaches nothing that matters later. The hearts and foe teach cards never fire here.
- Roadmap #5 already plans six areas. What to add: a second use of the dial with a different shape (three clocks with three tempos: church, station, market), one small hazard room so hearts and the shove card appear, and let "Why me?" change Nell's last line.
- Rule: platformer "one mechanic per area before combining"; level-design sawtooth.

**F3. Four of the dreams' main verbs are the same input: one press when a marker is in a zone.** (From code.)
- `clockwork.js` (clockmaker), `craft.js` (painter, 4 encounters: grind, drapery, masterpiece, giornata, `src/dreams/painter/encounters/jobs.js`), `typing.js` (writer, 4 desks), `rhythm.js` (musician, 3 gigs).
- Inside the painter, three of four jobs differ only in `speed` and `zone` numbers (0.55/0.24, 0.65/0.20, 0.75/0.17). A miss only "slows the sweep" (`craft.js` header). The twist (plaster clock, rival) arrives only in the last job.
- Rule: puzzle "introduce, develop, twist, test". The middle jobs have no twist.
- Fix, smallest: bring the contract's scarcity (`src/dreams/painter/contract.js`) into the test piece. Jo picks 2 of 3 materials before he starts, and the steps spend them. Make the grind a hold-and-release rather than a tap.
- Longer term, give each of the four timing games one defining rule instead of just a different speed.

**F4. Difficulty scaling is half-wired.** (From code.)
- `DESIGN.md §4` promises difficulty by dreams caught. `difficulty` is read only in Chef (`ChefScene.js:289,362,421,536`), Astronaut (`AstronautScene.js:143,884,1234`) and the legacy scenes. The four framework dreams ignore it; there is no read of it in `src/dreams/` or `DreamScene.js`.
- Hearts do grow (`BaseLevel.js:99`: `3 + difficulty + shards/3`, cap 6), so a sixth-picked clockmaker is no harder and gives more hearts than a first-picked one.
- Fix: let an encounter's `params` function take difficulty as a second argument (it already takes `F`: `src/dreams/musician/encounters/sets.js` `bigSet`). Scale `speed`, `zone`, `retries` by 0, 1, 2 tiers. This is the same rule you already use in Chef.
- Rule: game-balancing, "balance for the median, gate the tail".

**F5. Coins buy nothing that changes how a dream plays.** (From code.)
- Faucets: ~1,800 total across 7 dreams (budgets in `dreams.js`: chef 5 x ~70, astronaut 10 x ~50, clockmaker 3 x ~35, and so on).
- Sinks: shards 150/300/600 for one extra heart (`HubScene.js:1236`; cap 6), postcards 100 each, ticket 250, hats 1,200 total, tea 20. Total ~3,200 against ~1,800 income, so there is no inflation risk and no pressure.
- Hearts are almost irrelevant. The clockmaker has no hazards. Death sends Jo to the last checkpoint with a full refill and costs only the coins since that checkpoint (`BaseLevel.js:487,628`), and checkpoints are one per room. The ticket (250) only skips a free death card.
- Rule: game-balancing, "a reward is worth the effort it needs". Spending should change play.
- Fix: make the postcard (marks the 3 small moments) the headline sink. It feeds the Evening's count, which is the story. Tie the ticket to something that costs: let a death with a ticket also keep the scattered coins.
- Fix: the shop closing at N >= 5 is lovely but wastes the player's peak wallet. Under M1 it is fine; keep it.

**F6. The astronaut's medical is three hold-Space waits.** (From code.)
- `AstronautScene.js:640-660`: TREADMILL 1.8 s, BREATH `1.2 + 0.3 x lungs` s, GRIP 1.5 s. Then the Board. The stat checklist "reach 3 pips in every stat" (`AstronautScene.js:207`) is the first thing the player is told.
- This is a cutscene dressed as a test, and a spreadsheet as a goal. The pips come from the rooms (pool, track, wall, ring), which are real play. The exam should be a result of play.
- Fix: replace the holds with a readout of what the player did ("Lungs 4: the pool"), and the first objective with a human line ("Selection is in nine weeks").
- The rejection and retry beat is good. Keep it.

**F7. Chef's service waves use unseeded randomness.** (From code.)
- `ChefScene.js` `nextOrder()` picks stations with `Phaser.Utils.Array.GetRandom`, and decoys likewise. A bad order changes the run. Failing three sends Jo back (`missOrder` -> "REFIRE").
- Fix: seed the order list per attempt so a retry is the same test. Rule: puzzle "seeded refill RNG / deterministic".

**F8. Dialogue: older dreams and a few framework lines.**
- Chef, Astronaut and Writer use blocking `DialogueBox` arrays with no choices, flags or portraits beyond a name (`src/data/chefMap.js` `DIALOGUES`, `astronautData.js`, `data/writer/cast.js`). The four framework dreams use the node graph with choices, `set` and `effects` (`src/narrative/DialogueRunner.js`), which matches the dialogue skill.
- Choices that carry consequences are few. In the Musician, `choice_tally` and `choice_nia` change the set; `marcus_left` reaches the Evening. In the Painter, `choice_bice` changes the last card. The Clockmaker has none that matter.
- Narration is spoken by characters: `musician/dialogue.js` `go`, `stay` and `silent` are `who: 'marcus'` lines that read "He hugs you, hard, and goes out." That should be a caption, not a speech box.
- Repetition: "Rush the third bar and I will end you" appears three times (`nia_wing`, `nia_backstage_after`, bark `nia_set`).
- Strings are inline, with no line IDs. The skill says to author for localization from day one. Low priority for one language; note it for later.
- Fix: caption the narration lines, trim the duplicated Nia line, and give Chef and Astronaut at least one choice each when they are rebuilt (roadmap #6 and #7).

**F9. A named character is reused four ways.** "Wren": Nell's rig id is `wren` (`clockmaker/dialogue.js`), the Writer's Wren, the Evening's chess-playing Wren (`data/evening/cast.js:14,131`), and the racer's dreamer Wren Castellane (`docs/dream_racer.md`). Different people, one name; a player will assume they are linked. Rename the racer's (and ideally Nell's rig id).

**F10. The Evening does not yet pay off the newer dreams.** (From code.)
- `EveningScene.js:51` `DREAM_CAST = ['priya','nia','delphine','ray','marguerite','bastien']`. Nothing from the Clockmaker (Nell), Painter (Bice, Gualtiero) or Gambler (Lou, Fenn). Marcus is handled well via `marcus_left`.
- Roadmap #12 already lists it. When built, have each dream write one flag in its `persist` block (as `marcus_left` does) and read it in `buildPeople`.
- Easy first win: Lou at the rail, Nell lighting a lamp.

## NICE

- **Ending shape.** Every ending states the same thesis (the small thing was the point). The variations are good (a gambler who leaves, a clockmaker unnoticed, a painter who shares credit). Keep the Chef's "...Next." as the model for denial. Keep at least one dream whose catch does not feel like a win.
- **Hub board as a tracker.** Row text could show the *kind* of caught state ("CAUGHT: MARCUS WALKED" or "CAUGHT: SHE SPOKE") so the choice shows on the hub. Cheap and thematic.
- **Gambler onboarding.** It has the steepest learning curve: the slate, faro, 3-card showdown, tilt, the marker. It is the dream most likely to be picked "last" by a new player. Consider a one-line hub hint: "bring patience."
- **Hearts HUD in dreams without hazards.** The clockmaker shows hearts with nothing to take them. See `casino_r3_hud_debt.jpg`: the HUD there carries hearts, objective, dream name, coin count, purse block, title, caption, prompt and footer. The roadmap's own "HUD diet" item (#4) is the right call.
- **Stale cards.** `src/data/teach.js` still holds cards for legacy mechanics (`sound_bridge`, `stroke`, `reel`, and so on). Harmless, but it makes the file lie about the game.
- **Doc drift.** `docs/DESIGN.md` describes a game that no longer exists (Counter, lives, tutorial street). A new contributor will build the wrong thing from it. Replace with one page that matches the roadmap.

## What works (keep)

- Each dream hangs on a person's real regret and ends on a small, specific image.
- The musician's escalation (neon, cellar, backstage, stairs, stage) is the pacing template: small room, small win, bigger room.
- The gambler's slate is the best idea in the game: decide your exit before the entrance, and only standing up catches the dream.
- Soft failure (checkpoint, full hearts, never lose a dream) is right for the tone.
- Dialogue voices are distinct (Ray, Delphine, Lou, Emmerich, Chef Aurelio).

## Not verified

- Run times, difficulty feel, whether the first-ten-minutes flow confuses anyone, and the economy's felt value are all from code and data. Nothing was played.
- I did not check the audio, the touch layer or the art beyond three screenshots.
