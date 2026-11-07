# Round 2 WP6: the identity system

Owner point 3: "give the whole game a character." Critique §9 sets the identity as **"Nine o'clock at Crossroads: count the lamps."** Every place is a station at night, lit by lamps you can count. Words arrive on a departure board. Every dream you finish puts out its lamp in the hall and adds a strand to the dreamcatcher.

The old dream scenes were touched only through shared systems (BaseLevel, Checkpoints, Player, EndingSequence, the theme) and two small hooks. No dream file was edited.

## What changed

### Tokens (`src/ui/theme.js`)
- **`IDENTITY`** holds the palette:
  - night `0x14122a`: the darkest colour anywhere. It is used for fills, dims, drop shadows, fades and the canvas background.
  - cream `0xf2e6cc`
  - gold `0xf2d580`
  - warn `0xd06050`
  - brass `0xc8a24a`
  - lamp `0xffc870`
  - rim `0xffd890`
- **No pure black or white.** `ink-shadow` and `dim` are now night, and the canvas background is night. A test enforces this.
- **`PLACES`** gives each of the nine places:
  - its indigo shadow
  - its warm practical
  - the §9 accent (clockmaker is verdigris `0x6fae8c`, to go with its green-and-brass livery)
  - a night `grade`
  - the strength of Jo's light pool (`halo`)
- **Helpers:** `placeOf(scene|id)`, `accentOf` and `rimOf`.

### The light signature
- **Night grade** (`setupGrade` in `src/art/look.js`, called from BaseLevel):
  - A multiply layer in the place's indigo sits at depth 11. That is over the world, the props and passers-by, and under Jo and the foes.
  - The cream hub hall now reads as a station at nine o'clock.
  - The Evening has no grade. It keeps its own warm light (the inversion §9 asks for).
- **Jo anchor** (`Player.js`; it generalises the Evening's `joRim`):
  - a warm rim 1.5 px toward the light
  - a 1 px night-indigo ink line on the shadow side
  - a soft pool of warm light behind him, sized per place
  - The Evening now drives the shared rim from its sky (its own `joRim` image is gone).
- **Lamp checkpoints** (`Checkpoints.js`, `src/art/identityArt.js`):
  - The `flag` / `flag-lit` textures are now a 1.9 m platform lamp (30×84). Every legacy scene gets lamps without being edited.
  - The lamp's foot is the old flag's foot, and the touch zone is the old tile.
  - Lighting a lamp turns the lantern on, adds a breathing glow above the grade and a warm pool on the room, and plays the place's chime.
  - Restored lamps relight without the fanfare.
- **Darkness per dream caught:** the existing overlay now uses the place's indigo instead of `0x0a0a14`.

### The frame (`src/ui/Panel.js`)
- **One 9-slice:** night fill at 88 %, one 1 px brass line, a 1 px inner shadow and 3 px corners. Dialogue, cards, menus, the pause screen and the title menu all draw it.
- **The title menu's own rounded rect is gone.**
- **New lint `ui-frame-single`** (`lint:content`): a rounded-rect frame anywhere in ui, play, narrative, systems or scenes outside Panel.js fails the run.

### The board (`src/ui/BoardTitle.js`)
- `boardTitle(scene, text, { sub, place })` gives every place name its own split-flap cell. Each cell flips through letters and lands left to right at **60 ms a glyph**, with the board's clack. When the whole line has landed, the place's chime plays.
- **It is used for:**
  - the dream intro: "THE YELLOW HOUSE", with "FROM PLATFORM 5" under it
  - the clockmaker's room titles (THE LANE, THE GREEN…)
  - "CROSSROADS STATION / NINE O'CLOCK" on arriving at the hub
  - the hub opening's one title line, which replaces the second DREAMCATCHER title
  - **every dream's end:** "FIVE-STAR DREAM CAUGHT" over the legacy end card (a BaseLevel `showCard` hook keyed on `orbCaught`), and "THE STOPPED HOUR CAUGHT" in EndingSequence. The painting's own title moved onto a plaque on its frame.
- **The title's DREAMCATCHER** lights up letter by letter with the same flip.

### Transitions (`src/ui/TrainWipe.js`)
- **The passing-train wipe** is used for hub ↔ dream:
  - Five bands of coach side sweep across in 700 ms: the dream's accent livery, a brass line, lit saloon windows and dark gangways.
  - The next scene starts under them at the midpoint.
  - The bands live on the UI scene, so a single wipe spans the cut.
  - The chime plays as the train comes in.
- **Where it is used:**
  - boarding at the hub (any train, including the Last Stop, in Evening gold)
  - every dream's return: the legacy end card, DreamScene `leaveDream`, and pause → Return to station
- **Effect on boarding lock time:** the wipe replaces the 650 ms fade, so boarding locks control for less time than before.
- **Death** fades through the night indigo, and so do the Title and the scenes' own fades. Room to room is unchanged.

### Sound (`src/systems/audio.js`)
- **`chime(event, place)`** is one two-note motif, a falling perfect fourth, voiced per place:
  - hub: station bell
  - chef: service bell
  - musician: horn
  - astronaut: radio beep
  - writer: typewriter bell
  - painter: church bell
  - gambler: slot chime
  - clockmaker: tubular chime
  - Evening: two towers of town bells
  - the ridge: unaccompanied sine
- **Routing.** Every voice is the existing `tone`/`noise`, so it reaches the one `master` gain, which `DEV_SILENT` holds at 0 (verified by code inspection; nothing was played).
- **When it plays:**
  - a board landing
  - a lamp
  - boarding / return
  - CAUGHT
  - YOU'RE HERE (the Evening's board)
  - the ridge cards
  - a strand woven in the hall
