// The rail (FIVE-STAR DREAM's verb; no keys of its own: [E] at a station). Runs
// the room's service (src/engines/tickets.js + services.js): one [E] prompt per
// station that says what it will do, or why it won't; Jo held still while he
// works; the plate in his hands; markers over the stations the rail wants; the
// pocket and the line's stock on the HUD; the rail on screen (railHud.js).
// A service runs while Jo is in its room. What it finishes goes into the run's
// flags (rail_<key>, stock_*, sent<table>, plates, late, bails), never kept in
// the service itself, so a Continue simply starts the room's rail again.
import { Service } from '../../../engines/tickets.js';
import { SERVICES } from '../services.js';
import { paintDish } from '../props.js';
import { CALLS } from '../dialogue.js';
import { hud } from '../../../ui/hud.js';
import { sfx } from '../../../systems/audio.js';

const T = 32;
const now2 = (s) => s.time.now;
// where a service may run (the plate is carried out of the pass into the room)
const ROOMS = { dining: ['pass', 'dining'] };
const ITEMS = { saffron: 'SAFFRON', onions: 'ONIONS' };

function dishKey(scene, name) {
  const key = `fs-dish:${name}`;
  if (!scene.textures.exists(key)) {
    const ct = scene.textures.createCanvas(key, 30, 16);
    paintDish(ct.getContext(), name);
    ct.refresh();
  }
  return key;
}

const wants = {
  pit: () => true,
  cold: (F) => !F.saffron,
  prep: () => true,
  line: (F) => !!F.mise_done,
  pass: (F) => !!F.table1_sent,
  dining: (F) => !!F.carry_out,
};

