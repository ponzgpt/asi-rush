// Garage cutaway at 480x270, integer-scaled with nearest filtering. Placeholder rectangles only.
import { Application, Graphics, TextureStyle } from 'pixi.js';
import { throttle, type State } from '../sim/sim.ts';

const W = 480;
const H = 270;
const GROUND = 232;
const C = {
  sky: 0x0a0d14,
  ground: 0x1d1a14,
  wall: 0x2b2a26,
  wallEdge: 0x6b5a3a,
  roof: 0x3a2a22,
  pc: 0xc8bc9a,
  screen: 0x33ff66,
  card: 0xff9a2e,
  rack: 0x3c4148,
  led: 0x33ff66,
  ledHot: 0xff3b30,
  fuseOk: 0x33ff66,
};

export async function mountScene(host: HTMLElement, getState: () => State) {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const app = new Application();
  await app.init({
    width: W,
    height: H,
    background: C.sky,
    antialias: false,
    roundPixels: true,
    resolution: 1,
  });
  const canvas = app.canvas;
  canvas.style.imageRendering = 'pixelated';
  host.appendChild(canvas);

  const fit = () => {
    const ratio = host.clientWidth / W;
    const scale = ratio >= 1 ? Math.floor(ratio) : ratio; // integer upscale; shrink only on tiny screens
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  };
  new ResizeObserver(fit).observe(host);
  fit();

  const g = new Graphics();
  app.stage.addChild(g);
  let t = 0;
  app.ticker.add((ticker) => {
    t += ticker.deltaMS / 1000;
    draw(g, getState(), t);
  });
}

function draw(g: Graphics, s: State, t: number) {
  const th = throttle(s);
  const hot = th < 1;
  const blink = (seed: number, rate = 3) => Math.sin(t * rate + seed * 12.9898) > 0;
  g.clear();

  // stars and ground
  for (let i = 0; i < 40; i++) g.rect((i * 97) % W, (i * 53) % 90, 1, 1).fill(0x445066);
  g.rect(0, GROUND, W, H - GROUND).fill(C.ground);

  // power pole with cable into the garage
  g.rect(18, 110, 4, GROUND - 110).fill(0x4a3a2a);
  g.rect(10, 112, 20, 3).fill(0x4a3a2a);
  g.moveTo(28, 114)
    .lineTo(60, 140)
    .stroke({ width: 1, color: hot && blink(1, 20) ? C.ledHot : 0x777777 });

  // garage shell (cutaway)
  const gx = 60;
  const gw = 380;
  const gy = 120;
  g.poly([gx - 10, gy, gx + gw / 2, gy - 40, gx + gw + 10, gy]).fill(C.roof);
  g.rect(gx, gy, gw, GROUND - gy).fill(C.wall);
  g.rect(gx, gy, gw, GROUND - gy).stroke({ width: 2, color: C.wallEdge });

  // fuse box
  g.rect(gx + 6, gy + 14, 14, 20).fill(0x555555);
  const fuseLit = hot ? (blink(2, 14) ? C.ledHot : 0x551111) : C.fuseOk;
  for (let i = 0; i <= Math.min(s.fuseLevel, 5); i++)
    g.rect(gx + 9 + (i % 3) * 3, gy + 18 + Math.floor(i / 3) * 6, 2, 4).fill(fuseLit);

  // home PCs on a desk row along the floor
  const pcs = Math.min(s.owned.homePc, 24);
  for (let i = 0; i < pcs; i++) {
    const x = gx + 28 + (i % 12) * 14;
    const y = GROUND - 12 - Math.floor(i / 12) * 14;
    g.rect(x, y, 11, 9).fill(C.pc);
    g.rect(x + 2, y + 2, 7, 4).fill(hot && blink(i, 8) ? 0x115522 : C.screen);
  }
  // desk shelf for the second row
  if (pcs > 12) g.rect(gx + 26, GROUND - 15, 170, 2).fill(C.wallEdge);

  // accelerator cards in a cabinet
  const cards = Math.min(s.owned.accelCard, 30);
  if (cards > 0) {
    g.rect(gx + 30, gy + 10, 70, 50).fill(0x1f1f1f);
    for (let i = 0; i < cards; i++) {
      g.rect(gx + 33 + (i % 6) * 11, gy + 13 + Math.floor(i / 6) * 9, 9, 6).fill(C.card);
    }
  }

  // server racks along the right wall
  const racks = Math.min(s.owned.serverRack, 8);
  for (let i = 0; i < racks; i++) {
    const x = gx + gw - 22 - (i % 8) * 20;
    const h = 66;
    const y = GROUND - h;
    g.rect(x, y, 16, h).fill(C.rack);
    for (let r = 0; r < 8; r++)
      g.rect(x + 3, y + 4 + r * 8, 2, 2).fill(blink(i * 8 + r, 5) ? (hot ? C.ledHot : C.led) : 0x222222);
  }

  // throttle meter
  g.rect(W - 60, 12, 48, 6).stroke({ width: 1, color: 0x6b5a3a });
  g.rect(W - 59, 13, Math.round(46 * th), 4).fill(hot ? C.ledHot : C.led);
}
