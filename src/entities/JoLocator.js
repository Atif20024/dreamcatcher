// JoLocator (feedback 3, "think something better to show where our
// character is"): Jo carries no light. He is found by his drawing (outline,
// a 1 px rim, his costume) and, only when it helps, by a brief locator:
//
//  - pulse(reason): a small hat-shaped marker drops over his head and a thin
//    ring opens at his feet, both gone in about a second. Played on entering
//    a place or a room, after a respawn and on continuing a run.
//  - through foreground: while something drawn in front of him (a pillar, a
//    stall, a foreground layer) covers most of him, his silhouette shows
//    over it, flat and faint, like a figure seen through a screen.
//
// Nothing here is additive or permanent: no halo, no pool of light.
import Phaser from 'phaser';

export const LOCATOR = Object.freeze({
  enabled: true, // respawn, room entry, continuing a run, and through foreground
  ms: 1000, // the whole pulse
  gapMs: 1500, // two pulses closer than this are one
  markerColor: 0xf2e6cc, // cream: the lightest colour in the game (§9)
  inkColor: 0x14122a, // its outline
  ringAlpha: 0.55,
  silhouetteColor: 0xf2e6cc,
  silhouetteAlpha: 0.42,
  checkEvery: 8, // frames between occlusion checks
});

// the marker: a little brimmed hat, pointing down at him (12×9, outlined)
function ensureTexture(scene) {
  if (scene.textures.exists('jo-locator')) return;
  const rows = [
    '..########..',
    '..#cccccc#..',
    '..#cccccc#..',
    '..#cccccc#..',
    '############',
    '#cccccccccc#',
    '############',
    '.....##.....',
    '.....##.....',
  ];
  const ct = scene.textures.createCanvas('jo-locator', 12, rows.length);
  const ctx = ct.getContext();
  const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = hex(ch === 'c' ? LOCATOR.markerColor : LOCATOR.inkColor);
      ctx.fillRect(x, y, 1, 1);
    })
  );
  ct.refresh();
}

export default class JoLocator {
  constructor(scene, player) {
    this.scene = scene;
    this.p = player;
    this.log = [];
    this.lastAt = -1e9;
    this.frame = 0;
    this.occluded = false;
    this.occluder = null;
    ensureTexture(scene);
    const a = player.art;
    this.silhouette = scene.add.image(a.x, a.y, a.texture.key, a.frame.name).setTintFill(LOCATOR.silhouetteColor).setAlpha(0).setVisible(false);
    this.silhouette.dcLocator = true;
    this.parts = new Set([player, player.art, player.hat, player.tool, player.rim, ...(player.ink || []), this.silhouette]);
    this.player = player;
  }

  // the brief marker and ring
  // `room`: a room id; walking back into a room seen in the last 20 s
  // does not pulse again
  pulse(reason = 'enter', room = null) {
    const s = this.scene;
    const p = this.p;
    if (!s || !s.sys || !s.sys.isActive() || !p.art || !p.art.scene) return false;
    if (!LOCATOR.enabled && !this.forced) return false;
    const now = s.time.now;
    if (room !== null) {
      this.rooms ||= new Map();
      const seen = this.rooms.get(room);
      this.rooms.set(room, now);
      if (seen !== undefined && now - seen < 20000) return false;
    }
    if (now - this.lastAt < LOCATOR.gapMs) return false;
    this.lastAt = now;
    this.log.push({ reason, at: now });
    if (this.log.length > 16) this.log.shift();
    const f = p.feet();
    const top = p.art.getBounds().y;
    const depth = Math.max(p.art.depth + 2, 14);
    const mk = s.add.image(Math.round(f.x), Math.round(top - 16), 'jo-locator').setOrigin(0.5, 1).setScale(2).setDepth(depth).setAlpha(0);
    mk.dcLocator = true;
    const ring = s.add.ellipse(f.x, f.y, 28, 9).setStrokeStyle(2, LOCATOR.markerColor, 1).setDepth(p.art.depth - 0.2).setAlpha(LOCATOR.ringAlpha);
    ring.isFilled = false;
    ring.dcLocator = true;
    this.live = { mk, ring, dy: 0 };
    const follow = { t: 0 };
    s.tweens.add({ targets: mk, alpha: 1, duration: 140 });
    s.tweens.add({ targets: this.live, dy: -4, duration: 260, yoyo: true, repeat: 1, ease: 'sine.inout' });
    s.tweens.add({ targets: mk, alpha: 0, delay: LOCATOR.ms - 300, duration: 300 });
    s.tweens.add({ targets: ring, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: LOCATOR.ms * 0.8, ease: 'quad.out' });
    s.tweens.add({
      targets: follow,
      t: 1,
      duration: LOCATOR.ms,
      onComplete: () => {
        mk.destroy();
        ring.destroy();
        if (this.live && this.live.mk === mk) this.live = null;
      },
    });
    return true;
  }

