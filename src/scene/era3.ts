// Era III (2006-2016): a brick loft at night. RGB gaming rigs on desks, 8-GPU servers on wire shelving,
// a neon "DEEP LEARNING" sign and a professor at the whiteboard.
import type { Container } from 'pixi.js';
import { hex } from './palette.ts';
import { seated, standing, PERSON, type Look } from './people.ts';
import { gradient, INK, type Painter } from './pixel.ts';
import { createRoom, gText, rand, type Slot } from './room.ts';
import type { SceneModule } from './types.ts';

const K = {
  brick: ['#6a2a2a', '#5a2224', '#4a1a1e'],
  mortar: '#3a1418',
  floor: ['#4a3426', '#3a281e', '#2a1c16'],
  night: ['#0a0a24', '#1a1a4a', '#3a2a6a'],
  shelf: '#8a8a96',
};

const RIG = { w: 30, h: 34 };
const GPU = { w: 30, h: 10 };

const RIG_SLOTS: Slot[] = [
  ...Array.from({ length: 4 }, (_, i) => ({ x: 14 + i * 46, y: 170 })),
  ...Array.from({ length: 5 }, (_, i) => ({ x: 20 + i * 46, y: 232 })),
];
const SHELF_X = [324, 360, 396, 432];
const GPU_SLOTS: Slot[] = SHELF_X.flatMap((x) => [214, 192, 170, 148, 126].map((y) => ({ x: x + 2, y })));

function backdrop(p: Painter) {
  p.poly(
    [
      [0, 0],
      [480, 0],
      [480, 20],
      [0, 24],
    ],
    '#2a1c1c',
  );
  // ceiling pipes
  p.rect(0, 8, 480, 3, '#6a6a76');
  p.rect(0, 14, 480, 2, '#5a5a66');
  const back: [number, number][] = [
    [0, 24],
    [480, 20],
    [480, 180],
    [0, 186],
  ];
  p.poly(back, gradient(K.brick, 20, 186));
  for (let y = 24; y < 184; y += 6) {
    p.line(0, y, 480, y - 3, K.mortar);
    for (let x = (y / 6) % 2 ? 0 : 10; x < 480; x += 20) p.line(x, y, x, y + 5, K.mortar);
  }
  // big arched factory windows with the city at night
  for (const x of [30, 140]) {
    const w: [number, number][] = [
      [x, 50],
      [x + 4, 38],
      [x + 40, 32],
      [x + 76, 38],
      [x + 80, 50],
      [x + 80, 120],
      [x, 122],
    ];
    p.poly(w, gradient(K.night, 32, 122));
    for (let i = 0; i < 8; i++) {
      const bx = x + 2 + i * 10;
      const bh = 14 + Math.floor(rand(x * 3 + i) * 40);
      p.rect(bx, 120 - bh, 8, bh, '#121230');
      for (let y = 122 - bh; y < 118; y += 4)
        if (rand(bx * 2 + y) > 0.55) p.px(bx + 2 + (y % 3), y, '#ffd27a');
    }
    p.line(x + 40, 32, x + 40, 121, INK);
    p.line(x, 80, x + 80, 80, INK);
    p.outline(w, INK);
  }
  // the professor's whiteboard: a neural net and a loss curve
  p.shape(
    [
      [236, 36],
      [314, 34],
      [314, 92],
      [236, 94],
    ],
    '#c8c8c0',
  );
  for (const [cx, cy] of [
    [248, 48],
    [248, 64],
    [248, 80],
    [268, 56],
    [268, 72],
    [288, 64],
  ])
    p.ellipse(cx as number, cy as number, 3, 3, '#3a5ad0');
  for (const a of [48, 64, 80]) for (const b of [56, 72]) p.line(251, a, 265, b, '#6a7ad0');
  p.line(271, 56, 285, 64, '#6a7ad0');
  p.line(271, 72, 285, 64, '#6a7ad0');
  p.text(296, 40, 'L', '#c8323c');
  for (let x = 0; x < 14; x++) p.px(296 + x, 46 + Math.round(30 / (x + 2)), '#c8323c');
  // a poster of the 2012 image contest
  p.shape(
    [
      [324, 40],
      [362, 38],
      [362, 86],
      [324, 88],
    ],
    '#1a1a1a',
  );
  p.text(328, 46, 'IMAGE', '#ffffff');
  p.text(328, 54, 'NET', '#ffffff');
  for (let i = 0; i < 9; i++)
    p.rect(
      328 + (i % 3) * 10,
      62 + Math.floor(i / 3) * 7,
      8,
      5,
      ['#e0a040', '#60a0e0', '#80c060'][i % 3] ?? INK,
    );
  // wooden floor
  const floor: [number, number][] = [
    [0, 186],
    [480, 180],
    [480, 270],
    [0, 270],
  ];
  p.poly(floor, gradient(K.floor, 180, 270));
  for (let y = 190; y < 270; y += 9) p.line(0, y, 480, y - 2, '#2a1c14');
  // wire shelving for the GPU boxes
  for (const x of SHELF_X) {
    p.rect(x, 104, 2, 112, K.shelf);
    p.rect(x + 32, 104, 2, 112, K.shelf);
  }
  for (const y of [126, 148, 170, 192, 214]) p.rect(SHELF_X[0] ?? 0, y, 144, 2, K.shelf);
  // back desks
  p.shape(
    [
      [6, 170],
      [300, 168],
      [300, 176],
      [6, 178],
    ],
    '#3a3a44',
  );
  // relics on a shelf: a beige PC and a black tower
  p.shape(
    [
      [380, 70],
      [470, 68],
      [470, 72],
      [380, 74],
    ],
    '#7a5a3a',
  );
  p.shape(
    [
      [386, 52],
      [402, 52],
      [402, 68],
      [386, 69],
    ],
    '#b8a67a',
  );
  p.shape(
    [
      [408, 46],
      [420, 46],
      [420, 68],
      [408, 68],
    ],
    '#26262e',
  );
  // a guitar and a mini fridge
  p.shape(
    [
      [450, 150],
      [472, 150],
      [472, 180],
      [450, 180],
    ],
    '#8a8a96',
  );
}

