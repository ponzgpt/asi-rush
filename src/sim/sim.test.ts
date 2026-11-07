import { describe, expect, it } from 'vitest';
import { BUILDINGS, ECONOMY, MODELS, OFFLINE, POWER, RESEARCH, RIVALS } from '../data/economy.ts';
import { decode, encode } from '../save/codec.ts';
import {
  apply,
  buildingCost,
  bulkCost,
  canShip,
  maxAffordable,
  multipliers,
  pDoom,
  playerRank,
  rivalCap,
  effectiveFlops,
  newGame,
  rates,
  simulateOffline,
  throttle,
  tick,
  type State,
} from './sim.ts';

const withCash = (cash: number): State => {
  const s = newGame();
  return { ...s, cash: s.cash.add(cash) };
};

describe('costs', () => {
  it('follows C0 * 1.12^n', () => {
    expect(buildingCost('homePc', 0).toNumber()).toBeCloseTo(BUILDINGS.homePc.baseCost);
    expect(buildingCost('homePc', 5).toNumber()).toBeCloseTo(BUILDINGS.homePc.baseCost * 1.12 ** 5);
  });

  it('buys only when affordable and deducts the cost', () => {
    expect(apply(withCash(1), { type: 'buy', building: 'homePc' }).owned.homePc).toBe(0);
    const s = apply(withCash(25), { type: 'buy', building: 'homePc' });
    expect(s.owned.homePc).toBe(1);
    expect(s.cash.toNumber()).toBeCloseTo(25 - BUILDINGS.homePc.baseCost);
  });

  it('benchmark click pays cash', () => {
    expect(apply(newGame(), { type: 'benchmark' }).cash.toNumber()).toBe(ECONOMY.benchmarkCash);
  });
});

describe('bulk buying', () => {
  it('bulk cost equals the sum of single costs', () => {
    let sum = 0;
    for (let i = 3; i < 13; i++) sum += buildingCost('accelCard', i).toNumber();
    expect(bulkCost('accelCard', 3, 10).toNumber()).toBeCloseTo(sum, 6);
  });

  it('max buys as many as cash allows, never more', () => {
    const s = withCash(1000);
    const n = maxAffordable('homePc', 0, s.cash);
    expect(bulkCost('homePc', 0, n).lte(1000)).toBe(true);
    expect(bulkCost('homePc', 0, n + 1).gt(1000)).toBe(true);
    expect(apply(s, { type: 'buy', building: 'homePc', count: 'max' }).owned.homePc).toBe(n);
  });

  it('a fixed count is all-or-nothing', () => {
    expect(apply(withCash(50), { type: 'buy', building: 'homePc', count: 10 }).owned.homePc).toBe(0);
  });
});

describe('research and models', () => {
  const backprop = RESEARCH[0] as (typeof RESEARCH)[number];

  it('research is locked until its capability threshold and then applies its multiplier', () => {
    const rich = withCash(1e6);
    expect(apply(rich, { type: 'research', id: backprop.id })).toBe(rich);
    const unlocked = { ...rich, capability: rich.capability.add(backprop.unlockCap) };
    const done = apply(unlocked, { type: 'research', id: backprop.id });
    expect(done.research).toContain(backprop.id);
    expect(multipliers(done).cap).toBeCloseTo(backprop.capMult ?? 1);
    expect(apply(done, { type: 'research', id: backprop.id })).toBe(done); // one-time
  });

  it('shipping a model needs its capability, pays hype and raises the price of inference', () => {
    const first = MODELS[0] as (typeof MODELS)[number];
    expect(canShip(newGame())).toBe(false);
    const s = { ...newGame(), capability: newGame().capability.add(first.cap) };
    const shipped = apply(s, { type: 'ship' });
    expect(shipped.modelsShipped).toBe(1);
    expect(shipped.cash.toNumber()).toBe(first.hypeCash);
    expect(multipliers(shipped).cash).toBeCloseTo(first.priceMult);
  });

  it('alignment research lowers P(doom) for the same capability', () => {
    const base = { ...withCash(1e6), capability: newGame().capability.add(500) };
    const aligned = apply(base, { type: 'research', id: 'redTeam' });
    expect(pDoom(aligned)).toBeLessThan(pDoom(base));
    expect(pDoom(base)).toBeGreaterThan(0);
    expect(pDoom(base)).toBeLessThan(1);
  });
});

