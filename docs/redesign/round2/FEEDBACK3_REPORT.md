# Feedback 3: Jo's light, a quieter mix, restarts, readable notes

The owner's third playtest raised four points. Two more came in while the work was under way: smaller conversation text now that the game fills the screen, and jumping off ladders. Dev stayed silent throughout. One Vite server ran on port 5199, and one browser tab was used.

## 1. Jo: no glow; he carries a light where it is dark
The owner said "why does Jo glow? it feels unnatural". A 1 px outline was tried next (`sheets/feedback3-jo-outline-rejected.jpg`). The owner said it "looks worse", then chose: "carried lantern … each level it should be different. Places where the light is sufficient, we don't need a lantern there."

What changed:
- **Jo is drawn plain.** The WP6 rim, ink line and light pool are gone. The `halo` entries in `PLACES` became `outline`/`line`, but `JO_ANCHOR` in `src/entities/Player.js` keeps the outline and rim switched off.
- **Each dream has its own light** (`src/data/joLights.js`, drawn and lit by `src/entities/JoLight.js`):

  | Dream | Light |
  |---|---|
  | Station | conductor's oil lantern |
  | Chef | candle in an enamel saucer (kerb, dock, cold store and roof only) |
  | Musician | petrol lighter (not in the cellar or on stage) |
  | Astronaut | wrist torch (a beam) |
  | Writer | bare bulb on its flex |
  | Painter | terracotta oil lamp (chapel and speziale only; Florence is in daylight) |
  | Gambler | phone screen (a beam; not on the floor or in the lounge) |
  | Clockmaker | watchmaker's loupe lamp (a beam; not in the clock house) |
  | Evening | jar of fireflies, once the sky's `night` passes 0.3 |

- **How the light looks and moves.**
  - It is a held prop on the rig's front-hand attach point (the far hand while a tool is in use). Hanging lights swing behind his motion; held ones bob.
  - It lights the world (ADD, depth 11.02, under Jo): a pool or a beam from the flame or lens, plus a flat pool on the floor. A flame flickers; a bulb, screen or torch holds steady.
- **Dark and lit rooms.**
  - A room's own `lit` flag wins, then the per-room table, then the dream's default.
  - He raises the light in 300 ms at a dark room's seam and puts it away in 250 ms in a lit one.
- **Locator** (`src/entities/JoLocator.js`):
  - On entering the scene, after a respawn, on continuing a run, and on entering a room he was not in during the last 20 s: a small hat marker drops over his head and a thin ring opens at his feet. Both are gone in about 1 s.
  - While something opaque in front of him covers most of him, his silhouette shows over it.
- **Contrast probe** (`identityProbe.js`): it now finds Jo by a flat-filled mask. Measuring by colour had counted his dark coat on a dark wall as "edge".
- **`jo-contrast` results** (`[lamp]`, edge ratio, final run):
  - hub 3.4, chef 3.5, musician 5.7, astronaut 3.8, writer 3.5, gambler 3.1, clockmaker 4.5
  - the Evening by day, with no lamp: 6.0
  - the painter's via, by day with no lamp: 2.7

  The check is enforced where he carries a light, and reported for lit rooms.
- **Screenshots:**
  - `sheets/feedback3-jo-before.jpg`
  - `sheets/feedback3-light-<dream>.jpg` (one per dream)
  - `sheets/feedback3-jo-locator.jpg` (the ring, and the silhouette through cover)

## 2. A quieter mix (`src/audio/AudioBus.js`, `chatter.js`, `soundscape.js`)
- **Music** bus 0.8 → 0.32 (−8 dB). **Ambience** 0.55 → 0.43 (−2.1 dB).
- **Chatter** 0.5 → 0.3 (−4.4 dB). It is also sparser: a 20–32 s cooldown per person (was 8–12), at most two at once (was three), and a reach of 200 px (was 220).
- **sfx and ui** (dialogue, stingers, footsteps) are unchanged, so they now sit about 6–8 dB clearer over the bed.
- **The Evening's** direct voices now follow the buses (`flatGain` uses the reference levels). Its air drops a further 3.5 dB (it sat near −16).
- **Offline levels** (pre-master dBFS RMS): music −23 to −30 (was −18 to −22), ambience −24 to −35, a voice while it talks −30. The output is −30 to −37 RMS and peaks under −11.
- **New `tests/audioMix.test.js` targets:**
  - music −38…−23
  - output −40…−24
  - music 6–9 dB under the reference
  - sfx and ui untouched
  - chatter sparse
- **Sliders.** Settings (title and pause) has *Music volume* and *Ambience volume*. ←/→ step them by 10 %; choosing one cycles it. They are persisted in `settings.volumes` and applied to the buses at once (`src/ui/settingsItems.js`).

## 3. Restart
- **Pause menu** (BaseLevel; DreamScene inherits it):
  - Resume
  - **Restart from checkpoint**
  - **Restart dream from the start** (yes/no)
  - **Back to station**
  - Tutorials
  - Settings
