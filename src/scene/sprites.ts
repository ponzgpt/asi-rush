// UI icons: the hardware art from the era scenes plus a few small objects, rendered to data URLs for the DOM.
import { C } from './palette.ts';
import { ART as ART1 } from './era1.ts';
import { ART as ART2 } from './era2.ts';
import { ART as ART3 } from './era3.ts';
import { ART as ART4 } from './era4.ts';
import { ART as ART5 } from './era5.ts';
import { makeDataUrl, type Painter } from './pixel.ts';

// --- UI icons (same art, rendered for the DOM) --------------------------

const icon = (paint: (p: Painter) => void, w = 18, h = 18) => makeDataUrl(w, h, paint);

let cache: Record<string, string> | null = null;
export function icons(): Record<string, string> {
  cache ??= {
    ...Object.fromEntries(
      Object.entries({ ...ART1, ...ART2, ...ART3, ...ART4, ...ART5 }).map(([id, a]) => [
        id,
        icon(a.paint, a.w, a.h),
      ]),
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
