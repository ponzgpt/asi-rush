// Sprite painters. Each draws one object at its native pixel size; dynamic bits (screens, LEDs,
// fan blades) are left blank here and animated by the scene.
import { C } from './palette.ts';
import { makeDataUrl, type Painter } from './pixel.ts';

export const PC = { w: 16, h: 15, screen: { x: 4, y: 3, w: 8, h: 4 }, led: { x: 12, y: 12 } };
export function paintPc(p: Painter) {
  // system unit
  p.block(0, 10, 16, 5, C.beige, C.beigeLight, C.beigeShadow);
  p.rect(2, 12, 6, 1, C.beigeShadow);
  p.rect(9, 12, 2, 1, C.beigeDark);
  // monitor
  p.rect(5, 9, 6, 1, C.beigeShadow);
  p.block(1, 0, 14, 9, C.beige, C.beigeLight, C.beigeDark);
  p.rect(3, 2, 10, 6, C.beigeShadow);
  p.rect(3, 2, 10, 1, C.ink);
  p.rect(4, 3, 8, 4, C.screenBg);
  p.px(13, 7, C.beigeShadow);
}

export const CARD = { w: 15, h: 4 };
export function paintCard(p: Painter) {
  p.rect(0, 0, 15, 3, C.pcb);
  p.rect(0, 0, 15, 1, C.pcbLight);
  p.rect(0, 2, 15, 1, C.pcbDark);
  p.rect(2, 3, 9, 1, C.gold);
  p.rect(4, 0, 4, 2, C.chip);
  p.px(5, 0, C.metal);
  p.rect(10, 1, 3, 1, C.metalDark);
  p.px(13, 1, C.gold);
}

export const RACK = { w: 18, h: 64, units: 8, unitH: 7 };
export function paintRack(p: Painter) {
  p.block(0, 0, 18, 64, C.rack, C.rackLight, C.rackDark);
  p.rect(1, 1, 16, 5, C.rackDark);
  p.text(2, 1, 'S&L', C.gold);
  p.rect(14, 2, 2, 2, C.gold);
  for (let u = 0; u < RACK.units; u++) {
    const y = 7 + u * RACK.unitH;
    p.block(2, y, 14, 6, C.rack, C.rackLight, C.vent);
    for (let v = 0; v < 3; v++) p.rect(8 + v * 2, y + 2, 1, 3, C.vent);
    p.rect(3, y + 4, 3, 1, C.vent);
  }
  p.rect(0, 63, 18, 1, C.ink);
  p.rect(2, 63, 2, 1, C.metalDark);
  p.rect(14, 63, 2, 1, C.metalDark);
}

export const RIG = { w: 38, h: 46 };
export function paintRig(p: Painter) {
  // open-frame "Frankenrig": angle-iron posts, cards slot between them
  p.rect(0, 0, 2, 46, C.metalDark);
  p.rect(36, 0, 2, 46, C.metalDark);
  p.rect(18, 4, 2, 42, C.metalDark);
  p.rect(0, 0, 38, 2, C.metal);
  p.rect(0, 0, 38, 1, C.metalLight);
  p.rect(0, 44, 38, 2, C.metal);
  for (const fx of [5, 23]) {
    p.rect(fx, -0, 10, 4, C.metalDark);
  }
}

export const FUSEBOX = { w: 18, h: 24 };
export function paintFuseBox(p: Painter) {
  p.block(0, 0, 18, 24, C.metal, C.metalLight, C.metalDark);
  p.rect(2, 2, 14, 16, C.metalDark);
  p.rect(3, 3, 12, 14, C.ink);
  p.text(2, 19, 'MAIN', C.ledRed);
}

export const METER = { w: 10, h: 14 };
export function paintMeter(p: Painter) {
  p.block(0, 0, 10, 14, C.metal, C.metalLight, C.metalDark);
  p.rect(2, 2, 6, 6, C.board);
  p.rect(2, 2, 6, 1, C.boardEdge);
  p.rect(3, 10, 4, 2, C.ink);
}

export const AC = { w: 32, h: 18 };
export function paintAc(p: Painter) {
  p.block(0, 0, 32, 18, C.ac, C.beigeLight, C.acDark);
  for (let i = 0; i < 7; i++) p.rect(2, 3 + i * 2, 13, 1, C.acDark);
  p.rect(18, 2, 12, 12, C.acDark);
  p.rect(19, 3, 10, 10, C.ink);
  p.rect(3, 16, 4, 1, C.ledOff);
}

