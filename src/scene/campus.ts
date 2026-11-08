// Era III: a hyperscale campus at night, seen from across the lake. 480x270.
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { pDoom, throttle, type State } from '../sim/sim.ts';
import { C, hex } from './palette.ts';
import { drawText, makeTexture, pixelSafe, textWidth, type Painter } from './pixel.ts';
import { H, W, type SceneModule } from './types.ts';

const GROUND = 200;
const K = {
  mountain: '#1a1530',
  mountainEdge: '#2a2244',
  ground: '#141a1c',
  lot: '#1f2528',
  road: '#101215',
  lake: '#0f1a33',
  lakeLight: '#1d3260',
  hall: '#3a4150',
  hallLight: '#535b6e',
  hallDark: '#262b36',
  core: '#202634',
  coreEdge: '#3a4560',
  tower: '#7c8394',
  towerShade: '#585e6e',
  steam: '#c9cfdc',
  crane: '#e0b030',
};

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const HALL_BACK = { w: 54, h: 18 };
const HALL_FRONT = { w: 72, h: 26 };
const HALL_SLOTS: { x: number; y: number; front: boolean }[] = [
  { x: 296, y: 186 - HALL_BACK.h, front: false },
  { x: 354, y: 186 - HALL_BACK.h, front: false },
  { x: 412, y: 186 - HALL_BACK.h, front: false },
  { x: 150, y: 232 - HALL_FRONT.h, front: true },
  { x: 228, y: 232 - HALL_FRONT.h, front: true },
  { x: 306, y: 232 - HALL_FRONT.h, front: true },
  { x: 384, y: 232 - HALL_FRONT.h, front: true },
  { x: 462 - HALL_BACK.w, y: 170 - HALL_BACK.h, front: false },
];
const TOWERS = [8, 40, 72, 104];
const CORE = { x: 196, y: 98, w: 88, h: 92, cols: 8, rows: 10 };

function paintBackdrop(p: Painter) {
  const bands = [C.sky0, C.sky1, C.sky2, C.sky3, C.horizon];
  bands.forEach((c, i) => p.rect(0, i * 30, W, 30, c));
  for (let i = 1; i < bands.length; i++)
    p.dither(0, i * 30 - 2, W, 4, bands[i - 1] ?? C.sky0, bands[i] ?? C.sky0);
  p.rect(0, 150, W, 60, C.horizon);
  for (let i = 0; i < 110; i++)
    p.px(Math.floor(rand(i) * W), Math.floor(rand(i + 50) * 110), rand(i + 9) > 0.8 ? C.star : C.sky3);
  // moon
  p.rect(48, 20, 14, 14, C.moon);
  p.rect(46, 22, 18, 10, C.moon);
  p.rect(52, 24, 4, 3, C.moonShade);
  // far range (hazier), then the near range
  for (let x = 0; x < W; x++) {
    const h = 44 + Math.round(14 * Math.sin(x / 63 + 2) + 8 * Math.sin(x / 23));
    p.rect(x, GROUND - 6 - h, 1, h, '#241c40');
  }
  for (let i = 0; i < 40; i++)
    p.px(Math.floor(300 + rand(i + 700) * 170), 168 + Math.floor(rand(i + 800) * 8), C.cityLit); // distant town
  for (let x = 0; x < W; x++) {
    const h = 30 + Math.round(18 * Math.sin(x / 41) + 10 * Math.sin(x / 17 + 1) + 6 * Math.sin(x / 7));
    p.rect(x, GROUND - h, 1, h, K.mountain);
    p.px(x, GROUND - h, K.mountainEdge);
  }
  p.dither(0, GROUND - 18, W, 4, K.mountain, K.ground);
  // ground, trees, fence, road, shore and the lake that cools everything
  p.rect(0, GROUND - 14, W, 234 - (GROUND - 14), K.ground);
  for (let x = 0; x < W; x += 3)
    if (rand(x + 40) > 0.4) p.px(x, GROUND - 14 + Math.floor(rand(x) * 40), '#1b2326');
  for (let i = 0; i < 14; i++) {
    const tx = 130 + i * 25 + Math.floor(rand(i + 5) * 8);
    p.rect(tx + 2, 226, 1, 6, '#0d1210');
    p.rect(tx, 220, 5, 7, '#0f1915');
    p.rect(tx + 1, 217, 3, 3, '#0f1915');
  }
  for (let x = 0; x < W; x += 6) p.rect(x, 228, 1, 5, C.metalDark);
  p.rect(0, 228, W, 1, C.metalDark);
  p.rect(0, 234, W, 7, K.road);
  for (let x = 6; x < W; x += 30) p.rect(x, 237, 14, 1, C.stripe);
  p.rect(0, 241, W, 1, '#2a2f33');
  p.rect(0, 242, W, H - 242, K.lake);
  for (let y = 244; y < H; y += 3) for (let x = (y * 7) % 11; x < W; x += 13) p.rect(x, y, 5, 1, '#13224a');

  // the core building (wafer-scale engines live here)
  p.rect(CORE.x, CORE.y, CORE.w, CORE.h, K.core);
  p.rect(CORE.x, CORE.y, CORE.w, 2, K.coreEdge);
  p.rect(CORE.x, CORE.y, 2, CORE.h, K.coreEdge);
  p.rect(CORE.x + CORE.w / 2 - 1, CORE.y - 22, 2, 22, C.metalDark); // antenna mast
  for (let i = 0; i < 4; i++)
    p.rect(CORE.x + CORE.w / 2 - 4 + i * 2, CORE.y - 22 + i * 5, 8 - i * 4, 1, C.metalDark);

  // transmission towers from the plant
  for (const tx of [136, 172]) {
    p.rect(tx, 130, 1, 60, C.metalDark);
    p.rect(tx + 8, 130, 1, 60, C.metalDark);
    for (let y = 130; y < 190; y += 6) {
      p.px(tx + 2, y + 2, C.metalDark);
      p.px(tx + 6, y + 4, C.metalDark);
    }
    p.rect(tx - 6, 134, 20, 1, C.metalDark);
  }
  for (let x = 120; x < CORE.x; x++)
    p.px(x, 136 + Math.round(3 * Math.sin(((x - 120) / 76) * Math.PI)), C.ink);
}

