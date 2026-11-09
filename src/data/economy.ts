// All economy constants. Logic in src/sim must read from here, never inline numbers.
// Tuned with `npm run sim`; see docs/BALANCE.md for the results these values produce.

export const TICK_HZ = 10;
export const TICK_SECONDS = 1 / TICK_HZ;

// --- eras: each one is a site and a funding round ------------------------

export interface EraDef {
  id: 'garage' | 'warehouse' | 'campus';
  goal: number; // Capability that closes this era's round
  baseCapMW: number; // site grid connection before power upgrades
  powerBaseCost: number;
  powerCostGrowth: number;
}

export const ERAS: EraDef[] = [
  { id: 'garage', goal: 1_000, baseCapMW: 0.05, powerBaseCost: 100, powerCostGrowth: 3.5 },
  { id: 'warehouse', goal: 100_000, baseCapMW: 4, powerBaseCost: 150_000, powerCostGrowth: 3.5 },
  { id: 'campus', goal: 10_000_000, baseCapMW: 400, powerBaseCost: 4e9, powerCostGrowth: 3.5 },
];

export const POWER_MULT = 2; // each power upgrade doubles the site's cap

// --- hardware ------------------------------------------------------------

export type BuildingId =
  'homePc' | 'accelCard' | 'serverRack' | 'vectorCabinet' | 'hypercube' | 'waferEngine' | 'dataHall';

export interface BuildingDef {
  id: BuildingId;
  era: number;
  baseCost: number; // C0 in cost = C0 * growth^owned
  costGrowth: number;
  flops: number; // FLOP/s per unit at full power
  powerMW: number; // MW drawn per unit
  revealAt: number; // lifetime cash at which the item first shows up (within its era)
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  homePc: { id: 'homePc', era: 0, baseCost: 10, costGrowth: 1.12, flops: 1, powerMW: 0.002, revealAt: 0 },
  accelCard: {
    id: 'accelCard',
    era: 0,
    baseCost: 150,
    costGrowth: 1.12,
    flops: 12,
    powerMW: 0.015,
    revealAt: 60,
  },
  serverRack: {
    id: 'serverRack',
    era: 0,
    baseCost: 2_500,
    costGrowth: 1.12,
    flops: 150,
    powerMW: 0.12,
    revealAt: 1_000,
  },
  vectorCabinet: {
    id: 'vectorCabinet',
    era: 1,
    baseCost: 60_000,
    costGrowth: 1.12,
    flops: 4_000,
    powerMW: 0.6,
    revealAt: 0,
  },
  hypercube: {
    id: 'hypercube',
    era: 1,
    baseCost: 1.5e6,
    costGrowth: 1.12,
    flops: 80_000,
    powerMW: 6,
    revealAt: 0,
  },
  waferEngine: {
    id: 'waferEngine',
    era: 2,
    baseCost: 1.5e9,
    costGrowth: 1.12,
    flops: 1e7,
    powerMW: 40,
    revealAt: 0,
  },
  dataHall: {
    id: 'dataHall',
    era: 2,
    baseCost: 4e10,
    costGrowth: 1.12,
    flops: 1.5e8,
    powerMW: 500,
    revealAt: 0,
  },
};

export const BUILDING_ORDER: BuildingId[] = [
  'homePc',
  'accelCard',
  'serverRack',
  'vectorCabinet',
  'hypercube',
  'waferEngine',
  'dataHall',
];

// --- core economy --------------------------------------------------------

export const ECONOMY = {
  startCash: 0,
  benchmarkCash: 2, // base cash per "Run Benchmark" click
  cashPerFlop: 0.1, // $ per FLOP of inference, before multipliers
  capK: 0.015, // k in dCap/s = k * capMult * (trainFlops / flopRef)^capExponent
  flopRef: 1,
  capExponent: 0.35,
  defaultTrainShare: 0.5,
};

// P(doom) = x^e / (1 + x^e), x = Capability / safeCap, safeCap = base * perAlignment^alignment.
// It cuts revenue (public trust) and ends the game at doomLimit.
export const SAFETY = {
  baseSafeCap: 400,
  perAlignment: 4,
  exponent: 1.5,
  revenuePenalty: 0.6, // revenue x (1 - penalty * P(doom))
  doomLimit: 0.99,
};

// --- click upgrades ("Run benchmark" button) ----------------------------

