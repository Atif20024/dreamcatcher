# THE LAST HAND: designer + gamer review, round 2

Read-only. Checked against code (`src/engines/{showdown,faro,slate,purse}.js`, `src/dreams/gambler/{dream,table,dialogue,beats}.js`, `encounters/tables.js`, `verbs/purse.js`, `src/play/Encounters.js`), the Round 2 section of `CASINO_POLISH_REPORT.md`, and the six `casino_r2_*.jpg` stills. I re-ran `tests/showdown.test.js` and `tests/faroBalance.test.js` (68 pass). I did not run the game, so feel is inferred.

## Verdict

**No MUST. Not quite converged under the strict bar:** three SHOULDs would hurt or confuse a first-time player (S1 habit drift, S2 Backspace, S3 HUD label). All three are small fixes. Every round-1 MUST is verified in code, not just claimed. The report's "every MUST and SHOULD is done" is slightly generous: D-S2 (tell vignette) and the "costly wrong tip at table 3" half of D-S1 are skipped (the report lists the first under Skipped and the second under D-S1 itself).

## Round-1 verification

| Item | Verdict | Evidence |
|---|---|---|
| D-M1 STAND UP taught at tables 1-3 | Done | `showdown.js` `play()` sets `out.beaten` on the first pot won; `menu()` stand has `hot: s.won`; `table.js` `options()` draws it gold; `infoLine` ends the reveal with BEATEN_LINE; `sync()` calls `scene.setObjective('stand_up')` and `destroy()` resets `_objKey`. Still: see S2 (Backspace) and N2. |
| D-M2 slate | Done | `slate.js` rows are -$/+$ at the tables; `purse.rebase` runs in `verbs/purse.js` update at the card room door, net of debt; `line()` returns `between` until `based`. A bust clears `based`, so it is re-placed. Test covers faro payout alone. Screenshot `casino_r2_slate.jpg` reads well. |
| D-M3 / G-S5 first tilt | Done | `verbs/purse.js` fires `LOU_TILT_FIRST` once (`F.tilt_told`), pulses the label, and again on getting up still tilted. `casino_r2_tilt_caption.jpg` confirms. `big_loss` 0.10 plus `streak` 0.08 gives nudge-then-tip. Math checks: a lost pair-raise at one opponent is 0.35+0.10 = 0.45. |
| D-S1 / G-S4 Lou tips | Done, one half skipped | Seeded own coin `lr`, so no countable phase and the deal is independent. Describe mode from table 2, misreads are true sights. `bestVerb` pair vs hum/flat is CALL. Not done: weighting table-3 misses toward costly hands. |
| D-S3 / G-N1 finale | Done | Objective reworded, `LOU_LAST`, one habit drift, Judge's hum is `PLAYERS.judge.tell(tier(voe))`. The drift is itself a problem: S1. |
| G-S1 negative stacks | Done | `menu()` ALL IN, `cover` guard on RAISE/BLUFF, `why` text. Edge: with $5-9 left after the ante a hand can only be folded (CALL stays lit only if stack > 0, so $5-9 left calls all-in; $0 left is fold or stand only). Fine. |
| G-S2 CALL $0 / wording | Done | `finalStake` is bounded and debt-aware; `lostNight` floors the stack and clears tilt. See S4 for the side effect. |
| G-S3 / D comps | Done | `compStake` adds a real $10 debt; ledger prints it. See N3 (the free bet can be $20). |
| D-S4 / G-N4 way back | Done | `SPOTS.deck`, `lostNight` returns to `cp_deck`. |
| D-S5 two `$` counters | Done | `HALF DIMES 0` visible in every still. |
| D-S6 debt-aware lines | Mostly | Lines, bar and frame read net. The STACK *label* still prints gross: S3. |
| D-S7 / G-S? faro | Done | Target 70, faster timings, hint text in `faroPresenter`. Backspace leak: S2b. |
| D-S8 grey squares | Done | Round coins. |
| G-S6 key legend | Done, but see S2 | Legend present on all three panels. |
| G-S7 touch | Done | `optionRects` 60 tall, `holdCreep`, tap on a dim verb shows its reason. Faro card-row hit zone ends at PY+104 while the bet band starts at PY+100: 4 units overlap, harmless. |

