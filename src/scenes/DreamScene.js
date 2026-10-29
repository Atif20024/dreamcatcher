// DreamScene (plan 2.1): one scene plays any framework dream from its
// DreamDefinition (src/dreams/<id>/dream.js). It hosts the phase-1 services
// through BaseLevel (hearts, checkpoints, the death card, runs, pause, the
// HUD on UIScene) and adds the phase-3 world: RoomGraph + RoomStreamer
// (seams blend, doors fade), painted terrain baked to chunks, the
// BackdropDirector, the CameraDirector, InputMap + gamepad, the caption bar
// and scene box, barks, interaction, encounters, the BeatRunner, verb
// modules, audio (stems, ambience, footsteps, stingers), the PerfMonitor and
// a shared EndingSequence. See docs/redesign/FRAMEWORK.md.
//
//   this.scene.start('Dream', { dreamId: 'clockmaker', warp?: 'room' | 'room:spawnId', resume?: true })
// Dev: ?warp=clockmaker:start (or the old alias ?warp=proof:start; src/dev/warp.js).
import BaseLevel from './BaseLevel.js';
import Player from '../entities/Player.js';
import { frameworkDream } from '../dreams/index.js';
import { RoomGraph } from '../world/RoomGraph.js';
import { RoomStreamer, LAYER_DEPTH } from '../world/RoomStreamer.js';
import { TransitionDirector } from '../world/TransitionDirector.js';
import { BackdropDirector } from '../world/BackdropDirector.js';
import { CameraDirector } from '../world/CameraDirector.js';
import { MaterialLibrary } from '../world/MaterialLibrary.js';
import { StaticBaker } from '../world/StaticBaker.js';
import { InputMap, attachInput } from '../input/InputMap.js';
import { CaptionBar } from '../narrative/CaptionBar.js';
import { SceneBox } from '../narrative/SceneBox.js';
import { Barks } from '../narrative/Barks.js';
import { Interaction } from '../play/Interaction.js';
import { BeatRunner } from '../play/BeatRunner.js';
import { Encounters } from '../play/Encounters.js';
import { makePresenter } from '../play/encounterPresenters.js';
import { EndingSequence } from '../play/EndingSequence.js';
import { Npc } from '../actors/Npc.js';
import { DreamGate } from '../actors/DreamGate.js';
import { StemMusic } from '../audio/MusicDirector.js';
import { ambience } from '../audio/Ambience.js';
import { buses } from '../audio/AudioBus.js';
import { Footsteps } from '../audio/Footsteps.js';
import { Stingers, STINGS } from '../audio/Stingers.js';
import { PerfMonitor } from '../core/PerfBudget.js';
import { events } from '../core/events.js';
import { roomObjective } from '../play/Objectives.js';
import { updateTeach } from '../play/Teach.js';
import GateSigns from '../play/GateSigns.js';
import { RunState } from '../play/RunState.js';
import { getRun, clearRun } from '../utils/save.js';
import { dreamById } from '../data/dreams.js';
import { musicDirector, sfx } from '../systems/audio.js';
import { paintProp } from '../art/props.js';
import { hud } from '../ui/hud.js';
import { uiText } from '../ui/text.js';
import { boardTitle } from '../ui/BoardTitle.js';
import { trainWipe } from '../ui/TrainWipe.js';
import { placeOf } from '../ui/theme.js';
import { markMet, updateSave } from '../utils/save.js';
import { WATCHED, watch, spawnFoe, foeContact, spawnKeyItem, updateKeyItems, spawnAudience, spawnResonant, updateResonants, ringAt, spawnMoment, castPortrait } from '../play/dreamAdapters.js';

const T = 32;

export default class DreamScene extends BaseLevel {
  constructor() {
    super('Dream');
  }

  init(data = {}) {
    let id = data.dreamId || data.levelKey || null;
    let warp = data.warp || null;
    if (!id && typeof window !== 'undefined') {
      const w = new URLSearchParams(window.location.search).get('warp');
      if (w) {
        const [d, ...rest] = w.split(':');
        id = d;
        warp = rest.join(':') || null;
      }
    }
    // started with no dream to play (a boot-time first scene arriving after a
    // dev warp moved on, with the ?warp= already gone): stand down quietly
    // instead of throwing on every step until something warps here again
    this.idle = !frameworkDream(id);
    if (this.idle) {
      console.warn(`DreamScene: no framework dream "${id}": standing down`);
      return;
    }
    this.def = frameworkDream(id);
    this.dreamDef = this.def;
    this.dreamId = this.def.id;
    this.warpTo = warp;
    const prof = this.def.profile || {};
    this.noFail = prof.failure === 'noFail';
    this.hudProfile = prof.hud === 'none' ? 'none' : 'default';
  }

