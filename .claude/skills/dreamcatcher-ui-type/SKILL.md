---
name: dreamcatcher-ui-type
description: The typography, text rendering, and UI-panel rules for the Dreamcatcher game (Phaser 3, plain JS, string-art authored fonts compiled to PNG atlases). Use this skill whenever you write or touch ANY on-screen text or UI in Dreamcatcher — HUD, dialogue boxes, puzzle-box screens, title cards, departure boards, signs, menus, tooltips, tutorial cards, end-of-dream text — or add/modify a font, glyph, text color, panel, icon, or text animation. Also use it when someone says "the text looks off", "make the UI feel like the game", "add a sign", or asks for a new screen. Never use Phaser's default text or web fonts in this project; this skill defines the bitmap fonts that replace them.
---

# Dreamcatcher UI & Type

Every letter in Dreamcatcher is drawn from string-art grids like every sprite, so text belongs to the world instead of floating on it. This skill defines the three fonts, how they are rendered, the color tokens, and how every UI surface is built. Read `references/glyphs-small.md` when you need the actual glyph grids for the small font; read `references/ui-surfaces.md` when building a specific screen (HUD, dialogue, puzzle-box, board, sign).

## The one rule
**No `this.add.text`, no web fonts, no anti-aliasing, no fractional positions.** All text goes through `src/ui/BitmapText.js`, which composes glyphs from string-art and snaps to the pixel grid. If a Phaser `Text` object appears in a diff, that diff is wrong.

## Three fonts (and only three)

| Font | Grid | Cap height | Use | Feel |
|---|---|---|---|---|
| `small` | 5×7 px, 1 px gap | 7 | HUD labels, tooltips, board rows, button labels, sign text, numbers | clean mono, like a train ticket |
| `body` | 7×9 px, 1 px gap, 2 px descender | 9 | dialogue, tutorial cards, puzzle instructions, end-of-dream lines | rounded, warm, readable at speed |
| `display` | 12×16 px, 2 px stroke + 1 px inlay, 2 px gap | 16 | level titles, section names, "REFIRE", "CAUGHT", menu headers | **Deco jazz-poster**: tapered diagonals, flat feet, brass inlay line, slab shadow — never plain |
| `logo` | bespoke wordmark, not a font | — | the word DREAMCATCHER only | hand-drawn string-art artwork |

Rendered at **2× scale** on the 960×540 canvas (small → 10×14 on screen, body → 14×18, display → 24×32). Nothing is ever rendered at 1× or 3×. Character set is ASCII uppercase, lowercase (body only), digits, `.,:;!?'"-–—()/&+%♥★→←↑↓` and a 3-frame ellipsis glyph. `small` and `display` are **uppercase only**; if lowercase is passed, upcase it.

Each font is a JS module of string grids (`src/ui/fonts/small.js`, `body.js`, `display.js`) in the same format `pixelart.js` uses: `'#'` = ink, `'.'` = empty, `'o'` = optional shading pixel (used only by `display` for the slab shadow). `references/glyphs-small.md` contains the complete `small` set and the rules for `body`; `references/glyphs-display.md` contains sample Deco glyphs that define the `display` style — extend them, do not scale `small` up.

## Fancy where it counts: display, logo, and card ornaments
In-game text (`small`, `body`) stays plain and quick to read. Everything that *names* something is decorated:

- **`display` glyphs** are Art-Deco brass lettering: 2-px stroke, a 1-px lighter inlay line inside the top/left of every stroke, tapered diagonals, flat feet, pointed apexes on `A M N V W`, high waist on `E F R P B`, geometric `O C G Q` (true circles), and low crossbars on `A`. Rendered in `accent` with `brass-light` inlay and a 2-px `brass-dark` slab shadow; never with a drop shadow only.
- **The logo** is one piece of string-art artwork (`src/ui/logo.js`, ~200×48 at 1×): DREAMCATCHER in the display style with the `A`s replaced by a stylised dreamcatcher hoop (circle with a 3-line web, two hanging feathers), the `C` extended under `ATCHER` as a swoosh, and a 1-px `calm` glow halo. It animates once on the title screen: letters light up left to right like a marquee (60 ms each), then the feathers sway ±1 px forever. Use it on the title screen, the pause screen top, and the finale card — nowhere else.
- **Title / level cards** are framed: a horizontal rule of `—◆—` in `brass-dark` above and below, corner flourishes (4 tiny 7×7 string-art scrolls), the dream number in `small` letter-spaced +3 between the rules, and a 40-px-wide `brass-light` underline that draws in left→right over 300 ms. Section names use the same card without corners.
- **Dream names on departure boards and platform posts** are `small` (they are signage), but the **level card** that introduces a dream uses `display` plus one dream-specific ornament (chef: crossed ladle and whisk; musician: a treble clef; hub: the station clock), a 16×16 string-art icon left of the name.
- **REFIRE / CAUGHT / CHECKPOINT** stingers use `display` in `danger` (or `accent` for checkpoint) sliding in from the right with a 2-frame motion blur (two ghost copies at 30%/60% alpha).
- Never: gradients on text, more than two colors per word, decorated `body` text, or ornaments inside the HUD.

