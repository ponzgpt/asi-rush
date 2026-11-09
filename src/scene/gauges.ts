// The resources live inside the scene as physical objects: a bank board or stock ticker for cash, a terminal
// with FLOP/s for compute, the era's power hardware (fuse box → grid link) for power, a progress chart for
// Capability and a doomsday clock for P(doom). Drawn every frame into the room's fx layer.
import type { Graphics } from 'pixi.js';
import { pDoom, powerCapMW, powerDemandMW, rates, throttle, type State } from '../sim/sim.ts';
import { ERAS } from '../data/economy.ts';
import { fmt, fmtPower } from '../ui/format.ts';
import { hex } from './palette.ts';
import { textWidth } from './pixel.ts';
import { gText } from './room.ts';

export interface GaugeLayout {
  cash: { x: number; y: number; w: number };
  compute: { x: number; y: number; w: number; h: number };
  power: { x: number; y: number; w: number; h: number };
  capability: { x: number; y: number; w: number; h: number };
  doom: { x: number; y: number; r: number };
}

interface Style {
  bezel: string;
  screen: string;
  text: string;
  dim: string;
  accent: string;
}

// one look per era: green phosphor, beige-and-blue 90s, dark mode, NOC blue, glass
const STYLES: Style[] = [
  { bezel: '#cbb98a', screen: '#0c1f14', text: '#8affb4', dim: '#2f7a4a', accent: '#ffcf6a' },
  { bezel: '#b9b4a6', screen: '#0a1a5a', text: '#ffffff', dim: '#6a7ac0', accent: '#ffe36a' },
  { bezel: '#26262e', screen: '#101018', text: '#e8e8f0', dim: '#5a5a70', accent: '#ff5ad0' },
  { bezel: '#1a2232', screen: '#060c18', text: '#9ad8ff', dim: '#2a4a6a', accent: '#ffd27a' },
  { bezel: '#3a3a4a', screen: '#0a0a14', text: '#f4f4ff', dim: '#5a5a7a', accent: '#76ff00' },
];

const POWER_LABEL = ['FUSE BOX', 'BREAKER PANEL', '3-PHASE SUPPLY', 'SWITCHGEAR', 'GRID LINK'];
const CASH_LABEL = ['BANK ACCOUNT', 'BANK ACCOUNT', 'NASDAQ', 'NASDAQ', 'MARKET'];

function frame(g: Graphics, x: number, y: number, w: number, h: number, st: Style) {
  g.rect(x - 1, y - 1, w + 2, h + 2).fill(hex('#141018'));
  g.rect(x, y, w, h).fill(hex(st.bezel));
  g.rect(x + 2, y + 2, w - 4, h - 4).fill(hex(st.screen));
}

const lerpHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * k) << s;
  return ch(16) | ch(8) | ch(0);
};

