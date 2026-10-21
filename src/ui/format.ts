import Decimal from 'break_eternity.js';

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

export function fmt(value: Decimal | number, digits = 1): string {
  const d = new Decimal(value);
  if (d.lt(1000)) return d.toNumber().toFixed(d.lt(10) ? digits : 0);
  const exp = Math.floor(d.log10().toNumber() / 3);
  if (exp >= SUFFIXES.length) return d.toExponential(2);
  return `${d.div(new Decimal(1000).pow(exp)).toNumber().toFixed(2)}${SUFFIXES[exp]}`;
}

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${Math.floor(seconds % 60)}s`;
}
