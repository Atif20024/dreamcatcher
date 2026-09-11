import Phaser from 'phaser';
import { sfx, playFx } from './audio.js';
import { joNote, ORB_THEME, THEME_PARTS } from './soundscape.js';

// §3/§4 — the only verb is *help*, and even that is optional.
//
// { id, npc, verb, available(), join(), update(), leave() } — every one of
// them repeatable, none tracked, none saved. A success is never announced:
// no panel, no sound cue, no counter. The person says something short and
// goes on. Walking away at any point is fine; they say something about that
// too, and it's also fine.
const T = 32;

class Activity {
  constructor(scene, def) {
    this.scene = scene;
    Object.assign(this, def);
    this.running = false;
    this.t = 0;
  }
  get npcObj() {
    return this.scene.folk[this.npc];
  }
  available() {
    const f = this.npcObj;
    return !!f && f.visible && !f.inside;
  }
  join() {
    this.running = true;
    this.t = 0;
    const f = this.npcObj;
    if (f) {
      f.busy = this;
      if (f.talking) this.scene.talk.end(f.talking);
      f.look(this.scene.player.x);
    }
    this.onJoin();
  }
  onJoin() {}
  update(time, delta) {
    this.t += delta;
    const f = this.npcObj;
    const p = this.scene.player;
    // wandered off: that's fine too
    if (this.leash && f && Math.abs(p.x - f.x) > this.leash * T) this.leave(true);
  }
  leave(walkedOff = false) {
    if (!this.running) return;
    this.running = false;
    const f = this.npcObj;
    if (f) f.busy = null;
    this.onLeave(walkedOff);
    if (this.scene.activity === this) this.scene.activity = null;
  }
  onLeave() {}
  done(line, who = this.npcObj) {
    if (line && who) who.say(line);
    this.scene.noteHelped(this.npc);
    this.leave(false);
  }
}

// --- 1. Fereshteh's washing: hold the basket, hand her pegs, and when the
//        wind takes one, chase the sheet down the lane
class Laundry extends Activity {
  onJoin() {
    this.scene.joHold('ev-basket');
    this.hung = 0;
    this.nextPeg = 1500;
    this.asked = false;
    this.escaped = null;
    this.leash = 9;
    this.npcObj.say(['Oh — hold that. Lovely.', 'Basket. Yes. Perfect height.'][Phaser.Math.Between(0, 1)]);
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const f = this.npcObj;
    if (this.escaped) {
      const sh = this.escaped;
      if (!sh.caught && Phaser.Math.Distance.Between(s.player.x, s.player.y, sh.x, sh.y) < 30) {
        sh.caught = true;
        s.tweens.killTweensOf(sh);
        f.say('You got it! Bring it here.');
      }
      if (sh.caught) {
        sh.setPosition(s.player.x + (s.player.flipX ? -14 : 14), s.player.y - 4).setAngle(0);
        if (Math.abs(s.player.x - f.x) < 3 * T) {
          sh.destroy();
          this.escaped = null;
          s.hangSheet(true);
          f.laugh();
          f.say("That one's always trying to leave.");
        }
      }
      return;
    }
    this.nextPeg -= delta;
    if (this.nextPeg <= 0 && !this.asked) {
      this.asked = true;
      this.askedAt = this.t;
      f.say(['Peg.', 'Peg, love.', 'One more.'][Phaser.Math.Between(0, 2)], 1600);
    }
    // a peg handed over, or she reaches past him after a moment — no fail
    if (this.asked && (s.pressed('E') || this.t - this.askedAt > 5000)) {
      this.asked = false;
      this.nextPeg = 2600;
      sfx('click');
      s.hangSheet(false);
      this.hung += 1;
      // a gust takes the third one, if the wind is up (or sometimes anyway)
      if (this.hung === 3 && (s.weather.wind > 0.55 || Math.random() < 0.35)) {
        this.escaped = s.escapeSheet(f.x);
        f.say('No— no no no. After it!');
        return;
      }
      if (this.hung >= 5) this.done("That's the lot.");
    }
  }
  onLeave(walkedOff) {
    this.scene.joHold(null);
    if (this.escaped) {
      this.escaped.destroy();
      this.escaped = null;
    }
    if (walkedOff) this.npcObj.say('Leave the basket, love. — Oh, you have. Good.');
  }
}

