# Touch controls (phones and tablets)

The owner wants to play on a phone. The game now shows on-screen controls on touch devices and plays the same way on desktop as before.

## When the controls appear
- On a touch device: the primary pointer is coarse, or the screen takes touch and nothing can hover. A laptop with a touch screen and a mouse keeps its keyboard and looks as before.
- `?touch=1` turns the controls on for a desktop test, and `?touch=0` turns them off.
- This is decided once at boot (`src/input/touchState.js`). A scenario can also switch the controls on or off with `enableTouch(on)`.

## One input path
Each button presses a real `KeyboardEvent` key on `window`. This is the same mechanism `window.__dc` uses, now shared in `src/input/virtualKeys.js`, and the harness imports it from there. Player, the InputMap, ModalManager's `e.code` handlers and every scene's `JustDown` hear the touch buttons exactly as they hear keys. No second input system was added.

| Control | Key |
|---|---|
| D-pad left / right / up / down | Arrow keys |
| JUMP | Space |
| E | KeyE (interact; matches the in-game `[E]` prompts) |
| X | KeyX (the dream's action; card confirm) |
| Q | KeyQ (the alt verb: trumpet, card alt) |
| Pause (top left) | Escape |

- **Multitouch.** Each finger is tracked by its identifier, so you can hold ▶ and tap JUMP. The scenario tests exactly this.
- **D-pad.** One round pad, read by the angle of the touch:
  - Right is anywhere within ±60° of east, and left mirrors it.
  - Up is 40–140°, and down mirrors it. Up is also a jump in most dreams, so a thumb running east can drift about 35° without jumping.
  - Between those angles, a diagonal presses both directions (for ladders).
  - A thumb can slide between arms without lifting.
- **Buttons.**
  - Size: 52–64 CSS px, about 16% of the screen height. Hit circles are 1.3× the plate.
  - Look: ink-dark plates at 42% opacity with a brass ring. Labels use the bitmap font. Arrows and the pause icon are drawn with Graphics.
- **Stepping aside.** While a dialogue, card, tutorial or pause/death menu is up, only the pause button stays, and a tap answers the screen instead. They also hide while a tap zone is live: the title, the tables at THE LAST HAND, and the hub's opening vista.
- **No clicks through.** The DOM listeners are on `window` in the capture phase. A touch on a button never reaches Phaser (the HUD footer is a music button there). After a touch, the browser's emulated mouse events are ignored.

## Taps
`TouchControls.tap` routes each tap to the first of these that applies:

1. **The top modal's own `tap`.** This is a new `spec.tap` on ModalManager, used by:
   - **PauseMenu** (also the death card and the title's settings): the tapped row is chosen. On a volume slider, the left half steps the volume down and the right half steps it up.
   - **DialogueBox and SceneBox:** a tap on a choice picks it. A tap anywhere else finishes the line or moves to the next one. While choices are showing, a tap off them does nothing, so a stray tap never picks for you.
   - **ReadingPanel:** the left third goes back a page; a tap anywhere else goes to the next page or closes.
2. **The top modal's confirm key.** A dialogue, card or tutorial without its own `tap` gets KeyX pressed for 3 frames (BaseLevel cards confirm on X only).
3. **Tap zones** (`src/input/touchTaps.js`), used where the screen is not a modal:
   - **Title:** a tap on a line chooses it. The hint reads "tap a line to choose it".
   - **Hub opening vista:** any tap skips it.
   - **THE LAST HAND tables** (`src/dreams/gambler/table.js`):
     - **SHOWDOWN:** the first tap moves the table's own cursor onto a verb and a second tap plays it. This is two taps on purpose: money is at stake, and the TILT creep still moves the cursor. During the reveal, a tap deals the next hand.
     - **Faro:** a tap on a card picks it. A bet is picked with one tap and played with a second.
     - **Slate:** a tap on a row's label picks the row. Taps left or right of its number step the number. CHALK IT, once picked, is played with a second tap.

Menu rows sit 18–26 px apart, which is closer than a fingertip. `pickRect` takes the row under the finger, or the nearest row within a small distance.

## HUD
`hudInsets` in `src/ui/hud.js` are all zero on desktop. When the controls are on:
- The left column (hearts, level, shards) moves right of the pause button.
- The bottom-left context line moves up above the d-pad.
- The keyboard footer (`[Esc] pause · [M] music`) is hidden.

The dialogue box's `[E] ▼` hint reads `tap ▼`.

## Portrait, fullscreen, the page
- **Portrait.** The card reads "TURN YOUR / PHONE / SIDEWAYS" in the display font at 4×, about 22 CSS px tall on a 375 px wide phone, with a phone-turning icon. The gameplay scene is paused under the card and resumes when the phone is turned to landscape. Boot and the title are never paused.
- **Fullscreen.** The first tap on a real touch device asks for fullscreen through Phaser's ScaleManager. Once fullscreen is entered, it calls `screen.orientation.lock('landscape')`. Errors are swallowed, because iPhone Safari does not allow fullscreen on a canvas. Key B stays as the desktop fullscreen key.
- **The page** (`index.html`):
  - viewport `maximum-scale=1, user-scalable=no, viewport-fit=cover`
  - `touch-action: none`, `overscroll-behavior: none`, `user-select: none`
  - `-webkit-touch-callout: none` and no tap highlight
  - `gesturestart` is prevented while the controls are on

## Tests
- `tests/touch.test.js` has 53 tests on the pure half:
  - `touchWanted`
  - `layoutTouch` for five viewports (iPhone SE, iPhone 14, Pixel 7, iPad, desktop): sizes, on screen, no overlaps, corners, pause/HUD inset, each centre hits itself
  - d-pad angles, `controlsAt` / `keysAt`, `pickRect`, `toGame`, `isPortrait`
  - tap-zone routing, HUD insets
- Scenario `touch-walk-jump-talk` (`src/dev/scenarios/touch.js`) sends real `TouchEvent`s to the canvas. In the hall:
  - Hold ▶: Jo walks 37 px in 30 frames.
  - Tap JUMP with ▶ still held: he rises 79 px, and ▶ stays down.
  - Let go: he stops.
  - Tap E at Pemberton's desk: the conversation opens and the play buttons step aside.
  - Tap the box: it closes after 6 taps, and the buttons come back.

  It passes with `?touch=1` and without it (it turns the controls on for itself).
- Also run and passing: `reading-panel`, `restart-death-card`, `hud-scale-zoom`, `gambler-tilt`.
- Checked by hand:
  - Pause through the button, then Settings → Back → Resume, all by taps.
  - A SHOWDOWN cursor moved by a tap.
  - The portrait card and the resume after turning back.
- Also passing: vitest (241), `lint:content`, `lint:rooms`, `lint:scale`, `vite build`.

Screenshots: hub landscape, a dream, the dialogue, the pause menu, the SHOWDOWN menu and the portrait card (taken at 844×390 and 375×812).

## Open risks
- **Keys with no button.** Some dream verbs are on keys that have no button: F (astronaut tether, painter), C (Evening camera), V, 1–3 (painter), R, L, Tab, and Shift (run/walk). Typing puzzles (`src/systems/typing.js`, the writer's pen) need a real keyboard. Each of these needs a contextual button or a tap design per dream.
- **The d-pad is large.** On a phone it covers roughly the bottom-left 25% × 45% of the view. When Jo is at the left edge of a room, he can be under it. The plates are translucent.
- **Long captions.** The centred controls caption can reach the button clusters, and it still names keyboard keys. In-world prompts and tutorial cards also name keys (`[E]`, `[X]`), but the buttons carry the same letters.
- **Window blur.** When the window blurs (for example on a fullscreen change), the held keys are dropped. A finger already held down must be lifted and pressed again.
- **Untested on real phones.** iOS Safari cannot go fullscreen or lock the orientation, so the portrait card is the only guard there. The real-device behaviour of the first-tap fullscreen request and the orientation lock has not been tested; all testing used an emulated viewport with synthetic touches.
- **Existing harness race.** Straight after a cold page load, `__dc.ready()` can return before Boot has started the title, so a `warp` can end up under the title. This bug was already there. The touch scenario warps a second time when that happens.