- **Framework hookup.** The framework `Stingers` answer `checkpoint:lit` with the same chime (`new Stingers(bus, { place })`).
- **`chimeLog`** records each event for the scenarios.

### The dreamcatcher (`src/art/identityArt.js`)
- **One drawing** is used everywhere: a brass hoop wrapped in thread, a seven-spoke web that sags round by round, a centre bead that lights when the web is whole, and three feathers.
- **Hall:** a 2.9 m dreamcatcher hangs on a chain in the hall (`HubScene.buildDreamcatcher`), next to a plaque: "One strand for every dream caught."
  - It has one round of web per dream caught, in that dream's accent, in board order.
  - Coming home from a dream, the train backs out and the lamp goes out. Then that dream's round is woven in over 1.6 s and the hub chime plays.
- **Title:** the emblem is the same dreamcatcher, woven as far as the save has got.
- **Boot:** the loader is the web filling round by round on the night indigo, with the label "Nine o'clock. Loading the station…".

## Jo's contrast (scenario `jo-contrast`)
`src/dev/identityProbe.js` snapshots the canvas with Jo drawn and with Jo at alpha 0. The pixels that change are Jo. The film grain is held for both snapshots, and the pixels are clipped to Jo's bounds. The measure is the median WCAG ratio of his silhouette edge against the mean of the 120×120 px box behind him.

| Place | Before (no grade, rim, ink or pool) | After |
|---|---|---|
| hub | 4.44 (dark Jo on a cream hall) | 3.36 |
| chef | 3.05 | 3.64 |
| musician | **2.20** | 3.29 |
| astronaut (gym) | **2.31** | 3.30 |
| writer (attic) | **1.88** | 3.10 |
| painter (arrival) | 3.49 | 4.13 |
| gambler (arrival) | **1.76** | 3.17 |
| clockmaker | 4.08 | 3.87 |
| Evening (square) | 6.22 | 4.22 (the sky moves; the two runs were at different times) |

Every place now meets the §9 3:1 rule. The four places that failed it before (musician, astronaut, writer, gambler) are the dark ones. There, Jo was a dark figure on a dark ground, and the warm pool now lifts the ground behind him.

## Scenarios (`src/dev/scenarios/wp6.js`)
- `lamp-checkpoint`
- `board-title`
- `train-wipe`
- `hub-dreamcatcher`
- `chime-events`: all five §9 moments are in the log
- `panel-frame`
- `jo-contrast`

`phase3.js` `clockmaker-playthrough` now waits for the wipe's cut, at most 90 frames, before it checks for the Hub.

## Screenshots (`sheets/`)

| File | Shows |
|---|---|
| `wp6-hub-dreamcatcher.jpg`, `wp6-hub-dreamcatcher-close.jpg` | The hall under the night grade, Jo in his pool, the dreamcatcher with three rounds (chef, musician, writer) |
| `wp6-wipe.jpg` | The passing-train wipe (painter livery) |
| `wp6-intro-board.jpg` | THE YELLOW HOUSE on the board, FROM PLATFORM 5 |
| `wp6-board-landed.jpg` | THE GREEN, landed |
| `wp6-lamp-checkpoint.jpg`, `wp6-lamp-close.jpg` | A lamp checkpoint lit in the Chef. The kerb's lamp stands in front of the STAFF DOOR sign, where the room data places it; its glow lifts the sign. |
| `wp6-caught-card.jpg` | FIVE-STAR DREAM CAUGHT over the end card, in the new frame |
| `wp6-ending-caught.jpg` | THE STOPPED HOUR CAUGHT, with the SEVEN O'CLOCK plaque |
| `wp6-evening-youre-here.jpg` | YOU'RE HERE (town bells) |
| `wp6-title.jpg` | The title: emblem, wordmark, framed menu |
| `wp6-boot-web.jpg` | The boot web at 20 %, 55 % and 100 % |

## Verification

| Check | Result |
|---|---|
| `npm test` | 110/110 (new: `tests/identity.test.js`) |
| `lint:content` | 0 failures, including `ui-frame-single` |
| `lint:rooms` | 0 failures |
| `lint:scale` | Clean |
| `npx vite build` | OK |
| Scenarios | One full run (port 5195, dev silent): **88 passed, 3 failed**. All 3 were new WP6 checks (`lamp-checkpoint`, `board-title`, `train-wipe`), and they failed only on their chime assertion: the event log was capped at 64 entries, so `slice(n0)` came back empty late in the run. I fixed the scenarios with a sequence number per entry. Those three re-ran with the log pre-filled past the cap and all pass. Every pre-existing scenario passed, including `clockmaker-playthrough`, `board-train`, `last-stop-board` and every `readability-*`. |

## Known gaps
- **The grade is one flat multiply per place.** It is not a per-layer lighting pass. Practicals other than checkpoint lamps (shop windows, stoves) sit under it and are dimmed with the world. Lifting each practical above the grade belongs to the framework's BackdropDirector presets.
- **The hall dreamcatcher is under the grade**, so its colours are muted. It was kept behind passers-by on purpose.
- **The legacy dreams have no per-room board titles.** Their place names are the checkpoint banners. Only the intro, the hub, the clockmaker rooms and CAUGHT use the board. Each rebuilt dream gets room titles for free through DreamScene.
- **The wipe is skipped on the turnstile route to the Evening.** That route keeps its warm fade ("a door stands open"), and so does Intro → dream (a street door).
- **`jo-contrast` is sensitive to rain and passers-by** crossing Jo's box. It samples one arrival frame per place.
- **The Evening's ghost HUD when warped out of it in the same session** is a harness race (the boot-time first scene starts after a warp). It is not caused by WP6 and not seen in play.
