import { getSave, markSeen } from '../utils/save.js';

// D8 — just-in-time tutorials. The first time a save meets a mechanic,
// freeze for a card; dismiss on the key. Never shown twice.
const CARDS = {
  ledge_grab: { name: 'LEDGE GRAB', hint: 'hold toward the edge', key: '←/→' },
  hang_drop: { name: 'HANG & DROP', hint: 'let go to fall', key: '↓' },
  careful_step: { name: 'QUIET LANDING', hint: 'land while crouching', key: '↓' },
  slide_under: { name: 'SLIDE UNDER', hint: 'duck through the grab', key: '↓' },
  shove: { name: 'SHOVE', hint: 'stagger, never hurt', key: 'X' },
  distract: { name: 'DISTRACT', hint: 'make a noise elsewhere', key: 'Q / E' },
  hide: { name: 'HIDE', hint: 'wait for them to pass', key: '↓' },
  plate_gate: { name: 'PRESSURE PLATE', hint: 'weight holds it open', key: 'E' },
  loose_tile: { name: 'LOOSE TILE', hint: 'it will not hold', key: '' },
  sound_bridge: { name: 'SOUND BRIDGE', hint: 'play while airborne', key: 'Q' },
  call_response: { name: 'CALL & RESPONSE', hint: 'listen, then answer', key: 'Q' },
  rest_note: { name: 'THE REST', hint: 'hollow means silence', key: '' },
  wall_jump: { name: 'WALL JUMP', hint: 'only on ribbed walls', key: '↑' },
  slope: { name: 'SLOPES', hint: 'walk, do not jump', key: '' },
};

export function showTutorial(scene, id) {
  if (!CARDS[id]) return false;
  const save = getSave();
  if ((save.seen || []).includes(id)) return false;
  markSeen(id);

  const c = CARDS[id];
  const cam = scene.cameras.main;
  scene.tutorialActive = true;
  scene.physics.pause();

  const depth = 240;
  const objs = [
    scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.55).setScrollFactor(0).setDepth(depth),
    scene.add
      .rectangle(cam.width / 2, cam.height / 2, 380, 130, 0x14101c, 0.97)
      .setScrollFactor(0)
      .setDepth(depth + 1)
      .setStrokeStyle(2, 0xf2d580),
    scene.add
      .text(cam.width / 2, cam.height / 2 - 32, c.name, { fontFamily: 'monospace', fontSize: '20px', color: '#f2d580' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2),
    scene.add
      .text(cam.width / 2, cam.height / 2 + 2, c.hint, { fontFamily: 'monospace', fontSize: '15px', color: '#e8dcc8' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2),
    scene.add
      .text(cam.width / 2, cam.height / 2 + 38, c.key ? `[ ${c.key} ]` : '[ any key ]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#88b8d8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2),
  ];

  const close = () => {
    scene.input.keyboard.off('keydown', handler);
    objs.forEach((o) => o.destroy());
    scene.tutorialActive = false;
    if (!scene.cardActive && !scene.dialogActive && !scene.puzzleActive) scene.physics.resume();
  };
  const handler = () => close();
  scene.time.delayedCall(250, () => scene.input.keyboard.on('keydown', handler));
  return true;
}
