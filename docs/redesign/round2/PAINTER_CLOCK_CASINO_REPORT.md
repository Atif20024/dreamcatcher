# Painter, Clockmaker, Casino: the deep review's items

Spec: `docs/redesign/advice/deep_review_painter_clockmaker_gambler.md`. **Nothing here has been seen or played.** I had no browser and no Vite server. The proof is pure tests, room-data checks and code reading. See "What must be rerun" below.

Results: vitest 356 passed (20 new). lint:content, lint:rooms and lint:scale are clean. `vite build` is clean. No framework system needed a rewrite. `src/play/Encounters.js` is untouched and no shared hook was added: jobs report through the existing `def.onRender`.

## 1. THE MASTER'S LADDER

| Item | What I did |
|---|---|
| MAJOR, each job its own rule | `craft.js` has a step `mode`. **Grind:** `mash` (crush), then `hold` (grind and temper). **Drapery:** `double` (fold and light; a pass ending between marks goes slack). **Test piece:** pick 2 of 3 in a conversation choice, using `stock` / `uses` / `instead`. Giornata unchanged. |
| MUST 1, a miss must cost | Soft and specific. Grind: "Flour, with gravel in it". Drapery: "Rope at the hem", and Bice offers to fix it that night. Test piece: a miss wastes the material, the panel repaints in azurite or ochre, and Folco's verdict changes. Nothing can fail the job. |
| MUST 2, lapis at risk | A rival's grab while carrying sends the stone back to Orazio's shelf (the review's cheaper option, because a pedestal in the street reads badly). Orazio: "Dori's boy sold it back to me for a penny". Gualtiero mentions the second bill. The return trip has its own rivals (`rivals_out` / `lapis_carry` flags) and its own bark, "They're after the blue". Orazio points to the high road. |
| MUST 3, Gualtiero | Speaks at the trial (a node in `folco_first`, standing at the foot of the dais). `gualtiero_deck` at the top of the ladder. `gualtiero_bell` plays inside the bell beat. |
| MUST 3, branch lines | **Reworded the review's line:** "I told them the fold was mine" is said nowhere in the dream, so that line now branches on `told_master`. The silent branch is verbatim. `bice_deck_named` keeps "Nobody will ever know which star was yours" literally true. I dropped the review's "third star" so the line can't contradict itself. |
| MUST 3, `told_master` | Read by `dori_deck_after`, which now answers "Who taught you that?", and by `gualtiero_bell`. |
| MUST 3, contract promise | **Added:** "The face is the master's hand" pays off on the deck. "No notary has ever climbed a scaffold. She paints it. On paper, it has always been mine." |
| MUST 4, Bruno | Red coat and strap on his own art. Porters get their own `foe-rn-porter` and an ordinary body. One bark when Jo comes up to his plank. |
| MUST 5, [Q] | Caption the first time a study is in reach. Ending line for 1 or 2 studies (`studiesLine`). **Bug found:** `resonant.r` is in tiles and the piazza set 90, so [Q] anywhere in the square took all three. Now 3 tiles; the dome really needs the climb. |
| SHOULD 6 | Second lines: woman, friar, beggar, Tonio. After the seal, inspectors become nodding NPCs (`npc-rn-inspector`). Not done: the review names no fix for its "streets never react" music gap, and all music was marked keep. |
| SHOULD 7 | Dori's "Done, boy. Take your time." when his bar fills. If Jo finishes first, his brush stops for a breath. |
| SHOULD 8 | Floor and pentice rivals leave after the seal. The bark moved to room entry. Guild side door not added: clearing the foes was the review's first option. |
| SHOULD 9, 10 | Line rewritten; `gualtiero_sealed` added. |
| NICE | Tonio's second line done. Coda naming Gualtiero is covered by `gualtiero_bell`. |

One small shared fix: `DreamScene.onSpeaker` now also matches `who_` ids, so `gualtiero_deck` and similar animate while speaking. `lou_quay` and `dev_deck` benefit too.

## 2. THE STOPPED HOUR

**A judgement call to check.** The review wants the seven strikes on the first exit to the green, and also a strike job in the yard, which is past the gate those strikes open. Those can't both hold. I made them one thing:

1. The bell chamber has a door out onto the hilltop, so Jo reaches the yard from above with the gate still shut below him.
2. A beat pans to the gate and the dark lamps.
3. Jo strikes seven. The shot holds the gate and Jo; each strike lights a lamp, gate end first. The gate opens on the seventh.
4. **If the player presses nothing, the clock strikes by itself** (`patient`), so the payoff can be played or just watched.
5. Going down through the gate triggers the green's own beat.

| Item | What I did |
|---|---|
| MAJOR / MUST 4, a place per gear | Dial (gear 1), `shaft` (gear 2, a physical item at the top), `belfry` (gear 3, new `escapement` engine; off the beat it slips one back), `yard` (strike seven). |
| Pendulum hazard | Three, each quicker, in the shaft; one in the belfry. Teaches softly: the first knock is free, none takes the last heart (`pendulumToll`), a knock drops Jo a ledge. Once wound they barely swing and can't hit. |
| MUST 1, staged payoff | As above, plus `green_lit`: the camera goes to Nell, who lights the last lamp herself. The orb only appears after this, so nobody skips the town's answer. |
| MUST 2, ending | First two lines as written. **Changed the third** to "Nell knew. Nell lit the last lamp.", because the clock lights the first one. |
| MUST 3, townsfolk | Watch man (lane) and pie woman (green bench), lines verbatim. Child at the lane window, painted as a prop since she must be out of reach. Not done: swapping the pie woman to an eating pose; she laughs nowhere and stays seated. |
| SHOULD 5, Why me? | `asked_why` changes Nell's closing line. |
| SHOULD 6, tick and tense | No tick in any key until wound; `*_going` keys then take over. **Also found:** the clock house's ambience loop ticked, and its one-shots struck the hour and rang a cuckoo. Stopped rooms now use `gm_office` ("a clock that never ticks") and new `clock_still` / `green_still` beds. Encounters set `tense`. |
| SHOULD 7, whistle | The child asks ("Can you whistle? [Q]"), whistles back and drops a coin. Near people still turn. |
| SHOULD 8, rig rename | Done throughout: `nell` rig, files, npc id, conversations, flags. |
| SHOULD 9, brass glow | Current window thickens for the first half second of a sweep. |
| Not done | The dreamer (review's Story note, no fix given). Hand-winding a lamp in the lane (NICE). Signpost text. |

Length is an estimate: 6 to 8 minutes by counting beats and rooms, not measured.

## 3. THE LAST HAND (rules and money untouched)

| Item | What I did |
|---|---|
| 1, barman | `npc-lq-barman`: a big man with a moustache, a green waistcoat and a glass. Line verbatim. |
| 2, the refuser's office | Three things. Brass under the high ceiling, which the first plank removes (coins ignore `unless`, so a plank takes them physically). **Added:** Mr Pell's old book, readable only with a clean book (no comps, no debt, no markers): Lou's three markers, 1884, "Carried to the next book". `pell_clean` replaces "Another marker?", which was wrong for someone who never signed. |
| 3, Dev | Split, verbatim. Added `dev_deck_back` to explain the third pipe. |
| 4, casekeeper | His lines and the lady's, verbatim. Her reply follows `casekeeper_told` rather than `faro_done`, so she can't answer something Jo never said. |
| 5, pipes | Third pipe on a lost night. **Moved from x35 to x32:** x35 is the pilot house door. |
| 6, tilt sound | `danger: 'throb'` in the card room and deck keys; `tense` asserted while tilted. The first comp warms the band (`saloon_warm`, 116 bpm, +20%) until the bank is done. |
| 7, Lou's hands | **Reworded:** "First time in forty-eight years", because "since 'eighty-four" is the dream's own year, and this matches `lou_end_after`. **Added:** his hands did not actually shake on screen, so his idle now trembles. On the landing he uses a new `pose: 'still'`. |
| 8, guard | `m_wake` moment; Lou's line at the rail, first time tilted there. |
| NICE | Pilot turns after the stand-up; Sorrel and Nico get table-3 lines; the lady paces. Not done: table-swap fade, Fenn at the quay. |
| Not changed | The whole deck being `air` (the review's inferred complaint) gives no concrete fix, and I left tuning alone. Saloon and pilot house stay flat: the review lists no item for them. |

## What must be rerun in a browser

- `painter-playthrough` (auto-player now handles hold), `painter-places`, `painter-coins`
- `clockmaker-playthrough` (rewritten, never run), `clockmaker-shaft` (new, never run), `clockmaker-door` (live set changed), `clockmaker-perf`, `clockmaker-coins` (38 placed, budget 30 to 40), `clockmaker-talk-on-e`, `clockmaker-seam-dip`
- `gambler-clean-office` (new, never run), `gambler-office`, `gambler-deck`, `gambler-cards`, `gambler-tilt`, the gambler playthrough
- `transitions` scenarios (clockmaker flags changed), the scale scenario (`nell`), `feedback3` restart scenarios, `round2` clockmaker-yard

## What is unverified

- **All art:** Bruno, porters, barman, townsfolk, great bell, weight, tower foot, the child's window alignment on the house, the book stand, pendulum draw order against planks and ladders, Lou's tremble at game scale.
- **The shots:** whether a 0.9 zoom really holds the gate and Jo in frame in the yard; the pan's clamp at the seam.
- **Feel:** pendulum timing on the chain, hold and double windows, the yard's 308 ms strike window, the third pipe's gaps with Jo's real body. All are numbers read from code.
- **Sound:** all of it (dev is silent). Tilt throb level and the saloon's warm gain are unmeasured against the mix.
- **Coin spawned by the whistle** on a resumed run, and the rival-grab theft in live play (`loseLapis` is unit-tested; the edge on `thrownOut` is only read).

The review-loop advisers were not run: this brief was a single builder on low resources.

# Round 2

Spec: `docs/redesign/advice/painter_clock_casino_review_r1.md`. Each item was checked against the code first; all were real. Still nothing played or seen.

Results after merging `redesign`: vitest 494 passed; lint:content, lint:rooms, lint:scale and `vite build` clean. Six tests are new this round.

| Item | What I did |
|---|---|
| MUST, lapis pick-up fires twice | Confirmed. The two `speziale.js` entities are now exclusive: `unless: 'lapis_stolen'` and `when: 'lapis_stolen', unless: 'lapis'`. This differs from the review's single entity because it keeps the pedestal standing after the first pick-up. A unit test walks the flags through two thefts. |
| SHOULD, third gear assist | `escapement` takes `assist`; the third gear uses 0.25. **Differs from the review:** it counts misses, not slips, up to three. A miss at zero seated slips nothing, and that is exactly the player who needs help. The yard strike has no assist. |
| SHOULD, Pell and comps | `pell_clean` needs `clean_book`. A comped player without a marker gets a new `pell_comped`, because `pell_again` ("Another marker?") would have been wrong for them. |
| SHOULD, Pell's remark | A bark, "Nothing signed, Mr Jo. Remarkable.", once, when a clean Jo reaches column 14. It uses a flag rather than the review's `near` so it can't fire as he walks in the door. `pell_clean` now opens differently so the two don't repeat. |
| NICE, step `speed` | Assist now scales a step's own speed. Tested. |
| NICE, 5th mash press | The engine ignores presses for 250 ms after any step change. Tested. |
| NICE, `dori_done` | Cleared in `giornata.params`, so each attempt starts fresh. |
| NICE, `green_lit` | Set at the end of its beat. A session guard stops it replaying in the same run; a quit during the beat replays it on continue. |
| NICE, signpost | Says THE GREEN. The watch man moved to x42 so his head doesn't cover it. |
| NICE, whistle coin | Stays owed until taken (`child_coin_got`) and is put back in the street on continue. |
| NICE, `c_clean` reach | **Row 6 did not work by the numbers.** Under the row 5 ceiling Jo's y stops at 242 (room px). Row 6 coins sit at 208, which is exactly 34 px away, and the magnet needs less than 34. Moved to row 7 (y 240), reachable with 88 px of rise of the 150 available. `boat.js` still removes them with the first plank. Numbers rechecked after the merge: `JUMP`, `GRAVITY` and the dream body are unchanged. |
| Scenario | `painter-lapis-theft`: steals in the street, re-enters, checks one on the shelf and one pick-up; steals again in the shop and checks the same. |

**Not taken:** the casekeeper joke's reach hint and a later mention of azurite. Both are optional in the review and not in this round's list.

**Merge:** conflicts in `scripts/lib/cast-bake.js` and `src/data/scale.js` kept both sides. `sheets/cast-lineup.png` took redesign's copy, since it is generated. I did not move the test piece to the new `onFlags` hook: `onRender` already works and nothing needs the change.

**Add to the browser rerun list:** `painter-lapis-theft` (new, never run), `gambler-clean-office` (its coin check changed), and everything listed in the first round, now on the merged code. The scenario list from `redesign` should be rerun too, because merged code has only been through unit tests and lints here.

# Browser check

First browser run, port 5181, silent. Scenarios were rerun together on a clean page after the last fix. Screenshots are `pcc_*.jpg` in the session scratchpad. vitest 495 passed; lint:content, lint:rooms, lint:scale and `vite build` are clean.

| Scenario | Result |
|---|---|
| `painter-board`, `clockmaker-board`, `gambler-board` (boarded from the hub) | pass |
| `painter-lapis-theft` | pass (failed first: bug 1) |
| `painter-playthrough` (2.4 min scripted), `painter-places`, `painter-coins`, `painter-ladder` | pass (playthrough failed first: scenario's hold driver) |
| `clockmaker-playthrough`, `clockmaker-shaft`, `clockmaker-door`, `clockmaker-perf`, `clockmaker-coins`, `clockmaker-talk-on-e`, `clockmaker-seam-dip` | pass |
| `slope-clockmaker-yard` (the `clockmaker-yard` site) | pass |
| `gambler-clean-office` | pass (failed first: bug 2) |
| `gambler-office`, `gambler-deck`, `gambler-cards`, `gambler-tilt`, `gambler-playthrough`, `gambler-places`, `gambler-coins`, `gambler-quay`, `gambler-saloon` | pass |
| `dream-seams-dip` | pass (failed first: the scenario's flags now fire the stage beats, which lock Jo on purpose) |
| `hub-thresholds-dip`, `hub-threshold-no-flicker` | pass |
| `restart-checkpoint-chef/-clockmaker`, `restart-dream-chef/-writer/-clockmaker/-painter`, `restart-death-card`, `restart-evening` | pass |
| `scale-*` (hub, chef, musician, astronaut, writer, painter, gambler, evening, clockmaker) | pass (`scale-gambler` failed first: bug 3) |
| `readability-painter`, `readability-clockmaker`, `readability-gambler` | pass |

## Bugs found and fixed

1. **A stolen lapis jumped back into Jo's hand.** Grabbed on the top shelf, the stone reappeared on its stand beside him during the throw-out and he took it again, firing the beat a second time. Key items now wait while `thrownOut`.
2. **Pell never introduced himself to a clean player.** `pell_clean` came before `pell_first`, so "The book hardly knows you" was his first line, the marker was never explained and `met_pell` never set. Reordered.
3. **Bald and bare-headed people lost their heads for 2 frames in 8.** At a scaled body, `hx * k` is fractional and the head and hat fall off the grid: barman, casekeeper, clarinet, lady, and the banjo's hat. `scalePose` rounds it. Unit test added. It is shared art code, so every scaled body is rebaked.
4. **A rival could never grab a Jo who stood still.** He winds up at 70 px, stops and reaches 42, so he looped forever at 67 px. Rivals now step in on the grab (`lunge` in `kinds.js`). Only rivals: see below.
5. **The shaft was too tight for the gentlest dream.** The chain ladder was clear about 12% of the time, the foot of it was inside the swing, and the second bob met Jo stepping off the ladder. Now: the second pivot moved to x12, the third is shorter (2.6) so the foot is safe to wait on, and periods are 3800, 3600, 3400. Measured from the chain's foot before the last slow-down: clear 25% of the time; the slower period should beat that, not rerun. The bob has a dark outline (brown on a brown wall).
6. **Job instructions were cut off.** "Hold [E], let go on the g…" and the third gear's hint overflowed the context slot. Shortened; two grind labels are shorter. All measured lines fit.
7. **The old book's stand and the third pipe could be missing or stay.** Their props were not `live`. Now they follow the flag.
8. **Three plates on top of each other** where a flag is just inside a door (room card, flag banner, "saved"). The flag banner now replaces the card in framework dreams.
9. **The seventh strike's shot put Jo half out of frame, and the strike shot clipped the gate.** Anchor moved; `seven_struck` now frames a point between gate and rope (world px in `beats.js`).

The playthrough scenario also reports its run length now, and `playCraft` handles a press lost in the rest after a step.

## Seen by hand

| Check | Result |
|---|---|
| Mash and hold, including a miss, letting go early and running off the end | pass; costs show in Gualtiero's lines |
| Two marks, including a slack fold | pass; the altarpiece builds up |
| Pick 2 of 3, with a wasted material | pass; HUD, repaint and verdict all follow |
| Rival takes the lapis in the street, then the way home | pass after bug 4; Orazio's line plays |
| Gualtiero at the trial, scaffold and bell | pass |
| Pendulum draw order | pass: rods and bobs behind planks, ladders and Jo |
| Bell chamber | pass; the bell reads well |
| Seven strikes, with presses (7 s) and with none (25 s) | pass after bug 9; gate, lamps and Jo hold in frame; lamps light gate end first |
| Nell's last lamp | works, with a gap below |
| Townsfolk before and after | pass |
| Child's window | aligned on the house |
| Whistle | pass; the coin lands at Jo's feet and is taken at once |
| Third gear with misses | pass; slips, window widens 0.16 to 0.28 |
| Third pipe | pass; a blind run is clean 2 tries in 10, by design |
| Clean office, brass, Pell, old book | pass; brass reachable (3 of 5 on one jump), the first plank removes it |
| Lou's hands | tremble is small but visible; still at the landing |

## Clockmaker length and gentleness

Scripted run with no reading time: **1.3 min of game time**, shaft skipped. A blind climb of the shaft takes about 10 s. Adding reading, watching the bobs and learning the jobs gives my estimate of **3 to 4 minutes** for a first run, against the 6 to 8 estimated above. That estimate is not a measurement of a person.

It is still gentle: nothing can fail, the first knock is free, none takes the last heart. A blind sprint up the shaft still takes 2 or 3 knocks and usually leaves 1 or 2 hearts.

## Not fixed: for the owner

- **Every other person foe has bug 4's dead zone.** Inspectors, the foreman, Crake and foes in other dreams cannot grab someone standing still. A `lunge` on each fixes it, but it changes balance in every dream, so I left it.
- **Captions cover the context line** at the bottom left, including job hints. Shared HUD layout.
- **The letterbox clips the objective plate** during conversations. Shared.
- **Nell "reaches up with the pole"** but has no pole and stands 3 tiles from the lamp, which simply lights. Needs a pose and a prop.
- **The child's caption portrait** does not match the child in the window (skin and clothes).
- **The test panel shrinks** from the job's 96 by 120 to the small easel prop when the job ends.
- **Sound** is still unheard: dev is silent.
