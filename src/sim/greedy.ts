// Headless greedy player used by scripts/simulate.ts and the balance test.
import { BUILDING_ORDER, ECONOMY, TICK_SECONDS, type BuildingId } from '../data/economy.ts';
import {
  apply,
  buildingCost,
  effectiveFlops,
  fuseCost,
  newGame,
  rates,
  canShip,
  playerRank,
  researchAvailable,
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
  | 'firstPurchase'
  | 'firstAccelCard'
  | 'firstServerRack'
  | 'firstFuse'
  | 'firstTraining'
  | 'researchDone'
  | 'eraComplete';

const FIRSTS: Record<BuildingId, Milestone | null> = {
  homePc: null,
  accelCard: 'firstAccelCard',
  serverRack: 'firstServerRack',
};

export interface Sample {
  t: number;
  cap: number;
  cash: number;
  flops: number;
  rank: number;
}

const SAMPLE_SECONDS = 60;

function sample(s: State): Sample {
  return {
    t: Math.round(s.time),
    cap: s.capability.toNumber(),
    cash: s.cash.toNumber(),
    flops: effectiveFlops(s),
    rank: playerRank(s),
  };
}

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
  timeline: Sample[];
} {
  let s = newGame();
  const milestones: Partial<Record<Milestone, number>> = {};
  const mark = (m: Milestone) => (milestones[m] ??= s.time);
  const clickEvery = 1 / opts.clicksPerSec;
  let clickClock = 0;
  const timeline: Sample[] = [];

  while (s.time < opts.maxSeconds && s.eraCompleteAt === null) {
    clickClock += TICK_SECONDS;
    while (clickClock >= clickEvery && rates(s).cashPerSec.lt(opts.clicksPerSec * ECONOMY.benchmarkCash)) {
      s = apply(s, { type: 'benchmark' });
      clickClock -= clickEvery;
    }
    while (canShip(s)) s = apply(s, { type: 'ship' });
    for (const r of researchAvailable(s)) {
      const done = apply(s, { type: 'research', id: r.id });
      if (done !== s) [s, milestones.researchDone] = [done, s.time];
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
    if (Math.floor(s.time / SAMPLE_SECONDS) > timeline.length - 1) timeline.push(sample(s));
    if (s.firstTrainingAt !== null) milestones.firstTraining ??= s.firstTrainingAt;
    if (s.eraCompleteAt !== null) milestones.eraComplete ??= s.eraCompleteAt;
  }
  timeline.push(sample(s));
  return { milestones, final: s, timeline };
}
