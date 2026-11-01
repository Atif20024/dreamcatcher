# Review R1: Painter, Clockmaker, Casino upgrades (commits 3e82b4c, 104f364, d6122bc)

Lens: senior game designer plus pro gamer. Read-only. **I did not play and ran no tests, server or browser.** Everything is read from the worktree
`.claude/worktrees/agent-a0fb7628ee6a529d6`: the three commits, the engines (`craft.js`, `escapement.js`, `Encounters.js`), the entity/adapter code that decides
what spawns (`dreamAdapters.js`, `Terrain.js:281`, `DreamScene.js`), and the tests. Numbers below are computed from the code. Disciplines read: level-design, game-feel, game-balancing (applied, not quoted).

## Verdict

**Not converged.** One MUST (a duplicate pick-up on the main theft path) and one SHOULD that would hurt a first-time player (the third gear has no assist
in "the gentle dream"). Everything else is minor or taste. The builder's work is otherwise strong: every item in the deep review's MUST/SHOULD lists and both MAJORs
exists in code, the merged strike design is good, and I found no hard softlock in any of the traces you listed.

## 1. Item check (deep review vs code)

### Painter
| Item | Result |
|---|---|
| MAJOR, jobs differ | Done and distinct. `craft.js` modes `mash`/`hold`/`double`/`stock` (`craft.js:13-30, 78-200`); jobs set them at `jobs.js:30-95`. Presenter shows marks, blow pips, muller fill (`craftPresenter.js:40-57`). `release` is wired by the existing `Encounters.js:61`, so no framework change was needed. |
| MUST 1, a miss costs | Cosmetic-but-specific: Gualtiero/Bice lines (`dialogue.js` `gualtiero_lapis`, `bice_after`), panel colour, Folco's verdict. Nothing can fail a job. Right for a gentle ladder. |
| MUST 2, lapis at risk | Done (`sketch.js:35-41`, `logic.js:48-60`, `via.js:73-77`, `speziale.js:61-63`) **but has a bug, see MUST 1 below.** |
| MUST 3, Gualtiero / branch lines / `told_master` | Done. Guild NPC and trial node (`guild.js:62-65`, `folco_first` g1), deck (`chapel.js:84`), bell (`beats.js:85-86`, `gualtiero_bell`). `named` call sets the three flags; the dialogue runner skips failed-`if` nodes to `next` (`DialogueRunner.js:49-52`) so every branch of `gualtiero_bell` and `dori_deck_after` resolves. `told_master` is read twice now. Builder's reword of "I told them the fold was mine" is correct (that is said nowhere in the dream). |
| MUST 4, Bruno | Red coat and porters' own art (`people.js`, `kinds.js:43`), bark on `bruno_near` (`sketch.js:42-46`, row 22 is the plank under his). OK. |
| MUST 5, [Q] | Caption when a study is within 130 px (`sketch.js:48-55`); `studiesLine` pays for 1, 2, 3. The `r` bug fix is real: `ringAt` uses `max(radius, r.r)` and `r.r` is `e.r*T` (`dreamAdapters.js:152, 183`), so `r:90` meant 2880 px. Now the ring is 130 px. |
| SHOULD 6-10 | Done: second lines (woman, friar, beggar, Tonio), inspectors become nodding NPCs after `seal`, Dori's bar (`jobs.js:133`), rivals leave after the seal, `via_rivals` bark moved to room entry, `gualtiero_sealed`. |

### Clockmaker
| Item | Result |
|---|---|
| MUST 1, staged payoff | Done, and better than asked (see section 4). |
| MUST 2, ending | Done. Third line changed to "Nell lit the last lamp": correct, because the clock lights the first. |
| MUST 3, townsfolk | Watch man, pie woman, child (whistle verb). Lines verbatim. |
| MUST 4 / MAJOR, a place per gear | Dial, shaft, belfry, yard. Room grids, doors, ladders, gear and hatch all line up (checked row by row: standing rows, `door_wood` props vs portals, lamp posts vs the hill slope). |
| SHOULD 5-9 | Done: `asked_why` branch in `nell_done`, tick removed from every pre-wound key (`music.js:68-70`, ambience `gm_office`), `tense` set by encounters, child asks for the whistle, `wren`→`nell` (remaining `wren` hits in src are other characters in Evening/Writer), brass glow (`encounterPresenters.js:29`). |

### Casino
| Item | Result |
|---|---|
| Barman, casekeeper+lady, Dev split, pipes, tilt sound, Lou's hands, guard moment, clean office | All present. Third pipe is `deck.js:27` (moved to x32: correct, x35 is the pilot door). `purse.js` asserts `tense` while tilted; `saloon_warm` key is idempotent (`StemMusic.setKey` returns early on same key). |

