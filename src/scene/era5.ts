// Era V (2022-2030): the frontier. A glass mission-control room with silver mini desktops on the desks,
// rack-scale superchips behind, and a panoramic window onto the campus of data halls and its power plant.
import type { Container } from 'pixi.js';
import { hex } from './palette.ts';
import { seated, standing, PERSON, type Look } from './people.ts';
import { gradient, INK, type Painter } from './pixel.ts';
import { createRoom, rand, type Slot } from './room.ts';
import type { SceneModule } from './types.ts';

const K = {
  dusk: ['#1a1040', '#3a2070', '#8a3a7a', '#e07a5a', '#ffc070'],
  hall: '#2a2a40',
  floor: ['#5a5a72', '#4a4a62', '#3a3a50'],
  desk: ['#8a8aa0', '#6a6a82'],
  rack: ['#2a2a32', '#1a1a20'],
};

const RACK = { w: 26, h: 62 };
const HALL = { w: 40, h: 14 };

const RACK_SLOTS: Slot[] = Array.from({ length: 9 }, (_, i) => ({ x: 20 + i * 30, y: 176 }));
// data halls are built on the campus outside the window, row by row towards the horizon
const HALL_SLOTS: Slot[] = [
  ...Array.from({ length: 4 }, (_, i) => ({ x: 296 + i * 44, y: 124 })),
  ...Array.from({ length: 4 }, (_, i) => ({ x: 300 + i * 42, y: 106 })),
];

function backdrop(p: Painter) {
  // panoramic window: dusk sky, desert campus, power plant on the horizon
  p.poly(
    [
      [0, 0],
      [480, 0],
      [480, 130],
      [0, 130],
    ],
    gradient(K.dusk, 0, 120),
  );
  p.poly(
    [
      [0, 96],
      [120, 88],
      [260, 94],
      [480, 86],
      [480, 130],
      [0, 130],
    ],
    gradient(['#6a4a5a', '#8a6a6a'], 86, 130),
  );
  // power plant: cooling towers and steam
  for (const x of [200, 236]) {
    p.shape(
      [
        [x, 96],
        [x + 24, 96],
        [x + 20, 78],
        [x + 22, 66],
        [x + 2, 66],
        [x + 4, 78],
      ],
      '#8a8090',
    );
  }
  // transmission lines
  for (const x of [130, 170, 270]) {
    p.line(x, 104, x + 4, 84, INK);
    p.line(x + 8, 104, x + 4, 84, INK);
  }
  p.line(0, 86, 480, 88, '#3a2a3a');
  // window mullions
  for (const x of [0, 96, 192, 288, 384, 479]) p.rect(x, 0, 2, 132, '#3a3a50');
  p.rect(0, 0, 480, 4, '#3a3a50');
  p.rect(0, 130, 480, 4, '#3a3a50');
  // interior back wall, low, with the rack row against it
  p.poly(
    [
      [0, 134],
      [480, 134],
      [480, 182],
      [0, 182],
    ],
    gradient(['#4a4a62', '#3a3a50'], 134, 182),
  );
  // the museum shelf: a beige PC, a black tower, an RGB rig and a gold pod, the whole story so far
  p.shape(
    [
      [300, 168],
      [474, 168],
      [474, 172],
      [300, 172],
    ],
    '#7a7a90',
  );
  p.shape(
    [
      [306, 152],
      [320, 152],
      [320, 167],
      [306, 167],
    ],
    '#e2cf9e',
  );
  p.shape(
    [
      [326, 146],
      [336, 146],
      [336, 167],
      [326, 167],
    ],
    '#26262e',
  );
  p.shape(
    [
      [342, 144],
      [354, 144],
      [354, 167],
      [342, 167],
    ],
    '#121218',
  );
  p.rect(344, 147, 8, 18, '#ff5ad0');
  p.shape(
    [
      [360, 140],
      [374, 140],
      [374, 167],
      [360, 167],
    ],
    gradient(['#f0c860', '#9a7020'], 140, 167),
  );
  p.text(384, 156, 'HOW WE GOT HERE', '#c8c8e0');
  // polished floor
  p.poly(
    [
      [0, 182],
      [480, 182],
      [480, 270],
      [0, 270],
    ],
    gradient(K.floor, 182, 270),
  );
  for (let x = -100; x < 580; x += 48) p.line(240 + (x - 240) * 0.4, 182, x, 270, '#6a6a84');
  // curved mission-control desk (the minis sit on it)
  p.poly(
    [
      [0, 226],
      [120, 216],
      [360, 216],
      [480, 226],
      [480, 236],
      [360, 228],
      [120, 228],
      [0, 236],
    ],
    gradient(K.desk, 216, 236),
  );
  p.outline(
    [
      [0, 226],
      [120, 216],
      [360, 216],
      [480, 226],
      [480, 236],
      [360, 228],
      [120, 228],
      [0, 236],
    ],
    INK,
  );
}

function foreground(p: Painter) {
  // desk front panel
  p.poly(
    [
      [0, 236],
      [120, 228],
      [360, 228],
      [480, 236],
      [480, 270],
      [0, 270],
    ],
    gradient(['#5a5a72', '#3a3a50'], 228, 270),
  );
  p.line(0, 236, 120, 228, INK);
  p.line(120, 228, 360, 228, INK);
  p.line(360, 228, 480, 236, INK);
  // a bonsai and a coffee mug on the desk
  p.rect(452, 214, 10, 10, '#8a5a3a');
  p.ellipse(457, 208, 10, 6, '#3a8a4a');
  p.shape(
    [
      [30, 214],
      [38, 214],
      [38, 224],
      [30, 224],
    ],
    '#c8c8d0',
  );
}