// --- the rain version: grab the sheets off the line, one armful each
class Sheets extends Activity {
  available() {
    return super.available() && this.scene.weather.rain > 0.2 && this.scene.lineSheetCount() > 0;
  }
  onJoin() {
    this.leash = 12;
    this.armful = 0;
    this.npcObj.say('Quick! Grab an armful!');
    this.npcObj.laugh();
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const f = this.npcObj;
    const p = s.player;
    const line = s.laundryLine;
    if (!this.armful && Math.abs(p.x - line.mid) < line.half + T && s.pressed('E')) {
      const n = s.takeSheets(2);
      if (n) {
        this.armful = n;
        s.joHold('ev-sheet');
        sfx('flap');
      }
    }
    if (this.armful && Math.abs(p.x - s.laundryDoor) < 2 * T) {
      this.armful = 0;
      s.joHold(null);
      f.laugh();
      if (s.lineSheetCount() === 0) this.done('Dry! Well. Drier.');
    }
    // she takes armfuls too, running back and forth, laughing
    if (!f.target && f.state !== 'walk' && Math.random() < 0.01 && s.lineSheetCount() > 0) {
      f.walkTo(line.mid, () => {
        s.takeSheets(1);
        f.walkTo(s.laundryDoor, () => f.laugh(), 110);
      }, 110);
    }
  }
  onLeave() {
    this.scene.joHold(null);
  }
}

// --- 2. Bo: play along. Free-form, no phrases, no score — whatever Jo
//        presses sounds right, and Bo answers
class Busk extends Activity {
  onJoin() {
    this.leash = 6;
    this.notes = 0;
    this.step = 4;
    this.npcObj.say(['Go on then.', 'In any key. They all work here.'][Phaser.Math.Between(0, 1)]);
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    if (s.pressed('Q')) {
      // arrows lean the tune up or down; nothing can be wrong
      const up = s.player.cursors.up.isDown ? 2 : s.player.cursors.down.isDown ? -2 : Phaser.Math.Between(-2, 2);
      this.step = Phaser.Math.Clamp(this.step + up, 0, 9);
      joNote(this.step);
      s.onJoPlayed();
      this.notes += 1;
      // Bo answers in the same key, a beat later
      s.time.delayedCall(420, () => joNote(Phaser.Math.Clamp(this.step + Phaser.Math.Between(-2, 2), 0, 9), 0.4));
      if (this.notes === 6) this.npcObj.say("You're flat. It's lovely.");
      if (this.notes === 14) this.npcObj.say('Again, but worse. Perfect.');
      if (this.notes >= 18) this.done('We should do weddings.');
    }
  }
}

// --- 3. Adaeze: skip beside her. The beat is easy and never speeds up
class Skip extends Activity {
  onJoin() {
    this.leash = 4;
    this.period = 1000;
    this.phase = 0;
    this.skips = 0;
    this.stopUntil = 0;
    this.rope = this.scene.add.graphics().setDepth(11.5);
    this.npcObj.say('Beside me. Jump when it comes round. It always comes round.');
    this.hum = 0;
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const f = this.npcObj;
    const p = s.player;
    const g = this.rope;
    g.clear();
    if (time < this.stopUntil) return;
    const prev = this.phase;
    this.phase = (this.phase + delta / this.period) % 1;
    // the rope: an arc from her hands over both of them and under
    const x0 = Math.min(f.x, p.x) - 14;
    const x1 = Math.max(f.x, p.x) + 14;
    const ground = f.y;
    const a = this.phase * Math.PI * 2;
    const h = Math.cos(a) * 34; // + over their heads, - at their feet
    const cy = ground - 26 - h;
    g.lineStyle(2, 0xc8a870, 0.9);
    g.beginPath();
    g.moveTo(x0, ground - 28);
    for (let k = 1; k <= 12; k++) {
      const t = k / 12;
      g.lineTo(x0 + (x1 - x0) * t, ground - 28 + (cy - (ground - 28)) * Math.sin(t * Math.PI) * 1.6);
    }
    g.strokePath();
    // the rope passes under their feet at phase 0.5
    if (prev < 0.5 && this.phase >= 0.5) {
      sfx('step');
      const airborne = !p.body.onFloor();
      if (airborne) {
        this.skips += 1;
        if (this.skips === 8) f.say("There. You didn't count once.");
        if (this.skips >= 16) return this.done('Same time tomorrow. Bring your knees.');
      } else {
        // caught: the rope stops, she laughs, it goes again
        this.stopUntil = time + 1200;
        f.laugh();
      }
      // she hums the middle of the tune while she skips
      const part = ORB_THEME.slice(...THEME_PARTS.adaeze);
      playFx(part[this.hum++ % part.length] / 2, 0.7, 'sine', 0.035);
    }
    // she skips too, on the beat
    f.hop = Math.max(0, Math.sin(this.phase * Math.PI * 2 - Math.PI / 2)) * 10;
  }
  onLeave() {
    this.rope.destroy();
    this.npcObj.hop = 0;
  }
}