## 2. Softlock traces

| Trace | Result |
|---|---|
| Lapis grabbed, shop already left | Safe. Rooms rebuild on entry, `item:lapis` is false, the shelf item spawns. **But it spawns twice, see MUST 1.** |
| Lapis grabbed inside the shop | Safe. The unconditional entity already returned null; the `when: lapis_stolen, unless: lapis` watcher spawns one. |
| Repeated theft | Safe. `loseLapis` is idempotent in effect, `lapis_stolen` counts. Each theft is `throwOut` (a heart + coins scatter, existing rule), the checkpoint is `cp_speziale` or `cp_via`, so the loop is a short re-trek (about 4 s) plus one climb. Zero hearts is the existing respawn path. Street rivals swap cleanly when `lapis_carry` flips (`streetFlags`, recomputed every verb update; `rivals_out` is true again once the stone is gone, so Jo meets the outbound rival, not the carry pair). |
| Theft while a modal is up | Not possible: foes are held and `sketch` runs whenever no modal is open. A theft inside the 1.5 s `thrownOut` window is caught on the first frame (`!st.thrown`). |
| Each craft mode failing | None can fail the job. Mash: off-zone loses one back. Hold: run off the end or release off the gold restarts from 0 (`craft.js:90-97, 169-183`). Double: a pass ending between marks wraps to 0 with `sub` cleared (`craft.js:98-104`). Stock: a miss wastes it, no stock means the cheap colour, still finishes. `back` leaves and restarts a fresh engine, so stock and `test_wasted` reset. |
| New rooms and doors | All doors paired and gated sensibly: hatch needs `gear1`, belfry door needs `gear2`, belfry-to-yard door needs `clock_wound`. Both gates (`g_yard` on the green, `g_yard_in` in the yard) need `struck`. No room reachable without its key, and none that traps Jo behind a gate (the yard is reachable from above before the gate opens, which is the point). |
| Seven strikes, press nothing | Cannot be lost. `patient: 3400` auto-strikes; I traced the schedule at period 2200 and window 0.14: strikes at about 3.4, 7.5, 10.9, 14.3, 17.7, 21.8, 25.2 s, so about 25 s of ceremony. Long but each strike lights a lamp and rings, and the hint tells the player to press. |
| Jo walks away mid-scene | Cannot. `encounterActive` skips `player.update` and zeroes x velocity (`DreamScene.js:866-875`); `canLeave: false` kills `back`; `outroMs` holds. Beat locks (`out_on_hill`, `seven_struck`, `green_lit`) release at the end; locks live on a per-scene `InputMap` (`DreamScene.js:187`) so a quit never leaks one. |
| Camera pan | At zoom 0.9 half-width is 533 px. Gate to rope is 23 tiles (736 px), midpoint focus puts each 368 px from centre. In frame, with the left seam clamp shifting it a few pixels. The strike plate sits 112 px over Jo. Unverified by eye. |
| Whistle coin, resumed run | `child_coin` is persisted, the coin itself is a transient pickup, so quitting before collecting it loses 1 coin forever (NICE, 1 coin). |
| Old saves | No painter or clockmaker room geometry changed (diffed grids), so checkpoints land in solid ground nowhere. `met_wren` is gone: Nell re-introduces herself (harmless; `_conv:` flags differ). An old save with `clock_wound` but no `struck` (all pre-change winds) has to redo dial, shaft and belfry (the pendulums are caught and quiet because `bobAt` honours `clock_wound`); the belfry door only needs `clock_wound`, so it is completable. Old painter saves recompute every new street flag each frame, and `test_kit` falls back to `ug`. |
| `green_lit` interrupted | `works.js:71` sets `green_lit` before the beat runs. Quit during the beat and on resume the orb exists but Nell's lamp (`nell_lamp`) never lights, contradicting the ending's last line. NICE. |

## 3. MUST / SHOULD / NICE

### MUST
1. **Lapis pick-up fires twice after a theft and re-entry.** `speziale.js:61` (no `when`) is not watched, so on room rebuild it spawns whenever `item:lapis` is false, and `speziale.js:63` (`when: lapis_stolen, unless: lapis`) spawns as well. Both sit on the same tile and `updateKeyItems` (`dreamAdapters.js:152-167`) takes each, so `got_lapis` plays twice: two identical captions back to back, two sfx, two `saveRun`. This is the main theft path (steal in the street, walk back in). Fix: delete line 63 and change line 61 to `unless: 'lapis'` (a single watched entity; `spawnKeyItem` still guards on `item:lapis`).