## Rendering rules
- **Line height:** small 10 px, body 13 px, display 22 px (pre-scale). **Letter spacing:** 1 px, 1 px, 2 px. **Word space:** 3, 4, 6 px.
- **Kerning pairs** are a short table per font (`AV, AT, LT, TA, TY, WA, Yo, ".,` etc. tighten by 1 px). Do not implement general kerning.
- Every text has a **1 px drop shadow** at (+1, +1) in `ink-shadow` unless it sits on a panel that already provides contrast (dialogue box, puzzle-box). `display` also gets a **2 px slab shadow** at (+2, +2) in `brass-dark` and a 1 px highlight on the top edge of each stroke in `brass-light`.
- **Max line width:** body text wraps at 44 characters; small at 60; display never wraps (shrink to small caps instead). Wrap on spaces only; never hyphenate.
- **Alignment:** left for dialogue and lists, center for titles and cards, right for numbers in HUD/boards. Numbers in tables are tabular (all digit glyphs are the same width — they are, by construction).
- Text never rotates and never scales other than the fixed 2×. If a design wants "big", it means `display`.
- **Typewriter:** 40 characters/second, one soft `tick` synth per 2 characters, pitch varies ±5% per speaker (each NPC has a `voicePitch`). Punctuation pauses: `,` 80 ms, `.?!` 220 ms, `…` 500 ms. Any key skips to end-of-page, second press advances.
- **Emphasis** inside strings: `*word*` renders in `accent` color; `_word_` renders shaky (±1 px per frame); `~word~` renders wavy (sine, 2 px amplitude). Speakers use these sparingly — at most one per page.

## Color tokens (`src/ui/theme.js`, single source of truth)
```
ink        #F2E9D8   primary text on dark
ink-dim    #9C8F7A   secondary, disabled, CAUGHT rows
ink-shadow #0E0B14   drop shadows
accent     #E9B84A   emphasis, objectives, brass edges
danger     #D5443C   REFIRE, hazards, "caught" — the same red as the X palette letter
calm       #7FB7C9   cold/quiet states, gate light
brass-light #F6D98A  slab highlight
brass-dark  #6B4A1F  slab shadow
panel      #1B1725 @ 92%   dialogue / panel fill
panel-edge #4A3F5C   1 px panel border
```
Levels may **swap `accent` and `calm`** per dream via `theme.forDream(id)` (chef: copper `#D8863B`; musician: gold `#E9B84A`; freezer sections: `calm`). Nothing else changes per level. When the world darkens (dreamsCaught), UI does **not** darken — text stays fully legible at every stage.

## Panels (all UI boxes)
Panels are 9-slice string-art at 2×: corners 6×6, edges 6 px, with a 1 px `panel-edge` border and a 2 px inner bevel (light top-left, dark bottom-right). Radius is faked with a 2-px chamfered corner. Panels animate **in** by growing from the anchor point over 120 ms (scale 0.9→1, alpha 0→1) and **out** in 80 ms. No panel is ever a plain rectangle fill.

- **Dialogue box:** bottom of screen, 880×120, 40 px margin; portrait 96×96 at left (string-art, 2×), name tag in `small`/`accent` above the portrait, text in `body`, page indicator `▼` blinking at 2 Hz bottom-right, choices as `small` rows with a `→` cursor.
- **Puzzle-box:** centered 800×440 panel over a 60% `ink-shadow` dim; title in `display`, instruction line in `body`, a `[ESC] close` in `small`/`ink-dim` at bottom-right. Puzzle pieces inside use the same tokens; success flashes the border `accent` twice.
- **Tutorial card:** 420×140 centered, `display` name (e.g. `HANG DROP`), `body` 3-word hint, key icon glyph, closes on that key.
- **HUD:** hearts (string-art `♥`, 2×) top-left; objective slot top-right = `small`/`accent` icon + text, max 24 chars; meters are 2 px tall bars with 1 px `panel-edge` frame; `[Esc] pause` in `small`/`ink-dim`.
- **Title / level card:** `display` centered, letter-spaced +2 px, fades in over a 40% dim, holds 2 s, shrinks to the HUD level-name slot.
- **Boards & signs in the world** (departure board, chalk menu, neon, stencil): world text uses `small` glyphs but **recolored and textured** by the sign type: chalk = `ink` at 80% with 1-px random gaps; neon = `accent` glyph + 2-px glow circle; stencil = `small` with the bridges left in; split-flap = `small` white on `ink-shadow` cells with a 4-frame flip. World text is a sprite, not UI — it scrolls and tints with the world.

## Icons
One 9×9 icon set (`src/ui/icons.js`), string-art, used everywhere: `key, lock, ribbon, plate, lever, valve, pull, panel, hand, sword-crossed (shove), eye, note, rest, heart, shard, coin, clock, up, down, esc`. Icons are never drawn ad hoc; add to the set if missing.

## Checklist before committing any UI change
1. Zero Phaser `Text` objects; everything through `BitmapText`.
2. Every x/y an integer at 1× before the 2× scale.
3. Correct font for the role (small = labels, body = sentences, display = names).
4. Shadow present (or on a panel).
5. Colors are tokens from `theme.js`, no hex literals in scene code.
6. Wraps at the limit; nothing clipped; nothing overlaps hearts or the objective slot.
7. Typewriter + tick + punctuation pauses on any dialogue.
8. New glyphs added to the font module, not drawn inline.
