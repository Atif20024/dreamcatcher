# Phase 1 report: foundations retrofitted into today's scenes

Branch `redesign`, commits 1.1 (27f4e23), 1.2 (7cd2d8d), 1.3 (c6e86db) and 1.4 (this one). Plan: `03_architecture_plan.md` §6 Phase 1. Critique: `02_final_critique.md`.

**Milestone (plan):** "the current game, but fair and readable: no snap, no lost dream, no dead cards, no monospace". All four are met. The art, scale and level content are unchanged on purpose; they belong to phases 2–5.

## 1. What phase 1 changed

| Step | Commit | What it built |
|---|---|---|
| 1.1 Failure and save | 27f4e23 | `HealthModel`: a hit costs one heart, knockback and 1.2 s of i-frames, never a teleport. At zero hearts, the death card returns Jo to the last flag with hearts refilled, with no `scene.restart`. Every checkpoint has an id and a label. `SaveStore` v2 (3 slots, global settings, migration from v1). `RunState` saves the in-dream run, and the hub offers Continue. Added `PauseMenu`. The Painter uses hearts. |
| 1.2 UI layer | 7cd2d8d | `UIScene` at zoom 1 over every scene. `ModalManager`: one stack per scene for cards, dialogue, panels, pause and death. String-art bitmap fonts through `uiText()`, so there are 0 default-text uses. `HudGrid` has fixed slots and a layout budget. |
| 1.3 Transitions | c6e86db | The room comes from the camera centre with hysteresis. Sky, layers, landmark, horizon and vista zoom blend continuously on `t`. Nothing snaps or flickers. |
| 1.4 Teach, goals, defects, title | this commit | Tutorial cards are data with declarative triggers and are seen once per dream. "Replay tutorials" is in the pause menu. The EVA tether is staged. Every room has an objective, and every gate has a sign. Fixed the F#15 defects. Added a title screen. The lint has new ERROR rules. |

### 1.4 in detail
- **Teach** (`src/data/teach.js`, `src/play/Teach.js`). Each card holds `{name, hint, key, scope, triggers}`.
  - A trigger is either a `zone` (room plus room-local columns, run each frame by `updateTeach`) or an `event` (fired from code by `showTutorial(scene, id)`).
  - The scope is `perDream` by default (`SaveStore.seenCards(dream)`); `once` is used only for slopes.
  - `systems/tutorial.js` is now a shim. The pause menu has "Replay tutorials", which lists the cards this dream has shown.
- **The 13 dead cards.**
  - Wired (9):
    - `wall_jump`: a zone at the Chef chimney, plus a Player event on the first ribbed wall touched in the air.
    - `plate_gate`: zones at the Chef dock plate, the Musician basement plates and the Writer post office.
    - `sound_bridge`: the first bridge anchor in reach.
    - `call_response`: the first gig, with the card shown before the first bar.
    - `rest_note`: Ray's lesson; it replaces a float text.
    - `distract`: the Painter, at the first person in sight. Q throws the tube.
    - `slope`: the first slope, once per save.
    - `zero_g_rail`: the first rail in reach.
    - `eva_tether`: the EVA room zone, plus the refused push-off.
  - Deleted (4), because no mechanic exists: `ledge_grab`, `hang_drop` and `careful_step` have no code, and for `loose_tile`, the `L` tiles are plain solids and nothing crumbles.
- **Chef chimney (B1).**
  - Columns 39 and 41 are now ribbed `|`. The near wall stops two tiles above the ground, so Jo walks into the shaft. Its floor is solid, so a missed jump only lands him at the foot (the staged first success). The dumpster stair is still the other way up.
  - Player fix: a ribbed wall within reach now counts as touching. In the air, Jo leans on it instead of pushing into it. Before, pushing into a column of tile bodies while rising snagged on their seams and killed the jump.
- **EVA tether (A1).**
  - The card fires when Jo enters `p4_eva`.
  - Until Jo has clipped on once, an unclipped push-off is refused. The nearest hook pulses, the card shows, or the line "[F] clip to a hook first" appears.
  - The first drift after that is reeled back by Halvorsen on a drawn safety line, with no heart lost. Only a second unclipped push is the old drift-away.
  - Today a clip is never released (re-clipping moves it), so after the first clip the drift cannot happen at all. The rescue guards any future unclip verb.
  - Clipping on for the first time says "now push off: [Space]".
