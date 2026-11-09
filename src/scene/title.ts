// Title key art, adventure-game style: a crooked road winds up a cartoon hill through the five eras of the
// AI race (garage, dot-com office, GPU loft, datacenter) to a glowing frontier campus at the summit, where the
// storm is about to strike. The founder stands at the bottom with a beige PC under one arm.
import { standing, type Look } from './people.ts';
import { painterly } from './paint.ts';
import { gradient, INK, makeCanvas, type Painter } from './pixel.ts';

const TW = 320;
const TH = 180;

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Height of the main hill at x: a lopsided, curly MI2-style mound peaking right of centre. */
const hill = (x: number) => Math.round(150 - 62 * Math.exp(-(((x - 214) / 84) ** 2)) - 6 * Math.sin(x / 9));

function window_(p: Painter, x: number, y: number, w: number, h: number, lit: string) {
  p.rect(x, y, w, h, INK);
  p.rect(x + 1, y + 1, w - 2, h - 2, lit);
}

function paintBase(p: Painter) {
  // dithered dusk sky
  p.poly(
    [
      [0, 0],
      [TW, 0],
      [TW, TH],
      [0, TH],
    ],
    gradient(['#120a2a', '#24124a', '#4a1e62', '#8a2e6a', '#d0566a'], 0, 140),
  );
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand(i) * TW);
    const y = Math.floor(rand(i + 90) * 60);
    p.px(x, y, rand(i + 7) > 0.7 ? '#fff4c8' : '#6a5a9a');
  }
  // swirling storm clouds, outlined
  for (const [cx, cy, r] of [
    [60, 18, 30],
    [120, 10, 36],
    [190, 6, 34],
    [260, 14, 30],
    [310, 22, 22],
  ] as const) {
    p.ellipse(cx, cy, r + 1, r / 2.2 + 1, INK);
    p.ellipse(cx, cy, r, r / 2.2, gradient(['#3a2a62', '#2a1c4a'], cy - 10, cy + 12));
    p.ellipse(cx - r / 4, cy - 3, r / 2, r / 5, '#4a3a7a');
  }
  // far hills
  p.poly(
    [
      [0, 120],
      [60, 100],
      [110, 112],
      [170, 96],
      [260, 108],
      [320, 98],
      [320, 180],
      [0, 180],
    ],
    gradient(['#3a1a4a', '#2a1238'], 96, 140),
  );
  // main hill
  const pts: [number, number][] = [[0, TH]];
  for (let x = 0; x <= TW; x += 4) pts.push([x, hill(x)]);
  pts.push([TW, TH]);
  p.poly(pts, gradient(['#2a3a2a', '#1e2a22', '#141c18'], 40, 180));
  p.outline(pts.slice(1, -1), INK);
  for (let x = 0; x < TW; x += 3) if (rand(x) > 0.5) p.px(x, hill(x) - 1, '#3a5a3a');

  // the road: switchbacks from bottom-left to the summit
  const road: [number, number][] = [
    [20, 178],
    [110, 164],
    [70, 148],
    [170, 132],
    [130, 112],
    [214, 88],
  ];
  for (let i = 1; i < road.length; i++) {
    const a = road[i - 1] as [number, number];
    const b = road[i] as [number, number];
    const w = 6 - i;
    p.poly(
      [
        [a[0] - w, a[1]],
        [a[0] + w, a[1]],
        [b[0] + w - 1, b[1]],
        [b[0] - w + 1, b[1]],
      ],
      '#8a6a4a',
    );
    p.line(a[0] - w, a[1], b[0] - w + 1, b[1], INK);
    p.line(a[0] + w, a[1], b[0] + w - 1, b[1], INK);
  }

  // I. the garage (bottom, warm bulb, beige glow)
  p.shape(
    [
      [30, 168],
      [62, 166],
      [62, 150],
      [46, 140],
      [30, 150],
    ],
    '#b88a5a',
  );
  p.shape(
    [
      [34, 168],
      [52, 167],
      [52, 155],
      [34, 156],
    ],
    '#6a4a2a',
  );
  window_(p, 54, 152, 6, 6, '#ffd27a');
  p.rect(38, 158, 8, 6, '#e2cf9e');
  p.rect(39, 159, 5, 3, '#2a6a3a');
  // II. the dot-com office (blue glass, sunset reflection)
  p.shape(
    [
      [86, 154],
      [104, 152],
      [104, 116],
      [86, 118],
    ],
    gradient(['#3a5ab0', '#8a4a8a'], 116, 154),
  );
  for (let y = 121; y < 150; y += 5)
    for (const x of [89, 95]) window_(p, x, y, 5, 4, rand(x + y) > 0.4 ? '#ffd27a' : '#2a3a6a');
  p.text(88, 110, 'WWW', '#ffd27a');
  // III. the brick loft with neon
  p.shape(
    [
      [60, 134],
      [92, 132],
      [92, 110],
      [60, 112],
    ],
    '#7a3030',
  );
  for (let y = 116; y < 130; y += 6) for (let x = 63; x < 90; x += 7) window_(p, x, y, 5, 4, '#3a2a6a');
  p.rect(64, 106, 24, 4, INK);
  p.rect(65, 107, 22, 2, '#ff5ad0');
  // IV. the datacenter (long, cold, blue LEDs)
  p.shape(
    [
      [146, 128],
      [192, 126],
      [192, 110],
      [146, 112],
    ],
    '#5a6680',
  );
  for (let x = 149; x < 190; x += 4) p.rect(x, 116, 2, 6, rand(x) > 0.3 ? '#8ad0ff' : '#2a3a5a');
  p.rect(156, 106, 8, 5, '#8a8a96');
  p.rect(172, 106, 8, 5, '#8a8a96');
  // V. the frontier campus at the summit: glass ring and a beacon mast
  p.ellipse(214, 86, 22, 7, INK);
  p.ellipse(214, 85, 21, 6, gradient(['#c8e8ff', '#6a8ab0'], 79, 91));
  p.shape(
    [
      [211, 80],
      [217, 80],
      [216, 56],
      [212, 56],
    ],
    '#c8c8d8',
  );
  p.ellipse(214, 54, 4, 4, '#ffe9a8');
  for (const x of [196, 206, 222, 232]) p.rect(x, 82, 2, 4, '#76b900');

  // power lines feeding the summit
  for (let i = 0; i < 4; i++) {
    const x = 250 + i * 18;
    const y = hill(x) - 14;
    p.rect(x, y, 2, 14, INK);
    p.rect(x - 3, y, 8, 1, INK);
  }
  for (let i = 0; i < 3; i++) {
    const a = 250 + i * 18;
    p.line(a + 1, hill(a) - 14, a + 19, hill(a + 18) - 14, INK);
  }
  p.line(216, 66, 251, hill(250) - 14, INK);
}

