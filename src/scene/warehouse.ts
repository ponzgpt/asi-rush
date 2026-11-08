// Era II: a rented warehouse turned datacenter. Interior cutaway, 480x270.
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { playerRank, powerCapMW, powerDemandMW, throttle, type State } from '../sim/sim.ts';
import { C, hex } from './palette.ts';
import { drawText, makeTexture, pixelSafe, textWidth, type Painter } from './pixel.ts';
import { H, W, type SceneModule } from './types.ts';

const FLOOR = 205; // back edge of the floor
const M = {
  roof: '#12141c',
  truss: '#4a5266',
  trussDark: '#30364a',
  wall: '#2a3140',
  rib: '#353d4f',
  ribDark: '#222837',
  floor: '#3b4050',
  floorLight: '#454b5d',
  safety: '#c9a22e',
  duct: '#8d93a3',
  ductDark: '#5d6273',
  tray: '#ff8a2a',
  cab: '#2c2f3a',
  cabLight: '#474b5c',
  band: '#c2477a',
  bandAlt: '#3fb6b0',
  cube: '#0d0d12',
  cubeEdge: '#2a2a36',
};

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// equipment slots
const CAB = { w: 24, h: 46 };
const CAB_SLOTS: { x: number; y: number }[] = [];
for (let i = 0; i < 8; i++) CAB_SLOTS.push({ x: 104 + i * 27, y: FLOOR - CAB.h });
for (let i = 0; i < 8; i++) CAB_SLOTS.push({ x: 96 + i * 29, y: 244 - CAB.h - 4 });
const CUBE = 26;
const CUBE_SLOTS: { x: number; y: number }[] = [];
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 2; c++) CUBE_SLOTS.push({ x: 340 + c * 30, y: 244 - CUBE - r * CUBE });

function paintBackdrop(p: Painter) {
  // roof + trusses
  p.rect(0, 0, W, 44, M.roof);
  p.rect(0, 12, W, 2, M.truss);
  p.rect(0, 40, W, 2, M.truss);
  for (let x = 0; x < W; x += 24) {
    for (let k = 0; k < 26; k++) {
      p.px(x + k, 14 + Math.floor((k * 26) / 26), M.trussDark);
      p.px(x + k, 14 + Math.floor(k), M.trussDark);
    }
    p.rect(x, 12, 2, 30, M.truss);
  }
  // clerestory windows showing the night sky
  for (let x = 30; x < W - 30; x += 46) {
    p.rect(x, 46, 32, 10, C.sky1);
    p.dither(x, 52, 32, 4, C.sky1, C.sky2);
    p.px(x + Math.floor(rand(x) * 30), 48, C.star);
    p.rect(x, 46, 32, 1, M.truss);
    p.rect(x + 15, 46, 2, 10, M.truss);
  }
  // corrugated back wall
  p.rect(0, 58, W, FLOOR - 58, M.wall);
  for (let x = 0; x < W; x += 5) {
    p.rect(x, 58, 1, FLOOR - 58, M.rib);
    p.rect(x + 1, 58, 1, FLOOR - 58, M.ribDark);
  }
  // HVAC duct + cable tray
  p.rect(0, 62, W, 7, M.duct);
  p.rect(0, 62, W, 1, C.metalLight);
  p.rect(0, 68, W, 1, M.ductDark);
  for (let x = 20; x < W; x += 60) p.rect(x, 61, 3, 9, M.ductDark);
  p.rect(0, 74, W, 2, M.trussDark);
  for (let x = 0; x < W; x += 3) p.px(x, 73, x % 9 === 0 ? M.tray : C.cable);
  // floor with safety lines
  p.rect(0, FLOOR, W, H - FLOOR, M.floor);
  p.dither(0, FLOOR, W, 3, M.floor, M.wall);
  for (let y = FLOOR + 6; y < H; y += 7) p.rect(0, y, W, 1, M.floorLight);
  p.rect(0, 214, W, 1, M.safety);
  for (let x = 0; x < W; x += 10) p.rect(x, 262, 6, 2, M.safety);

  // loading dock (left): open shutter onto the night, with the substation yard behind a fence
  p.rect(6, 112, 80, FLOOR - 112, C.sky0);
  p.dither(6, 150, 80, 6, C.sky0, C.sky2);
  p.rect(6, 156, 80, FLOOR - 156, C.sky2);
  p.rect(6, 182, 80, FLOOR - 182, C.grass);
  for (let x = 6; x < 86; x += 4) p.rect(x, 176, 1, 10, C.metalDark);
  p.rect(6, 176, 80, 1, C.metalDark);
  p.rect(6, 112, 80, 14, C.door);
  for (let y = 113; y < 126; y += 2) p.rect(6, y, 80, 1, C.doorDark);
  p.rect(4, 110, 2, FLOOR - 110, C.metal);
  p.rect(86, 110, 2, FLOOR - 110, C.metal);
  p.rect(4, 110, 84, 2, C.metal);
  // dock bumpers
  p.rect(14, FLOOR - 4, 6, 4, C.ink);
  p.rect(72, FLOOR - 4, 6, 4, C.ink);

  // mezzanine office (right)
  p.rect(398, 112, 82, 4, M.truss);
  for (let x = 404; x < 480; x += 18) p.rect(x, 116, 2, FLOOR - 116, M.trussDark);
  p.rect(404, 80, 74, 32, C.houseWall);
  p.rect(404, 80, 74, 2, C.houseTrim);
  p.rect(410, 86, 40, 18, C.windowDim);
  p.rect(456, 86, 16, 26, C.houseDark);
  for (let i = 0; i < 14; i++) p.rect(384 + i, FLOOR - 4 - i * 6, 2, 2, M.truss); // stairs
  p.rect(398, 104, 82, 1, C.metal); // railing
}