// --- 4. Marcus: run alongside holding the seat, then let go
class Bike extends Activity {
  available() {
    return super.available() && !!this.scene.folk.marcus_kid;
  }
  onJoin() {
    const s = this.scene;
    this.kid = s.folk.marcus_kid;
    this.kid.busy = this;
    this.leash = 16;
    this.stage = 'hold';
    this.ran = 0;
    this.startX = this.kid.x;
    this.bike = s.add.graphics().setDepth(10.9);
    this.npcObj.say("Hold the seat. Run with her. Don't let go till I say.");
  }
  drawBike() {
    const g = this.bike;
    const k = this.kid;
    g.clear();
    g.lineStyle(2, 0x2a2a30, 1);
    g.strokeCircle(k.x - 9, k.y - 6, 6);
    g.strokeCircle(k.x + 9, k.y - 6, 6);
    g.lineStyle(2, 0xe86a8a, 1);
    g.lineBetween(k.x - 9, k.y - 6, k.x + 2, k.y - 16);
    g.lineBetween(k.x + 2, k.y - 16, k.x + 9, k.y - 6);
    g.lineBetween(k.x + 6, k.y - 20, k.x + 9, k.y - 6);
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const p = s.player;
    const k = this.kid;
    const dt = delta / 1000;
    const wobble = Math.sin(time / 120) * (this.stage === 'hold' ? 1 : 2.5);
    if (this.stage === 'hold') {
      // she rolls as fast as he runs, a hand on the seat
      const want = p.x + (p.flipX ? -16 : 16);
      if (want > k.x) {
        this.ran += want - k.x;
        k.x = Math.min(want, 309 * T);
      }
      k.y = s.groundY(k.x, k.y - 40);
      if (this.ran > 8 * T && !this.saidGo) {
        this.saidGo = true;
        this.goAt = time;
        this.npcObj.say('LET GO!');
      }
      // letting go: stop, or just keep running and she pulls away anyway
      if (this.saidGo && (Math.abs(p.body.velocity.x) < 30 || s.pressed('E') || time - this.goAt > 2500)) {
        this.stage = 'alone';
        this.aloneAt = time;
      }
    } else {
      k.x = Math.min(k.x + 95 * dt, 309 * T);
      k.y = s.groundY(k.x, k.y - 40);
      if (time - this.aloneAt > 1400 && !this.saidIt) {
        this.saidIt = true;
        k.say('I did a whole street!');
        this.scene.time.delayedCall(1500, () => this.npcObj.say("She's got it. She's got it."));
      }
      if (time - this.aloneAt > 4500) {
        // back she comes, slowly, to do it again
        k.walkTo(this.startX, null, 60);
        this.done(null);
      }
    }
    k.art.setAngle(wobble);
    this.drawBike();
  }
  onLeave() {
    this.kid.busy = null;
    this.kid.art.setAngle(0);
    this.bike.destroy();
  }
}