describe('rivals', () => {
  it('reach the era goal at their goal time', () => {
    for (const r of RIVALS) expect(rivalCap(r, r.goalSeconds)).toBeCloseTo(r.start + 1000);
  });

  it('rank is 1 when ahead of every rival, last when behind all', () => {
    expect(playerRank(newGame())).toBe(RIVALS.length + 1);
    expect(playerRank({ ...newGame(), capability: newGame().capability.add(1e6) })).toBe(1);
  });
});

describe('power throttle', () => {
  it('runs at full speed under the cap', () => {
    const s = { ...newGame(), owned: { homePc: 1, accelCard: 0, serverRack: 0 } };
    expect(throttle(s)).toBe(1);
  });

  it('scales compute by cap/demand when over the cap, never to zero', () => {
    const n = Math.ceil((POWER.baseCapMW * 4) / BUILDINGS.homePc.powerMW);
    const s = { ...newGame(), owned: { homePc: n, accelCard: 0, serverRack: 0 } };
    const demand = n * BUILDINGS.homePc.powerMW;
    expect(throttle(s)).toBeCloseTo(POWER.baseCapMW / demand);
    expect(effectiveFlops(s)).toBeCloseTo(n * BUILDINGS.homePc.flops * (POWER.baseCapMW / demand));
    expect(effectiveFlops(s)).toBeGreaterThan(0);
  });

  it('Bigger Fuse raises the cap', () => {
    const n = Math.ceil((POWER.baseCapMW * 4) / BUILDINGS.homePc.powerMW);
    const s = { ...withCash(1e6), owned: { homePc: n, accelCard: 0, serverRack: 0 } };
    expect(throttle(apply(s, { type: 'buyFuse' }))).toBeGreaterThan(throttle(s));
  });
});

describe('training vs inference', () => {
  const s = { ...newGame(), owned: { homePc: 10, accelCard: 0, serverRack: 0 } };

  it('all inference makes cash and no capability', () => {
    const r = rates({ ...s, trainShare: 0 });
    expect(r.cashPerSec.toNumber()).toBeCloseTo(10 * ECONOMY.cashPerFlop);
    expect(r.capPerSec.toNumber()).toBe(0);
  });

  it('training follows k * (flops/flopRef)^0.35', () => {
    const r = rates({ ...s, trainShare: 0.5 });
    expect(r.capPerSec.toNumber()).toBeCloseTo(ECONOMY.capK * (5 / ECONOMY.flopRef) ** 0.35);
  });

  it('tick size does not change the outcome', () => {
    const t = { ...s, trainShare: 0.5 };
    let fine = t;
    for (let i = 0; i < 600; i++) fine = tick(fine, 0.1);
    const coarse = tick(t, 60);
    expect(fine.cash.toNumber()).toBeCloseTo(coarse.cash.toNumber(), 6);
    expect(fine.capability.toNumber()).toBeCloseTo(coarse.capability.toNumber(), 6);
  });
});

describe('offline progress', () => {
  const s = { ...newGame(), trainShare: 0, owned: { homePc: 3, accelCard: 0, serverRack: 0 } };

  it('matches online ticking', () => {
    expect(simulateOffline(s, 3600).cash.toNumber()).toBeCloseTo(3 * ECONOMY.cashPerFlop * 3600);
  });

  it('is capped at 24 hours', () => {
    expect(simulateOffline(s, 10 * OFFLINE.maxSeconds).time).toBe(OFFLINE.maxSeconds);
  });
});

describe('save codec', () => {
  it('round-trips state', () => {
    let s = withCash(1234.5);
    s = { ...s, owned: { homePc: 4, accelCard: 2, serverRack: 1 }, fuseLevel: 2, trainShare: 0.3 };
    s = tick(s, 100);
    const out = decode(encode(s, 42));
    expect(out?.savedAt).toBe(42);
    expect(out?.state.cash.toString()).toBe(s.cash.toString());
    expect(out?.state.capability.toString()).toBe(s.capability.toString());
    expect(out?.state).toMatchObject({ owned: s.owned, fuseLevel: 2, trainShare: 0.3, time: s.time });
  });

  it('rejects garbage', () => {
    expect(decode('not a save')).toBeNull();
  });
});
