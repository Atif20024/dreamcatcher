# DREAMCATCHER — PART D §D11: ASSET PIPELINE (PNG allowed)

Adds to Part D. PNGs are now permitted, but **only as build outputs or imported atlases** — never as the thing a human or the project edits by hand. Text stays the source of truth because it is diffable, reviewable, and the project can write it; PNGs are what the game loads because runtime string-art parsing does not scale to 20×40 characters with 30 animations each.

## D11.1 Two kinds of asset, one loader
| Kind | Source | Build output | Used for |
|---|---|---|---|
| **Authored** | string-art grids in `src/art/**/*.js` (rigs, tiles, icons, fonts, props) | `public/atlas/<pack>.png` + `<pack>.json` (Phaser atlas format) | everything the project draws itself |
| **Imported** | PNG spritesheets from outside (AI-generated, purchased packs, hand-drawn elsewhere) dropped in `art-src/imported/<pack>/` with a `manifest.json` (frame size, animation names, origin) | same atlas format | backgrounds, landmarks, large set-piece art, characters if a better sheet exists |
The runtime only ever sees atlases: `this.load.atlas('jo', 'atlas/jo.png', 'atlas/jo.json')`. `pixelart.js` stays for placeholders and dev previews only.

## D11.2 Build step (`scripts/build-atlas.js`, runs on `npm run dev` and `npm run build`)
1. Import every `src/art/**/*.js`; compose rigs into frames (`Rig.compose`), autotile variants, font glyphs, icons.
2. Rasterize each grid to RGBA with the level palette (`src/data/palettes.js`) at **1×** (the atlas is authored-resolution; the game renders at 2× with `pixelArt: true`, `antialias: false`).
3. Pack per pack (`jo`, `foes-chef`, `npcs-hub`, `tiles-chef`, `ui`, `font-small`, …) with a simple shelf packer, 1-px padding, power-of-two sheets, and write the Phaser atlas JSON with `anchor` (origin) per frame and `animations: { walk: [frameNames], … }`.
4. Normalize imported packs to the same JSON (from their manifest), re-quantize to the level palette if `manifest.palette: "level"`.
5. Write `sheets/<pack>-<anim>.png` review strips (the same ones the motion skill requires you to look at).
6. Watch mode: a change to any `.js` art file rebuilds only that pack and hot-reloads the texture.

## D11.3 Rules
- `git` tracks `src/art/**`, `art-src/imported/**`, `sheets/**`; `public/atlas/**` is generated (gitignored) — CI rebuilds it.
- One palette per level in `palettes.js`; the darkness tint stays an overlay, so atlases are built once, not per darkness step.
- Imported art must pass the same reviews as authored art: proportions (2.5 tiles for humans), 3-tone shading, selective outline, `J`/`X` color rules (the manifest declares which colors are "friendly blue" / "hazard red" so the lint can check them), 0.4 s telegraph frames present.
- No asset is ever loaded from a URL; everything ships in `public/atlas/`.
- Backgrounds and landmarks may be large imported PNGs (up to 1920×1080), sliced into parallax layers by the manifest.

## D11.4 Migration order
1. Write `build-atlas.js` + `Rig.compose`; point `Player` at the `jo` atlas while `pixelart.js` still feeds everything else.
2. Move fonts and UI to the `ui` and `font-*` atlases (the ui-type skill's BitmapText blits from the atlas).
3. Move tiles per level (autotile variants become atlas frames).
4. Move foes/NPCs; delete runtime string-art parsing from the hot path.
