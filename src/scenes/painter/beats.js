import Phaser from 'phaser';
import { DIALOGUES } from '../../data/painter/cast.js';
import { SUBJECTS, subjectById } from '../../data/painter/subjects.js';
import { swatchTexture } from '../../data/painter/sprites.js';
import { PIGMENTS, complementOf } from '../../systems/paint.js';
import { palette as paletteBox, hour as hourBox, vibrato, sameChair, tree, whichStar } from '../../systems/painterPuzzles.js';
import Stroke from '../../entities/Stroke.js';
import { sfx, music, musicDirector } from '../../systems/audio.js';
import { showTutorial } from '../../systems/tutorial.js';
import { T, px, hex } from './util.js';

// THE YELLOW HOUSE — the scripted beats, canvas by canvas. Mixed into
// PainterScene.prototype.
export default {
  // ---- entering a room ------------------------------------------------------------
  enterRoom(room) {
    const id = room.id;
    if (id === 'studio' && !this.told.studio) {
      this.told.studio = true;
      this.setObjective('the house. dark. paint the wall yellow.');
    }
    if (id === 'square' && !this.told.square) {
      this.told.square = true;
      this.setObjective(this.F.d1 ? 'the mixing board' : 'the square. the postman has a letter.');
    }
    if (id === 'fields' && !this.told.fields) {
      this.told.fields = true;
      this.setObjective('ten canvases in ten days. the easels.');
      showTutorial(this, 'easel');
    }
    if (id === 'hill' && !this.told.hill) {
      this.told.hill = true;
      this.cameras.main.zoomTo(0.75, 900);
    }
    if (id === 'cafe' && !this.told.cafe) {
      this.told.cafe = true;
      this.clock.set(22);
      this.setObjective('the café at night. Madame Ginoux.');
    }
    if (id === 'roofs' && !this.told.roofs) {
      this.told.roofs = true;
      this.setObjective('the rooftops. the bell tower door, at the top.');
    }
    if (id === 'wind' && !this.told.wind) {
      this.told.wind = true;
      this.F.in_wind_section = true;
      this.setObjective('home. with no paint at all.');
      if (this.props.train) {
        this.time.delayedCall(1500, () => {
          sfx('whistle');
          this.tweens.add({ targets: [this.props.train, this.paulOnTrain], x: '-=900', duration: 4000, ease: 'quad.in' });
        });
      }
    }
    if (id === 'petition' && !this.told.petition) {
      this.told.petition = true;
      this.setObjective('the house is being boarded. get inside.');
      if (this.props.planks) {
        this.props.planks.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.props.planks, alpha: 1, duration: 2000 });
        for (let i = 0; i < 3; i++) this.time.delayedCall(700 + i * 600, () => sfx('knock'));
      }
    }
    if (id === 'garden' && !this.told.garden) {
      this.told.garden = true;
      this.F.in_wind_section = false;
      this.clock.set(11);
      this.palette.clear();
      this.updateHud();
    }
    if (id === 'cypress' && !this.told.cypress) {
      this.told.cypress = true;
      this.setObjective('the cypress. up. (the crows roost; violet hides.)');
    }
    if (id === 'sky' && !this.told.sky) {
      this.told.sky = true;
      this.setObjective('the currents carry you. the highest star.');
      this.refreshStars();
    }
  },

  // ---- the easel: capture, or sleep -------------------------------------------------
  easelLabel(easel) {
    const night = this.clock.h >= 21 && !this.clock.locked && (this._room.id === 'fields' || this._room.id === 'hill');
    if (night) return `sleep (day ${this.day} ends)`;
    const s = this.nearestSubject(easel);
    return s ? `set up the easel: ${s.def.title}` : 'set up the easel';
  },

  nearestSubject(easel) {
    let best = null;
    for (const s of Object.values(this.subjects)) {
      if (s.done) continue;
      const d = Math.abs(s.x - easel.wx);
      if (d < 7 * T && Math.abs(s.y - easel.wy) < 4 * T && (!best || d < best.d)) best = { ...s, d };
    }
    return best;
  },

  useEasel(easel) {
    const night = this.clock.h >= 21 && !this.clock.locked && (this._room.id === 'fields' || this._room.id === 'hill');
    if (night) return this.sleep(easel);
    const s = this.nearestSubject(easel);
    if (!s) {
      this.floatText(easel.wx, easel.floor - 60, 'nothing to paint from here.', '#c8c0b0');
      return;
    }
    this.captureCanvas(s.def.id);
  },

  sleep(easel) {
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x0e1a3a, 0).setScrollFactor(0).setDepth(230);
    this.player.controlLockUntil = this.time.now + 2200;
    this.player.body.setVelocity(0, 0);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 800 });
    this.time.delayedCall(1100, () => {
      this.clock.sleep();
      this.day = this.clock.day;
      this.checkpoint = { x: easel.wx, y: easel.floor - 34 };
      this.told.night = false;
      const label = this.add.text(cam.width / 2, cam.height / 2, `day ${this.day}`, { fontFamily: 'monospace', fontSize: '22px', color: '#f2d060' }).setOrigin(0.5).setScrollFactor(0).setDepth(231);
      if (this.day >= this.mistralDay && !this.told.mistral) {
        this.told.mistral = true;
        label.setText(`day ${this.day}. the mistral is up.`);
      }
      this.time.delayedCall(900, () => this.tweens.add({ targets: [wipe, label], alpha: 0, duration: 700, onComplete: () => {
        wipe.destroy();
        label.destroy();
      } }));
      this.setObjective(`day ${this.day}/10 — ${this.canvases.length} in the crate`);
      this.updateHud();
    });
  },

  // §3.6 — capture: two of the right colours, in the right light
  captureCanvas(id) {
    const s = this.subjects[id];
    if (!s || s.done) return false;
    const def = s.def;
    const p = this.player;
    if (def.special === 'bedroom') return this.captureBedroom(s);
    if (def.special === 'terrace' && !this.F.terrace) {
      this.floatText(s.x, s.y - 60, 'the terrace yellow, the sky blue. then it sings.', '#c8c0b0');
      return false;
    }
    if (!this.clock.within(def.hour)) {
      this.floatText(s.x, s.y - 60, `not in this light. (${def.hour[0]}:00 – ${def.hour[1]}:00)`, '#c8c0b0');
      return false;
    }
    const have = this.palette.colours();
    const need = def.requires.map((c) => (c === 'any' ? have.find((h) => h !== def.requires[0]) || have[0] : c));
    const got = need.filter((c) => c && have.includes(c));
    if (got.length < 2) {
      this.floatText(s.x, s.y - 60, `it needs ${need.join(' and ')}.`, '#c8c0b0');
      return false;
    }
    for (const c of got) this.palette.spendColour(c, 1);
    this.clock.stroke(3);
    // the subject takes the colours: the ground under it, and a halo over it
    const tx = Math.floor(s.x / T);
    const ty = Math.floor((s.y + 16) / T);
    for (let dx = -3; dx <= 3; dx++) this.paintTile(tx + dx, ty, dx % 2 ? got[1] : got[0]);
    this.addCanvas(def, got);
    s.done = true;
    s.mark.setText(`✓ ${def.title}`).setColor('#7ec87e');
    sfx('deliver');
    p.controlLockUntil = this.time.now + 600;
    if (id === 'roulin') {
      this.setFlag('roulin_canvas');
      this.props.roulin.setTexture('pt-p-roulin-sit');
    }
    if (id === 'terrace') this.setFlag('terrace_canvas');
    if (id === 'stars') this.setFlag('stars_canvas');
    const fieldDone = SUBJECTS.filter((x) => (x.room === 'fields' || x.room === 'hill') && this.subjects[x.id] && this.subjects[x.id].done).length;
    if (def.room === 'fields' || def.room === 'hill') {
      this.setObjective(`day ${this.day}/10 — ${fieldDone} of ten in the crate`);
      if (fieldDone >= 10 && this.day <= 10) this.setFlag('ten_canvases');
      if (fieldDone >= 10) this.setObjective('ten. the cart to the city, on the hill.');
    }
    return true;
  },

  // a thumbnail of the room as the player painted it: a snapshot of the
  // screen around the subject, downscaled; a painted swatch until it lands
  addCanvas(def, colours) {
    const key = `pt-canvas-${this.canvasSeq++}`;
    swatchTexture(this, key, colours, key);
    const c = { id: def.id, title: def.title, colours, thumb: key, day: this.day };
    this.canvases.push(c);
    const cam = this.cameras.main;
    const sx = Math.max(0, cam.width / 2 - 160);
    const sy = Math.max(0, cam.height / 2 - 110);
    try {
      this.renderer.snapshotArea(sx, sy, 320, 220, (img) => {
        try {
          if (!img || !this.sys || !this.sys.isActive()) return;
          const k2 = `${key}-shot`;
          if (this.textures.exists(k2)) this.textures.remove(k2);
          this.textures.addImage(k2, img);
          c.thumb = k2;
          this.refreshStars();
        } catch {
          /* the swatch stays */
        }
      });
    } catch {
      /* the swatch stays */
    }
    // the picture lifts off the easel and into the crate
    const flash = this.add.image(this.player.x, this.player.y - 50, key).setDepth(60).setScale(1.6);
    this.tweens.add({ targets: flash, y: flash.y - 40, alpha: 0, scale: 0.6, duration: 1100, onComplete: () => flash.destroy() });
    this.floatText(this.player.x, this.player.y - 90, `${def.title}. (${this.canvases.length} in the crate)`, '#f2e0a0');
    this.updateSatchel();
    this.refreshStars();
  },

  // the bedroom: the walls one colour and the bedding its complement
  captureBedroom(s) {
    const walls = this.surfaces.bed_walls.colour;
    const bed = this.surfaces.bedding.colour;
    const floor = this.surfaces.bed_floor.colour;
    if (!walls || !bed) {
      this.floatText(s.x, s.y - 60, 'paint it so you\'d sleep in it: the walls, the bedding.', '#c8c0b0');
      return false;
    }
    if (complementOf(walls) !== bed) {
      this.floatText(s.x, s.y - 60, `${walls} walls want ${complementOf(walls)} bedding. it needs to rest.`, '#c8c0b0');
      return false;
    }
    this.addCanvas(s.def, [walls, bed, floor].filter(Boolean));
    s.done = true;
    s.mark.setText(`✓ ${s.def.title}`).setColor('#7ec87e');
    sfx('deliver');
    this.setFlag('bedroom_canvas');
    this.setObjective(this.F.d1 ? 'the mixing board at the shop' : 'the square. the postman.');
    return true;
  },

  checkTerrace() {
    const t = this.surfaces.terrace.colour;
    const sky = this.surfaces.sky.colour;
    if ((t === 'yellow' || t === 'orange') && sky === 'blue' && !this.F.terrace) {
      this.setFlag('terrace');
      this.floatText(px(322), px(28), 'the edge sings. jump from the terrace.', '#f2e0a0');
      this.setObjective('the terrace sings. jump from it: the balconies, the sill.');
    }
  },

  // ---- Canvas 2: the cart, and eleven seconds in the city ------------------------------
  takeCart() {
    this.setFlag('cart');
    sfx('clack');
    this.clock.set(16);
    this.setObjective('the city. the dealer.');
    this.floatText(px(288), px(31), 'the cart to the city.', '#f2e0a0');
  },

  async vautrinLooks() {
    const p = this.player;
    p.controlLockUntil = this.time.now + 12500;
    p.body.setVelocity(0, 0);
    musicDirector.setMix({ pad: 0.2 });
    const cam = this.cameras.main;
    const items = this.canvases.length ? this.canvases : [{ thumb: 'pt-canvas-swatch', title: 'nothing' }];
    // the crate scrolls past him, one by one, and he says nothing
    items.forEach((c, i) => {
      const img = this.add.image(cam.width + 40, cam.height / 2 - 40, c.thumb).setScrollFactor(0).setDepth(100).setDisplaySize(96, 72).setAngle((Math.random() - 0.5) * 6);
      this.tweens.add({ targets: img, x: -60, duration: 11000, delay: i * (9000 / Math.max(1, items.length)), onComplete: () => img.destroy() });
    });
    const t = this.add.text(cam.width / 2, cam.height - 80, '', { fontFamily: 'monospace', fontSize: '13px', color: '#8a8478' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    for (let s = 1; s <= 11; s++) this.time.delayedCall(s * 1000, () => t.setText('.'.repeat(s)));
    await new Promise((r) => this.time.delayedCall(11200, r));
    t.destroy();
    await this.dialog.show(DIALOGUES.d2);
    await this.dialog.show(DIALOGUES.d2_door);
    this.setFlag('vautrin');
    this.clock.set(18);
    musicDirector.clearMix();
    this.setObjective('home. the fields are still gold. the café, at night.');
  },

  // ---- Canvas 3: Paul -----------------------------------------------------------------
  buildPaulBeats() {},

  paulArrives(quiet = false) {
    this.paulComing = true;
    const floor = px(33) + 16;
    const img = this.person('paul', quiet ? this.player.x - 40 : px(347), floor, { flip: true });
    this.paul = { img, x: img.x, y: floor, walked: 0, lastX: img.x, cool: 0 };
    if (quiet) {
      this.setFlag('paul');
      return;
    }
    sfx('whistle');
    this.time.delayedCall(600, () => {
      this.walkPerson(img, 'paul', this.player.x + 40, async () => {
        await this.dialog.show(DIALOGUES.d4);
        this.setFlag('paul');
        showTutorial(this, 'paul');
        this.setObjective('the rooftops. Paul comes.');
      }, 90);
    });
  },

  // he follows in the café rooms and the kitchen; stands at his easel in the quarrel
  updatePaul(time, dt) {
    const P = this.paul;
    if (!P || !this.F.paul || this.F.paul_gone) return;
    const p = this.player;
    const room = this._room;
    if (!room || !(room.id === 'cafe' || room.id === 'roofs' || room.id === 'quarrel')) return;
    if (room.id === 'quarrel') {
      const want = px(406);
      const d = want - P.img.x;
      if (Math.abs(d) > 4) P.img.x += Math.sign(d) * Math.min(Math.abs(d), 140 * dt);
      P.img.y = this.groundY(P.img.x, P.img.y - 40);
      P.img.setFlipX(true);
      this.paulStride(P, dt);
      return;
    }
    if (this.tweens.isTweening(P.img)) return;
    const dir = p.flipX ? -1 : 1;
    const want = p.x - dir * 36;
    const gap = want - P.img.x;
    const far = Math.abs(p.x - P.img.x) > 9 * T || Math.abs(p.y - P.img.y) > 5 * T;
    if (far) {
      // he never teleports — but he does take the stairs you can't see
      P.img.x += Math.sign(p.x - P.img.x) * 220 * dt;
      P.img.y += (p.y + 22 - P.img.y) * 0.1;
    } else if (Math.abs(gap) > 10) {
      P.img.x += Math.sign(gap) * Math.min(Math.abs(gap), 200 * dt);
      const gy = this.groundY(P.img.x, P.img.y - 48);
      P.img.y += (Math.min(gy, p.y + 22 + 8) - P.img.y) * 0.3;
    } else {
      P.img.y = Math.min(this.groundY(P.img.x, P.img.y - 48), P.img.y);
      P.img.setFlipX(p.x < P.img.x);
    }
    this.paulStride(P, dt);
    if (P.img.shadowImg) P.img.shadowImg.setPosition(P.img.x, P.img.y - 1);
  },

  paulStride(P, dt) {
    const d = Math.abs(P.img.x - P.lastX);
    P.lastX = P.img.x;
    P.walked += d;
    if (d > 0.5) {
      P.img.setFlipX(P.img.x < P.lastX + d && P.img.x < P.lastX ? true : P.img.flipX);
      const stride = (Math.floor(P.walked / 14) % 8) + 1;
      P.img.setTexture(`pt-p-paul#${stride}`);
    } else P.img.setTexture('pt-p-paul');
    void dt;
  },

  // [F] — he paints one stroke of what Jo hasn't got, then you owe him one
  callPaul() {
    const P = this.paul;
    const p = this.player;
    if (!P || !this.F.paul || this.F.paul_gone) {
      if (this.F.paul_gone) this.floatText(p.x, p.y - 60, 'he is on the night train.', '#8a8478');
      return;
    }
    if (this.time.now < P.cool) {
      this.floatText(p.x, p.y - 60, '"once, I said."', '#c8c0b0');
      return;
    }
    if (Math.abs(P.img.x - p.x) > 7 * T) {
      this.floatText(p.x, p.y - 60, 'he is not near.', '#c8c0b0');
      return;
    }
    P.cool = this.time.now + 9000;
    const room = this._room && this._room.id;
    const useful = room === 'roofs' ? ['red', 'green', 'violet'] : ['orange', 'blue', 'yellow'];
    const colour = useful.find((c) => !this.palette.has(c)) || 'red';
    const dir = p.flipX ? -1 : 1;
    const st = new Stroke(this, colour, {});
    const ty = Math.round((p.y + 22 + 10) / T) - 1;
    const tx0 = Math.floor(p.x / T) + dir;
    for (let i = 0; i < 6; i++) st.add(tx0 + dir * i, ty - Math.floor(i / 3));
    this.strokes.push(st);
    this.owed += 1;
    sfx('swing');
    this.floatText(P.img.x, P.img.y - 60, `${colour}. "you owe me one." (${this.owed})`, hex(PIGMENTS[colour].hex));
    this.slamShuttersNear(p.x, p.y);
  },

  // the scripted beat on the rooftops: Jo's green ladder becomes Paul's red launcher
  checkOverpaint(stroke) {
    if (!this.F.paul || this.F.paul_gone || this.F.overpainted || stroke.colour !== 'green') return;
    const z = this.zones && this.zones.overpaint;
    if (!z || !stroke.tiles.some((t) => z.contains(t.img.x, t.img.y))) return;
    this.setFlag('overpainted');
    this.time.delayedCall(500, async () => {
      await this.dialog.show(DIALOGUES.d4_over);
      const tiles = stroke.tiles.filter((t) => !t.gone).map((t) => ({ tx: t.tx, ty: t.ty }));
      stroke.destroy();
      const red = new Stroke(this, 'red', {});
      for (const t of tiles) red.add(t.tx, t.ty, { thick: true });
      for (const t of red.tiles) red.thicken(t);
      this.strokes.push(red);
      sfx('pop');
      this.floatText(this.player.x, this.player.y - 70, 'red. it launches. it stings.', '#e86a6a');
    });
  },

  // ---- the puzzle-boxes --------------------------------------------------------------
  panelWhen(p) {
    switch (p.puzzle) {
      case 'palette':
        return !this.F.p1 && this.palette.colours().length >= 2;
      case 'hour':
        return !this.F.p2;
      case 'vibrato':
        return !this.F.p3;
      case 'chair':
        return this.F.paul && !this.F.quarrel;
      case 'tree':
        return this.F.d6 && !this.F.green_back;
      case 'star':
        return this.F.climbed && !this.F.star_chosen && !this.inIsak;
      default:
        return false;
    }
  },

  async openPanel(p) {
    switch (p.puzzle) {
      case 'palette': {
        const ok = await paletteBox(this);
        if (ok) {
          this.setFlag('p1');
          this.palette.mixing = true;
          showTutorial(this, 'mixing');
          this.setObjective(this.F.bedroom_canvas ? 'the fields.' : 'the bedroom upstairs, then the fields.');
          this.updateHud();
        }
        break;
      }
      case 'hour': {
        const subs = ['haystacks', 'sunflowers', 'harvest'].map((id) => subjectById(id));
        const h = await hourBox(this, subs);
        if (h) {
          this.setFlag('p2');
          this.clock.set(h);
          this.floatText(p.wx, p.floor - 60, `the sun set to ${h}:00. the plain, from here, painted or not.`, '#f2e0a0');
          this.updateHud();
        }
        break;
      }
      case 'vibrato': {
        const ok = await vibrato(this);
        if (ok) {
          this.setFlag('p3');
          this.floatText(p.wx, p.floor - 60, 'the door opens. the sky, from the top: it moves.', '#f2e0a0');
          this.setObjective('through the door. down. the kitchen, morning.');
        }
        break;
      }
      case 'chair':
        await this.theQuarrel(p);
        break;
      case 'tree': {
        if (!this.told.d6_tree) {
          this.told.d6_tree = true;
          await this.dialog.show(DIALOGUES.d6_tree);
        }
        const c = await tree(this);
        if (c) {
          if (this.props.yard_tree) this.props.yard_tree.setTint(PIGMENTS[c].hex);
          this.colourBack('green', `Dr. Rey's tube ("${c}", he wrote)`);
        }
        break;
      }
      case 'star':
        await this.theStars();
        break;
      default:
        break;
    }
  },

  // ---- Canvas 4: the quarrel ----------------------------------------------------------
  async theQuarrel(p) {
    const res = await sameChair(this, this.palette.colours());
    if (!res) return;
    this.quarrel = res.choice;
    this.setFlag('quarrel_choice');
    await this.dialog.show(res.choice === 'agreed' ? DIALOGUES.d4_agree : DIALOGUES.d4_disagree);
    // the chair, as it ended up
    if (this.props.the_chair) this.props.the_chair.setTint(PIGMENTS[res.choice === 'agreed' ? res.paul[2] || 'orange' : res.jo[2] || 'yellow'].hex);
    // he takes his palette; in the scuffle the wells spill
    const cam = this.cameras.main;
    this.cameras.main.shake(400, 0.01);
    sfx('fail');
    const had = this.palette.colours();
    had.forEach((c, i) => this.time.delayedCall(i * 250, () => this.floatText(this.player.x + (i - 1) * 30, this.player.y - 60, `${c} spills.`, '#e86a6a')));
    this.time.delayedCall(900, () => {
      this.palette.clear();
      this.setFlag('emptied');
      this.clearAllPaint();
      this.updateHud();
      const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x4a5566, 0).setScrollFactor(0).setDepth(85);
      this.tweens.add({ targets: wipe, alpha: 0.35, duration: 1500 });
      this.greyWipe = wipe;
      if (this.paul) {
        this.walkPerson(this.paul.img, 'paul', px(419), () => {
          this.paul.img.destroy();
          this.setFlag('paul_gone');
        }, 110);
      }
      this.setFlag('quarrel');
      this.setObjective('the station. he leaves on the night train. then the wind.');
    });
    void p;
  },

  // ---- Canvas 4: the petition ---------------------------------------------------------
  roomLit() {
    if (this.F.boarded) return;
    this.player.controlLockUntil = this.time.now + 9000;
    this.player.body.setVelocity(0, 0);
    this.time.delayedCall(1200, async () => {
      await this.dialog.show(DIALOGUES.d5);
      sfx('knock');
      const g = this.foes.find((f) => f.id === 'gendarme2');
      if (g) g.passive = true;
      await this.dialog.show(DIALOGUES.gendarme);
      this.boardHouse();
    });
  },

  boardHouse(quiet = false) {
    this.setFlag('boarded');
    for (const f of this.foes) if (f.kind === 'petitioner' || f.id === 'gendarme2') f.passive = true;
    if (quiet) return;
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x4a5566, 0).setScrollFactor(0).setDepth(230);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 1600 });
    this.time.delayedCall(1800, () => {
      const cp = this.checkpointAt('CP5a');
      this.player.setPosition(cp.x, cp.y);
      this.checkpoint = cp;
      this.player.setVelocity(0, 0);
      if (this.greyWipe) this.greyWipe.destroy();
      this.tweens.add({ targets: wipe, alpha: 0, duration: 1200, onComplete: () => wipe.destroy() });
    });
  },

  // ---- Canvas 5: the garden, one colour at a time ----------------------------------------
  colourBack(colour, from) {
    const flag = `${colour}_back`;
    if (this.F[flag]) return;
    this.setFlag(flag);
    this.takeTube(colour, { from });
    const back = ['violet', 'blue', 'yellow', 'red', 'green', 'white'].filter((c) => this.F[`${c}_back`]);
    this.floatText(this.player.x, this.player.y - 80, `${back.length} of six.`, '#f2e0a0');
    // the garden brightens as the colours come back (35:65 rising to 65:35)
    const room = this.roomById('garden');
    const n = back.length;
    const cols = ['violet', 'blue', 'yellow', 'red', 'green', 'green'];
    for (let i = 0; i < n * 6; i++) {
      const tx = room._x0 + ((i * 7 + n * 3) % 58) + 1;
      const ty = this.built.height - 6 + (i % 3);
      if (!this.painted.has(`${tx},${ty}`)) this.paintTile(tx, ty, cols[(i + n) % cols.length], { quiet: true });
    }
    const next = { violet: 'blue: the fountain is dry. the gardener has the can.', blue: 'yellow: the corridor of arches, at noon. walk in the light.', yellow: 'red: the poppies on the wall top, past the gardener.', red: "green: Dr. Rey's question, in the office.", green: 'white: a letter, at the office.', white: 'the garden is painted. the wall, at night.' };
    this.setObjective(next[colour] || '');
    if (back.length >= 6) this.gardenPainted();
  },

  gardenPainted(quiet = false) {
    if (this.F.colours_back) return;
    this.setFlag('colours_back');
    const room = this.roomById('garden');
    const w = Math.max(...room.grid.map((g) => g.length));
    const cols = ['green', 'violet', 'yellow', 'green', 'blue'];
    for (let tx = room._x0; tx < room._x0 + w; tx++) for (let ty = 20; ty < this.built.height; ty++) {
      if (this.tileImgs.has(`${tx},${ty}`)) this.paintTile(tx, ty, cols[(tx + ty) % cols.length], { quiet: true });
    }
    for (const id of ['endwall']) if (this.surfaces[id] && !this.surfaces[id].colour) this.paintRect(this.surfaces[id].tx, this.surfaces[id].x1, this.surfaces[id].ty, this.surfaces[id].h, 'yellow', { bg: true, id });
    this.clock.set(20);
    if (!quiet) {
      this.floatText(this.player.x, this.player.y - 80, 'the garden, painted. over the wall, the sky moves.', '#f2e0a0');
      this.setObjective('the bench at dusk. then the wall, and the cypress.');
    }
    if (this.props.rey_office) {
      const rey = this.props.rey_office;
      this.walkPerson(rey, 'rey', px(569), () => rey.setTexture('pt-p-rey-sit'), 60);
    }
    this.updateHud();
  },

  updateGarden(time, dt) {
    const p = this.player;
    if (!this.F.d6) return;
    // 1. violet — sit by the one real iris until the light touches it
    if (this.iris && !this.F.violet_back) {
      const near = Math.abs(p.x - this.iris.wx) < 34 && Math.abs(p.y - (this.iris.img.y - 20)) < 40;
      if (near && p.crouching) {
        this.iris.sat += dt;
        this.clock.hour = Math.min(14, this.clock.hour + dt * 0.4);
        if (!this.told.iris) {
          this.told.iris = true;
          this.floatText(this.iris.wx, this.iris.img.y - 50, 'seeing, not painting. (hold ↓)', '#c8c0b0');
        }
        if (this.iris.sat > 3.5) {
          this.colourBack('violet', 'the iris, when the light touched it');
          this.subjects.irises.mark.setAlpha(1);
        }
      } else this.iris.sat = Math.max(0, this.iris.sat - dt * 2);
    }
    // 2. blue — the gardener's can: take it when his back is turned
    const g = this.foes.find((f) => f.id === 'gardener_can');
    if (g && g.active && g.hasCan && !this.carry && !this.F.blue_back) {
      const behind = g.flipX ? p.x > g.x : p.x < g.x;
      if (behind && Math.abs(p.x - g.x) < 40 && Math.abs(p.y - g.y) < 40 && g.state === 'patrol') {
        if (!this.canPrompt) {
          this.canPrompt = this.addInteract(g.x, g.y, 'take the can', () => {
            g.hasCan = false;
            this.take('can', 'pt-can');
            this.floatText(g.x, g.y - 50, 'he does not notice. (pour it in the basin)', '#c8c0b0');
          }, { once: true, follow: g, when: () => g.hasCan && !this.carry && Math.abs(this.player.x - g.x) < 44 });
        }
      }
    }
    // 3. yellow — the corridor of arches: stay in the moving light to the end wall
    const A = this.arches;
    if (A && !this.F.yellow_back) {
      const noon = this.clock.within([10, 16]);
      A.spot.setAlpha(noon ? 0.5 : 0);
      if (noon) {
        const k = ((time / 1000) % 22) / 22;
        A.spot.x = A.x0 + 20 + (A.x1 - A.x0 - 40) * k;
        A.spot.y = px(30) + 8;
        const inSpot = Math.abs(p.x - A.spot.x) < 44 && Math.abs(p.y - A.spot.y) < 60;
        if (inSpot) {
          A.out = 0;
          A.progress = Math.max(A.progress, k);
          if (!this.told.arches) {
            this.told.arches = true;
            this.floatText(p.x, p.y - 60, 'stay in the light. walk with it.', '#c8c0b0');
          }
        } else if (A.progress > 0.05) {
          A.out += dt;
          if (A.out > 1.5 && k > 0.1) {
            A.progress = 0;
            A.out = 0;
            this.floatText(p.x, p.y - 60, 'the light left you. again, from the first arch.', '#8a8478');
          }
        }
        if (A.progress > 0.9 && inSpot && k > 0.9) {
          this.paintSurface(this.surfaces.endwall, 'yellow', { free: true });
        }
      } else if (!this.told.arches_noon) {
        this.told.arches_noon = true;
      }
    }
  },

  // ---- Canvas 6: the cypress and the sky ---------------------------------------------------
  updateCypress(time) {
    // the tree sways ±1 tile; the branches and their bodies with it
    if (!this.cypressTiles) {
      this.cypressTiles = [];
      for (let ty = 2; ty <= 33; ty++) for (let tx = 609; tx <= 618; tx++) {
        const img = this.tileImgs.get(`${tx},${ty}`);
        if (img && img.body && img.ty < 33) this.cypressTiles.push({ img, x0: img.x });
      }
      for (const l of this.built.ladders) if (l.tx === 614) {
        const img = this.children.list.find((c) => c.texture && c.texture.key === 'pt_ladder' && Math.abs(c.x - l.x) < 1 && Math.abs(c.y - l.y) < 1);
        if (img) this.cypressTiles.push({ img, x0: img.x, noBody: true });
      }
    }
    const sway = Math.sin(time / 1400) * 12 + Math.sin(time / 530) * 4;
    for (const t of this.cypressTiles) {
      t.img.x = t.x0 + sway * (1 - t.img.y / this.worldH);
      if (t.img.body) t.img.body.updateFromGameObject();
    }
    const p = this.player;
    if (this.zones && this.zones.tree_top && this.zones.tree_top.contains(p.x, p.y) && !this.F.climbed) {
      this.setFlag('climbed');
      this.checkpoint = this.checkpointAt('CP6top');
      this.floatText(p.x, p.y - 70, 'the village below: every window you painted, lit.', '#f2e0a0');
      this.setObjective('jump. the currents carry you.');
      // the windows below, in the colours he painted them
      const used = [...new Set([...this.painted.values()])].slice(0, 6);
      used.forEach((c, i) => {
        const w = this.add.rectangle(px(600 + i * 4), px(31), 10, 14, PIGMENTS[c].hex, 0.9).setDepth(-9.5);
        this.add.image(w.x, w.y, 'pt-glow').setDepth(-9.6).setScale(0.6).setTint(PIGMENTS[c].hex).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
      });
    }
  },

  async theStars() {
    // twelve stars: the player's canvases, padded with sketches; one not his
    const mine = this.canvases.slice(0, 11).map((c) => ({ ...c }));
    let n = 0;
    while (mine.length < 11) {
      const key = `pt-sketch-${n}`;
      swatchTexture(this, key, ['blue', 'yellow'], key);
      mine.push({ title: `a sketch (${['the road', 'the sill', 'the bell', 'the plain', 'the lamp', 'the canal', 'the hill', 'the crate', 'the sower', 'the chair', 'the mat'][n % 11]})`, thumb: key });
      n += 1;
    }
    const other = { title: this.quarrel === 'agreed' ? "the bedroom, Paul's way" : "the chair, as Jo painted it", thumb: 'pt-notyours', notYours: true };
    swatchTexture(this, 'pt-notyours', this.quarrel === 'agreed' ? ['orange', 'violet'] : ['yellow', 'red'], 'notyours');
    const all = [...mine];
    all.splice(Phaser.Math.Between(0, 11), 0, other);
    const idx = await whichStar(this, all);
    if (idx === false || idx === undefined) return;
    this.setFlag('star_chosen');
    this.chosen = all[idx];
    this.afterStarChosen(idx);
  },

  // ---- Canvas 7: Isak's room, and the star taken ----------------------------------------------
  afterStarChosen(idx) {
    const p = this.player;
    const star = this.stars.find((s) => s.top) || this.stars[this.stars.length - 1];
    this.tweens.add({ targets: [star.img, star.halo], scale: 2.6, duration: 1200, yoyo: true });
    this.chosen = this.chosen || this.canvases[idx % Math.max(1, this.canvases.length)] || { thumb: 'pt-canvas-swatch', title: 'the night' };
    p.controlLockUntil = this.time.now + 999999;
    p.body.setVelocity(0, 0);
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xf2ece0, 0).setScrollFactor(0).setDepth(230);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 1400, delay: 900 });
    this.time.delayedCall(2500, () => this.isakRoom(wipe));
  },

  isakRoom(wipe) {
    this.inIsak = true;
    this.F.in_isak = true;
    this.setFlag('isak_room');
    const p = this.player;
    const cam = this.cameras.main;
    music.stop();
    musicDirector.setMix({ piano: 0.7, pad: 0.2 });
    p.shown = false;
    p.setPosition(px(681), px(33) - 10);
    p.body.setVelocity(0, 0);
    p.body.setAllowGravity(false);
    cam.stopFollow();
    cam.centerOn(px(690), px(30));
    // the stacks carry his pictures, backs showing, titles chalked
    if (this.stack) this.stack.imgs.forEach((img, i) => {
      const c = this.canvases[i];
      if (c) this.add.text(img.x, img.y - 50 - (i % 3) * 2, c.title.split(' ').slice(-1)[0], { fontFamily: 'monospace', fontSize: '8px', color: '#e8e4d8' }).setOrigin(0.5).setDepth(6.1).setAngle(78);
    });
    // the one that hangs over the stove
    const hung = this.add.image(this.frame.wx, this.frame.wy, this.chosen.thumb).setDepth(8.5).setDisplaySize(48, 36).setAngle(-2);
    this.setObjective('');
    this.tweens.add({ targets: wipe, alpha: 0, duration: 1600, delay: 300, onComplete: () => wipe.destroy() });
    this.time.delayedCall(2600, () => {
      sfx('knock');
      this.time.delayedCall(900, () => {
        const visitor = this.person('visitor', px(681), px(33) + 16);
        this.walkPerson(visitor, 'visitor', this.frame.wx - 30, async () => {
          await new Promise((r) => this.time.delayedCall(2600, r));
          await this.dialog.show(DIALOGUES.d8);
          // she takes it off the wall; in the gap, light
          this.tweens.add({ targets: hung, x: visitor.x + 14, y: visitor.y - 30, scale: 0.5, duration: 900, onComplete: () => hung.setDepth(11.5) });
          this.time.delayedCall(1100, () => {
            const light = this.add.image(this.frame.wx, this.frame.wy, 'pt-glow').setDepth(8.6).setScale(1.4).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
            const gap = this.add.rectangle(this.frame.wx, this.frame.wy, 48, 36, 0xfff6c0, 0).setDepth(8.4).setAngle(-2);
            this.halo(this.frame.wx, this.frame.wy, 'yellow', 0.8, 8.3);
            this.tweens.add({ targets: [light, gap], alpha: 0.95, duration: 1800 });
            sfx('orb');
            this.walkPerson(visitor, 'visitor', px(681), () => visitor.setVisible(false), 60);
            this.time.delayedCall(3200, () => this.backToTheStar());
          });
        }, 70);
      });
    });
  },

  backToTheStar() {
    const p = this.player;
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xf2ece0, 0).setScrollFactor(0).setDepth(230);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 1200 });
    this.time.delayedCall(1400, () => {
      this.inIsak = false;
      this.F.in_isak = false;
      const star = this.stars.find((s) => s.top) || this.stars[this.stars.length - 1];
      p.shown = true;
      p.setPosition(star.wx - 60, star.wy - 40);
      p.body.setVelocity(0, 0);
      p.body.setAllowGravity(true);
      p.controlLockUntil = 0;
      this.checkpoint = { x: star.wx - 60, y: star.wy - 40 };
      cam.startFollow(p, true, 0.1, 0.1);
      music.soloPiano();
      const o = this.orbs.create(star.wx, star.wy - 10, 'orb').setDepth(95).setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 900 });
      this.tweens.add({ targets: o, y: star.wy - 16, duration: 1000, yoyo: true, repeat: -1, ease: 'sine.inout' });
      this.setObjective('the star. yours.');
      this.tweens.add({ targets: wipe, alpha: 0, duration: 1200, onComplete: () => wipe.destroy() });
    });
  },

  // ---- dev helpers: the state a warp skips -------------------------------------------------
  devPaintBedroom() {
    const S = this.surfaces;
    if (!S.bed_walls) return;
    for (const [id, c] of [['bed_walls', 'yellow'], ['bedding', 'violet'], ['bed_floor', 'yellow'], ['frontwall', 'yellow'], ['channel', 'blue']]) {
      if (S[id]) this.paintSurface(S[id], c, { free: true });
    }
    if (this.subjects.bedroom) {
      this.subjects.bedroom.done = true;
      this.subjects.bedroom.mark.setText('✓ the bedroom').setColor('#7ec87e');
    }
  },

  devPaintTerrace() {
    const S = this.surfaces;
    if (S.terrace) this.paintSurface(S.terrace, 'yellow', { free: true });
    if (S.sky) this.paintSurface(S.sky, 'blue', { free: true });
    if (this.subjects.terrace) this.subjects.terrace.done = true;
  },
};