function paintRack(p: Painter) {
  // rack-scale superchip system: black chassis, green-gold trays, top-of-rack switch
  p.shape(
    [
      [0, 0],
      [25, 0],
      [25, 61],
      [0, 61],
    ],
    gradient(K.rack, 0, 61, 'x'),
  );
  p.rect(2, 2, 22, 4, '#3a3a46');
  for (let k = 0; k < 9; k++) {
    const y = 8 + k * 6;
    p.rect(2, y, 22, 4, k % 3 === 1 ? '#3a3a46' : '#1e2a1e');
    p.rect(3, y + 1, 4, 2, '#76b900');
  }
}

function paintHall(p: Painter) {
  // a long low data hall with rooftop chillers
  p.shape(
    [
      [0, 4],
      [39, 4],
      [39, 13],
      [0, 13],
    ],
    '#9a94a4',
  );
  for (let i = 0; i < 6; i++) p.rect(2 + i * 6, 1, 4, 3, '#8a8a96');
  p.rect(0, 9, 39, 1, '#7a7488');
}

const lead: Look = {
  skin: '#f0c8a0',
  skinShade: '#c09870',
  hair: '#2a1a10',
  hairStyle: 'long',
  top: '#1a1a22',
  topShade: '#0e0e14',
  legs: '#2a2a3a',
};
const eng: Look = {
  skin: '#a87048',
  skinShade: '#80502e',
  hair: '#1a1010',
  hairStyle: 'spiky',
  top: '#e8e8f0',
  topShade: '#c0c0cc',
  legs: '#3a4a6a',
  glasses: true,
};

/** Hardware art, also used for the shop icons. */
export const ART = {
  rubinRack: { ...RACK, paint: paintRack },
  dataHall: { ...HALL, paint: paintHall },
};

export function createEra5(root: Container, getLab: () => string): SceneModule {
  return createRoom(root, getLab, {
    backdrop,
    foreground,
    hardware: [
      { id: 'rubinRack', ...RACK, paint: paintRack, slots: RACK_SLOTS },
      { id: 'dataHall', ...HALL, paint: paintHall, slots: HALL_SLOTS },
    ],
    characters: [
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: standing(lead, -1),
        pose: (t) => ({ x: 300 + Math.round(Math.sin(t * 0.3) * 30), y: 182, frame: Math.floor(t * 2) }),
      },
      {
        w: PERSON.w,
        h: PERSON.h,
        frames: seated(eng, 1),
        pose: (t) => ({ x: 120, y: 190, frame: Math.floor(t * 6) }),
      },
    ],
    sign: { cx: 240, y: 8, bg: '#1a1a22', fg: '#ffffff' },
    calendar: { x: 448, y: 140, bg: '#ffffff', fg: INK },
    edges: { top: '#1a1040', bottom: '#3a3a50', stars: true },
    update: ({ s, t, fx, glow, sprites, hot, flicker }) => {
      // silver mini desktops and displays along the desk, one per model shipped (always a few)
      const minis = Math.min(8, 3 + s.modelsShipped);
      for (let i = 0; i < minis; i++) {
        const x = 160 + i * 34;
        fx.rect(x, 200, 22, 14).fill(hex(INK));
        fx.rect(x + 1, 201, 20, 12).fill(hex(flicker ? '#0a0a12' : '#0e1a2a'));
        fx.rect(x + 10, 214, 2, 3).fill(hex('#a8a8b8'));
        fx.rect(x + 2, 217, 9, 3).fill(hex('#a8a8b8'));
        fx.rect(x + 2, 217, 9, 1).fill(hex('#c8c8d4'));
        if (!flicker)
          for (let k = 0; k < 4; k++)
            fx.rect(x + 3, 203 + k * 2, 4 + Math.floor(rand(i * 5 + k + Math.floor(t * 2)) * 14), 1).fill(
              hex(k ? '#8ad0ff' : '#ffd27a'),
            );
      }
      (sprites.rubinRack ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        for (let k = 0; k < 9; k++)
          if (rand(i * 11 + k + Math.floor(t * 8)) > 0.5)
            fx.rect(sp.x + 20, sp.y + 9 + k * 6, 2, 1).fill(hex(hot ? '#ff5a52' : '#76ff00'));
        glow.rect(sp.x, sp.y, 26, 62).fill({ color: 0x76b900, alpha: 0.025 });
      });
      (sprites.dataHall ?? []).forEach((sp, i) => {
        if (!sp.visible) return;
        if (rand(i + Math.floor(t)) > 0.3)
          fx.rect(sp.x + 4 + ((i * 7) % 30), sp.y + 6, 2, 1).fill(hex('#ffd27a'));
      });
      // steam from the cooling towers
      for (let k = 0; k < 8; k++) {
        const ph = (t * 0.25 + k / 8) % 1;
        for (const x of [212, 248])
          fx.circle(x + Math.sin(k + t) * 3 + ph * 10, 64 - ph * 40, 3 + ph * 6).fill({
            color: 0xffffff,
            alpha: 0.35 * (1 - ph),
          });
      }
      // warning beacons on the towers
      if (Math.floor(t * 1.5) % 2)
        for (const x of [212, 248]) glow.circle(x, 66, 2).fill({ color: 0xff3030, alpha: 0.8 });
    },
  });
}
