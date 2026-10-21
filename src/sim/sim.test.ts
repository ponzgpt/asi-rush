import { describe, expect, it } from 'vitest';
import { BUILDINGS, ECONOMY, OFFLINE, POWER } from '../data/economy.ts';
import { decode, encode } from '../save/codec.ts';
import {
  apply,
  buildingCost,
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
  const s = { ...newGame(), owned: { homePc: 3, accelCard: 0, serverRack: 0 } };

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
