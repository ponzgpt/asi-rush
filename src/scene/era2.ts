// Era II (1995-2006): a dot-com office at sunset. Black tower PCs on desks, 1U servers filling a glass closet.
import type { Container } from 'pixi.js';
import { hex } from './palette.ts';
import { seated, standing, PERSON, type Look } from './people.ts';
import { gradient, INK, type Painter } from './pixel.ts';
import { createRoom, rand, type Slot } from './room.ts';
import type { SceneModule } from './types.ts';

const K = {
  wall: ['#b8a888', '#a8946e', '#94805a'],
  carpet: ['#2a4a6a', '#345a7e', '#3e6a90'],
  sunset: ['#3a2a6a', '#9a3a6a', '#f07a4a', '#ffc86a'],
  city: '#2a1a40',
  desk: ['#d8d0c0', '#b8b0a0'],
  black: ['#3a3a44', '#26262e', '#18181e'],
  crt: '#d0ccc0',
  screen: '#0a1a3a',
};

const TOWER = { w: 34, h: 34 };
const SERVER = { w: 24, h: 5 };

const TOWER_SLOTS: Slot[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ x: 40 + i * 50, y: 152 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: 26 + i * 54, y: 214 })),
];
const RACK_X = [372, 404, 436];
const SERVER_SLOTS: Slot[] = RACK_X.flatMap((x) =>
  Array.from({ length: 10 }, (_, k) => ({ x: x + 2, y: 196 - k * 6 })),
);

function backdrop(p: Painter) {
  p.poly(
    [
      [0, 0],
      [480, 0],
      [480, 16],
      [0, 22],
    ],
    '#cfc6b4',
  );
  for (let x = 10; x < 480; x += 48)
    p.shape(
      [
        [x, 2],
        [x + 30, 1],
        [x + 30, 8],
        [x, 9],
      ],
      '#fff8e0',
    ); // ceiling lights
  const back: [number, number][] = [
    [20, 22],
    [470, 16],
    [466, 176],
    [24, 182],
  ];
  p.poly(back, gradient(K.wall, 16, 182));
  p.outline(back, INK);
  // three crooked windows with the city at sunset, blinds half down
  for (const [x, tilt] of [
    [40, -1],
    [150, 1],
    [260, -1],
  ] as const) {
    const w: [number, number][] = [
      [x, 34 + tilt],
      [x + 92, 32 - tilt],
      [x + 94, 112],
      [x - 2, 114],
    ];
    p.poly(w, gradient(K.sunset, 32, 112));
    for (let i = 0; i < 9; i++) {
      const bx = x + 2 + i * 10 + Math.floor(rand(x + i) * 4);
      const bh = 18 + Math.floor(rand(x + i * 7) * 34);
      p.rect(bx, 112 - bh, 8, bh, K.city);
      for (let y = 112 - bh + 3; y < 110; y += 4) if (rand(bx + y) > 0.6) p.px(bx + 3, y, '#ffd27a');
    }
    for (let y = 36; y < 64; y += 3) p.line(x, y, x + 92, y - 2 * tilt, '#e8e0d0');
    p.outline(w, INK);
  }
  // whiteboard and poster
  p.shape(
    [
      [366, 30],
      [452, 28],
      [452, 70],
      [366, 72],
    ],
    '#f6f6f2',
  );
  p.text(372, 36, 'Q3 GOALS:', '#3a5ad0');
  p.text(372, 46, '1. IPO', '#c8323c');
  p.text(372, 56, '2. PROFIT?', '#3a5ad0');
  p.shape(
    [
      [300, 120],
      [340, 118],
      [340, 160],
      [300, 162],
    ],
    '#1a3a8a',
  );
  p.text(304, 126, 'WORLD', '#ffd27a');
  p.text(304, 134, 'WIDE', '#ffd27a');
  p.text(304, 142, 'WEB', '#ffd27a');
  // carpet floor
  const floor: [number, number][] = [
    [0, 190],
    [24, 182],
    [466, 176],
    [480, 186],
    [480, 270],
    [0, 270],
  ];
  p.poly(floor, gradient(K.carpet, 176, 270));
  for (let y = 186; y < 270; y += 8)
    for (let x = (y / 8) % 2 ? 0 : 8; x < 480; x += 16) p.px(x, y, '#5a8ab0');
  // the glass server closet on the right
  p.shape(
    [
      [362, 84],
      [470, 80],
      [470, 210],
      [362, 212],
    ],
    gradient(['#9ad0e0', '#6aa0b8'], 80, 212),
  );
  for (const x of RACK_X)
    p.shape(
      [
        [x, 128],
        [x + 28, 128],
        [x + 28, 206],
        [x, 206],
      ],
      '#1a1a22',
    );
  p.line(362, 84, 470, 80, '#e8ffff');
  // back desks
  p.shape(
    [
      [30, 152],
      [346, 148],
      [346, 158],
      [30, 162],
    ],
    gradient(K.desk, 148, 162),
  );
  for (const x of [34, 180, 336]) p.rect(x, 160, 4, 22, '#8a8478');
  // the old beige PC on a shelf: the past
  p.shape(
    [
      [2, 124],
      [22, 122],
      [22, 126],
      [2, 128],
    ],
    '#8a5a30',
  );
  p.shape(
    [
      [4, 106],
      [18, 106],
      [18, 120],
      [4, 121],
    ],
    '#e2cf9e',
  );
  p.rect(6, 109, 9, 7, '#0d2a1c');
  // water cooler and plant
  p.shape(
    [
      [348, 176],
      [360, 176],
      [360, 196],
      [348, 196],
    ],
    '#e8e8f0',
  );
  p.ellipse(354, 168, 6, 8, '#8ad0f0');
}

