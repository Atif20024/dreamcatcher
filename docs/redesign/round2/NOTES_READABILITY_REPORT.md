# Notes readability and ladder follow-ups

Owner's feedback: "texts still unreadable in notes."

## Task A: the notes

### What was wrong

**In fullscreen the page did not show at all.** This is the main finding. The
page canvas was appended to `<body>`, but Phaser moves the game canvas into its
own fullscreen `<div>`, and only that element's contents are drawn in
fullscreen. Pressing [F], or a phone's first tap, opened a note as a dim with
nothing on it. I reproduced this in headless Chrome. It is the most likely cause
of the complaint, but it is an inference: I don't know how the owner plays, and
windowed text was already crisp and large.

Smaller faults, all fixed:

- The page ran off the screen on a 667 × 375 phone at dpr 1, by 27 px on each
  side and 21 px at the top.
- The leading was tight: a 14 px pitch for a cap of 9, leaving 3 px between one
  line's descenders and the next line's ascenders.
- A last page could hold a single line.
- Placement was rounded to CSS px, which is off the device pixel grid at
  fractional ratios such as 1.25.
- `READING.minContrast` was never defined, so every document's own ink was
  thrown away (and the scenario's contrast check could never fail).
- The hints said [E] and [Esc] on touch screens.
- The lowercase `r` had a hook that dropped and read like an `n` ("morning").
  This glyph is in the body face, so the change applies game-wide.

The glyph size, letter spacing, contrast and sharpness were already fine in a
window, so they stay. It is still the game's own pixel font.

### Before and after

Cap height is in CSS px. The page is always painted at a whole-number scale.

| Window | Cap before | Cap after | Page fits, before → after |
|---|---|---|---|
| 1280 × 720 | 27 | 27 | yes → yes |
| 1440 × 900 | 27 | 27 | yes → yes |
| 1920 × 1080 @2 | 36 | 36 | yes → yes |
| 1536 × 864 @1.25 | not measured | 28.8 | not measured → yes |
| 960 × 540 | 18 | 18 | yes → yes |
| Phone 667 × 375 @1 | 18 | 18 (42-character lines) | **no** → yes |
| Phone 667 × 375 @2 | 13.5 | 13.5 | yes → yes |
| Phone 667 × 375 @3 | 12 (computed) | 15 | yes (computed) → yes |
| Fullscreen (headless, 800 × 450 box) | **not visible** | 18 | n/a → yes |

| Measure | Before | After |
|---|---|---|
| Line pitch | 14 font px | 16 font px (cap × 1.78) |
| Gap, descender to next line | 3 font px | 5 font px |
| Longest line, Page three | about 59 characters | 58 (45 on the small phone) |
| Ink on paper | night ink forced (14.76:1) | document's own ink, 9.28 to 14.76:1 |
| Dim behind the page | 0.7 | 0.8 |

The target was a cap of at least 14 CSS px on desktop and 11 on phones, and every
size meets it. The size itself did not change on desktop.

### Code

- `src/ui/readingLayout.js`: `layoutFor` picks the scale and line length per
  screen. A small phone narrows the line before it shrinks the type. Also new:
  `placeOnDevice`, balanced `paginate`, `footerText`, `minContrast`.
- `src/ui/ReadingPanel.js`: the canvas sits beside the game's canvas, and it
  re-lays out on resize and on fullscreen changes, keeping the reader's place.
- The page count now depends on the screen. Page three is 1 page on desktop, 2
  on a phone @3 and 3 on a phone @1.

Notes covered, all through `readDocument`: the paper, Priya's notebook, Page
three, Lou's note, the Painter's contract and letters, and the Evening's list.

## Task B: ladders (`ladder_review_r1.md`)

- **SHOULD 1, Writer col 210.** The review's prediction held up in the grid: one clear
  row over the top shelf. The stacks' roof went up two rows, so Jo now stands
  there, and the ladder joined `writer-ladders-both-ways` (now 9 ladders; col 141
  stays out). The Player also checks headroom before stepping out (`headroomClear`)
  and otherwise stays on the top rung. `lint:rooms` has a new ladder-head rule
  (`scripts/lib/ladder-heads.js`): under 2 clear rows fails, under 3 warns.
  It warns once, for legacy Painter studio col 26 (2 rows, reachable only as
  `painter_legacy`).
- **SHOULD 2, reach and Player agree.** `reachGrid` takes `lids`, off by default,
  and the station passes its `ladderLids`. A vitest requires every `reachGrid`
  call in `src` to pass it.
- **SHOULD 3, coverage.** `tests/ladders.test.js` covers `overLadder`,
  `openLadderTop`, `headroomClear` and `freshDown`. `npm run scenarios` now lists
  the ladder scenarios as the pre-merge set.
- **NICE 4, hatch prompt.** A `[↓] down` shows over Jo's head on a cap, plank or
  lid. It waits while the station grate's own prompt is showing.
- **NICE 5, accidental drops.** A hatch grabs only on a DOWN pressed there or up to
  200 ms before arriving. Crossing with DOWN held walks on.

NICE 6 and 7 were not in this job's scope.

**A bug of mine, caught and fixed.** `this.ladderLids` was set after
`buildSafetyNet()`. Phaser reuses scene objects, so only the first station visit
after a page load saw it undefined, and the net pulled Jo out of the undercroft.
Repeating the scenario from a fresh load exposed it. The flag is now set first,
with a vitest guarding the order.

## Verification

| Check | Result |
|---|---|
| `vitest` | 297 of 297 passed, every run since the one noted below |
| `lint:rooms` | 0 failures, 38 warnings |
| `lint:content` | 0 failures |
| `lint:scale` | clean |
| `vite build` | built |
| `reading-panel` | pass |
| `hub-ladder-undercroft`, `hub-ladder-roof` | pass, from a clean save |
| `writer-ladders-both-ways` | pass, 9 ladders |
| `dream-ladders-both-ways` | **fails on the first run after a clean save**, see below |

Screenshots were checked by eye at each size, plus the fullscreen page, the roof
prompt and the Writer's top shelf.

## Open items

- **`dream-ladders-both-ways` fails on its first run after a clean save.** Painter
  chapel, col 96 rows 89-92: `up FAIL, down FAIL`, Jo left climbing at
  (3088, 2819). Later runs pass. It fails the same way with `redesign`'s
  `Player.js` restored, so my Player changes did not cause it. That comparison
  kept my other files in place. The ladder works when tested alone on a clean save
  (up and down), so it needs the scenario's sequence. The cause is not known.
- **One unexplained vitest failure.** A single run reported 1 file failed and 23
  tests skipped, while the scenarios were running in the same browser session. I
  did not capture which file. Every run since has passed.
- **The Player's "stay on the top rung" branch has not run in the game.** After
  the roof fix no ladder head triggers it; only its `headroomClear` helper is
  tested.
- **Fullscreen was tested at headless Chrome's 800 × 600 screen, on desktop
  emulation.** Nothing here ran on a real phone or in Safari.