function foreground(p: Painter) {
  p.shape(
    [
      [10, 232],
      [300, 230],
      [300, 240],
      [10, 242],
    ],
    '#3a3a44',
  );
  p.rect(16, 242, 4, 26, INK);
  p.rect(290, 240, 4, 28, INK);
  // pizza boxes and energy drinks
  p.shape(
    [
      [440, 250],
      [476, 248],
      [478, 258],
      [438, 260],
    ],
    '#e0c890',
  );
  p.shape(
    [
      [444, 242],
      [474, 240],
      [476, 250],
      [442, 252],
    ],
    '#e8d4a0',
  );
  for (const x of [404, 412, 420])
    p.shape(
      [
        [x, 252],
        [x + 5, 252],
        [x + 5, 262],
        [x, 262],
      ],
      '#40e070',
    );
}

function paintRig(p: Painter) {
  // ultrawide LCD on a stand + RGB tower with a glass side
  p.shape(
    [
      [0, 2],
      [18, 2],
      [18, 16],
      [0, 16],
    ],
    '#1a1a22',
  );
  p.rect(2, 4, 15, 11, '#0a1420');
  p.rect(8, 16, 3, 8, '#2a2a34');
  p.rect(4, 24, 11, 2, '#2a2a34');
  p.shape(
    [
      [19, 4],
      [29, 4],
      [29, 33],
      [19, 33],
    ],
    '#121218',
  );
  p.rect(21, 7, 7, 22, '#1c1c28');
}