- **Zero-hearts card:** the same three ways on, plus the pause menu.
- **What a restart from the start undoes** (`BaseLevel.restartDream`):
  - this run's coins, taken back out of the wallet
  - its heart shards
  - the saved run
  - the gambler's uncashed chips (`onRestartDream`)

  It then restarts the scene afresh (a framework dream from its own start, with any dev warp dropped). Dreams caught, the hub, the Evening's map and the marker stay.
- **The Evening's pause:**
  - **[R] start over** (then [Y]/[N]): from the arch. The map and the pocket stay.
  - **[L] read the list**
  - [Q] back to the station

## 4. Readable notes
- **The reading panel** (`src/ui/ReadingPanel.js`, layout in `readingLayout.js`):
  - cream paper in the §9 frame, dark ink at 7:1 or better
  - body ×2 (cap 18), level, wrapped to 640 px and paged
  - [E]/→ next, ← back, [Esc] close
  - a beat verb, `{ read: doc }`, for framework dreams
- **Now on it:**
  - the station's newspaper ([E] read the paper)
  - Priya's notebook (5 pages; was the dialogue box)
  - Isak's letters (were tilted −1.5° and bobbing)
  - Lou's note (was floating text that faded)
  - **the painter's commission contract** (on signing; it had only ever been two HUD lines)
  - PAGE THREE (was nine lines of all-caps small type; the choice now follows, with [R] to reread)
  - the Evening's things-to-do list (it was 20+ lines at the smallest size, tilted, on a 214 px scrap; the scrap now shows a short tally)
- **Smaller fixes:**
  - Chef ticket rail: dark ink on the cream tickets was being "lifted" toward white as if it sat on the dark panel. `Modal.text` now takes its backing.
  - Astronaut crew plaque: sized to its words.
  - Hub: the painted ENQUIRIES, WAY OUT and TEA ROOM went from cap 7 to cap 14.
  - HORNS & REPAIRS: now painted at ×2.
  - Tilted signs are level (hub gate, Evening path signs, the Adaeze poster, the legacy painter's canvas titles).
- **Lint** (`lint:content`, readability):
  - `text-tilted`: information text at an angle fails.
  - painted small ×1 words fail unless marked decoration.
- **Scenario** `reading-panel` opens the paper, the notebook, the contract, page three and the Evening list. For each it asserts cap ≥ 18, contrast ≥ 7, level, and fits.

## 5. Conversation size and the HUD (fullscreen)
- **Captions, the scene box and the dialogue box:** body at 1.6× (cap 14.4, the §8 screen minimum is 14) instead of 2×. The reading panel stays at 2×.
- **HUD:** the secondary lines are less heavy. The level line, shards, tool lines (the astronaut's LUNGS/GRIP), context, caption, footer and the meter rows keep their plate but lose the brass line. Only the goal, coins and prompt are framed.

## 6. Ladder jumps (`Player.js`)
- **The cause:** `JustDown(SPACE)` was read twice in a frame (the jump check consumed it), so a jump on a ladder never fired. The InputMap's `jump` also includes W, which is a climb on a ladder.
- **The fix:**
  - Space/A now jumps off from anywhere on the ladder: at run speed toward a held direction, otherwise a small hop.
  - The same ladder cannot re-catch him for 150 ms (`LADDER_REGRAB_MS`).
  - Ground and ladder tops are unchanged.
- **Scenarios:** `ladder-jump-writer` (legacy) and `ladder-jump-painter` (framework scaffold).

## Checks
| Check | Result |
|---|---|
| `npm test` | 160/160 (new: `tests/feedback3.test.js`, mix targets) |
| `lint:content`, `lint:rooms`, `lint:scale` | 0 failures |
| `npx vite build` | OK |
| Scenarios | One full run at the end (port 5199, dev silent): **117 passed, 1 failed**. The failure was `zero-hearts-checkpoint`, which asserted the old two-item death card. Every other part of it passed. With its expectation updated it passes on re-run (chef, writer, gambler, painter_legacy). |

New scenarios (`src/dev/scenarios/feedback3.js`):
- `restart-checkpoint-{chef,clockmaker}`
- `restart-dream-{chef,writer,clockmaker,painter}`
- `restart-death-card`
- `restart-evening`
- `volume-sliders`
- `reading-panel`
- `jo-light-rooms`
- `jo-locator`
- `ladder-jump-{writer,painter}`

## Known gaps
- **Lit rooms rely on the costume alone.** The painter's via by day measures 2.7:1, under 3:1. Jo's dark coat would need a recolour in the rig palette (an atlas rebake). `jo-contrast` reports these and does not fail on them.
- **The light props are sprites on the rig's hand point, not rig layers baked into the atlas.** They follow the attach point a frame at a time.
- **Rooms in the legacy scenes have no `lit` field of their own yet.** Their dark/lit choice comes from `JO_LIGHTS[dream].rooms`.
- **The Evening's crayon map labels and "my town" stay tilted**, on purpose (a child's drawing, lint-allowed). The full list reads on the panel.
- **The mix is still unheard.** Levels come from the offline render. The owner should listen with `?sound=1`.
