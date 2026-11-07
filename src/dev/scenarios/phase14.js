// Phase 1.4 scenarios (teaching, objectives, gate signs, title):
//                          fires at the foot, and Jo climbs out by wall-jumps
//   gate-hint-visible      a gate's sign (what opens it) is on screen while
//                          Jo is still well short of the gate
//   objective-room-entry   the objective changes when Jo enters the next
//                          room (writer arrival → attic)
//   title-continue         the title offers Continue on a save; it resumes at
//                          the station with the in-dream run on the board
import { getRun, clearRun, unmarkSeen } from '../../utils/save.js';
import { roomObjective } from '../../play/Objectives.js';

const T = 32;

function settle(dc) {
  for (let i = 0; i < 80; i++) {
    const sc = dc.scene();
    if (!(sc.dialogActive || sc.tutorialActive || sc.cardActive)) break;
    dc.press('action', 2);
    dc.step(30);
  }
  dc.step(5);
}

function put(sc, x, y) {
  const p = sc.player;
  p.setPosition(x, y);
  p.body.reset(x, y);
}

const gateHint = {
  id: 'gate-hint-visible',
  async run(dc) {
    dc.warp('astronaut', 'gym');
    dc.step(60);
    settle(dc);
    const sc = dc.scene();
    const g = sc.gates[0];
    // ten tiles short of the gate, on its floor
    put(sc, g.wx - 10 * T, sc.player.y);
    dc.step(40);
    const sign = sc.gateSigns && sc.gateSigns.state(g.id);
    const view = sc.cameras.main.worldView;
    const onScreen = !!sign && sign.x > view.x && sign.x < view.right;
    const far = Math.abs(g.wx - sc.player.x) > 6 * T;
    return { pass: !!sign && onScreen && far && !!sign.hint, detail: sign ? `sign "${sign.hint}" ${sign.marks}; on screen ${onScreen}; Jo ${Math.round(Math.abs(g.wx - sc.player.x) / T)} tiles from the gate` : 'no sign' };
  },
};

const objectiveEntry = {
  id: 'objective-room-entry',
  async run(dc) {
    const out = [];
    let pass = true;
    for (const [dream, from, to, toX] of [['writer', 'arrival', 'attic', null]]) {
      dc.warp(dream);
      dc.step(60);
      settle(dc);
      const sc = dc.scene();
      const rooms = sc.built.rooms;
      const a = rooms.find((r) => r.id === from);
      const b = rooms.find((r) => r.id === to);
      put(sc, (a._x0 + 4) * T, sc.player.y);
      dc.step(20);
      settle(dc);
      const before = sc.objectiveText.text;
      put(sc, ((toX !== null ? toX : b._x0 + 4)) * T, sc.player.y);
      dc.step(20);
      settle(dc);
      const after = sc.objectiveText.text;
      const want = roomObjective(b, sc.F);
      const ok = after === want && after !== before;
      if (!ok) pass = false;
      out.push(`${dream} ${from} "${before}" → ${to} "${after}"${ok ? '' : ` (want "${want}")`}`);
    }
    return { pass, detail: out.join('; ') };
  },
};

const titleContinue = {
  id: 'title-continue',
  async run(dc) {
    dc.warp('chef');
    dc.step(60);
    settle(dc);
    const sc = dc.scene();
    const f = sc.flags.getChildren().find((x) => x.texture.key === 'flag');
    sc.activateCheckpoint(f);
    const run = getRun('chef');
    const g = window.game;
    g.scene.getScenes(true).forEach((s) => s.sys.settings.key !== 'UI' && g.scene.stop(s.sys.settings.key));
    g.scene.start('Title');
    dc.step(5);
    const title = dc.scene();
    const offered = title.sys.settings.key === 'Title' && title.state().items[0] === 'continue';
    title.choose('continue');
    dc.step(60);
    const hub = dc.scene();
    const atHub = hub.sys.settings.key === 'Hub';
    const row = atHub && hub.boardRows().find((r) => r.status === 'CONTINUE');
    clearRun('chef');
    return { pass: !!run && offered && atHub && !!row, detail: `run saved ${!!run}; title offers Continue first ${offered}; at the station ${atHub}; board shows CONTINUE ${!!row}` };
  },
};

export default [gateHint, objectiveEntry, titleContinue];