function paintCabinet(p: Painter, band: string) {
  p.block(0, 6, CAB.w, CAB.h - 6, M.cab, M.cabLight, C.ink);
  p.rect(2, 10, CAB.w - 4, 4, band);
  p.rect(2, 10, CAB.w - 4, 1, C.beigeLight);
  for (let y = 18; y < CAB.h - 8; y += 4) p.rect(3, y, CAB.w - 6, 1, C.vent);
  // the cushioned bench around the base
  p.block(-0, CAB.h - 8, CAB.w, 8, '#7a4a6a', '#9a6a8a', '#4a2a3a');
  p.rect(0, 0, CAB.w, 6, M.cabLight);
  p.rect(0, 0, CAB.w, 1, C.metalLight);
}

function paintCube(p: Painter) {
  p.rect(0, 0, CUBE, CUBE, M.cube);
  p.rect(0, 0, CUBE, 1, M.cubeEdge);
  p.rect(0, 0, 1, CUBE, M.cubeEdge);
  for (let y = 4; y < CUBE - 2; y += 6) p.rect(2, y, CUBE - 4, 1, M.cubeEdge);
}

function paintLegacy(p: Painter) {
  // the garage-era hardware, stacked by the dock under a tarp
  p.rect(2, 26, 54, 14, C.tarp);
  p.rect(2, 26, 54, 1, C.tarpLight);
  for (let i = 0; i < 4; i++) {
    p.block(4 + i * 13, 14, 12, 11, C.beige, C.beigeLight, C.beigeShadow);
    p.rect(6 + i * 13, 16, 8, 5, C.screenBg);
  }
  for (let i = 0; i < 3; i++) {
    p.block(10 + i * 13, 3, 12, 11, C.beige, C.beigeLight, C.beigeShadow);
    p.rect(12 + i * 13, 5, 8, 5, C.screenBg);
  }
  p.block(40, 0, 14, 26, C.rack, C.rackLight, C.rackDark);
  p.text(4, 33, 'GARAGE', C.beigeLight);
}

