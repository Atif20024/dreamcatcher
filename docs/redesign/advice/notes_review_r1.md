# Notes reading panel, review round 1

Reviewers: senior game designer (D) and champion pro gamer (G). Read the report, `ReadingPanel.js`, `readingLayout.js`, the layout tests, the five screenshots, and the note data. We did not run the game: anything about feel, key-repeat and touch is inferred from code.

## Verdict

Converged on the owner's complaint, with two SHOULDs that cost a first-time player little but are cheap. No MUST.

## Is the root cause credible?

D: Yes. A DOM canvas appended to `<body>` while Phaser fullscreens its own parent div is a textbook way to lose an overlay; the dim (a Phaser object) still draws, so the player sees a dark screen with no page. That matches "unreadable" better than any type problem, because the windowed page is already cap 27 px at 1280x720 and 14.76:1. The fix (append beside `game.canvas`, re-lay out on `fullscreenchange`) is right, and the fullscreen screenshot shows a full page at cap 18.

G: Agreed, and it also explains why it was "still" bad after the first fix. Anyone who hits [F] or plays on a phone (first tap goes fullscreen) gets a blank dim.

What else could make notes unreadable for this owner (all inferred):
- Real hardware that was not tested: Safari/iOS fullscreen (no standard Fullscreen API on iPhone Safari, so the game may not be fullscreen at all there, and the box sizes differ), real phones, 1.25 and 1.5 dpr desktops. Report admits this.
- The pixel font itself: lowercase pixel text at 14 to 18 px cap is fine, but the owner rejected the serif and may still dislike the face (see NICE 2).
- The small footer hints (SHOULD 1).
- Notes read in the Evening scene use `freeze: 'none'` with a different paper; fine in code, not visually checked by us.

## Line breaks at half the page width

Not a wrap bug. `NOTEBOOK` in `src/data/astronautData.js` (~line 212) is authored with hard `\n` breaks about 28 characters long ("First stage lights, you are\nalready committed."), and `wrapWords` (`readingLayout.js`) treats each `\n` as a paragraph, so it keeps them. Page three and the letter are single paragraphs and fill the measure (the fullscreen shot shows ~58 chars).

Does it waste pages? Not height: `this.rows` is the tallest page (6 lines here), so the page is 6 rows, not 10, and each notebook page is one authored page of 5 to 7 lines. It wastes width (the right 45% of the page is empty), which makes the page look unfinished and the text look small on a wide panel. Pagination is fine: 5 pages is the content's design.

## MUST

None.

## SHOULD

1. Footer hints are the smallest text on the screen. `ReadingPanel.js` `_paint`: `fs = round(S * 0.75)`, small face, alpha 0.8. In the 960x540 and phone shots the hints look about half the body cap. D: this is the one text a first-time player must read to learn how to leave, and the owner's complaint is readability. G: same; I looked for "how do I close" and had to squint on the phone shot. Fix: draw the footer at `scale: S` for the small face, or at least keep its cap at 9 CSS px or more (`fs = max(round(S*0.75), ceil(9*dpr/smallCap))`), and drop the 0.8 alpha. Check the footer still fits the measure on the narrow phone layout (`footerText` is about 45 chars on page 2+; shorten "[Esc] close" to "[Esc]" on phones if it does not).
2. Held key skips the whole note (inferred, not run). `_key` ignores `e.repeat`: `next()` runs on every keydown and Phaser's keyboard `keydown` fires on OS auto-repeat. A player who opens a note with E and keeps E or Space down past the 250 ms guard (or holds D from walking) flies through all pages and closes it. Fix: at the top of `_key`, `if (e.repeat || (e.originalEvent && e.originalEvent.repeat)) return;`. Optionally raise `guardMs` to 350. Cheap, and a first-time player will hit it.
3. Hard-wrapped notes look half-empty on wide panels. Either (a) remove the authored `\n` inside the 5 `NOTEBOOK` entries and keep one `\n` after the page heading so the measure fills, or (b) in `wrapWords`, add an opt-in `reflow` flag. D prefers (a): it is data only, and the lines then read at 45 to 55 chars like the letter. G: with (a) the pages get shorter, so fewer rows; no harm. Check afterwards that `paginate` does not split a notebook page onto two pages on the small phone (document pages are re-paged per screen, so it could; that is acceptable but the "n / 5" count would change).

## NICE

1. Touch has no early exit: a 5-page notebook needs 5 taps to dismiss, and the back zone (left third) is invisible until page 2. Add a small close mark in the top-right corner of the page (tap x > width*0.9, y < top strip closes) and show "◂ tap left: back" from page 1 as "tap left: back" greyed. `ReadingPanel.js` `tap:` callback.
2. Offer a text-size or "large type" toggle (one extra step in `layoutFor`'s `pref`), since this owner has complained twice. Cheap insurance given the pixel face is a matter of taste.
3. Keyboard: also accept Backspace and PageUp/Up for back, PageDown/Down for next (`_key`), and let the arrow glyphs in the footer match (`footerText`).
4. A subtle page-turn tick or 80 ms fade on `_paint` so a page change is noticed. Respect the mute rule in dev.
5. Title rule alpha 0.5 is grey on cream; fine, no action.

## Checked and fine

- Size: cap 18 to 36 CSS px desktop, 13.5 to 18 phone; above the 14/11 targets and Xbox's 18 px at 1080p floor for PC. Leading 16 font px (1.78 cap) with 5 px descender gap: comfortable in all shots.
- Contrast: ink 9.3 to 14.8:1 on cream; the `READING.minContrast` fix is correct (it was undefined, now 7).
- Line length: 42 to 58 characters is the right range; the long letter lines in the fullscreen shot are at the top of the range but fine.
- Dim 0.8 over a busy hub: the page stands out clearly in every shot.
- Paging: footer "1 / 5", `[E] next`, `[E] done`; tap hint appears when `touchState.on`. Tap handling (left third back, else next, last closes) is clear once learned.
- Keyboard map: E/X/Space/Enter/Right/D next, Left/A back, Esc close: sensible, apart from key repeat above.
- Placement and tests: whole-pixel scale and device-pixel placement are covered by `tests/readingLayout.test.js` for nine screens. Not covered by tests: the DOM host and fullscreen (scenario only, headless).

## Honesty

Not run by us. Feel, key repeat, touch behavior and Safari fullscreen are inferred. Screenshots (1280, 1920@2, 960, phone@2, fullscreen) were viewed; the phone-@1 and @3 cases rely on the report and tests.
