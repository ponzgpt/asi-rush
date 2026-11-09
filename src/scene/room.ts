// Shared scaffolding for the era scenes: a painted, lit backdrop; hardware that piles up in its spots one unit
// per sprite as it is bought; a foreground layer; animated characters; the lab's sign, a wall calendar showing
// the year, and the resources as physical gauges in the room.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { BuildingId } from '../data/economy.ts';
import { on } from '../state/events.ts';
import { throttle, yearOf, type State } from '../sim/sim.ts';
import { drawGauges, type GaugeLayout } from './gauges.ts';
import { painterly, tintAt, type Lighting } from './paint.ts';
import { pilePosition, type Slot } from './pile.ts';
import { hex } from './palette.ts';
import { drawText, makeCanvas, makeTexture, pixelSafe, textWidth, type Painter } from './pixel.ts';
import { H, W, type SceneModule } from './types.ts';

export type { Slot } from './pile.ts';

export interface Hardware {
  id: BuildingId;
  w: number;
  h: number;
  paint: (p: Painter) => void;
  slots: Slot[];
  /** Offset of each extra unit piled behind the first one in a spot (default: up and to the right). */
  pile?: { dx: number; dy: number };
}

export interface Character {
  w: number;
  h: number;
  frames: ((p: Painter) => void)[];
  /** Position and frame for the current time. */
  pose: (t: number, s: State) => { x: number; y: number; frame: number; visible?: boolean };
}

export interface FrameCtx {
  s: State;
  t: number;
  dt: number;
  fx: Graphics; // redrawn every frame, above the hardware
  glow: Graphics; // additive light, redrawn every frame
  sprites: Partial<Record<BuildingId, Sprite[]>>; // only the units currently shown
  hot: boolean; // over the power cap
  flicker: boolean; // a brownout blink this frame
}

export interface RoomDef {
  backdrop: (p: Painter) => void;
  lighting: Lighting;
  hardware: Hardware[];
  foreground?: (p: Painter) => void; // painted over the hardware (desk fronts, railings...)
  characters?: Character[];
  sign: { cx: number; y: number; bg: string; fg: string };
  calendar: { x: number; y: number; bg: string; fg: string };
  gauges: GaugeLayout;
  edges: SceneModule['edges'];
  update?: (c: FrameCtx) => void;
}

export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Pixel text into a Graphics, in world coordinates. */
export function gText(g: Graphics, x: number, y: number, str: string, color: string) {
  const c = hex(color);
  drawText((px, py) => g.rect(px, py, 1, 1).fill(c), x, y, str);
}

/** Exchange symbol from a lab's name: the first four letters. */
export const ticker = (name: string) =>
  name
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4);

function paintedCanvas(w: number, h: number, paint: (p: Painter) => void, lighting?: Lighting, texture = 1) {
  const c = makeCanvas(w, h, paint);
  painterly(c, { lighting, texture });
  return c;
}

function toTexture(c: HTMLCanvasElement): Texture {
  const tex = Texture.from(c);
  tex.source.scaleMode = 'nearest';
  return tex;
}

function painted(
  w: number,
  h: number,
  paint: (p: Painter) => void,
  lighting?: Lighting,
  texture = 1,
): Texture {
  return toTexture(paintedCanvas(w, h, paint, lighting, texture));
}

