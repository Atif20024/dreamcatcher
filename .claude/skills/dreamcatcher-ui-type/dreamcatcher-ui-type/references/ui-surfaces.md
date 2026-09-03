# UI surfaces — exact specs (1× coordinates; render at 2×)

## BitmapText API (`src/ui/BitmapText.js`)
```js
const t = new BitmapText(scene, {
  font: 'body',            // 'small' | 'body' | 'display'
  text: 'Come back *Tuesday*.',
  x: 20, y: 240,           // integers, 1× units
  align: 'left',           // 'left' | 'center' | 'right'
  color: 'ink',            // theme token
  shadow: true,
  maxWidth: 44,            // characters
  typewriter: { cps: 40, voicePitch: 0.95 },
});
t.on('page-end'); t.skip(); t.next(); t.setText('...');
```
Internally: glyphs come from the `font-<name>` atlas built by `scripts/build-atlas.js` (Part D §D11); build each page once into a `RenderTexture` (cache by `font+text+color`), then blit; the typewriter reveals by masking width, not by re-rendering.

## Dialogue box
- Panel 440×60 at (20, 200). Portrait 48×48 at (26, 206). Name tag `small`/`accent` at (80, 208). Text `body` at (80, 220), maxWidth 44, 2 lines per page.
- Page arrow `▼` at (448, 252), blink 2 Hz. Choices: up to 3 rows `small` at (80, 220+i*12), cursor `→` in `accent`; Up/Down + confirm.
- Speaker voice: `voicePitch` per NPC in `src/data/npcs.js`.

## Puzzle-box
- Dim: full-screen `ink-shadow` 60%. Panel 400×220 at (40, 50).
- Title `display` centered at y 58. Instruction `body` centered at y 84, 1 line. Content area (48, 100)–(432, 240). Footer `small`/`ink-dim` `[ESC] close  [R] retry` at (432, 256) right-aligned.
- Success: border flashes `accent` 2×, `stinger_solved`, panel out 80 ms. Fail: content shakes 4 px 120 ms, `buzz`.

## Tutorial card
- Panel 210×70 centered. Name `display` y+8. Hint `body` y+34. Key icon 9×9 at right of hint. Closes on that key. World frozen (`physics.world.pause`).

## HUD
- Hearts: `♥` glyphs 12 px apart from (12, 12); empty heart = `ink-dim`. Heart shards: tiny `★` under hearts.
- Level name: `small`/`ink-dim` at (12, 36).
- Objective: right-aligned to (468, 12): icon + `small`/`accent`, ≤24 chars; updates with a 1-frame flash.
- Meters (breath/nerve/cold/service clock): 60×4 bar at (12, 30) with 1 px `panel-edge` frame; fill color by meter (`calm` breath, `danger` nerve, `calm` cold, `accent` service).
- `[Esc] pause` `small`/`ink-dim` at (468, 250) right-aligned.

## Title / section cards
- `display`, centered, letter-spacing +2, over 40% dim. 2 s hold; then tween to (12, 36) shrinking into the level-name slot (crossfade to `small` at the end).
- Dream number line above the title in `small`/`ink-dim`: `DREAM 03`.

## End-of-dream text cards
- Black screen; `body` centered, `ink`, fade 400 ms in / 2 s hold / 400 ms out per card. The final Small-Moment line uses `accent`.

## World signs (sprites, scroll with the world)
| Type | Base | Treatment |
|---|---|---|
| chalk | small | `ink` 80%, 1-px random gaps seeded by position, slight y jitter per glyph |
| neon | small | `accent` ink + 2-px glow ellipse; 8-frame flicker; "dead" = `ink-dim`, no glow |
| stencil | small | keep glyph bridges (`o` pixels), `ink-shadow` on `accent` plate |
| split-flap | small | white on `ink-shadow` cell 7×11, 4-frame flip (top half rotates), `clack` per cell |
| brass plate | display | `brass-dark` slab on `accent` plate, 1-px `brass-light` rim |
| paper / poster | body | `ink-shadow` on `ink` 70%, torn-edge string-art frame |
| ticket | small | `ink-shadow` on `#EADFC8`, perforated edge |

## Menus (pause, options)
- Full dim 70%. Vertical `body` rows, 16 px apart, centered; selected row in `accent` with `→`. Section headings in `small`/`ink-dim`.
- Options rows show value at right (tabular). Input-latency calibration screen: 8 taps to a click, shows offset in ms in `small`.
