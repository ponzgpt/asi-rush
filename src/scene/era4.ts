// Era IV (2016-2022): the datacenter. A cold aisle in perspective, gold-faced AI pods on the left,
// liquid-cooled tensor pods on the right, a wall screen counting chatbot users.
import type { Container } from 'pixi.js';
import { hex } from './palette.ts';
import { standing, PERSON, type Look } from './people.ts';
import { gradient, INK, type Painter } from './pixel.ts';
import { createRoom, rand, type Slot } from './room.ts';
import type { SceneModule } from './types.ts';

const K = {
  ceiling: ['#1a2030', '#222a3c'],
  wall: ['#2a3448', '#222a3a'],
  floor: ['#3a4458', '#4a5670', '#5a6680'],
  tile: '#2a3244',
};

const POD = { w: 26, h: 76 };
const TPU = { w: 26, h: 76 };

const POD_SLOTS: Slot[] = Array.from({ length: 7 }, (_, i) => ({ x: 8 + i * 28, y: 234 }));
const TPU_SLOTS: Slot[] = Array.from({ length: 7 }, (_, i) => ({ x: 278 + i * 28, y: 234 }));

function backdrop(p: Painter) {
  p.poly(
    [
      [0, 0],
      [480, 0],
      [480, 40],
      [0, 40],
    ],
    gradient(K.ceiling, 0, 40),
  );
  // cable trays
  p.shape(
    [
      [0, 22],
      [480, 22],
      [480, 28],
      [0, 28],
    ],
    '#c8a030',
  );
  p.shape(
    [
      [0, 32],
      [480, 32],
      [480, 36],
      [0, 36],
    ],
    '#3a80c0',
  );
  for (let x = 20; x < 480; x += 60) p.rect(x, 2, 30, 4, '#e8f0ff');
  // back wall with the giant screen
  p.poly(
    [
      [0, 40],
      [480, 40],
      [480, 158],
      [0, 158],
    ],
    gradient(K.wall, 40, 158),
  );
  p.shape(
    [
      [150, 52],
      [330, 52],
      [330, 138],
      [150, 138],
    ],
    '#0a0e1a',
  );
  // the old towers, gaming rig and loft relics behind a glass "museum" case
  p.shape(
    [
      [20, 70],
      [120, 70],
      [120, 140],
      [20, 140],
    ],
    gradient(['#4a5a7a', '#3a4a6a'], 70, 140),
  );
  p.shape(
    [
      [30, 116],
      [46, 116],
      [46, 136],
      [30, 136],
    ],
    '#e2cf9e',
  );
  p.shape(
    [
      [54, 108],
      [66, 108],
      [66, 136],
      [54, 136],
    ],
    '#26262e',
  );
  p.shape(
    [
      [74, 104],
      [88, 104],
      [88, 136],
      [74, 136],
    ],
    '#121218',
  );
  p.rect(76, 107, 10, 26, '#ff5ad0');
  p.text(28, 76, 'HISTORY', '#c8d8ff');
  p.line(20, 70, 120, 70, '#e8f8ff');
  // exit sign and fire suppression
  p.shape(
    [
      [380, 60],
      [420, 60],
      [420, 72],
      [380, 72],
    ],
    '#1a6a3a',
  );
  p.text(386, 64, 'EXIT', '#e8ffe8');
  // raised floor with perforated tiles converging on the aisle
  p.poly(
    [
      [0, 158],
      [480, 158],
      [480, 270],
      [0, 270],
    ],
    gradient(K.floor, 158, 270),
  );
  for (let y = 162; y < 270; y += 12) p.line(0, y, 480, y, K.tile);
  for (let x = -240; x <= 720; x += 40) p.line(240 + (x - 240) * 0.3, 158, x, 270, K.tile);
  // cold aisle glow strip
  p.poly(
    [
      [208, 160],
      [272, 160],
      [300, 270],
      [180, 270],
    ],
    gradient(['#4a6a90', '#6a8ab0', '#8ab0d8'], 160, 270),
  );
  // rack frames
  p.shape(
    [
      [4, 150],
      [206, 150],
      [206, 236],
      [4, 236],
    ],
    '#151a26',
  );
  p.shape(
    [
      [274, 150],
      [476, 150],
      [476, 236],
      [274, 236],
    ],
    '#151a26',
  );
}

function foreground(p: Painter) {
  // a crash cart and a tile puller
  p.shape(
    [
      [214, 246],
      [250, 246],
      [250, 258],
      [214, 258],
    ],
    '#8a8a96',
  );
  p.shape(
    [
      [218, 236],
      [246, 236],
      [246, 246],
      [218, 246],
    ],
    '#1a1a22',
  );
  p.ellipse(218, 262, 3, 3, INK);
  p.ellipse(246, 262, 3, 3, INK);
}