/** Average colour of one row of a canvas: the lit scene's own edge colour, for the frame extension. */
function rowColor(c: HTMLCanvasElement, y: number): string {
  const d = c.getContext('2d')?.getImageData(0, y, c.width, 1).data;
  if (!d) return '#000000';
  const sum = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] = (sum[k] ?? 0) + (d[i + k] ?? 0);
  const n = d.length / 4;
  return `#${sum
    .map((v) =>
      Math.round(v / n)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

export function createRoom(root: Container, getLab: () => string, def: RoomDef): SceneModule {
  const world = new Container();
  root.addChild(world);
  const back = paintedCanvas(W, H, def.backdrop, def.lighting);
  world.addChild(new Sprite(toTexture(back)));
  const edges = { ...def.edges, top: rowColor(back, 0), bottom: rowColor(back, H - 1) };

  const hwLayer = new Container();
  hwLayer.sortableChildren = true;
  world.addChild(hwLayer);
  const pools = new Map<BuildingId, Sprite[]>();
  const textures = new Map<BuildingId, Texture>();
  for (const hw of def.hardware) {
    textures.set(hw.id, painted(hw.w, hw.h, hw.paint, undefined, 0.6));
    pools.set(hw.id, []);
  }
  const born = new Map<string, number>();
  const seen: Partial<Record<BuildingId, number>> = {};

  if (def.foreground) world.addChild(new Sprite(painted(W, H, def.foreground, def.lighting)));

  const chars = (def.characters ?? []).map((c) => {
    const frames: Texture[] = c.frames.map((f) => painted(c.w, c.h, f, undefined, 0.4));
    const sp = new Sprite(frames[0]);
    world.addChild(sp);
    return { def: c, frames, sp };
  });

  const sign = new Sprite();
  world.addChild(sign);
  let signName = '';

  const fx = new Graphics();
  world.addChild(fx);
  const glow = new Graphics();
  glow.blendMode = 'add';
  world.addChild(glow);
  const flash = new Graphics();
  world.addChild(flash);

  let time = 0;
  let flashAlpha = 0;
  on((e) => {
    if (e === 'ship' || e === 'victory' || e === 'round') flashAlpha = 0.6;
  });

  // Capability history for the wall chart: one sample every 2 s, the last 120
  const history: number[] = [];
  let sampleAt = 0;

  const update = (s: State, deltaMS: number) => {
    const dt = deltaMS / 1000;
    time += dt;
    const hot = throttle(s) < 1;
    const flicker = hot && rand(Math.floor(time * 12)) > 0.75;

    // the lab's sign
    const name = pixelSafe(getLab()).slice(0, 28) || 'GARAGE INTELLIGENCE';
    if (name !== signName) {
      signName = name;
      const w = textWidth(name) + 10;
      sign.texture = makeTexture(w + 2, 13, (p) => {
        p.rect(0, 0, w + 2, 11, '#141018');
        p.rect(1, 1, w, 9, def.sign.bg);
        p.text(6, 3, name, def.sign.fg);
      });
      sign.position.set(Math.round(def.sign.cx - w / 2), def.sign.y);
    }

    // hardware: one sprite per unit owned, dropping into place when bought
    const shown: Partial<Record<BuildingId, Sprite[]>> = {};
    for (const hw of def.hardware) {
      const pool = pools.get(hw.id) ?? [];
      const n = s.owned[hw.id];
      while (pool.length < n) {
        const sp = new Sprite(textures.get(hw.id));
        hwLayer.addChild(sp);
        pool.push(sp);
      }
      const before = seen[hw.id] ?? n; // don't animate what was already there on load
      for (let i = before; i < n; i++) born.set(`${hw.id}${i}`, time + (i - before) * 0.05);
      seen[hw.id] = n;
      pool.forEach((sp, i) => {
        sp.visible = i < n;
        if (!sp.visible) return;
        const pos = pilePosition(hw, i);
        const at = born.get(`${hw.id}${i}`);
        let drop = 0;
        if (at !== undefined) {
          const k = Math.min(1, Math.max(0, (time - at) / 0.35));
          drop = -Math.round((1 - k) * (1 - k) * 16);
          if (k >= 1) born.delete(`${hw.id}${i}`);
        }
        sp.position.set(pos.x, pos.y - hw.h + drop);
        sp.zIndex = pos.y * 4 - pos.depth;
        // lit by the room; units further back in a pile sit in their neighbours' shadow
        const tint = tintAt(def.lighting, pos.x + hw.w / 2, pos.y - hw.h / 2);
        const shade = Math.max(0.45, 1 - pos.depth * 0.06);
        sp.tint =
          (Math.round(((tint >> 16) & 255) * shade) << 16) |
          (Math.round(((tint >> 8) & 255) * shade) << 8) |
          Math.round((tint & 255) * shade);
      });
      shown[hw.id] = pool.slice(0, n);
    }

    for (const c of chars) {
      const pose = c.def.pose(time, s);
      c.sp.visible = pose.visible ?? true;
      c.sp.position.set(Math.round(pose.x), Math.round(pose.y));
      c.sp.texture = c.frames[pose.frame % c.frames.length] ?? c.sp.texture;
      c.sp.tint = tintAt(def.lighting, pose.x + c.def.w / 2, pose.y + c.def.h / 2);
    }

    fx.clear();
    glow.clear();

    // wall calendar with the year
    const cal = def.calendar;
    fx.rect(cal.x, cal.y, 21, 13).fill(hex('#141018'));
    fx.rect(cal.x + 1, cal.y + 1, 19, 11).fill(hex(cal.bg));
    fx.rect(cal.x + 1, cal.y + 1, 19, 3).fill(hex('#c8323c'));
    gText(fx, cal.x + 3, cal.y + 6, String(yearOf(s)), cal.fg);

    if (time >= sampleAt) {
      history.push(s.capability.toNumber());
      if (history.length > 120) history.shift();
      sampleAt = time + 2;
    }

    def.update?.({ s, t: time, dt, fx, glow, sprites: shown, hot, flicker });
    drawGauges(fx, glow, s, def.gauges, time, history, ticker(getLab()));

    flash.clear();
    if (flashAlpha > 0.01) {
      flash.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: flashAlpha });
      flashAlpha *= 0.86;
    }
  };

  return { container: world, update, edges };
}
