// Mounts the Pixi world (480x270, nearest filtering, bloom) and swaps the scene when the era changes.
import { AdvancedBloomFilter } from 'pixi-filters';
import { Application, Container, Graphics, TextureStyle } from 'pixi.js';
import { on } from '../state/events.ts';
import type { State } from '../sim/sim.ts';
import { createCampus } from './campus.ts';
import { createGarage } from './garage.ts';
import { C, hex } from './palette.ts';
import { H, W, type SceneModule } from './types.ts';
import { createWarehouse } from './warehouse.ts';

const FACTORIES = [createGarage, createWarehouse, createCampus];

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

  const fit = () => {
    // Fill the frame (both axes); integer steps only when there is room for 3x or more.
    const ratio = Math.min(host.clientWidth / W, host.clientHeight / H);
    const scale = ratio >= 3 ? Math.floor(ratio) : ratio;
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
    host.style.setProperty('--px', `${Math.max(1, scale)}px`);
  };
  new ResizeObserver(fit).observe(host);
  fit();

  const world = new Container();
  app.stage.addChild(world);
  world.filters = [
    new AdvancedBloomFilter({ threshold: 0.7, bloomScale: 0.8, brightness: 1, blur: 3, quality: 6 }),
  ];

  // scenes are built lazily, one per era, and only the current one is visible and updated
  const scenes = new Map<number, SceneModule>();
  let shown = -1;
  const sceneFor = (era: number) => {
    let m = scenes.get(era);
    if (!m) {
      m = (FACTORIES[era] ?? createGarage)(world, getLab);
      scenes.set(era, m);
    }
    return m;
  };

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
    sceneFor(s.era).update(s, ticker.deltaMS);
    fade.clear();
    if (fadeAlpha > 0.01) {
      fade.rect(0, 0, W, H).fill({ color: fadeColor, alpha: fadeAlpha });
      fadeAlpha *= 0.94;
    }
    // a lost run fades to grey
    if (s.outcome === 'lost' || s.outcome === 'doom')
      fade.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.45 });
  });
}
