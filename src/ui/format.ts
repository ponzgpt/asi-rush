import Decimal from 'break_eternity.js';

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** Compact number: 9.5, 950, 9.50K, 1.23M, then scientific. */
export function fmt(value: Decimal | number, digits = 1): string {
  const d = new Decimal(value);
  if (d.lt(1000)) return d.toNumber().toFixed(d.lt(10) ? digits : 0);
  const exp = Math.floor(d.log10().toNumber() / 3);
  if (exp >= SUFFIXES.length) return d.toExponential(2);
  return `${d.div(new Decimal(1000).pow(exp)).toNumber().toFixed(2)}${SUFFIXES[exp]}`;
}

export function fmtPower(mw: number): string {
  return mw < 1 ? `${(mw * 1000).toFixed(0)} kW` : `${mw.toFixed(2)} MW`;
}

export function fmtPct(x: number): string {
  return x < 0.1 ? `${(x * 100).toFixed(1)}%` : `${Math.round(x * 100)}%`;
}

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${Math.floor(seconds % 60)}s`;
  return `${Math.ceil(seconds)}s`;
}

/** Game clock, e.g. 03:07 or 1:03:07. */
export function fmtClock(seconds: number): string {
  const s = Math.floor(seconds);
  const hh = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
