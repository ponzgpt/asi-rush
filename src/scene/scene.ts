// Garage cutaway at 480x270, integer-scaled with nearest filtering.
// Layers: painted static backdrop -> pooled sprites (hardware) -> per-frame Graphics (lights, screens, sparks).
import { AdvancedBloomFilter } from 'pixi-filters';
import { Application, Container, Graphics, Sprite, TextureStyle, type Texture } from 'pixi.js';
import { on } from '../state/events.ts';
import { pDoom, powerCapMW, powerDemandMW, rates, throttle, type State } from '../sim/sim.ts';
import { C, hex } from './palette.ts';
import { drawText, makeTexture, pixelSafe, textWidth, type Painter } from './pixel.ts';
import {
  AC,
  CARD,
  FOUNDER,
  FUSEBOX,
  METER,
  PC,
  RACK,
  RIG,
  paintAc,
  paintCard,
  paintFounder,
  paintFuseBox,
  paintMeter,
  paintPc,
  paintRack,
  paintRig,
} from './sprites.ts';

export const W = 480;
export const H = 270;

// Layout (pixels in the 480x270 world)
const GX0 = 120; // garage left outer wall
const GX1 = 392; // garage right outer wall
const CEIL = 112; // interior ceiling
const FLOOR = 222; // back of the floor
const SLAB = 232; // front edge of the floor slab
const PEAK = 70;
const SHELF_Y = 176;
const BENCH_Y = 204;
const BENCH_X = 150;
const SLOT = 16; // PC spacing
const PC_COLS = 8;
const RIG_X = 280;
const RIG_Y = FLOOR - RIG.h;
const RACK_IN = [326, 346, 366];
const RACK_OUT = [400, 420, 440, 460];
const BOARD = { x: 196, y: 122, w: 66, h: 36 };
const POLE_X = 100;

const PC_SLOTS: { x: number; y: number }[] = [];
for (const rowY of [BENCH_Y - PC.h, SHELF_Y - PC.h, FLOOR + 4 - PC.h])
  for (let i = 0; i < PC_COLS; i++) PC_SLOTS.push({ x: BENCH_X + i * SLOT, y: rowY });
const CARD_SLOTS: { x: number; y: number }[] = [];
for (let r = 0; r < 9; r++)
  for (const cx of [RIG_X + 2, RIG_X + 20]) CARD_SLOTS.push({ x: cx + 1, y: RIG_Y + 6 + r * 4 + 1 });

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// --- static backdrop ------------------------------------------------------

