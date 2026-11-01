# THE LAST HAND: polish, and context buttons for touch

This follows `GAMBLER_REPORT.md` and `TOUCH_REPORT.md`. Four fixes, in the order they were asked for.

## 1. The faro bank no longer sends Jo to the quay half the time

**Why it was harsh.** Jo must take $40 to $80 with a real house edge: splits, plus a rake rounded up, which is $1 on every $10 win. Under those odds the bank busts most players whatever they do. A seeded simulation of the old engine gave:

| Old strategy | Busts |
|---|---|
| Flat $20 | 66% |
| Flat $10 | 78% |

Changing the beginner's schedule alone could not get this under 15% without silly odds.

**The change.** There are two parts. Both keep the spec's idea that faro is "the sharp's truth-teller": the edge is real, and the bank lets beginners win early.

- **The hook (`STEADY` in `src/engines/faro.js`).** While Jo bets the small stake, the box is kind for the first 30 bets: 70% wins. That is how a house treats a careful newcomer it wants back tomorrow. A $20 bet always plays the true odds: 55% for two bets, then 47%. Splits and the rake still apply to every bet.
  - Lou's third saloon line now teaches this: "Ten at a time and the box is kind to you a while. They want a careful man back tomorrow. The twenty plays the true odds."
- **A bust lands Jo at the saloon door, not the quay** (the `faroBust` call in `dream.js`; the beat is `faro_bust`).
  - Lou keeps whatever is left of the stack, usually $60. Only if that cannot cover another $40 is his bar reset to the buy-in.
  - Either way the bust is counted in the ledger.
  - The split-flap board reads THE BANK TAKES IT, and Lou says: "Ten at a time. Let the box be kind to you. Sit down again when you like."
  - A bust at the card tables still goes to the quay, as the spec says.

**Seeded results** (`tests/faroBalance.test.js`, 3000 seeds each):

| Play | Busts |
|---|---|
| Flat $10 (sensible) | about 12% (the test requires under 15%) |
| Flat $10 with the house comp on the first bet | under 15% |
| Flat $20 | about 64% (the test requires over 45%) |

- A careful run averages about 13 bets.
- The rake and splits are still paid on every sitting, and the test checks that.

## 2. The purser's office: the sign, and the clipped prompt

- **The sign.** The large "MARKERS ON YOUR WORD. SETTLED AT THE LANDING" board is gone. In its place is a small "MARKERS" plaque beside the cage (`rooms/office.js`). Mr Pell now says the rest himself: "A marker: fifty dollars on your word, settled at the landing."
- **The prompt.** In-world prompts are now kept on screen in the shared code (`HudGrid.updatePrompt`), so every framework dream benefits. The prompt and its plate stay at least 12 px inside each edge, top and bottom included. "[E] BACK TO THE CARD ROOM" now sits fully on screen at the left edge.
- **Not covered:** the legacy scenes (Astronaut, Chef, Writer and the rest) draw their own world-space prompt texts and are not clamped.

## 3. One HUD block in the top right

Before, there were four separate plates stacked under the coins: LOU/STOP-GOAL, STACK, TILT and the tool line. Now one plate holds three rows:

```
STACK $100 [bar with the red stop post and the gold goal post]
 STOP $60 · GOAL $140
TILT [bar]
```

- **How it works.** `hud.meter()` has two new options:
  - `group`: rows in the same group share one plate, as wide as the widest row, with no gap between them;
  - `bar: false`: a row of words only.
- **The slate line.** It is a word-only row and no longer a tool line. It shows only after the slate is chalked, and turns red under the stop-loss.
- **Readability.** Meter labels now declare the plate as their backing, so no second brass-edged mini-plate is drawn around them. The readability audit treats rows of one group as a single plate. `__dc.readability()` is clean in the card room and the office.
- The coins line is a framework slot and stays above the block.
- No other dream uses `group`, so their meters look as before. `hud-scale-zoom` passes.

## 4. Touch: context buttons, a smaller d-pad, the device keyboard

**Context buttons** (`layoutContext`, `keysFromHint` and `keyOf` in `src/input/touchLayout.js`; drawn in `TouchControls`). A key that the pad and the four buttons lack gets a small brass button above the right-thumb cluster, and only while the scene in front actually uses it. There are at most six, in rows of three. Covered keys include F, C, V, digits, R, L, Y, N, Tab, Enter and Backspace. The button list comes from:

- **The top modal's `touchKeys`** (new on ModalManager specs). Every puzzle panel (`systems/puzzles.js` `Modal`) reads its keys from its own instructions:
  - "[1–4] answer" gives 1 2 3 4;
  - "[Enter] spin" gives OK;
  - "[H] hit · [S] stand · [D] double" gives H S D.

  This covers all the legacy puzzles, including Enter, which the X button never sent.
- **A scene's `touchKeys()`:**

  | Scene | Buttons |
  |---|---|
  | Astronaut | F only while it does something: a hook in reach, clipped on, the tank hatch, the coolant valve, the rescue or the winch |
  | Painter (legacy) | 1–3 and V once there is a palette; F while Paul walks with Jo |
  | Evening | C once Jo has the camera; A, L and R on the map; Y and N when asked to confirm |
  | Writer | ABC while the typing rhythm runs |

- **The framework dreams** (clockmaker, musician, painter, gambler) only use E and Q, so they show no context buttons.
- A finger on a button that disappears lets go of its key.
- **Tab (the visor) has no button** on purpose: it is an optional view and would be a permanent button.

**Smaller d-pad.** Under 420 CSS px of height (any phone in landscape), the pad is a size smaller: 0.82 of the button size, but never under 44 CSS px an arm. The buttons stay 52–64 CSS px.

**Shift (walk).** Skipped. The hub and Evening walk by default, and nothing needs a slow walk on a phone.

**Writer typing.** The ABC button opens the device keyboard (`src/input/softKeyboard.js`):

- A hidden 16 px `<input>` takes focus from the touch handler, which counts as the user gesture iOS requires.
- Each letter typed into it is pressed as a virtual `KeyA`–`KeyZ`, read from the `input` event, because phone keyboards send keyCode 229 or no code at all.
- Real key events from the field are stopped, so a hardware keyboard is not heard twice.
- The keyboard closes when the typing ends.
- **Not tested on a real phone.** On a real iPhone the keyboard will cover the lower half of the screen; the letter strip sits at the top.

**Tests:** `tests/touch.test.js` has 9 new tests, 62 in all:
- hint parsing;
- labels;
- for five viewports: six context buttons on screen, clear of every plate, each hitting itself, and on the right;
- no buttons when none are used;
- the smaller pad.

**Checked by hand** with `?touch=1` at 667×375: in the EVA room an F button appears. Pressing it holds KeyF, and Jo clips to the hook.

## Checks

| Check | Result |
|---|---|
| `npx vitest run` | 255 passed (19 files) |
| `npm run lint:content` | 0 failures |
| `npm run lint:rooms` | 0 failures, 36 warnings (as before) |
| `npm run lint:scale` | clean |
| `npx vite build` | built |
| Scenarios | All pass: `gambler-board`, `places`, `coins`, `quay`, `saloon`, `cards`, `office`, `deck`, `tilt`, `legacy`, `playthrough`; `readability-gambler`, `scale-gambler`, `hud-scale-zoom`, `touch-walk-jump-talk` |

- **`gambler-saloon` and the playthrough.** The first sitting now bets $20 and every later sitting bets $10. The playthrough busted once on the $20 sitting, landed at the saloon door with $60 (`bust-to-saloon-door:ok`), then doubled the bank at $10.
- **`touch-walk-jump-talk` and the narrow pane.** It fails when the browser pane is narrower than it is tall, because the "turn your phone sideways" card pauses the game. That is correct behaviour, not a regression. At a 960×540 viewport it passes.

## Screenshots

In the scratchpad:
- `polish_office.jpg`: the office, the plaque, the clamped prompt and the HUD block.
- `polish_hud.jpg`: the card room HUD block, with TILT showing.
- `polish_touch_context.jpg`: the EVA room on a 667×375 phone. It shows the F context button (lit while held), the smaller pad and the "clipped" note.


# Round 2: the designer and gamer reviews

Sources: `docs/redesign/advice/casino_review_designer_r1.md` (D) and `casino_review_gamer_r1.md` (G). Every MUST and SHOULD is done; the cheap NICE items too. The owner's two calls are built in: the dealer's comp is a real $10 debt, and one lost pair-raise nudges TILT rather than tipping it.

## MUST and SHOULD