## DESIGNER

### MUST
None.

### SHOULD

**S1. The habit drift can snatch STAND UP out from under a first-timer.** `showdown.js` `update()` (the `final && !s.habit && s.tilt < TILTED && cursor != call` branch) moves the cursor back to CALL after 1.8 s whatever it was on. A first-timer who presses Left to STAND UP, then reads the line and Lou's 4 s caption (`LOU_LAST`), sees the cursor jump to CALL with a red flash and may press E on the wrong verb. The thesis verb should be the one the habit cannot steal on its first try; the pull should be felt on the way to it, not applied after the decision is made.
- Fix: only drift from RAISE (to CALL, the "safer bet"), never from STAND UP. Or hold the drift while the cursor is on STAND UP. If the owner wants the snatch, make it audible and give the thumb a full 3 s.

**S2. Backspace is taught by the legend and it bypasses the dream's verb and its credit.**
- `table.js` `keysRow` prints `[BACKSPACE] STEP AWAY` at tables 1-3. Backspace goes through `Encounters.update` -> `finish({ok:false,left:true})`, so STAND UP is never practised, and `table_won` never fires (no Lou line, no gate sting; `F.t1_won` is still set by `sync`, so the flags are right but the moment is missing). The first rep of the dream's verb is skipped by the key the panel advertises.
- Fix: print `[E] on STAND UP to leave` (or `[BACKSPACE]` = STAND UP) and, in the presenter, intercept: when `def.onWin` and `engine` is a showdown, route 'back' to `engine.press('stand')` so the result carries `ok: s.won`. Cheapest: in `Encounters.update` give defs an optional `leave(engine)` hook.
- **S2b (gamer, same cause, worse in faro).** `faroPresenter.outro` calls `def.onResult(scene, result)` with the bare `{ok:false,left:true}` from Backspace, so `st.bank ?? 40` is 40: the bank's wins and losses are both discarded. Up $20, step away: the $20 is lost. Down $30, step away: the loss is erased, so the faro cannot bust for anyone who presses Backspace. Fix: `onResult(scene, { ...engine.state(), ...result, bank: result.bank ?? engine.state().now })` (state's `bank` is the opening figure; `now` is the live bank). Add a test or scenario step for leaving mid-bank.

**S3. HUD STACK label is gross while the lines and bar are net.** `verbs/purse.js`: `setLabel('STACK $' + stack)` (gross) with `STOP`/`GOAL` and the bar on net. In `casino_r2_office.jpg` it reads STACK $136 against GOAL $146 with OWES $10 below; the true distance is $20, not $10. After a marker ($50) it reads STACK $186 over GOAL $146 and still glows "between". A first-timer cannot square those.
- Fix: label the net: `STACK $126` and let `OWES MR PELL $10` explain the gap, or `STACK $136 (126 CLEAR)`.

**S4. A lost last hand is now free, and the ledger forgets it.** `dream.js` `lostNight` floors the stack to the buy-in. RAISE all at $100+ is therefore a free roll: win and stand up for double; lose and the stack is reset to $100 at the foot of the deck. A player can brute-force an "up $100" ending with no cost beyond a walk, and the ledger's last line ("Home with $100: up $0") reads as if nothing was lost. The thesis is "greed costs"; here it costs minutes, and the honest ledger now hides it. Not a first-time-player problem, so SHOULD not blocker.
- Fix: record `p.lostNights` and `p.acrossTable` (what went across) in `lostNight` and add a ledger line ("The Judge took $N across the table, once."). Optionally floor only to `buyin - debt`, so the debt, not a free reset, is what Jo carries home.

