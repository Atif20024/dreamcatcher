# THE LAST HAND: designer + gamer review, round 3

Read-only. Checked against `src/engines/{showdown,faro,slate,purse}.js`, `src/dreams/gambler/{dream,table}.js`, `verbs/purse.js`, `encounters/tables.js`, `src/play/Encounters.js`, the Round 3 section of `CASINO_POLISH_REPORT.md`, and the `casino_r3_*.jpg` stills (I looked at `hud_debt` and `ending_ledger`). `tests/showdown.test.js` and `tests/faroBalance.test.js` pass (41). I did not play the game.

## Verdict

**Converged. No MUST, and no SHOULD that would hurt a first-time player.** Every r2 item is in the code as the report says. One SHOULD remains (S1 below, a below-buy-in player is paid for losing the last hand). It needs a deliberate, informed player, so it can ship as is, but it is a two-line fix.

## r2 verification

| r2 item | Verdict | Evidence |
|---|---|---|
| S1 habit drift snatches STAND UP | Done | `showdown.js` `update()`: drift only when the cursor is on `raise`, `s.habit` is set once and never reset in `deal()`; test "the habit never takes STAND UP" and "once a sitting". |
| S2 legend teaches Backspace | Done | `table.js` `keysRow` lines 197/278/455 carry no Backspace. The key still works (see D). |
| S2b faro Backspace discards the bank | Done, and better than my fix | `faro.leave()` settles from live `s.bank` (`now`, which is what I should have said); `faroPresenter.outro` `Object.assign`s it onto the same result object, so `onResult`, `onWin`/`onFail` and `Encounters.finish` all read it. A bust under $10 and a win at the target both stand. |
| S3 HUD label gross | Done | `verbs/purse.js`: `STACK $${max(0, own)}`, same figure as bar and lines. `casino_r3_hud_debt.jpg` reads STACK $126 / GOAL $146 / OWES $10. |
| S4 lost last hand invisible | Partly (it is item e) | `ledger.across` -> `P.across` in `destroy()` -> `ledgerLines` last row. Shown in `casino_r3_ending_ledger.jpg`; the six rows clear the foot and the [E] hint. |
| N2 gold line stays | Done | `infoLine`: `beaten` only on the reveal of the winning pot; STAND UP stays `hot`. |
| N3 free bet $20 | Done | `faro.js` `actions()` darkens `bet20` while `houseMoney`. |
| N4 stale lines after a lost night | Done | `dream.js` `lostNight` calls `rebase(p)`. |
| N1, N5, split counts as a win | Untouched, still NICE | not worth reopening |
| S5 tells are lookup | Skipped by design | still NICE. |

## Rulings on the open items

### (a) Tilt creep can pull the cursor off STAND UP at the last table: NICE, leave it

`showdown.js` `update()`, tilt branch: from STAND UP it scans to the nearest enabled RAISE/BLUFF, so after 1.8 s the cursor jumps to RAISE with a red flash. That is true for every table, not only the last. I would not change it:
- This is the mechanic the dream is about. A tilted Jo reaching for the big bet is the thesis, and the pull is now felt on the way (the cursor starts on CALL each hand and walks to RAISE) and is gated by `creepT` resetting on every `move()`. A player who decides, presses Left, and presses E gets 1.8 s; that is not a trap, it is a clock.
- A first-timer is only tilted at the last table by arriving tilted: `play()` in final mode never calls `tiltBy`, and `lostNight` zeroes it. They also have the vignette, the TILT pulse, Lou's "steaming" line and "(you can't hear him)" before it matters.
- Fix if you ever want it: skip the creep branch when `menu()[s.cursor].id === 'stand'` (reset `creepT`). Add a test beside "the habit never takes STAND UP". Cost: the tilted player gets a safe key, which weakens the point.

### (b) Faro with under $40 stakes a full $40: NICE (cheap), not a player issue

Verified: `faroEnc.params` is always `bank: 40`, `onResult` does `p.stack += bank - 40` unguarded, so a stack of $20 that loses the bank goes to -$20 until `faroBust` sees `< 40` and `bust()` resets it. Reaching it takes repeated STAND UP/Backspace at partial banks (the saloon prompt has `unless: faro_done` only); a bust (stack $>= 40 left) keeps the purse, and a bust that would leave under $40 already resets. Worst case the HUD shows $0 (it clamps) and the reset hands Jo a full $100, which is no more than a normal sitting. A win from a low stack can reach the card room with a small stack (e.g. $20): honest, and the slate rebases on it.
- Fix: `table.js`/`tables.js` `onResult`: `p.stack = Math.max(0, p.stack + (st.bank ?? 40) - 40)`. Or sit with `bank: Math.min(40, p.stack)` and use that baseline in `onResult`.