export type ClickUpgradeId =
  'cherryPicked' | 'evalSuite' | 'overfit' | 'contamination' | 'vibes' | 'pressRelease' | 'saturation';

export interface ClickUpgradeDef {
  id: ClickUpgradeId;
  cost: number;
  mult?: number; // multiplies the base click
  revenuePct?: number; // adds this share of revenue/s to every click
}

export const CLICK_UPGRADES: ClickUpgradeDef[] = [
  { id: 'cherryPicked', cost: 40, mult: 3 },
  { id: 'evalSuite', cost: 400, revenuePct: 0.02 },
  { id: 'overfit', cost: 6_000, mult: 5 },
  { id: 'contamination', cost: 90_000, revenuePct: 0.04 },
  { id: 'vibes', cost: 3e6, mult: 10 },
  { id: 'pressRelease', cost: 1e8, revenuePct: 0.06 },
  { id: 'saturation', cost: 1e10, revenuePct: 0.1 },
];

// --- research: one-time papers, unlocked by Capability -------------------

export type ResearchId =
  | 'backprop'
  | 'perTokenBilling'
  | 'usenet'
  | 'undervolting'
  | 'redTeam'
  | 'halfPrecision'
  | 'scalingMemo'
  | 'rlhf'
  | 'attention'
  | 'constitution'
  | 'moe'
  | 'synthData'
  | 'interpretability'
  | 'speculative'
  | 'killSwitch'
  | 'chainOfThought'
  | 'testTime'
  | 'superalignment'
  | 'agents'
  | 'sandbox'
  | 'selfImprove'
  | 'safetyInstitute';

export interface ResearchDef {
  id: ResearchId;
  era: number;
  cost: number;
  unlockCap: number;
  capMult?: number;
  cashMult?: number;
  flopsMult?: number;
  powerMult?: number;
  alignment?: number;
}

// The first paper is almost free (to teach the idea); later ones cost more and multiply more.
export const RESEARCH: ResearchDef[] = [
  { id: 'backprop', era: 0, cost: 15, unlockCap: 0.2, capMult: 1.5 },
  { id: 'perTokenBilling', era: 0, cost: 150, unlockCap: 2, cashMult: 2 },
  { id: 'usenet', era: 0, cost: 600, unlockCap: 8, capMult: 1.5 },
  { id: 'undervolting', era: 0, cost: 1_500, unlockCap: 20, powerMult: 0.7 },
  { id: 'redTeam', era: 0, cost: 2_500, unlockCap: 35, alignment: 1 },
  { id: 'halfPrecision', era: 0, cost: 6_000, unlockCap: 60, flopsMult: 1.5 },
  { id: 'scalingMemo', era: 0, cost: 15_000, unlockCap: 120, capMult: 1.6 },
  { id: 'rlhf', era: 0, cost: 40_000, unlockCap: 250, cashMult: 1.5, alignment: 1 },
  { id: 'attention', era: 0, cost: 90_000, unlockCap: 450, capMult: 1.6 },

  { id: 'constitution', era: 1, cost: 300_000, unlockCap: 1_500, alignment: 1 },
  { id: 'moe', era: 1, cost: 1e6, unlockCap: 3_000, capMult: 2 },
  { id: 'synthData', era: 1, cost: 4e6, unlockCap: 8_000, capMult: 2 },
  { id: 'interpretability', era: 1, cost: 1e7, unlockCap: 15_000, alignment: 1 },
  { id: 'speculative', era: 1, cost: 3e7, unlockCap: 25_000, cashMult: 2 },
  { id: 'killSwitch', era: 1, cost: 6e7, unlockCap: 45_000, alignment: 1 },
  { id: 'chainOfThought', era: 1, cost: 1.5e8, unlockCap: 70_000, capMult: 2 },

  { id: 'testTime', era: 2, cost: 3e9, unlockCap: 150_000, capMult: 2 },
  { id: 'superalignment', era: 2, cost: 8e9, unlockCap: 300_000, alignment: 1 },
  { id: 'agents', era: 2, cost: 3e10, unlockCap: 800_000, cashMult: 2 },
  { id: 'sandbox', era: 2, cost: 1e11, unlockCap: 1.5e6, alignment: 1 },
  { id: 'selfImprove', era: 2, cost: 3e11, unlockCap: 3e6, capMult: 2 },
  { id: 'safetyInstitute', era: 2, cost: 8e11, unlockCap: 5e6, alignment: 1 },
];

