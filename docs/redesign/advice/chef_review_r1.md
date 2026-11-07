# Chef (FIVE-STAR DREAM) review, round 1

Reviewers: a senior game designer and a pro gamer, in one read. Standard (the owner's): "so that its very engaging and interesting. nothing should feel like its not well thought out".

**I did not play.** Read: `docs/dream_chef.md`, `CHEF_REPORT.md`, the Chef part of `deep_review_chef_astronaut.md`, `src/dreams/chef/*` (dream, beats, dialogue, services, railHud, rooms, verbs/rail, verbs/kitchen), `src/engines/tickets.js`, `tests/tickets.test.js`, scenario names in `src/dev/scenarios/chef.js`, the ten `chef_*.jpg`, plus the shared code the dream leans on (`Foe.js`, `BaseLevel.js` hurt/throwOut/respawn, `DreamScene.js`, `Player.js`, `SaveStore.js`). Tags: **(code)** traced and sure; **(shot)** seen in a screenshot; **(inferred)** feel, length or fairness read from numbers; **verify** = I could not settle it without running it. Skills read: disciplines:level-design, disciplines:game-feel, game-balancing (the third one is a generic checklist; I used its sink/faucet and ramp questions on the stock and the rush).

Verdict in one line: **not converged.** Two MUSTs are in the climax (the plate vanishes at the handover, and "walk" is not enforced in the dining room). Everything before the pass is well built and fair.

---

## Minute by minute (inferred from code and data)

| When | What happens | Judgement |
|---|---|---|
| 0:00 yard | Rain caption at 0.5 s, 17 dark tiles to Marguerite, 5-node talk, door opens | Good economy. The dark walk is the weak part (S2). |
| 0:40 pit | Three tickets: plates (no clock), coppers (sink, scour, climb to the hooks), tureen (24 s soft clock). Wet floor, two steam vents, porter's trolley | Teaches quick / work / to, then a clock, in that order. Best-built room for teaching. Stations all sit outside hazard reach (steam x23/x36 vs scour 21, hatch 39: 2 to 3 tiles clear). About 60 to 90 s. |
| 2:00 cold | One ticket, no clock but COLD (52 s to empty, a warm pipe plus the cat halfway, one-line caption saying so), four beef rails that rattle 0.75 s first and only knock | Fair and a real change of verb (climb). The warm pipe is 3 tiles off the straight ladder line, so it is a choice, not a tax. |
| 3:30 prep | 3 mise tickets, 68 s DOORS meter, ovens (2 beats amber, 2 beats blast), Brann | The choice is real but mild (see "Choices"). Brann plus locked work is unfair (S3). |
| 5:30 line | 14 tickets, 3 sittings, one ticket every 3 to 12 s, rail capped at 3 on screen | The dream. Ramp is real: sitting 1 is slack (5 tickets in 38 s, dues 36 to 50 s, tasks 1 to 6 s), sitting 2 stacks grill tickets (t6 at 50 s and t7 at 53 s share two pans) and then t9's three stops and the t11 change of mind, sitting 3 adds overlap with 28 s dues. The cap of 3 is what stops a bad player drowning. |
| 9:00 pass | Plate, rim, "hold out the plate" (three presses) and the finish choice | Short, correct, tense by staging only. |
| 10:00 hands | Music drops, camera pushes, painted hands, line per mark, "Is it good?" | The strongest scene (shot): frame over the heads, Aurelio facing Jo, hands painted from the run. Gaps: M1, S10. |
| 11:00 dining | Door is the cut, silence, plates on the tables, lamps off behind, Table One, orb | The reveal is built right (first plate line fires at table 2, second at table 4). Undermined by M1 and M2. |

Length: the doc says 7 to 9 min, the report says 7 to 10. From the numbers, a first-timer is nearer **12 to 14 min**: the rush alone is 3:35 (ordinary bot) to 6:30 (slow bot), and the expert's floor is about 2:20 because arrivals are pinned to the 120 s schedule. The rest is about 1:30 yard, 1:30 pit, 1:30 cold, 1:50 prep, 1:30 pass and hands, 0:50 dining. Not too long if the rush holds. That is the open question, see "What I cannot judge from code".

## Is the rail one verb, and is it engaging?

- **One verb: yes.** Every room is "stand at a station, [E]"; five kinds (quick, work, fire, to, reserve) differ only in what the body does. No marker or zone anywhere. The prompt always says what [E] will do or why not (`rail.js:207-226`, `tickets.js:189-240`). Good.
- **Engaging: from the line on.** Pit, cold and prep are an errand list with hazards on the way; the verb has no decision in it until the grill (fire) appears in sitting 1 t3 and teaches itself ("On. Come back for it."). That ordering is right: fire is first met on a single-stop ticket (t3 SOLE), then t4 BASS adds a second stop.
- **The commute is the game, and it is long (inferred).** Hands hold one plate and the pass is at x54, the sauce at x20, the larder at x11. A sauce plate is about 34 tiles to the pass: 3.9 s there, about 2.3 s back, at 280 px/s. Over 13 plates that is about 90 s of running inside a 160 s expert rush, each time through the five-burner aisle for one [E] press. It is fair and learnable, but the per-press content is thin. This is the thing to watch in the first human playtest (see the end).
- **Choices change something real, but mostly in words and pictures.** Mise: demand is fish 8, sauce 8, larder 4 to 5 against stock 3/3/2 plus 4/3/2, so even a full mise needs a reserve trip and an empty mise needs about three (about 25 to 30 s of 160 s): real, readable on the HUD, modest. Tomé's "fish first" is the correct answer, so the choice is solved by reading. Finish choice (menu / onions / plain) changes Aurelio's line and the ending picture; onions only exist if you stopped for Tomé: a good reward for noticing. "Is it good?" changes one Marguerite line. Burns, frost, flour, bails change what Aurelio reads. Fine for a story dream.

## People: do they act and react?

| Who | Acts | Reacts to Jo |
|---|---|---|
| Marguerite | Smoking in the yard; at the pit with the apron; at the sauce (one line, one bark); calls sittings; takes a bailed ticket; walks him to the door | Reacts to "asked or not" and to bails (via Aurelio). Does not react to a burn, to the frost, or to the apron on him. |
| Aurelio | Tastes and spikes every plate with a floating "Next."; faces Jo at the pass | Reads the hands. Good. Never varies the word except "...Next." on non-clean plates; `CALLS.next` and `CALLS.clean` hold lines that are never used. |
| Tomé | Chops, cries, laughs; tells the room's order; offers the spoon; `tome_after` line | Yes, if Jo stops. |
| Bastien | Hose arc and bubbles; before and after the apron lines | Yes (apron). |
| Cat, prep cook | Static prop with a moment; Tomé is the prep cook | The cat opens an eye in the moment text only. |
| Brann, Luc, the porter | Call tickets, run the aisle, push the trolley | Hazards, not people: they bark and bump. |

The cast is present everywhere, which fixes the old review's top complaint. The remaining gap: nobody notices Jo getting burned or frozen, while the ending reads the burn and the frost as news. See N2.

---

## MUST

**M1. The dining-room walk is not enforced: Jo runs through the climax with a walking animation.** (code)
- `rail.js:184` sets `p.walkOnly = !!carryOut`, but `walkOnly` is read only by the animation (`AnimationController.js:42,57`). Speed is `this.walking ? min(speed, 80) : speed` (`Player.js:717`) and `walking` comes only from the Shift key and `walkByDefault` (`Player.js:539`). So Jo crosses the 54 tiles at 280 px/s (about 6 s), feet sliding, lamps popping in a burst; Marguerite's "Walk. You do not run in that room." and the objective "Walk." are unenforced. The Evening and the hub do it properly with `walkByDefault = true` (`EveningScene.js:202`). `chef-dining-cut` only asserts the flag (`scenarios/chef.js:390`).
- Fix: in `rail.js:184` also set `p.walkByDefault = !!carryOut; p.speed = carryOut ? 140 : 280;` (Shift then jogs at 140, default 80 px/s is about 21 s for 54 tiles, so consider moving the first caption trigger and keep the 140 jog as the "hurry" option). Extend `chef-dining-cut` to assert speed, not the flag.

**M2. The plate leaves the table before it is back in Jo's hands: about 10 s with no plate on screen, exactly when Marguerite says "It is your plate".** (code, verify in `chef-hands`)
- `beats.js:57-67`: `hands` sets `hands_done` right after the conversation, which hides the table plate (`rooms/pass.js:28`, `unless: 'hands_done'`), then waits 1.2 s and plays `take_it` (4 boxes). Jo's plate is only drawn when the dining service exists, and that starts after `carry_out` is set at the end of `take_it`, then waits the 2.2 s settle (`rail.js:157-164`). So between `hands_done` and about 2 s after `take_it` ends there is no plate on the table and none in Jo's hands.
- Fix: hide the table plate on a new flag set when the dining service starts: in `rail.js:start` add `if (key === 'dining') F.plate_hand = true`, and use `unless: 'plate_hand'` at `pass.js:28`; skip the 2.2 s settle for `dining` (`rail.js:164`: `settled = key === 'dining' || ...`).

## SHOULD

**S1. Station chevrons sit on top of the signs and hide their letters.** (shot, `chef_line.jpg`: the triangle in the middle of "SAUCE")
- `rail.js:241`: `y = sp.y - 150 + bob` lands on the sign boards at SAUCE (line sign y7), SCOUR (pit y7) and HERBS (prep y4 dy14). Fix: `sp.y - 100`, below every sign (signs end at about y 256, chevron then at about 284).

**S2. The yard is the first thing the player sees and Jo is nearly lost in it (2.17:1 is real, not a rounding issue).** (code, shot)
- One light only, at the door (`rooms/yard.js:30`, x24). Jo spawns at x4 and walks 17 tiles in the dark; at the door he reads (shot), at the spawn he cannot. The failing test says the same.
- Fix: add `{ x: 8, y: 11, r: 120, color: 0xd8c8a0 }` (a bin lamp or a lit window) and one at x14 over the coin; keep the 24 one.

**S3. In prep, Brann can grab Jo while he is locked at a station and cannot duck.** (code)
- `Foe.js:334-340`: the grab throws out unless `player.crouching`; `rail.js:170-173` holds Jo still for 2.6 s (board) to 3.2 s (slab); Brann patrols 15 to 39 past the board and slab. Windup is 0.4 s and he sees from 150 px, so a working Jo has no answer. A throw-out is a heart, scattered coins, a walk back from x8 (`BaseLevel.js:298-330`). The mise progress is not lost, but the door-meter time is.
- Fix: the rail sets `p.busy = !!w` in `rail.js:~170`; `Foe.js:335` adds `&& !player.busy` (the grab is skipped, he goes back to alert). Or give Brann's patrol a break from x15 to 32 while `working`.

**S4. The Chef patches the shared scene object and never undoes it.** (code, verify)
- `rail.js:83-91` assigns `s.onHurtExtra`, `s.dropCarry`, `s.railApi` on the scene instance. `DreamScene.js:124` says Phaser reuses the instance, and `create()` does not clear them; no other dream does this. After Chef, boarding another framework dream in the same session leaves Chef's closures hooked into its hurt and respawn: they find the old service, and if Jo quit Chef with a plate in hand, a hit in the casino prints "The risotto is on the floor" and adds to a dead flag object.
- Fix: in `DreamScene.create` (near line 124) `delete this.dropCarry; delete this.onHurtExtra; delete this.railApi;` (own properties shadow the prototype, so delete restores the base method).

**S5. Quitting in the middle of three beats strands the run on Continue.** (code, verify)
- `returnToStation` saves the flags at that instant (`BaseLevel.js:938-943`) and `Esc` is read outside the conversation box (`BaseLevel.js:1104`). Flags set before the beat finishes:
  - `pit_clear` (`beats.js:5-14`): `rail_pit` and `pit_clear` are saved, `apron` is not; `marguerite_pit` has no `talk` (`rooms/pit.js:71`) and `apron` is not replayable, so the pit door stays locked. Fix: give her `talk: [{ conv: 'apron', if: 'pit_clear' }]` and mark `apron` `{ replayable: true }` (`dialogue.js:34`).
  - `hands` (`beats.js:57-67`): `rail_pass` is saved, `carry_out` is set only at the last node of `take_it`; the pass door needs it and `marguerite_pass` only appears on `hands_done`. Fix: `take_it` `{ replayable: true }` (`dialogue.js:66`), and give `marguerite_pass` `when: 'plate_shown'` instead of `hands_done` (`pass.js:49`).
  - `set_down` (`beats.js:69-81`): `rail_dining` is saved before `orb_on`; no orb, no ending. Fix: spawn the orb on `when: 'plate_set'` (`dining.js:59`) and let the lamps follow `plate_set`.
- Window is 8 to 12 s each; recoverable by restarting the dream, so this does not hurt a straight first run, but a long, quit-and-continue dream will meet it.

**S6. The rush gives no progress and its objective says nothing.** (shot, code)
- The banner is the fixed "PLATE WHAT THE RAIL SAYS" (`dream.js:128`) directly over a rail that says it already. 14 tickets over 3 to 6 minutes with no "sitting 2 of 3" or count is a long tunnel; the player cannot tell if they are early or late in the night.
- Fix: reuse the DOORS meter slot (`rail.js:61`, `hudLines` 279-282) as `SITTING n / 3` plus tickets left (`sv.queue.length + sv.rail.length`), and drop the banner text to the pass hint once `sitting === 3`.

**S7. Stock and pocket HUD (the right-hand lines in `chef_line.jpg`) are in the wrong place and say the wrong things.** (shot)
- `rail.js:273-278`: "POCKET: SAFFRON" and "POCKET: ONIONS" take two rows during a rush where neither does anything; "FISH 3 SAUCE 3 / LARDER 2" sits at the far right while the stations are on the left; the words differ from the signs (FISH vs GRILL; LARDER vs "terrine").
- Fix: draw the stock as pips above SAUCE, LARDER and GRILL in `drawMarks` (it already draws pan bars at 245-257), delete `stockLine`/`stockLine2`, and fold the pocket to one row: `POCKET: SAFFRON, ONIONS`.

**S8. The saffron is carried for five minutes and never used.** (code)
- Table One's `risotto` verb is "stir it, stay with it" (`services.js:54`); `saffron_used` is set only when the ticket is served (`rail.js:365`). The tin simply disappears from the HUD at the end.
- Fix: verb `'stir in the saffron, stay with it'` and clear the pocket row when the work starts (set `saffron_used` on the `work` event, `rail.js:onEvent`).

**S9. A table's change of mind can be dropped silently.** (code)
- `tickets.js:131-146`: `amend` sets `k.amended = true` first and returns at line 138 (`up && this.hands`) without changing the ticket or emitting. If Jo has already collected the fish and holds another plate at 93 s, "NO SAUCE" never appears and the amendment is never retried. It is the dream's only mid-service surprise.
- Fix: move `k.amended = true` below the early returns (lines 133 and 138).

**S10. Aurelio's line about bails is wrong for one bail.** (code)
- `tickets.js:384`: `(F.bails || 0) > 0` says "Marguerite's on half your plates". One bail of 14 is not half. This is the central payoff scene.
- Fix: `bails > 4 ? '...half your plates...' : bails > 1 ? 'And Marguerite has put her hands on a few of them.' : 'And one plate has her butter on it. I can smell it.'`

## NICE

- **N1. Dead lines.** `CALLS.next` and `CALLS.clean` (`dialogue.js:106-107`) are never used; `rail.js:373` always says "Next." or "...Next.". Use `clean` for a fast plate once in a while ("Hm. Next.") so the 14th "Next." is not the 1st.
- **N2. Acknowledge the first burn once.** Marguerite or Brann: "Cold water, stage. Then back." (`rail.js:onHurtExtra` on first `burn`). It sets up the hands read.
- **N3. Highlight the mark on the painted hands as each line is spoken** (`dream.js:45-69`): circle the thumb, then the cuff.
- **N4. `kitchenBack` runs after the "...Next." box is dismissed** (`beats.js:60`), not as he says it; move it to the `next` node via an `effects` call.
- **N5. `rail.js:140` adds `stock_*` again when a room's service restarts** after a Continue in the middle of prep (mise tickets done twice give double stock), and prep's clock stops when you leave the room (`rail.js:158-166`). Both are small exploits, not softlocks; store `stock_*` once per ticket id.
- **N6. Yard banner wraps with a widow ("TALK TO / HER", shot).** Shorten to "THE WOMAN AT THE BACK DOOR: TALK".
- **N7. Hands-box text looks garbled in `chef_hands.jpg` ("A h urn on the left th mh") and the dining caption "alwa,s".** Probably the 0.83x JPEG downscale on the bitmap font, but verify at 1:1.
- **N8. Sitting 1 could lose t5.** A second terrine at 38 s repeats t2 and delays the first overlap; dropping it (or moving it to sitting 2) shaves about 10 s and tightens the teaching.
- **N9. "11 plates sent" but eight tables.** The room shows one plate per table (two plates at one table shows one); the card counts plates. Fine, or say "N tables" in `nightLine`.

---

## Hazards (the bot is invulnerable, so traced in code)

| Hazard | Telegraph | Cost | Fair? |
|---|---|---|---|
| Stock burners, line (`kitchen.js:110-131`) | Blue ellipse and a tick for one beat (about 0.45 to 0.54 s), then flame one beat, then off two (one at sitting 3, none at difficulty 2 and sitting 3) | A heart plus the plate back to its last stop; counted as a burn for the hands | Yes. Flame is 28 x 70 px, Jo's jump apex is 150 px, all five stations stand at least 4 tiles from a burner, and the plate rail is a safe, slower route. The 2-off and 0-off cases at difficulty 2 deserve a first look when played. |
| Steam, pit (`:133-147`) | Rising puff one beat, jet the next | Heart, spill | Yes, stations 2 to 3 tiles clear. |
| Oven doors, prep (`:149-161`) | Amber glow two beats, blast two beats | Heart | Yes, 84 x 56 px, stations clear. |
| Luc, line (`:213-242`) | "Behind!" at 90 to 220 px when moving toward Jo | Plate spills, no heart, knockback | Yes; bark gives about 0.5 s at head-on closing speed, a 26 px hop clears him. Safe on the plate rail. |
| Trolley, pit | "Trolley!" bark, load drawn | Plate, no heart | Yes. |
| Beef, cold (`:164-190`) | 0.75 s rattle plus a clack | Knock only, no heart | Yes. The top deck's beef can knock Jo off the ledge to the deck below with the cold running: a long re-climb, but a re-climb. |
| COLD (`:192-211`) | Meter, frost vignette, caption, warm pipe | Zero: heart, meter back to half | Yes. It keeps draining after the saffron is taken, which is a bit mean on the way down but the pipe is on the way. |
| Brann, prep | Sight cone, notice, 0.4 s windup | Throw-out, heart, coins scatter | **No while Jo is working (S3).** |

Softlock trace: the engine cannot deadlock. Hands only ever hold a plate that has a `to` station (`tickets.js:195-199`), a full-hands last stop says why, the reserve tops up only stations at 0, a spilled plate returns to its last stop, a late ticket is refired once and bailed on the second lateness (`:148-160`), Table One waits for a clear rail and empty hands (`:62`), and the prep clock ends the service with whatever is done. Rooms: the cold door needs the saffron which the key item gives, the prep door needs `mise_done` which the clock forces, the pass and dining doors need flags set by the beats (see S5 for the Continue case). Death respawns at the room's checkpoint with the service intact (`BaseLevel.js:720-740`, world not restarted). `inHand` plates cannot spill (`tickets.js:331`), so the dining room is safe.

Old saves: `SaveStore.run()` drops a run whose `sceneKey` is `Chef` (`SaveStore.js:197,286`) and the board offers a fresh boarding; caught state and `m1` to `m3` moment ids are kept; `chef-old-run` covers it. Nothing else in the save names the old scene.

Framework changes (FRAMEWORK.md §21), checked against other dreams:
- `ending.variant` and `paint(F)`: other dreams define neither, so their cache key is unchanged (`EndingSequence.js:77-78`). Safe.
- Silent NPCs no longer offer [E] (`DreamScene.js:483`): `pickConversation` is pure and cheap, and `talkTo` already did nothing in that case. Only the prompt changes. Safe.
- Shove card hidden when `scene.def` is set (`Foe.js:357`): only `DreamScene` defines `def`, and no file under `src/dreams` mentions shove. Safe.
- `IntroScene` import and `LEVEL_SCENES.chef`: correct.
- **The one that is not safe is S4** (instance hooks), which is in the dream, not the framework note.

## Contrast, signs, props, HUD

- 2.17:1 in the yard is a real problem for the first 17 tiles of the game, not a number to wave away: S2.
- Signs: SINK, SCOUR, RACK, HOOKS, HATCH, BOARD, SLAB, GRILL, SAUCE read at 1x (shots). The extra signs ("COLD STORE. APRONS ONLY", "SAFFRON UP TOP, CHEF SAYS", "THE LINE: DOORS 7:30", "CHEF ONLY") each say something the player needs or enjoys; none is dead. Fix S1 for the chevron overlap.
- Rail tickets (`railHud.js`): the dark docket inside cream paper reads well (shot), the scorch rising from the bottom is a good clock, the held plate's gold edge is clear. The destination is the last row, dim until the stops are done: good.
- Pointless or noisy: the pocket rows (S7) and the fixed rush banner (S6). The flames are not pointless (they are the aisle), but a burner that is 75% idle looks dead; the blue warn ellipse is what teaches it, and it is small. If anything reads as "just decoration" in the first sitting it is those, so make the warn ellipse 20% larger and let it glow (cheap, `kitchen.js:122-123`).

## What I cannot judge from code

- Burner feel, Luc's pace and the climb are untested by hand (the report says so). The commute, 13 plates at about 7 s of running each, is the biggest unknown. If the first human playtest finds the rush repetitive, the cheapest lever is to move the pass window inward (x54 to about x46, with the risotto beside it) before touching the engine.
- Audio has never been heard (dev is silent); the beds, the drop at the dining door and the kitchen rushing back at "Next." need the owner's ears.

## Converged?

**No.** M1 and M2 are both in the last three minutes of a 12-minute dream and both are visible to a first-time player. S1, S2, S6 and S7 would be seen by every first-time player and are cheap; S3 will cost some player a heart for nothing in prep; S4 and S5 hit only people who switch dreams or quit mid-beat, but S5's pit case is a locked door with no hint. Fix M1, M2, S1 to S3, S6 to S10 and S4 and S5 and I would call it converged; the N items are polish.