function paintBackdrop(p: Painter) {
  // sky bands with dithered seams
  const bands = [C.sky0, C.sky1, C.sky2, C.sky3, C.horizon];
  const bandH = 34;
  bands.forEach((c, i) => p.rect(0, i * bandH, W, bandH, c));
  for (let i = 1; i < bands.length; i++)
    p.dither(0, i * bandH - 2, W, 4, bands[i - 1] ?? C.sky0, bands[i] ?? C.sky0);
  p.rect(0, bands.length * bandH, W, H, C.horizon);

  // stars
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rand(i) * W);
    const y = Math.floor(rand(i + 99) * 120);
    p.px(x, y, rand(i + 7) > 0.8 ? C.star : C.sky3);
  }
  // moon
  p.rect(432, 22, 16, 16, C.moon);
  p.rect(430, 24, 20, 12, C.moon);
  p.rect(434, 20, 12, 20, C.moon);
  p.rect(438, 26, 4, 3, C.moonShade);
  p.rect(443, 32, 3, 2, C.moonShade);
  p.rect(436, 33, 2, 2, C.moonShade);

  // distant city skyline
  for (let x = 0; x < W;) {
    const w = 10 + Math.floor(rand(x) * 18);
    const h = 18 + Math.floor(rand(x + 3) * 46);
    const top = 196 - h;
    p.rect(x, top, w, h, C.city);
    p.rect(x, top, w, 1, C.cityEdge);
    for (let wy = top + 3; wy < 190; wy += 4)
      for (let wx = x + 2; wx < x + w - 2; wx += 3) if (rand(wx * 7 + wy) > 0.82) p.px(wx, wy, C.cityLit);
    x += w + 1;
  }
  // radio tower
  p.rect(70, 112, 1, 84, C.cityEdge);
  for (let y = 120; y < 196; y += 8) p.rect(68, y, 5, 1, C.cityEdge);
  // hills
  for (let x = 0; x < W; x++) {
    const h = 6 + Math.round(4 * Math.sin(x / 37) + 3 * Math.sin(x / 13));
    p.rect(x, 196 - h, 1, h + 4, C.hill);
  }

  // ground: lawn, sidewalk, street
  p.rect(0, 200, W, 40, C.grass);
  p.dither(0, 200, W, 2, C.grass, C.hill);
  for (let x = 0; x < W; x += 3) p.px(x, 202 + (x % 5), C.grassLight);
  p.rect(0, 240, W, 8, C.sidewalk);
  p.rect(0, 240, W, 1, C.curb);
  for (let x = 0; x < W; x += 24) p.rect(x, 241, 1, 7, C.slabDark);
  p.rect(0, 248, W, 2, C.curb);
  p.rect(0, 250, W, 20, C.asphalt);
  for (let x = 8; x < W; x += 40) p.rect(x, 260, 18, 2, C.stripe);

  // neighbour's house (left), windows lit dynamically
  p.rect(6, 142, 86, 58, C.houseWall);
  p.rect(6, 142, 86, 2, C.houseTrim);
  for (let y = 148; y < 200; y += 4) p.rect(6, y, 86, 1, C.houseDark);
  for (let i = 0; i < 52; i++)
    p.rect(0 + i, 142 - Math.floor(i * 0.6), 98 - i * 2, 1, i % 4 ? C.roof : C.roofDark);
  p.rect(18, 172, 14, 28, C.houseDark); // door
  p.px(29, 186, C.gold);
  p.rect(0, 199, 98, 1, C.ink);

  // driveway
  p.rect(GX1, SLAB - 6, W - GX1, 14, C.slabDark);
  p.rect(GX1, SLAB - 6, W - GX1, 1, C.slab);

  // garage: roof
  for (let y = PEAK; y < CEIL; y++) {
    const k = (y - PEAK) / (CEIL - PEAK);
    const half = 8 + k * ((GX1 - GX0) / 2 + 2);
    const cx = (GX0 + GX1) / 2;
    p.rect(Math.round(cx - half), y, Math.round(half * 2), 1, (y - PEAK) % 5 === 0 ? C.roofDark : C.roof);
    p.px(Math.round(cx - half), y, C.roofLight);
  }
  p.rect(GX0 - 8, CEIL - 3, GX1 - GX0 + 16, 3, C.roofDark);

  // interior: back wall, wainscot panelling, ceiling, floor
  p.rect(GX0, CEIL, GX1 - GX0, FLOOR - CEIL, C.wallBack);
  p.dither(GX0, CEIL + 6, GX1 - GX0, 2, C.wallBack, C.ceiling);
  p.rect(GX0, CEIL, GX1 - GX0, 6, C.ceiling);
  p.rect(GX0, 186, GX1 - GX0, FLOOR - 186, C.panel);
  for (let x = GX0; x < GX1; x += 8) {
    p.rect(x, 186, 1, FLOOR - 186, C.panelDark);
    p.rect(x + 1, 186, 1, FLOOR - 186, C.panelLight);
  }
  p.rect(GX0, 186, GX1 - GX0, 2, C.woodLight);
  // rolled-up garage door
  p.rect(GX0 + 4, CEIL, GX1 - GX0 - 8, 6, C.door);
  for (let y = CEIL + 1; y < CEIL + 6; y += 2) p.rect(GX0 + 4, y, GX1 - GX0 - 8, 1, C.doorDark);
  // floor slab
  p.rect(GX0, FLOOR, GX1 - GX0, SLAB - FLOOR, C.floor);
  p.dither(GX0, FLOOR, GX1 - GX0, 2, C.floor, C.floorDark);
  p.rect(250, 226, 26, 3, C.oil);
  p.rect(254, 225, 16, 1, C.oil);
  p.rect(GX0 - 2, SLAB, GX1 - GX0 + 4, 6, C.slab);
  p.rect(GX0 - 2, SLAB + 5, GX1 - GX0 + 4, 1, C.slabDark);
  // cut walls (section view)
  p.rect(GX0, CEIL - 2, 4, SLAB - CEIL + 2, C.houseDark);
  p.rect(GX1 - 4, CEIL - 2, 4, SLAB - CEIL + 2, C.houseDark);
  p.rect(GX0, CEIL - 2, 1, SLAB - CEIL + 2, C.houseTrim);
  p.rect(GX1 - 1, CEIL - 2, 1, SLAB - CEIL + 2, C.houseTrim);

  // pegboard with tools
  p.rect(126, 124, 64, 34, C.pegboard);
  for (let y = 126; y < 156; y += 3) for (let x = 128; x < 188; x += 3) p.px(x, y, C.pegHole);
  p.rect(132, 128, 2, 12, C.metal); // screwdriver
  p.rect(132, 140, 2, 5, C.ledRed);
  p.rect(140, 128, 8, 2, C.metal); // wrench
  p.rect(146, 128, 2, 10, C.metal);
  p.rect(154, 130, 10, 8, C.ink); // cassette
  p.rect(155, 131, 8, 3, C.beige);
  p.rect(168, 128, 1, 14, C.cableOrange); // coiled cord
  for (let i = 0; i < 5; i++) p.rect(166, 130 + i * 2, 5, 1, C.cableOrange);
  p.rect(176, 132, 10, 12, C.board); // calendar 1986
  p.rect(176, 132, 10, 3, C.markerRed);
  p.text(176, 137, '86', C.ink);

  // whiteboard (plot is drawn live)
  p.rect(BOARD.x - 1, BOARD.y - 1, BOARD.w + 2, BOARD.h + 2, C.boardEdge);
  p.rect(BOARD.x, BOARD.y, BOARD.w, BOARD.h, C.board);
  p.text(BOARD.x + 3, BOARD.y + 2, 'SCALING', C.marker);
  p.rect(BOARD.x + 4, BOARD.y + 9, 1, BOARD.h - 12, C.ink);
  p.rect(BOARD.x + 4, BOARD.y + BOARD.h - 4, BOARD.w - 8, 1, C.ink);
  p.rect(BOARD.x + 2, BOARD.y + BOARD.h + 1, 10, 2, C.metalDark); // tray

  // shelf + brackets
  p.rect(BENCH_X - 4, SHELF_Y, PC_COLS * SLOT + 6, 3, C.woodLight);
  p.rect(BENCH_X - 4, SHELF_Y + 2, PC_COLS * SLOT + 6, 1, C.woodDark);
  for (const bx of [BENCH_X, BENCH_X + 64, BENCH_X + 124]) p.rect(bx, SHELF_Y + 3, 2, 4, C.metalDark);

  // workbench
  p.rect(BENCH_X - 6, BENCH_Y, PC_COLS * SLOT + 10, 4, C.woodLight);
  p.rect(BENCH_X - 6, BENCH_Y, PC_COLS * SLOT + 10, 1, C.beigeLight);
  p.rect(BENCH_X - 6, BENCH_Y + 3, PC_COLS * SLOT + 10, 1, C.woodDark);
  for (const lx of [BENCH_X - 4, BENCH_X + PC_COLS * SLOT])
    p.rect(lx, BENCH_Y + 4, 3, FLOOR + 4 - BENCH_Y - 4, C.woodDark);

  // power pole + transformer + street wiring
  p.rect(POLE_X, 58, 4, 182, C.pole);
  p.rect(POLE_X + 3, 58, 1, 182, C.poleDark);
  p.rect(POLE_X - 12, 64, 28, 3, C.pole);
  p.rect(POLE_X - 12, 66, 28, 1, C.poleDark);
  for (const ix of [POLE_X - 11, POLE_X + 13]) p.rect(ix, 61, 2, 3, C.metalLight);
  p.rect(POLE_X + 5, 72, 8, 14, C.metalDark);
  p.rect(POLE_X + 5, 72, 8, 2, C.metal);
  sag(p, 0, 63, POLE_X - 10, 63, 6, C.ink);
  sag(p, POLE_X + 14, 63, W, 63, 5, C.ink);
  sag(p, POLE_X + 9, 86, GX0 + 2, 128, 4, C.ink); // service drop into the garage
}