// --- 5. The fisherman: sit, take the second rod, catch nothing. It's fine
class Fishing extends Activity {
  onJoin() {
    const s = this.scene;
    s.joSit({ x: this.npcObj.x + 26 });
    this.offered = false;
    this.line = s.add.graphics().setDepth(11.4);
    this.fLines = 0;
  }
  update(time, delta) {
    this.t += delta;
    if (!this.running) return;
    const s = this.scene;
    const f = this.npcObj;
    if (!s.joSitting) {
      this.done(this.t > 15000 ? 'Same time tomorrow.' : null);
      return;
    }
    if (!this.offered && this.t > 3000) {
      this.offered = true;
      f.say("There's a second rod. It catches the same as mine.");
    }
    if (this.offered) {
      const p = s.player;
      const g = this.line;
      g.clear();
      g.lineStyle(1, 0x6a4a2a, 1).lineBetween(p.x + 8, p.y - 6, p.x + 40, p.y - 30);
      g.lineStyle(1, 0xe8e0d0, 0.6).lineBetween(p.x + 40, p.y - 30, p.x + 52, p.y + 40 + Math.sin(time / 700) * 2);
    }
    if (this.offered && this.t > 9000 + this.fLines * 11000 && this.fLines < 4) {
      this.fLines += 1;
      f.say(f.def.idle[Phaser.Math.Between(0, f.def.idle.length - 1)]);
    }
  }
  onLeave() {
    this.line.destroy();
  }
}

// --- 6. The chess table: move a piece for the losing one
class Chess extends Activity {
  async onJoin() {
    const s = this.scene;
    const pick = await s.dialog.show([
      {
        name: '',
        text: "Wren's move. She's losing. She's been losing on purpose for about an hour.",
        choices: [
          { label: 'the horse', value: 'knight' },
          { label: 'the tall one', value: 'queen' },
          { label: 'the little one at the front', value: 'pawn' },
        ],
      },
    ]);
    const w = s.folk.wren;
    const h = s.folk.hamid;
    const lines = {
      knight: [[h, 'The horse thing. Of course.'], [w, "It's a *knight*. I've decided."]],
      queen: [[h, 'You have given away her queen.'], [w, 'Generously.']],
      pawn: [[w, 'One square. Bold.'], [h, 'Terrifying.']],
    }[pick || 'pawn'];
    let d = 300;
    for (const [who, text] of lines) {
      s.time.delayedCall(d, () => who && who.say(text));
      d += 1900;
    }
    s.time.delayedCall(d, () => {
      if (w) w.laugh();
      if (h) h.laugh();
      s.joReact('laugh');
      this.done(null);
      s.noteHelped('wren');
    });
  }
  update() {}
}

// --- 7. The baker: take the unsold bread round the square. Everyone takes
//        one. One is left for you.
class Bread extends Activity {
  onJoin() {
    this.left = 6;
    this.given = new Set();
    this.leash = 22;
    this.scene.joHold('ev-tray');
    this.npcObj.say("Round the square. Whoever's hungry. Don't bring any back.");
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const p = s.player;
    for (const f of Object.values(s.folk)) {
      if (this.left <= 1) break;
      if (f === this.npcObj || this.given.has(f.id) || !f.visible || f.inside) continue;
      if (Math.abs(f.x - p.x) < 1.6 * T && Math.abs(f.y - (p.y + 24)) < 2 * T) {
        this.given.add(f.id);
        this.left -= 1;
        f.look(p.x);
        f.say(['Oh — go on then.', "Is it the rye? It's the rye.", 'Still warm!', 'One for later.', 'Rustic.'][Phaser.Math.Between(0, 4)], 1700);
        sfx('pickup');
        s.trayLoaves(this.left);
      }
    }
    if (this.left <= 1) {
      // the last one is his
      s.joHold(null);
      s.giveCarry('loaf');
      this.done(null);
      s.time.delayedCall(400, () => s.joReact('grin'));
    }
  }
  onLeave() {
    // (done() has already emptied his hands; any other leave — the station
    // ending — must too, or the tray stays in them)
    this.scene.joHold(null);
  }
}