  // where a play starts: the warp's room/spawn, else the dream's start
  startPoint() {
    const def = this.def;
    let roomId = def.start.room;
    let spawnId = def.start.spawn;
    if (this.warpTo && this.warpTo !== 'start') {
      const [r, s] = this.warpTo.split(':');
      if (this.graph.room(r)) {
        roomId = r;
        spawnId = s || null;
      }
    }
    const r = this.graph.room(roomId);
    const ents = r.data.entities || [];
    const e = ents.find((x) => x.id === spawnId && (x.type === 'spawn' || x.type === 'checkpoint' || x.type === 'portal')) || ents.find((x) => x.type === 'spawn') || ents.find((x) => x.type === 'portal') || { x: 2, y: r.h - 5 };
    return { room: roomId, x: (r.tx + e.x) * T + T / 2, y: (r.ty + e.y) * T + T - 22 };
  }

  create() {
    if (this.idle) {
      this.time.delayedCall(0, () => this.scene.stop());
      return;
    }
    const def = this.def;
    this.F = {};
    // Phaser reuses the scene instance: nothing modal carries over a restart
    this.encounterActive = false;
    this.puzzleActive = false;
    this.npcs = new Map();
    this.gates = [];
    this.encAnchors = {};
    this.convSeen = new Set();
    this.inputs = attachInput(new InputMap());
    this.lib = new MaterialLibrary(def.materials || {}, def.decorRules || {});
    this.graph = RoomGraph.fromDefinition(def);
    this.baker = new StaticBaker(this);
    const sp = this.startPoint();
    this.player = new Player(this, sp.x, sp.y);
    this.player.setBodyProfile('dream');
    // the dream's own shade (DreamDefinition.shadow: PlayerShadow options).
    // The ground's lit cap is painted in the room's fg layer (depth 30), over
    // Jo's soles: the shadow lies on that cap, just above it.
    this.player.shadow.set({ tint: (def.palette && def.palette.shadow) ?? 0x14101c, alpha: 0.5, length: 1.3, depth: LAYER_DEPTH.fg + 0.5, ...(def.shadow || {}) });
    this.player.inputMap = this.inputs;
    this.player.quietSteps = true;
    this.player.noTool = !def.tool;
    // the dream's tool (the Musician's trumpet; the ladle is the default art)
    if (def.tool && this.textures.exists(`tool-${def.tool}`)) this.player.tool.setTexture(`tool-${def.tool}`);
    // phase 3b adapters: foes, key items, the audience, resonant things,
    // small moments, and entities that come and go with a flag
    this.watchers = new Set();
    this.keyItems = new Set();
    this.resonants = new Set();
    this.audience = [];
    this.initFoes(def.id);
    if (def.markMet) markMet(def.id);
    this._persisted = {};
    // dialogue faces cut from the cast's own rigs (cast[who].face)
    for (const c of Object.values(def.cast || {})) if (c.face && c.portrait) castPortrait(this, c.portrait, c.face);
    // collision grids the Player reads (every room's, from data)
    this.streamer = new RoomStreamer(this, {
      graph: this.graph,
      lib: this.lib,
      baker: this.baker,
      propsExtra: def.props || {},
      palette: def.palette || {},
      flags: () => this.F,
      onSpawn: (e, room) => this.spawnEntity(e, room),
      onBuilt: (room) => this.wireRoom(room),
    });
    Object.assign(this, this.streamer.grids);
    this.built = {
      solidAt: (tx, ty) => !!(this.solidGrid[ty] && this.solidGrid[ty][tx]),
      charAt: (tx, ty) => this.graph.charAt(tx, ty),
      surfaceGrid: this.surfaceGrid,
      rooms: [],
    };
    // checkpoints are global (a resume needs every flag's position)
    this.flags = this.physics.add.staticGroup();
    const wr = this.graph.worldRect();
    // the dream's own coin (data/dreams.js), when it is a train on the board
    if (dreamById(this.dreamId)) this.dreamCoinId = this.dreamId;
    this.setupCommon({ worldW: wr.x1, worldH: wr.y1, levelName: `DREAM — ${def.title}`, spawn: { x: sp.x, y: sp.y } });
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.removeBounds();
    musicDirector.stop();
    this.physics.world.setBounds(wr.x0, wr.y0 - 600, wr.x1 - wr.x0, wr.y1 - wr.y0 + 800);
    this.placeCheckpointsAll();
    this.placeCoinsAll();
    this.physics.add.overlap(this.player, this.flags, (p, f) => this.activateCheckpoint(f));
    this.physics.add.overlap(this.player, this.foeGroup, (p, f) => foeContact(this, f));

    // narrative, interaction, encounters, beats
    this.caption = new CaptionBar(this, { cast: def.cast || {} });
    this.sceneBox = new SceneBox(this, { cast: def.cast || {}, input: this.inputs });
    this.sceneBox.onSpeaker = (who) => this.npcs.forEach((n, id) => n.setTalking(id === who));
    this.interaction = new Interaction(this, { input: this.inputs, player: this.player });
    this.barks = new Barks({
      list: def.barks || [],
      caption: this.caption,
      flags: () => this.F,
      setFlag: (k, v) => (this.F[k] = v),
      where: () => ({
        room: this.playerRoom,
        near: (ref) => {
          const [kind, id] = ref.split(':');
          const n = kind === 'npc' ? this.npcs.get(id) : null;
          return n ? Math.hypot(n.x - this.player.x, n.y - (this.player.y + 22)) : null;
        },
      }),
    });
    this.encounters = new Encounters({
      defs: def.encounters || {},
      bus: events,
      host: {
        makePresenter: (d, engine, ctx) => makePresenter(this, d, engine, ctx),
        enter: (d, ctx) => this.encounterEnter(d, ctx),
        exit: (d, result, ctx) => this.encounterExit(d, result, ctx),
      },
    });
    this.beats = new BeatRunner({
      beats: def.beats || {},
      flags: () => this.F,
      delay: (ms) => new Promise((r) => this.time.delayedCall(ms, r)),
      handlers: this.beatHandlers(),
    });
    this.camShots = [];
    this.ending = new EndingSequence(this);

    // world directors
    this.camDir = new CameraDirector(this, { graph: this.graph, target: this.player, zoom: (def.profile && def.profile.camera && def.profile.camera.zoom) || 1 });
    this.backdrop = new BackdropDirector(this, this.graph, def.backdrops || {});
    this.transitions = new TransitionDirector(this, {
      graph: this.graph,
      streamer: this.streamer,
      input: this.inputs,
      camera: this.camDir,
      player: this.player,
      onArrive: (to) => this.commit(to.room, { teleport: true }),
    });

    // audio
    buses.ensure();
    this.music = new StemMusic(this, def.music || {});
    this.music.start();
    this.footsteps = new Footsteps({ surfaceAt: (tx, ty) => this.streamer.surfaceAt(tx, ty) });
    const orig = this.player.anim.onEvent;
    this.player.anim.onEvent = (ev, n, f) => {
      orig(ev, n, f);
      if (ev === 'footstep') this.footsteps.step(this.player.feet(), Math.abs(this.player.body.velocity.x));
    };
    this.stingers = new Stingers(events, { place: placeOf(this) });
    this.perf = new PerfMonitor(this);
    this.verbs = (def.verbs || []).map((v) => ({ mod: v, ctx: this.verbCtx() }));
    for (const v of this.verbs) if (v.mod.create) v.mod.create(v.ctx);

    this.roomId = null;
    this.commit(sp.room, { teleport: true });
    this.events.once('shutdown', () => this.teardown());
    if (def.onStart && this.beats.has(def.onStart)) this.beats.play(def.onStart).catch((e) => console.warn('[dream] beat', e));
  }

