// The clock (THE STOPPED HOUR's encounter): the engine is src/engines/clockwork.js (pure
// logic); the 'world' presenter stages the dial over the wall clock in the
// clock house (src/play/encounterPresenters.js). Jo stands on the
// mezzanine; the camera closes in; the HUD's tool slot counts the gears.
import { clockwork } from '../../../engines/clockwork.js';

export default {
  id: 'clockwork',
  title: 'THE CLOCK',
  engine: clockwork,
  params: { gears: 3, speed: 140, window: 38 },
  presenter: 'world',
  view: 'clockwork',
  radius: 54,
  camera: { zoom: 1.3 },
  hud: 'encounter',
  hint: '[E] when the hand is in the brass',
  pose: 'interact',
  onWin: 'clock_done',
};
