// Cartoon people in the Day of the Tentacle mould: big heads, long noses, thick outlines, two-frame loops.
import { INK, type Painter } from './pixel.ts';

export interface Look {
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: 'mullet' | 'bun' | 'bald' | 'spiky' | 'hood' | 'long';
  top: string;
  topShade: string;
  legs: string;
  glasses?: boolean;
  beard?: string;
  headset?: boolean;
  tie?: string;
}

export const PERSON = { w: 24, h: 44 };

function head(p: Painter, l: Look, cx: number, cy: number, facing: 1 | -1) {
  // hair behind the head
  if (l.hairStyle === 'mullet' || l.hairStyle === 'long') p.ellipse(cx - facing, cy + 2, 5, 7, l.hair);
  if (l.hairStyle === 'hood') p.ellipse(cx, cy + 1, 7, 8, l.top);
  p.ellipse(cx, cy, 5, 6, INK);
  p.ellipse(cx, cy, 4, 5, l.skin);
  p.ellipse(cx - facing * 2, cy + 2, 2, 3, l.skinShade);
  p.ellipse(cx + facing, cy - 1, 3, 3, l.skin);
  // the nose: long, as tradition demands
  p.poly(
    [
      [cx + facing * 3, cy - 1],
      [cx + facing * 6, cy + 3],
      [cx + facing * 3, cy + 4],
    ],
    l.skin,
  );
  p.line(cx + facing * 3, cy - 1, cx + facing * 6, cy + 3, INK);
  p.line(cx + facing * 6, cy + 3, cx + facing * 3, cy + 4, INK);
  // eye
  p.rect(cx + facing * 2 - (facing < 0 ? 1 : 0), cy - 2, 2, 2, '#ffffff');
  p.px(cx + facing * 2 + (facing > 0 ? 1 : -1), cy - 1, INK);
  if (l.glasses) {
    p.rect(cx + facing * 1 - (facing < 0 ? 4 : 0), cy - 4, 5, 1, INK);
    p.rect(cx + facing * 1 - (facing < 0 ? 4 : 0), cy - 4, 1, 4, INK);
    p.rect(cx + facing * 5 - (facing < 0 ? 4 : 0), cy - 4, 1, 4, INK);
    p.rect(cx + facing * 1 - (facing < 0 ? 4 : 0), cy - 1, 5, 1, INK);
  }
  // mouth
  p.rect(cx + facing * 2 - (facing < 0 ? 2 : 0), cy + 4, 2, 1, INK);
  if (l.beard)
    p.poly(
      [
        [cx - 4, cy + 2],
        [cx + 4, cy + 2],
        [cx + 2, cy + 6],
        [cx - 2, cy + 6],
      ],
      l.beard,
    );
  // hair on top
  if (l.hairStyle === 'mullet' || l.hairStyle === 'long')
    p.poly(
      [
        [cx - 5, cy - 1],
        [cx - 4, cy - 6],
        [cx + 4, cy - 6],
        [cx + 5, cy - 2],
        [cx + 1, cy - 4],
      ],
      l.hair,
    );
  if (l.hairStyle === 'spiky')
    for (let i = -4; i <= 3; i += 2)
      p.poly(
        [
          [cx + i, cy - 3],
          [cx + i + 1, cy - 8],
          [cx + i + 3, cy - 3],
        ],
        l.hair,
      );
  if (l.hairStyle === 'bun') {
    p.poly(
      [
        [cx - 5, cy - 1],
        [cx - 4, cy - 5],
        [cx + 4, cy - 5],
        [cx + 5, cy - 1],
      ],
      l.hair,
    );
    p.ellipse(cx - facing * 4, cy - 6, 3, 3, l.hair);
  }
  if (l.hairStyle === 'hood')
    p.poly(
      [
        [cx - 6, cy - 1],
        [cx - 4, cy - 6],
        [cx + 4, cy - 6],
        [cx + 6, cy - 1],
        [cx + 4, cy - 4],
        [cx - 4, cy - 4],
      ],
      l.top,
    );
  if (l.hairStyle === 'bald') p.rect(cx - 4, cy - 5, 10, 1, l.skinShade);
  if (l.headset) {
    p.rect(cx - 5, cy - 6, 10, 1, INK);
    p.rect(cx - facing * 5, cy - 1, 2, 5, INK);
    p.line(cx - facing * 4, cy + 2, cx + facing * 3, cy + 4, INK);
  }
}

