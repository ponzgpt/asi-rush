// Pure, deterministic simulation. No DOM, no clocks, no randomness: (state, input) -> new state.
import Decimal from 'break_eternity.js';
import {
  BUILDINGS,
  BUILDING_ORDER,
  ECONOMY,
  MILESTONES,
  MODELS,
  OFFLINE,
  POWER,
  RESEARCH,
  RIVALS,
  TICK_SECONDS,
  type BuildingId,
  type ModelDef,
  type ResearchDef,
  type ResearchId,
  type RivalDef,
} from '../data/economy.ts';

export interface State {
  cash: Decimal;
  capability: Decimal;
  flopsSpentTraining: Decimal; // lifetime, for stats
  cashEarned: Decimal; // lifetime, for stats
  owned: Record<BuildingId, number>;
  fuseLevel: number;
  research: ResearchId[];
  modelsShipped: number;
  trainShare: number; // 0..1 of compute sent to training
  benchmarks: number;
  time: number; // simulated seconds since new game
  firstTrainingAt: number | null;
  eraCompleteAt: number | null;
}

export type BuyCount = number | 'max';

export type Action =
  | { type: 'benchmark' }
  | { type: 'buy'; building: BuildingId; count?: BuyCount }
  | { type: 'buyFuse' }
  | { type: 'research'; id: ResearchId }
  | { type: 'ship' }
  | { type: 'setTrainShare'; share: number };

export function newGame(): State {
  return {
    cash: new Decimal(ECONOMY.startCash),
    capability: new Decimal(0),
    flopsSpentTraining: new Decimal(0),
    cashEarned: new Decimal(0),
    owned: { homePc: 0, accelCard: 0, serverRack: 0 },
    fuseLevel: 0,
    research: [],
    modelsShipped: 0,
    trainShare: ECONOMY.defaultTrainShare,
    benchmarks: 0,
    time: 0,
    firstTrainingAt: null,
    eraCompleteAt: null,
  };
}

// --- costs ---------------------------------------------------------------

export function buildingCost(id: BuildingId, owned: number): Decimal {
  const b = BUILDINGS[id];
  return new Decimal(b.costGrowth).pow(owned).mul(b.baseCost);
}

/** Total cost of the next n units: C0 * r^owned * (r^n - 1) / (r - 1). */
export function bulkCost(id: BuildingId, owned: number, n: number): Decimal {
  if (n === 1) return buildingCost(id, owned);
  const r = BUILDINGS[id].costGrowth;
  return buildingCost(id, owned)
    .mul(new Decimal(r).pow(n).sub(1))
    .div(r - 1);
}

/** Largest n with bulkCost(n) <= cash. */
export function maxAffordable(id: BuildingId, owned: number, cash: Decimal): number {
  const r = BUILDINGS[id].costGrowth;
  const ratio = cash
    .mul(r - 1)
    .div(buildingCost(id, owned))
    .add(1);
  let n = Math.floor(ratio.log10().toNumber() / Math.log10(r));
  while (n > 0 && bulkCost(id, owned, n).gt(cash)) n--; // float guard
  return Math.max(0, n);
}

export function fuseCost(level: number): Decimal {
  return new Decimal(POWER.fuseCostGrowth).pow(level).mul(POWER.fuseBaseCost);
}

// --- multipliers ---------------------------------------------------------

export interface Multipliers {
  cap: number;
  cash: number;
  flops: number;
  power: number;
  alignment: number;
}

export function multipliers(s: State): Multipliers {
  const m: Multipliers = { cap: 1, cash: 1, flops: 1, power: 1, alignment: 0 };
  for (const r of RESEARCH) {
    if (!s.research.includes(r.id)) continue;
    m.cap *= r.capMult ?? 1;
    m.cash *= r.cashMult ?? 1;
    m.flops *= r.flopsMult ?? 1;
    m.power *= r.powerMult ?? 1;
    m.alignment += r.alignment ?? 0;
  }
  for (const model of MODELS.slice(0, s.modelsShipped)) m.cash *= model.priceMult;
  return m;
}

// --- power and compute ---------------------------------------------------

export function powerCapMW(s: State): number {
  return POWER.baseCapMW * POWER.fuseCapMult ** s.fuseLevel;
}

