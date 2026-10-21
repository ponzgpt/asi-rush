// Headless greedy player used by scripts/simulate.ts and the balance test.
import { BUILDING_ORDER, ECONOMY, TICK_SECONDS, type BuildingId } from '../data/economy.ts';
import {
  apply,
  buildingCost,
  effectiveFlops,
  fuseCost,
  newGame,
  rates,
  tick,
  type Action,
  type State,
} from './sim.ts';

export interface GreedyOptions {
  clicksPerSec: number; // assumed human clicking while clicking beats idle income
  trainShare: number; // slider position once the first machine is bought
  maxSeconds: number;
}

export const DEFAULT_GREEDY: GreedyOptions = { clicksPerSec: 5, trainShare: 0.5, maxSeconds: 4 * 3600 };

export type Milestone =
  'firstPurchase' | 'firstAccelCard' | 'firstServerRack' | 'firstFuse' | 'firstTraining' | 'eraComplete';

const FIRSTS: Record<BuildingId, Milestone | null> = {
  homePc: null,
  accelCard: 'firstAccelCard',
  serverRack: 'firstServerRack',
};

/** Best FLOP/s gained per dollar among buildings and the fuse. */
function bestBuy(s: State): Action {
  let best: Action = { type: 'buyFuse' };
  let bestValue =
    (effectiveFlops(apply({ ...s, cash: fuseCost(s.fuseLevel) }, best)) - effectiveFlops(s)) /
    fuseCost(s.fuseLevel).toNumber();
  for (const id of BUILDING_ORDER) {
    const a: Action = { type: 'buy', building: id };
    const cost = buildingCost(id, s.owned[id]);
    const value = (effectiveFlops(apply({ ...s, cash: cost }, a)) - effectiveFlops(s)) / cost.toNumber();
    if (value > bestValue) [best, bestValue] = [a, value];
  }
  return best;
}

export function runGreedy(opts: GreedyOptions = DEFAULT_GREEDY): {
  milestones: Partial<Record<Milestone, number>>;
  final: State;
} {
  let s = newGame();
  const milestones: Partial<Record<Milestone, number>> = {};
  const mark = (m: Milestone) => (milestones[m] ??= s.time);
  const clickEvery = 1 / opts.clicksPerSec;
  let clickClock = 0;

  while (s.time < opts.maxSeconds && s.eraCompleteAt === null) {
    clickClock += TICK_SECONDS;
    while (clickClock >= clickEvery && rates(s).cashPerSec.lt(opts.clicksPerSec * ECONOMY.benchmarkCash)) {
      s = apply(s, { type: 'benchmark' });
      clickClock -= clickEvery;
    }
    for (;;) {
      const next = bestBuy(s);
      const bought = apply(s, next);
      if (bought === s) break;
      s = bought;
      if (next.type === 'buyFuse') mark('firstFuse');
      else if (next.type === 'buy') {
        mark('firstPurchase');
        const m = FIRSTS[next.building];
        if (m) mark(m);
        if (s.trainShare !== opts.trainShare) s = apply(s, { type: 'setTrainShare', share: opts.trainShare });
      }
    }
    s = tick(s);
    if (s.firstTrainingAt !== null) milestones.firstTraining ??= s.firstTrainingAt;
    if (s.eraCompleteAt !== null) milestones.eraComplete ??= s.eraCompleteAt;
  }
  return { milestones, final: s };
}