export default {
  id: 'rail',
  keys: [],
  always: false,
  create(ctx) {
    const s = ctx.scene;
    const st = ctx.state;
    st.svs = {};
    st.key = null;
    // (the widget needs the UI text, which needs Phaser: the lint loads this file in Node)
    import('../railHud.js').then((m) => {
      if (s.sys.isActive() || s.sys.isPaused()) st.hud = new m.RailHud(s);
    });
    st.world = s.add.graphics().setDepth(14);
    st.plate = s.add.image(0, 0, dishKey(s, 'RISOTTO')).setDepth(13).setVisible(false);
    st.pocket = hud.toolLine(1, 'accent');
    st.stockLine = hud.toolLine(2, 'ink');
    st.doors = hud.meter('doors', { label: 'DOORS', color: '#e9b84a', order: 2, visible: false });
    st.spots = [];
    for (const r of s.graph.rooms.values()) {
      const key = r.data.service;
      if (!key) continue;
      for (const [id, def] of Object.entries(SERVICES[key].stations)) {
        const spot = { id, key, room: r.id, def, x: (r.tx + def.x) * T + T / 2, y: (r.ty + def.y) * T + T };
        st.spots.push(spot);
        if (def.external) continue;
        spot.reg = s.interaction.register({
          id: `rail:${key}:${id}`,
          x: spot.x,
          y: spot.y,
          radius: 46,
          dy: 40,
          prompt: def.verb,
          enabled: () => st.key === key && now2(s) - (st.enteredAt || 0) > 2200 && !!st.svs[key] && !st.svs[key].done && !st.svs[key].working,
          onUse: () => this.use(ctx, spot),
        });
      }
    }
    // a hit (or a grab) spills what's in Jo's hands: back to its last stop
    s.onHurtExtra = (opts) => {
      if (opts && opts.source === 'burn') ctx.flags.burns = (ctx.flags.burns || 0) + 1;
      this.spill(ctx);
    };
    s.dropCarry = () => this.spill(ctx);
    s.railApi = {
      service: () => st.svs[st.key] || null,
      complete: (id) => st.svs.cold && st.svs.cold.complete(id),
    };
    const room = s.graph.room('pass');
    if (room) room.data.ambience = 'fs_pass';
  },

  use(ctx, spot) {
    const st = ctx.state;
    const s = ctx.scene;
    const sv = st.svs[spot.key];
    const r = sv.use(spot.id);
    switch (r.act) {
      case 'none':
        sfx('knock');
        if (r.line) s.floatText(spot.x, spot.y - 106, r.line, '#f2d580');
        break;
      case 'lay':
        sfx('crackle');
        break;
      case 'work':
      case 'scrape':
      case 'restock':
        ctx.player.pose('interact');
        st.tick = 0;
        break;
      default:
        sfx('click');
    }
  },

  spill(ctx) {
    const st = ctx.state;
    const sv = st.svs[st.key];
    if (!sv) return;
    const k = sv.spill();
    if (!k) return;
    const s = ctx.scene;
    sfx('crack');
    const stop = sv.stations[k.stops[k.idx]];
    s.floatText(ctx.player.x, ctx.player.y - 70, CALLS.spill, '#f2d580');
    if (stop) s.caption.say('jo', `The ${k.dish.toLowerCase()} is on the floor. Back to ${stop.label.toLowerCase()}.`, { ms: 2200 });
    const bit = s.add.image(st.plate.x, st.plate.y, st.plate.texture.key).setDepth(13);
    s.tweens.add({ targets: bit, y: bit.y + 40, angle: 120, alpha: 0, duration: 360, onComplete: () => bit.destroy() });
  },

  start(ctx, key) {
    const s = ctx.scene;
    const F = ctx.flags;
    const st = ctx.state;
    const def = SERVICES[key];
    const stock = def.stock ? { grill: def.stock.grill + (F.stock_grill || 0), sauce: def.stock.sauce + (F.stock_sauce || 0), larder: def.stock.larder + (F.stock_larder || 0) } : {};
    st.svs[key] = new Service({ ...def, difficulty: s.difficulty || 0, stock });
    return st.svs[key];
  },

  update(ctx, dt) {
    const s = ctx.scene;
    const F = ctx.flags;
    const st = ctx.state;
    const p = ctx.player;
    const now = s.time.now;
    // which service does this room play?
    const room = s.graph.room(s.roomId);
    let key = room && room.data.service;
    if (F.carry_out && !F.rail_dining) key = 'dining';
    const allowed = key && (ROOMS[key] || [key]).includes(s.roomId) && wants[key](F) && !F[`rail_${key}`];
    const was = st.key;
    st.key = allowed ? key : null;
    if (st.key !== was) st.enteredAt = now;
    // a breath on arrival: the place's name on the board, then the rail
    const settled = now - (st.enteredAt || 0) > 2200;
    const sv = st.key && settled ? st.svs[st.key] || this.start(ctx, st.key) : null;
    // the clock runs while nothing modal is up (verbs do not update under a box)
    if (sv && !sv.done) sv.update(dt);
    if (sv) for (const e of sv.drain()) this.onEvent(ctx, st.key, sv, e);
    // Jo's hands at work: held still, the bar over his head, a knock on the beat
    const w = sv && sv.working;
    if (w) {
      p.controlLockUntil = Math.max(p.controlLockUntil || 0, now + 60);
      p.body.setVelocityX(0);
      st.tick = (st.tick || 0) + dt;
      if (st.tick > 260) {
        st.tick = 0;
        sfx('clack');
        p.pose('interact');
      }
    }
    // the plate in his hands
    const held = sv && sv.hands;
    const carryOut = held && st.key === 'dining';
    p.carrying = !!held;
    p.walkOnly = !!carryOut;
    if (held) {
      const key2 = dishKey(s, held.dish);
      if (st.plate.texture.key !== key2) st.plate.setTexture(key2);
      const f = p.flipX ? -1 : 1;
      st.plate.setPosition(p.x + f * 24, p.y - 14).setVisible(true);
    } else st.plate.setVisible(false);
    // the prompts: what [E] will do here, or why not
    if (sv) {
      for (const sp of st.spots) {
        if (!sp.reg || sp.key !== st.key) continue;
        const plan = sv.plan(sp.id);
        sp.reg.item.prompt = this.promptFor(sv, sp, plan);
      }
    }
    // the rail on screen, and what it wants marked in the room
    if (st.hud) st.hud.render(sv && !sv.done ? sv.view() : null, now);
    st.world.clear();
    if (sv && !sv.done) this.drawMarks(ctx, sv, now);
    this.hudLines(ctx, sv);
  },

  promptFor(sv, sp, plan) {
    const d = sp.def;
    const dish = plan.ticket ? plan.ticket.dish.toLowerCase() : '';
    const verb = (d.verb || 'use').replace('{dish}', dish);
    switch (plan.act) {
      case 'serve':
      case 'work':
      case 'quick':
      case 'restock':
        return plan.ticket && plan.act !== 'serve' && d.kind !== 'quick' ? `${verb}: ${dish}` : verb;
      case 'lay':
        return verb;
      case 'collect':
        return `take the ${dish} off`;
      case 'scrape':
        return 'scrape the burnt pan';
      default:
        return plan.line || d.label;
    }
  },

  drawMarks(ctx, sv, now) {
    const st = ctx.state;
    const g = st.world;
    const bob = Math.sin(now / 160) * 3;
    const chev = (x, y, col) => {
      g.fillStyle(0x14122a, 0.8).fillTriangle(x - 12, y - 4, x + 12, y - 4, x, y + 12);
      g.fillStyle(col, 1).fillTriangle(x - 9, y - 2, x + 9, y - 2, x, y + 9);
    };
    const room = ctx.scene.roomId;
    for (const sp of st.spots) {
      if (sp.key !== st.key || sp.room !== room) continue;
      const plan = sv.plan(sp.id);
      const live = plan.act !== 'none';
      const y = sp.y - 150 + bob;
      if (sp.def.external) chev(sp.x, sp.y - 120 + bob, 0xe9b84a);
      else if (live) chev(sp.x, y, plan.act === 'serve' ? 0x7ac87a : plan.act === 'collect' ? 0x7ac87a : plan.act === 'scrape' ? 0xd5443c : 0xe9b84a);
      // the pans on the fire: a bar per slot over the station
      const pans = sv.stationState(sp.id);
      if (pans) {
        pans.forEach((pan, i) => {
          const x = sp.x - 38 + i * 42;
          const py = sp.y - 72;
          g.fillStyle(0x14122a, 0.85).fillRect(x, py, 34, 10);
          if (!pan) return;
          const col = pan.state === 'cooking' ? 0xe89a3a : pan.state === 'ready' ? (Math.floor(now / 180) % 2 ? 0x7ac87a : 0xc8f0c8) : 0xd5443c;
          const k = pan.state === 'ready' ? 1 - pan.frac : pan.state === 'burnt' ? 1 : pan.frac;
          g.fillStyle(col, 1).fillRect(x + 1, py + 1, 32 * k, 8);
          if (pan.state === 'burnt') for (let n = 0; n < 3; n++) g.fillStyle(0x24242c, 0.5).fillCircle(x + 8 + n * 9, py - 8 - (now / 40 + n * 13) % 24, 4 + n);
        });
      }
    }
    // the bar over Jo while he works
    const w = sv.working;
    if (w) {
      const p = ctx.player;
      const k = 1 - w.left / w.total;
      g.fillStyle(0x14122a, 0.9).fillRect(p.x - 26, p.y - 76, 52, 8);
      g.fillStyle(0xe9b84a, 1).fillRect(p.x - 25, p.y - 75, 50 * k, 6);
    }
  },

  hudLines(ctx, sv) {
    const F = ctx.flags;
    const st = ctx.state;
    const pk = Object.keys(ITEMS).filter((k) => F[k] && !(k === 'saffron' && F.saffron_used)).map((k) => ITEMS[k]);
    st.pocket.setText(F.apron && pk.length ? `POCKET: ${pk.join(', ')}` : '').setVisible(!!(F.apron && pk.length));
    if (st.key === 'line' && sv && !sv.done) {
      const row = (n, v) => `${n} ${Math.max(0, v)}`;
      st.stockLine.setText(`${row('FISH', sv.stock.grill)}  ${row('SAUCE', sv.stock.sauce)}  ${row('LARDER', sv.stock.larder)}`).setVisible(true);
    } else st.stockLine.setText('').setVisible(false);
    if (st.key === 'prep' && sv && !sv.done) {
      const left = Math.max(0, sv.limit - sv.t);
      st.doors.set(left / sv.limit).setLabel(`DOORS ${Math.ceil(left / 1000)}s`).setColor(left < 15000 ? '#d5443c' : '#e9b84a').setVisible(true);
    } else st.doors.setVisible(false);
  },

  onEvent(ctx, key, sv, e) {
    const s = ctx.scene;
    const F = ctx.flags;
    const st = ctx.state;
    const say = (npc, text) => {
      const n = s.npcs.get(npc);
      if (n) s.floatText(n.x, n.y - 104, text, '#f2e6cc');
    };
    switch (e.type) {
      case 'arrive':
        if (key === 'line' && !e.ticket.final) {
          sfx('bell');
          say('brann_line', CALLS.order(e.ticket.table, e.ticket.dish));
        } else if (e.ticket.final) {
          sfx('bell');
          s.beats.play('table1_called');
        } else sfx('tick');
        break;
      case 'sitting':
        s.music.setKey && s.music.setKey(`line${e.sitting}`);
        F.sitting = e.sitting;
        s.caption.say('marguerite', CALLS.sitting[e.sitting], { ms: 2000 });
        break;
      case 'laid':
        s.floatText(ctx.player.x, ctx.player.y - 70, 'On. Come back for it.', '#f2d580');
        break;
      case 'ready':
        sfx('tick');
        break;
      case 'burnt':
        sfx('hiss');
        s.floatText(ctx.player.x, ctx.player.y - 70, `The ${e.ticket.dish.toLowerCase()} is burning.`, '#e86a5a');
        break;
      case 'plated':
        if (key === 'pass') F.plate_finished = true;
        sfx('pickup');
        break;
      case 'stop':
        if (key === 'pass' && e.station === 'finish') s.beats.play('pick_finish');
        break;
      case 'amend':
        sfx('bell');
        s.caption.say('brann', `Table ${e.ticket.table} changed its mind. ${e.ticket.note}!`, { ms: 2400 });
        break;
      case 'refire':
        sfx('fail');
        F.late = (F.late || 0) + 1;
        say('brann_line', CALLS.refire(e.ticket.table));
        break;
      case 'bail':
        F.late = (F.late || 0) + 1;
        F.bails = (F.bails || 0) + 1;
        if (typeof e.ticket.table === 'number') F[`sent${e.ticket.table}`] = true;
        s.caption.say('marguerite', CALLS.bail(e.ticket.table), { ms: 2200 });
        break;
      case 'restocked':
        sfx('deliver');
        break;
      case 'served':
        this.served(ctx, key, sv, e);
        break;
      case 'timeup':
      case 'done':
        this.finish(ctx, key, sv);
        break;
      default:
    }
    void st;
  },

  served(ctx, key, sv, e) {
    const s = ctx.scene;
    const F = ctx.flags;
    const k = e.ticket;
    sfx('deliver');
    if (k.gives) for (const [n, v] of Object.entries(k.gives)) F[`stock_${n}`] = (F[`stock_${n}`] || 0) + v;
    if (key === 'prep') F.mise = (F.mise || 0) + 1;
    if (key === 'line') {
      if (k.final) {
        F.table1_sent = true;
        F.saffron_used = true;
        s.beats.play('table1_sent');
      } else {
        F.plates = (F.plates || 0) + 1;
        F[`sent${k.table}`] = true;
        // he tastes, he spikes it, the word
        const n = s.npcs.get('aurelio_window');
        if (n) {
          s.floatText(n.x, n.y - 104, e.clean ? 'Next.' : '...Next.', '#f2e6cc');
          s.tasteUntil = s.time.now + 700;
        }
        // a plate sent with time in hand: a tip on the pass
        if (e.clean && s.coinMgr) {
          const sp = ctx.state.spots.find((x) => x.key === 'line' && x.id === 'pass');
          s.coinMgr.spawn(sp.x - 26, sp.y - 40);
        }
      }
    }
    if (key === 'pass') {
      F.plate_shown = true;
      s.beats.play('hands');
    }
  },

  finish(ctx, key, sv) {
    const s = ctx.scene;
    const F = ctx.flags;
    if (F[`rail_${key}`]) return;
    F[`rail_${key}`] = true;
    ctx.player.carrying = false;
    if (key === 'pit') s.beats.play('pit_clear');
    if (key === 'prep') {
      F.mise_done = true;
      s.beats.play(sv.timedOut ? 'doors_late' : 'doors_ready');
    }
    if (key === 'dining') s.beats.play('set_down');
    s.saveRun();
  },
};