export function createWarehouse(root: Container, getLab: () => string): SceneModule {
  const world = new Container();
  root.addChild(world);
  world.addChild(new Sprite(makeTexture(W, H, paintBackdrop)));

  const cabTex = [
    makeTexture(CAB.w, CAB.h, (p) => paintCabinet(p, M.band)),
    makeTexture(CAB.w, CAB.h, (p) => paintCabinet(p, M.bandAlt)),
  ];
  const cubeTex = makeTexture(CUBE, CUBE, paintCube);
  const legacy = new Sprite(makeTexture(58, 40, paintLegacy));
  legacy.position.set(18, 244 - 42);
  world.addChild(legacy);

  const place = (t: Texture, x: number, y: number) => {
    const s = new Sprite(t);
    s.position.set(x, y);
    s.visible = false;
    world.addChild(s);
    return s;
  };
  const cabs = CAB_SLOTS.map((slot, i) => place(cabTex[i % 2] ?? cubeTex, slot.x, slot.y));
  const cubes = CUBE_SLOTS.map((slot) => place(cubeTex, slot.x, slot.y));

  const sign = new Sprite(cubeTex);
  sign.visible = false;
  world.addChild(sign);
  let signName = '';

  const fx = new Graphics();
  world.addChild(fx);
  const glow = new Graphics();
  glow.blendMode = 'add';
  world.addChild(glow);

  let time = 0;
  const born = new Map<string, number>();
  const seen = { cabs: 0, cubes: 0 };

  const update = (s: State, deltaMS: number) => {
    time += deltaMS / 1000;
    const th = throttle(s);
    const hot = th < 1;
    const flicker = hot && rand(Math.floor(time * 14)) > 0.75;

    // lab banner hanging from the trusses
    const name = pixelSafe(getLab()).slice(0, 30) || 'GARAGE INTELLIGENCE';
    if (name !== signName) {
      signName = name;
      const w = textWidth(name) + 10;
      sign.texture = makeTexture(w, 12, (p) => {
        p.rect(0, 0, w, 10, '#e9e3d2');
        p.rect(0, 9, w, 1, '#a9a393');
        p.text(5, 3, name, C.markerRed);
        p.rect(3, 10, 1, 2, M.truss);
        p.rect(w - 4, 10, 1, 2, M.truss);
      });
      sign.position.set(Math.round(W / 2 - w / 2), 24);
      sign.visible = true;
    }

    const nCab = s.owned.vectorCabinet;
    const nCube = s.owned.hypercube;
    for (let i = seen.cabs; i < Math.min(nCab, cabs.length); i++)
      born.set(`c${i}`, time + (i - seen.cabs) * 0.05);
    for (let i = seen.cubes; i < Math.min(nCube, cubes.length); i++)
      born.set(`h${i}`, time + (i - seen.cubes) * 0.05);
    seen.cabs = nCab;
    seen.cubes = nCube;
    const drop = (key: string) => {
      const at = born.get(key);
      if (at === undefined) return 0;
      const k = Math.min(1, Math.max(0, (time - at) / 0.35));
      if (k >= 1) born.delete(key);
      return -Math.round((1 - k) * (1 - k) * 14);
    };
    cabs.forEach((sp, i) => {
      sp.visible = i < nCab;
      sp.y = (CAB_SLOTS[i]?.y ?? 0) + drop(`c${i}`);
    });
    cubes.forEach((sp, i) => {
      sp.visible = i < nCube;
      sp.y = (CUBE_SLOTS[i]?.y ?? 0) + drop(`h${i}`);
    });
    legacy.visible = s.owned.homePc + s.owned.serverRack > 0;

    fx.clear();
    glow.clear();

    // high-bay lamps
    for (let i = 0; i < 6; i++) {
      const x = 50 + i * 76;
      const on = !flicker || i % 2 === 0;
      fx.rect(x - 1, 42, 2, 6).fill(hex(M.truss));
      fx.rect(x - 6, 48, 12, 3).fill(hex(on ? C.tube : C.tubeOff));
      if (on)
        glow
          .poly([x - 6, 51, x + 6, 51, x + 34, FLOOR + 30, x - 34, FLOOR + 30])
          .fill({ color: 0xffe9b0, alpha: 0.05 });
    }

    // substation transformers in the yard, one per power level
    const yard = Math.min(4, s.fuseLevel + 1);
    for (let i = 0; i < yard; i++) {
      const x = 12 + i * 18;
      fx.rect(x, 160, 12, 18).fill(hex(C.metalDark));
      fx.rect(x, 160, 12, 2).fill(hex(C.metal));
      for (let k = 0; k < 3; k++) fx.rect(x + 2 + k * 4, 156, 1, 4).fill(hex(C.metalLight));
      if (hot && rand(i + Math.floor(time * 9)) > 0.7) fx.rect(x + 5, 154, 2, 2).fill(hex(C.spark));
    }

    // cabinet status panels and drop cables
    cabs.forEach((sp, i) => {
      if (!sp.visible) return;
      fx.rect(sp.x + CAB.w / 2, 76, 1, sp.y - 76).fill(hex(C.cable));
      for (let k = 0; k < 3; k++) {
        const lit = rand(i * 7 + k + Math.floor(time * (4 + k))) > 0.35;
        fx.rect(sp.x + 4 + k * 6, sp.y + 17, 3, 1).fill(hex(lit ? (hot ? C.ledAmber : C.led) : C.ledOff));
      }
    });

    // hypercube LED matrices: the classic wall of red blinking lights
    cubes.forEach((sp, i) => {
      if (!sp.visible) return;
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 6; x++) {
          if (rand(i * 100 + y * 9 + x + Math.floor(time * 6)) > 0.45)
            fx.rect(sp.x + 3 + x * 4, sp.y + 2 + y * 5, 2, 2).fill(hex(C.ledRed));
        }
      glow.rect(sp.x - 2, sp.y - 2, CUBE + 4, CUBE + 4).fill({ color: hex(C.ledRed), alpha: 0.05 });
    });
    if (nCube > cubes.length || nCab > cabs.length) {
      const label = `+${Math.max(0, nCab - cabs.length) + Math.max(0, nCube - cubes.length)}`;
      drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(C.beigeLight)), 392, 150, label);
    }

    // big LED scoreboard on the wall
    fx.rect(150, 80, 180, 22).fill(hex(C.ink));
    fx.rect(150, 80, 180, 1).fill(hex(M.trussDark));
    const capText = `CAP ${shortNum(s.capability.toNumber())}  RANK ${playerRank(s)}/5`;
    const load = `LOAD ${Math.round((powerDemandMW(s) / powerCapMW(s)) * 100)}%`;
    drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(C.ledAmber)), 156, 84, capText);
    drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(hot ? C.ledRed : C.led)), 156, 93, load);

    // office window light + silhouettes
    fx.rect(410, 86, 40, 18).fill(hex(flicker ? C.windowDim : C.window));
    if (!flicker) {
      const px = 414 + Math.floor((Math.sin(time * 0.5) + 1) * 12);
      fx.rect(px, 92, 4, 12).fill(hex(C.houseDark));
      fx.rect(px + 1, 89, 3, 3).fill(hex(C.houseDark));
    }

    // forklift ferrying crates across the front
    const period = 22;
    const ph = (time % period) / period;
    const fxPos = ph < 0.5 ? 20 + ph * 2 * 430 : 450 - (ph - 0.5) * 2 * 430;
    const dir = ph < 0.5 ? 1 : -1;
    const fy = 250;
    fx.rect(fxPos, fy - 8, 14, 8).fill(hex(C.ledAmber));
    fx.rect(fxPos + (dir > 0 ? 2 : 6), fy - 14, 6, 6).fill(hex(C.ink));
    fx.rect(fxPos + (dir > 0 ? 14 : -4), fy - 16, 1, 16).fill(hex(C.metal));
    if (ph < 0.5) fx.rect(fxPos + (dir > 0 ? 15 : -11), fy - 10, 10, 8).fill(hex(C.wood));
    fx.rect(fxPos + 1, fy, 3, 3).fill(hex(C.ink));
    fx.rect(fxPos + 10, fy, 3, 3).fill(hex(C.ink));
    if (Math.floor(time * 3) % 2 === 0) fx.rect(fxPos + 6, fy - 16, 2, 2).fill(hex(C.ledAmber));

    // a couple of technicians walking the rows
    for (let i = 0; i < 2; i++) {
      const x = 110 + ((time * (10 + i * 4) + i * 120) % 220);
      const step = Math.floor(time * 6 + i) % 2;
      fx.rect(x, 202, 3, 6).fill(hex(i ? C.sweater : '#3a6bd6'));
      fx.rect(x, 199, 3, 3).fill(hex(C.skin));
      fx.rect(x + step, 208, 1, 3).fill(hex(C.jeans));
      fx.rect(x + 2 - step, 208, 1, 3).fill(hex(C.jeans));
    }

    // warning beacon when over capacity
    if (hot && Math.floor(time * 4) % 2 === 0) {
      fx.rect(96, 100, 6, 6).fill(hex(C.ledRed));
      glow.circle(99, 103, 18).fill({ color: hex(C.ledRed), alpha: 0.15 });
    }
  };

  return { container: world, update };
}

function shortNum(n: number): string {
  if (n < 1000) return n.toFixed(0);
  if (n < 1e6) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1e6).toFixed(2)}M`;
}
