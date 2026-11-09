// Title key art: a beige computer on a hilltop in a storm, wired to the grid, about to come alive.
// Four rival lab towers blink on the horizon. Painted procedurally like the rest of the art.
import { C } from './palette.ts';
import { makeCanvas, type Painter } from './pixel.ts';

const TW = 320;
const TH = 180;

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Height of the hill silhouette at x. */
const hill = (x: number) => Math.round(150 - 58 * Math.exp(-(((x - 160) / 78) ** 2)));

function paintBase(p: Painter) {
  const bands = ['#06051a', '#0d0a26', '#171034', '#241446', '#371a52', '#4f2052'];
  const bh = 20;
  bands.forEach((c, i) => p.rect(0, i * bh, TW, bh, c));
  for (let i = 1; i < bands.length; i++)
    p.dither(0, i * bh - 2, TW, 4, bands[i - 1] ?? '#000', bands[i] ?? '#000');
  p.rect(0, bands.length * bh, TW, TH, '#4f2052');
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rand(i) * TW);
    const y = 30 + Math.floor(rand(i + 90) * 70);
    p.px(x, y, rand(i + 7) > 0.75 ? C.star : '#3a2f66');
  }

  // storm clouds rolling across the top
  for (let layer = 0; layer < 3; layer++) {
    const base = 4 + layer * 9;
    for (let x = 0; x < TW; x++) {
      const h = Math.round(14 + 9 * Math.sin(x / (17 + layer * 5) + layer) + 5 * Math.sin(x / 5 + layer * 3));
      p.rect(x, 0, 1, base + h, layer === 2 ? '#1a1438' : layer === 1 ? '#130f2c' : '#0c0920');
      p.px(x, base + h, layer === 2 ? '#3d3070' : '#2a2252');
    }
  }

  // distant city with the four rival labs' towers
  for (let x = 0; x < TW;) {
    const w = 6 + Math.floor(rand(x + 3) * 10);
    const h = 6 + Math.floor(rand(x + 9) * 16);
    p.rect(x, 132 - h, w, h + 20, '#140d28');
    for (let y = 134 - h; y < 130; y += 3)
      for (let k = x + 1; k < x + w - 1; k += 2) if (rand(k * 13 + y) > 0.8) p.px(k, y, C.cityLit);
    x += w + 1;
  }
  for (const tx of [22, 58, 262, 298]) {
    p.rect(tx, 92, 5, 40, '#120b24');
    p.rect(tx + 1, 88, 3, 4, '#120b24');
    p.rect(tx + 2, 80, 1, 8, '#120b24');
    for (let y = 96; y < 130; y += 4) p.px(tx + 1 + (y % 3), y, C.cityLit);
  }

  // the hill, rim-lit by the sky
  for (let x = 0; x < TW; x++) {
    const y = hill(x);
    p.rect(x, y, 1, TH - y, '#0a0714');
    p.px(x, y, '#3a1f4a');
    if (rand(x) > 0.6) p.px(x, y - 1, '#0a0714'); // grass
  }

  // power pole and the line up the hill
  p.rect(104, 84, 3, 40, '#1a1020');
  p.rect(96, 86, 19, 2, '#1a1020');
  for (let x = 106; x <= 150; x++) {
    const k = (x - 106) / 44;
    p.px(x, Math.round(87 + (80 - 87) * k + 8 * k * (1 - k)), '#0a0714');
  }

  // the workbench and the computer
  const top = hill(160) - 6; // bench top
  p.rect(136, top, 50, 3, C.woodLight);
  p.rect(136, top + 2, 50, 1, C.woodDark);
  p.rect(139, top + 3, 2, 8, C.woodDark);
  p.rect(181, top + 3, 2, 8, C.woodDark);
  const mx = 145;
  const my = top - 30;
  p.block(mx, my, 32, 28, C.beige, C.beigeLight, C.beigeDark);
  p.rect(mx + 3, my + 3, 26, 19, C.beigeShadow);
  p.rect(mx + 4, my + 4, 24, 17, '#06150f');
  // a pixel brain on the screen
  const brain = [
    '..xxxx.xxxx..',
    '.x....x....x.',
    'x..xx.x.xx..x',
    'x.x...x...x.x',
    'x...x.x.x...x',
    '.x.x..x..x.x.',
    '..xxxxxxxxx..',
    '......x......',
  ];
  brain.forEach((row, y) =>
    [...row].forEach((ch, x) => ch === 'x' && p.px(mx + 9 + x, my + 7 + y, y % 2 ? C.screen : C.screenMid)),
  );
  p.rect(mx + 6, my + 18, 14, 1, C.screenMid); // a prompt line
  p.rect(mx + 10, my + 28, 12, 2, C.beigeShadow); // neck
  p.rect(mx + 2, top - 2, 28, 2, C.beige); // keyboard
  p.rect(mx + 2, top - 2, 28, 1, C.beigeLight);
  // antennas wired into the sky
  for (let k = 0; k < 18; k++) {
    p.px(mx + 12 - Math.floor(k / 2), my - k, C.metal);
    p.px(mx + 20 + Math.floor(k / 2), my - k, C.metal);
  }
  p.rect(mx + 2, my - 19, 3, 2, C.metalLight);
  p.rect(mx + 28, my - 19, 3, 2, C.metalLight);

  // the founder, arms raised: it's alive
  const fx = 192;
  const fy = hill(fx) - 22;
  p.rect(fx, fy + 6, 5, 9, C.ink);
  p.rect(fx + 1, fy + 2, 3, 4, C.ink);
  p.rect(fx - 2, fy - 2, 1, 8, C.ink);
  p.rect(fx + 6, fy - 2, 1, 8, C.ink);
  p.rect(fx, fy + 15, 2, 7, C.ink);
  p.rect(fx + 3, fy + 15, 2, 7, C.ink);

  // foreground grass
  for (let x = 0; x < TW; x += 2) {
    const h = 2 + Math.floor(rand(x + 500) * 5);
    p.rect(x, TH - h, 1, h, '#050309');
  }
}

function paintBolt(p: Painter) {
  // a jagged bolt from the clouds to the left antenna, with a branch
  const pts: [number, number][] = [
    [118, 0],
    [126, 8],
    [120, 14],
    [134, 22],
    [130, 28],
    [142, 32],
    [148, 38],
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
  line([120, 14], [106, 24], '#9fd0ff', 1);
  line([106, 24], [100, 34], '#9fd0ff', 1);
}

let cache: { base: string; bolt: string } | null = null;

export function titleArt(): { base: string; bolt: string } {
  cache ??= {
    base: makeCanvas(TW, TH, paintBase).toDataURL(),
    bolt: makeCanvas(TW, TH, paintBolt).toDataURL(),
  };
  return cache;
}
