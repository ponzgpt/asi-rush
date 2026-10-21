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
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  homePc: { id: 'homePc', baseCost: 10, costGrowth: 1.12, flops: 1, powerMW: 0.002 },
  accelCard: { id: 'accelCard', baseCost: 150, costGrowth: 1.12, flops: 12, powerMW: 0.015 },
  serverRack: { id: 'serverRack', baseCost: 2_500, costGrowth: 1.12, flops: 150, powerMW: 0.12 },
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
  cashPerFlop: 0.1, // $ per FLOP of inference
  capK: 0.08, // k in dCap/s = k * (trainFlops / flopRef)^capExponent
  flopRef: 1,
  capExponent: 0.35,
  riskExponent: 1.5, // Risk = Cap^riskExponent / (1 + alignment)
  defaultTrainShare: 0,
};

export const MILESTONES = {
  firstTrainingCap: 1, // "first training" = first full point of Capability
  eraGoalCap: 1_000, // Era 1 complete
};

export const OFFLINE = {
  maxSeconds: 24 * 3600,
  stepSeconds: 60,
};

export const SAVE = {
  version: 1,
  autosaveSeconds: 30,
  storageKey: 'asi-rush-save',
};
