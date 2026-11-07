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
