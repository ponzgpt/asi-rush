// Pixel painter: draw sprites with integer rects on an offscreen canvas, then hand them to Pixi
// (textures) or the DOM (data URLs). Keeps all art procedural and crisp, with no image assets.
import { Texture } from 'pixi.js';

export class Painter {
  readonly ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = false;
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  px(x: number, y: number, color: string) {
    this.rect(x, y, 1, 1, color);
  }

  /** Checkerboard blend of two colors, the classic 2-color dither. */
  dither(x: number, y: number, w: number, h: number, a: string, b: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, (i + j) % 2 ? a : b);
  }

  /** Bevelled block: fill with a 1px light top-left edge and dark bottom-right edge. */
  block(x: number, y: number, w: number, h: number, fill: string, light: string, dark: string) {
    this.rect(x, y, w, h, fill);
    this.rect(x, y, w, 1, light);
    this.rect(x, y, 1, h, light);
    this.rect(x, y + h - 1, w, 1, dark);
    this.rect(x + w - 1, y, 1, h, dark);
  }

  text(x: number, y: number, str: string, color: string) {
    drawText((px, py) => this.px(px, py, color), x, y, str);
  }

  // --- SCUMM-style shapes: crooked polygons, dark outlines, dithered gradients ---

  /** Fill a polygon on the pixel grid (scanline, even-odd), with no anti-aliasing. */
  poly(pts: Pt[], color: string | ((x: number, y: number) => string)) {
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys));
    const y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const cy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i] as Pt;
        const b = pts[(i + 1) % pts.length] as Pt;
        if (a[1] <= cy !== b[1] <= cy) xs.push(a[0] + ((cy - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      xs.sort((m, n) => m - n);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const xa = Math.round(xs[i] as number);
        const xb = Math.round(xs[i + 1] as number);
        if (typeof color === 'string') this.rect(xa, y, xb - xa, 1, color);
        else for (let x = xa; x < xb; x++) this.px(x, y, color(x, y));
      }
    }
  }

  /** 1px line (Bresenham). */
  line(x0: number, y0: number, x1: number, y1: number, color: string) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  outline(pts: Pt[], color: string) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i] as Pt;
      const b = pts[(i + 1) % pts.length] as Pt;
      this.line(a[0], a[1], b[0], b[1], color);
    }
  }

  /** A cartoon shape: filled, then outlined in the ink color. */
  shape(pts: Pt[], fill: string | ((x: number, y: number) => string), ink: string = INK) {
    this.poly(pts, fill);
    this.outline(pts, ink);
  }

  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string | ((x: number, y: number) => string),
  ) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const k = 1 - ((y + 0.5 - cy) / ry) ** 2;
      if (k < 0) continue;
      const half = rx * Math.sqrt(k);
      const xa = Math.round(cx - half);
      const xb = Math.round(cx + half);
      if (typeof color === 'string') this.rect(xa, y, xb - xa, 1, color);
      else for (let x = xa; x < xb; x++) this.px(x, y, color(x, y));
    }
  }
}

export type Pt = [x: number, y: number];

/** The dark purple-brown outline every object gets, MI2/DOTT style. */
export const INK = '#1c1020';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Ordered-dither gradient: returns a color function for `poly`/`ellipse` that blends through `stops` along
 * the vertical (or horizontal) span from a to b. Gives the painted, banded skies and walls of the era.
 */
export function gradient(stops: string[], a: number, b: number, axis: 'y' | 'x' = 'y') {
  return (x: number, y: number) => {
    const v = axis === 'y' ? y : x;
    const k = Math.min(0.9999, Math.max(0, (v - a) / Math.max(1, b - a))) * (stops.length - 1);
    const i = Math.floor(k);
    const frac = k - i;
    const threshold = ((BAYER[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16;
    return (frac > threshold ? stops[i + 1] : stops[i]) ?? stops[0] ?? INK;
  };
}

export function makeCanvas(w: number, h: number, paint: (p: Painter) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(new Painter(c));
  return c;
}

export function makeTexture(w: number, h: number, paint: (p: Painter) => void): Texture {
  const tex = Texture.from(makeCanvas(w, h, paint));
  tex.source.scaleMode = 'nearest';
  return tex;
}

export function makeDataUrl(w: number, h: number, paint: (p: Painter) => void): string {
  return makeCanvas(w, h, paint).toDataURL();
}

// --- 3x5 pixel font ------------------------------------------------------

const GLYPHS: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101110011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '110001010100111',
  '3': '110001010001110',
  '4': '101101111001001',
  '5': '111100110001110',
  '6': '011100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001110',
  ' ': '000000000000000',
  '+': '000010111010000',
  '-': '000000111000000',
  '.': '000000000000010',
  ':': '000010000010000',
  '%': '101001010100101',
  '?': '110001010000010',
  '/': '001001010100100',
  $: '011110010011110',
  '!': '010010010000010',
  '(': '010100100100010',
  ')': '010001001001010',
  '=': '000111000111000',
  '^': '010101000000000',
  '>': '100010001010100',
  '&': '010101010101011',
  '#': '101111101111101',
};

/** Width in pixels of a string in the 3x5 font (1px spacing). */
export function textWidth(str: string): number {
  return Math.max(0, str.length * 4 - 1);
}

export function drawText(plot: (x: number, y: number) => void, x: number, y: number, str: string) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS['?'] ?? '';
    for (let i = 0; i < 15; i++) if (g[i] === '1') plot(cx + (i % 3), y + Math.floor(i / 3));
    cx += 4;
  }
}

/** Keep only characters the pixel font can draw. */
export function pixelSafe(str: string): string {
  return str
    .toUpperCase()
    .split('')
    .filter((c) => c in GLYPHS)
    .join('');
}
