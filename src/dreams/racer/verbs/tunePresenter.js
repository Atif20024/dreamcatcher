// TUNE's presenter: the beat you can see and hear. Three streaks of fumes over the
// carburettor wave and throb at the beat's rate, then lie still and turn bright when
// it stops: the same streaks as the draft on the road, so the verb reads with the
// sound off. Under them a jet screw that turns while [E] is held. No numbers.
// Sound: two oscillators on the sfx bus, the reference (the trumpet's A) and the
// engine's note, `hz` apart. Silent in dev, like everything else.
import { drawPanel } from '../../../ui/Panel.js';
import { hud } from '../../../ui/hud.js';
import { buses } from '../../../audio/AudioBus.js';
import { sfx } from '../../../systems/audio.js';

const REF = 220; // the trumpet's A
const W = 220;

function beatVoices() {
  const out = buses.bus('sfx');
  const ctx = out && out.context;
  if (!ctx) return null;
  const master = ctx.createGain();
  master.gain.value = 0.05;
  master.connect(out);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  lp.connect(master);
  const engine = ctx.createOscillator();
  engine.type = 'sawtooth';
  engine.connect(lp);
  const ref = ctx.createOscillator();
  ref.type = 'triangle';
  ref.frequency.value = REF;
  ref.connect(lp);
  engine.start();
  ref.start();
  return {
    set: (hz, jet, on) => {
      engine.frequency.setTargetAtTime(REF + Math.sign(jet || 1) * hz, ctx.currentTime, 0.03);
      master.gain.setTargetAtTime(on ? 0.05 : 0.02, ctx.currentTime, 0.05);
    },
    stop: () => {
      engine.stop();
      ref.stop();
      master.disconnect();
    },
  };
}

export function tuneWorld(scene, def, engine) {
  const g = scene.add.graphics().setDepth(40);
  const at = () => ({ x: scene.player.x, y: scene.player.y - 112 });
  let phase = 0;
  let voices = null;
  try {
    voices = beatVoices();
  } catch {
    voices = null; // no audio context in a dev build
  }
  const api = {
    last: null,
    enter(st) {
      hud.set('context', def.hint);
      api.render(st, null);
    },
    render(st, outcome) {
      const dt = scene.game.loop.delta || 16;
      phase = (phase + (Math.PI * 2 * st.hz * dt) / 1000) % (Math.PI * 2);
      const still = st.hz === 0;
      const wave = still ? 0 : Math.min(9, 2 + st.hz);
      const alpha = still ? 1 : 0.35 + 0.3 * (1 + Math.sin(phase));
      const a = at();
      api.last = { hz: st.hz, still, wave, alpha, flooded: st.flooded };
      g.clear();
      drawPanel(g, a.x - W / 2 - 14, a.y - 44, W + 28, 92, { accent: 0xc8963a });
      // the fumes
      for (let i = 0; i < 3; i++) {
        const y = a.y - 26 + i * 13;
        g.lineStyle(2, still ? 0x88e8ff : 0xf2e6cc, st.flooded ? 0.25 : alpha);
        g.beginPath();
        for (let x = 0; x <= W; x += 8) {
          const yy = y + Math.sin(phase + i * 0.9 + x * 0.05) * wave;
          if (!x) g.moveTo(a.x - W / 2 + x, yy);
          else g.lineTo(a.x - W / 2 + x, yy);
        }
        g.strokePath();
      }
      // the screw: its slot turns with the jet
      const sx = a.x;
      const sy = a.y + 28;
      g.fillStyle(st.holding ? 0xf6d98a : 0xc8963a, 1).fillCircle(sx, sy, 11);
      const ang = st.jet * Math.PI * 3;
      g.lineStyle(3, 0x2a1e1a, 1).lineBetween(sx - Math.cos(ang) * 9, sy - Math.sin(ang) * 9, sx + Math.cos(ang) * 9, sy + Math.sin(ang) * 9);
      if (voices) voices.set(st.hz, st.jet, st.holding);
      if (outcome === 'miss') {
        sfx('click');
        scene.caption.say('ottavia', st.last === 'past' ? 'Past it. It will turn back.' : 'Not yet. Keep turning.', { ms: 1800 });
      }
      if (st.flooded && !api.flooded) {
        sfx('knock');
        scene.caption.say('ottavia', 'Flooded. Wait for her. From the start.', { ms: 1800 });
      }
      api.flooded = st.flooded;
    },
    outro() {
      return new Promise((res) => scene.time.delayedCall(def.outroMs ?? 500, res));
    },
    destroy() {
      if (voices) voices.stop();
      g.destroy();
      hud.set('context', '');
    },
  };
  scene.tunePresenter = api; // (racer-tune reads what the streaks are doing)
  return api;
}