function foreground(p: Painter) {
  // front desks hide the bottom of the towers, adventure-game style
  p.shape(
    [
      [0, 214],
      [340, 210],
      [340, 222],
      [0, 226],
    ],
    gradient(K.desk, 210, 226),
  );
  p.shape(
    [
      [0, 226],
      [340, 222],
      [340, 252],
      [0, 256],
    ],
    '#a8a090',
  );
  // beanbag and lava lamp
  p.ellipse(420, 250, 26, 14, INK);
  p.ellipse(420, 249, 25, 13, '#c0304a');
  p.ellipse(414, 244, 12, 6, '#e0506a');
  p.shape(
    [
      [456, 226],
      [466, 226],
      [468, 252],
      [454, 252],
    ],
    '#c0c0c8',
  );
  p.ellipse(461, 236, 4, 8, '#ff5a8a');
  // a foosball table
  p.shape(
    [
      [352, 222],
      [396, 220],
      [398, 238],
      [350, 240],
    ],
    '#3a8a3a',
  );
  p.rect(352, 238, 4, 12, INK);
  p.rect(392, 236, 4, 12, INK);
}

function paintTower(p: Painter) {
  // CRT monitor on the left, black tower on the right
  p.shape(
    [
      [0, 6],
      [20, 5],
      [21, 24],
      [0, 25],
    ],
    gradient([K.crt, '#a8a498'], 5, 25, 'x'),
  );
  p.shape(
    [
      [3, 8],
      [18, 8],
      [18, 21],
      [3, 21],
    ],
    K.screen,
  );
  p.shape(
    [
      [6, 25],
      [15, 25],
      [16, 30],
      [5, 30],
    ],
    '#a8a498',
  );
  p.shape(
    [
      [22, 0],
      [33, 1],
      [33, 33],
      [22, 33],
    ],
    gradient(K.black, 0, 33, 'x'),
  );
  p.rect(24, 4, 7, 1, '#5a5a66');
  p.rect(24, 7, 7, 1, '#5a5a66');
  p.rect(26, 26, 3, 3, '#5a5a66');
}

