// Tutorial objectives: a linear checklist that teaches the loop, derived purely from state.
// It ends when the player closes the Series A; after that the coach only shows contextual tips.
import { ERAS } from '../data/economy.ts';
import { playerRank, type State } from '../sim/sim.ts';
import type { Key } from './i18n.ts';

export interface Objective {
  key: Key;
  done: (s: State) => boolean;
  progress?: (s: State) => number; // 0..1
}

const SERIES_A = ERAS[0]?.goal ?? 1;

export const OBJECTIVES: Objective[] = [
  { key: 'obj.benchmark', done: (s) => s.benchmarks >= 5, progress: (s) => s.benchmarks / 5 },
  { key: 'obj.pc', done: (s) => s.owned.homePc > 0 },
  { key: 'obj.train', done: (s) => s.capability.gte(1), progress: (s) => s.capability.toNumber() },
  { key: 'obj.ship', done: (s) => s.modelsShipped > 0 },
  { key: 'obj.research', done: (s) => s.research.length > 0 },
  { key: 'obj.card', done: (s) => s.owned.accelCard > 0 },
  { key: 'obj.fuse', done: (s) => s.fuseLevel > 0 || s.era > 0 },
  { key: 'obj.rank', done: (s) => playerRank(s) === 1 || s.era > 0 },
  {
    key: 'obj.goal',
    done: (s) => s.roundsClosedAt.length > 0,
    progress: (s) => s.capability.toNumber() / SERIES_A,
  },
];

/** Index of the first objective not yet done (OBJECTIVES.length when all are). */
export function currentObjective(s: State): number {
  const i = OBJECTIVES.findIndex((o) => !o.done(s));
  return i === -1 ? OBJECTIVES.length : i;
}