// --- 8. Kite Kid: run the rooftop with the string until it catches
class Kite extends Activity {
  onJoin() {
    const s = this.scene;
    this.leash = 18;
    this.height = 0;
    this.run = 0;
    this.lastX = s.player.x;
    this.kite = s.add.image(s.player.x, s.player.y, 'ev-kite').setDepth(12.5);
    this.string = s.add.graphics().setDepth(12.4);
    this.caught = false;
    this.npcObj.say('Run! Not that way — that way! Any way! RUN!');
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const p = s.player;
    const dt = delta / 1000;
    const moved = Math.abs(p.x - this.lastX);
    this.lastX = p.x;
    const speed = moved / dt;
    const windy = s.weather.wind > 0.6;
    if (speed > 120) this.run += moved;
    else this.run = Math.max(0, this.run - 60 * dt);
    const lift = this.caught || windy ? 1 : Math.min(1, this.run / (9 * T));
    this.height += (lift * 180 - this.height) * Math.min(1, dt * (speed > 120 || this.caught ? 1.5 : 0.6));
    const holder = this.caught ? this.npcObj : { x: p.x, y: p.y + 24 };
    const kx = holder.x - 90 * (lift + 0.2) + Math.sin(time / 500) * 10;
    const ky = holder.y - 30 - this.height;
    this.kite.setPosition(kx, ky).setAngle(Math.sin(time / 300) * 12);
    this.string.clear().lineStyle(1, 0xf2e6cc, 0.7).lineBetween(holder.x, holder.y - 20, kx, ky + 12);
    if (!this.caught && lift >= 1) {
      this.caught = true;
      this.npcObj.say("It's up! It's UP. Give it — give it here —");
      this.caughtAt = time;
    }
    if (this.caught && time - this.caughtAt > 7000) this.done("Told you. It just has to want to.");
  }
  onLeave() {
    // the kid keeps a kite that flew; one that didn't comes down
    const s = this.scene;
    const k = this.kite;
    const str = this.string;
    if (this.caught) s.kiteFlying = true;
    s.tweens.add({ targets: k, y: k.y + 200, alpha: 0, duration: 1500, onComplete: () => k.destroy() });
    str.destroy();
  }
}

// --- 9. Bilal's tea: drink it; sit through it; he sits too
class Tea extends Activity {
  onJoin() {
    const s = this.scene;
    s.joSit({ x: this.npcObj.x - 26 });
    this.cup = s.add.image(s.player.x + 10, s.player.y + 8, 'ev-dot').setScale(3, 2).setTint(0xf2e6cc).setDepth(13);
    sfx('tea');
    this.npcObj.say('It needs a minute.');
    this.npcObj.sitDown();
  }
  update(time, delta) {
    this.t += delta;
    if (!this.running) return;
    const s = this.scene;
    this.cup.setPosition(s.player.x + (s.player.flipX ? -10 : 10), s.player.y + 8);
    if (Math.random() < 0.02) {
      const st = s.add.circle(this.cup.x, this.cup.y - 4, 1.5, 0xf2ece0, 0.5).setDepth(13);
      s.tweens.add({ targets: st, y: st.y - 16, alpha: 0, duration: 1400, onComplete: () => st.destroy() });
    }
    if (!s.joSitting) this.done(this.t > 10000 ? 'There.' : 'Take it with you. Bring the cup back whenever.');
    else if (this.t > 10000 && !this.said) {
      this.said = true;
      this.npcObj.say('There.');
    }
  }
  onLeave() {
    this.cup.destroy();
    this.npcObj.stand();
  }
}

