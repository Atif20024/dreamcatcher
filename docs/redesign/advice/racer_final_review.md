# Racer, finished: designer and pro gamer review

Branch `redesign` at 07b03e5. Read only: no game code changed, no server, no browser.

**Ran.** `npx vitest run tests/race.test.js tests/rivals.test.js tests/script.test.js tests/racerSeason.test.js tests/raceResult.test.js`: 276 pass. Throwaway bots in `/private/tmp/claude-501/-Users-atifhsn-Documents-dreamcatcher/24eb88eb-4701-4564-ad2d-d34b369df333/scratchpad` (`f1.mjs` to `f6.mjs`, `path.mjs`, `words.mjs`) that drive the real `raceFor`, rivals and scripts with `tests/raceBots.js` (`tidy`, `best`, `gapBot`, `coppaBot`, `hands`, `newcomer`, `rusty`) and small variants. Every number marked "measured" is from those. All runs use seed 1, a tuned car, new tyres unless I say worn. Word counts of the forced conversations were taken by walking each node graph (first choice, the DialogueRunner's `if`/`else`/`next` rule).
**Only read.** Every line of `dialogue.js`, `beats.js`, `season.js`, the rooms, `places.js`, `garage.js`, `RaceScene.js`, `RaceHud.js`, `touchLayout.js`, `controls.js`; all 16 pictures in `docs/redesign/round2/racer_rebuild/`; the touch behaviour (no device, no thumb); sound; the RoadView drawing; frame cost; whether a real person reads 200 words a minute.

## The first review's MUSTs: are they fixed?

| First review | Now | Evidence (measured) |
|---|---|---|
| M1 steering is decoration | **Mostly fixed, one gap** | `curvePull` 1.4 (`race.js:44`). A bot that never steers (only round carts and cars) finishes Pinewood in 32.5 s against 31.9 s steered, touching the verge (max abs x 1.17), never the straw. The wheel is worth about 0.6 s on Pinewood and nothing on Salt or the Coppa (see S1). |
| M2 last bend is a free skip | **Fixed** | Flat out through Pinewood's blind right +1.7 s (33.6 against 31.9); Salt's drop +1.8 s (54.9 against 53.1); first sweeper +4.6 s. `strawCrash` 0.4 (`race.js:94`) makes the straw a crash speed, not a share. |
| M3 brake cliff, early is free | **Fixed** | Margin 0 / 15 / 40 m early: 31.4 / 32.1 / 33.3 s. Early costs about 0.05 s a metre, ploughing in costs +1.7 s. No cliff and no free early braking. |
| M4 the outside is the fast line | **Fixed** | Pinewood all-outside 31.6 s, all-inside 32.4 s, the right line per bend 30.8 s (`lineLen` 0.22 and 0.30). Per-bend line is a real 0.8 s question. |
| M5 finale branches unequal | **Fixed** | Coppa, tidy bot: pass 85.3 s, 7.1 s clear; stop 90.3 s, 6.1 s clear. Cautious bot (m 15, k 0.95): pass 3.0 s clear, stop 2.1 s clear. Both win. |
| S1 pit box a wash | **Fixed** | Stop on the paint 85.3 s, drive through 86.9 s, stop 8 m short 87.6 s. |
| S3 dead stretches | **Fixed** | Longest quiet stretch (gas, no bend within 110 m, nothing within 45 to 70 m): Pinewood 708 to 797 m, 2.7 s; Coppa last straight 3.7 s; Harbour and Salt none. |
| S4 Salt top 3 is beat-Teo-by-0.7 s | **Better** | Tidy worn tyres P3 55.5 s (Teo within 0.05 s); cautious worn P3, 0.4 s clear. Still thin (see S5 below). |
| S5 a spin is nearly free | Not re-measured | My wall-crash bot never crashed; `spinKeep` 0.7 is in (`race.js:102`). Read only. |

## What is good

- **The journey reads.** Stranger with good hands and a borrowed car, the seat, the new tyres you may give away, the Cup where the mentor goes wide and the lights go out, the loss, the tin, the paper, the sheet, the letter, whose car, the chalk, the wall, the win. Each race asks something different (earn a time; follow; take a place on the sheet with a rival who shuts the door; win with a choice at the wheel) and each is reached by something that happened in the walking. This is exactly the owner's "journey, not a menu".
- **Choices come back.** Tyres kept or given are told in the corridor, Tullio, Nino, the rack and the ending. Medicine paid is a chemist prompt at the table, Agnese's "twelve", the Signora sitting or standing, her at the pit wall or at the window, one line in the ledger. Orders broken answer in Ottavia, Dante, Sable, Tullio and the prize cut. The Roche letter (kept, burnt) changes Cassian's talk, the tyres, the ending. Sable's lien answers in Tullio, Ottavia and the purse. Nobody who is named is only a name: Beppe (Aldo "had it from Beppe") is paid, Pia and Gino's button is paid, Nino pays the rent, the gloves go on the chair and are on the chair at the Salt and Coppa pit walls.
- **The bookends.** "What is the tide doing?" (Aldo, Beppe, Nino, the Coppa radio, the last line "Look first") and "she is a hair flat" (night before the Cup, "I said so, out loud, to you", the Coppa). Cassian's "if something goes, I will not hear it coming" is a real foreshadow of the wheel. Nobody is a villain, and the Cup is told by people who each think it was someone else's fault.
- **The drive.** The call plate and the speedo notch move with the line you are on, so the HUD is honest. The boards are real braking points. The first lap of the Coppa gives free tyres and the second makes you pay. The wheel choice is told on the HUD ("ROCHE IS OUT: BRAKE TO STOP, OR DRIVE ON") and the stop does not cost the win. Rivals are readable: Cassian's tell, Teo's weave and sump, Dante's line.
- **Race 2 cannot be failed, on purpose.** It is the best pacing beat in the season: a quiet race that ends in the dark.
- **The pictures.** Every plate is above the horizon, kerbs on bends and edge lines on straights read, the crest hides the road, the Coppa pit board and "STOP ON THE PAINT" are clear, Salt at noon and the Harbour at dusk are different places.

## MUST

### M1. Two numbers on the road contradict what the player is told, on screen, within the same race
**1a. Aldo's time.** `dialogue.js:54` Aldo says "I did Pinewood in thirty-four"; the gate is 37.5 (`tracks.js` pinewood `gate: { time: 37.5 }`), and the radio on the grid says "Thirty-seven five, I did it in. In that car." (`RaceScene.js:189`, in `pinewood_bend.png`), the plate says "UNDER ALDO'S TIME: 0:37.5", the card says "Aldo's time: 0:37.5". The player hears both within two minutes. Worse, `RaceScene.js:189` and `RaceHud.js` read `track.gate.time` from the eased copy (`script.js:257`), so after three failed tries Aldo "did it in" forty-two and three tenths, and the Aldo dot on the strip changes. A hidden help that rewrites the mentor's record is a lie in his mouth.
Fix: say "thirty-seven and a half" in `dialogue.js:54` (or set the gate to 34, but the bots need the slack: timid 25 percent under takes 38.9 s), and read Aldo's number from the track's own `gate.time` before the ease (`TRACKS.pinewood.gate.time`), in the radio, the plate, the card and `pace.js`. The ease then moves only the bar Jo is judged against, and the card says "the seat is yours" either way.
**1b. The crossing's length of wait.** `RaceScene.js:62` Ottavia says "Four seconds. Sit. It will open." The gate is down `crossingShut` 2 s (`race.js:129`). **1c. The stop for Roche.** `RaceScene.js:427` "Six seconds. You still have it. Drive." and `season.js:81` "He stopped for Roche, six seconds": the car stands `stopHelp` 2.4 s (`race.js:151`) and the whole choice costs 5.0 s on the clock (measured: stop 90.3 s, pass 85.3 s). Fix: "Two seconds. Sit." and "Five seconds" in both places.

### M2. The Salt crossing's second option is a trap: the radio sells it, the gate punishes it
`RaceScene.js:61` "The bell. Make it, or brake and wait." `race.js:128` `crossingBell` 5.7 s, ring at 180 m (`tracks.js` salt crossing `bell: 180`).
Evidence (measured, Salt, tidy driver, new tyres): flat out 53.1 s P2 with no bump; lift for one second at the bell 59.0 s (+5.9 s, one gate bump, still P2); tap the brake 0.8 s the same; brake to 26 m/s 56.8 s; brake to a stop at the gate 62.4 s, **P4, the gate failed**. On worn tyres (the kept-short jar branch) lifting for one second is **P4, 3.6 s behind, the gate failed**. So: every honest reaction to red lamps that is not "stay flat" fails the race or costs 4 to 6 s; "brake and wait" is never a choice. A first player who does what the lamps tell him fails the Salt on the second branch, and the line he was told says it is fine. The crossing is a reflex test dressed up as a decision, which is the very thing the first review's S1 asked to avoid, and it has been moved from "ignoring it is free" to "obeying it is fatal".
Fix (one of two): (a) honest line, `crossing_bell: 'The bell. Gas and you make it. Lift and you wait.'`; or (b) make waiting a real option: `crossingBell` 5.7 to 6.4 s and `crossingShut` 2 to 1.5 s, so a car that brakes to 26 m/s still gets through and the full stop costs about 5 s, not 9 s. I would do (a) now and measure (b) after; only (b) makes the gate a decision.

## SHOULD

### S1. Steering is still not a decision on Salt and the Coppa
`race.js:44` `curvePull`; `tracks.js` salt and coppa bends. Measured: Salt with every bend outside 53.6 s, every bend inside 53.5 s, a chosen line 53.5 s: **the line is worth under 0.1 s**. A bot that never steers (round things only) is P2 53.5 s on Salt and 1st by 7.1 s in the Coppa. On the Coppa, all-inside 84.1 s beats all-outside 85.6 s, and the right line per bend gets 83.0 s: a dominant inside line with a 1.1 s edge. Pinewood is the one track where lines are a real question (30.8 / 31.6 / 32.4 s).
Fix: on Salt give the chicane and "chicane out" an outside payoff (`lineSpeed` 1.5 to 3 on the second and `lineLen` 0.30 stays), and on the Coppa's `Gull Bend` (130 m, `lineLen` 0.05) set `lineLen` 0.12 and on the terraces pair give `lineSpeed` 2.5 so the inside is not the whole answer. Check with `best` and `tidy({line})` that the three single lines are not within 0.3 s of each other on every track.

### S2. The retry help makes the rivals visibly crawl, and it can be farmed
`script.js:256-259`; `race.js:169-172` `easePace` 0.06, `easeMax` 6, `easeFloor` 0.5; `tracks.js` salt `ease: 0.13`, coppa `ease: 0.12`.
Measured finishing times, tidy bot Jo, rivals' times by failed tries: Salt, Cassian 53.1 / 60.7 / 67.0 / 78.9 / 93.9 s for 0 to 4 tries, Dante 59.9 / 62.1 / 70.1 / 82.7 / 98.6 s; Coppa, Dante 90.9 / 99.5 / 111.2 / 126.3 / 147.0 s, Teo 96.8 / 105.1 / 115.9 / 129.1 / 145.5 s. After two tries a rival runs at about 75 percent of his speed in the bends and on the straights; after four, at 50 percent: a 130 km/h car doing 65 on the long straight. A bot that brakes at 75 percent of the limit and runs into the straw once (`newcomer`) **wins Salt after two tries (P1, 64.1 s) and the Coppa after two (P1, 102.7 s, 17 s slower than the tidy lap)**. "The help is never announced" is not true when the pack is parked on the straight. Gaming: `triedIt` counts a run given up past half the road (`script.js:250`), so a player can leave Salt at 55 percent twice (about 60 seconds) and take P1 (18 nuts) instead of P3 (8). It is a small payoff, but it is there and the pro will find it.
Fix: per-try step 0.06 on all place races (delete `ease: 0.13` and `ease: 0.12`), `easeFloor` 0.75 (never more than a quarter off), `easeMax` 4. Re-run the `newcomer` bot at tries 0 to 4 and keep the result at "fails twice, passes by the third". The time gate (+1.6 s a try) is fine and invisible.

### S3. The Salt cart's radio line is cut off after 1.3 seconds
`tracks.js` salt cue `the_cart` at 500 m, bell at d 540 (180 m before the gate at 720), cart at 640; `RaceScene.js:50` and `:62`. `crossing_bell` is in `NOW` (`RaceScene.js`) and `say` sends it as a story line that bypasses the "line still being read" guard, so "A cart, past the second straight, left of the crown. Go right." is replaced about 1.3 s after it appears by the bell line. The cart is 100 m before the gate: the busiest hundred metres of the season, and the sentence that helps is the one that vanishes. The words are also wrong ("past the second straight": it is on it).
Fix: move the cue to `d: 430` (out of the chicane, clear of the bell) and say "A cart, on the left. Go right."

### S4. The Sable papers pay now and cost almost nothing on the road
`season.js:121-141`, `verbs/garage.js:97`. Signing everything pays up to 36 nuts. The costs: the fifth of prizes (`sable_cut`; breaking the orders costs the same fifth, so with `sable_cut` standing the order can be broken free), HOLD behind Dante (P3, 8 nuts against P2, 9 nuts after the fifth: breaking is **one nut better**), the thin oil (`car.js` `hotTop` 0.98 after 85 percent: about 0.1 s) and the lien (story only). `sable_dinners` pays 2 and then is never heard of again (`grep sable_dinners` hits only `season.js`): a clause raised, never paid off. A pro signs every clause, takes the 36, and breaks HOLD for a P2 card.
Fix: pay the dinners in one line (`tullio_pit`, `dialogue.js:118`: "Mir says you sat next to the mayor's wife on Thursday. I did not ask what you said."), and make breaking HOLD cost more than one nut: a fifth of the whole Salt prize is only 3, so also take the HOLD clause's 10 nuts back (or 5) on `orders_broken` in `payFor`, as the paper's own penalty.

### S5. Salt's gate is still thin for a human on worn tyres
Measured: tidy worn tyres P3 with Teo 0.05 s behind; cautious worn P3 by 0.4 s; hands bot with one lift at the crossing P4 (M2). A human on the worn branch passes the Salt by a coin toss. The first review's target was 2 s of slack for the worn-tyre tidy bot.
Fix: `wornStart` 0.7 to 0.75 (`race.js:165`) or Teo `wear` 4 to 5 (`tracks.js` salt). Measure with `tidy` worn: aim at Teo 1.5 s behind.

### S6. The wrong word in four places the player will notice
- `beats.js:41-42` Tullio: "Two seconds ... Three seconds on the night, not two." The engine's stops are 1.5 s clean and 2.5 s late (`race.js:146-147` `pitClean`, `pitBox`). Make the beats say "A second and a half" and "Two and a half", or set the TUNE to 2 and 3 and re-run the Coppa bots (the Coppa tidy lead is 7.1 s, so there is room).
- `dialogue.js:343` coppa_home, `gave`: "bought your own later, and said nothing." Only true if the player bought a set. Fix: `gave` for `tyre_soft`, a second node "...and went on with what was on her." for the rest.
- `dialogue.js:230` Dante: "If you come by, come on the left." Dante sits at x -0.45 (left of centre), and nothing in the engine or script checks the side, and `dante_idle` (`dialogue.js:234`) then says "You came by. On the left." even if Jo went right. Fix: cut "on the left" from both lines.
- `beats.js:66` "I was a long way back." A keyboard player who followed Aldo at two lengths with lagged keys (measured: `hands` bot, 4 slings, `held_aldo` false) was not a long way back. Fix: "I was not close enough."

### S7. Forced reading is about 1,500 to 1,700 words, a third of a ten-minute first play
Walked path: A (kept tyres, short jars, signed everything, kept the letter) 1,673 words in 100 lines; B (gave, clean, burnt the letter) 1,491 words in 89 lines. Racing is about 3.5 minutes. Longest forced scenes: `coppa_home` 198 words, `ottavia_again` 143, `corridor` 148, `cassian_gull` 114, `aldo_tyres` 113.
The tyres story is told seven times (`aldo_tyres`, `harbour_eve`, `nino_after`, `tullio_after`, `corridor`, `coppa_home`, the rack). The HOLD paper is commented on five times (the Salt card suffix `RaceScene.js:110`, `ottavia_again` `held`, `dante_idle`, `ending` `paper`, `tullio_pit` `broke`). Cut, in order of cost to the story (about 190 words, one minute):
1. `coppa_home` nodes `tyres` and `gave` (`dialogue.js:342-343`, 50 words): `tullio_after` already says it.
2. `corridor` node `kept` (`dialogue.js:144`, 24 words) and `gave` (145): the same.
3. `ottavia_again` node `held` (`dialogue.js:304`, 27 words) and the Salt card's " You held. He will put that in the paper too." (`RaceScene.js:110`).
4. `coppa_home` nodes `letter` and `lett2` (`dialogue.js:349-350`, 28 words): the ending already says "The Roche letter stayed in his pocket".
5. `jars_said` `start` (`dialogue.js:178`, 33 words): it repeats the bark `q_cup` (`dialogue.js:361`) almost word for word ("At the cafe they say it was the money. At the harbour, the boy in the black car") and "She says nothing. She washes her hands, and the black stays" has no clear "she". Cut one of the two and name Ottavia.

## NIT

- `RaceHud.js` the call rounds the distance to the board's step with `Math.round` now. Good. The first race still says "BRAKE NOW" only on bend 1 (`RaceHud.js` `whisper`): fine, it is a first race.
- `quay.js:78` `gino2` uses the cast of Pia (`npc-pv-pia`) and says Gino's line: the second child is Pia twice. Give her her own cast or drop her.
- Aldo, the mentor, never speaks again after the Cup. The gloves on the pit chair and Ottavia's "he asked what the tide was doing" carry it well, and I would leave it, but if the owner wants one more beat it is the cheapest: on the Coppa lap-2 cue (`second_lap`), have the PA say Aldo's name.
- The tide line "A length sooner" (`RaceScene.js:48`) changes nothing on the road (no salt, no grip change). The drive does not contradict it, but it promises a rule nobody can see. Either drop "A length sooner" or give the quay 20 percent less brake grip in race 2 (cannot fail a race, so free).
- `Dante` is an on-screen character in only two short scenes; Gino has a single line: fine, they are people, not names.
- `signora_pit` appears only when the chest is seen to (`pitlane.js` `when: 'med_ok'`) and `coppa_home` `window` covers the other branch: this is a good, checked branch. Leave it.
- `coppa_home` `window`: "She says you lifted at the hairpin." is unconditional. The card of a clean run says "you never lifted". The Signora "has never heard an engine in her life", so I read it as a joke; keep it.

## Drive pass: answers

**Is there a real decision every few seconds on each track?** Pinewood: yes (a bend or an obstacle every 4 s, the quiet stretch is 2.7 s). Harbour: it is one decision, "stay in the air", for a race that cannot be failed, 41 s with bends: acceptable as teaching. Salt: yes. Coppa: yes, the quiet stretch is 3.7 s. The decisions are mostly *when to brake*, with the HUD saying the speed to take (the call plate and notch name "RIGHT 50 M: 90 KM/H"): that is generous, and I would keep it for a game that wants a win at the end.
**Dominant strategy?** "Brake on the HUD number with 5 to 10 m spare, take the inside in the Coppa and the outside on Pinewood, never lift at the bell, drive through Cassian's gap." It is a good strategy, not a degenerate one. Early braking costs 0.05 s a metre (M3 fixed), the wheel is worth about 0.6 s on Pinewood (see table) and nothing on Salt (S1).
**Retry help gamed?** Yes, mildly (S2). The tries counter is a real attempt (past half the road), which is right. The help is too strong.
**Unfair or hidden?** The crossing (M2: the one hidden rule that fails the race); oil, the block and the time gate are visible (known: oil small at 100 m, Cassian's tell only up close). The time gate's number moves with the tries and contradicts Aldo (M1a).
**First race's teaching, for someone new to driving games.** Enough for the brake (call, notch, BRAKE NOW once, board at 150/100/50), the start (lights, "Green, then gas"), the lamp (one line, held until the road is quiet). A timid first driver passes Pinewood at about 85 percent of the bend limit (36.5 s; at 75 percent 38.9 s fails by 1.4 s and gets 1.6 s of gate back per try). It does not teach the wheel (never steering costs 0.6 s) or the line (nothing says "the outside is faster"). Add one radio line on bend 2: "The outside holds more speed. See the notch move."
**Touch.** `layoutRace` (`touchLayout.js:110-135`): GAS at the right edge, BRAKE beside it so the thumb rolls, a two-half steering slab with a 12 px dead strip, the pause button top-left clear of the HUD plates: the layout is sound and it matches `pinewood_hud_touch.png`. Two real weaknesses, read only. (1) **The steering is digital**: `slabAt` (`touchLayout.js:141-147`) returns only `left` or `right`; `driveInput` (`controls.js:26-30`) gives full lock ramped in 90 ms and out in 60 ms. Against a bend's push of about 0.35 widths a second the player must pulse a steer key at roughly a quarter duty cycle; on a thumb that is tap-tap-tap on a plate. Fix: read the thumb's distance from `S.mid` as an analog -1..1 (`steer = clamp((x - S.mid) / (S.sw * 0.8))`), pass it through `touchState` and let `driveInput` take it as it takes `pad.axes[0]`. (2) The gas is a held thumb for the whole race (Coppa about 90 s): consider a latched gas that a brake press or a lift of a second finger releases, behind an accessibility option. I could not check either on a phone.

## What I would do first

1. M1 (three one-line text fixes, five minutes) and M2 (the crossing line; measure the numbers in (b)).
2. S2 (rivals stop crawling) and S6 (four wrong words), each a few lines.
3. S7 cuts 1 to 3 and 5 (about 140 words, about 45 seconds) before the owner plays by hand; it makes the first play land near 9 minutes instead of over 10.
4. S1 (give Salt and the Coppa lines a question), S3, S4, S5 together in one tuning pass with the bots, so the numbers do not chase each other.

## Convergence check

Branch `redesign` at 158780d. Read only, no game code changed. `npx vitest run` on race, rivals, script, racerSeason, raceResult, racerFinal, racerWords: 299 pass. Bots in the scratchpad (`g1.mjs` to `g6.mjs`) drive the real `raceFor`; seed 1, tuned car, new tyres unless said. Every number below is measured.

### Verdict: nearly converged. Two small SHOULDs (a wrong spoken number, a wrong stated number), both one-line fixes. No MUST.

### Last review's findings

| Finding | Status | Evidence |
|---|---|---|
| M1a Aldo's time | **Fixed** | `dialogue.js:15` reads `TRACKS.pinewood.gate.time`; `gate.was` keeps his own time (`script.js` raceFor), `aldoGrid` says "thirty-seven five, I did it in. For you, thirty-nine one" after a miss; card "Aldo's time: 0:37.5. He will take 0:39.1." One false word remains: see N1. |
| M1b/c crossing wait, Roche stop | **Fixed** | `gate`: "Sit. It will open."; `stop_go` and the ledger carry no number. |
| M2 crossing a trap | **Fixed** | `crossingBell` 6.4, `crossingShut` 1.5. Tidy 53.4 P2; lift 1 s 54.0 P2; brake to a halt 59.2 P2 (all pass, also on worn tyres: lift 1 s 55.8 P2). Waiting costs 5.8 s and keeps the place. The line "Make it, or brake and wait" is now true. |
| S1 lines are no question on Salt/Coppa | **Partly** | Pinewood spread 31.2 / 31.6 / 32.4 (best / all-out / all-in). Salt 53.2 / 53.7 / 53.6, Coppa 84.3 / 85.6 / 84.1 (all-in beats the "best" line). Never steering: Salt 53.4, Coppa 85.1 (loses 0.2 to 1 s). Chicane-out `lineSpeed` 3 moved Salt by under 0.5 s. See N5. |
| S2 retry help crawls, farmable | **Partly** | Floor 0.75, max 4 tries. Prize capped at the gate's place (`result.js` `paysFor`): farming Salt at P1 pays 8, same as P3. Rivals still run at 0.88, 0.83, 0.78, 0.75 of themselves on tries 1 to 4: tidy Coppa lead 7.1 / 10.3 / 21.7 / 27.9 / 33.5 s. `newcomer` Coppa: P3, P2 (0.5 s), P2 (0.7 s), then wins on the fourth start (try 3, 103 s, 8.5 s clear). Salt: fails, passes P3 on try 1. Jo's own times are flat across tries (Salt tidy 53.4 / 53.5 / 53.6 / 53.6 / 53.6; brake bot 59.2 / 60.3 / 59.5): the help never slows a bot. |
| S3 cart line cut | **Fixed** | Salt cue 475 m, bell 540 m: cart at 18.3 s, bell 20.7 s (newcomer 21.0 / 24.0), read time 1.5 s. "On the left. Go right." matches the cart at x -0.35. |
| S4 Sable papers | **Fixed** | `settlePrize`: dinners pay back 2 once at the Salt (`tullio_pit` line is the setup/payoff pair with `sable_done`); breaking HOLD at P2 (12) takes 3 + 9 and pays 0, against 8 held. Break is now clearly worse. |
| S5 Salt thin on worn tyres | **Fixed** | Teo `wear` 5 and the crossing queue: tidy worn P2 55.5, cautious worn P3 57.4 behind Dante 55.3, newcomer worn fails (P4 65.1) on try 0, passes P2 on try 2. |
| S6 four wrong words | **Fixed** | `DRILL` reads TUNE ("a second and a half" / "two and a half seconds"); `gave` branch cut; "on the left" gone; "I was not close enough". |
| S7 reading | **Fixed** | Cuts 1 to 5 done (`coppa_home` now 9 nodes). Nothing cut was a setup for a payoff: tyre story still has `aldo_tyres`, `harbour_eve`, `nino_after`, `tullio_after`, the rack; the tide ("Look first") has `corridor.tide` and `coppa_home.stand`; the letter has `cassian_gull`, `ottavia_again`, the ledger; the HOLD paper has `sable_done`, the card, `sable_after`, `dante_idle`, `tullio_pit`, the ledger. |
| NITs | `gino2` Fixed; Aldo's "length sooner" Fixed; the 3.7 s quiet stretch not re-measured. |

### The hunts

- **Crossing decides the Salt on its own?** No. Going through puts Dante and Teo at the gate 3.9 s after Jo (26.0 s against 29.9 s), but they already finished about 6 s behind before the fix. A full stop keeps P2. The bell now costs time, not the gate; the Salt's pass is decided by braking and the tyres. NIT N4 is the other side of this: the choice is now soft.
- **Never-steer bot on Pinewood, run 1:** 32.5 s against 37.5 (5.0 s of slack; the 32.9 figure was a slightly different bot). Steering is optional by 0.6 s. Acceptable for race 1: the `line` cue (`tracks.js` pinewood, d 200) and the notch teach it, and the first race has to be passable. It is a teaching race that does not require the wheel; I would leave it.
- **Flat-out bot on Pinewood:** 39.0 s on run 1 (misses the 37.5 gate by 1.5), passes on run 2 (gate 39.1) by 0.1 s. The brake is therefore optional by run 2 on race 1. It is a knife-edge, not an exploit: the card names "the straw cost you the most" first. N3.
- **Retry help making a bot slower:** no (see S2 row).
- **Radio timing:** the new read-hold (1.5 s, 45 ms a character) never swallowed the bell (2.4 s after the cart) or the Pinewood `crest` (the `line` cue is at 9.3 s, `crest` at 18.0 s). The deferred slot holds one line; no loss seen.
- **Numbers still false:** N1 and N2 below. Everything else I grepped (twelve, eight, thirty days, nine, Mir, fifth) matches the code.
- **Payoffs:** all have their setup (see S7 row). `tullio_pit` `start` has `else: 'dine'` and `dine` has `next: 'box'`, so the chain reads when a flag is off.

### New or remaining issues

**SHOULD**

**N1. `spoken()` reads 40.7 as "forty seven" and 60.2 as "60 two".** `src/dreams/racer/race/result.js:62-67`. With a units digit of 0 the hyphen is lost: Aldo says "For you, forty seven" on the grid after two missed tries (gate 40.7), the card reads "Aldo reads the watch: forty three" for 40.3, "Fifty three" for 50.3, and 60+ falls back to figures. A pupil hears 47 s for 40.7 s, in the lesson race. Measured: `spoken(40.7)` = "Forty seven", `spoken(60.2)` = "60 two". Fix: `return \`${tens ? tens + UNITS[s % 10] + (s % 10 ? '' : ',') : s} ${WORDS[tenths % 10]}\`` (so "forty, seven"), and add 60+ words to `TENS` or cap at 59.

**N2. Sable's line names a number the payout does not take.** `src/dreams/racer/dialogue.js:208` says "the ten we paid you to hold" (`HOLD_PAY`), but `settlePrize` caps `back` at the prize left after the fifth: 9 at P2 (12), 6 at an eased P3 (8); the caption in `garage.js:~129` then says "Sable took 9 back". Two lines in the same minute disagree. Fix: in `dialogue.js:208` drop the number ("what we paid you to hold, and a fifth of what you won"), and remove `HOLD_PAY`.

**NIT**

**N3. Pinewood passes without the brake by run 2.** `tracks.js` pinewood `gate: { time: 37.5 }`, `race.js` `easeTime` 1.6. Flat out 39.0 s against 39.1. If the owner wants the brake to be required by run 2: `time: 36.5` (tidy 31.9 and the 85 percent timid 36.5 would sit at the line, so check `tests/raceBots.js` timid first) or `easeTime` 1.0. I would leave it: run 2 is a lesson already, and the card names the straw.

**N4. After a miss on the Salt the duel disappears.** `rivals.js` `gateAhead`, `race.js` `easeFirst` 0.12: at tries 0 tidy is P2, 0.4 s behind Cassian; at try 1 Cassian's slowed car fails the bell with his spare and waits (gate at 29.5 s against 25.7 s), and tidy wins by 11.8 s (try 2: 13.2). A good run that missed once gets a runaway. Fix: `crossingSpare` applies to `c.style === 'clean'` only when Jo is within 12 m of the gate (the queue case), or give Cassian `ease` 0 on `salt` so he alone keeps his pace.

**N5. Lines on Salt and Coppa are still a 0.5 to 1.5 s question; Coppa all-in beats the best line.** `tracks.js` coppa bends. Make `BEST_LINE.coppa` in `tests/raceBots.js` actually the best (it is 0.2 s worse than all-in) and give the outside one Coppa bend a real payoff (`lineSpeed` 3). Not a blocker: the finale's tension is the wheel and the stop, which are real.

### What I would do

Apply N1 and N2 (two lines, five minutes), then call it converged. N3 to N5 are tuning for the owner's hand play.