function paintTower(p: Painter) {
  // hyperboloid cooling tower
  for (let y = 0; y < 52; y++) {
    const k = Math.abs(y - 30) / 30;
    const half = Math.round(9 + 6 * k * k);
    p.rect(15 - half, y, half * 2, 1, y % 6 === 0 ? K.towerShade : K.tower);
    p.px(15 - half, y, '#a0a7b8');
    p.px(15 + half - 1, y, K.towerShade);
  }
}

function paintHall(w: number, h: number) {
  return (p: Painter) => {
    p.block(0, 4, w, h - 4, K.hall, K.hallLight, K.hallDark);
    p.rect(0, 2, w, 2, K.hallDark);
    for (let x = 4; x < w - 6; x += 9) {
      p.rect(x, 0, 6, 3, C.metalDark);
      p.rect(x + 1, 1, 4, 1, C.ink);
    }
    for (let x = 3; x < w - 3; x += 4) p.rect(x, h - 8, 2, 1, C.vent);
  };
}

export function createCampus(root: Container, getLab: () => string): SceneModule {
  const world = new Container();
  root.addChild(world);
  world.addChild(new Sprite(makeTexture(W, H, paintBackdrop)));

  const towerTex = makeTexture(30, 52, paintTower);
  const backTex = makeTexture(HALL_BACK.w, HALL_BACK.h, paintHall(HALL_BACK.w, HALL_BACK.h));
  const frontTex = makeTexture(HALL_FRONT.w, HALL_FRONT.h, paintHall(HALL_FRONT.w, HALL_FRONT.h));

  const place = (t: Texture, x: number, y: number) => {
    const s = new Sprite(t);
    s.position.set(x, y);
    world.addChild(s);
    return s;
  };
  const towers = TOWERS.map((x) => place(towerTex, x, GROUND - 52 + 8));
  const halls = HALL_SLOTS.map((slot) => {
    const sp = place(slot.front ? frontTex : backTex, slot.x, slot.y);
    sp.visible = false;
    return sp;
  });

  const sign = new Sprite(towerTex);
  sign.visible = false;
  world.addChild(sign);
  let signName = '';

  const fx = new Graphics();
  world.addChild(fx);
  const glow = new Graphics();
  glow.blendMode = 'add';
  world.addChild(glow);

  interface Puff {
    x: number;
    y: number;
    r: number;
    life: number;
  }
  const steam: Puff[] = [];
  let time = 0;

  const update = (s: State, deltaMS: number) => {
    const dt = deltaMS / 1000;
    time += dt;
    const hot = throttle(s) < 1;
    const brownout = hot && rand(Math.floor(time * 10)) > 0.7;
    const pd = pDoom(s);

    const name = pixelSafe(getLab()).slice(0, 22) || 'GARAGE INTELLIGENCE';
    if (name !== signName) {
      signName = name;
      const w = textWidth(name) + 8;
      sign.texture = makeTexture(w, 9, (p) => {
        p.rect(0, 0, w, 9, C.ink);
        p.text(4, 2, name, C.ledAmber);
      });
      sign.position.set(Math.round(CORE.x + CORE.w / 2 - w / 2), CORE.y + 4);
      sign.visible = true;
    }

    // cooling towers: one per power level, steaming
    const nTowers = Math.min(TOWERS.length, s.fuseLevel + 1);
    towers.forEach((sp, i) => {
      sp.visible = i < nTowers;
      if (sp.visible && rand(i + Math.floor(time * 6)) > 0.7)
        steam.push({ x: sp.x + 15 + (rand(time + i) - 0.5) * 10, y: sp.y + 2, r: 3, life: 3 });
    });

    const nHall = s.owned.dataHall;
    halls.forEach((sp, i) => (sp.visible = i < nHall));

    fx.clear();
    glow.clear();

    // steam
    for (let i = steam.length - 1; i >= 0; i--) {
      const p = steam[i];
      if (!p) continue;
      p.life -= dt;
      p.y -= dt * 9;
      p.x += dt * 4;
      p.r += dt * 2.5;
      if (p.life <= 0) steam.splice(i, 1);
      else
        fx.circle(Math.round(p.x), Math.round(p.y), Math.round(p.r)).fill({
          color: hex(K.steam),
          alpha: 0.025 * p.life,
        });
    }

    // core building windows: lit share follows wafer-scale engines
    const lit = Math.min(1, s.owned.waferEngine / 40);
    for (let r = 0; r < CORE.rows; r++)
      for (let c = 0; c < CORE.cols; c++) {
        const k = r * CORE.cols + c;
        const on = !brownout && rand(k * 3.1) < lit + 0.08;
        const flick = on && rand(k + Math.floor(time * 2)) > 0.97;
        fx.rect(CORE.x + 6 + c * 10, CORE.y + 16 + r * 7, 6, 4).fill(hex(on && !flick ? C.ledBlue : C.vent));
      }
    if (!brownout)
      glow
        .rect(CORE.x - 4, CORE.y + 10, CORE.w + 8, CORE.h - 6)
        .fill({ color: hex(C.ledBlue), alpha: 0.04 + lit * 0.05 });
    // mast beacon pulses red with P(doom)
    const beat = 0.5 + 0.5 * Math.sin(time * (2 + pd * 6));
    fx.rect(CORE.x + CORE.w / 2 - 1, CORE.y - 24, 3, 3).fill(hex(C.ledRed));
    for (let k = 1; k <= 4; k++)
      glow
        .circle(CORE.x + CORE.w / 2, CORE.y - 23, k * (3 + pd * 7 * beat))
        .fill({ color: hex(C.ledRed), alpha: (0.05 + pd * 0.08 * beat) / k });

    // data halls: rooftop fans spin, wall lights glow
    halls.forEach((sp, i) => {
      if (!sp.visible) return;
      const w = HALL_SLOTS[i]?.front ? HALL_FRONT.w : HALL_BACK.w;
      const spin = Math.floor(time * 10 + i) % 2;
      for (let x = 4; x < w - 6; x += 9)
        fx.rect(sp.x + x + 1 + spin * 2, sp.y + 1, 2, 1).fill(hex(C.metalLight));
      for (let x = 3; x < w - 3; x += 4)
        fx.rect(sp.x + x, sp.y + sp.height - 8, 2, 1).fill(
          hex(brownout ? C.vent : i % 2 ? C.led : C.ledBlue),
        );
    });
    if (nHall > halls.length) {
      const label = `+${nHall - halls.length}`;
      drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(C.beigeLight)), W - textWidth(label) - 4, 150, label);
    }

    // construction crane on the next empty hall plot
    const plot = HALL_SLOTS[nHall];
    if (plot) {
      const cx = plot.x + 10;
      const base = plot.y + (plot.front ? HALL_FRONT.h : HALL_BACK.h);
      fx.rect(cx, base - 60, 2, 60).fill(hex(K.crane));
      const swing = Math.sin(time * 0.4) * 22;
      fx.rect(Math.min(cx, cx + swing), base - 60, Math.abs(swing) + 30, 2).fill(hex(K.crane));
      fx.rect(cx + 28 + swing, base - 58, 1, 18).fill(hex(C.metal));
      if (Math.floor(time * 2) % 2 === 0) fx.rect(cx, base - 63, 2, 2).fill(hex(C.ledRed));
      fx.rect(plot.x, base - 3, 30, 3).fill(hex(C.dirt));
    }

    // traffic on the road and a plane overhead
    for (let i = 0; i < 4; i++) {
      const x = ((time * (30 + i * 8) + i * 130) % (W + 20)) - 10;
      fx.rect(i % 2 ? W - x : x, 236 + (i % 2) * 3, 2, 1).fill(hex(i % 2 ? C.ledRed : C.window));
    }
    const px = ((time * 18) % (W + 60)) - 30;
    if (Math.floor(time * 2) % 2 === 0) fx.rect(px, 30 + Math.sin(time * 0.2) * 4, 1, 1).fill(hex(C.ledRed));
    fx.rect(px - 3, 31 + Math.sin(time * 0.2) * 4, 6, 1).fill(hex(C.metalDark));

    // lake: the campus reflects upside down, squashed and rippling
    const ry = (y: number) => 242 + Math.round((242 - y) * 0.22);
    const ripple = (y: number) => Math.round(Math.sin(time * 1.5 + y * 0.9) * 1.5);
    for (let r = 0; r < CORE.rows; r++)
      for (let c = 0; c < CORE.cols; c++) {
        const k = r * CORE.cols + c;
        if (brownout || rand(k * 3.1) >= lit + 0.08) continue;
        const wy = CORE.y + 16 + r * 7;
        fx.rect(CORE.x + 6 + c * 10 + ripple(wy), ry(wy), 6, 1).fill({ color: hex(C.ledBlue), alpha: 0.45 });
      }
    fx.rect(CORE.x + CORE.w / 2 + ripple(CORE.y), ry(CORE.y - 24), 3, 1).fill({
      color: hex(C.ledRed),
      alpha: 0.6,
    });
    halls.forEach((sp, i) => {
      if (!sp.visible) return;
      const y = sp.y + sp.height - 8;
      fx.rect(sp.x + 3 + ripple(y + i), ry(y), sp.width - 6, 1).fill({
        color: hex(i % 2 ? C.led : C.ledBlue),
        alpha: 0.3,
      });
    });
    for (let i = 0; i < 8; i++) {
      if (rand(i + Math.floor(time * 3)) > 0.5)
        fx.rect(10 + i * 58, 250 + (i % 3) * 6, 9, 1).fill(hex(K.lakeLight));
    }

    // searchlights sweeping the sky behind the core
    for (let i = 0; i < 2; i++) {
      const ang = -Math.PI / 2 + Math.sin(time * 0.35 + i * 2.1) * 0.55;
      const ox = CORE.x + 14 + i * (CORE.w - 28);
      const len = 260;
      const spread = 0.05;
      glow
        .poly([
          ox,
          CORE.y,
          ox + Math.cos(ang - spread) * len,
          CORE.y + Math.sin(ang - spread) * len,
          ox + Math.cos(ang + spread) * len,
          CORE.y + Math.sin(ang + spread) * len,
        ])
        .fill({ color: 0xb8c8ff, alpha: 0.035 + pd * 0.03 });
    }

    // aircraft warning lights on the cooling towers
    if (Math.floor(time * 1.3) % 2 === 0)
      towers.forEach((sp) => sp.visible && fx.rect(sp.x + 14, sp.y - 1, 2, 2).fill(hex(C.ledRed)));
  };

  return { container: world, update, edges: { top: C.sky0, bottom: K.lake, stars: true } };
}
