import Phaser from 'phaser';
import { EV } from '../../data/evening/map.js';
import { isSolidChar, roleOf, slopeSurface } from '../../builders/legend.js';

// THE LONG EVENING — the world's furniture and the ground queries every
// walker in it uses. Split out of EveningScene so the scene can be read as
// the evening rather than as a list of benches.
const T = 32;
const px = (t) => t * T + T / 2;

// zone tints multiply the pale limestone into a place (then the sky's
// ambient light multiplies that into the time of evening)
const ZONES = [
  [0, 52, 0xfff0dc],
  [52, 82, 0xfff0dc],
  [82, 114, 0xe8f0cc],
  [114, 342, 0xfff0dc],
  [342, 376, 0xe0ecc4],
  [376, 458, 0xf4eadc],
  [458, 488, 0xfff0dc],
  [488, 548, 0xf0e8c0],
  [548, 578, 0xe0e8d8],
  [578, 608, 0xd8dcd0],
  [608, 638, 0xc8d4c0],
  [638, 788, 0xc8d0dc],
];
export function zoneTint(tx) {
  for (const [a, b, c] of ZONES) if (tx >= a && tx < b) return c;
  return 0xffffff;
}

export const mulC = (a, b) => {
  const r = (((a >> 16) & 255) * ((b >> 16) & 255)) / 255;
  const g = (((a >> 8) & 255) * ((b >> 8) & 255)) / 255;
  const bl = ((a & 255) * (b & 255)) / 255;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};

// --- ground queries ---------------------------------------------------------------
export function makeGround(built) {
  const charAt = built.charAt;
  const H = built.height;
  const walkable = (ch) => isSolidChar(ch) || roleOf(ch) === 'oneway';
  // the surface under x, at or below fromY: slopes, solids, planks
  const groundY = (x, fromY) => {
    const tx = Math.floor(x / T);
    let ty = Math.max(0, Math.floor(fromY / T));
    for (; ty < H; ty++) {
      const ch = charAt(tx, ty);
      const role = roleOf(ch);
      if (role.startsWith('slope')) return ty * T + slopeSurface(role, x / T - tx) * T;
      if (walkable(ch)) return ty * T;
    }
    return H * T;
  };
  // the exposed upward faces of a column: where snow settles and rain lands
  const topsByCol = [];
  for (let tx = 0; tx < built.width; tx++) {
    const list = [];
    for (let ty = 1; ty < H; ty++) {
      const ch = charAt(tx, ty);
      const above = charAt(tx, ty - 1);
      const role = roleOf(ch);
      if (role.startsWith('slope')) {
        list.push({ tx, ty, x: tx * T + T / 2, y: ty * T + T / 2, slope: role === 'slope_r' ? 'r' : role === 'slope_l' ? 'l' : 'r' });
      } else if (walkable(ch) && !walkable(above) && !roleOf(above).startsWith('slope') && roleOf(above) !== 'liquid' && ch !== 'B') {
        list.push({ tx, ty, x: tx * T + T / 2, y: ty * T, slope: null });
      }
    }
    topsByCol.push(list);
  }
  const tops = (tx0, tx1) => {
    const out = [];
    for (let tx = Math.max(0, tx0); tx <= Math.min(built.width - 1, tx1); tx++) out.push(...topsByCol[tx]);
    return out;
  };
  // undersides that drip in the rain: a solid with air under it
  const drips = [];
  const water = [];
  for (let tx = 0; tx < built.width; tx++) {
    for (let ty = 1; ty < H - 1; ty++) {
      const ch = charAt(tx, ty);
      if (isSolidChar(ch) && charAt(tx, ty + 1) === '.' && ch !== 'B') drips.push({ x: tx * T + Phaser.Math.Between(4, 28), y: (ty + 1) * T });
      if (ch === '~' && charAt(tx, ty - 1) !== '~') water.push({ x: tx * T, y: ty * T + 6 });
    }
  }
  const pickIn = (list, cam) => {
    const x0 = cam.scrollX - 40;
    const x1 = cam.scrollX + cam.width + 40;
    const y0 = cam.scrollY;
    const y1 = cam.scrollY + cam.height;
    for (let i = 0; i < 8; i++) {
      const e = list[Math.floor(Math.random() * list.length)];
      if (e && e.x > x0 && e.x < x1 && e.y > y0 && e.y < y1) return e;
    }
    return null;
  };
  // the first surface a raindrop falling at x meets, from the top of the view
  const surfaceFrom = (x, y) => {
    const tx = Math.floor(x / T);
    for (let ty = Math.max(0, Math.floor(y / T)); ty < H; ty++) {
      const ch = charAt(tx, ty);
      if (walkable(ch) || ch === '~' || roleOf(ch).startsWith('slope')) return ty * T + (roleOf(ch).startsWith('slope') ? T / 2 : 0);
    }
    return null;
  };
  return {
    groundY,
    tops,
    edges: (cam) => pickIn(drips, cam),
    water: (cam) => {
      const w = pickIn(water, cam);
      return w ? { x: w.x + Phaser.Math.Between(0, 30), y: w.y } : null;
    },
    surfaceFrom,
  };
}

