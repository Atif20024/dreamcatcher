# Round 2 WP3: trains and the hub presentation

Owner point 1b: "size of train is too small as compared to the size of character … it should feel natural." The 128×32 toy trains on the concourse floor are gone. Every train is now one coach drawn at full scale (1 m = 44 px, the same scale as Jo), shown the way a real terminus and a real platform show it.

## What changed

### The train kit (`src/art/trainKit.js`, `src/art/trainArt.js`)
- `trainKit.js` is pure data: the coach in metres (20 × 2.8 × 3.9 m, floor 1.15 m, door 1.14 × 2.0 m, buffers 1.06 m, wheels 0.92 m) and the px sizes derived from it. It also holds the station furniture in metres, and `TRAIN_KIT_SIZES` for the lint.
- `trainArt.js` paints everything in code, in the station's light (lit west edges, shade east, warm lamplight):
  - **Carriage end, head-on (123 × 172).** Curved roof, gutter, livery bands, and a gangway with bellows. A sliding end door (a separate image) with a lit corridor behind it. Two lit end windows with seat backs and passengers. The destination blind. The dream's emblem on a roundel. A platform-number plate. Red tail lamps. A chevron buffer beam with buffers, coupling and brake hoses.
  - **Carriage side (880 × 172).** Roof with ventilators, eight lit saloon windows, two vestibule doors (50 × 88) with droplights, handles and steps. Panel seams, rivets, livery bands, the emblem, "CROSSROADS" and a coach number, an underframe with equipment boxes, gangway bellows, and a tail lamp on the last coach. Wheels (spoked, with a balance mark) and bogie frames are separate parts, so they turn.
  - **Bay vista (224 × 300 per bay), in one-point perspective** (vanishing point at eye height, 1.6 m). The shed roof ribs and purlins converge, with pendant lamps receding. The track bed has sleepers and converging rails. The platform has a coping, a yellow line, flagstone joints and receding lamps with pools of light. There are a few people far down the platform, haze at the far end, and an arch of night sky with signals. An iron screen of columns and a lattice girder frames the bay.
  - **Receding train layer.** Six coaches run away down the platform side, with lit windows and lit doors, and the engine's lamp far down the shed. This is a separate layer so it can leave with the end.
  - **Station furniture at §7 sizes:**

    | Item | Size (px) | Notes |
    |---|---|---|
    | Platform lamp | 22 × 154 | Numbered enamel plate; lit and unlit |
    | Buffer stop | 141 × 59 | |
    | Platform gate | 70 × 48 | Two swinging leaves |
    | Ticket booth | 119 × 114 | Counter at 1.1 m, "TICKETS" fascia |
    | Newspaper kiosk | 110 × 110 | |
    | Telephone box | 40 × 101 | |
    | Revolving door | 88 × 106 | Turning wing |
    | Double doors | 79 × 114 | |
    | Pigeon | 16 × 13 | |

### Hub bays (`src/entities/Train.js`, `src/scenes/HubScene.js`)
- **Each bay is a head-on terminus.**
  - The coach end stands at the buffer stop with its lower 40 px down in the track pit. It is drawn behind the concourse floor, so about 132 px rises above the floor (2.1 × Jo with his hat).
  - The rest of the train runs away beside the platform.
  - The platform gate and a 3.5 m numbered lamp stand at the mouth of the bay.
  - The overhead platform sign moved up to clear the roof.
- **The train is one container whose origin is the vanishing point.** Scaling it about that point is the train running away into the shed: the end, its door, blind, tail lamps and the receding coaches all go together.
- **Boarding.**
  1. [E] at the gate, then the conductor's question.
  2. The gate leaves swing open.
  3. Jo walks up the platform: 0.8 s, scaling to 0.83 and darkening.
  4. He steps into the lit side door, whose light spills across the platform.
  5. The door shuts, a whistle, and the train recedes into the shed while the screen fades.
  6. Measured: about 2.98 s of locked control from the choice to the next scene.
- **Return from a dream.** Jo steps down from the same door and walks out through the gate. Then:
  1. The coach windows go dark one coach at a time.
  2. The tail lamps go out.
  3. The blind rolls to NOT IN SERVICE.
  4. The doors shut, and the train backs into the dark and is gone.
  5. The bay is left empty: rails to the buffers, an oil stain, the lamp out, and a NOT IN SERVICE plate.
- **Lines that don't run** (athlete, doctor) show a dark coach, the blind reading NOT IN SERVICE, unlit lamps and no steam.
- The per-dream platform prop sets (crates, posters, easels…) were removed from the bays; the livery, emblem, blind and sign carry each dream's identity. The chef line still smells.
- **Other hub furniture:**
  - Front doors: two 2.6 m panelled double doors (chained) and a 2.4 m brass revolving door whose wing turns. They are re-spaced 3 tiles apart; Auntie Ro and her stand moved two tiles west to make room (`src/data/hub/rooms.js`).
  - One ticket booth and two telephone boxes replace the 32 px booths.
  - A 2.5 m newspaper kiosk on the street, with the headline on a board on its roof.
  - Pigeons at 16 × 13.

### Dream arrivals (`src/scenes/IntroScene.js`, `arrivalTrain()` in `src/entities/Train.js`)
- **Every dream intro now opens on a platform**, with two coupled full-scale coaches in the dream's livery standing behind Jo (`arrivalTrain(scene, x, railY, livery, opts)`).
- **The sequence:**
  1. Jo appears in the lit open door.
  2. He steps down two steps (the platform is a low 0.55 m halt, so the bogies and the tops of the wheels show over its edge).
  3. The doors close, the whistle sounds, and the train pulls away (2.5 s, accelerating). The wheels turn by distance, and the window light slides and strobes across the platform stone.
  4. The platform lamp comes on.
  5. The dream's street and door are revealed behind where the train stood, and Jo walks to the door.