- **Objectives** (`src/play/Objectives.js`, `src/data/objectives.js`).
  - Each `rooms.js` declares `OBJECTIVES[roomId]`: either a string, or a list `[{text, flag?, unless?}]` in which the last entry whose flag is set wins.
  - `BaseLevel.updateRoomServices()` applies it when Jo enters a room (the room Jo stands in, not the camera's room) and whenever a flag it lists changes the text.
  - A beat's `setObjective` holds until the next room or flag change. A resumed run keeps its saved objective until Jo moves on.
  - The stale cellar → corner objective (M1) is fixed.
  - The Evening rooms declare objectives too, but the Evening never draws them: its HUD ritual removes the HUD on purpose.
- **Gate signs** (`src/play/GateSigns.js`). Every requirement-bearing gate carries a data `hint`, drawn on a world-space signboard 2.5 tiles before the gate. It has one mark per requirement (○ → ●) and reads OPEN once the gate opens.
- **Lint ERRORs** (`npm run lint:content`; all fail the run):
  - A card with no trigger, a zone in a missing room or out of range, an event trigger with no `showTutorial` call, or code showing a card that has no data.
  - A room with no objective, or an objective over 64 chars.
  - A requirement-bearing gate with no hint, or a hint over 40 chars.
  - A foe within 15 tiles of a dream's spawn.
  - A landmark used by two dreams (generic `one_lamp` excepted).
- **Title** (`src/scenes/TitleScene.js`).
  - Boot → Title → Hub. The title is painted: the station shed at night, a waiting train, Jo under a lamp, and the hoop, all in bitmap type.
  - Continue is shown only when there is a save. It goes to the station, where a mid-dream run shows CONTINUE on its platform (the existing hub flow).
  - New game confirms before wiping the active slot (`SaveStore.resetSlot`); settings stay.
  - Settings has the music toggle.
  - Any dev warp (`?warp=` including `?warp=hub`, `?at= ?wr= ?pt= ?gm= ?ev=`), `?scenarios` and `?notitle` skip the title.

## 2. Before / after per critique item

| Critique item | Before | After (phase) |
|---|---|---|
| F#2 hit → flag teleport; game over restarts the dream; nothing saved; "Choose another dream" on death | as described | heart + knockback; zero hearts → the last flag with hearts refilled; run saved per flag; Continue on hub and title; death card offers only "Back to the flag" or the pause menu (1.1) |
| F#4 / T2 / T2a backdrop swap, horizon snap, boundary flicker | swap at Jo's x, 256 px y jump | continuous blend; worst layer jump ≤ 8 px/frame in all eight places; no flicker (1.3) |
| F#5 flags and gates don't explain themselves | pale pennant, chains + 5 px light | labelled flags, "Saved here" (1.1); a gate sign naming what opens it, ticking per requirement (1.4) |
| F#6 13 dead cards | 13 never fire | 9 wired, 4 deleted; the lint makes a card without a trigger an error (1.4) |
| F#6 seen-once global | one list per save | per dream; replay from the pause menu (1.4) |
| F#6 card overflow, BET card under the stake selector | fixed 380 px card, depth 240 vs 300 | auto-sized; ModalManager keeps the card on top (1.2) |
| F#7 / B3 HUD shrinks at zoom | on the world camera | UIScene at zoom 1 (1.2) |
| F#8 198 monospace uses, HUD stack | system monospace 7–14 px | bitmap fonts, 0 default-text uses (lint error), HudGrid slots (1.2) |
| F#10 modal stacking | no queue | ModalManager (1.2) |
| F#12 no title/continue | boot straight to the street | Title: Continue / New game / Settings (1.4) |
| F#12 finale offered on the first visit | open | **kept open by owner decision**; hub objective still names "the last stop" |
| F#15 astronaut darkZone persists | hard-edged 0.7 overlay seen from the pad | 160 px feathered edges; fades in only while Jo is in the forest and out once the course is done (1.4) |
| F#15 Chef landmark `meridian_sign` | Gambler's casino sign | new `le_reve_awning` landmark; the lint fails on cross-dream landmarks (1.4) |
| F#15 "DREAM 03" | Chef HUD numbered | "DREAM — FIVE-STAR DREAM", like every other dream (1.4) |
| F#15 Writer emblem | `palette` | `quill`; `sun` and `spade` emblems added too (the Painter and Gambler trains had silently fallen back to `stripe`) (1.4) |
| F#15 Painter has no hearts | wells only | hearts, and a hit also spills a well (1.1) |
| B1 chimney not wall-jumpable | plain slabs | ribbed shaft with a staged first climb; the card fires at its foot (1.4) |
| B2 death card over a tutorial card | stacked | the death card clears the tutorial card (1.2) |
| B10 dev captions in builds | "[dev] warped to …" shipped | behind `import.meta.env.DEV` (Astronaut, Evening); 0 in `dist` (1.4) |
| H2 Pemberton grabs control by proximity | dialogue on walking near | walking past shows one bark ("Sir? A word, at the desk. [E]"); talking needs E (1.4) |
| C1 two rats near the Chef spawn | 9 and 12 tiles away | one rat, 17 tiles away; spawn-safety lint (1.4) |
| C3 retry replays the auto-dialogue | yes | no (1.1) |
| M1 stale objective cellar → gig | stale across the boundary | per-room objective data (1.4) |
| A1 EVA tether trap | first push = untaught drift, lose a heart | taught, refused until clipped once, first drift rescued (1.4) |
| F§5.3 objectives, gate signs | ad hoc | data per room, signs per gate, lint (1.4) |
| F§5.6 pause menu with settings | none | Resume / Restart from flag / Return to station / Replay tutorials / Settings (1.1, 1.4) |
| F§5.8 retire global seen-once | global | per dream + replay (1.4) |
| F§5.10 one failure model, one modal frame, "DREAM — X" naming | inconsistent | one HealthModel, one ModalManager frame, every dream named "DREAM — X" (1.1, 1.2, 1.4) |
| X1 flag density | 7–19 per dream | labelled and de-duplicated (1.1); the density rule waits for decision 2 (dream length) |

## 3. Verification (1.4)
- `npx vite build`: OK. `npm test`: 48 passing. `npm run lint:content`: 0 failures, covering 39 cards, 97 rooms with objectives, 53 requirement-bearing gates with hints, spawn safety and landmarks. The remaining 22 geometry warnings are unchanged.
- Harness scenarios: all 14 pass, including `eva-tether-trap` (it failed until now) and the four new ones:
  - `chef-chimney-walljump`: the card fires and Jo climbs out by a wall-jump.
  - `gate-hint-visible`: the dock hatch sign is on screen 10 tiles before the gate.
  - `objective-room-entry`: chef arrival → dock, and musician cellar → corner.
  - `title-continue`: the title offers Continue, and the board shows CONTINUE for the saved run.
- Browser checks (own tab, music muted):
  - the title;
  - the dock hatch sign 7 tiles out;
  - the WALL JUMP card at the chimney foot, then Jo mid-climb in the ribbed shaft;
  - the Chef arrival with the LE REVE awning, one rat and the STAFF DOOR sign;
  - "DREAM — FIVE-STAR DREAM" in the HUD;
  - the quill on the Writer train;
  - the launch pad with the forest overlay at alpha 0;
  - the EVA refused push-off with the hook pulsing;
  - Pemberton's one-line bark with no dialogue opened.
- `dist` contains no "[dev]" strings.

## 4. Known gaps (carried forward)
- **The staged first success is partly done.** The safety rules exist: the EVA push-off is refused, and the chimney floor is safe. The plan's camera push and 0.5× slow time for a teaching beat are not built; they need CameraDirector (phase 3).
- **Gate signs are plain boards.** Their text comes from data, but they have no item icons yet. Icons arrive with the item atlas (phase 2/3).
- **Room objectives win at boundaries.** A beat objective that spans several rooms (for example the Chef rush) is replaced on room entry by the room's flag-aware entry. The rush and wave rooms list their flags, but an un-listed multi-room beat will show the room's text.
- **Lint rules not built yet.** Reachability, checkpoint-per-gate and the verb-has-a-card rule from §2.16 (points 2, 4b, 6) wait for the room graph (phase 3).
- **The `slope` card is low value.** It is wired (scope `once`) because slopes exist. The owner may prefer to delete it.
- **Astronaut station art:** the station rooms still have tall dark foreground blocks (a gamer note, not the darkZone). Phase 3/5.
- **The Chef street still has an old shop sign:** a "HOTEL MERIDIAN — DELIVERIES" signboard from the original street art. It is a prop, not the landmark; a content pass should rename it.
- **The hub still uses its own scripted objectives** on top of the room data: the opening, returns and the finale walk.
- **The title is painted with code primitives.** It will be repainted when the art source is decided.
- **Tutorial street (F#12, phase 4)** is not started.

## 5. Questions the owner must answer before phase 2

1. **Art source for characters (plan §3).**
   - The options:
     - (a) Free CC0/CC-BY packs, restyled. They are cheap, but a matching cast of about 30 people is not possible.
     - (b) AI-generated sheets. Fine for portraits and statics, but animation drifts from frame to frame and the licence terms vary.
     - (c) Upgraded code rigs composited to atlases. Perfect consistency, no licence risk, and an agent can author them; portraits are the weak spot.
     - (d) Hybrid.
   - **Recommendation:** (d) led by (c). Every animated character comes from rigs. Portraits and large static pieces may start from an AI tool or a CC0 pack, normalised by the pipeline, with the licence recorded. Backgrounds stay procedural.
2. **Character size and camera (decision 7, §8.2 #3).**
   - **Recommendation:** Jo authored at 32×40 and drawn at 2× (about 64 px on screen), a default camera of 1.0 (the critique suggests 1.25× if the frame stays smaller), and a push-in camera for talk.
   - This must be fixed before phase-2 art, because frame size is expensive to change later.
3. **Which dreams ship (decisions 1–3).**
   - **Recommendation:** 4 dreams (Musician, Chef, Astronaut, Writer) plus the Gambler as an optional fifth, each 6–10 minutes. The Painter is postponed; if it is kept, rewrite it with no real names or events.
   - The finale stays open from the first visit (owner decision, unchanged).
4. **Smaller questions with recommendations** (plan §8):
   - Order: Musician first, then free (decision 4).
   - Failure model: hearts → last flag, as built (decision 5).
   - Minigames: fewer and in-world (decision 8).
   - Save slots: 3, as built.
   - Update the three project skills (character-motion, ui-type, collectibles) at the end of phase 1 (§8.2 #8).