  teardown() {
    if (this.music) this.music.stop();
    ambience.stop();
    buses.setAcoustics('open', true); // the station and legacy scenes are dry
    if (this.stingers) this.stingers.destroy();
    if (this.beats) this.beats.cancelAll();
    if (this.encounters) this.encounters.abort();
  }

  // ---- run (phase 1 RunState, keyed by the dream id) ---------------------------
  initRun() {
    this.run = null;
    this.resuming = false;
    if (this.noFail || (this.def && this.def.runs === false)) return;
    const data = this.sys.settings.data || {};
    const saved = data.resume ? getRun(this.dreamId) : null;
    if (saved) {
      this.run = RunState.from(saved);
      this.resuming = true;
    } else {
      this.run = new RunState({ dreamId: this.dreamId, sceneKey: 'Dream' });
      if (!data.keepRun) clearRun(this.dreamId);
    }
  }

  runExtra() {
    return { room: this.playerRoom };
  }

  // ---- checkpoints: a lantern on a post; the touch zone is the service's flag
  placeCheckpointsAll() {
    const objs = [];
    for (const r of this.graph.rooms.values()) {
      for (const e of r.data.entities || []) {
        if (e.type !== 'checkpoint') continue;
        objs.push({ ...e, type: 'checkpoint', wx: (r.tx + e.x) * T + T / 2, wy: (r.ty + e.y) * T + T / 2 });
      }
    }
    this.placeCheckpoints(objs);
    this.lanterns = new Map();
    const art = paintProp('lantern_post');
    if (art && !this.textures.exists('prop:lantern_post')) this.textures.addCanvas('prop:lantern_post', art.c);
    for (const o of objs) {
      const f = this.checkpoints.spriteFor(o.id);
      if (f) f.setAlpha(0);
      const feet = o.wy + T / 2;
      const post = this.add.image(o.wx + 20, feet, 'prop:lantern_post').setOrigin(0.5, 1).setDepth(-9);
      const glow = this.add.image(o.wx + 27, feet - 58, 'dc-glow').setBlendMode('ADD').setTint(0xffc060).setScale(0.7).setDepth(14).setAlpha(0);
      const flame = this.add.circle(o.wx + 28, feet - 58, 4, 0xfff0b0).setDepth(-8).setVisible(false);
      this.lanterns.set(o.id, { post, glow, flame });
    }
  }

