// Era I (late 80s to mid 90s): a crooked suburban garage at night. Beige PCs, a coprocessor rig, Unix workstations.
import type { Container } from 'pixi.js';
import { hex } from './palette.ts';
import { seated, standing, PERSON, type Look } from './people.ts';
import { gradient, INK, type Painter } from './pixel.ts';
import { createRoom, rand, type Slot } from './room.ts';
import type { SceneModule } from './types.ts';

const K = {
  wood: ['#5a3020', '#6e3c26', '#82482c'],
  woodLine: '#3e2016',
  wall: '#7a4a30',
  ceiling: '#2a1820',
  floor: ['#3a3c4e', '#4a4c60', '#5c5e74'],
  beige: '#e2cf9e',
  beigeHi: '#f6e9c4',
  beigeLo: '#b29a68',
  screen: '#0d2a1c',
  phosphor: '#7dffa8',
  pcb: '#2f8a4a',
  pcbHi: '#4cb36a',
  gold: '#f0c24a',
  purple: '#6a3a9a',
  purpleHi: '#8a5ac0',
  teal: '#3ac0b0',
  night: ['#0d0b2a', '#1d1650', '#3a2266'],
  moon: '#fff2c6',
  lamp: '#ffd27a',
};

const PC = { w: 30, h: 30 };
const CARD = { w: 40, h: 6 };
const WS = { w: 40, h: 38 };

const PC_SLOTS: Slot[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ x: 64 + i * 33, y: 140 - (i * 4) / 8 })),
  ...Array.from({ length: 7 }, (_, i) => ({ x: 70 + i * 36, y: 236 })),
];
const CARD_SLOTS: Slot[] = Array.from({ length: 8 }, (_, i) => ({ x: 343, y: 204 - i * 7 }));
const WS_SLOTS: Slot[] = [
  { x: 400, y: 196 },
  { x: 418, y: 232 },
  { x: 376, y: 258 },
  { x: 430, y: 262 },
];

