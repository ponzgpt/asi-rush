// Pure, deterministic simulation. No DOM, no clocks, no randomness: (state, input) -> new state.
import Decimal from 'break_eternity.js';
import {
  BUILDINGS,
  BUILDING_ORDER,
  ECONOMY,
  MILESTONES,
  OFFLINE,
  POWER,
  TICK_SECONDS,
  type BuildingId,
} from '../data/economy.ts';

export interface State {
  cash: Decimal;
  capability: Decimal;
  flopsSpentTraining: Decimal; // lifetime, for stats
  owned: Record<BuildingId, number>;
  fuseLevel: number;
  trainShare: number; // 0..1 of compute sent to training
  time: number; // simulated seconds since new game
  firstTrainingAt: number | null;
  eraCompleteAt: number | null;
}

export type Action =
  | { type: 'benchmark' }
  | { type: 'buy'; building: BuildingId }
  | { type: 'buyFuse' }
  | { type: 'setTrainShare'; share: number };

export function newGame(): State {
  return {
    cash: new Decimal(ECONOMY.startCash),
    capability: new Decimal(0),
    flopsSpentTraining: new Decimal(0),
    owned: { homePc: 0, accelCard: 0, serverRack: 0 },
    fuseLevel: 0,
    trainShare: ECONOMY.defaultTrainShare,
    time: 0,
    firstTrainingAt: null,
    eraCompleteAt: null,
  };
}

export function buildingCost(id: BuildingId, owned: number): Decimal {
  const b = BUILDINGS[id];
  return new Decimal(b.costGrowth).pow(owned).mul(b.baseCost);
}

export function fuseCost(level: number): Decimal {
  return new Decimal(POWER.fuseCostGrowth).pow(level).mul(POWER.fuseBaseCost);
}

export function powerCapMW(s: State): number {
  return POWER.baseCapMW * POWER.fuseCapMult ** s.fuseLevel;
}

export function powerDemandMW(s: State): number {
  return BUILDING_ORDER.reduce((sum, id) => sum + s.owned[id] * BUILDINGS[id].powerMW, 0);
}

/** 1 when demand fits the cap, otherwise cap/demand. Never 0: over-cap throttles, never shuts down. */
export function throttle(s: State): number {
  const demand = powerDemandMW(s);
  return demand <= 0 ? 1 : Math.min(1, powerCapMW(s) / demand);
}

export function rawFlops(s: State): number {
  return BUILDING_ORDER.reduce((sum, id) => sum + s.owned[id] * BUILDINGS[id].flops, 0);
}

export function effectiveFlops(s: State): number {
  return rawFlops(s) * throttle(s);
}

export interface Rates {
  flops: number;
  trainFlops: number;
  inferenceFlops: number;
  cashPerSec: Decimal;
  capPerSec: Decimal;
}

export function rates(s: State): Rates {
  const flops = effectiveFlops(s);
  const trainFlops = flops * s.trainShare;
  const inferenceFlops = flops - trainFlops;
  const capPerSec =
    trainFlops > 0
      ? new Decimal(trainFlops / ECONOMY.flopRef).pow(ECONOMY.capExponent).mul(ECONOMY.capK)
      : new Decimal(0);
  return {
    flops,
    trainFlops,
    inferenceFlops,
    cashPerSec: new Decimal(inferenceFlops * ECONOMY.cashPerFlop),
    capPerSec,
  };
}

export function risk(s: State, alignment = 0): Decimal {
  return s.capability.pow(ECONOMY.riskExponent).div(1 + alignment);
}

export function apply(s: State, a: Action): State {
  switch (a.type) {
    case 'benchmark':
      return { ...s, cash: s.cash.add(ECONOMY.benchmarkCash) };
    case 'buy': {
      const cost = buildingCost(a.building, s.owned[a.building]);
      if (s.cash.lt(cost)) return s;
      return {
        ...s,
        cash: s.cash.sub(cost),
        owned: { ...s.owned, [a.building]: s.owned[a.building] + 1 },
      };
    }
    case 'buyFuse': {
      const cost = fuseCost(s.fuseLevel);
      if (s.cash.lt(cost)) return s;
      return { ...s, cash: s.cash.sub(cost), fuseLevel: s.fuseLevel + 1 };
    }
    case 'setTrainShare':
      return { ...s, trainShare: Math.min(1, Math.max(0, a.share)) };
  }
}

/** Advance by dt seconds with rates held constant over the step (exact: rates only change on actions). */
export function tick(s: State, dt: number = TICK_SECONDS): State {
  const r = rates(s);
  const time = s.time + dt;
  const capability = s.capability.add(r.capPerSec.mul(dt));
  return {
    ...s,
    time,
    cash: s.cash.add(r.cashPerSec.mul(dt)),
    capability,
    flopsSpentTraining: s.flopsSpentTraining.add(r.trainFlops * dt),
    firstTrainingAt: s.firstTrainingAt ?? (capability.gte(MILESTONES.firstTrainingCap) ? time : null),
    eraCompleteAt: s.eraCompleteAt ?? (capability.gte(MILESTONES.eraGoalCap) ? time : null),
  };
}

/** Catch up after the game was closed: capped at 24 h, simulated in 60 s steps. */
export function simulateOffline(s: State, elapsedSeconds: number): State {
  let remaining = Math.min(Math.max(0, elapsedSeconds), OFFLINE.maxSeconds);
  let out = s;
  while (remaining > 0) {
    const dt = Math.min(OFFLINE.stepSeconds, remaining);
    out = tick(out, dt);
    remaining -= dt;
  }
  return out;
}
