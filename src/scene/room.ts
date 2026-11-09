// Shared scaffolding for the era scenes: a painted backdrop, hardware that drops into slots as it is bought,
// a foreground layer, animated characters, the lab's sign and a wall calendar showing the year.
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { BuildingId } from '../data/economy.ts';
import { on } from '../state/events.ts';
import { throttle, yearOf, type State } from '../sim/sim.ts';
import { hex } from './palette.ts';
import { drawText, INK, makeTexture, pixelSafe, textWidth, type Painter } from './pixel.ts';
import { H, W, type SceneModule } from './types.ts';

export interface Slot {
  x: number; // left edge
  y: number; // bottom edge (sprites stand on it)
}

export interface Hardware {
  id: BuildingId;
  w: number;
  h: number;
  paint: (p: Painter) => void;
  slots: Slot[];
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
  sprites: Partial<Record<BuildingId, Sprite[]>>;
  hot: boolean; // over the power cap
  flicker: boolean; // a brownout blink this frame
}

export interface RoomDef {
  backdrop: (p: Painter) => void;
  hardware: Hardware[];
  foreground?: (p: Painter) => void; // painted over the hardware (desk fronts, railings...)
  characters?: Character[];
  sign: { cx: number; y: number; bg: string; fg: string };
  calendar: { x: number; y: number; bg: string; fg: string };
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

export function createRoom(root: Container, getLab: () => string, def: RoomDef): SceneModule {
  const world = new Container();
  root.addChild(world);
  world.addChild(new Sprite(makeTexture(W, H, def.backdrop)));

  const sprites: Partial<Record<BuildingId, Sprite[]>> = {};
  const born = new Map<string, number>();
  const seen: Partial<Record<BuildingId, number>> = {};
  for (const hw of def.hardware) {
    const tex = makeTexture(hw.w, hw.h, hw.paint);
    sprites[hw.id] = hw.slots.map((slot) => {
      const sp = new Sprite(tex);
      sp.position.set(slot.x, slot.y - hw.h);
      sp.visible = false;
      world.addChild(sp);
      return sp;
    });
  }

  if (def.foreground) world.addChild(new Sprite(makeTexture(W, H, def.foreground)));

  const chars = (def.characters ?? []).map((c) => {
    const frames: Texture[] = c.frames.map((f) => makeTexture(c.w, c.h, f));
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
        p.rect(0, 0, w + 2, 11, INK);
        p.rect(1, 1, w, 9, def.sign.bg);
        p.text(6, 3, name, def.sign.fg);
      });
      sign.position.set(Math.round(def.sign.cx - w / 2), def.sign.y);
    }

    // hardware drops into its slots as it is bought
    for (const hw of def.hardware) {
      const list = sprites[hw.id] ?? [];
      const n = s.owned[hw.id];
      const before = seen[hw.id] ?? n; // don't animate what was already there on load
      for (let i = before; i < Math.min(n, list.length); i++)
        born.set(`${hw.id}${i}`, time + (i - before) * 0.05);
      seen[hw.id] = n;
      list.forEach((sp, i) => {
        sp.visible = i < n;
        const slot = hw.slots[i];
        if (!slot) return;
        const at = born.get(`${hw.id}${i}`);
        let drop = 0;
        if (at !== undefined) {
          const k = Math.min(1, Math.max(0, (time - at) / 0.35));
          drop = -Math.round((1 - k) * (1 - k) * 16);
          if (k >= 1) born.delete(`${hw.id}${i}`);
        }
        sp.y = slot.y - hw.h + drop;
      });
    }

    for (const c of chars) {
      const pose = c.def.pose(time, s);
      c.sp.visible = pose.visible ?? true;
      c.sp.position.set(Math.round(pose.x), Math.round(pose.y));
      c.sp.texture = c.frames[pose.frame % c.frames.length] ?? c.sp.texture;
    }

    fx.clear();
    glow.clear();

    // wall calendar with the year
    const cal = def.calendar;
    fx.rect(cal.x, cal.y, 21, 13).fill(hex(INK));
    fx.rect(cal.x + 1, cal.y + 1, 19, 11).fill(hex(cal.bg));
    fx.rect(cal.x + 1, cal.y + 1, 19, 3).fill(hex('#c8323c'));
    gText(fx, cal.x + 3, cal.y + 6, String(yearOf(s)), cal.fg);

    // overflow counters
    for (const hw of def.hardware) {
      const extra = s.owned[hw.id] - hw.slots.length;
      const last = hw.slots[hw.slots.length - 1];
      if (extra > 0 && last) {
        const label = `+${extra}`;
        fx.rect(last.x + hw.w - textWidth(label) - 3, last.y - hw.h - 9, textWidth(label) + 4, 8).fill(
          hex(INK),
        );
        gText(fx, last.x + hw.w - textWidth(label) - 1, last.y - hw.h - 8, label, '#ffe9a8');
      }
    }

    def.update?.({ s, t: time, dt, fx, glow, sprites, hot, flicker });

    flash.clear();
    if (flashAlpha > 0.01) {
      flash.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: flashAlpha });
      flashAlpha *= 0.86;
    }
  };

  return { container: world, update, edges: def.edges };
}