function backdrop(p: Painter) {
  // ceiling beams
  p.poly(
    [
      [0, 0],
      [480, 0],
      [480, 20],
      [0, 30],
    ],
    K.ceiling,
  );
  for (let x = 20; x < 480; x += 60)
    p.shape(
      [
        [x, 0],
        [x + 14, 0],
        [x + 12, 24],
        [x - 2, 26],
      ],
      '#3a2228',
    );
  // back wall: wood panelling
  const back: [number, number][] = [
    [34, 30],
    [452, 20],
    [446, 178],
    [40, 184],
  ];
  p.poly(back, gradient(K.wood, 30, 184));
  for (let x = 44; x < 446; x += 12) p.line(x, 30 - (x - 34) / 40, x + 2, 182 - (x - 34) / 70, K.woodLine);
  p.outline(back, INK);
  // left and right walls
  p.shape(
    [
      [0, 28],
      [34, 30],
      [40, 184],
      [0, 214],
    ],
    gradient(['#3a2016', '#4e2a1c'], 28, 214),
  );
  p.shape(
    [
      [452, 20],
      [480, 6],
      [480, 226],
      [446, 178],
    ],
    gradient(['#3a2016', '#4e2a1c'], 6, 226),
  );
  // the open garage door edge on the right, street light leaking in
  p.poly(
    [
      [462, 30],
      [480, 22],
      [480, 200],
      [460, 170],
    ],
    gradient(['#2a2a50', '#5a4a70'], 22, 200),
  );
  // floor: concrete, lighter toward the viewer
  const floor: [number, number][] = [
    [0, 214],
    [40, 184],
    [446, 178],
    [480, 226],
    [480, 270],
    [0, 270],
  ];
  p.poly(floor, gradient(K.floor, 180, 270));
  for (let i = 0; i < 7; i++) p.line(240 + (i - 3) * 30, 181, 240 + (i - 3) * 120, 270, '#34364a');
  p.ellipse(250, 246, 34, 6, '#2a2c3c');
  p.ellipse(244, 245, 18, 3, '#23243a');

  // crooked window onto the suburb at night
  const win: [number, number][] = [
    [58, 46],
    [150, 42],
    [152, 108],
    [56, 112],
  ];
  p.poly(win, gradient(K.night, 42, 112));
  p.ellipse(130, 58, 6, 6, K.moon);
  for (let i = 0; i < 14; i++)
    p.px(62 + Math.floor(rand(i) * 84), 48 + Math.floor(rand(i + 20) * 30), '#d8d0ff');
  p.poly(
    [
      [64, 112],
      [64, 92],
      [80, 82],
      [96, 92],
      [96, 112],
    ],
    '#120c28',
  ); // neighbour's house
  p.rect(74, 96, 6, 6, K.lamp);
  p.ellipse(124, 100, 12, 12, '#0e1a18'); // tree
  p.rect(122, 100, 3, 12, '#0e1a18');
  p.outline(win, INK);
  p.line(104, 44, 104, 110, INK);
  p.line(57, 78, 151, 76, INK);
  p.shape(
    [
      [52, 42],
      [62, 42],
      [60, 116],
      [50, 118],
    ],
    '#8a2a34',
  ); // curtains
  p.shape(
    [
      [148, 40],
      [158, 38],
      [160, 112],
      [150, 112],
    ],
    '#8a2a34',
  );

  // pegboard with tool silhouettes
  const peg: [number, number][] = [
    [172, 48],
    [262, 46],
    [263, 102],
    [172, 104],
  ];
  p.shape(peg, '#b08a5a');
  for (let y = 52; y < 100; y += 5) for (let x = 176; x < 260; x += 5) p.px(x, y, '#7a5a3a');
  p.shape(
    [
      [182, 56],
      [186, 56],
      [186, 92],
      [182, 92],
    ],
    '#8a8a96',
  ); // saw
  p.shape(
    [
      [180, 56],
      [196, 56],
      [196, 62],
      [180, 62],
    ],
    '#c0303a',
  );
  p.shape(
    [
      [208, 60],
      [214, 60],
      [214, 96],
      [208, 96],
    ],
    '#6a6a76',
  ); // wrench
  p.ellipse(211, 58, 6, 4, '#6a6a76');
  p.shape(
    [
      [228, 58],
      [250, 58],
      [250, 64],
      [228, 64],
    ],
    '#4a4a54',
  ); // hammer
  p.shape(
    [
      [236, 64],
      [241, 64],
      [241, 92],
      [236, 92],
    ],
    '#8a5a30',
  );
  // backprop poster
  const poster: [number, number][] = [
    [276, 42],
    [326, 44],
    [324, 104],
    [274, 102],
  ];
  p.shape(poster, '#f2e3c0');
  p.text(281, 48, 'BACKPROP', '#c8323c');
  for (const [x, y] of [
    [286, 66],
    [286, 82],
    [300, 60],
    [300, 74],
    [300, 88],
    [314, 74],
  ] as const)
    p.ellipse(x, y, 3, 3, '#3a5ad0');
  for (const [a, b, c, d] of [
    [286, 66, 300, 60],
    [286, 66, 300, 74],
    [286, 82, 300, 74],
    [286, 82, 300, 88],
    [300, 60, 314, 74],
    [300, 88, 314, 74],
  ] as const)
    p.line(a, b, c, d, '#3a5ad0');
  // workbench along the back wall
  p.shape(
    [
      [54, 138],
      [334, 132],
      [336, 144],
      [52, 150],
    ],
    gradient(['#c08a50', '#8a5a30'], 132, 150),
  );
  p.shape(
    [
      [56, 150],
      [334, 144],
      [332, 176],
      [58, 182],
    ],
    gradient(['#6a3a20', '#4a2614'], 144, 182),
  );
  for (const x of [60, 190, 326])
    p.shape(
      [
        [x, 176],
        [x + 6, 176],
        [x + 6, 192],
        [x, 192],
      ],
      '#4a2614',
    );

  // the coprocessor rig: an open chassis on the floor
  p.shape(
    [
      [338, 146],
      [390, 144],
      [392, 210],
      [336, 212],
    ],
    '#2a2a34',
  );
  p.shape(
    [
      [340, 148],
      [388, 146],
      [390, 206],
      [340, 208],
    ],
    '#14141c',
  );
  p.ellipse(364, 140, 10, 4, '#3a3a44'); // fan on top
}

function foreground(p: Painter) {
  // extension cords snaking across the floor
  for (const [x0, y0, x1, y1] of [
    [20, 258, 140, 240],
    [140, 240, 220, 262],
    [300, 250, 380, 236],
    [380, 236, 470, 250],
  ] as const) {
    p.line(x0, y0, x1, y1, '#e07a2a');
    p.line(x0, y0 + 1, x1, y1 + 1, INK);
  }
  // a box of manuals in the corner
  p.shape(
    [
      [6, 232],
      [46, 230],
      [48, 262],
      [6, 264],
    ],
    gradient(['#b08a5a', '#8a6a40'], 230, 264),
  );
  p.text(10, 244, 'MANUALS', INK);
}

