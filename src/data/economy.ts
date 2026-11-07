// All Era 1 economy constants. Logic in src/sim must read from here, never inline numbers.
// Tuned with `npm run sim`; see docs/BALANCE.md for the results these values produce.

export const TICK_HZ = 10;
export const TICK_SECONDS = 1 / TICK_HZ;

export type BuildingId = 'homePc' | 'accelCard' | 'serverRack';

export interface BuildingDef {
  id: BuildingId;
  baseCost: number; // C0 in cost = C0 * growth^owned
  costGrowth: number;
  flops: number; // FLOP/s per unit at full power
  powerMW: number; // MW drawn per unit
  revealAt: number; // cash at which the item first shows up in the shop
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  homePc: { id: 'homePc', baseCost: 10, costGrowth: 1.12, flops: 1, powerMW: 0.002, revealAt: 0 },
  accelCard: { id: 'accelCard', baseCost: 150, costGrowth: 1.12, flops: 12, powerMW: 0.015, revealAt: 60 },
  serverRack: {
    id: 'serverRack',
    baseCost: 2_500,
    costGrowth: 1.12,
    flops: 150,
    powerMW: 0.12,
    revealAt: 1_000,
  },
};

export const BUILDING_ORDER: BuildingId[] = ['homePc', 'accelCard', 'serverRack'];

// "Bigger Fuse": repeatable upgrade, cap = BASE * MULT^level.
export const POWER = {
  baseCapMW: 0.05,
  fuseCapMult: 2,
  fuseBaseCost: 100,
  fuseCostGrowth: 3.5,
};

export const ECONOMY = {
  startCash: 0,
  benchmarkCash: 2, // cash per "Run Benchmark" click
  cashPerFlop: 0.1, // $ per FLOP of inference, before model and research multipliers
  capK: 0.015, // k in dCap/s = k * capMult * (trainFlops / flopRef)^capExponent
  flopRef: 1,
  capExponent: 0.35,
  riskExponent: 1.5, // Risk = Cap^riskExponent / (1 + alignment)
  pDoomHalf: 5_000, // risk at which P(doom) reads 50%
  defaultTrainShare: 0.5,
};

// One-time research purchases. Unlocked by Capability, paid in cash.
export type ResearchId =
  | 'backprop'
  | 'perTokenBilling'
  | 'usenet'
  | 'undervolting'
  | 'redTeam'
  | 'halfPrecision'
  | 'scalingMemo'
  | 'rlhf'
  | 'attention';

export interface ResearchDef {
  id: ResearchId;
  cost: number;
  unlockCap: number;
  capMult?: number;
  cashMult?: number;
  flopsMult?: number;
  powerMult?: number;
  alignment?: number;
}

export const RESEARCH: ResearchDef[] = [
  { id: 'backprop', cost: 40, unlockCap: 0.3, capMult: 1.5 },
  { id: 'perTokenBilling', cost: 250, unlockCap: 3, cashMult: 2 },
  { id: 'usenet', cost: 600, unlockCap: 8, capMult: 1.5 },
  { id: 'undervolting', cost: 1_500, unlockCap: 20, powerMult: 0.7 },
  { id: 'redTeam', cost: 2_500, unlockCap: 35, alignment: 1 },
  { id: 'halfPrecision', cost: 6_000, unlockCap: 60, flopsMult: 1.5 },
  { id: 'scalingMemo', cost: 15_000, unlockCap: 120, capMult: 1.6 },
  { id: 'rlhf', cost: 40_000, unlockCap: 250, cashMult: 1.5, alignment: 1 },
  { id: 'attention', cost: 90_000, unlockCap: 450, capMult: 1.6 },
];

// Model releases: reaching `cap` lets you ship; shipping multiplies the price of inference and pays launch hype.
export interface ModelDef {
  id: string;
  cap: number;
  params: string;
  priceMult: number;
  hypeCash: number;
}

export const MODELS: ModelDef[] = [
  { id: 'grg1', cap: 1, params: '120K', priceMult: 1.25, hypeCash: 25 },
  { id: 'grg2', cap: 12, params: '1.5M', priceMult: 1.25, hypeCash: 300 },
  { id: 'grg3', cap: 60, params: '20M', priceMult: 1.25, hypeCash: 2_500 },
  { id: 'grg4', cap: 200, params: '175M', priceMult: 1.25, hypeCash: 15_000 },
  { id: 'grg4turbo', cap: 500, params: '175M (new font)', priceMult: 1.25, hypeCash: 60_000 },
];

// Rival labs: display-only race. cap(t) = start + goal * (t / goalSeconds)^exponent.
export interface RivalDef {
  id: string;
  start: number;
  goalSeconds: number; // when the rival reaches MILESTONES.eraGoalCap
  exponent: number;
}

export const RIVALS: RivalDef[] = [
  { id: 'halcyon', start: 10, goalSeconds: 31 * 60, exponent: 1.7 },
  { id: 'sovereign', start: 20, goalSeconds: 36 * 60, exponent: 1.5 },
  { id: 'cogitron', start: 5, goalSeconds: 44 * 60, exponent: 1.8 },
  { id: 'paragon', start: 3, goalSeconds: 55 * 60, exponent: 1.6 },
];

export const MILESTONES = {
  firstTrainingCap: 1, // "first training" = first full point of Capability
  eraGoalCap: 1_000, // Era 1 complete: Series A
};

export const OFFLINE = {
  maxSeconds: 24 * 3600,
  stepSeconds: 60,
};

export const SAVE = {
  version: 2,
  autosaveSeconds: 30,
  storageKey: 'asi-rush-save',
};
