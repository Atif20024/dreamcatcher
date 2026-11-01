// The other places' verbs (no keys of their own: [E] through Interaction, so touch
// has them all). Each room: a goal on an arrival card, a verb, a fail state.
//   the corridor   walk; a drop off the iron stairs fetches Sister Agnese (room.quiet)
//   the kitchen    take the tin, SPLIT it into three jars that want more than it holds
//   Sable's table  READ each paper, strike a clause, or initial it whole
//   the Gull road  CHALK three marks in order
// Also: `room.walks` (Jo walks of his own accord in there), and the warp's flags.
import { hud } from '../../../ui/hud.js';
import { uiText, PLATE } from '../../../ui/text.js';
import { readDocument } from '../../../ui/ReadingPanel.js';
import { sfx } from '../../../systems/audio.js';
import { addCoins } from '../../../systems/wallet.js';
import { JARS, tinLeft, short, PAPERS, signPapers } from '../season.js';
import { JAR_COLS, TIN_COL } from '../rooms/kitchen.js';
import { PAPER_COLS } from '../rooms/sponsor.js';
import { MARKS } from '../rooms/nightbefore.js';
import { CHAIR_COL } from '../rooms/hospital.js';

const T = 32;

// a ?warp= lands in a place with what the story would have given Jo by then
const WARP_FLAGS = {
  hospital: { done_race1: true, done_race2: true, cup_told: true, tyres_settled: true, kept_tyres: true, tuned: true, 'item:gloves': true, gloves: true },
  kitchen: { done_race2: true, gloves_left: true, tuned: true, cup_told: true, 'item:gloves': true },
  sponsor: { done_race3: true, jars_done: true, gloves_left: true, tuned: true, cup_told: true, 'item:gloves': true },
  nightbefore: { done_race5: true, signed: true, garage_again: true, jars_done: true, gloves_left: true, tuned: true, cup_told: true, 'item:gloves': true },
  pitlane: { done_race5: true, signed: true, garage_again: true, jars_done: true, gloves_left: true, tuned: true, cup_told: true, 'item:gloves': true },
};