**S5. Tells are still lookup, not read (D-S2, skipped).** The words still carry the tells (`HAND STILL`, `PINKY OFF THE GLASS`) and the people sit ~40 px tall under a 236-px panel (`casino_r2_cards_table_won.jpg`). The panel moved up, so the people are visible now, which helps. The table-3 wrong tip also still costs only $10. Not a first-timer hurter; the fix is the vignette inside the panel from R1.

### NICE

- **N1. First-win line drops the rake sentence.** `infoLine`: `beaten || rake`. The first pot says BEATEN, not "the house took $N". The rake coin still drops. Show both when it fits.
- **N2. The gold line stays while Jo is down.** `casino_r2_cards_table_won.jpg` shows STACK $73, below the $100 buy-in, with "TABLE BEATEN: STAND UP WHILE IT IS YOURS" on repeat. It is "yours" only in the pot-won sense. The line also permanently replaces Lou's tip after the first win (`if (st.won)` precedes `st.tip` in `infoLine`). Consider showing it gold only on hands when the stack is above the sitting's opening stack, or only on the reveal plus one decide, then Lou again.
- **N3. The free faro bet can be $20.** `faro.js` `net = free ? 0 : -stake` for any stake, but the dealer's text and the faro hint say $10. A free $20 bet is EV about +$10 against a $10 debt: a wash, and the text is wrong. Force the free bet to $10 or print "up to $20".
- **N4. A lost night leaves the stale lines.** The stack is back to $100 while `purse.stop` was based on the card-room stack, so Jo at the pilot house is "below" the stop and the HUD goes red. It is honest, but a short Lou line would explain it.
- **N5. Top goal line and panel say the same thing** at the same moment (`casino_r2_cards_table_won.jpg`, top plate and panel line). Harmless redundancy.

## GAMER

### MUST
None. I could not find a way to farm the slate, the tilt or the faro, and the table math holds: rake 5% per pot, a pair-raise loss never crosses TILTED alone, the follow-Lou player tilts more (39% vs 23%, per the report), which is a good irony.

### SHOULD (in my order)

1. **S2b first.** The faro Backspace leak is the only way I found to break the game: a bust is voidable on every bad run, and winnings are voidable by accident. One-line fix in `faroPresenter.outro` (see above).
2. **S1 drift.** In practice I will move to STAND UP, read, get yanked to CALL, and curse. Once. But it is a trap in the one moment the game asks for a decision. If I find it twice (the `habit` flag resets per deal), the second win's drift is the same trap on the next hand: `s.habit = false` at each `deal()` in `showdown.js`. Make it once per sitting or drop the STAND UP case.
3. **S2 legend teaches Backspace.** I will use it because it is printed. Costs the credit beat, no money at tables.
4. **S3 label.** Reading STACK against GOAL is how I check the slate; it lies by the debt.
5. **S4 free roll.** I would, knowingly, grind the last table: RAISE all, lose, walk the short way up, repeat. The only cost is the ~1 minute walk. Put a number on it in the ledger.

### NICE
- The pot-won state treats a split as a win (`joWins` includes splits): "TABLE BEATEN" on a split pot, which refunds your stake. Consider requiring a clean win.
- At a $5-9 stack the ante is the whole stack and the hand can only be folded; show "no cover: fold or stand" in the line (the `why` text exists for CALL but CALL is lit for 1-9 as ALL IN, so it only bites at exactly $0 after the ante).
- Streak does not break on a fold between two losses (`streak` is only reset on a win). Reasonable (chasing), but make it explicit in a test.

## Converged?

**No MUST remains. Strictly, not converged:** fix S1, S2 (with S2b) and S3 and call it. They are one-line to ten-line changes and none needs new art or content. S4 and S5 may ship as they are. If the owner prefers to ship now: S2b (faro money on Backspace) is the one with a real effect on a first-time player's balance and should not go out.
