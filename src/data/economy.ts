// All economy constants. Logic in src/sim must read from here, never inline numbers.
// Tuned with `npm run sim`; see docs/BALANCE.md for the results these values produce.
//
// The game retells the real AI race in five eras, from beige PCs to superintelligence. Each era is a site,
// a span of years, a hardware generation and a historical milestone to reach before the rival labs of the time.

export const TICK_HZ = 10;
export const TICK_SECONDS = 1 / TICK_HZ;

// --- eras ----------------------------------------------------------------

export type EraId = 'garage' | 'office' | 'loft' | 'datacenter' | 'frontier';

export interface EraDef {
  id: EraId;
  years: [from: number, to: number]; // shown on the in-game calendar as Capability grows
  goal: number; // Capability that reaches this era's milestone
  baseCapMW: number; // site grid connection before power upgrades
  powerBaseCost: number;
  powerCostGrowth: number;
}

export const ERAS: EraDef[] = [
  {
    id: 'garage',
    years: [1986, 1995],
    goal: 1_000,
    baseCapMW: 0.05,
    powerBaseCost: 100,
    powerCostGrowth: 3.5,
  },
  {
    id: 'office',
    years: [1995, 2006],
    goal: 30_000,
    baseCapMW: 1.5,
    powerBaseCost: 6e4,
    powerCostGrowth: 3.5,
  },
  { id: 'loft', years: [2006, 2016], goal: 1e6, baseCapMW: 8, powerBaseCost: 2e7, powerCostGrowth: 3.5 },
  {
    id: 'datacenter',
    years: [2016, 2022],
    goal: 3e7,
    baseCapMW: 150,
    powerBaseCost: 6e9,
    powerCostGrowth: 3.5,
  },
  {
    id: 'frontier',
    years: [2022, 2030],
    goal: 1e9,
    baseCapMW: 6000,
    powerBaseCost: 2e12,
    powerCostGrowth: 3.5,
  },
];

export const POWER_MULT = 2; // each power upgrade doubles the site's cap

// --- hardware: each era brings its own generation ------------------------

export type BuildingId =
  | 'homePc'
  | 'accelCard'
  | 'workstation'
  | 'towerPc'
  | 'rackServer'
  | 'gamingRig'
  | 'gpuServer'
  | 'dgxPod'
  | 'tensorPod'
  | 'rubinRack'
  | 'dataHall';

export interface BuildingDef {
  id: BuildingId;
  era: number;
  baseCost: number; // C0 in cost = C0 * growth^owned
  costGrowth: number;
  flops: number; // FLOP/s per unit at full power
  powerMW: number; // MW drawn per unit
  revealAt: number; // lifetime cash at which the item first shows up (within its era)
}

const b = (id: BuildingId, era: number, baseCost: number, flops: number, powerMW: number, revealAt = 0) =>
  ({ id, era, baseCost, costGrowth: 1.12, flops, powerMW, revealAt }) satisfies BuildingDef;

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  homePc: b('homePc', 0, 10, 1, 0.002),
  accelCard: b('accelCard', 0, 150, 12, 0.015, 60),
  workstation: b('workstation', 0, 2_500, 150, 0.12, 1_000),
  towerPc: b('towerPc', 1, 5e4, 7.5e3, 0.06),
  rackServer: b('rackServer', 1, 1e6, 1.5e5, 0.6),
  gamingRig: b('gamingRig', 2, 2e7, 5e5, 0.4),
  gpuServer: b('gpuServer', 2, 4e8, 1e7, 4),
  dgxPod: b('dgxPod', 3, 8e9, 1.2e7, 8),
  tensorPod: b('tensorPod', 3, 1.6e11, 2.4e8, 80),
  rubinRack: b('rubinRack', 4, 3e12, 1.8e9, 300),
  dataHall: b('dataHall', 4, 6e13, 3.6e10, 3000),
};

export const BUILDING_ORDER: BuildingId[] = Object.keys(BUILDINGS) as BuildingId[];

// --- core economy --------------------------------------------------------

export const ECONOMY = {
  startCash: 0,
  benchmarkCash: 2, // base cash per "Run Benchmark" click
  cashPerFlop: 0.1, // $ per FLOP of inference, before multipliers
  capK: 0.02, // k in dCap/s = k * capMult * (trainFlops / flopRef)^capExponent
  flopRef: 1,
  capExponent: 0.35,
  defaultTrainShare: 0.5,
};