// --- 10. The Waiting Kid: kick the ball with her until her mother comes
class Ball extends Activity {
  available() {
    return super.available() && !this.scene.noorGone;
  }
  onJoin() {
    const s = this.scene;
    this.leash = 12;
    this.ball = s.spawnBall(this.npcObj.x - 30);
    this.npcObj.say('Kick it here! Here!');
    this.motherAt = 40000;
    this.mum = null; // repeatable: she comes again next time
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const k = this.npcObj;
    const b = this.ball;
    const p = s.player;
    // Jo kicks it by running into it
    if (Math.abs(p.x - b.x) < 20 && Math.abs(p.y + 12 - b.y) < 30 && Math.abs(p.body.velocity.x) > 40 && time > (this.kickT || 0)) {
      this.kickT = time + 400;
      b.body.setVelocity(Math.sign(p.body.velocity.x) * 300, -220);
      sfx('squish');
    }
    // she runs to it and kicks it back to him
    if (!k.target || Math.abs(k.target - b.x) > 20) k.walkTo(b.x, null, 110);
    if (Math.abs(k.x - b.x) < 16 && time > (this.herKick || 0)) {
      this.herKick = time + 900;
      b.body.setVelocity(Math.sign(p.x - b.x) * Phaser.Math.Between(220, 320), -Phaser.Math.Between(150, 300));
      sfx('squish');
    }
    if (this.t > this.motherAt && !this.mum) {
      this.mum = s.folk.mother;
      if (this.mum) {
        this.mum.show();
        this.mum.teleport(311 * T);
        this.mum.walkTo(k.x + 30, () => {
          this.mum.say('Sorry, sorry — the bus.');
          s.time.delayedCall(1800, () => {
            k.say('Bye! BYE!');
            s.noteHelped('waiting_kid');
            this.leave(false);
            s.noorGoesHome();
          });
        });
      } else this.leave(false);
    }
  }
  onLeave() {
    this.scene.dropBall(this.ball);
  }
}

// --- 11. The sweeper: sweep with him. The leaves never stop; he doesn't mind
class Sweep extends Activity {
  onJoin() {
    this.leash = 10;
    this.scene.joHold('broom');
    this.npcObj.say(["Grab a broom. Or don't.", 'They keep falling. We keep sweeping. Nobody is losing.'][Phaser.Math.Between(0, 1)]);
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    s.sweepLeaves(s.player.x, s.player.y + 22);
    if (this.t > 22000 && !this.said) {
      this.said = true;
      this.done("That's a nice bit of path. For about a minute.");
    }
  }
  onLeave() {
    this.scene.joHold(null);
  }
}

// --- 12. The snowman: help by carrying the head. It's lopsided. Nobody
//         fixes it
class Snowman extends Activity {
  available() {
    return this.scene.weather.snow > 0.2 && !this.scene.snowmanDone;
  }
  get npcObj() {
    return this.scene.folk.waiting_kid || this.scene.folk.kite;
  }
  onJoin() {
    const s = this.scene;
    this.leash = 16;
    s.giveCarry('snowhead');
    this.npcObj && this.npcObj.say('The head! Put the head on!');
  }
  update(time, delta) {
    this.t += delta;
    if (!this.running) return;
    const s = this.scene;
    if (!s.carrying || s.carrying.item !== 'snowhead') {
      // put down somewhere — if it's on the body, that's a snowman
      if (s.snowmanHeadPlaced) {
        s.snowmanDone = true;
        this.done(null);
        s.snowmanScene();
      } else this.leave(true);
    }
  }
}