// --- the tile images, bucketed by column so the night can be painted on
// them a few dozen columns at a time --------------------------------------------
export function bucketTerrain(scene) {
  const cols = [];
  for (const o of scene.children.list) {
    if (!o.texture || !o.texture.key || !o.texture.key.startsWith('eve_')) continue;
    const tx = Math.floor(o.x / T);
    o.baseTint = o.tintTopLeft;
    o.zone = zoneTint(tx);
    (cols[tx] ||= []).push(o);
  }
  return cols;
}

// ---------------------------------------------------------------------------------
// the furniture: everything in the town that isn't alive
// ---------------------------------------------------------------------------------
export function buildWorld(scene, objects) {
  const g = (x) => scene.groundY(x, 0);
  const out = { benches: [], doors: [], awnings: [], puddles: [], lamps: [], carry: [], anchors: [], marks: {}, shallows: null, hedge: [], swing: null, lakeglass: null };
  const stand = (key, o, depth = -11, dy = 0) => {
    const x = o.wx;
    const y = scene.groundY(x, o.wy - 64) + dy;
    return scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(depth);
  };
  for (const o of objects) {
    switch (o.type) {
      case 'arch': {
        const arch = stand('ev-arch', o, 11.6);
        // the doorway he came through: dark, until he steps out of it
        const door = scene.add.rectangle(o.wx, arch.y - 44, 40, 86, 0x07060c, 1).setDepth(11.4);
        out.arch = { arch, door, x: o.wx };
        break;
      }
      case 'sign': {
        const y = scene.groundY(o.wx, o.wy - 64);
        scene.add.rectangle(o.wx, y - 20, 4, 40, 0x6a4a32).setDepth(6);
        const w = o.text.length * 7 + 16;
        scene.add.rectangle(o.wx, y - 40, w, 18, 0xe8dcc0).setDepth(6).setStrokeStyle(2, 0x6a4a32).setAngle(-2);
        scene.add.text(o.wx, y - 40, o.text, { fontFamily: 'monospace', fontSize: '11px', color: '#3a2a22' }).setOrigin(0.5).setDepth(6.1).setAngle(-2);
        break;
      }
      case 'bench': {
        const img = stand('ev-bench', o, 7);
        out.benches.push({ id: o.id, x: o.wx, y: img.y, img });
        break;
      }
      case 'wall_seat': {
        const y = scene.groundY(o.wx, o.wy - 64);
        scene.add.rectangle(o.wx, y - 10, 44, 20, 0xc8b898).setDepth(-10.5).setStrokeStyle(1, 0xa8987a);
        out.marks.wall_seat = { x: o.wx, y };
        break;
      }
      case 'tree': {
        const key = o.kind === 'pine' ? 'ev-pine' : 'ev-tree';
        const t = stand(key, o, -11.2);
        if (o.kind === 'hilltree') t.setScale(1.5);
        if (o.kind === 'apple') {
          // apples in the canopy, a couple on the ground
          for (let i = 0; i < 7; i++) scene.add.image(o.wx + Phaser.Math.Between(-36, 36), t.y - Phaser.Math.Between(40, 72), 'ev-apple').setDepth(-11.1);
          scene.add.image(o.wx + 20, t.y - 2, 'ev-apple').setDepth(6);
        }
        // canopy sway: slow, from the trunk
        t.setOrigin(0.5, 1);
        scene.tweens.add({ targets: t, angle: { from: -0.6, to: 0.6 }, duration: 3200 + Math.random() * 1500, yoyo: true, repeat: -1, ease: 'sine.inout' });
        if (o.kind === 'pine' && o.tx >= 638) {
          // snow on the pine road's boughs
          scene.add.rectangle(o.wx, t.y - 58, 22, 3, 0xf2f6ff, 0.9).setDepth(-11.05);
          scene.add.rectangle(o.wx, t.y - 38, 34, 3, 0xf2f6ff, 0.8).setDepth(-11.05);
        }
        out.marks[`tree_${o.tx}`] = t;
        break;
      }
      case 'swing': {
        const y = scene.groundY(o.wx, o.wy - 64);
        const pivot = { x: o.wx, y: y - 66 };
        const rope = scene.add.graphics().setDepth(6);
        const seat = scene.add.rectangle(pivot.x, pivot.y + 50, 22, 4, 0x6a4a32).setDepth(6.2);
        out.swing = { pivot, rope, seat, x: o.wx, angle: 0, v: 0 };
        out.anchors.push({ id: 'swing', x: o.wx, y: y - 10 });
        break;
      }
      case 'fence':
        stand('ev-fence', o, 6);
        break;
      case 'post':
        stand('ev-post', o, -10.6);
        break;
      case 'line': {
        const x0 = o.wx;
        const x1 = px(o.to);
        const y = o.wy;
        const lineG = scene.add.graphics().setDepth(-10.55);
        out.laundry = { x0, x1, y, lineG, sheets: [], mid: (x0 + x1) / 2, half: (x1 - x0) / 2 };
        break;
      }
      case 'door': {
        const img = stand('ev-door', o, -10.8);
        out.doors.push({ id: o.id, x: o.wx, img });
        break;
      }
      case 'awning': {
        const img = scene.add.image(o.wx, o.wy + 8, 'ev-awning').setDepth(8).setOrigin(0.5, 0).setScale((o.w || 4) / 4.5, 1);
        out.awnings.push({ x0: o.wx - (o.w || 4) * 16, x1: o.wx + (o.w || 4) * 16, y: o.wy, img });
        break;
      }
      case 'fountain': {
        const f = stand('ev-fountain', o, 7);
        out.fountain = { x: o.wx, y: f.y, img: f };
        // the water that works
        scene.time.addEvent({
          delay: 90,
          loop: true,
          callback: () => {
            if (!scene.cameras.main.worldView.contains(o.wx, f.y - 20)) return;
            const d = scene.add.circle(o.wx + Phaser.Math.Between(-2, 2), f.y - 36, 1.5, 0xc8e0f0, 0.9).setDepth(7.1);
            scene.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-22, 22), y: f.y - 16, alpha: 0.2, duration: 700, ease: 'quad.in', onComplete: () => d.destroy() });
          },
        });
        break;
      }
      case 'chess': {
        const c = stand('ev-chess', o, 7);
        out.chess = { x: o.wx, y: c.y };
        break;
      }
      case 'bakery': {
        const b = stand('ev-bakery', o, -11);
        out.bakery = { x: o.wx, y: b.y };
        scene.add.text(o.wx - 20, b.y - 52, 'BREAD', { fontFamily: 'monospace', fontSize: '10px', color: '#3a2a22' }).setOrigin(0.5).setDepth(-10.9);
        break;
      }
      case 'step': {
        out.marks.bakery_step = { x: o.wx, y: scene.groundY(o.wx, o.wy - 64) };
        break;
      }
      case 'postbox': {
        const p = stand('ev-postbox', o, 7);
        out.anchors.push({ id: 'postbox', x: o.wx, y: p.y - 20 });
        break;
      }
      case 'teastall':
        stand('ev-teastall', o, -10.7);
        break;
      case 'lamp': {
        const l = stand('ev-lamp', o, -10.6);
        const glow = scene.add.image(o.wx, l.y - 76, 'ev-glow').setDepth(-10.55).setScale(3).setTint(0xf8d890).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
        out.lamps.push({ x: o.wx, y: l.y - 76, glow });
        break;
      }
      case 'narrowboat': {
        const b = scene.add.image(o.wx, o.wy + 34, 'ev-narrowboat').setOrigin(0.5, 1).setDepth(-9.2);
        scene.tweens.add({ targets: b, y: b.y + 1.5, duration: 2600, yoyo: true, repeat: -1, ease: 'sine.inout' });
        break;
      }
      case 'shallows': {
        // the sea reaches this far: ankle-deep, and it can't hurt anyone
        const y = scene.groundY(o.wx, o.wy - 32);
        const w = (o.w || 5) * T;
        const x0 = o.wx - T / 2;
        scene.add.rectangle(x0 + w / 2, y + 4, w, 8, 0xe8d8a8).setDepth(-9.6);
        const water = scene.add.rectangle(x0 + w / 2, y - 4, w, 9, 0x88b8d8, 0.55).setDepth(12.6);
        scene.tweens.add({ targets: water, alpha: 0.4, duration: 1800, yoyo: true, repeat: -1 });
        out.shallows = { x0, x1: x0 + w, y, water };
        break;
      }
      case 'bikestall':
        stand('ev-bikestall', o, -10.7);
        break;
      case 'cart': {
        const c = stand('ev-cart', o, 7);
        // always about to roll: it creaks forward a pixel and thinks better of it
        scene.tweens.add({ targets: c, x: c.x + 2, duration: 900, yoyo: true, repeat: -1, repeatDelay: 5000, ease: 'sine.inout' });
        break;
      }
      case 'railing': {
        const rg = scene.add.graphics().setDepth(-10.4);
        rg.lineStyle(2, 0x3a3a44, 0.9);
        for (let c = o.tx; c <= o.to; c++) {
          const x = px(c);
          const y = scene.groundY(x, 0) - 26;
          rg.lineBetween(x, y, x, y + 24);
          if (c < o.to) {
            const x2 = px(c + 1);
            rg.lineBetween(x, y, x2, scene.groundY(x2, 0) - 26);
          }
        }
        break;
      }
      case 'loft':
        stand('ev-loft', o, -10.7);
        break;
      case 'tank':
        stand('ev-tank', o, -10.7);
        break;
      case 'chillies': {
        const y = scene.groundY(o.wx, o.wy - 64);
        scene.add.rectangle(o.wx - 20, y - 16, 2, 32, 0x6a4a32).setDepth(6);
        scene.add.rectangle(o.wx + 20, y - 16, 2, 32, 0x6a4a32).setDepth(6);
        scene.add.image(o.wx, y - 30, 'ev-chillies').setDepth(6.1).setOrigin(0.5, 0);
        break;
      }
      case 'charpoy':
        stand('ev-charpoy', o, 7);
        break;
      case 'radio': {
        const y = scene.groundY(o.wx, o.wy - 64);
        scene.add.rectangle(o.wx, y - 34, 26, 30, 0x4a3a44).setDepth(-10.7);
        scene.add.image(o.wx, y - 20, 'ev-radio').setDepth(-10.6);
        out.marks.radio = { x: o.wx, y: y - 20 };
        break;
      }
      case 'yardgate': // the school gate: a railing, not a level gate
        stand('ev-gate', o, -10.6);
        if (o.id === 'school_gate') out.marks.school_gate = { x: o.wx };
        break;
      case 'hopscotch': {
        const y = scene.groundY(o.wx, o.wy - 64);
        const hg = scene.add.graphics().setDepth(-9.5);
        hg.lineStyle(1, 0xf2ece0, 0.7);
        for (let i = 0; i < 6; i++) hg.strokeRect(o.wx - 40 + i * 14, y - 3, 12, 5);
        break;
      }
      case 'swingset': {
        stand('ev-swingset', o, -10.6);
        break;
      }
      case 'carry': {
        const key = { ball: 'ev-ball', can: 'ev-can', stick: 'ev-stick' }[o.item];
        const img = stand(key, o, 9);
        out.carry.push({ item: o.item, img });
        break;
      }
      case 'greenhouse':
        stand('ev-greenhouse', o, -10.8);
        out.marks.greenhouse = { x0: o.wx - 40, x1: o.wx + 40 };
        break;
      case 'plots': {
        const y = scene.groundY(o.wx, o.wy - 64);
        const pg = scene.add.graphics().setDepth(-9.5);
        for (let i = 0; i < (o.w || 8); i++) {
          const x = o.wx + i * T - T / 2;
          pg.fillStyle(0x5a3a28, 1).fillRect(x + 2, y - 4, 28, 4);
          for (let k = 0; k < 4; k++) pg.fillStyle(i % 2 ? 0x6a9a4a : 0x8ab85a, 1).fillRect(x + 4 + k * 7, y - 9 - (k % 2) * 3, 4, 6);
        }
        break;
      }
      case 'hive':
        stand('ev-hive', o, 7);
        break;
      case 'scarecrow': {
        const s = stand('ev-scarecrow', o, -10.6);
        scene.tweens.add({ targets: s, angle: { from: -1.5, to: 1.5 }, duration: 2600, yoyo: true, repeat: -1, ease: 'sine.inout' });
        break;
      }
      case 'shed':
        stand('ev-shed', o, -10.8);
        out.marks.shed = { x0: o.wx - 24, x1: o.wx + 24 };
        break;
      case 'camera': {
        const y = scene.groundY(o.wx, o.wy - 64);
        const img = scene.add.image(o.wx + 8, y - 16, 'ev-camera').setDepth(7.2);
        out.camera = { x: o.wx, y: y - 16, img };
        break;
      }
      case 'board': {
        const b = stand('ev-board', o, -10.4);
        const txt = scene.add.text(o.wx, b.y - 38, '— — —', { fontFamily: 'monospace', fontSize: '12px', color: '#f2e6cc' }).setOrigin(0.5).setDepth(-10.3);
        out.board = { x: o.wx, y: b.y, txt };
        break;
      }
      case 'hedge': {
        for (const tx of EV.HEDGE) {
          for (let ty = 21; ty <= 26; ty++) {
            const h = scene.add.image(px(tx), px(ty), 'ev-hedge').setDepth(-9.8).setScale(1.12);
            h.tx = tx;
            out.hedge.push(h);
          }
        }
        break;
      }
      case 'tufts': {
        // deterministic, not random: the two meadows must grow the very same
        // grass or the wrap between them would show
        const tuftG = [];
        for (let i = 0; i < (o.w || 10) * 2; i++) {
          const x = o.wx - T / 2 + i * 16 + ((i * 37) % 10);
          const y = scene.groundY(x, o.wy - 64);
          if (y > o.wy + 64) continue;
          const t = scene.add.rectangle(x, y, 2, 7 + ((i * 13) % 8), i % 3 ? 0x7a9a4a : 0x9ab85a, 0.95).setOrigin(0.5, 1).setDepth(i % 4 === 0 ? 13.5 : 8.5);
          t.ph = (i * 1.7) % 6.28;
          tuftG.push(t);
        }
        (out.tufts ||= []).push(...tuftG);
        break;
      }
      case 'wheat': {
        for (let i = 0; i < (o.w || 10) * 3; i++) {
          const x = o.wx - T / 2 + i * 11 + Phaser.Math.Between(0, 6);
          const y = scene.groundY(x, o.wy - 64);
          const w = scene.add.image(x, y, 'ev-wheat').setOrigin(0.5, 1).setDepth(i % 3 === 0 ? 13.4 : 8.4);
          w.ph = Math.random() * 6;
          (out.tufts ||= []).push(w);
        }
        break;
      }
      case 'tractor':
        stand('ev-tractor', o, -10.6);
        break;
      case 'horsecart':
        stand('ev-horsecart', o, -10.6);
        break;
      case 'lakeglass': {
        const lg = scene.add.graphics().setDepth(-9.05);
        out.lakeglass = { x0: o.wx - T / 2, x1: o.wx - T / 2 + (o.w || 12) * T, y: px(32) - T / 2 + 6, g: lg };
        break;
      }
      case 'rowboat': {
        const b = scene.add.image(o.wx, o.wy + 34, 'ev-rowboat').setOrigin(0.5, 1).setDepth(-9);
        scene.tweens.add({ targets: b, y: b.y + 1, duration: 2200, yoyo: true, repeat: -1, ease: 'sine.inout' });
        out.rowboat = { img: b, home: o.wx, y: b.y };
        break;
      }
      case 'mill': {
        const m = stand('ev-mill', o, -10.8);
        const wheel = scene.add.image(o.wx + 36, m.y - 22, 'ev-wheel').setDepth(-10.7);
        scene.tweens.add({ targets: wheel, angle: 360, duration: 14000, repeat: -1 });
        break;
      }
      case 'fire': {
        stand('ev-firering', o, 7);
        const y = scene.groundY(o.wx, o.wy - 64);
        const flames = [0, 1, 2].map((i) =>
          scene.add.triangle(o.wx - 6 + i * 6, y - 10, 0, 10, 6, 10, 3, 0, [0xf2a040, 0xf8d060, 0xe86a3a][i], 0.9).setDepth(7.1).setOrigin(0.5, 1)
        );
        flames.forEach((f, i) => scene.tweens.add({ targets: f, scaleY: { from: 0.7, to: 1.35 }, duration: 180 + i * 60, yoyo: true, repeat: -1 }));
        const glow = scene.add.image(o.wx, y - 12, 'ev-glow').setScale(4).setTint(0xf2a040).setAlpha(0.5).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: glow, alpha: 0.35, duration: 300, yoyo: true, repeat: -1 });
        out.fire = { x: o.wx, y };
        break;
      }
      case 'cairn':
        stand('ev-cairn', o, 7);
        break;
      case 'spot':
      case 'mark':
        out.marks[o.id] = { x: o.wx, y: scene.groundY(o.wx, o.wy - 64) };
        break;
      case 'activity':
        out.anchors.push({ id: o.id, x: o.wx, y: scene.groundY(o.wx, o.wy - 64) - 20 });
        break;
      case 'puddle': {
        const y = scene.groundY(o.wx, o.wy - 64);
        const pg = scene.add.graphics().setDepth(-9.3);
        out.puddles.push({ x: o.wx, y: y + 1, w: (o.w || 2) * T * 0.8, g: pg, size: 0.15 });
        break;
      }
      default:
        break;
    }
  }
  return out;
}