// P(doom) = x^e / (1 + x^e), x = Capability / safeCap, safeCap = base * perAlignment^alignment.
// It cuts revenue (public trust) and ends the game at doomLimit. Two alignment papers per era keep pace.
export const SAFETY = {
  baseSafeCap: 400,
  perAlignment: 5,
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
  { id: 'contamination', cost: 3e5, revenuePct: 0.04 },
  { id: 'vibes', cost: 3e7, mult: 10 },
  { id: 'pressRelease', cost: 1e10, revenuePct: 0.06 },
  { id: 'saturation', cost: 1e13, revenuePct: 0.1 },
];

// --- research: the real papers and turns of the AI story ------------------

export type ResearchId =
  | 'backprop'
  | 'expertSystems'
  | 'threeLaws'
  | 'lenet'
  | 'powerMgmt'
  | 'blas'
  | 'killSwitchMemo'
  | 'zipcodes'
  | 'lstm'
  | 'searchAds'
  | 'friendlyAi'
  | 'moore'
  | 'svm'
  | 'turingRules'
  | 'deepBelief'
  | 'cuda'
  | 'imagenet'
  | 'dropout'
  | 'concreteProblems'
  | 'cloudApi'
  | 'partnership'
  | 'resnet'
  | 'attention'
  | 'mixedPrecision'
  | 'scalingLaws'
  | 'rlhf'
  | 'constitution'
  | 'chainOfThought'
  | 'moe'
  | 'interpretability'
  | 'testTime'
  | 'agents'
  | 'superalignment'
  | 'selfImprove'
  | 'safetyInstitutes';

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
  { id: 'expertSystems', era: 0, cost: 150, unlockCap: 2, cashMult: 2 },
  { id: 'threeLaws', era: 0, cost: 600, unlockCap: 10, alignment: 1 },
  { id: 'lenet', era: 0, cost: 1_500, unlockCap: 20, capMult: 1.5 },
  { id: 'powerMgmt', era: 0, cost: 3_000, unlockCap: 40, powerMult: 0.7 },
  { id: 'blas', era: 0, cost: 7_000, unlockCap: 80, flopsMult: 1.5 },
  { id: 'killSwitchMemo', era: 0, cost: 15_000, unlockCap: 150, alignment: 1 },
  { id: 'zipcodes', era: 0, cost: 40_000, unlockCap: 300, capMult: 1.6 },

  { id: 'lstm', era: 1, cost: 1e5, unlockCap: 1_500, capMult: 1.5 },
  { id: 'searchAds', era: 1, cost: 3e5, unlockCap: 2_500, cashMult: 2 },
  { id: 'friendlyAi', era: 1, cost: 6e5, unlockCap: 4_000, alignment: 1 },
  { id: 'moore', era: 1, cost: 1.2e6, unlockCap: 6_000, flopsMult: 1.5 },
  { id: 'svm', era: 1, cost: 2.5e6, unlockCap: 9_000, capMult: 1.5 },
  { id: 'turingRules', era: 1, cost: 5e6, unlockCap: 13_000, alignment: 1 },
  { id: 'deepBelief', era: 1, cost: 1e7, unlockCap: 18_000, capMult: 2 },

  { id: 'cuda', era: 2, cost: 3e8, unlockCap: 4e4, flopsMult: 2 },
  { id: 'imagenet', era: 2, cost: 8e8, unlockCap: 7e4, capMult: 1.5 },
  { id: 'dropout', era: 2, cost: 2e9, unlockCap: 1.5e5, capMult: 1.5 },
  { id: 'concreteProblems', era: 2, cost: 4e9, unlockCap: 2.5e5, alignment: 1 },
  { id: 'cloudApi', era: 2, cost: 8e9, unlockCap: 3.5e5, cashMult: 2 },
  { id: 'partnership', era: 2, cost: 1.5e10, unlockCap: 5e5, alignment: 1 },
  { id: 'resnet', era: 2, cost: 3e10, unlockCap: 6.5e5, capMult: 2 },

  { id: 'attention', era: 3, cost: 8e11, unlockCap: 1.2e6, capMult: 3 },
  { id: 'mixedPrecision', era: 3, cost: 2e12, unlockCap: 2e6, flopsMult: 1.5 },
  { id: 'scalingLaws', era: 3, cost: 5e12, unlockCap: 4e6, capMult: 2 },
  { id: 'rlhf', era: 3, cost: 1.2e13, unlockCap: 8e6, cashMult: 1.5, alignment: 1 },
  { id: 'constitution', era: 3, cost: 3e13, unlockCap: 1.4e7, alignment: 1 },
  { id: 'chainOfThought', era: 3, cost: 6e13, unlockCap: 2e7, capMult: 1.5 },

  { id: 'moe', era: 4, cost: 1.5e15, unlockCap: 4e7, capMult: 2 },
  { id: 'interpretability', era: 4, cost: 4e15, unlockCap: 8e7, alignment: 1 },
  { id: 'testTime', era: 4, cost: 1e16, unlockCap: 1.5e8, capMult: 2 },
  { id: 'agents', era: 4, cost: 2.5e16, unlockCap: 2.5e8, cashMult: 2 },
  { id: 'superalignment', era: 4, cost: 6e16, unlockCap: 4e8, alignment: 1 },
  { id: 'selfImprove', era: 4, cost: 1.5e17, unlockCap: 6e8, capMult: 2 },
  { id: 'safetyInstitutes', era: 4, cost: 3e17, unlockCap: 8e8, alignment: 1 },
];

