// Pure, deterministic simulation. No DOM, no clocks, no randomness: (state, input) -> new state.
import Decimal from 'break_eternity.js';
import {
  BUILDINGS,
  BUILDING_ORDER,
  CLICK_UPGRADES,
  ECONOMY,
  ERAS,
  MILESTONES,
  MODELS,
  POWER_MULT,
  RESEARCH,
  RIVALS,
  RIVAL_REFERENCE,
  RIVAL_REFERENCE_SLOPE,
  SAFETY,
  TICK_SECONDS,
  type BuildingId,
  type ClickUpgradeDef,
  type EraDef,
  type ModelDef,
  type ResearchDef,
  type ResearchId,
  type RivalDef,
} from '../data/economy.ts';

export type Outcome = 'won' | 'lost' | 'doom';

export interface State {
  cash: Decimal;
  capability: Decimal;
  flopsSpentTraining: Decimal; // lifetime, for stats
  cashEarned: Decimal; // lifetime, for stats
  owned: Record<BuildingId, number>;
  era: number; // index into ERAS
  fuseLevel: number; // power upgrades bought at the current site
  research: ResearchId[];
  modelsShipped: number;
  clickUpgrades: number; // CLICK_UPGRADES bought, in order
  trainShare: number; // 0..1 of compute sent to training
  benchmarks: number;
  time: number; // simulated seconds since new game
  firstTrainingAt: number | null;
  roundClosed: boolean; // current era's goal reached first; waiting for the player to move on
  roundsClosedAt: number[]; // time each round closed
  outcome: Outcome | null; // the run is over once set
  lostTo: RivalDef['id'] | null;
}

export type BuyCount = number | 'max';

export type Action =
  | { type: 'benchmark' }
  | { type: 'buy'; building: BuildingId; count?: BuyCount }
  | { type: 'buyFuse' }
  | { type: 'research'; id: ResearchId }
  | { type: 'ship' }
  | { type: 'clickUpgrade' }
  | { type: 'advanceEra' }
  | { type: 'setTrainShare'; share: number };

export function newGame(): State {
  return {
    cash: new Decimal(ECONOMY.startCash),
    capability: new Decimal(0),
    flopsSpentTraining: new Decimal(0),
    cashEarned: new Decimal(0),
    owned: {
      homePc: 0,
      accelCard: 0,
      serverRack: 0,
      vectorCabinet: 0,
      hypercube: 0,
      waferEngine: 0,
      dataHall: 0,
    },
    era: 0,
    fuseLevel: 0,
    research: [],
    modelsShipped: 0,
    clickUpgrades: 0,
    trainShare: ECONOMY.defaultTrainShare,
    benchmarks: 0,
    time: 0,
    firstTrainingAt: null,
    roundClosed: false,
    roundsClosedAt: [],
    outcome: null,
    lostTo: null,
  };
}

export function eraOf(s: State): EraDef {
  return ERAS[s.era] ?? (ERAS[0] as EraDef);
}

export function isFinalEra(s: State): boolean {
  return s.era >= ERAS.length - 1;
}

// --- costs ---------------------------------------------------------------

export function buildingUnlocked(id: BuildingId, s: State): boolean {
  return BUILDINGS[id].era <= s.era;
}

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

export function fuseCost(s: State): Decimal {
  const e = eraOf(s);
  return new Decimal(e.powerCostGrowth).pow(s.fuseLevel).mul(e.powerBaseCost);
}

export function nextClickUpgrade(s: State): ClickUpgradeDef | undefined {
  return CLICK_UPGRADES[s.clickUpgrades];
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
  return eraOf(s).baseCapMW * POWER_MULT ** s.fuseLevel;
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

// --- risk ----------------------------------------------------------------

/** Capability at which P(doom) is 50%. Each alignment paper multiplies it. */
export function safeCap(s: State): number {
  return SAFETY.baseSafeCap * SAFETY.perAlignment ** multipliers(s).alignment;
}

export function pDoom(s: State): number {
  const x = s.capability.toNumber() / safeCap(s);
  const k = x ** SAFETY.exponent;
  return k / (1 + k);
}

/** Share of revenue kept after the public-trust penalty. */
export function trust(s: State): number {
  return 1 - SAFETY.revenuePenalty * pDoom(s);
}

// --- rates ---------------------------------------------------------------

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
    cashPerSec: new Decimal(inferenceFlops * ECONOMY.cashPerFlop * m.cash * trust(s)),
    capPerSec,
  };
}

/** Cash per benchmark click: base x click multipliers, plus a share of revenue/s. */
export function clickValue(s: State): Decimal {
  let mult = 1;
  let pct = 0;
  for (const u of CLICK_UPGRADES.slice(0, s.clickUpgrades)) {
    mult *= u.mult ?? 1;
    pct += u.revenuePct ?? 0;
  }
  return rates(s)
    .cashPerSec.mul(pct)
    .add(ECONOMY.benchmarkCash * mult);
}

// --- research, models ----------------------------------------------------

export function researchAvailable(s: State): ResearchDef[] {
  return RESEARCH.filter(
    (r) => r.era <= s.era && !s.research.includes(r.id) && s.capability.gte(r.unlockCap),
  );
}

/** Next model in the lineup, if it belongs to an era already reached. */
export function nextModel(s: State): ModelDef | undefined {
  const m = MODELS[s.modelsShipped];
  return m && m.era <= s.era ? m : undefined;
}

