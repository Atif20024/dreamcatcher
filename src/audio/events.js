// One-shots in the world (audio pass, advice §3): the things a place does
// now and then — a pigeon, a train announcement, a car going by in the
// rain, a ticket bell at the pass, chips on a table, a console's beep.
//
//   SHOTS.<name>(v)   draws one sound with the sink v (src/audio/PlaceAudio.js):
//                     v.tone({ freq, dur, type, vol, when, glide, attack, hold, filter })
//                     v.noise({ dur, vol, f, q, when, env, type, to })
//                     v.babble({ f0, secs, syllables, question, lp, vol, when })
//   SHOT_META.<name>  { sweep: s } pans the shot across the field over s seconds
//
//   new EventBed(def) a pure scheduler (no WebAudio): update(now, listenerX)
//                     → the shots due now, each with a pan, a level and a
//                     pitch. Every event keeps its own interval; the first
//                     never fires before 6 s; no shot twice in a row; pitch
//                     ±6%, level ±2 dB; a shot with a world `x` pans and
//                     fades by distance from Jo (silent at 900 px), one
//                     without is placed at a random pan and distance.
//
// Every voice is a sine/triangle/saw through a filter, or filtered noise:
// no raw squares (src/audio/synth.js enforces it).
const bellPartials = (v, f, vol, dur, when = 0, parts = [[0.5, 0.35], [1, 0.6], [1.19, 0.4], [1.5, 0.25], [2, 0.45], [2.51, 0.12]]) =>
  parts.forEach(([m, a]) => v.tone({ freq: f * m, dur: dur * (m < 1 ? 1.2 : 1 / Math.sqrt(m)), vol: vol * a, when, attack: 0.003 }));