export function powerDemandMW(s: State): number {
  const raw = BUILDING_ORDER.reduce((sum, id) => sum + s.owned[id] * BUILDINGS[id].powerMW, 0);
  return raw * multipliers(s).power;
}

/** 1 when demand fits the cap, otherwise cap/demand. Never 0: over-cap throttles, never shuts down. */
export function throttle(s: State): number {
  const demand = powerDemandMW(s);
  return demand <= 0 ? 1 : Math.min(1, powerCapMW(s) / demand);
}

export function rawFlops(s: State): number {
  return (
    BUILDING_ORDER.reduce((sum, id) => sum + s.owned[id] * BUILDINGS[id].flops, 0) * multipliers(s).flops
  );
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
  const m = multipliers(s);
  const flops = effectiveFlops(s);
  const trainFlops = flops * s.trainShare;
  const inferenceFlops = flops - trainFlops;
  const capPerSec =
    trainFlops > 0
      ? new Decimal(trainFlops / ECONOMY.flopRef).pow(ECONOMY.capExponent).mul(ECONOMY.capK * m.cap)
      : new Decimal(0);
  return {
    flops,
    trainFlops,
    inferenceFlops,
    cashPerSec: new Decimal(inferenceFlops * ECONOMY.cashPerFlop * m.cash),
    capPerSec,
  };
}

// --- risk, research, models, rivals --------------------------------------

export function risk(s: State): Decimal {
  return s.capability.pow(ECONOMY.riskExponent).div(1 + multipliers(s).alignment);
}

/** Risk mapped to 0..1 for display: risk / (risk + pDoomHalf). */
export function pDoom(s: State): number {
  const r = risk(s).toNumber();
  return r / (r + ECONOMY.pDoomHalf);
}

export function researchAvailable(s: State): ResearchDef[] {
  return RESEARCH.filter((r) => !s.research.includes(r.id) && s.capability.gte(r.unlockCap));
}

export function nextModel(s: State): ModelDef | undefined {
  return MODELS[s.modelsShipped];
}

export function canShip(s: State): boolean {
  const m = nextModel(s);
  return m !== undefined && s.capability.gte(m.cap);
}

export function rivalCap(r: RivalDef, time: number): number {
  return r.start + MILESTONES.eraGoalCap * (time / r.goalSeconds) ** r.exponent;
}

/** 1-based leaderboard position of the player among the rival labs. */
export function playerRank(s: State): number {
  const me = s.capability.toNumber();
  return 1 + RIVALS.filter((r) => rivalCap(r, s.time) > me).length;
}

// --- actions and time ----------------------------------------------------

export function apply(s: State, a: Action): State {
  switch (a.type) {
    case 'benchmark':
      return {
        ...s,
        cash: s.cash.add(ECONOMY.benchmarkCash),
        cashEarned: s.cashEarned.add(ECONOMY.benchmarkCash),
        benchmarks: s.benchmarks + 1,
      };
    case 'buy': {
      const owned = s.owned[a.building];
      const want = a.count ?? 1;
      const n = want === 'max' ? maxAffordable(a.building, owned, s.cash) : want;
      const cost = bulkCost(a.building, owned, n);
      if (n < 1 || s.cash.lt(cost)) return s;
      return { ...s, cash: s.cash.sub(cost), owned: { ...s.owned, [a.building]: owned + n } };
    }
    case 'buyFuse': {
      const cost = fuseCost(s.fuseLevel);
      if (s.cash.lt(cost)) return s;
      return { ...s, cash: s.cash.sub(cost), fuseLevel: s.fuseLevel + 1 };
    }
    case 'research': {
      const r = researchAvailable(s).find((x) => x.id === a.id);
      if (!r || s.cash.lt(r.cost)) return s;
      return { ...s, cash: s.cash.sub(r.cost), research: [...s.research, r.id] };
    }
    case 'ship': {
      const m = nextModel(s);
      if (!m || !canShip(s)) return s;
      return {
        ...s,
        cash: s.cash.add(m.hypeCash),
        cashEarned: s.cashEarned.add(m.hypeCash),
        modelsShipped: s.modelsShipped + 1,
      };
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
  const earned = r.cashPerSec.mul(dt);
  return {
    ...s,
    time,
    cash: s.cash.add(earned),
    cashEarned: s.cashEarned.add(earned),
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