  // coins are global like checkpoints (a continued run removes the taken
  // ones by position): room entities { type: 'coin' } / { type: 'coins', n, dx, dy }
  placeCoinsAll() {
    // a restarted scene keeps its instance: start the list afresh
    this.placedCoins = [];
    this.shardItems = [];
    const objs = [];
    for (const r of this.graph.rooms.values()) {
      for (const e of r.data.entities || []) {
        if (e.type !== 'coin' && e.type !== 'coins' && e.type !== 'shard') continue;
        objs.push({ ...e, wx: (r.tx + e.x) * T + T / 2, wy: (r.ty + e.y) * T + T / 2 });
      }
    }
    if (objs.length) this.spawnPickups(objs);
    // each placed coin's room: coins in rooms that are not live are hidden
    // (a dream that pays in small change has a hundred-odd of them)
    for (const c of this.placedCoins) {
      const r = this.graph.roomAt(c.img.x, c.img.y);
      c.room = r ? r.id : null;
    }
  }

  onCheckpointLit(cp) {
    this.coinsSinceCP = 0;
    const l = this.lanterns && this.lanterns.get(cp.id);
    if (l) {
      l.flame.setVisible(true);
      this.tweens.add({ targets: l.glow, alpha: 0.55, duration: 400 });
    }
    if (cp.silent) return;
    if (this.player && this.player.body.blocked.down) this.player.pose('celebrate');
    this.showCheckpointLabel(cp.label);
    this.saveRun();
  }

  // ---- rooms -----------------------------------------------------------------------
  // the committed room changed (camera centre, with hysteresis) or a door/respawn moved us
  commit(id, { teleport = false } = {}) {
    if (!id || id === this.roomId) return;
    const prev = this.roomId;
    this.roomId = id;
    this.streamer.focus(id);
    if (prev) events.emit('room:leave', { id: prev });
    events.emit('room:enter', { id, from: prev });
    const r = this.graph.room(id);
    const m = r.data.music;
    if (m) {
      if (m.state) this.music.setState(m.state);
      // a named key (the place's instruments, mode and tempo) wins over bpm
      if (!(m.key && this.music.setKey && this.music.setKey(m.key)) && m.bpm) this.music.setBpm(m.bpm);
    }
    // the room's acoustics: inside is muffled and echoes (room.acoustics)
    buses.setAcoustics(r.data.acoustics || 'open', teleport);
    if (teleport) this.camDir.snap();
    if (r.data.titleCard && !this.F[`_title:${id}`]) {
      this.F[`_title:${id}`] = true;
      this.titleCard(r.data.titleCard);
    }
  }

  titleCard(text) {
    // round 2 WP6 (§9): a place's name arrives on the board, letter by letter
    if (this._titleCard && this._titleCard.active) this._titleCard.destroy();
    this._titleCard = boardTitle(this, text, { y: 112, name: 'title-card', hold: 1800 });
  }