export const SHOTS = {
  // --- the station ---------------------------------------------------------
  // the PA: a two-tone ding-dong, then a muffled voice through the horn
  ding_dong: (v) => {
    bellPartials(v, 659, 0.05, 1.4, 0, [[1, 1], [2, 0.25]]);
    bellPartials(v, 523, 0.05, 1.8, 0.55, [[1, 1], [2, 0.25]]);
  },
  announce: (v) => {
    SHOTS.ding_dong(v);
    v.babble({ f0: 118, secs: 2.2, lp: 1200, vol: 0.5, when: 1.3 });
  },
  pigeon: (v) => {
    v.tone({ freq: 380, glide: 300, dur: 0.25, vol: 0.05, attack: 0.03 });
    v.tone({ freq: 360, glide: 290, dur: 0.3, vol: 0.045, attack: 0.03, when: 0.34 });
  },
  wings: (v) => {
    for (let i = 0; i < 6; i++) v.noise({ dur: 0.05, vol: 0.05 * (1 - i * 0.12), f: 900, q: 0.7, when: i * 0.075 });
  },
  train_far: (v) => {
    v.noise({ dur: 6, vol: 0.06, f: 160, q: 0.5, env: 'swell' });
    v.noise({ dur: 5, vol: 0.012, f: 2400, q: 1.5, env: 'swell', when: 0.6 });
  },
  trolley: (v) => {
    v.noise({ dur: 1.6, vol: 0.02, f: 2200, q: 4, env: 'swell' });
    for (let i = 0; i < 4; i++) v.noise({ dur: 0.03, vol: 0.03, f: 3000, q: 2, when: 0.2 + i * 0.31 });
  },
  turnstile: (v) => {
    for (let i = 0; i < 3; i++) v.noise({ dur: 0.025, vol: 0.05, f: 3200, q: 3, when: i * 0.09 });
    v.tone({ freq: 900, dur: 0.03, vol: 0.02, when: 0.27 });
  },
  door: (v) => {
    v.tone({ freq: 170, glide: 240, dur: 0.5, type: 'sawtooth', vol: 0.02, attack: 0.05, filter: { type: 'bandpass', f: 800, q: 3 } });
    v.noise({ dur: 0.15, vol: 0.06, f: 300, q: 0.7, when: 0.55 });
  },
  flaps: (v) => {
    for (let i = 0; i < 8; i++) v.noise({ dur: 0.03, vol: 0.05, f: 3200, q: 1.2, when: i * 0.055 });
  },

  // --- outdoors ------------------------------------------------------------
  bird: (v) => {
    const f = 2800 + Math.random() * 1200;
    v.tone({ freq: f, glide: f + 600, dur: 0.08, vol: 0.025, attack: 0.008 });
    v.tone({ freq: f * 1.1, glide: f * 1.1 + 600, dur: 0.08, vol: 0.02, attack: 0.008, when: 0.13 });
  },
  swifts: (v) => {
    for (let i = 0; i < 3; i++) v.tone({ freq: 5400, glide: 4200, dur: 0.06, type: 'triangle', vol: 0.015, when: i * 0.1 });
  },
  dog_far: (v) => {
    for (const w of [0, 0.32]) v.tone({ freq: 190, glide: 130, dur: 0.16, type: 'sawtooth', vol: 0.03, when: w, filter: { type: 'lowpass', f: 600 } });
  },
  church_bell: (v) => bellPartials(v, 196, 0.05, 5),
  bike_bell: (v) => [0, 0.14].forEach((w) => v.tone({ freq: 1760, dur: 0.15, type: 'triangle', vol: 0.03, when: w })),
  cat: (v) => v.tone({ freq: 700, glide: 520, dur: 0.35, type: 'triangle', vol: 0.025, attack: 0.04 }),
  screen_door: (v) => {
    v.tone({ freq: 240, glide: 300, dur: 0.35, type: 'sawtooth', vol: 0.012, filter: { type: 'bandpass', f: 1000, q: 3 } });
    v.noise({ dur: 0.12, vol: 0.07, f: 500, q: 0.8, when: 0.4 });
  },
  starter_pistol: (v) => {
    v.noise({ dur: 0.15, vol: 0.12, f: 2000, q: 0.4 });
    v.noise({ dur: 0.4, vol: 0.03, f: 1200, q: 0.5, when: 0.35 });
  },

  // --- the clock house -----------------------------------------------------
  cuckoo: (v) => [650, 520, 650, 520].forEach((f, i) => v.tone({ freq: f, dur: 0.22, vol: 0.04, attack: 0.02, when: i * 0.32 })),
  spring_creak: (v) => v.tone({ freq: 140, glide: 190, dur: 0.4, type: 'sawtooth', vol: 0.015, attack: 0.04, filter: { type: 'bandpass', f: 900, q: 3 } }),
  gear_whirr: (v) => {
    v.noise({ dur: 1, vol: 0.02, f: 1400, q: 6, env: 'swell' });
    v.tone({ freq: 220, glide: 180, dur: 0.9, type: 'sawtooth', vol: 0.006, filter: { type: 'lowpass', f: 900 } });
  },
  strike_hour: (v) => [0, 1.4, 2.8].forEach((w) => bellPartials(v, 523, 0.025, 2, w, [[1, 1], [2, 0.4], [3, 0.15], [4.07, 0.06]])),

  // --- the rain street -----------------------------------------------------
  // a car going by: a swept low-pass, a hiss of tyres, panned across
  traffic: (v) => {
    v.noise({ dur: 3, vol: 0.08, f: 300, to: 900, q: 0.6, env: 'swell', type: 'lowpass' });
    v.noise({ dur: 2.6, vol: 0.025, f: 3500, q: 0.8, env: 'swell', when: 0.2 });
  },
  horn: (v) => [392, 523].forEach((f) => v.tone({ freq: f, dur: 0.35, type: 'sawtooth', vol: 0.012, attack: 0.02, hold: 0.15, filter: { type: 'lowpass', f: 1200 } })),
  drain: (v) => {
    for (let i = 0; i < 6; i++) v.tone({ freq: 300 + i * 40, glide: 500 + i * 50, dur: 0.06, vol: 0.02, when: i * 0.09 + Math.random() * 0.03 });
  },
  siren: (v) => v.tone({ freq: 700, dur: 4, vol: 0.006, attack: 1.2, vib: 120, vibHz: 0.5, filter: { type: 'lowpass', f: 1500 } }),

  // --- the jazz cellar -----------------------------------------------------
  glass_clink: (v) => {
    const f = 2400 + Math.random() * 600;
    [1, 2.76, 5.4].forEach((m, i) => v.tone({ freq: f * m, dur: 0.35, vol: [0.03, 0.012, 0.005][i], attack: 0.002 }));
  },
  chair_scrape: (v) => v.noise({ dur: 0.35, vol: 0.04, f: 900, to: 700, q: 2, env: 'swell' }),
  laugh: (v) => {
    [0, 0.13, 0.26].forEach((w, i) => v.tone({ freq: 400 - i * 40, glide: 330 - i * 40, dur: 0.1, type: 'triangle', vol: 0.03, when: w }));
    [0, 0.13, 0.26].forEach((w) => v.noise({ dur: 0.08, vol: 0.02, f: 1600, when: w }));
  },
  applause: (v) => v.noise({ dur: 2.2, vol: 0.05, f: 2500, q: 0.4, env: 'swell' }),

  // --- backstage, the arena ------------------------------------------------
  cheer: (v) => {
    v.noise({ dur: 1.6, vol: 0.07, f: 900, q: 0.5, env: 'swell' });
    v.noise({ dur: 1.2, vol: 0.02, f: 2400, q: 0.8, env: 'swell', when: 0.1 });
  },
  check_one_two: (v) => {
    v.babble({ f0: 112, syllables: 3, lp: 2200, vol: 0.4 });
    v.babble({ f0: 112, syllables: 2, lp: 2200, vol: 0.4, when: 0.9 });
  },
  feedback: (v) => v.tone({ freq: 2800, glide: 2900, dur: 0.4, vol: 0.006, attack: 0.15 }),
  case_latch: (v) => [0, 0.12].forEach((w) => {
    v.noise({ dur: 0.02, vol: 0.06, f: 4000, q: 2, when: w });
    v.tone({ freq: 1200, dur: 0.03, vol: 0.012, when: w });
  }),

  // --- the kitchen ---------------------------------------------------------
  pan_clatter: (v) => {
    const f = 1100 + Math.random() * 400;
    [1, 2.76].forEach((m, i) => v.tone({ freq: f * m, dur: 0.3, vol: [0.025, 0.012][i], attack: 0.002 }));
    v.noise({ dur: 0.05, vol: 0.04, f: 4000, q: 1 });
  },
  ticket_bell: (v) => v.tone({ freq: 2300, dur: 0.8, vol: 0.04, attack: 0.002 }),
  chop: (v) => {
    for (let i = 0; i < 5; i++) {
      v.noise({ dur: 0.025, vol: 0.05, f: 1500, q: 1.5, when: i * 0.18 });
      v.tone({ freq: 180, dur: 0.05, vol: 0.03, when: i * 0.18 });
    }
  },
  order_call: (v) => v.babble({ f0: 128, syllables: 6, vol: 0.45 }),
  steam: (v) => v.noise({ dur: 1, vol: 0.03, f: 3000, q: 0.5, env: 'swell' }),

  // --- the writer ----------------------------------------------------------
  carriage_bell: (v) => v.tone({ freq: 1568, dur: 0.7, vol: 0.03, attack: 0.002 }),
  paper: (v) => v.noise({ dur: 0.25, vol: 0.03, f: 3000, q: 0.8, env: 'lin' }),
  crumple: (v) => {
    for (let i = 0; i < 8; i++) v.noise({ dur: 0.02, vol: 0.03, f: 2500 + Math.random() * 1500, q: 1, when: Math.random() * 0.5 });
  },
  clock_hour: (v) => [0, 1.6].forEach((w) => bellPartials(v, 784, 0.02, 1.6, w, [[1, 1], [2, 0.3], [3, 0.1]])),

  // --- the station in orbit ------------------------------------------------
  console_beep: (v) => {
    const n = 1 + Math.floor(Math.random() * 3);
    const f = 1000 + Math.floor(Math.random() * 3) * 400;
    for (let i = 0; i < n; i++) v.tone({ freq: f, dur: 0.06, vol: 0.02, attack: 0.003, when: i * 0.11 });
  },
  relay: (v) => {
    v.tone({ freq: 90, dur: 0.08, vol: 0.05, attack: 0.002 });
    v.noise({ dur: 0.04, vol: 0.03, f: 600, q: 1 });
  },
  airlock: (v) => v.noise({ dur: 1.5, vol: 0.05, f: 2000, q: 0.5, env: 'swell' }),
  radio_chirp: (v) => {
    v.noise({ dur: 0.04, vol: 0.03, f: 3000, q: 1 });
    v.tone({ freq: 1200, glide: 1600, dur: 0.12, vol: 0.015, when: 0.05 });
    v.noise({ dur: 0.3, vol: 0.01, f: 2500, q: 0.6, env: 'lin', when: 0.18 });
  },

  // --- the casino ----------------------------------------------------------
  chips: (v) => {
    const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const w = i * (0.05 + Math.random() * 0.03);
      v.tone({ freq: 4000, dur: 0.03, vol: 0.012, attack: 0.001, when: w });
      v.tone({ freq: 4400, dur: 0.025, vol: 0.008, attack: 0.001, when: w });
    }
  },
  slot_jingle: (v) => [1047, 1319, 1568, 2093].forEach((f, i) => v.tone({ freq: f, dur: 0.12, type: 'triangle', vol: 0.015, when: i * 0.08 })),
  win_bell: (v) => {
    for (let i = 0; i < 8; i++) v.tone({ freq: 1500, dur: 0.12, type: 'triangle', vol: 0.015, attack: 0.002, when: i * 0.09 });
  },
  shuffle: (v) => {
    for (let i = 0; i < 10; i++) v.noise({ dur: 0.02, vol: 0.025, f: 3000, q: 1, when: i * 0.04 });
  },
  dice: (v) => {
    for (let i = 0; i < 5; i++) v.noise({ dur: 0.015, vol: 0.04, f: 2000 + Math.random() * 3000, q: 2, when: i * 0.07 + Math.random() * 0.05 });
  },

  // --- the ward (THE WHITE COAT, unlaunched) -------------------------------
  pager: (v) => [988, 784].forEach((f, i) => v.tone({ freq: f, dur: 0.2, vol: 0.015, when: i * 0.25 })),
};