// --- model releases ------------------------------------------------------

export interface ModelDef {
  era: number;
  cap: number;
  params: string;
  priceMult: number;
  hypeCash: number;
}

export const MODELS: ModelDef[] = [
  { era: 0, cap: 1, params: '120K', priceMult: 1.25, hypeCash: 25 },
  { era: 0, cap: 12, params: '1.5M', priceMult: 1.25, hypeCash: 300 },
  { era: 0, cap: 60, params: '20M', priceMult: 1.25, hypeCash: 2_500 },
  { era: 0, cap: 200, params: '175M', priceMult: 1.25, hypeCash: 15_000 },
  { era: 0, cap: 500, params: '175M', priceMult: 1.25, hypeCash: 60_000 },
  { era: 1, cap: 2_000, params: '7B', priceMult: 1.3, hypeCash: 500_000 },
  { era: 1, cap: 7_000, params: '13B', priceMult: 1.3, hypeCash: 2e6 },
  { era: 1, cap: 20_000, params: '70B', priceMult: 1.3, hypeCash: 8e6 },
  { era: 1, cap: 50_000, params: '175B', priceMult: 1.3, hypeCash: 3e7 },
  { era: 2, cap: 200_000, params: '1T', priceMult: 1.3, hypeCash: 1e9 },
  { era: 2, cap: 800_000, params: '1.8T', priceMult: 1.3, hypeCash: 5e9 },
  { era: 2, cap: 3e6, params: '?', priceMult: 1.3, hypeCash: 2e10 },
  { era: 2, cap: 7e6, params: 'Yes', priceMult: 1.3, hypeCash: 8e10 },
];

// --- rival labs ----------------------------------------------------------
// Rivals follow a reference trajectory (a typical player's log10 Capability by minute: the greedy
// simulator at 3 clicks/s and 40% training) at their own speed. They improve in steps: each release jumps to where their curve will be
// at the next release, then they coast. Different speeds and release cadences make them overtake each
// other. cap(t) = head + 10^REF(speed * releaseTime(t)).

export const RIVAL_REFERENCE: [minute: number, log10Cap: number][] = [
  [0, 0],
  [2, 0.71],
  [4, 1.18],
  [6, 1.56],
  [8, 1.8],
  [10, 2],
  [12, 2.17],
  [14, 2.37],
  [16, 2.52],
  [18, 2.63],
  [20, 2.75],
  [22, 2.87],
  [24, 2.97],
  [26, 3.07],
  [28, 3.24],
  [30, 3.46],
  [32, 3.74],
  [34, 3.96],
  [36, 4.2],
  [38, 4.35],
  [40, 4.47],
  [42, 4.56],
  [44, 4.64],
  [46, 4.71],
  [48, 4.77],
  [50, 4.83],
  [52, 4.9],
  [54, 4.98],
  [56, 5.06],
  [58, 5.19],
  [60, 5.42],
  [62, 5.68],
  [64, 5.89],
  [66, 6.04],
  [68, 6.16],
  [70, 6.26],
  [72, 6.35],
  [74, 6.42],
  [76, 6.48],
  [78, 6.59],
  [80, 6.67],
  [82, 6.74],
  [84, 6.81],
  [86, 6.86],
  [88, 6.91],
  [90, 6.95],
  [92, 6.99],
];
export const RIVAL_REFERENCE_SLOPE = 0.025; // log10 per minute beyond the last point

export interface RivalDef {
  id: 'closedai' | 'misanthropic' | 'yai' | 'shallowmind';
  head: number; // head start, matters only in the first minutes
  speed: number; // fraction of the reference pace
  every: number; // seconds between releases
  offset: number; // first release time
}

export const RIVALS: RivalDef[] = [
  { id: 'closedai', head: 30, speed: 0.84, every: 177, offset: 113 },
  { id: 'misanthropic', head: 20, speed: 0.83, every: 229, offset: 70 },
  { id: 'yai', head: 8, speed: 0.819, every: 446, offset: 427 },
  { id: 'shallowmind', head: 25, speed: 0.866, every: 361, offset: 162 },
];

export const MILESTONES = {
  firstTrainingCap: 1, // "first training" = first full point of Capability
};

export const SAVE = {
  version: 3,
  autosaveSeconds: 30,
  storageKey: 'asi-rush-save',
};