  state() {
    return { log: this.log.map((l) => ({ ...l })), live: !!this.live, occluded: this.occluded, occluder: this.occluder ? this.occluder.texture && this.occluder.texture.key : null, silhouette: this.silhouette.visible };
  }

  // per frame, from the player's sync: the marker follows his head; the
  // silhouette follows his frame
  sync() {
    const p = this.p;
    const a = p.art;
    if (this.live && this.live.mk.scene) {
      const f = p.feet();
      this.live.mk.setPosition(Math.round(f.x), Math.round(a.getBounds().y - 14 + this.live.dy));
      this.live.ring.setPosition(f.x, f.y);
    }
    if (++this.frame % LOCATOR.checkEvery === 0) this.checkOcclusion();
    const sil = this.silhouette;
    if (!sil.scene) return;
    const on = this.occluded && p.shown && a.visible && a.alpha > 0.5;
    if (on) {
      if (sil.texture.key !== a.texture.key || sil.frame.name !== a.frame.name) sil.setTexture(a.texture.key, a.frame.name);
      sil.setOrigin(a.originX, a.originY).setPosition(a.x, a.y).setScale(a.scaleX, a.scaleY).setFlipX(a.flipX).setAngle(a.angle);
      sil.setDepth(Math.min(95, (this.occluder ? this.occluder.depth : a.depth) + 0.01)).setAlpha(LOCATOR.silhouetteAlpha * a.alpha);
    }
    sil.setVisible(on);
  }

  // is most of him behind something drawn in front of him?
  checkOcclusion() {
    if (!LOCATOR.enabled && !this.forced) {
      this.occluded = false;
      return;
    }
    const s = this.scene;
    const p = this.p;
    const a = p.art;
    if (!s || !s.children || !a.visible || !p.shown) {
      this.occluded = false;
      return;
    }
    const f = p.feet();
    const pts = [
      { x: f.x, y: f.y - 66 },
      { x: f.x, y: f.y - 42 },
      { x: f.x, y: f.y - 20 },
    ];
    let best = null;
    let hits = 0;
    const covered = [false, false, false];
    for (const o of s.children.list) {
      if (this.parts.has(o) || o.dcLocator || o.dcJoLight) continue;
      if (!o.visible || o.alpha < 0.4 || o.depth <= a.depth + 0.5 || o.depth >= 100) continue;
      if (o.scrollFactorX !== 1 || !o.frame || !o.texture || o.isDCText || o.type === 'BitmapText') continue;
      if (o.angle || o.blendMode === Phaser.BlendModes.ADD) continue;
      const w = o.displayWidth;
      const h = o.displayHeight;
      if (w < 24 || h < 24) continue;
      const x0 = o.x - o.displayOriginX * o.scaleX;
      const y0 = o.y - o.displayOriginY * o.scaleY;
      pts.forEach((pt, i) => {
        if (covered[i]) return;
        if (pt.x < x0 || pt.x >= x0 + w || pt.y < y0 || pt.y >= y0 + h) return;
        let lx = Math.floor((pt.x - x0) / o.scaleX);
        const ly = Math.floor((pt.y - y0) / o.scaleY);
        if (o.flipX) lx = o.frame.width - 1 - lx;
        let al = 0;
        try {
          al = s.textures.getPixelAlpha(lx, ly, o.texture.key, o.frame.name) || 0;
        } catch {
          al = 0; // a texture with no readable source: not counted
        }
        if (al > 160) {
          covered[i] = true;
          hits += 1;
          if (!best || o.depth > best.depth) best = o;
        }
      });
      if (hits === 3) break;
    }
    this.occluded = hits >= 2;
    this.occluder = this.occluded ? best : null;
  }
}