function paintPc(p: Painter) {
  p.shape(
    [
      [3, 0],
      [26, 1],
      [27, 21],
      [2, 22],
    ],
    gradient([K.beigeHi, K.beige, K.beigeLo], 0, 22, 'x'),
  );
  p.shape(
    [
      [6, 3],
      [23, 4],
      [23, 17],
      [6, 18],
    ],
    K.screen,
  );
  p.shape(
    [
      [0, 22],
      [30, 21],
      [30, 28],
      [0, 29],
    ],
    gradient([K.beigeHi, K.beige], 21, 29),
  );
  p.rect(4, 24, 10, 1, INK); // floppy slot
  p.rect(23, 24, 3, 2, '#c0303a'); // power led bezel
}

function paintCard(p: Painter) {
  p.shape(
    [
      [0, 0],
      [CARD.w - 1, 0],
      [CARD.w - 1, 4],
      [0, 4],
    ],
    K.pcb,
  );
  p.rect(1, 1, CARD.w - 3, 1, K.pcbHi);
  p.rect(6, 1, 8, 3, INK);
  p.rect(18, 1, 6, 3, INK);
  p.rect(4, 5, 24, 1, K.gold);
}

function paintWorkstation(p: Painter) {
  p.shape(
    [
      [4, 0],
      [36, 1],
      [37, 25],
      [3, 26],
    ],
    gradient(['#4a4a58', '#2e2e3a'], 0, 26),
  );
  p.poly(
    [
      [7, 3],
      [33, 4],
      [33, 22],
      [7, 22],
    ],
    gradient(['#1a3a8a', '#0a1a4a'], 3, 22),
  );
  p.outline(
    [
      [7, 3],
      [33, 4],
      [33, 22],
      [7, 22],
    ],
    INK,
  );
  p.shape(
    [
      [0, 27],
      [40, 27],
      [40, 37],
      [0, 37],
    ],
    gradient([K.purpleHi, K.purple], 27, 37),
  );
  p.rect(3, 31, 34, 1, K.teal);
}

const founder: Look = {
  skin: '#f2b58a',
  skinShade: '#c88a62',
  hair: '#5a3018',
  hairStyle: 'mullet',
  top: '#3ab0c8',
  topShade: '#2a8098',
  legs: '#3a4a8a',
  glasses: true,
};

const cat = [0, 1].map((f) => (p: Painter) => {
  p.ellipse(9, 6, 8, 4, INK);
  p.ellipse(9, 6, 7, 3, '#e08a3a');
  p.ellipse(14, 3, 4, 3, '#e08a3a');
  p.poly(
    [
      [12, 1],
      [13, -2],
      [14, 1],
    ],
    '#e08a3a',
  );
  p.poly(
    [
      [15, 1],
      [16, -2],
      [17, 1],
    ],
    '#e08a3a',
  );
  p.rect(1, f ? 3 : 5, 3, 2, '#e08a3a');
  p.rect(15, 3, 1, 1, INK);
});

/** Hardware art, also used for the shop icons. */
export const ART = {
  homePc: { ...PC, paint: paintPc },
  accelCard: { ...CARD, paint: paintCard },
  workstation: { ...WS, paint: paintWorkstation },
};