export function drawGauges(
  g: Graphics,
  glow: Graphics,
  s: State,
  L: GaugeLayout,
  t: number,
  history: number[],
  ticker: string,
) {
  const st = STYLES[s.era] ?? (STYLES[0] as Style);
  const r = rates(s);

  // cash: bank balance board (later a stock ticker with the lab's symbol)
  {
    const { x, y, w } = L.cash;
    frame(g, x, y, w, 28, st);
    const label = s.era >= 2 ? `${CASH_LABEL[s.era] ?? ''} ${ticker}` : (CASH_LABEL[s.era] ?? '');
    gText(g, x + 4, y + 4, label, st.dim);
    gText(g, x + 4, y + 11, `$${fmt(s.cash)}`, st.accent);
    const up = r.cashPerSec.gte(0);
    const rate = `${up ? '+' : '-'}$${fmt(r.cashPerSec.abs())}/S`;
    gText(g, x + 4, y + 18, rate, up ? '#7dffa8' : '#ff6a5a');
    if (s.era >= 2)
      g.poly(
        up
          ? [x + w - 10, y + 8, x + w - 6, y + 4, x + w - 2, y + 8]
          : [x + w - 10, y + 4, x + w - 6, y + 8, x + w - 2, y + 4],
      ).fill(hex(up ? '#7dffa8' : '#ff6a5a'));
  }

  // compute: a terminal printing training code, FLOP/s on the status line
  {
    const { x, y, w, h } = L.compute;
    frame(g, x, y, w, h, st);
    const lines = Math.floor((h - 14) / 4);
    const scroll = Math.floor(t * (2 + Math.log10(1 + r.flops)));
    for (let l = 0; l < lines; l++) {
      const seed = Math.sin((scroll + l) * 12.9898) * 43758.5453;
      const k = seed - Math.floor(seed);
      const indent = 1 + Math.floor(k * 4) * 3;
      const len = Math.max(3, Math.floor(k * (w - 12 - indent)));
      g.rect(x + 3 + indent, y + 4 + l * 4, len, 1).fill(hex(l === lines - 1 ? st.text : st.dim));
    }
    const hot = throttle(s) < 1;
    g.rect(x + 2, y + h - 9, w - 4, 7).fill(hex(hot ? '#5a1010' : st.bezel));
    gText(g, x + 4, y + h - 8, `${fmt(r.flops)} FLOP/S`, hot ? '#ffb0a0' : st.screen);
    glow.rect(x, y, w, h).fill({ color: hex(st.text), alpha: 0.04 });
  }

  // power: the era's electrical hardware, load bar and demand / capacity
  {
    const { x, y, w, h } = L.power;
    const demand = powerDemandMW(s);
    const cap = powerCapMW(s);
    const load = demand / cap;
    g.rect(x - 1, y - 1, w + 2, h + 2).fill(hex('#141018'));
    g.rect(x, y, w, h).fill(hex(s.era === 0 ? '#8a8a96' : s.era === 1 ? '#a8a8b0' : '#5a6070'));
    g.rect(x + 2, y + 2, w - 4, 7).fill(hex('#e8e0c8'));
    gText(g, x + 4, y + 3, POWER_LABEL[s.era] ?? '', '#3a2a2a');
    // breakers / fuses / busbars, one per level of the hookup
    const n = Math.min(Math.floor((w - 8) / 6), 2 + s.fuseLevel);
    for (let i = 0; i < n; i++) {
      const bx = x + 4 + i * 6;
      g.rect(bx, y + 12, 4, 9).fill(hex('#2a2a32'));
      const tripped = load > 1 && Math.floor(t * 4 + i) % 3 === 0;
      g.rect(bx + 1, tripped ? y + 17 : y + 13, 2, 3).fill(hex(tripped ? '#ff5a52' : '#d8d8e0'));
    }
    // load bar
    const by = y + h - 15;
    g.rect(x + 3, by, w - 6, 4).fill(hex('#14141a'));
    const fill = Math.min(1, load) * (w - 8);
    g.rect(x + 4, by + 1, fill, 2).fill(
      lerpHex('#7dffa8', '#ff5a52', Math.min(1, Math.max(0, (load - 0.6) / 0.4))),
    );
    const txt = `${fmtPower(demand)}/${fmtPower(cap)}`.replace(/ /g, '');
    gText(g, x + 3, y + h - 8, txt, load > 1 ? '#ff6a5a' : '#141018');
    if (load > 1 && Math.floor(t * 9) % 2)
      glow.circle(x + w - 6, y + 14, 4).fill({ color: 0xfff3a0, alpha: 0.8 });
  }

  // capability: progress chart toward this era's milestone
  {
    const { x, y, w, h } = L.capability;
    frame(g, x, y, w, h, st);
    gText(g, x + 4, y + 4, 'CAPABILITY', st.dim);
    gText(g, x + 4, y + 11, fmt(s.capability), st.text);
    const goal = ERAS[s.era]?.goal ?? 1;
    const from = s.era > 0 ? (ERAS[s.era - 1]?.goal ?? 1) : 1;
    const gy = y + 19;
    const gh = h - 23;
    const gw = w - 8;
    // goal line
    g.rect(x + 4, gy, gw, 1).fill(hex(st.accent));
    gText(g, x + w - 4 - textWidth(fmt(goal)), y + 11, fmt(goal), st.accent);
    // history: log progress from the era's start to its goal
    const span = Math.log(goal / from);
    const n = history.length;
    for (let i = 0; i < n; i++) {
      const v = history[i] ?? 0;
      const k = Math.min(1, Math.max(0, Math.log(Math.max(1, v) / from) / span));
      const px = x + 4 + Math.floor((i / Math.max(1, n - 1)) * (gw - 1));
      g.rect(px, gy + gh - Math.round(k * gh), 1, 1).fill(hex(st.text));
    }
  }

  // P(doom): the doomsday clock, minute hand creeping to midnight
  {
    const { x, y, r: R } = L.doom;
    const p = pDoom(s);
    g.circle(x, y, R + 2).fill(hex('#141018'));
    g.circle(x, y, R + 1).fill(hex('#c8a050'));
    g.circle(x, y, R - 1).fill(hex('#f2ead8'));
    // the last quarter of the dial, shaded red
    g.moveTo(x, y)
      .arc(x, y, R - 1, -Math.PI / 2 - Math.PI / 2, -Math.PI / 2)
      .closePath()
      .fill({ color: 0xc8323c, alpha: 0.35 });
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.rect(Math.round(x + Math.sin(a) * (R - 3)), Math.round(y - Math.cos(a) * (R - 3)), 1, 1).fill(
        hex('#141018'),
      );
    }
    // minutes to midnight: 15 at P(doom) 0, 0 at 100%
    const minutes = 15 * (1 - p);
    const a = -(minutes / 60) * Math.PI * 2;
    g.moveTo(x, y)
      .lineTo(x + Math.sin(a) * (R - 2), y - Math.cos(a) * (R - 2))
      .stroke({ width: 1, color: 0x141018 });
    g.moveTo(x, y)
      .lineTo(x + Math.sin(a / 12) * (R - 5), y - Math.cos(a / 12) * (R - 5))
      .stroke({ width: 2, color: 0x141018 });
    const label = `P(DOOM) ${Math.round(p * 100)}%`;
    g.rect(x - textWidth(label) / 2 - 2, y + R + 3, textWidth(label) + 4, 8).fill(hex('#141018'));
    gText(g, Math.round(x - textWidth(label) / 2), y + R + 4, label, p > 0.5 ? '#ff6a5a' : '#f2ead8');
    if (p > 0.5) glow.circle(x, y, R + 4).fill({ color: 0xff3030, alpha: 0.1 + 0.1 * Math.sin(t * 6) });
  }
}