- **Skip:** [E] now skips, as the hint says (X still works).
- **The Painter's night train** (`pt-train`, 75 × 18) is now the same two full-scale coaches on the line at Jo's floor, behind the terrain so ladders stay readable. Paul stands in the open door, and it leaves with turning wheels when the wind comes (`painter/world.js`, `painter/beats.js`, `data/painter/rooms.js`: rail moved to Jo's floor row).

### Lint and scenarios
- **`npm run lint:scale`** (and `lint:content`) now measures the train kit and the station furniture (`trainKitChecks` appended to `scripts/lib/scale-check.js`; classes appended to `src/data/scale.js`). It also checks:
  - `train-scale (carriage / Jo)` = 2.10.
  - `train-scale (door / Jo body)` = 1.16.
- **WP3 exceptions removed:** `hub-door`, `hub-booth`, `hub-kiosk`, `hub-lamp`, `hub-pigeon`, `hub-train` and `pt-train` are no longer exceptions. Result: 188 measured, 0 failures.
- **`src/dev/scenarios/wp3.js`:**
  - `train-scale`: all eight ends 172 px = 2.1 × Jo.
  - `board-train`: gate prompt, walk-in to scale 0.82, Intro starts, 2.98 s lock.
  - `arrival-train`: chef and gambler; sill 27 px over the platform, Jo lands on it, the train leaves, the lamp is on.

## Sizes (drawn px; Jo 76, 82 with hat)
| Thing | Before | After |
|---|---|---|
| Hub train | 128 × 32 | end 123 × 172 (132 above floor) + perspective train |
| Arrival train | none (street shot) | 2 × 880 × 172 coaches, door 50 × 88 |
| Painter train | 75 × 18 | 2 × 880 × 172 |
| Platform lamp | 24 × 33 | 22 × 154 |
| Hub doors | 48 × 40 | 88 × 106 revolving, 79 × 114 pairs |
| Ticket booths | 3 × 32 × 36 | 119 × 114 |
| Phone boxes | 24 × 32 | 40 × 101 |
| Kiosk | 48 × 32 | 110 × 110 |
| Pigeon | 10 × 10 | 16 × 13 |

## Screenshots (`sheets/`, JPEG, 960 × 540)
| Sheet | Shows |
|---|---|
| `wp3-hub-bays.jpg` | Platforms 1–3 at play zoom |
| `wp3-hub-bays-5-7.jpg` | Platforms 4–7 at play zoom |
| `wp3-bay-close.jpg` | One bay at 2.5× |
| `wp3-board-walkin.jpg` | Jo halfway up the platform |
| `wp3-board-door.jpg` | Jo at the door |
| `wp3-board-depart.jpg` | The train receding |
| `wp3-return-walkout.jpg` | Back from a dream: Jo steps down and walks out |
| `wp3-return-empty.jpg` | The empty bay after a return |
| `wp3-arrival-door.jpg` | Arrival: Jo in the door |
| `wp3-arrival-depart.jpg` | Arrival: the train pulling away |
| `wp3-arrival-gone.jpg` | Arrival: the lamp on, the street revealed |
| `wp3-arrival-gambler.jpg` | The Gambler arrival |
| `wp3-painter-train.jpg` | The Painter's night train |
| `wp3-hub-doors.jpg` | The front doors |
| `wp3-hub-booths.jpg` | Ticket booth and phone boxes |
| `wp3-hub-kiosk.jpg` | The street kiosk |

## Verification
| Check | Result |
|---|---|
| `npm test` | 101/101 |
| `npm run lint:content` | 0 failures (scale: 188 measured, 0 failures) |
| `npm run lint:scale` | Clean |
| `npx vite build` | OK |
| Every scenario (`__dc.runScenarios()`, own tab, port 5191) | 77 passed, 0 failed; `slope-gambler-floor-stairs` passed this run |

## Known gaps
- **The hall's dreamcatcher progress object and the opening's board line** (in the critique's WP3 row) were not in this brief and are not done.
- **No chime.** Boarding uses the existing `snap`/`whistle` sounds; the chime is WP6.
- **No back view of Jo.** The atlas has only side views, so Jo walks up the platform in his side walk cycle while scaling down. It reads, but a back or three-quarter walk would be better.
- **The vanishing point is fixed per bay.** Each bay's vista is painted with a fixed vanishing point; as the camera pans, the perspective does not shift. This is acceptable at play zoom, and it is the standard 2D cheat.
- **The arrival platform is painted over each intro's ground band.** The intro backdrops themselves (street facades) are still the old intro paintings; their building scale belongs to WP4 and the framework.
- **The old `hub-train` / `hub-door` / `hub-booth` / `hub-kiosk` / `hub-lamp` painters in `src/art/hubArt.js` are now unused.** They were left in place to avoid touching the shared painter file; they can be deleted.
- **Framework hand-over:** the phase 4 hub and PropLibrary should reuse `src/art/trainKit.js` and `src/art/trainArt.js`. `arrivalTrain()` is the shared arrival prop.

## Files touched outside the core scope
- `src/data/scale.js`: appended only.
- `scripts/lib/scale-check.js`: one call line inserted, plus an appended function.
- `src/dev/scenarios/index.js`: one import and one spread.
- `src/data/hub/rooms.js`: door, Ro and shoeshine x positions.
- Painter train: `src/scenes/painter/world.js`, `src/scenes/painter/beats.js` and `src/data/painter/rooms.js` (one line).
