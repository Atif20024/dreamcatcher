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