/** Standing person; frame 1 shifts the legs and arm for a walk or a gesture. */
export function standing(l: Look, facing: 1 | -1 = 1) {
  return [0, 1].map((frame) => (p: Painter) => {
    const cx = 12;
    // legs
    const step = frame ? 2 : 0;
    p.shape(
      [
        [cx - 4 - step, 30],
        [cx - 1, 30],
        [cx - 1, 41],
        [cx - 5 - step, 41],
      ],
      l.legs,
    );
    p.shape(
      [
        [cx + 1, 30],
        [cx + 4 + step, 30],
        [cx + 5 + step, 41],
        [cx + 1, 41],
      ],
      l.legs,
    );
    p.rect(cx - 7 - step, 41, 6, 2, INK);
    p.rect(cx + 1 + step, 41, 6, 2, INK);
    // torso
    p.shape(
      [
        [cx - 6, 17],
        [cx + 6, 17],
        [cx + 5, 31],
        [cx - 5, 31],
      ],
      l.top,
    );
    p.poly(
      [
        [cx - 5, 18],
        [cx - 2, 18],
        [cx - 3, 30],
        [cx - 4, 30],
      ],
      l.topShade,
    );
    if (l.tie)
      p.poly(
        [
          [cx - 1, 18],
          [cx + 1, 18],
          [cx + 1, 27],
          [cx, 29],
          [cx - 1, 27],
        ],
        l.tie,
      );
    // arms
    const lift = frame ? -4 : 0;
    p.shape(
      [
        [cx + facing * 5, 18],
        [cx + facing * 8, 18 + lift],
        [cx + facing * 6, 28 + lift],
        [cx + facing * 6, 28],
      ],
      l.top,
    );
    p.rect(cx + facing * 8 - 1, 28 + lift, 3, 3, l.skin);
    p.shape(
      [
        [cx - facing * 5, 18],
        [cx - facing * 8, 19],
        [cx - facing * 8, 29],
        [cx - facing * 6, 29],
      ],
      l.topShade,
    );
    head(p, l, cx, 9, facing);
  });
}

/** Seated at a desk, typing: frame 1 bobs the hands. */
export function seated(l: Look, facing: 1 | -1 = 1) {
  return [0, 1].map((frame) => (p: Painter) => {
    const cx = 10;
    p.ctx.save();
    p.ctx.translate(0, 4); // leave headroom for the hair
    // chair
    p.shape(
      [
        [cx - 8, 26],
        [cx + 4, 26],
        [cx + 4, 30],
        [cx - 8, 30],
      ],
      '#4a3a4e',
    );
    p.rect(cx - 3, 30, 2, 10, INK);
    p.rect(cx - 8, 40, 12, 2, INK);
    // legs (thighs forward)
    p.shape(
      [
        [cx - 4, 22],
        [cx + facing * 6, 23],
        [cx + facing * 6, 27],
        [cx - 4, 28],
      ],
      l.legs,
    );
    p.shape(
      [
        [cx + facing * 7, 24],
        [cx + facing * 10, 24],
        [cx + facing * 10, 37],
        [cx + facing * 7, 37],
      ],
      l.legs,
    );
    p.rect(cx + facing * 7 - (facing < 0 ? 3 : 0), 37, 7, 2, INK);
    // torso leaning in
    p.shape(
      [
        [cx - 6, 11],
        [cx + 5, 12],
        [cx + 4, 26],
        [cx - 6, 26],
      ],
      l.top,
    );
    if (l.tie)
      p.poly(
        [
          [cx, 12],
          [cx + 2, 12],
          [cx + 2, 21],
          [cx + 1, 23],
          [cx, 21],
        ],
        l.tie,
      );
    // arms to the keyboard
    const bob = frame ? 1 : 0;
    p.shape(
      [
        [cx + facing * 2, 13],
        [cx + facing * 12, 18 + bob],
        [cx + facing * 12, 21 + bob],
        [cx + facing * 2, 18],
      ],
      l.topShade,
    );
    p.rect(cx + facing * 12 - (facing < 0 ? 2 : 0), 18 + bob, 3, 3, l.skin);
    head(p, l, cx, 4, facing);
    p.ctx.restore();
  });
}