// the old viaduct's piers over both meadows (identical, so the wrap can't be
// seen), the pillars under the station deck, and the snow that lies all
// year on the high road
export function buildArchitecture(scene) {
  const top = (EV.DECK + 2) * T;
  const bottom = EV.GROUND * T;
  const pier = (x) => {
    scene.add.rectangle(x, (top + bottom) / 2, 22, bottom - top, 0xb8a888).setDepth(-10.6).setStrokeStyle(1, 0x9a8a6a);
    scene.add.rectangle(x, top + 4, 34, 8, 0xc8b898).setDepth(-10.55);
  };
  for (let c = 0; c < EV.BUF; c++) if (c % 13 === 6) pier(px(c));
  for (let c = EV.E0; c < EV.R0; c++) if ((c - EV.E0) % 13 === 6) pier(px(c));
  for (let c = 378; c < 402; c += 6) pier(px(c));
  // permanent snow on the high road's upward faces
  for (const t of scene.ground.tops(638, EV.W - 1)) {
    if (Math.random() < 0.55) {
      scene.add
        .rectangle(t.x + Phaser.Math.Between(-6, 6), t.y, Phaser.Math.Between(12, 30), Phaser.Math.Between(2, 4), 0xf2f6ff, 0.9)
        .setOrigin(0.5, 1)
        .setDepth(-9.4)
        .setAngle(t.slope === 'r' ? -45 : t.slope === 'l' ? 45 : 0);
    }
  }
}