// the arrival card: the board has the place's name; this plate says the one job
function arrivalCard(s, goal) {
  const cam = s.cameras.main;
  const t = uiText(s, cam.width / 2, 152, goal, { size: 'body', color: '#f2e6cc', align: 'center', bg: PLATE.dark }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setAlpha(0);
  t.name = 'arrival-goal';
  s.tweens.add({ targets: t, alpha: 1, duration: 300, hold: 3200, yoyo: true, onComplete: () => t.destroy() });
  return t;
}

function setupHospital(ctx) {
  const s = ctx.scene;
  const r = s.graph.room('hospital');
  ctx.state.quiet = { ground: null };
  const floor = (r.ty + 10) * T;
  s.interaction.register({
    id: 'ward:chair',
    x: (r.tx + CHAIR_COL) * T + T / 2,
    y: floor - 20,
    radius: 60,
    prompt: 'put the gloves on the chair',
    enabled: () => !s.F.gloves_left && !!s.F['item:gloves'],
    onUse: async () => {
      await s.runConversation('corridor', null);
      s.satchel = (s.satchel || []).filter((n) => n !== 'HIS GLOVES');
      hud.toolLine(1, 'accent').setText('').setVisible(false);
      s.saveRun();
      s.beats.play('gloves_set').catch((e) => console.warn('[dream] beat', e));
    },
  });
}

// the corridor hears it: back to the stairs' foot, nothing lost but the climb
function updateHospital(ctx) {
  const s = ctx.scene;
  const F = ctx.flags;
  const r = s.graph.room('hospital');
  const q = r.data.quiet;
  const st = ctx.state.quiet;
  if (F[q.until] || st.sending) return;
  const b = ctx.player.body;
  if (!b.blocked.down) return;
  const y = ctx.player.y;
  if (st.ground !== null && y - st.ground > q.dropTiles * T) {
    st.sending = true;
    F.ward_noise = (F.ward_noise || 0) + 1;
    b.setVelocity(0, 0);
    ctx.player.controlLockUntil = s.time.now + 900;
    s.cameras.main.shake(120, 0.003);
    s.beats.play(q.beat).catch((e) => console.warn('[dream] beat', e));
    const npc = s.npcs.get('agnese');
    if (npc) npc.facing = Math.sign(ctx.player.x - npc.x) || 1;
    s.time.delayedCall(600, () => {
      s.cameras.main.fadeOut(220, 0x14, 0x12, 0x2a);
      s.cameras.main.once('camerafadeoutcomplete', () => {
        const x = (r.tx + q.foot) * T + T / 2;
        const yy = (r.ty + q.row) * T;
        ctx.player.setPosition(x, yy);
        b.reset(x, yy);
        st.ground = null;
        st.sending = false;
        s.cameras.main.fadeIn(220, 0x14, 0x12, 0x2a);
      });
    });
    return;
  }
  st.ground = y;
}

function setupKitchen(ctx) {
  const s = ctx.scene;
  const r = s.graph.room('kitchen');
  const F = ctx.flags;
  const floor = (r.ty + 12) * T;
  const at = (col) => (r.tx + col) * T + T / 2;
  s.interaction.register({
    id: 'home:tin',
    x: at(TIN_COL),
    y: floor - 20,
    radius: 48,
    prompt: 'take the tin',
    enabled: () => !F.tin_taken,
    onUse: () => {
      F.tin_taken = true;
      sfx('snap');
      s.caption.say('jo', 'Heavier than it looks, and it is not much. To the table.', { ms: 2400 });
    },
  });
  // a jar's count over it, on a plate: how many it has, and how many it wants
  const labels = JARS.map((j, i) => uiText(s, at(JAR_COLS[i]), floor - 110, '', { size: 'body', scale: 1, color: '#f2e6cc', align: 'center', bg: PLATE.dark }).setOrigin(0.5).setDepth(-7));
  ctx.state.jars = labels;
  JARS.forEach((j, i) => {
    s.interaction.register({
      id: `home:${j.id}`,
      x: at(JAR_COLS[i]),
      y: floor - 20,
      radius: 40,
      prompt: `one for ${j.label.toLowerCase()}`,
      promptDy: 150,
      enabled: () => F.tin_taken && !F.jars_done && tinLeft(F) > 0,
      onUse: () => {
        F[`jar_${j.id}`] = (F[`jar_${j.id}`] || 0) + 1;
        sfx('coin');
        if (tinLeft(F) > 0) return;
        // the tin is empty: the room says what that means
        F.rent_short = short(F, 'rent');
        F.rent_ok = !F.rent_short;
        F.med_short = short(F, 'medicine');
        F.tyres_short = short(F, 'tyres');
        s.saveRun();
        s.beats.play('jars_settled').catch((e) => console.warn('[dream] beat', e));
      },
    });
  });
}

function updateKitchen(ctx) {
  const F = ctx.flags;
  JARS.forEach((j, i) => ctx.state.jars[i].setText(`${j.label} ${F[`jar_${j.id}`] || 0}/${j.wants}`));
}

function setupSponsor(ctx) {
  const s = ctx.scene;
  const r = s.graph.room('sponsor');
  const F = ctx.flags;
  const floor = (r.ty + 12) * T;
  PAPERS.forEach((p, i) => {
    s.interaction.register({
      id: `sable:${p.id}`,
      x: (r.tx + PAPER_COLS[i]) * T + T / 2,
      y: floor - 20,
      radius: 44,
      prompt: 'read the paper',
      enabled: () => !!F.met_sable && !F[`paper_done_${i}`],
      onUse: async () => {
        await readDocument(s, { title: p.title, text: `One: ${p.a.text}\n\nTwo: ${p.b.text}\n\nStrike one, or put your initials to both.` });
        await s.runConversation(`paper_${p.id}`, null);
        F[`paper_done_${i}`] = true;
        sfx('click');
        if (PAPERS.every((_, k) => F[`paper_done_${k}`])) settlePapers(s);
      },
    });
  });
}

function settlePapers(s) {
  const F = s.F;
  const { advance, binds } = signPapers(F);
  for (const b of binds) F[b] = true;
  F.sable_whole = PAPERS.every((p) => F[`strike_${p.id}`] === 'none');
  F.sable_struck = !F.sable_whole;
  addCoins(s.dreamId, advance);
  s.levelCoins += advance;
  s.updateCoinHud();
  s.saveRun();
  s.caption.say('jo', `On signature: ${advance} brass nuts, counted out on the leather.`, { ms: 3000 });
  s.beats.play('sable_signed').catch((e) => console.warn('[dream] beat', e));
}

function setupGull(ctx) {
  const s = ctx.scene;
  const r = s.graph.room('nightbefore');
  const F = ctx.flags;
  const floor = (r.ty + 14) * T;
  MARKS.forEach((m, i) => {
    s.interaction.register({
      id: `gull:${m.flag}`,
      x: (r.tx + m.col) * T + T / 2,
      y: floor - 20,
      radius: 56,
      prompt: m.prompt,
      enabled: () => !F[m.flag] && (i === 0 || !!F[MARKS[i - 1].flag]),
      onUse: () => {
        F[m.flag] = true;
        sfx('click');
        s.saveRun();
        if (i === MARKS.length - 1) s.beats.play('chalk_done').catch((e) => console.warn('[dream] beat', e));
        else s.caption.say('jo', i ? 'Turn in here. It looks too soon. It is not.' : 'Brake here. The board is a long way from the bend, in the dark.', { ms: 2600 });
      },
    });
  });
}

export default {
  id: 'places',
  keys: [],
  create(ctx) {
    const s = ctx.scene;
    const warped = s.warpTo && s.warpTo !== 'start' && WARP_FLAGS[s.warpTo.split(':')[0]];
    if (warped) Object.assign(s.F, warped);
    ctx.state.room = null;
    setupHospital(ctx);
    setupKitchen(ctx);
    setupSponsor(ctx);
    setupGull(ctx);
  },
  update(ctx) {
    const s = ctx.scene;
    const id = s.roomId;
    if (id !== ctx.state.room) {
      ctx.state.room = id;
      const d = s.graph.room(id).data;
      ctx.player.walkByDefault = !!d.walks;
      if (d.goal && !s.F[`_card:${id}`] && !s.transitions.busy) {
        s.F[`_card:${id}`] = true;
        arrivalCard(s, d.goal);
      }
    }
    if (id === 'hospital') updateHospital(ctx);
    if (id === 'kitchen') updateKitchen(ctx);
  },
};