function paintPod(p: Painter) {
  // gold-faced GPU system, eight of them stacked into a pod
  p.shape(
    [
      [0, 0],
      [25, 0],
      [25, 75],
      [0, 75],
    ],
    '#1a1a22',
  );
  for (let k = 0; k < 5; k++) {
    const y = 2 + k * 13;
    p.shape(
      [
        [2, y],
        [23, y],
        [23, y + 11],
        [2, y + 11],
      ],
      gradient(['#f0c860', '#c89a30', '#9a7020'], y, y + 11),
    );
    for (let i = 0; i < 9; i++) p.px(4 + i * 2, y + 3 + (i % 2) * 4, '#5a4210');
  }
}

function paintTpu(p: Painter) {
  // liquid-cooled tensor pod: blue hoses and white panels
  p.shape(
    [
      [0, 0],
      [25, 0],
      [25, 75],
      [0, 75],
    ],
    '#a8b0c0',
  );
  for (let k = 0; k < 7; k++) p.rect(4, 4 + k * 10, 17, 6, '#8a94a8');
  p.rect(1, 2, 2, 72, '#3a80c0');
  p.rect(22, 2, 2, 72, '#c03a4a');
}

const tech: Look = {
  skin: '#d8a070',
  skinShade: '#a87848',
  hair: '#3a2010',
  hairStyle: 'bun',
  top: '#3a6aa0',
  topShade: '#2a4a80',
  legs: '#2a2a3a',
  headset: true,
};

/** Hardware art, also used for the shop icons. */
export const ART = {
  dgxPod: { ...POD, paint: paintPod },
  tensorPod: { ...TPU, paint: paintTpu },
};

export function createEra4(root: Container, getLab: () => string): SceneModule {
  return createRoom(root, getLab, {
    backdrop,
    foreground,
    lighting: {
      ambient: '#6a7898',
      vignette: 0.3,
      lights: [
        { x: 240, y: 250, r: 170, color: '#8ab0ff', k: 0.55 }, // the cold aisle
        { x: 240, y: 0, r: 280, color: '#e8f0ff', k: 0.45 }, // ceiling strips
        { x: 100, y: 190, r: 130, color: '#ffc040', k: 0.3 }, // gold pods
        { x: 240, y: 95, r: 120, color: '#4080ff', k: 0.3 }, // the wall screen
      ],
    },
    gauges: {
      cash: { x: 154, y: 56, w: 84 },
      compute: { x: 242, y: 56, w: 84, h: 28 },
      capability: { x: 154, y: 88, w: 172, h: 46 },
      doom: { x: 360, y: 112, r: 12 },
      power: { x: 384, y: 80, w: 52, h: 52 },
    },
    hardware: [
      { id: 'dgxPod', ...POD, paint: paintPod, slots: POD_SLOTS, pile: { dx: 2, dy: -2 } },
      { id: 'tensorPod', ...TPU, paint: paintTpu, slots: TPU_SLOTS, pile: { dx: -2, dy: -2 } },
    ],
    characters: [
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: standing(tech, 1),
        pose: (t) => {
          const k = (t * 0.04) % 2;
          return { x: 196 + (k < 1 ? k : 2 - k) * 60, y: 186, frame: Math.floor(t * 4) };
        },
      },
    ],
    sign: { cx: 240, y: 44, bg: '#0a0e1a', fg: '#8ad0ff' },
    calendar: { x: 340, y: 62, bg: '#ffffff', fg: INK },
    edges: { top: '#1a2030', bottom: '#5a6680', stars: false },
    update: ({ t, fx, glow, sprites, hot, flicker }) => {
      if (!flicker) glow.rect(150, 52, 180, 86).fill({ color: 0x4080ff, alpha: 0.05 });
      (sprites.dgxPod ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        for (let k = 0; k < 5; k++)
          if (rand(i * 7 + k + Math.floor(t * 6)) > 0.4)
            fx.rect(sp.x + 20, sp.y + 4 + k * 13, 2, 1).fill(hex(hot ? '#ff5a52' : '#7dffa8'));
        glow.rect(sp.x, sp.y, 26, 76).fill({ color: 0xffc040, alpha: 0.03 });
      });
      (sprites.tensorPod ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        // coolant pulse travelling down the hose
        const y = (t * 30 + i * 9) % 70;
        fx.rect(sp.x + 1, sp.y + 2 + y, 2, 3).fill(hex('#8ad0ff'));
        fx.rect(sp.x + 22, sp.y + 72 - y, 2, 3).fill(hex('#ff8a9a'));
      });
    },
  });
}