/** Founder at the bench, sitting on a stool. Two typing frames. */
export const FOUNDER = { w: 12, h: 26 };
export function paintFounder(frame: 0 | 1) {
  return (p: Painter) => {
    // stool
    p.rect(2, 18, 8, 2, C.woodLight);
    p.rect(3, 20, 1, 6, C.woodDark);
    p.rect(8, 20, 1, 6, C.woodDark);
    p.rect(3, 23, 6, 1, C.woodDark);
    // legs
    p.rect(6, 15, 5, 3, C.jeans);
    p.rect(9, 18, 2, 6, C.jeans);
    p.rect(9, 24, 3, 2, C.ink);
    // torso (facing right, towards the bench)
    p.rect(3, 7, 6, 9, C.sweater);
    p.rect(3, 7, 1, 9, C.sweaterDark);
    // arm reaching the keyboard
    p.rect(7, 9 + frame, 4, 2, C.sweater);
    p.rect(11, 9 + frame, 1, 2, C.skin);
    // head
    p.rect(4, 1, 5, 6, C.skin);
    p.rect(4, 6, 5, 1, C.skinDark);
    p.rect(3, 0, 6, 2, C.hair);
    p.rect(3, 0, 2, 5, C.hair);
    p.rect(7, 3, 2, 1, C.ink); // glasses
  };
}

// --- UI icons (same art, rendered for the DOM) --------------------------

const icon = (paint: (p: Painter) => void, w = 18, h = 18) => makeDataUrl(w, h, paint);

let cache: Record<string, string> | null = null;
export function icons(): Record<string, string> {
  cache ??= {
    homePc: icon(
      (p) => {
        paintPc(p);
        p.rect(4, 3, 8, 4, C.screenBg);
        p.rect(5, 4, 4, 1, C.screen);
        p.rect(5, 5, 6, 1, C.screenMid);
        p.px(12, 12, C.led);
      },
      16,
      15,
    ),
    accelCard: icon(
      (p) => {
        for (let i = 0; i < 3; i++) {
          p.rect(0, 2 + i * 5, 15, 3, C.pcb);
          p.rect(0, 2 + i * 5, 15, 1, C.pcbLight);
          p.rect(2, 5 + i * 5, 9, 1, C.gold);
          p.rect(4, 2 + i * 5, 4, 2, C.chip);
        }
      },
      15,
      17,
    ),
    serverRack: icon(
      (p) => {
        p.block(0, 0, 14, 18, C.rack, C.rackLight, C.rackDark);
        for (let u = 0; u < 4; u++) {
          p.block(2, 2 + u * 4, 10, 3, C.rack, C.rackLight, C.vent);
          p.px(3, 3 + u * 4, u % 2 ? C.led : C.ledAmber);
        }
      },
      14,
      18,
    ),
    fuse: icon(
      (p) => {
        p.block(0, 0, 14, 18, C.metal, C.metalLight, C.metalDark);
        p.rect(2, 2, 10, 11, C.ink);
        for (let i = 0; i < 3; i++) p.rect(3 + i * 3, 4, 2, 7, C.gold);
        p.rect(2, 14, 10, 2, C.ledRed);
      },
      14,
      18,
    ),
    bench: icon(
      (p) => {
        p.rect(0, 0, 16, 16, C.ink);
        p.rect(1, 1, 14, 14, C.screenBg);
        [3, 5, 8, 12].forEach((h, i) => {
          p.rect(2 + i * 3, 14 - h, 2, h, i === 3 ? C.ledAmber : C.screenMid);
          p.rect(2 + i * 3, 14 - h, 2, 1, i === 3 ? C.beigeLight : C.screen);
        });
        p.rect(12, 1, 2, 1, C.ledAmber);
      },
      16,
      16,
    ),
    paper: icon(
      (p) => {
        p.rect(2, 0, 12, 16, C.board);
        p.rect(2, 0, 12, 1, C.beigeLight);
        p.rect(13, 0, 1, 16, C.boardEdge);
        for (let i = 0; i < 5; i++) p.rect(4, 3 + i * 2, i === 0 ? 8 : 6 + (i % 2) * 2, 1, C.marker);
        p.rect(4, 13, 4, 1, C.markerRed);
      },
      16,
      16,
    ),
    model: icon(
      (p) => {
        p.rect(1, 1, 14, 14, C.ink);
        p.rect(2, 2, 12, 12, C.screenBg);
        p.rect(4, 4, 8, 8, C.screenMid);
        p.rect(5, 5, 6, 6, C.screen);
        p.rect(7, 7, 2, 2, C.ink);
      },
      16,
      16,
    ),
  };
  return cache;
}