function sag(p: Painter, x0: number, y0: number, x1: number, y1: number, depth: number, color: string) {
  for (let x = x0; x <= x1; x++) {
    const k = (x - x0) / Math.max(1, x1 - x0);
    p.px(x, Math.round(y0 + (y1 - y0) * k + depth * 4 * k * (1 - k)), color);
  }
}

// --- scene ---------------------------------------------------------------

interface Spawn {
  at: number;
}

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

  world.addChild(new Sprite(makeTexture(W, H, paintBackdrop)));

  const tex = {
    pc: makeTexture(PC.w, PC.h, paintPc),
    card: makeTexture(CARD.w, CARD.h, paintCard),
    rack: makeTexture(RACK.w, RACK.h, paintRack),
    rig: makeTexture(RIG.w, RIG.h, paintRig),
    fuse: makeTexture(FUSEBOX.w, FUSEBOX.h, paintFuseBox),
    meter: makeTexture(METER.w, METER.h, paintMeter),
    ac: makeTexture(AC.w, AC.h, paintAc),
    founder: [
      makeTexture(FOUNDER.w, FOUNDER.h, paintFounder(0)),
      makeTexture(FOUNDER.w, FOUNDER.h, paintFounder(1)),
    ],
  };

  const place = (t: Texture, x: number, y: number) => {
    const s = new Sprite(t);
    s.position.set(x, y);
    world.addChild(s);
    return s;
  };

  place(tex.ac, 340, 122);
  place(tex.fuse, 296, 128);
  place(tex.meter, GX0 - 12, 150);
  const rig = place(tex.rig, RIG_X, RIG_Y);
  rig.visible = false;

  const pool = (t: Texture, slots: { x: number; y: number }[]) =>
    slots.map((s) => Object.assign(place(t, s.x, s.y), { visible: false }));
  const racksIn = pool(
    tex.rack,
    RACK_IN.map((x) => ({ x, y: FLOOR - RACK.h })),
  );
  const tarp = new Graphics();
  world.addChild(tarp);
  const racksOut = pool(
    tex.rack,
    RACK_OUT.map((x) => ({ x, y: SLAB + 2 - RACK.h })),
  );
  const pcs = pool(tex.pc, PC_SLOTS);
  const cards = pool(tex.card, CARD_SLOTS);
  const founder = place(tex.founder[0] ?? tex.pc, BENCH_X - 14, FLOOR + 4 - FOUNDER.h);

  const signTex = { name: '', sprite: place(tex.pc, 0, 0) };
  signTex.sprite.visible = false;

  const fx = new Graphics(); // dynamic lights, screens, LEDs
  world.addChild(fx);
  const glow = new Graphics(); // additive light cones
  glow.blendMode = 'add';
  world.addChild(glow);
  const flash = new Graphics();
  app.stage.addChild(flash);

  // spawn animation bookkeeping: when a counted thing appears, it drops in
  const spawns = new Map<string, Spawn>();
  const seen = { pcs: 0, cards: 0, racks: 0 };
  let time = 0;
  let flashAlpha = 0;
  let sparkUntil = 0;
  let blackoutUntil = 0;
  let benchFlashUntil = 0;
  const history: number[] = [];
  let lastSample = -10;
  interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }
  const sparks: Spark[] = [];

  on((e) => {
    if (e === 'ship' || e === 'victory') flashAlpha = 0.7;
    if (e === 'fuse') {
      sparkUntil = time + 0.6;
      blackoutUntil = time + 0.35;
    }
    if (e === 'throttle') sparkUntil = time + 1.2;
    if (e === 'benchmark') benchFlashUntil = time + 0.15;
  });

  const updateSign = () => {
    const name = pixelSafe(getLab()).slice(0, 26) || 'GARAGE INTELLIGENCE';
    if (name === signTex.name) return;
    signTex.name = name;
    const w = textWidth(name) + 8;
    signTex.sprite.texture = makeTexture(w, 11, (p) => {
      p.block(0, 0, w, 9, C.board, C.beigeLight, C.boardEdge);
      p.text(4, 2, name, C.markerRed);
      p.rect(2, 9, 1, 2, C.woodDark);
      p.rect(w - 3, 9, 1, 2, C.woodDark);
    });
    signTex.sprite.position.set(Math.round((GX0 + GX1) / 2 - w / 2), 92);
    signTex.sprite.visible = true;
  };

  const dropOffset = (key: string) => {
    const s = spawns.get(key);
    if (!s) return 0;
    const k = Math.min(1, (time - s.at) / 0.3);
    if (k >= 1) spawns.delete(key);
    return -Math.round((1 - k) * (1 - k) * 10);
  };

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    time += dt;
    const s = getState();
    updateSign();

    const th = throttle(s);
    const hot = th < 1;
    const r = rates(s);
    const demand = powerDemandMW(s);
    const load = demand / Math.max(1e-9, powerCapMW(s));
    const blackout = time < blackoutUntil;
    const lightsOn = !blackout && (!hot || rand(Math.floor(time * 12)) > 0.25);

    // counts and spawns
    const nPc = s.owned.homePc;
    const nCard = s.owned.accelCard;
    const nRack = s.owned.serverRack;
    for (let i = seen.pcs; i < Math.min(nPc, pcs.length); i++)
      spawns.set(`pc${i}`, { at: time + (i - seen.pcs) * 0.04 });
    for (let i = seen.cards; i < Math.min(nCard, cards.length); i++)
      spawns.set(`card${i}`, { at: time + (i - seen.cards) * 0.04 });
    for (let i = seen.racks; i < Math.min(nRack, racksIn.length + racksOut.length); i++)
      spawns.set(`rack${i}`, { at: time });
    seen.pcs = nPc;
    seen.cards = nCard;
    seen.racks = nRack;

    pcs.forEach((sp, i) => {
      sp.visible = i < nPc;
      const slot = PC_SLOTS[i];
      if (slot) sp.y = slot.y + dropOffset(`pc${i}`);
    });
    rig.visible = nCard > 0;
    cards.forEach((sp, i) => {
      sp.visible = i < nCard;
      const slot = CARD_SLOTS[i];
      if (slot) sp.y = slot.y + dropOffset(`card${i}`);
    });
    const allRacks = [...racksIn, ...racksOut];
    allRacks.forEach((sp, i) => {
      sp.visible = i < nRack;
      const base = i < racksIn.length ? FLOOR - RACK.h : SLAB + 2 - RACK.h;
      sp.y = base + dropOffset(`rack${i}`);
    });
    founder.texture = tex.founder[Math.floor(time * (r.flops > 0 ? 6 : 1.5)) % 2] ?? founder.texture;

    // tarp over outdoor racks
    tarp.clear();
    const outdoor = Math.max(0, Math.min(nRack - racksIn.length, racksOut.length));
    if (outdoor > 0) {
      const x0 = RACK_OUT[0] ?? 400;
      const w = outdoor * 20 + 2;
      tarp.rect(x0 - 3, SLAB + 2 - RACK.h - 6, w + 4, 6).fill(hex(C.tarp));
      tarp.rect(x0 - 3, SLAB + 2 - RACK.h - 6, w + 4, 1).fill(hex(C.tarpLight));
      for (let i = 0; i <= outdoor; i++)
        tarp.rect(x0 - 3 + i * 20, SLAB + 2 - RACK.h, 2, 10).fill(hex(C.tarpDark));
    }

    fx.clear();
    glow.clear();

    // stars twinkle + tower beacon
    for (let i = 0; i < 6; i++) {
      if (rand(i + Math.floor(time * 2)) > 0.6)
        fx.rect(Math.floor(rand(i * 13) * W), Math.floor(rand(i * 17) * 100), 1, 1).fill(hex(C.star));
    }
    if (Math.floor(time * 1.2) % 2 === 0) fx.rect(69, 110, 3, 2).fill(hex(C.ledRed));

    // neighbour windows: dim when you overload the grid; one TV flickers
    const winLit = lightsOn ? Math.max(0, 1 - Math.max(0, load - 0.7) * 0.6) : 0.15;
    const windows = [
      [40, 152],
      [62, 152],
      [40, 176],
      [62, 176],
    ] as const;
    windows.forEach(([x, y], i) => {
      const on = rand(i + Math.floor(time * 0.2)) < winLit + 0.15;
      fx.rect(x, y, 14, 12).fill(hex(on ? (i === 2 ? C.tv : C.window) : C.windowDim));
      if (on && i === 2 && rand(Math.floor(time * 8)) > 0.5)
        fx.rect(x + 2, y + 2, 10, 8).fill(hex(C.ledBlue));
      fx.rect(x + 6, y, 1, 12).fill(hex(C.houseDark));
      fx.rect(x, y + 5, 14, 1).fill(hex(C.houseDark));
    });

    // fluorescent tube + light cone
    const tubeOn = lightsOn && !(hot && rand(Math.floor(time * 20)) > 0.7);
    fx.rect(180, CEIL + 7, 70, 2).fill(hex(tubeOn ? C.tube : C.tubeOff));
    fx.rect(178, CEIL + 6, 74, 1).fill(hex(C.metalDark));
    if (tubeOn)
      glow
        .poly([180, CEIL + 9, 250, CEIL + 9, 290, FLOOR, 140, FLOOR])
        .fill({ color: 0x8090ff, alpha: 0.07 });

    // PC screens: scrolling "terminal" lines + power LED
    for (let i = 0; i < Math.min(nPc, pcs.length); i++) {
      const sp = pcs[i];
      if (!sp) continue;
      const sx = sp.x + PC.screen.x;
      const sy = sp.y + PC.screen.y;
      const bright = i === 0 && time < benchFlashUntil;
      if (blackout) continue;
      for (let l = 0; l < PC.screen.h; l++) {
        const len = 2 + Math.floor(rand(i * 31 + l + Math.floor(time * 3 + i)) * 6);
        fx.rect(sx, sy + l, len, 1).fill(
          hex(bright ? C.tube : l === PC.screen.h - 1 ? C.screen : C.screenMid),
        );
      }
      fx.rect(sp.x + PC.led.x, sp.y + PC.led.y, 1, 1).fill(
        hex(hot && rand(i + Math.floor(time * 6)) > 0.5 ? C.ledRed : C.led),
      );
      glow.rect(sx - 2, sy - 1, PC.screen.w + 4, PC.screen.h + 4).fill({ color: hex(C.screen), alpha: 0.06 });
    }

    // rig fans + card LEDs
    if (nCard > 0) {
      const spin = Math.floor(time * (blackout ? 0 : 20 * th)) % 2;
      for (const fx0 of [RIG_X + 5, RIG_X + 23]) {
        fx.rect(fx0 + 1, RIG_Y + 1, 8, 2).fill(hex(C.ink));
        fx.rect(fx0 + 2 + spin * 3, RIG_Y + 1, 2, 2).fill(hex(C.metal));
        fx.rect(fx0 + 7 - spin * 3, RIG_Y + 1, 1, 2).fill(hex(C.metal));
      }
      for (let i = 0; i < Math.min(nCard, cards.length); i++) {
        const sp = cards[i];
        if (!sp || blackout) continue;
        if (rand(i * 3 + Math.floor(time * 10)) > 0.4)
          fx.rect(sp.x + 13, sp.y + 1, 1, 1).fill(hex(hot ? C.ledAmber : C.led));
      }
    }

    // rack LEDs
    allRacks.forEach((sp, i) => {
      if (i >= nRack || blackout) return;
      for (let u = 0; u < RACK.units; u++) {
        const y = sp.y + 7 + u * RACK.unitH + 2;
        const a = rand(i * 50 + u * 3 + Math.floor(time * (6 + u)));
        fx.rect(sp.x + 3, y, 1, 1).fill(hex(a > 0.3 ? (hot ? C.ledAmber : C.led) : C.ledOff));
        fx.rect(sp.x + 5, y, 1, 1).fill(hex(a > 0.7 ? C.ledBlue : C.ledOff));
      }
    });
    if (nRack > allRacks.length) {
      const label = `+${nRack - allRacks.length}`;
      drawText(
        (x, y) => fx.rect(x, y, 1, 1).fill(hex(C.beigeLight)),
        W - textWidth(label) - 4,
        SLAB - RACK.h - 14,
        label,
      );
    }
    if (nPc > pcs.length) {
      const label = `+${nPc - pcs.length} PC`;
      drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(C.beigeLight)), BENCH_X + 2, SHELF_Y - PC.h - 8, label);
    }

    // AC fan + drip
    const acSpin = Math.floor(time * (blackout ? 0 : 14)) % 3;
    fx.rect(340 + 20 + acSpin * 3, 122 + 5, 2, 6).fill(hex(C.metalDark));
    fx.rect(340 + 22, 122 + 7 + (acSpin - 1) * 2, 6, 1).fill(hex(C.metalDark));
    fx.rect(340 + 3, 122 + 16, 4, 1).fill(hex(blackout ? C.ledOff : C.led));
    const drip = (time * 30) % 60;
    if (drip < 40) fx.rect(340 + 4, 122 + 18 + drip, 1, 2).fill(hex(C.ledBlue));

    // fuse box: one lit fuse per level, OVERLOAD when throttled
    for (let i = 0; i <= Math.min(s.fuseLevel, 7); i++) {
      const lit = hot ? rand(i + Math.floor(time * 12)) > 0.5 : true;
      fx.rect(296 + 4 + (i % 4) * 3, 128 + 4 + Math.floor(i / 4) * 6, 2, 5).fill(
        hex(lit ? C.gold : C.metalDark),
      );
    }
    if (hot && Math.floor(time * 3) % 2 === 0) {
      fx.rect(286, 120, 38, 7).fill(hex(C.ink));
      drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(C.ledRed)), 288, 121, 'OVERLOAD');
    }

    // electric meter: disc speed follows demand
    const discX = Math.floor(time * Math.min(30, 1 + demand * 60)) % 6;
    fx.rect(GX0 - 12 + 2 + discX, 150 + 5, 1, 2).fill(hex(C.ink));
    const kw = Math.round(demand * 1000);
    drawText(
      (x, y) => fx.rect(x, y, 1, 1).fill(hex(C.ledRed)),
      GX0 - 12,
      150 + 16,
      String(Math.min(kw, 9999)),
    );

    // sparks at the transformer
    if (time < sparkUntil || (hot && rand(Math.floor(time * 5)) > 0.85)) {
      for (let i = 0; i < 2; i++)
        sparks.push({
          x: POLE_X + 9,
          y: 76,
          vx: (rand(time * 99 + i) - 0.5) * 60,
          vy: -rand(time * 77 + i) * 50,
          life: 0.5,
        });
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      if (!sp) continue;
      sp.life -= dt;
      sp.vy += 140 * dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      if (sp.life <= 0) sparks.splice(i, 1);
      else fx.rect(Math.round(sp.x), Math.round(sp.y), 1, 1).fill(hex(sp.life > 0.25 ? C.spark : C.ledAmber));
    }

    // whiteboard: live capability curve (log scale) + P(doom) scribble
    if (history.length === 0) {
      // seed the board with a plausible past curve so a loaded run doesn't show a blank board
      const now = Math.log10(1 + s.capability.toNumber());
      for (let i = 0; i < 30; i++) history.push(now * Math.sqrt(i / 29));
    }
    if (time - lastSample > 2) {
      history.push(Math.log10(1 + s.capability.toNumber()));
      if (history.length > 54) history.shift();
      lastSample = time;
    }
    const plotX = BOARD.x + 6;
    const plotY = BOARD.y + BOARD.h - 5;
    for (let i = 1; i < history.length; i++) {
      const v = history[i] ?? 0;
      fx.rect(plotX + i, plotY - Math.round((v / 3) * (BOARD.h - 16)), 1, 1).fill(hex(C.markerRed));
    }
    const pd = Math.round(pDoom(s) * 100);
    drawText((x, y) => fx.rect(x, y, 1, 1).fill(hex(C.markerRed)), BOARD.x + 34, BOARD.y + 2, `P=${pd}%`);

    // camera flash on launches
    flash.clear();
    if (flashAlpha > 0.01) {
      flash.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: flashAlpha });
      flashAlpha *= 0.86;
    }
  });
}