  wireRoom(room) {
    const p = this.player;
    room.handles.push(this.physics.add.collider(p, room.colliders.solids));
    room.handles.push(this.physics.add.collider(p, room.colliders.oneWays));
    room.handles.push(this.physics.add.overlap(p, room.colliders.hazards, (pl, h) => this.hurt({ sourceX: h.x + 12 })));
  }

  feetOf(room, e) {
    return { x: (room.r.tx + e.x) * T + T / 2, y: (room.r.ty + e.y) * T + T };
  }

  // a room entity → live things (destroyed with the room)
  spawnEntity(e, room) {
    const at = this.feetOf(room, e);
    // an entity with when/unless lives only while its flags hold
    if ((e.when || e.unless) && !e._watched && WATCHED.has(e.type)) return watch(this, e, room, (x, r) => this.spawnEntity(x, r));
    switch (e.type) {
      case 'portal': {
        if (e.kind !== 'door') return null;
        // a door may be locked until flags are set (door.requires); [E] then
        // says why instead of opening
        const req = (e.door && e.door.requires) || [];
        const locked = () => req.some((f) => !this.F[f]);
        const prompt = (e.door && e.door.prompt) || 'enter';
        const reg = this.interaction.register({
          id: `door:${e.id}`,
          x: at.x,
          y: at.y,
          radius: 44,
          prompt,
          onUse: () => {
            if (!locked()) return this.transitions.go(e.id);
            sfx('knock');
            if (e.door.lockedLine) this.caption.say('jo', e.door.lockedLine, { ms: 2600 });
            return null;
          },
          enabled: () => !this.transitions.busy,
        });
        if (!req.length) return reg;
        const sync = () => (reg.item.prompt = locked() ? e.door.locked || 'locked' : prompt);
        this.watchers.add(sync);
        sync();
        return {
          destroy: () => {
            this.watchers.delete(sync);
            reg.destroy();
          },
        };
      }
      case 'foe':
        return spawnFoe(this, e, room);
      case 'keyitem':
        return spawnKeyItem(this, e, room);
      case 'audience':
        return spawnAudience(this, e, room);
      case 'resonant':
        return spawnResonant(this, e, room);
      case 'moment':
        return spawnMoment(this, e, room);
      case 'npc': {
        const npc = new Npc(this, { id: e.id, x: at.x + (e.dx || 0), y: at.y, rig: e.rig, cast: e.cast, pose: e.pose, facing: e.facing || -1, task: e.task || 'idle_fidget', turns: e.turns !== false, ...(e.depth === 'behind' ? { depth: LAYER_DEPTH.mid - 0.5 } : {}) });
        this.npcs.set(e.id, npc);
        const reg = this.interaction.register({ id: `npc:${e.id}`, at: () => ({ x: npc.x, y: npc.y }), radius: 72, prompt: 'talk', onUse: () => this.talkTo(e, npc) });
        return {
          destroy: () => {
            npc.destroy();
            reg.destroy();
            this.npcs.delete(e.id);
          },
        };
      }
      case 'gate': {
        const g = new DreamGate(this, e, room.r);
        const col = this.physics.add.collider(this.player, g.zone);
        this.gates.push(g);
        g.update(this.F, { instant: true });
        return {
          destroy: () => {
            col.destroy();
            g.destroy();
            this.gates = this.gates.filter((x) => x !== g);
          },
        };
      }
      case 'encounter': {
        const anchor = e.anchor ? { x: (room.r.tx + e.anchor.x) * T + T / 2, y: (room.r.ty + e.anchor.y) * T + T / 2 } : { x: at.x, y: at.y - 120 };
        this.encAnchors[e.id] = anchor;
        return this.interaction.register({
          id: `enc:${e.id}`,
          x: at.x,
          y: at.y,
          radius: 64,
          prompt: e.prompt || 'play',
          enabled: () => !this.encounters.busy && !(e.unless && this.F[e.unless]) && !(e.when && !this.F[e.when]),
          onUse: () => this.startEncounter(e.id, anchor),
        });
      }
      case 'orb': {
        const x = (room.r.tx + e.x) * T + T / 2;
        const y = (room.r.ty + e.y) * T + T / 2;
        const glow = this.add.image(x, y, 'dc-glow').setBlendMode('ADD').setTint(0x9ae8c9).setScale(0.8).setDepth(13).setAlpha(0.6);
        const orb = this.add.image(x, y, 'orb').setDepth(14);
        orb.isOrb = true;
        const tw = this.tweens.add({ targets: [orb, glow], y: y - 10, duration: 1400, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        this.orb = orb;
        this.orbGlow = glow;
        return {
          destroy: () => {
            tw.remove();
            orb.destroy();
            glow.destroy();
            if (this.orb === orb) this.orb = null;
          },
        };
      }
      default:
        return null;
    }
  }

  // ---- talk --------------------------------------------------------------------------
  pickConversation(e) {
    for (const c of e.talk || []) {
      if (c.if && !this.F[c.if]) continue;
      const conv = this.def.conversations[c.conv];
      if (!conv) continue;
      if (!conv.replayable && this.F[`_conv:${conv.id}`]) continue;
      return conv;
    }
    return null;
  }

  talkTo(e, npc) {
    const conv = this.pickConversation(e);
    if (!conv) return null;
    const mid = () => ({ x: (npc.x + this.player.x) / 2, y: Math.min(npc.y, this.player.y + 22) - 40 });
    return this.runConversation(conv.id, conv.camera === 'talk' || conv.camera === undefined ? mid : null);
  }

  async runConversation(convId, focus = null) {
    const conv = this.def.conversations[convId];
    if (!conv) throw new Error(`DreamScene: no conversation "${convId}"`);
    this.F[`_conv:${conv.id}`] = true;
    const shot = focus ? this.camDir.push({ zoom: 1.25, focus, ms: 500 }) : null;
    this.player.body.setVelocityX(0);
    const r = await this.sceneBox.run(conv, {
      flags: () => this.F,
      onSet: (k, v) => (this.F[k] = v),
      onEffect: (fx) => this.applyEffect(fx),
    });
    this.npcs.forEach((n) => n.setTalking(false));
    if (shot) this.camDir.pop(shot, 450);
    return r;
  }

  applyEffect(fx) {
    if (fx.objective) this.setObjective(fx.objective);
    if (fx.set) Object.assign(this.F, fx.set);
    if (fx.beat) this.beats.play(fx.beat);
  }

  // ids from dream.objectives, or plain text
  setObjective(text) {
    const t = (this.def && this.def.objectives && this.def.objectives[text]) || text;
    super.setObjective(t);
  }

  // ---- encounters ----------------------------------------------------------------
  startEncounter(id, anchor = null) {
    const a = anchor || this.encAnchors[id] || null;
    return this.encounters.start(id, { anchor: a, flags: this.F }).catch((e) => console.warn('[dream] encounter', e));
  }

  // Jo's verb rings what is near (the Musician's trumpet): resonant things,
  // people who stop to listen, feedback that falls silent
  ringAt(x, y, radius = 140) {
    return ringAt(this, x, y, radius);
  }

  // coins well outside the view (or in rooms that are not live) are not drawn
  cullCoins() {
    const live = this.streamer.live;
    const v = this.cameras.main.worldView;
    const m = 320;
    for (const c of this.placedCoins || []) {
      if (!c.img.active) continue;
      const near = c.img.x > v.x - m && c.img.x < v.right + m && c.img.y > v.y - m && c.img.y < v.bottom + m;
      c.img.setVisible(near && (!c.room || live.has(c.room)));
    }
  }

  // per-frame: flag watchers, key items, resonant glows, foes, saved flags
  updateAdapters(time) {
    for (const w of [...this.watchers]) w();
    updateKeyItems(this);
    updateResonants(this, time);
    if (this.foes.length) this.updateFoes(time);
    const persist = this.def.persist || {};
    for (const [flag, path] of Object.entries(persist)) {
      if (this.F[flag] === undefined || this.F[flag] === this._persisted[flag]) continue;
      this._persisted[flag] = this.F[flag];
      const [a, b] = path.split('.');
      updateSave((s) => ((s[a] ||= {})[b] = this.F[flag]));
    }
  }

  // anything modal (a conversation, an encounter, the ending): people stop
  holdFoes() {
    for (const f of this.foes) if (f.active && f.body) f.body.setVelocityX(0);
  }

  encounterEnter(def, ctx) {
    this.puzzleActive = false;
    this.encounterActive = true;
    this.player.body.setVelocityX(0);
    if (def.pose) this.player.pose(def.pose);
    this.encShot = this.camDir.push({ zoom: (def.camera && def.camera.zoom) || 1.3, focus: ctx.anchor ? { x: (ctx.anchor.x + this.player.x) / 2, y: (ctx.anchor.y + this.player.y) / 2 } : null, ms: 600 });
  }

  encounterExit(def, result) {
    this.encounterActive = false;
    this.camDir.pop(this.encShot, 500);
    // how it went, for the ending's lines (the craft engine: clean, dried, rival)
    if (result && result.ok) {
      this.F[`result:${def.id}`] = { clean: !!result.clean, misses: result.misses || 0, dried: result.dried || 0, rivalFirst: !!result.rivalFirst };
      if (result.clean) this.F[`${def.id}_clean`] = true; // a flag beats can branch on
    }
    if (result && result.ok && def.onWin && this.beats.has(def.onWin)) this.beats.play(def.onWin).catch((e) => console.warn('[dream] beat', e));
  }

  // ---- beats -----------------------------------------------------------------------
  resolveFocus(to) {
    if (!to || to === 'self') return () => ({ x: this.player.x, y: this.player.y - 30 });
    if (typeof to === 'object') return to;
    const [kind, id] = String(to).split(':');
    if (kind === 'npc') return () => {
      const n = this.npcs.get(id);
      return n ? { x: n.x, y: n.y - 50 } : { x: this.player.x, y: this.player.y };
    };
    if (kind === 'anchor') return this.encAnchors[id] || null;
    return null;
  }

  beatHandlers() {
    return {
      say: (v) => this.caption.say(v.who, v.text, v),
      talk: (id) => this.runConversation(id, null),
      camera: (v) => {
        if (v === 'pop') {
          this.camDir.pop(this.camShots.pop(), 500);
          return;
        }
        if (v.vista) this.camShots.push(this.camDir.push({ zoom: v.vista, focus: this.resolveFocus(v.to), ms: v.ms || 900 }));
        else this.camShots.push(this.camDir.push({ zoom: v.push || 1.25, focus: this.resolveFocus(v.to), ms: v.ms || 600 }));
      },
      set: (v) => {
        if (typeof v === 'string') this.F[v] = true;
        else Object.assign(this.F, v);
      },
      objective: (v) => this.setObjective(v),
      music: (v) => this.music.setState(String(v).replace(/^state:/, '')),
      sting: (v) => STINGS[`${v}:open`] ? STINGS[`${v}:open`]() : STINGS[v] && STINGS[v](),
      sfx: (v) => sfx(v),
      hud: (v) => hud.set('profile', v === 'hide' ? 'none' : this.hudProfile),
      lock: (v) => this.inputs.suspend(!!v),
      anim: (v) => (v.who === 'jo' || !v.who ? this.player.pose(v.name) : this.npcs.get(v.who) && this.npcs.get(v.who).anim.playOnce(v.name)),
      spawn: (v) => {
        const room = this.streamer.room(v.room || this.roomId);
        const made = room && this.spawnEntity(v, room);
        if (made) room.entities.push(made);
      },
      despawn: (id) => {
        const n = this.npcs.get(id);
        if (n) n.destroy();
        this.npcs.delete(id);
      },
      encounter: (id) => this.startEncounter(id),
      fade: (v, step) =>
        new Promise((res) => {
          const cam = this.cameras.main;
          if (v === 'out') cam.fadeOut(step.ms || 300);
          else cam.fadeIn(step.ms || 300);
          this.time.delayedCall((step.ms || 300) + 10, res);
        }),
      ending: () => this.endDream(),
    };
  }

  verbCtx() {
    return { scene: this, player: this.player, input: this.inputs, state: {}, flags: this.F, npcs: () => [...this.npcs.values()], services: { caption: this.caption, interaction: this.interaction, beats: this.beats } };
  }

  // ---- the ending ----------------------------------------------------------------
  endDream() {
    if (this.ending.active) return;
    this.ending.play(this.def, { orb: this.orb });
  }

  leaveDream(to = 'Hub') {
    if (this.def.ending && this.def.ending.record === false) clearRun(this.dreamId);
    // the passing-train wipe takes Jo back to the station (WP6, §9)
    trainWipe(
      this,
      () => {
        this.teardown();
        this.scene.start(to, this.def.hubListed === false ? {} : { returnedFrom: this.dreamId });
      },
      { place: placeOf(this), event: 'return' }
    );
  }

  // ---- modal gate (pause through the InputMap) ------------------------------------
  handleModalUpdate() {
    if (this.paused || this.respawning) return true;
    if (this.dialogActive || this.tutorialActive || this.puzzleActive) return true;
    if (this.cardActive) return super.handleModalUpdate();
    if (this.inputs.justDown('pause') && !this.ending.active) {
      this.openPauseMenu();
      return true;
    }
    return false;
  }

  // objectives, teach zones and gate signs follow the room Jo stands in
  updateRoomServices() {
    const pr = this.graph.roomAt(this.player.x, this.player.y);
    if (!pr) return;
    this.playerRoom = pr.id;
    const text = roomObjective(pr.data, this.F);
    const key = `${pr.id}|${text}`;
    if (key !== this._objKey) {
      const first = this._objKey === undefined;
      this._objKey = key;
      this.objectiveRoom = pr.id;
      if (text !== null && !(first && this._resumeObjective)) this.setObjective(text);
    }
    updateTeach(this, { id: pr.id, _x0: pr.tx });
    if (this.gates.length) {
      if (!this.gateSigns) this.gateSigns = new GateSigns(this);
      this.gateSigns.update(this.gates, this.F);
    }
  }

  update(time, delta) {
    if (this.idle) return;
    const dt = Math.min(delta, 50);
    this.inputs.poll();
    // the caption bar waits (hidden) while a scene box has the floor
    if (this.sceneBox.active) this.caption.setAlpha(0);
    else this.caption.update(dt);
    const cam = this.cameras.main;
    // the world keeps its look while anything modal is up
    const visuals = () => {
      const blend = this.graph.blendAt(this.camDir.center ? this.camDir.center.x : this.player.x, this.player.y, this.roomId);
      const rz = (id) => ((this.graph.room(id).data.camera || {}).zoom || 1);
      const roomZoom = blend ? rz(blend.a) + (rz(blend.b) - rz(blend.a)) * blend.t : rz(this.roomId);
      this.camDir.update(dt, { roomId: this.roomId, blend, roomZoom });
      const c = this.camDir.center || { x: this.player.x, y: this.player.y };
      this.commit(this.graph.commitRoom(c.x, c.y, this.roomId));
      this.blend = blend;
      this.backdrop.update(this.roomId, blend, time);
      const amb = (id) => this.graph.room(id).data.ambience || this.def.ambientLoop || null;
      if (blend) ambience.blend(amb(blend.a), amb(blend.b), blend.t);
      else ambience.blend(amb(this.roomId), null, 0);
      this.streamer.update(time);
      for (const w of [...this.watchers]) w();
      for (const n of this.npcs.values()) n.update(dt, this.player);
      if (this.look) this.look.update(time, dt, null);
      if ((this._cullTick = (this._cullTick || 0) + 1) % 15 === 1) this.cullCoins();
      this.perf.update();
    };
    if (this.sceneBox.active) {
      this.sceneBox.update(dt);
      this.interaction.hide();
      this.holdFoes();
      visuals();
      return;
    }
    if (this.ending.active) {
      this.ending.update();
      this.holdFoes();
      visuals();
      return;
    }
    if (this.handleModalUpdate()) {
      this.holdFoes();
      visuals();
      return;
    }
    if (this.encounterActive) {
      this.encounters.update(dt, this.inputs);
      this.player.body.setVelocityX(0);
      this.interaction.hide();
      this.holdFoes();
      visuals();
      return;
    }
    this.player.update(time, delta);
    this.updatePickups(time, delta);
    this.updateAdapters(time);
    for (const v of this.verbs) if (v.mod.update) v.mod.update(v.ctx, dt);
    this.interaction.update(!this.transitions.busy);
    this.barks.update(time);
    // a teleport (respawn at a flag in another room): stream it in at once
    const pr = this.graph.roomAt(this.player.x, this.player.y);
    if (pr && !this.streamer.room(pr.id)) {
      this.streamer.focus(pr.id);
      this.commit(pr.id, { teleport: true });
    }
    for (const g of this.gates) g.update(this.F);
    if (this.orb && !this.ending.active && Math.hypot(this.orb.x - this.player.x, this.orb.y - (this.player.y - 20)) < 48) this.endDream();
    // fell below the room: a heart, back to safe footing
    const here = this.graph.roomAt(this.player.x, this.player.y);
    if (!here || this.player.y > here.y1 + 64) this.fallOut();
    this.updateRoomServices();
    visuals();
    void cam;
  }
}
