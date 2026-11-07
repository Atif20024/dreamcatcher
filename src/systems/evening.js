import Phaser from 'phaser';
import { SIT_EVENTS, EXIT_LINES } from '../data/evening/talk.js';
import { NEEDS } from '../data/evening/cast.js';

// §11 — the ambient director. It runs everything nobody asks for: the event
// a sitting Jo is rewarded with, the person who comes to stand beside a Jo
// who has stood still for a minute, the rare events, the light breathing,
// everyone's dinner, and the town's silent memory of small kindnesses.
const T = 32;

export default class Director {
  constructor(scene) {
    this.scene = scene;
    this.sitT = 0;
    this.sitFired = false;
    this.seenEvents = new Set();
    this.noticed = 0; // small things seen this visit (they count, at the end)
    this.companion = null; // the person standing next to him
    this.companionUntil = 0;
    this.rare = {
      wedding: Math.random() < 1 / 6,
      balloon: Math.random() < 1 / 6,
    };
    this.balloonAt = Phaser.Math.Between(180000, 600000);
    this.weddingDone = false;
    this.dinner = 'out'; // out | going | in | returning
    this.dinnerAt = 13 * 60000;
    this.dinnerQueue = [];
    this.dinnerNext = 0;
    this.kindness = []; // { item, img, npc, at }
    this.breath = 0;
    this.t = 0;
  }

  // forcing, for ?rare=wedding etc.
  force(name) {
    if (name === 'wedding') this.rare.wedding = true;
    if (name === 'balloon') {
      this.rare.balloon = true;
      this.balloonAt = 5000;
    }
    if (name === 'dinner') this.dinnerAt = 5000;
  }

  update(time, delta) {
    const s = this.scene;
    this.t += delta;
    // the light breathes: a four-minute cycle, gold deepening and lifting ~5%
    this.breath = 0.5 + 0.5 * Math.sin((this.t / 240000) * Math.PI * 2);

    // --- sitting: after 8 s, something happens near him
    if (s.joSitting) {
      this.sitT += delta;
      if (!this.sitFired && this.sitT > 6000) {
        this.sitFired = true;
        this.sitEvent();
      }
      // a second one, much later, for people who really sit
      if (this.sitFired && this.sitT > 38000 && !this.sitFired2) {
        this.sitFired2 = true;
        this.sitEvent();
      }
    } else {
      this.sitT = 0;
      this.sitFired = false;
      this.sitFired2 = false;
    }

    // --- stand still for 60 s anywhere: someone comes and stands with him
    if (s.stillFor > 60000 && !this.companion && !s.joSitting && !s.onRoadNow) {
      const p = s.player;
      const cand = Object.values(s.folk)
        .filter((f) => f.visible && !f.busy && !f.talking && !f.inside && !f.companion && Math.abs(f.x - p.x) < 22 * T && f.state !== 'sit')
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
      if (cand.length) {
        const f = cand[0];
        this.companion = f;
        f.companion = true;
        f.walkTo(p.x + (f.x < p.x ? -26 : 26), () => {
          f.look(p.x);
          this.companionUntil = s.time.now + Phaser.Math.Between(20000, 35000);
        });
      }
    }
    if (this.companion && this.companionUntil && (s.time.now > this.companionUntil || s.stillFor < 1000)) {
      const f = this.companion;
      this.companion = null;
      this.companionUntil = 0;
      f.companion = false;
      // nothing is said. a hand on the shoulder, maybe: a nod, and home
      f.walkTo(f.home.x);
    }

    // --- rare: a balloon so slow only a sitting player sees it cross
    if (this.rare.balloon && this.t > this.balloonAt && !this.balloonDone && !s.onRoadNow) {
      this.balloonDone = true;
      s.sky.launchBalloon();
    }
    // --- rare: a wedding party crossing the square
    if (this.rare.wedding && !this.weddingDone && s.placeNow === 'square') {
      this.weddingDone = true;
      s.weddingParty();
    }

    this.updateDinner(time);
    this.updateKindness(time);
  }

