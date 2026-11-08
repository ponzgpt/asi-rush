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