### SHOULD
1. **Third gear has no assist (hurts a first-timer).** `escapement.js:39-52` plus `clockwork.js:39` (`slip: true`, fixed window 0.16 of 1800 ms = 288 ms on a 900 ms cadence). The dial has `assist`, the craft jobs have `assist`, this has none, and a missed press also loses a beat; mashing is net-negative because a second press in the same window is a miss and slips. A player with poor timing can loop at the end of the gentlest dream. Fix: widen the window per slip, for example `const w = window * (1 + 0.25 * Math.min(s.slips, 3))` in `off() <= w / 2` and the state. The yard strike needs nothing because it auto-completes.
2. **Pell contradicts the book for anyone who took a comp.** `office.js:64`: `pell_clean` fires on `met_pell` alone, so a player with a comp or debt but no marker is told "Nothing signed. The book hardly knows you" about the book that holds their comp. Fix: gate it on `clean_book` (`{ conv: 'pell_clean', if: 'clean_book' }`) and let the fallthrough be `pell_again`, or add one `pell_comped` line ("The steward's whisky is on my book, Mr Jo. Fifty more?").
3. **Rewarding restraint is only half noticed.** The clean player's best line (Pell's) needs a second deliberate conversation; the book, wide corridor, no Crake and brass are found by walking. Fix: fire `pell_clean`'s first line as a bark when a clean Jo passes x about 14 in the corridor (`when: { room: 'office', flag: 'clean_book', near: 'npc:pell' }`), once.

### NICE
- `craft.js:90`: a step's own `speed` bypasses `assist`, so grind steps 1, 2 and 4 never slow after misses (they are slow anyway: 0.4-0.45). One line: scale by `s.speed / speed`.
- `craft.js:111-122` / `Encounters.js`: the 5th mash press advances straight into a hold step; a sixth tap becomes press then release at p near 0 and counts a miss. Ignore input for 250 ms after any step change. (Clean needs at most 2 misses of 4, so it can cost "Flour with gravel" for no reason.)
- `jobs.js:133`: `dori_done` persists if Jo leaves and retries the giornata; clear it in `giornata.params`.
- `works.js:71`: set `green_lit` at the end of the beat, or a separate `green_seen` guard, so an interrupted beat replays.
- `lane.js:48`: the signpost at x41 has no text. Either give it two words or drop it. With "nothing should feel not well thought out" a blank board by the arch is the kind of thing a player does notice.
- `office.js:70`: `c_clean` sits on the first plank row (row 6, needs a full 150 px jump; the ceiling is row 5 so the apex clears by about 6 px). Measure it with the real jump before trusting it.
- Casekeeper's "tell her I only watch" has no prompt and the lady is 70 tiles back on the quay; most players will never see the joke. Optional: a one-line objective hint or have the lady's `lady_after` be reachable earlier.
- Painter music does not react to rank (the deep review marked all music keep; I agree to skip).

## 4. Judge the strikes on the belfry door

**Good design; keep it.** The review's MUST (stage the seven strikes and the lamps) and its MAJOR (a strike job in the yard) cannot both hold because the yard is behind the gate the strikes open. Moving the player to the yard from above, with the gate still shut and the camera holding gate and Jo, solves it better than either alone:
- The player earns the bell (agency), the town answers lamp by lamp (readable cause and effect), and the gate swings in frame because `seven_struck` re-pushes the shot as the encounter ends.
- The second payoff (`green_lit`: Nell lights the last lamp herself) needs the player to walk down and see the town, and the orb is gated on it, so nobody skips the answer.
- It teaches nothing new: the same bob-plate as gear 3, but forgiving. Two caveats, neither blocking: a mash of E clears all seven in 7.7 s (one hit per crossing, no penalty), so the strike is a ceremony, not a test, which suits a payoff; and the first auto-strike on a idle player takes 3.4 s, so the "I pressed nothing" experience is real but works.

## 5. The clockmaker for first-timers