function paintServer(p: Painter) {
  p.shape(
    [
      [0, 0],
      [23, 0],
      [23, 4],
      [0, 4],
    ],
    gradient(['#5a5a66', '#3a3a44'], 0, 4),
  );
  p.rect(14, 1, 7, 2, '#22222a');
}

const dev: Look = {
  skin: '#c88a5a',
  skinShade: '#9a6a40',
  hair: '#1a1010',
  hairStyle: 'spiky',
  top: '#f0d050',
  topShade: '#c0a030',
  legs: '#3a3a5a',
  headset: true,
};
const ceo: Look = {
  skin: '#f2c09a',
  skinShade: '#c8946a',
  hair: '#c89a3a',
  hairStyle: 'mullet',
  top: '#3a6ad0',
  topShade: '#2a4aa0',
  legs: '#c8b890',
  tie: '#c0304a',
};

/** Hardware art, also used for the shop icons. */
export const ART = {
  towerPc: { ...TOWER, paint: paintTower },
  rackServer: { ...SERVER, paint: paintServer },
};

export function createEra2(root: Container, getLab: () => string): SceneModule {
  return createRoom(root, getLab, {
    backdrop,
    foreground,
    hardware: [
      { id: 'towerPc', ...TOWER, paint: paintTower, slots: TOWER_SLOTS },
      { id: 'rackServer', ...SERVER, paint: paintServer, slots: SERVER_SLOTS },
    ],
    characters: [
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: seated(dev, 1),
        pose: (t) => ({ x: 4, y: 176, frame: Math.floor(t * 5) }),
      },
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: standing(ceo, 1),
        // the CEO paces in front of the windows, on the phone about the IPO
        pose: (t) => {
          const k = (t * 0.05) % 2;
          const x = k < 1 ? 60 + k * 220 : 280 - (k - 1) * 220;
          return { x, y: 140, frame: Math.floor(t * 4) };
        },
      },
    ],
    sign: { cx: 200, y: 20, bg: '#1a3a8a', fg: '#ffd27a' },
    calendar: { x: 336, y: 76, bg: '#ffffff', fg: INK },
    edges: { top: '#cfc6b4', bottom: '#3e6a90', stars: false },
    update: ({ t, fx, glow, sprites, hot, flicker }) => {
      (sprites.towerPc ?? []).forEach((sp, i) => {
        if (!sp.visible || flicker) return;
        // Windows-ish desktop: a taskbar and a window
        fx.rect(sp.x + 3, sp.y + 8, 15, 13).fill(hex('#3a8a8a'));
        fx.rect(sp.x + 3, sp.y + 19, 15, 2).fill(hex('#c0c0c0'));
        const wx = sp.x + 5 + Math.floor(rand(i + Math.floor(t * 0.5)) * 4);
        fx.rect(wx, sp.y + 10, 8, 6).fill(hex('#e0e0e0'));
        fx.rect(wx, sp.y + 10, 8, 1).fill(hex('#1a3aa0'));
        fx.rect(sp.x + 27, sp.y + 26, 1, 1).fill(hex(hot ? '#ff5a52' : '#7dffa8'));
        glow.rect(sp.x + 1, sp.y + 6, 20, 18).fill({ color: 0x6ad0d0, alpha: 0.04 });
      });
      (sprites.rackServer ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        for (let k = 0; k < 3; k++)
          if (rand(i * 9 + k + Math.floor(t * (5 + k))) > 0.35)
            fx.rect(sp.x + 15 + k * 2, sp.y + 2, 1, 1).fill(hex(hot ? '#ffb33c' : '#7dffa8'));
      });
      // sunset glow through the windows
      glow.poly([40, 112, 350, 108, 380, 200, 10, 210]).fill({ color: 0xffa060, alpha: 0.05 });
    },
  });
}
