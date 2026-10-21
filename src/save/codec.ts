// Save format: versioned JSON (Decimals as strings) compressed to base64 with lz-string.
import Decimal from 'break_eternity.js';
import LZString from 'lz-string';
import { SAVE } from '../data/economy.ts';
import { newGame, type State } from '../sim/sim.ts';

export interface SaveFile {
  v: number;
  savedAt: number; // wall-clock ms, used for offline progress
  state: Record<string, unknown>;
}

const DECIMAL_KEYS = ['cash', 'capability', 'flopsSpentTraining'] as const;

export function encode(state: State, savedAt: number): string {
  const plain: Record<string, unknown> = { ...state };
  for (const k of DECIMAL_KEYS) plain[k] = state[k].toString();
  const file: SaveFile = { v: SAVE.version, savedAt, state: plain };
  return LZString.compressToBase64(JSON.stringify(file));
}

/** Returns null for anything that is not a readable save. Missing fields fall back to new-game values. */
export function decode(text: string): { state: State; savedAt: number } | null {
  try {
    const json = LZString.decompressFromBase64(text.trim());
    if (!json) return null;
    const file = JSON.parse(json) as SaveFile;
    if (typeof file.v !== 'number' || file.v > SAVE.version || !file.state) return null;
    const base = newGame();
    const raw = file.state;
    const state: State = { ...base, ...(raw as Partial<State>), owned: { ...base.owned } };
    Object.assign(state.owned, raw.owned ?? {});
    for (const k of DECIMAL_KEYS) state[k] = new Decimal((raw[k] as string | undefined) ?? 0);
    return { state, savedAt: file.savedAt };
  } catch {
    return null;
  }
}