function paintGpuBox(p: Painter) {
  p.shape(
    [
      [0, 0],
      [29, 0],
      [29, 9],
      [0, 9],
    ],
    gradient(['#4a4a56', '#2a2a34'], 0, 9),
  );
  for (let i = 0; i < 4; i++) p.ellipse(5 + i * 6, 5, 2, 2, '#1a1a22');
}

const prof: Look = {
  skin: '#e8b890',
  skinShade: '#b8885a',
  hair: '#d8d8d8',
  hairStyle: 'bald',
  top: '#6a4a2a',
  topShade: '#4a321a',
  legs: '#4a4a5a',
  glasses: true,
  beard: '#d8d8d8',
};
const student: Look = {
  skin: '#8a5a3a',
  skinShade: '#6a4228',
  hair: '#1a1010',
  hairStyle: 'hood',
  top: '#3a3a4a',
  topShade: '#2a2a36',
  legs: '#2a3a5a',
  headset: true,
};

/** Hardware art, also used for the shop icons. */
export const ART = {
  gamingRig: { ...RIG, paint: paintRig },
  gpuServer: { ...GPU, paint: paintGpuBox },
};

export function createEra3(root: Container, getLab: () => string): SceneModule {
  return createRoom(root, getLab, {
    backdrop,
    foreground,
    hardware: [
      { id: 'gamingRig', ...RIG, paint: paintRig, slots: RIG_SLOTS },
      { id: 'gpuServer', ...GPU, paint: paintGpuBox, slots: GPU_SLOTS },
    ],
    characters: [
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: standing(prof, -1),
        pose: (t) => ({ x: 206 + Math.round(Math.sin(t * 0.7) * 5), y: 128, frame: Math.floor(t * 1.5) }),
      },
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: seated(student, 1),
        pose: (t) => ({ x: 248, y: 194, frame: Math.floor(t * 6) }),
      },
    ],
    sign: { cx: 186, y: 22, bg: '#1a0a14', fg: '#ff5ad0' },
    calendar: { x: 200, y: 100, bg: '#ffffff', fg: INK },
    edges: { top: '#2a1c1c', bottom: '#2a1c16', stars: false },
    update: ({ t, fx, glow, sprites, hot, flicker }) => {
      // neon sign
      const on = !flicker && rand(Math.floor(t * 3)) > 0.04;
      const neon = hex('#ff5ad0');
      if (on) {
        glow.roundRect(372, 82, 58, 14, 3).fill({ color: neon, alpha: 0.12 });
      }
      fx.rect(374, 83, 55, 11).fill(hex('#1a0a14'));
      gText(fx, 377, 86, 'DEEP LEARNING', on ? '#ff5ad0' : '#5a2a4a');
      (sprites.gamingRig ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        const hue = (t * 0.3 + i * 0.13) % 1;
        const rgb = hsl(hue);
        fx.rect(sp.x + 21, sp.y + 7, 7, 22).fill({ color: rgb, alpha: 0.6 });
        fx.rect(sp.x + 22, sp.y + 10, 5, 5).fill(hex('#1c1c28'));
        fx.rect(sp.x + 22, sp.y + 20, 5, 5).fill(hex('#1c1c28'));
        glow.rect(sp.x + 18, sp.y + 4, 12, 30).fill({ color: rgb, alpha: 0.08 });
        if (!flicker) {
          // training-loss plot on the screen
          for (let x = 0; x < 13; x++)
            fx.rect(sp.x + 3 + x, sp.y + 6 + Math.round(7 / (1 + x * 0.4 + (t % 6))), 1, 1).fill(
              hex('#7dffa8'),
            );
        }
      });
      (sprites.gpuServer ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        fx.rect(sp.x + 25, sp.y + 3, 2, 1).fill(
          hex(hot ? '#ff5a52' : rand(i + Math.floor(t * 4)) > 0.3 ? '#7dffa8' : '#2a6a3a'),
        );
        glow.rect(sp.x, sp.y, 30, 10).fill({ color: 0x40ff80, alpha: 0.02 });
      });
    },
  });
}

function hsl(h: number): number {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}
