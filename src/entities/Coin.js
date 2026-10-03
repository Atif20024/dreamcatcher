import Phaser from 'phaser';
import { createPixelTexture } from '../utils/pixelart.js';
import { coinSfx, sfx } from '../systems/audio.js';
import { addCoins, deductWorth } from '../systems/wallet.js';
import { D } from '../builders/depths.js';

// Collectibles §8 — the coin. One sprite per dream (dreams.js `coin.pal`),
// 4-frame spin, bob, a 1-tile magnet, and a rising combo stinger. Scenes use
// the CoinManager: spawn(x, y), scatter(x, y, n) on death, update(time, dt).
const SPIN = [
  ['.ccccc.', 'cCCCCCc', 'cCChCCc', 'cCChCCc', 'cCCCCCc', '.ccccc.'],
  ['..ccc..', '.cCCCc.', '.cChCc.', '.cChCc.', '.cCCCc.', '..ccc..'],
  ['...c...', '...cc..', '...ch..', '...ch..', '...cc..', '...c...'],
  ['..ccc..', '.cCCCc.', '.cChCc.', '.cChCc.', '.cCCCc.', '..ccc..'],
];

export function createCoinTextures(scene, dreamId, pal) {
  SPIN.forEach((rows, i) => createPixelTexture(scene, `coin-${dreamId}-${i}`, rows, pal, 3));
}

const SHARD = { rows: ['...s...', '..sSs..', '.sSHSs.', 'sSHHHSs', '.sSHSs.', '..sSs..', '...s...'], pal: { s: 0x4a8a9a, S: 0x7ec8d8, H: 0xe8fcff } };
export function createShardTexture(scene) {
  createPixelTexture(scene, 'heart-shard', SHARD.rows, SHARD.pal, 3);
}

const MAGNET = 34;
const COLLECT = 16;

export default class CoinManager {
  constructor(scene, dreamId) {
    this.scene = scene;
    this.dreamId = dreamId;
    this.coins = [];
    this.comboN = 0;
    this.comboAt = 0;
  }

  spawn(x, y, opts = {}) {
    const frame = Phaser.Math.Between(0, 3);
    const img = this.scene.add.image(x, y, `coin-${this.dreamId}-${frame}`).setDepth(D.INTERACT + 1);
    const coin = { img, x, y, frame, t: Math.random() * Math.PI * 2, scattered: !!opts.scattered, dieAt: opts.dieAt || 0, n: opts.n || 1 };
    this.coins.push(coin);
    return coin;
  }

  // death scatter (§3.8): up to 20 sprites fly out and can be re-collected
  // for 8 s. Worth beyond 20 coins rides on the sprites evenly.
  scatter(x, y, coinCount) {
    if (coinCount <= 0) return;
    sfx('coin_drop');
    const sprites = Math.min(20, coinCount);
    const per = Math.floor(coinCount / sprites);
    let extra = coinCount - per * sprites;
    const now = this.scene.time.now;
    for (let i = 0; i < sprites; i++) {
      const n = per + (extra-- > 0 ? 1 : 0);
      const c = this.spawn(x, y - 20, { scattered: true, dieAt: now + 8000, n });
      const dx = Phaser.Math.Between(-90, 90);
      const peak = Phaser.Math.Between(50, 110);
      this.scene.tweens.add({ targets: c.img, x: x + dx, duration: 600, ease: 'sine.out' });
      this.scene.tweens.add({
        targets: c.img,
        y: y - 20 - peak,
        duration: 300,
        ease: 'quad.out',
        yoyo: true,
        onComplete: () => {
          c.x = c.img.x;
          c.y = c.img.y;
        },
      });
      c.x = x + dx;
      c.y = y - 20;
    }
  }

  update(time, dt, player, onCollect) {
    for (const c of this.coins) {
      if (!c.img.active) continue;
      // 8 s lifetime for scattered coins, blinking out over the last 2 s
      if (c.dieAt) {
        if (time > c.dieAt) {
          c.img.destroy();
          continue;
        }
        if (time > c.dieAt - 2000) c.img.setAlpha(Math.floor(time / 120) % 2 ? 0.25 : 1);
      }
      // bob at 2 Hz and 4-frame spin
      c.t += dt * Math.PI * 4;
      c.img.y = c.y + Math.sin(c.t / 2) * 2;
      const fr = Math.floor(time / 130 + c.frame) % 4;
      c.img.setTexture(`coin-${this.dreamId}-${fr}`);
      // magnet: within a tile, the coin comes to Jo
      const d = Phaser.Math.Distance.Between(player.x, player.y, c.img.x, c.img.y);
      if (d < MAGNET) {
        c.img.x += (player.x - c.img.x) * 0.35;
        c.img.y += (player.y - c.img.y) * 0.35;
        c.x = c.img.x;
        c.y = c.img.y - Math.sin(c.t / 2) * 2;
      }
      if (d < COLLECT) {
        c.img.destroy();
        if (time - this.comboAt < 1000) this.comboN += 1;
        else this.comboN = 0;
        this.comboAt = time;
        coinSfx(this.comboN);
        addCoins(this.dreamId, c.n);
        if (onCollect) onCollect(c.n, this.comboN);
      }
    }
    this.coins = this.coins.filter((c) => c.img.active);
  }
}

export { deductWorth };
