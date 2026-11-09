// Mounts the Pixi world (480x270, nearest filtering, bloom) and swaps the scene when the era changes.
import { AdvancedBloomFilter } from 'pixi-filters';
import { Application, Container, Graphics, TextureStyle } from 'pixi.js';
import { on } from '../state/events.ts';
import type { State } from '../sim/sim.ts';
import { createEra1 } from './era1.ts';
import { createEra2 } from './era2.ts';
import { createEra3 } from './era3.ts';
import { createEra4 } from './era4.ts';
import { createEra5 } from './era5.ts';
import { C, hex } from './palette.ts';
import { H, W, type SceneModule } from './types.ts';

const FACTORIES = [createEra1, createEra2, createEra3, createEra4, createEra5];

export async function mountScene(host: HTMLElement, getState: () => State, getLab: () => string) {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const app = new Application();
  await app.init({
    width: W,
    height: H,
    background: hex(C.sky0),
    antialias: false,
    roundPixels: true,
    resolution: 1,
    preference: 'webgl',
  });
  if (import.meta.env.DEV) Object.assign(window, { __asiApp: app }); // for capturing og.png
  const canvas = app.canvas;
  canvas.style.imageRendering = 'pixelated';
  host.appendChild(canvas);

  // Logical size grows with the frame's aspect so the scene fills it: extra sky above and ground below on tall
  // frames, extra margins on wide ones. The 480x270 scene sits inside, slightly above centre.
  const view = { w: W, h: H, ox: 0, oy: 0 };
  const fit = () => {
    const hw = Math.max(1, host.clientWidth);
    const hh = Math.max(1, host.clientHeight);
    const aspect = hh / hw;
    view.w = aspect >= H / W ? W : Math.min(Math.round(W * 1.6), Math.round(H / aspect));
    view.h = aspect >= H / W ? Math.min(Math.round(W * 1.4), Math.round(W * aspect)) : H;
    view.ox = Math.round((view.w - W) / 2);
    view.oy = Math.round((view.h - H) * 0.42);
    app.renderer.resize(view.w, view.h);
    const scale = Math.min(hw / view.w, hh / view.h);
    canvas.style.width = `${Math.floor(view.w * scale)}px`;
    canvas.style.height = `${Math.floor(view.h * scale)}px`;
    host.style.setProperty('--px', `${Math.max(1, scale)}px`);
    world.position.set(view.ox, view.oy);
  };
  const world = new Container();
  app.stage.addChild(world);
  const ext = new Graphics(); // scene extension outside the 480x270 frame
  world.addChild(ext);
  new ResizeObserver(fit).observe(host);
  fit();
  world.filters = [
    new AdvancedBloomFilter({ threshold: 0.7, bloomScale: 0.8, brightness: 1, blur: 3, quality: 6 }),
  ];

  // scenes are built lazily, one per era, and only the current one is visible and updated
  const scenes = new Map<number, SceneModule>();
  let shown = -1;
  const sceneFor = (era: number) => {
    let m = scenes.get(era);
    if (!m) {
      m = (FACTORIES[era] ?? createEra1)(world, getLab);
      scenes.set(era, m);
    }
    return m;
  };

  let time = 0;
  const fade = new Graphics();
  app.stage.addChild(fade);
  let fadeAlpha = 0;
  let fadeColor = 0x000000;
  on((e) => {
    if (e === 'era') [fadeAlpha, fadeColor] = [1, 0xffffff];
    if (e === 'defeat') [fadeAlpha, fadeColor] = [0.8, 0xff3b30];
  });

  app.ticker.add((ticker) => {
    const s = getState();
    if (s.era !== shown) {
      for (const [era, m] of scenes) m.container.visible = era === s.era;
      sceneFor(s.era).container.visible = true;
      shown = s.era;
    }
    const scene = sceneFor(s.era);
    scene.update(s, ticker.deltaMS);
    drawExtension(ext, scene, view, (time += ticker.deltaMS / 1000));
    fade.clear();
    if (fadeAlpha > 0.01) {
      fade.rect(0, 0, view.w, view.h).fill({ color: fadeColor, alpha: fadeAlpha });
      fadeAlpha *= 0.94;
    }
    // a lost run fades to grey
    if (s.outcome === 'lost' || s.outcome === 'doom')
      fade.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.45 });
  });
}

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Paint the margins around the 480x270 scene (in world coordinates, so negative above/left). */
function drawExtension(
  g: Graphics,
  scene: SceneModule,
  view: { w: number; h: number; ox: number; oy: number },
  time: number,
) {
  g.clear();
  const top = hex(scene.edges.top);
  const bottom = hex(scene.edges.bottom);
  const left = -view.ox;
  const right = view.w - view.ox;
  // above: a darker sky (or roof) fading into the scene's top color
  if (view.oy > 0) {
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const y0 = -view.oy + Math.floor((view.oy * i) / steps);
      const y1 = -view.oy + Math.floor((view.oy * (i + 1)) / steps);
      const k = (i + 1) / steps;
      g.rect(left, y0, view.w, y1 - y0).fill({ color: top, alpha: 0.35 + 0.65 * k });
    }
    if (scene.edges.stars)
      for (let i = 0; i < 70; i++) {
        const x = left + Math.floor(rand(i) * view.w);
        const y = -view.oy + Math.floor(rand(i + 300) * view.oy);
        const tw = rand(i + Math.floor(time * 1.5)) > 0.85;
        g.rect(x, y, 1, 1).fill(hex(tw ? C.star : C.sky3));
      }
    // slow pixel clouds drifting across the upper sky
    if (scene.edges.stars)
      for (let i = 0; i < 4; i++) {
        const span = view.w + 120;
        const cx = left - 60 + ((time * (2 + i) + i * 173) % span);
        const cy = -view.oy + 10 + ((i * 37) % Math.max(20, view.oy - 20));
        for (let k = 0; k < 5; k++) {
          const w = 26 - Math.abs(k - 2) * 7;
          g.rect(Math.round(cx - w / 2 + k * 2), Math.round(cy + k * 2), w, 2).fill({
            color: hex(C.sky3),
            alpha: 0.35,
          });
        }
      }
  }
  // below: the ground continues
  const below = view.h - view.oy - H;
  if (below > 0) {
    g.rect(left, H, view.w, below).fill(bottom);
    g.rect(left, H, view.w, 1).fill({ color: 0x000000, alpha: 0.3 });
  }
  // sides on wide frames: extend the top and bottom colors
  if (view.ox > 0) {
    for (const [x0, x1] of [
      [left, 0],
      [W, right],
    ] as const) {
      g.rect(x0, 0, x1 - x0, Math.round(H * 0.72)).fill(top);
      g.rect(x0, Math.round(H * 0.72), x1 - x0, H - Math.round(H * 0.72)).fill(bottom);
    }
  }
}
