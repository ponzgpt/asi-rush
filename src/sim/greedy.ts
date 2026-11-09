// Headless greedy player used by scripts/simulate.ts and the balance test.
import { BUILDING_ORDER, TICK_SECONDS } from '../data/economy.ts';
import {
  apply,
  buildingCost,
  buildingUnlocked,
  canShip,
  clickValue,
  effectiveFlops,
  fuseCost,
  newGame,
  nextClickUpgrade,
  playerRank,
  rates,
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

export const DEFAULT_GREEDY: GreedyOptions = { clicksPerSec: 5, trainShare: 0.5, maxSeconds: 3 * 3600 };

export type Milestone =
  | 'firstPurchase'
  | 'firstTraining'
  | 'firstFuse'
  | 'garage'
  | 'office'
  | 'loft'
  | 'datacenter'
  | 'asi';

export interface Sample {
  t: number;
  era: number;
  cap: number;
  cash: number;
  flops: number;
  rank: number;
}

const SAMPLE_SECONDS = 60;
const ROUND_MILESTONES: Milestone[] = ['garage', 'office', 'loft', 'datacenter', 'asi'];

function sample(s: State): Sample {
  return {
    t: Math.round(s.time),
    era: s.era,
    cap: s.capability.toNumber(),
    cash: s.cash.toNumber(),
    flops: effectiveFlops(s),
    rank: playerRank(s),
  };
}

/** Best FLOP/s gained per dollar among unlocked buildings and the power upgrade. */
function bestBuy(s: State): Action {
  let best: Action = { type: 'buyFuse' };
  const fuse = fuseCost(s);
  let bestValue = (effectiveFlops(apply({ ...s, cash: fuse }, best)) - effectiveFlops(s)) / fuse.toNumber();
  for (const id of BUILDING_ORDER) {
    if (!buildingUnlocked(id, s)) continue;
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

  while (s.time < opts.maxSeconds && (!s.outcome || s.outcome === 'won') && milestones.asi === undefined) {
    clickClock += TICK_SECONDS;
    // keep clicking while clicking adds at least a quarter on top of idle income
    while (clickClock >= clickEvery) {
      clickClock -= clickEvery;
      if (clickValue(s).mul(opts.clicksPerSec).gte(rates(s).cashPerSec.mul(0.25)))
        s = apply(s, { type: 'benchmark' });
    }
    if (s.roundClosed) s = apply(s, { type: 'advanceEra' });
    while (canShip(s)) s = apply(s, { type: 'ship' });
    for (const r of researchAvailable(s)) s = apply(s, { type: 'research', id: r.id });
    const u = nextClickUpgrade(s);
    if (u && s.cash.gte(u.cost * 4)) s = apply(s, { type: 'clickUpgrade' }); // only when cheap relative to cash
    for (;;) {
      const next = bestBuy(s);
      const bought = apply(s, next);
      if (bought === s) break;
      s = bought;
      if (next.type === 'buyFuse') mark('firstFuse');
      else {
        mark('firstPurchase');
        if (s.trainShare !== opts.trainShare) s = apply(s, { type: 'setTrainShare', share: opts.trainShare });
      }
    }
    s = tick(s);
    if (Math.floor(s.time / SAMPLE_SECONDS) > timeline.length - 1) timeline.push(sample(s));
    if (s.firstTrainingAt !== null) milestones.firstTraining ??= s.firstTrainingAt;
    s.roundsClosedAt.forEach((t, i) => {
      const m = ROUND_MILESTONES[i];
      if (m) milestones[m] ??= t;
    });
  }
  timeline.push(sample(s));
  return { milestones, final: s, timeline };
}