### (c) STACK $0 beside ALL IN $8: NICE, leave it

`verbs/purse.js` reads net (stack less debt), the table's `ALL IN $n` is gross by necessity: the money in hand is all he can put in. Both are right; OWES MR PELL $10 sits under the stack on the same plate and explains it. It needs a short stack and a debt at once (a comp is $10, so stack $0-10). If wanted: when `own <= 0 && p.stack > 0`, label `STACK $0 (HAND $8)`. Do not make the label gross again (r2 S3).

### (d) Backspace is an unadvertised way out: fine, leave it

Checked the leaks. `Encounters.update` -> `finish({ok:false,left:true})`:
- Money: safe. `sync()` keeps `P.stack` on the engine's stack every render (an ante already in the pot is gone, same as FOLD), and `destroy()` still books the ledger delta. Faro is safe (S2b).
- Credit: `F.t1_won` etc. are set by `sync` when a pot is won, and `table3_open`/`tables_done` derive from those flags in `verbs/purse.js`, so progress is not lost. What is skipped is the `table_won` beat (Lou's line, the gate sting) and the `stood_up`/`lost_night` beats. The last table has `canLeave: false`, so Backspace cannot dodge the finale.
- It is not advertised, so a first-timer will not learn it; a learner who does gets a quieter exit, not a better one. Escape opens pause (not a way out): the report already says so.
- Optional: in `Encounters.update`, give defs a `leave(engine)` that presses `stand` so the credit beat plays. Not needed.

### (e) A lost last hand is free in money, with a number on the ledger: one SHOULD, but only for players under the buy-in

- At or above the buy-in: **acceptable as it is.** Standing up keeps the profit; RAISE and lose gives it up (floor is `buyin`, gross; debt still comes off at the landing) and costs the walk back plus `The Judge took $N across the table` on the ledger. It is a +EV gamble at the buy-in floor, but the profit, the walk and the printed number are the price, and win just deals another. That meets the thesis.
- **Below the buy-in it inverts.** `dream.js` `lostNight`: `p.stack = Math.max(p.stack, p.buyin)` lifts a $75 stack to $100. CALL $20 or RAISE all at $75 and lose: Jo goes home with more than if he had stood up, and the ledger says he lost it. The cheapest exploit in the dream, and it only needs a stack between the stop and $100.
  - **S1 (SHOULD): floor at what he sat down with, not the buy-in.** `p.stack = Math.max(p.stack, Math.min(p.buyin, enteredWith))`, where `enteredWith` is the `stack` at table start (the lasthand `params` already pass `p.stack`; stash it as `p.lastIn` in `tables.js` params or the presenter's `led0`-style snapshot). Update the caption line "The profit went across the table" to say "the Judge took it" when there was no profit.
  - It does not hurt a first-timer (it gifts them), so this is not a blocker.

## MUST
None.

## SHOULD
- **S1.** Below-buy-in players are paid for losing the last hand. `dream.js` `lostNight` (see e). One line: floor the stack at `min(buyin, stack on sitting)`, not at `buyin`.

## NICE
- **N1.** (b) clamp `p.stack` at 0 in `faroEnc.onResult` (`encounters/tables.js`).
- **N2.** (a) optional: no tilt creep off STAND UP (`showdown.js` `update()` tilt branch); I would keep it.
- **N3.** (c) optional label `STACK $0 (HAND $8)` when net <= 0 and stack > 0.
- **N4.** (d) optional `leave` hook so Backspace after a win plays the `table_won` beat.
- **N5.** Still open from r2: first-win line drops the rake sentence; a split pot reads as "TABLE BEATEN"; tells are lookup, not read (S5).

## Converged?
**Yes.** Every r2 MUST/SHOULD is verified in code, the r3 changes introduce no new hole I could find (the faro leave path, the `atBank` clearing in `outro`, the net label and the ledger row all read correctly), and the builder's five open items are either deliberate design (a, d), honest-and-explained (c), self-correcting (b) or fine at the buy-in (e). I would ship it, and take S1 only if a free line is available. Not played; feel is inferred.
