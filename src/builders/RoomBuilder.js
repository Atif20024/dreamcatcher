import Phaser from 'phaser';
import { roleOf, isSolidChar, isSlopeChar, SLOPES } from './legend.js';
import { buildTileset, maskAt, wearAt } from './autotile.js';
import { buildSupportTextures, addSupports } from './supports.js';

const T = 32;

// D2/D3 — one generic builder for every dream. Rooms are laid out left to
// right; each room's objects use room-local tile coords and are offset here.
export default class RoomBuilder {
  // rooms: array of room objects (see data/<dream>/rooms.js)
  // theme: { key, tiles, palette, support, hazardTint }
  static build(scene, rooms, theme) {
    buildTileset(scene, theme.key, theme.tiles, theme.palette);
    const sc = theme.supportColors || [0x3a3a44, 0x6a6e7a];
    buildSupportTextures(scene, theme.key, theme.support || 'bracket', sc[0], sc[1]);

    // 1. stitch rooms into one world grid
    let width = 0;
    let height = 0;
    for (const r of rooms) {
      r._x0 = width;
      width += Math.max(...r.grid.map((g) => g.length));
      height = Math.max(height, r.grid.length);
    }
    const rows = Array.from({ length: height }, () => new Array(width).fill('.'));
    for (const r of rooms) {
      r.grid.forEach((line, y) => {
        [...line].forEach((ch, x) => {
          rows[y][r._x0 + x] = ch;
        });
      });
    }
    const charAt = (tx, ty) => (rows[ty] && rows[ty][tx]) || '.';
    const solidAt = (tx, ty) => isSolidChar(charAt(tx, ty));

    // 2. terrain
    const out = {
      width,
      height,
      worldW: width * T,
      worldH: height * T,
      charAt,
      solidAt,
      solids: scene.physics.add.staticGroup(),
      oneWays: scene.physics.add.staticGroup(),
      hazards: scene.physics.add.staticGroup(),
      ladders: [],
      climbGrid: {},
      slopeGrid: {},
      surfaceGrid: {},
      looseGrid: {},
      objects: [],
      gateTiles: {},
      rooms,
    };

    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        const ch = charAt(tx, ty);
        const role = roleOf(ch);
        if (role === 'empty') continue;
        const cx = tx * T + T / 2;
        const cy = ty * T + T / 2;
        const wear = wearAt(tx, ty);

        if (isSlopeChar(ch)) {
          scene.add.image(cx, cy, `${theme.key}_sl_${role}_${wear}`).setDepth(4);
          (out.slopeGrid[ty] ||= {})[tx] = role;
          continue;
        }
        if (role === 'oneway') {
          const img = scene.add.image(cx, cy - T / 2 + 6, `${theme.key}_ow_${(tx + ty) % 4}`);
          scene.physics.add.existing(img, true);
          img.body.setSize(T, 12).setOffset(0, 0);
          img.body.checkCollision.down = false;
          img.body.checkCollision.left = false;
          img.body.checkCollision.right = false;
          out.oneWays.add(img);
          continue;
        }
        if (role === 'hazard') {
          const img = scene.add.image(cx, cy + 4, `${theme.key}_hazard`).setDepth(5);
          scene.physics.add.existing(img, true);
          img.body.setSize(24, 16).setOffset(4, 16);
          out.hazards.add(img);
          continue;
        }
        if (role === 'ladder') {
          scene.add.image(cx, cy, `${theme.key}_ladder`).setDepth(4);
          out.ladders.push({ tx, ty, x: cx, y: cy });
          continue;
        }
        if (role === 'liquid') {
          scene.add.rectangle(cx, cy, T, T, theme.liquid || 0x4a2c1a, 0.9).setDepth(4);
          scene.add.rectangle(cx, cy - 10, T, 6, theme.liquidTop || 0x6a4028, 0.9).setDepth(5);
          (out.surfaceGrid[ty] ||= {})[tx] = 'liquid';
          continue;
        }

        // solid family (includes climbable, loose, gate, conveyors, ice, grease)
        const mask = maskAt(solidAt, tx, ty);
        let tex = `${theme.key}_s_${mask}_${wear}`;
        if (role === 'climbable') tex = `${theme.key}_climb`;
        const img = scene.add.image(cx, cy, tex).setDepth(4);
        if (role === 'ice') img.setTint(0x9ac4dc);
        if (role === 'grease') img.setTint(0x4a5060);
        if (role === 'loose') img.setTint(0xc0a880);
        if (role === 'gate') img.setTint(0xa05a4a);
        if (role === 'conveyor_r' || role === 'conveyor_l') img.setTint(0xd8b858);
        scene.physics.add.existing(img, true);
        out.solids.add(img);
        img.tileRole = role;
        img.tx = tx;
        img.ty = ty;

        if (role === 'climbable') (out.climbGrid[ty] ||= {})[tx] = true;
        if (role === 'ice' || role === 'grease') (out.surfaceGrid[ty] ||= {})[tx] = role;
        if (role === 'conveyor_r') (out.surfaceGrid[ty] ||= {})[tx] = 'conveyor_r';
        if (role === 'conveyor_l') (out.surfaceGrid[ty] ||= {})[tx] = 'conveyor_l';
        if (role === 'loose') (out.looseGrid[ty] ||= {})[tx] = img;
        if (role === 'gate') {
          const gid = RoomBuilder.gateIdAt(rooms, tx, ty);
          (out.gateTiles[gid] ||= []).push(img);
        }
      }
    }

    // 3. auto-supports for anything that reads as floating
    addSupports(scene, {
      key: theme.key,
      T,
      width,
      height,
      isSolid: solidAt,
      needsSupport: (tx, ty) => {
        const ch = charAt(tx, ty);
        const role = roleOf(ch);
        if (role !== 'solid' && role !== 'oneway') return false;
        if (solidAt(tx, ty + 1)) return false;
        // a lone floor row at the world's base doesn't need legs
        return ty < height - 2;
      },
    });

    // 4. objects, offset into world coords
    for (const r of rooms) {
      for (const o of r.objects || []) {
        out.objects.push({
          ...o,
          room: r.id,
          section: r.section,
          tx: o.x + r._x0,
          ty: o.y,
          wx: (o.x + r._x0) * T + T / 2,
          wy: o.y * T + T / 2,
        });
      }
    }

    return out;
  }

  static gateIdAt(rooms, tx, ty) {
    for (const r of rooms) {
      for (const o of r.objects || []) {
        if (o.type === 'gate' && Math.abs(o.x + r._x0 - tx) <= 1 && Math.abs(o.y - ty) <= 3) return o.id;
      }
    }
    return `g_${tx}`;
  }

  // Which room contains this world x?
  static roomAt(rooms, worldX) {
    const tx = Math.floor(worldX / T);
    let best = rooms[0];
    for (const r of rooms) if (r._x0 <= tx) best = r;
    return best;
  }
}