- **Gentle: yes, with the SHOULD above.** The new hazard is padded properly: first knock free, never the last heart (`logic.js:25`), knockback not a fall to death, pendulums quiet once wound. A second knock does cost a heart and scatters coins (`BaseLevel.hurt`), which is fine and teaches. Three pendulums at 2600-3400 ms periods are readable; computed danger windows on the floor pendulum about 0.3 s of every 1.3 s.
- **Length 6-10 minutes: agree.** My beat count: lane 40 s, Nell 60 s, walk and clock house 30 s, dial 20 s, shaft 50-60 s, belfry and gear 3 45 s, hill and strike 40 s (25 if idle), walk down and `green_lit` 25 s, back up 15 s, ending 25 s. About 6.5 to 8 minutes for a focused player, up to 10 with townsfolk and coins. The builder's "6 to 8" is right; a speed runner is about 4.5.
- **Payoff lands:** yes. The flow is dial (a click), shaft (a danger and a find), belfry (the tick starts, nowhere sooner), hill (the shot), green (the answer). The sequence is correctly ordered from sound to sight to people.

## 6. Do the craft modes play differently and fairly (numbers)

| Job | Distinct input | Window by the numbers | Verdict |
|---|---|---|---|
| Grind | mash (5 presses, zone 0.5, bar 0.4/s: 1.25 s in zone per pass), hold (zone 0.24, 0.45/s: 0.53 s), wash tap, hold (zone 0.2: 0.44 s) | Generous, a fair teach, 20-30 s | Fair. Different. |
| Drapery | 3 taps then two `double` folds (first mark 0.31 s, second 0.40 s with Bice, 0.25 s without; 0.58 s between marks) | Bice's lesson is a real, readable reward, and misses slow the bar | Fair. Different. Second mark without Bice is the tightest first-time window; assist rescues it. |
| Test piece | the same six taps (zone 0.17 at 0.75/s: 0.23 s) but with scarcity | A first miss on a precious step spends it, and the kit choice decides which step is "free". Expect about 0.6 of 2 wasted for a typical player | Distinct as a decision, not as an input. Consequence is cosmetic: Folco's verdict and the panel colour. Acceptable, but nothing later reads `test_wasted`. NICE: let the ending or Corso mention azurite. |
| Giornata | unchanged (plaster clock, rival) | existing | Fine; Dori's "Done, boy" gives the bar a voice. |

The pro-gamer note: the folding and the hold steps are the first time Painter asks for rhythm rather than a single reaction, and each has a clear loop-back cost of 1.5-2 s. That is the right grain.

## 7. Third pipe after a lost night

Paces well. The pair (x21, x29) plus a third at x32 (period 2200, phase 700) leaves a 36 px safe slot between x29 and x32 (body 24 px against 18 px half-width), and over the full 28.6 s least common multiple both are off at once about 29% of the time, so a runner clears both in 0.56 s and a cautious player waits in the slot. It reads "the way back is never the way up" without being a wall. Dev's line explains it. Tilted, the on-time stretches 1.35x and the warning vanishes; the deck is `air`, so tilt cools while Jo walks, so a tilted player can recover. No change needed.

## 8. Clean-office content: rewards restraint?

Yes, in four ways: brass the first plank takes, no Crake (`when: marker1`), a book that exists only while `clean_book` is true (the stand is `live` by `Terrain.js:281`, so it disappears if a marker is signed), and a short page that pays the "three markers" motif. Plus `pell_clean` tempts them a second time, which is the right shape (restraint costs nothing but is offered again). The remaining weak spots are SHOULD 2 and 3 above.

## 9. Builder's "not done" list: rulings

| Item | Ruling |
|---|---|
| Painter: no music reaction to rank; no guild side door | Accept. The deep review said keep all music; clearing the rivals after the seal was its first option and is done. |
| Clockmaker: pie woman eating pose | Accept, NICE. |
| Clockmaker: **the dreamer** (who sits in the clockmaker's seat) | Accept for this round; it is a story decision across the whole game, not a fix, and no fix was named. Log it as a design item for the owner: the dream first-timers are pointed to is the only one that belongs to nobody. |
| Clockmaker: hand-wound lamp in the lane, signpost text | Hand-wound lamp is NICE and skippable. **Signpost text is cheap and visible; do it or cut the sign.** |
| Casino: table-swap fade, Fenn at the quay | Accept, NICE. |
| Casino: whole deck is `air`; saloon and pilot house flat | Accept. No concrete fix was named and tuning belongs to a played pass. |
| "What must be rerun in a browser" | Agree entirely; this review adds that the lapis double-fire (MUST 1) would have shown in `painter-playthrough` only if it forces a theft, so add one scenario that steals once and re-enters the shop. |

## 10. Not checked

Art (Bruno, porters, barman, the child's window alignment, Lou's tremble, pendulum draw order), audio levels, real jump reach for `c_clean`, the camera pan by eye, and the effect of `pose: 'still'` on Lou's fidget (`Npc.js:34` returns the standing frame, but a separate fidget task may still run). I read the tests and the builder's report but did not run them.