export function canShip(s: State): boolean {
  const m = nextModel(s);
  return m !== undefined && s.capability.gte(m.cap);
}

// --- rivals --------------------------------------------------------------

export function rivalReleases(r: RivalDef, time: number): number {
  return time < r.offset ? 0 : Math.floor((time - r.offset) / r.every) + 1;
}

/** Reference expert curve: log10 Capability at `minute`, linear between anchors. */
export function referenceLog10(minute: number): number {
  const pts = RIVAL_REFERENCE;
  const last = pts[pts.length - 1] ?? [0, 0];
  if (minute >= last[0]) return last[1] + (minute - last[0]) * RIVAL_REFERENCE_SLOPE;
  for (let i = 1; i < pts.length; i++) {
    const [m1, v1] = pts[i] ?? last;
    const [m0, v0] = pts[i - 1] ?? last;
    if (minute <= m1) return v0 + ((v1 - v0) * (minute - m0)) / (m1 - m0);
  }
  return last[1];
}

/** Time on the reference curve a rival has reached: continuous before its first release, then stepped. */
function rivalClock(r: RivalDef, time: number): number {
  const n = rivalReleases(r, time);
  return n === 0 ? time : r.offset + n * r.every;
}

export function rivalCap(r: RivalDef, time: number): number {
  const minute = (rivalClock(r, time) * r.speed) / 60;
  return r.head + (minute <= 0 ? 0 : 10 ** referenceLog10(minute));
}

export function leader(time: number): { rival: RivalDef; cap: number } {
  let best = { rival: RIVALS[0] as RivalDef, cap: -1 };
  for (const r of RIVALS) {
    const cap = rivalCap(r, time);
    if (cap > best.cap) best = { rival: r, cap };
  }
  return best;
}

/** Seconds until the leading rival reaches `goal` (searching up to `horizon` s ahead), or null. */
export function rivalEta(time: number, goal: number, horizon = 3 * 3600): number | null {
  if (leader(time).cap >= goal) return 0;
  for (let dt = 5; dt <= horizon; dt += 5) if (leader(time + dt).cap >= goal) return dt;
  return null;
}

/** 1-based leaderboard position of the player among the rival labs. */
export function playerRank(s: State): number {
  const me = s.capability.toNumber();
  return 1 + RIVALS.filter((r) => rivalCap(r, s.time) > me).length;
}

// --- actions and time ----------------------------------------------------

export function apply(s: State, a: Action): State {
  if (s.outcome && s.outcome !== 'won' && a.type !== 'setTrainShare') return s;
  switch (a.type) {
    case 'benchmark': {
      const v = clickValue(s);
      return { ...s, cash: s.cash.add(v), cashEarned: s.cashEarned.add(v), benchmarks: s.benchmarks + 1 };
    }
    case 'buy': {
      if (!buildingUnlocked(a.building, s)) return s;
      const owned = s.owned[a.building];
      const want = a.count ?? 1;
      const n = want === 'max' ? maxAffordable(a.building, owned, s.cash) : want;
      const cost = bulkCost(a.building, owned, n);
      if (n < 1 || s.cash.lt(cost)) return s;
      return { ...s, cash: s.cash.sub(cost), owned: { ...s.owned, [a.building]: owned + n } };
    }
    case 'buyFuse': {
      const cost = fuseCost(s);
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
    case 'clickUpgrade': {
      const u = nextClickUpgrade(s);
      if (!u || s.cash.lt(u.cost)) return s;
      return { ...s, cash: s.cash.sub(u.cost), clickUpgrades: s.clickUpgrades + 1 };
    }
    case 'advanceEra': {
      if (!s.roundClosed || isFinalEra(s)) return s;
      return { ...s, era: s.era + 1, fuseLevel: 0, roundClosed: false };
    }
    case 'setTrainShare':
      return { ...s, trainShare: Math.min(1, Math.max(0, a.share)) };
  }
}

/** Advance by dt seconds with rates held constant over the step (exact: rates only change on actions). */
export function tick(s: State, dt: number = TICK_SECONDS): State {
  if (s.outcome && s.outcome !== 'won') return s; // a lost run is frozen
  const r = rates(s);
  const time = s.time + dt;
  const capability = s.capability.add(r.capPerSec.mul(dt));
  const earned = r.cashPerSec.mul(dt);
  const next: State = {
    ...s,
    time,
    cash: s.cash.add(earned),
    cashEarned: s.cashEarned.add(earned),
    capability,
    flopsSpentTraining: s.flopsSpentTraining.add(r.trainFlops * dt),
    firstTrainingAt: s.firstTrainingAt ?? (capability.gte(MILESTONES.firstTrainingCap) ? time : null),
  };
  if (s.outcome === 'won') return next;

  // the player reaching the goal is checked before the rivals: ties go to the player
  const goal = eraOf(s).goal;
  if (!s.roundClosed && capability.gte(goal)) {
    next.roundClosed = true;
    next.roundsClosedAt = [...s.roundsClosedAt, time];
    if (isFinalEra(s)) next.outcome = 'won';
  } else if (!s.roundClosed && leader(time).cap >= goal) {
    next.outcome = 'lost';
    next.lostTo = leader(time).rival.id;
  }
  if (!next.outcome && pDoom(next) >= SAFETY.doomLimit) next.outcome = 'doom';
  return next;
}