export const SHOT_META = { traffic: { sweep: 3 }, train_far: { sweep: 6 }, trolley: { sweep: 1.6 } };

// seconds, and how a level in dB jitters
const db = (x) => 10 ** (x / 20);

export class EventBed {
  // def: { events: [{ shot, every: [lo, hi], x?, level? }], firstAfter? }
  constructor(def, { rand = Math.random, start = 0 } = {}) {
    this.def = def || { events: [] };
    this.rand = rand;
    this.last = null;
    this.fired = [];
    const first = this.def.firstAfter ?? 6;
    this.next = (this.def.events || []).map((e) => start + first + this.span(e) * (0.3 + 0.7 * rand()));
  }

  span(e) {
    const [lo, hi] = e.every || [10, 20];
    return lo + (hi - lo) * this.rand();
  }

  // → [{ shot, pan, level, pitch, at }]
  update(now, listenerX = null) {
    const out = [];
    const evs = this.def.events || [];
    for (let i = 0; i < evs.length; i++) {
      if (now < this.next[i]) continue;
      const e = evs[i];
      // no shot twice in a row: wait a little and let another go first
      if (e.shot === this.last && evs.length > 1) {
        this.next[i] = now + 1 + this.rand() * 2;
        continue;
      }
      this.next[i] = now + this.span(e);
      let pan;
      let level;
      if (typeof e.x === 'number' && listenerX !== null) {
        const dx = e.x - listenerX;
        pan = Math.max(-1, Math.min(1, dx / 600));
        level = Math.max(0, 1 - Math.abs(dx) / 900);
        if (level <= 0.02) continue;
      } else {
        pan = (this.rand() * 2 - 1) * 0.8;
        level = 0.4 + this.rand() * 0.6;
      }
      level *= (e.level ?? 1) * db((this.rand() * 2 - 1) * 2);
      const pitch = 1 + (this.rand() * 2 - 1) * 0.06;
      this.last = e.shot;
      const f = { shot: e.shot, pan, level, pitch, at: now };
      this.fired.push(f);
      if (this.fired.length > 32) this.fired.shift();
      out.push(f);
    }
    return out;
  }
}