// --- 13. Skimming stones: timing, one to seven skips, and whoever you're
//         with is better than you and doesn't let it go
class Stones extends Activity {
  onJoin() {
    const s = this.scene;
    this.leash = 6;
    this.meter = s.add.graphics().setDepth(70);
    this.m = 0;
    this.dir = 1;
    this.thrown = false;
    this.rounds = 0;
    const who = this.npcObj;
    who && who.say(this.herLine ? this.herLine : 'Flat ones. Wrist, not arm.');
  }
  update(time, delta) {
    super.update(time, delta);
    if (!this.running) return;
    const s = this.scene;
    const p = s.player;
    const g = this.meter;
    g.clear();
    if (this.thrown) return;
    this.m += this.dir * delta / 700;
    if (this.m > 1 || this.m < 0) {
      this.dir *= -1;
      this.m = Phaser.Math.Clamp(this.m, 0, 1);
    }
    const x = p.x - 30;
    const y = p.y - 52;
    g.fillStyle(0x1b1725, 0.8).fillRect(x - 2, y - 2, 64, 8);
    g.fillStyle(0xe9b84a, 0.8).fillRect(x + 26, y, 8, 4);
    g.fillStyle(0xf2e9d8, 1).fillRect(x + this.m * 58, y - 1, 2, 6);
    if (s.pressed('E')) {
      this.thrown = true;
      const acc = 1 - Math.min(1, Math.abs(this.m - 0.52) / 0.5);
      const mine = Math.max(1, Math.round(1 + acc * 6));
      s.skimStone(p.x, p.y + 20, p.flipX ? -1 : 1, mine, () => {
        const who = this.npcObj;
        const theirs = this.her ? 7 : Math.min(9, mine + 1);
        s.time.delayedCall(700, () => {
          if (who) {
            who.say(this.her ? 'Watch.' : 'My go.');
            s.skimStone(who.x, who.y - 4, who.art.flipX ? -1 : 1, theirs, () => {
              who.say(this.her ? 'Seven. Pay up.' : theirs >= 7 ? 'SEVEN. Nobody saw that but it COUNTS.' : `${theirs}. Beat that.`);
              if (this.her) who.laugh();
              this.rounds += 1;
              if (this.rounds >= 3) this.done(null, null);
              else this.thrown = false;
            });
          }
        });
      });
    }
  }
  onLeave() {
    this.meter.destroy();
  }
}

// --- the shallows: take your shoes off. That's the whole feature (A4.6)
class Shoes extends Activity {
  available() {
    return !this.scene.barefoot;
  }
  join() {
    this.scene.toggleShoes();
  }
}

// --- the rope swing in the orchard, the rowboat on the lake
class Swing extends Activity {
  available() {
    return !this.scene.joSitting;
  }
  join() {
    this.running = true;
    this.scene.activity = this;
    this.scene.joSeat(this.seat || 'swing');
  }
  update() {
    if (!this.scene.joSeated) this.leave();
  }
}

export function makeActivities(scene) {
  const A = (Cls, def) => new Cls(scene, def);
  const her = A(Stones, { id: 'her_stones', npc: 'wren', verb: 'skim a stone' });
  her.her = true;
  her.herLine = 'Bet you a tea.';
  her.available = function () {
    return this.scene.herWalking && !!this.scene.folk.wren;
  };
  return {
    laundry: A(Laundry, { id: 'laundry', npc: 'fereshteh', verb: 'hold the basket' }),
    sheets: A(Sheets, { id: 'sheets', npc: 'fereshteh', verb: 'grab the sheets' }),
    bo: A(Busk, { id: 'bo', npc: 'bo', verb: 'play along' }),
    skip: A(Skip, { id: 'skip', npc: 'adaeze', verb: 'skip' }),
    bike: A(Bike, { id: 'bike', npc: 'marcus', verb: 'hold the seat' }),
    fishing: A(Fishing, { id: 'fishing', npc: 'fisherman', verb: 'sit with him' }),
    chess: A(Chess, { id: 'chess', npc: 'hamid', verb: 'move a piece' }),
    bread: A(Bread, { id: 'bread', npc: 'baker', verb: 'take the bread round' }),
    kite: A(Kite, { id: 'kite', npc: 'kite', verb: 'hold the string' }),
    tea: A(Tea, { id: 'tea', npc: 'bilal', verb: 'have a tea' }),
    ball: A(Ball, { id: 'ball', npc: 'waiting_kid', verb: 'kick it back' }),
    sweep: A(Sweep, { id: 'sweep', npc: 'sweeper', verb: 'sweep' }),
    snowman: A(Snowman, { id: 'snowman', npc: 'waiting_kid', verb: 'carry the head' }),
    stones: A(Stones, { id: 'stones', npc: 'stones_kid', verb: 'skim a stone' }),
    her_stones: her,
    shoes: A(Shoes, { id: 'shoes', npc: null, verb: 'shoes off' }),
    swing: A(Swing, { id: 'swing', npc: null, verb: 'swing', seat: 'swing' }),
    boat: A(Swing, { id: 'boat', npc: null, verb: 'push off', seat: 'boat' }),
  };
}