// --- model releases ------------------------------------------------------

export interface ModelDef {
  era: number;
  cap: number;
  params: string;
  priceMult: number;
  hypeCash: number;
}

const m = (era: number, cap: number, params: string, hypeCash: number): ModelDef => ({
  era,
  cap,
  params,
  priceMult: 1.25,
  hypeCash,
});

export const MODELS: ModelDef[] = [
  m(0, 1, '1K', 25),
  m(0, 30, '10K', 800),
  m(0, 300, '60K', 20_000),
  m(1, 2_000, '1M', 2e5),
  m(1, 8_000, '5M', 1e6),
  m(1, 20_000, '20M', 4e6),
  m(2, 6e4, '60M', 5e7),
  m(2, 2e5, '100M', 2e8),
  m(2, 6e5, '300M', 1e9),
  m(3, 2e6, '1.5B', 5e9),
  m(3, 8e6, '175B', 2e10),
  m(3, 2e7, '540B', 1e11),
  m(4, 6e7, '1.8T', 5e11),
  m(4, 2e8, '?', 2e12),
  m(4, 6e8, 'Yes', 1e13),
];

// --- rival labs ----------------------------------------------------------
// Four rival slots. Their names change with the era (see i18n `rival.<era>.<slot>`): symbolic-AI firms in
// the 80s, search giants in the 2000s, deep-learning labs in the 2010s, frontier labs today.
// Rivals follow a reference trajectory (a typical player's log10 Capability by minute, from the greedy
// simulator at 3 clicks/s and 40% training) at their own speed, and improve in steps: each release jumps to
// where their curve will be at the next release. cap(t) = head + 10^REF(speed * releaseTime(t)).

export const RIVAL_REFERENCE: [minute: number, log10Cap: number][] = [
  [0, 0],
  [2, 0.83],
  [4, 1.22],
  [6, 1.62],
  [8, 1.89],
  [10, 2.08],
  [12, 2.25],
  [14, 2.39],
  [16, 2.51],
  [18, 2.65],
  [20, 2.76],
  [22, 2.86],
  [24, 2.93],
  [26, 3],
  [28, 3.07],
  [30, 3.13],
  [32, 3.26],
  [34, 3.56],
  [36, 3.79],
  [38, 3.97],
  [40, 4.15],
  [42, 4.31],
  [44, 4.48],
  [46, 4.72],
  [48, 5.05],
  [50, 5.31],
  [52, 5.51],
  [54, 5.65],
  [56, 5.76],
  [58, 5.88],
  [60, 6.01],
  [62, 6.21],
  [64, 6.53],
  [66, 6.77],
  [68, 7.02],
  [70, 7.18],
  [72, 7.3],
  [74, 7.4],
  [76, 7.48],
  [78, 7.6],
  [80, 7.84],
  [82, 8.11],
  [84, 8.32],
  [86, 8.46],
  [88, 8.57],
  [90, 8.72],
  [92, 8.85],
  [94, 8.94],
];
export const RIVAL_REFERENCE_SLOPE = 0.025; // log10 per minute beyond the last point

export interface RivalDef {
  id: 'r0' | 'r1' | 'r2' | 'r3';
  head: number; // head start, matters only in the first minutes
  speed: number; // fraction of the reference pace
  every: number; // seconds between releases
  offset: number; // first release time
}

export const RIVALS: RivalDef[] = [
  { id: 'r0', head: 30, speed: 0.867, every: 195, offset: 114 },
  { id: 'r1', head: 20, speed: 0.883, every: 220, offset: 84 },
  { id: 'r2', head: 8, speed: 0.86, every: 423, offset: 386 },
  { id: 'r3', head: 25, speed: 0.874, every: 361, offset: 165 },
];

export const MILESTONES = {
  firstTrainingCap: 1, // "first training" = first full point of Capability
};

export const SAVE = {
  version: 4,
  autosaveSeconds: 30,
  storageKey: 'asi-rush-save',
};