| Item | What was done |
|---|---|
| D-M1, G-S6 STAND UP taught at tables 1-3 | The engine marks the first pot won at a table (`last.beaten`), and the STAND UP item becomes `hot` from then on. The presenter draws it gold on a brass plate. The reveal line ends "TABLE BEATEN: STAND UP WHILE IT IS YOURS." and keeps saying it in gold while Jo stays seated. The goal line changes to the new `stand_up` objective at the moment of the win, not when he leaves. The room's own objective comes back once the table closes (`scene._objKey` reset). |
| G-S6 key legend | Every panel ends with a dim row of keys. SHOWDOWN: `[LEFT][RIGHT] choose  [E] play  [BACKSPACE] step away`, or "no walking off this one" at the last table. Faro and the slate have rows too. The panel is now 236 high (it was 212) and starts at y 168, so it grows upward and does not cover the seated people. |
| D-M2 slate rescale | The slate is now chalked as a night at the tables: BUY-IN, STOP-LOSS down $10–50 (default -$30), GOAL up $10–60 (default +$20). `purse.rebase()` places the lines at the card-room door, on what Jo walks in with net of debt. Before that, the lines are not live (`based: false`), so the faro win can never meet the goal by itself. A bust clears `based`, so the lines are placed again when he next walks in. The HUD reads `STOP -$30 · GOAL +$20` before the card room and dollar lines after it. A new test checks that a default slate plus the faro payout leaves the line 'between' with `reachedGoal` false. |
| D-M3, G-S5 TILT shown when it bites | The first time TILTED is crossed (`F.tilt_told`), Lou says: "Kid. Your ears are ringing. Out on the guard, the east end. Walk it ten seconds." On an open deck he says the open-air version instead. The TILT row pulses red as TILTED / TILT for 2.4 s. If Jo leaves a table still tilted, the line plays once more (`F.tilt_told_up`). `lou_tilt` is kept for repeats. |
| G-S5 tilt softened (owner's call) | `big_loss` drops from 0.15 to 0.10, so one lost pair-raise sits at 0.45: a nudge. A new `streak` event (+0.08 for any loss straight after a loss) is chasing, and it tips a player over. Simulated over 2000 seeded nights of three tables, standing up after each pot: a player who always picks the sharp's verb tilts at some point in about 23% of nights. A player who follows Lou's tips tilts in about 39%. The scripted card-room run reached 0.62 at table 3. |
| D-S1, G-S4 Lou's tips | His misses now come from his own seeded coin (`rng(seed*31+7919)`), wrong about one hand in four with no countable phase. The deal is identical with or without him. At table 1 he names the verb. From table 2 (`lou.describe`) he only says what he sees (`LOU_SEES`, for example "Sorrel's little finger is off the glass."). When he is wrong, he reports the same true sight with the wrong meaning (`LOU_MISREADS`, for example "Nico's hands are flat. He's got nothing."). If Jo's own pair decides the hand, Lou says "Look at your own cards, kid. Then look at theirs." The weak tip is fixed too: `bestVerb` now says CALL for a pair against a pair-or-better tell (hum, flat) and RAISE with trips. Not done: weighting Lou's table-3 misses toward expensive hands. |
| D-S3, G-N1 the finale | The objective is now "Judge Voe is dealing at the forward glass". Lou's cracked caption at the last table: "Take it. Just the one. I'd have taken it." The habit: if Jo moves the cursor off CALL, it drifts back to CALL once on its own (`creepMs`), calm or not. The Judge's hum now follows the "tells are true" rule: `PLAYERS.judge.tell(tier(voe))`, so he hums only when his third card pairs him. |
| G-S1 negative stacks | A short stack offers `ALL IN $n`, and everyone matches only that much. RAISE and BLUFF are dark when Jo cannot cover them, with a reason given. With nothing left after the ante, CALL is dark. The stack never goes below 0. |
| G-S2 "CALL $0" and wording | `lostNight` sets the stack back to at least the buy-in and clears TILT. `finalStake` is never more than the stack and is net of debt (`debt` param), and CALL is dark when the stake is $0. The line reads "CALL plays $N" whenever the profit is under $20. |
| G-S3 comps (owner's call) | `purse.compStake` puts the dealer's free stake on Mr Pell's book as a real $10 (`debt`, `compDebt`). The dealer says so, and so does Jo's caption ("The house's money is still money."). The debt is settled at the landing like a marker. The ledger prints "Owed Mr Pell $10, paid $10." The whisky is unchanged: it buys nothing and is kept as the dream's joke. |
| D-S6 debt-aware line | `line()`, the ledger marks (`mark`) and the table frame all read `stack - debt`. The HUD bar fills to the net amount, and the debt has its own row, `OWES MR PELL $N`. That row exists because the old `STACK $x OWES $y` label widened the plate into a two-line goal. Not done: a hatched debt segment on the bar. |
| D-S4, G-N4 shorter way back | A lost last hand now puts Jo at `cp_deck` (the foot of the hurricane deck), not the quay. Lou says: "I always found my way back up. Every time." Busts at the tables still go to the quay. |
| D-S5 two "$" counters | The coin counter in this dream reads `HALF DIMES n` with no wallet dollars (`coin.hud` in `data/dreams.js`, read by `BaseLevel.updateCoinHud`). |
| D-S7 faro grind | The bank target drops from $80 to $70 (`FARO_TARGET`); a careful run is about 10 bets, down from 13. Draw and show are faster (700/1200 ms, down from 900/1500). The bet row says "10 AT A TIME: THE BOX IS KIND." The card row says "Any rank: the box does not care which", and Lou's saloon line says the same. Seeded results: flat $10 busts 9.7%, flat $20 busts 54%. |
| D-S8 floating grey squares | These were the half-dime coins. The square silver spin read as glitches, not as coins. Half dimes now use a round 7×7 spin (`coin.shape: 'round'`) with a dark rim and a white glint. |
| G-S7 touch bands | `optionRects` bands are now 60 UI units tall (20 above the label to 40 below), for both the faro and SHOWDOWN verbs. The plates are unchanged. A tap holds the tilt creep off for 500 ms (`engine.holdCreep`). Tapping a dim verb shows its reason. |
| Legacy | `GamblerScene` passes `ladderPass(this)` to the oneWays collider. |

## NICE done

- **D-N1:** tapping a dim verb shows its `why` in the info line.
- **D-N2:** `lou_quay` is down to five nodes.
- **D-N3:** the deck objective is now "the pilot house, at the end of the texas roof".
- **D-N4:** the goal and stop frames are a full-alpha 3 px stroke with a wash on the ground.
- **G-N2:** Lou adds "Watch the card they show, too."
- **G-N3:** "any rank" is said in the saloon.

**Skipped:** the tell vignette inside the panel (D-S2/G-N5), Crake's early silhouette (D-N5), the deck coin loop (D-N6), fold accounting (G-N6) and the faro "kind box" ledger line (D-S7d).

## Checks

| Check | Result |
|---|---|
| `npx vitest run` | 264 passed (19 files) |
| `npm run lint:content` | 0 failures |
| `npm run lint:rooms` | 0 failures, 36 warnings (as before) |
| `npm run lint:scale` | clean |
| `npx vite build` | built |
| Scenarios on 5181, all pass | `gambler-board`, `places`, `coins`, `legacy`, `quay`, `saloon`, `cards`, `tilt`, `office`, `deck`, `playthrough`; `touch-walk-jump-talk` |
| `__dc.readability()` | clean in the office (with debt) and at a seated card table |

**New and changed unit tests** (`showdown.test.js`, `faroBalance.test.js`):
- the pair-versus-pair-tell verb;
- tilt nudge, then streak;
- Lou's misses are not periodic, replay the same, and leave the deal unchanged;
- describe mode: a true sight, or the same sight misread;
- hot STAND UP;
- ALL IN and no CALL $0;
- the last table's hum is true;
- debt-aware profit, and the habit drift;
- the relative slate with rebase;
- debt-aware lines and comps as debt;
- faro at $70 in about 10 bets.

**New scenario checks:**
- `hud-coins-named`;
- `comp-stake-is-debt`;
- `lines-live`;
- `touch-bands`;
- `t1/t2/t3-beaten-taught` (gold STAND UP plus the TABLE BEATEN goal line);
- `first-tilt-told` (the caption and the pulse);
- `lost-night-to-deck` (stack ≥ buy-in, TILT 0).

**The playthrough ledger:** "Owed Mr Pell $10, paid $10. Home with $100: up $0." That run took the last hand once, lost it, came back up from the deck and stood up.

## Screenshots (scratchpad)

- `casino_r2_cards_table_won.jpg`: table 1 after a pot. STAND UP is gold, the line says TABLE BEATEN, the goal line says the same, and the key row shows.
- `casino_r2_table_won_reveal.jpg`: the reveal of the pot that beat the table.
- `casino_r2_tilt_caption.jpg`: Lou's first-tilt caption in the card room.
- `casino_r2_slate.jpg`: the slate chalked as down / up at the tables.
- `casino_r2_quay.jpg`: the quay with round half dimes and the `HALF DIMES 0` counter.
- `casino_r2_office.jpg`: the office HUD block with the `OWES MR PELL $10` row and net lines.