export function createEra1(root: Container, getLab: () => string): SceneModule {
  return createRoom(root, getLab, {
    backdrop,
    foreground,
    lighting: {
      ambient: '#5a5a88',
      vignette: 0.6,
      lights: [
        { x: 240, y: 60, r: 240, color: '#ffcf80', k: 1.1 }, // the bare bulb
        { x: 104, y: 78, r: 90, color: '#8a9aff', k: 0.5 }, // moonlight through the window
        { x: 190, y: 120, r: 130, color: '#7dffa8', k: 0.22 }, // phosphor screens
        { x: 476, y: 120, r: 120, color: '#ffa860', k: 0.5 }, // street light at the door
      ],
    },
    gauges: {
      compute: { x: 172, y: 46, w: 64, h: 42 },
      doom: { x: 372, y: 58, r: 12 },
      power: { x: 398, y: 30, w: 48, h: 44 },
      capability: { x: 334, y: 86, w: 56, h: 40 },
      cash: { x: 394, y: 86, w: 54 },
    },
    hardware: [
      { id: 'homePc', ...PC, paint: paintPc, slots: PC_SLOTS, pile: { dx: 3, dy: -2 } },
      { id: 'accelCard', ...CARD, paint: paintCard, slots: CARD_SLOTS, pile: { dx: 1, dy: -1 } },
      { id: 'workstation', ...WS, paint: paintWorkstation, slots: WS_SLOTS, pile: { dx: 4, dy: -3 } },
    ],
    characters: [
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: seated(founder, 1),
        pose: (t) => ({ x: 26, y: 146, frame: Math.floor(t * 5) }),
      },
      {
        w: 20,
        h: 10,
        frames: cat,
        pose: (t, s) => ({
          x: 404,
          y: 150,
          frame: Math.floor(t * 0.6) % 6 === 0 ? 1 : 0,
          visible: s.owned.workstation > 0,
        }),
      },
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: standing(
          {
            ...founder,
            hair: '#2a1a10',
            hairStyle: 'bun',
            top: '#c0304a',
            topShade: '#902038',
            legs: '#2a2a40',
            glasses: false,
          },
          -1,
        ),
        pose: (t, s) => ({
          x: 300 + Math.sin(t * 0.25) * 20,
          y: 196,
          frame: Math.floor(t * 3),
          visible: s.owned.accelCard > 0,
        }),
      },
    ],
    sign: { cx: 244, y: 26, bg: '#f2e3c0', fg: '#c8323c' },
    calendar: { x: 334, y: 30, bg: '#f2e3c0', fg: INK },
    edges: { top: '#140c1a', bottom: '#5c5e74', stars: false },
    update: ({ s, t, fx, glow, sprites, hot, flicker }) => {
      // bare bulb and its cone of light
      fx.rect(239, 28, 1, 26).fill(hex(INK));
      fx.circle(240, 58, 4).fill(hex(flicker ? '#6a5a3a' : K.lamp));
      if (!flicker) glow.poly([236, 60, 244, 60, 330, 240, 150, 240]).fill({ color: 0xffd27a, alpha: 0.07 });
      // PC screens: green phosphor text scrolling
      (sprites.homePc ?? []).forEach((sp, i) => {
        if (!sp.visible || flicker) return;
        for (let l = 0; l < 4; l++) {
          const len = 3 + Math.floor(rand(i * 31 + l + Math.floor(t * 3 + i)) * 12);
          fx.rect(sp.x + 8, sp.y + 6 + l * 3, len, 1).fill(hex(l === 3 ? K.phosphor : '#3fbf7f'));
        }
        fx.rect(sp.x + 24, sp.y + 24, 1, 1).fill(
          hex(hot && rand(i + Math.floor(t * 6)) > 0.5 ? '#ff5a52' : K.phosphor),
        );
        glow.rect(sp.x + 4, sp.y + 2, 22, 18).fill({ color: 0x7dffa8, alpha: 0.05 });
      });
      // workstation screens: a spinning wireframe cube
      (sprites.workstation ?? []).forEach((sp, i) => {
        if (!sp.visible || flicker) return;
        const cx = sp.x + 20;
        const cy = sp.y + 13;
        const a = t * 1.5 + i;
        const pts = [0, 1, 2, 3].map(
          (k) =>
            [cx + Math.cos(a + (k * Math.PI) / 2) * 6, cy + Math.sin(a + (k * Math.PI) / 2) * 3] as const,
        );
        pts.forEach(([x, y], k) => {
          const [x2, y2] = pts[(k + 1) % 4] ?? [x, y];
          fx.moveTo(x, y - 3)
            .lineTo(x2, y2 - 3)
            .stroke({ width: 1, color: 0x7dd8ff });
          fx.moveTo(x, y + 3)
            .lineTo(x2, y2 + 3)
            .stroke({ width: 1, color: 0x7dd8ff });
          fx.moveTo(x, y - 3)
            .lineTo(x, y + 3)
            .stroke({ width: 1, color: 0x7dd8ff });
        });
        glow.rect(sp.x + 6, sp.y + 3, 28, 20).fill({ color: 0x3a6aff, alpha: 0.06 });
      });
      // coprocessor LEDs
      (sprites.accelCard ?? []).forEach((sp, i) => {
        if (sp.visible && rand(i * 3 + Math.floor(t * 8)) > 0.4)
          fx.rect(sp.x + 34, sp.y + 1, 2, 2).fill(hex(hot ? '#ffb33c' : '#7dffa8'));
      });
      // pizza boxes pile up with benchmarks
      const boxes = Math.min(12, Math.floor(s.benchmarks / 20));
      for (let i = 0; i < boxes; i++) {
        fx.rect(14 + (i % 2), 228 - i * 3, 26, 3).fill(hex(INK));
        fx.rect(15 + (i % 2), 228 - i * 3, 24, 2).fill(hex(i % 3 ? '#c89a5a' : '#d8aa6a'));
      }
    },
  });
}