  sitEvent() {
    const s = this.scene;
    const pool = SIT_EVENTS[s.placeNow] || SIT_EVENTS.square;
    const fresh = pool.filter((id) => !this.seenEvents.has(`${s.placeNow}:${id}`));
    const id = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
    const key = `${s.placeNow}:${id}`;
    if (!this.seenEvents.has(key)) {
      this.seenEvents.add(key);
      this.noticed += 1;
    }
    s.stageSitEvent(id);
  }

  // --- A4.2 everyone's dinner ------------------------------------------------
  updateDinner() {
    const s = this.scene;
    const now = this.t;
    if (this.dinner === 'out' && now > this.dinnerAt && !s.onRoadNow) {
      this.dinner = 'going';
      this.dinnerQueue = Phaser.Utils.Array.Shuffle(Object.values(s.folk).filter((f) => f.visible && !f.busy && f.id !== 'sleeper'));
      this.dinnerNext = now;
    }
    if (this.dinner === 'going' && now > this.dinnerNext) {
      const f = this.dinnerQueue.shift();
      this.dinnerNext = now + Phaser.Math.Between(9000, 20000);
      if (!f) {
        this.dinner = 'in';
        this.backAt = now + 10 * 60000;
        this.dinnerQueue = [];
      } else if (f.visible && !f.busy && !f.companion) {
        if (f.talking) s.talk.end(f.talking);
        f.stand();
        f.say(EXIT_LINES[Math.floor(Math.random() * EXIT_LINES.length)]);
        const door = s.nearestDoor(f.x);
        f.walkTo(door, () => {
          f.hide();
          this.dinnerQueue.push(f); // remembered for coming back
          f.wentIn = true;
        });
      }
    }
    if (this.dinner === 'in' && now > this.backAt) {
      this.dinner = 'returning';
      this.back = Object.values(s.folk).filter((f) => f.wentIn);
      this.dinnerNext = now;
    }
    if (this.dinner === 'returning' && now > this.dinnerNext) {
      const f = this.back.shift();
      this.dinnerNext = now + Phaser.Math.Between(6000, 14000);
      if (!f) {
        this.dinner = 'out';
        this.dinnerAt = now + 25 * 60000;
      } else {
        // nobody comments
        f.wentIn = false;
        f.show();
        f.teleport(s.nearestDoor(f.home.x));
        f.walkTo(f.home.x, () => {
          if (f.def && f.homeSit) f.sitDown();
        });
      }
    }
  }

  // --- A4.8 the town remembers kindnesses, within a visit, silently -------
  noteDrop(item, img) {
    const s = this.scene;
    const who = (NEEDS[item] || []).map((id) => s.folk[id]).filter((f) => f && f.visible && Math.abs(f.x - img.x) < 10 * T);
    if (!who.length) return;
    this.kindness.push({ item, img, npc: who[0], at: this.t + Phaser.Math.Between(120000, 300000) });
  }

  forgetDrop(img) {
    this.kindness = this.kindness.filter((k) => k.img !== img);
  }

  updateKindness() {
    const s = this.scene;
    for (const k of [...this.kindness]) {
      if (this.t < k.at || !k.img.active) continue;
      const f = k.npc;
      if (!f.visible || f.busy || f.inside) continue;
      this.kindness = this.kindness.filter((x) => x !== k);
      if (s.carrying && s.carrying.img === k.img) continue; // Jo took it back
      f.walkTo(k.img.x, () => {
        // Jo got there first: that's fine, they go home
        if ((s.carrying && s.carrying.img === k.img) || !k.img.active) {
          f.walkTo(f.home.x);
          return;
        }
        s.forgetCarryable(k.img);
        f.carrying = k.img; // it turns up in their idle
        k.img.setDepth(11.2);
        f.walkTo(f.home.x);
      });
    }
  }
}