const founder: Look = {
  skin: '#f2c09a',
  skinShade: '#c8946a',
  hair: '#7a3a1a',
  hairStyle: 'mullet',
  top: '#c8323c',
  topShade: '#9a2028',
  legs: '#3a4a7a',
  glasses: true,
};

function paintFounder(p: Painter) {
  // big-headed founder in the bottom-right corner, looking up the road
  p.ctx.save();
  p.ctx.translate(262, 126);
  const frame = standing(founder, -1)[1];
  frame?.(p);
  p.ctx.restore();
}

function paintBolt(p: Painter) {
  // a jagged bolt from the clouds to the left antenna, with a branch
  const pts: [number, number][] = [
    [190, 0],
    [198, 10],
    [194, 20],
    [206, 30],
    [204, 40],
    [214, 51],
  ];
  const line = (a: [number, number], b: [number, number], color: string, w: number) => {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(a[0] + ((b[0] - a[0]) * i) / n);
      const y = Math.round(a[1] + ((b[1] - a[1]) * i) / n);
      p.rect(x - Math.floor(w / 2), y, w, 1, color);
    }
  };
  for (let i = 1; i < pts.length; i++)
    line(pts[i - 1] as [number, number], pts[i] as [number, number], '#9fd0ff', 3);
  for (let i = 1; i < pts.length; i++)
    line(pts[i - 1] as [number, number], pts[i] as [number, number], '#ffffff', 1);
  line([194, 20], [182, 30], '#9fd0ff', 1);
  line([182, 30], [178, 40], '#9fd0ff', 1);
}

let cache: { base: string; bolt: string } | null = null;

export function titleArt(): { base: string; bolt: string } {
  cache ??= {
    base: lit(
      makeCanvas(TW, TH, (p) => {
        paintBase(p);
        paintFounder(p);
      }),
    ).toDataURL(),
    bolt: makeCanvas(TW, TH, paintBolt).toDataURL(),
  };
  return cache;
}

/** Same painterly pass as the rooms: dusk ambient, the beacon at the summit, the garage's warm window. */
function lit(c: HTMLCanvasElement): HTMLCanvasElement {
  painterly(c, {
    lighting: {
      ambient: '#8a7aa0',
      lights: [
        { x: 214, y: 54, r: 120, color: '#ffe9a8', k: 0.8 },
        { x: 46, y: 160, r: 70, color: '#ffc070', k: 0.6 },
        { x: 170, y: 120, r: 60, color: '#8ad0ff', k: 0.4 },
      ],
    },
  });
  return c;
}
