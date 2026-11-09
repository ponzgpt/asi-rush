// Painterly post-process for the procedural art, after the early-90s adventure games: shapes are drawn flat,
// then this pass turns the hard ink outlines into darker shades of the colour next to them (selective
// outlining), adds texture so surfaces read as wood, plaster or concrete instead of flat fills, lights the
// scene with coloured light sources over a tinted ambient, and quantizes with an ordered dither.
import { INK } from './pixel.ts';

export type RGB = [number, number, number];

export interface Light {
  x: number;
  y: number;
  r: number; // radius in pixels
  color: string;
  k: number; // intensity
}

export interface Lighting {
  ambient: string; // colour of the unlit room, e.g. a cool blue at night
  lights: Light[];
  /** Darken toward the top (ceilings) and corners; 0..1. */
  vignette?: number;
}

export function rgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const hash = (x: number, y: number, seed: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return h - Math.floor(h);
};

/** Smooth value noise in 0..1. */
export function noise(x: number, y: number, scale: number, seed = 0): number {
  const fx = x / scale;
  const fy = y / scale;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const tx = fx - ix;
  const ty = fy - iy;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Light reaching a point, per channel (1 = full white light). */
export function lightAt(l: Lighting, x: number, y: number): RGB {
  const amb = rgb(l.ambient);
  const out: RGB = [amb[0] / 255, amb[1] / 255, amb[2] / 255];
  for (const s of l.lights) {
    const d = Math.hypot(x - s.x, y - s.y) / s.r;
    if (d >= 1) continue;
    const f = (1 - d) * (1 - d) * s.k;
    const c = rgb(s.color);
    out[0] += (c[0] / 255) * f;
    out[1] += (c[1] / 255) * f;
    out[2] += (c[2] / 255) * f;
  }
  return out;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const LEVELS = 24; // per channel, after dithering: rich but still visibly pixel-painted

export interface PaintOptions {
  lighting?: Lighting;
  /** World offset of this canvas, so sprites are lit by where they stand. */
  ox?: number;
  oy?: number;
  /** Texture strength (0 = flat). */
  texture?: number;
  seed?: number;
}

/** Run the pass over a canvas in place. Transparent pixels stay transparent. */
export function painterly(canvas: HTMLCanvasElement, o: PaintOptions = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(img.data);
  const d = img.data;
  const ink = rgb(INK);
  const isInk = (i: number) =>
    src[i] === ink[0] && src[i + 1] === ink[1] && src[i + 2] === ink[2] && (src[i + 3] ?? 0) > 0;
  const tex = o.texture ?? 1;
  const seed = o.seed ?? 1;
  const ox = o.ox ?? 0;
  const oy = o.oy ?? 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if ((src[i + 3] ?? 0) === 0) continue;
      let r = src[i] ?? 0;
      let g = src[i + 1] ?? 0;
      let b = src[i + 2] ?? 0;

      // 1. selective outline: an ink pixel becomes a dark shade of its neighbours
      if (isInk(i)) {
        let n = 0;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = (yy * w + xx) * 4;
            if ((src[j + 3] ?? 0) === 0 || isInk(j)) continue;
            sr += src[j] ?? 0;
            sg += src[j + 1] ?? 0;
            sb += src[j + 2] ?? 0;
            n++;
          }
        if (n > 0) {
          r = (sr / n) * 0.42;
          g = (sg / n) * 0.38;
          b = (sb / n) * 0.46;
        } else {
          r = 34;
          g = 22;
          b = 34;
        }
      }

      // 2. texture: broad brush variation plus fine grain and a hint of hue drift
      if (tex > 0) {
        const wx = x + ox;
        const wy = y + oy;
        const broad = noise(wx, wy, 18, seed) - 0.5;
        const mid = noise(wx, wy, 5, seed + 7) - 0.5;
        const grain = hash(wx, wy, seed + 3) - 0.5;
        const k = 1 + tex * (broad * 0.16 + mid * 0.1 + grain * 0.06);
        const hue = tex * (noise(wx, wy, 40, seed + 11) - 0.5) * 14;
        r = r * k + hue;
        g = g * k;
        b = b * k - hue;
      }

      // 3. light: coloured sources over a tinted ambient, cool shadows and warm pools
      if (o.lighting) {
        const L = lightAt(o.lighting, x + ox, y + oy);
        const v = o.lighting.vignette ?? 0;
        const vig = v > 0 ? 1 - v * Math.max(0, 1 - (y + oy) / 90) ** 2 * 0.6 : 1;
        r *= L[0] * vig;
        g *= L[1] * vig;
        b *= L[2] * vig;
      }

      // 4. ordered-dither quantize
      const t = ((BAYER[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16 - 0.5;
      const q = (c: number) => {
        const s = (Math.max(0, Math.min(255, c)) / 255) * (LEVELS - 1) + t;
        return (Math.round(Math.max(0, Math.min(LEVELS - 1, s))) / (LEVELS - 1)) * 255;
      };
      d[i] = q(r);
      d[i + 1] = q(g);
      d[i + 2] = q(b);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Pixi tint (0xRRGGBB, max 1 per channel) for a sprite standing at (x, y). */
export function tintAt(l: Lighting, x: number, y: number): number {
  const L = lightAt(l, x, y);
  const c = (v: number) => Math.round(Math.min(1, v) * 255);
  return (c(L[0]) << 16) | (c(L[1]) << 8) | c(L[2]);
}
