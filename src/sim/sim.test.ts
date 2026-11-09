import { describe, expect, it } from 'vitest';
import Decimal from 'break_eternity.js';
import {
  BUILDINGS,
  CLICK_UPGRADES,
  ECONOMY,
  ERAS,
  MODELS,
  RESEARCH,
  RIVALS,
  SAFETY,
} from '../data/economy.ts';
import { decode, encode } from '../save/codec.ts';
import {
  apply,
  buildingCost,
  bulkCost,
  canShip,
  clickValue,
  effectiveFlops,
  leader,
  maxAffordable,
  multipliers,
  newGame,
  pDoom,
  playerRank,
  powerCapMW,
  rates,
  rivalCap,
  rivalEta,
  throttle,
  tick,
  type State,
} from './sim.ts';

const withCash = (cash: number): State => ({ ...newGame(), cash: new Decimal(cash) });
const withCap = (s: State, cap: number): State => ({ ...s, capability: new Decimal(cap) });
const pcs = (n: number): State['owned'] => ({ ...newGame().owned, homePc: n });
const garage = ERAS[0] as (typeof ERAS)[number];
const warehouse = ERAS[1] as (typeof ERAS)[number];

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

  it('later-era hardware is locked until that era', () => {
    expect(apply(withCash(1e9), { type: 'buy', building: 'vectorCabinet' }).owned.vectorCabinet).toBe(0);
    const era2 = { ...withCash(1e9), era: 1 };
    expect(apply(era2, { type: 'buy', building: 'vectorCabinet' }).owned.vectorCabinet).toBe(1);
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
});

describe('benchmark clicks', () => {
  it('pays the base amount, multiplied by click upgrades', () => {
    expect(apply(newGame(), { type: 'benchmark' }).cash.toNumber()).toBe(ECONOMY.benchmarkCash);
    const up = apply(withCash(1e6), { type: 'clickUpgrade' });
    expect(clickValue(up).toNumber()).toBeCloseTo(ECONOMY.benchmarkCash * (CLICK_UPGRADES[0]?.mult ?? 1));
  });

  it('revenue-share upgrades scale clicks with income', () => {
    let s: State = { ...withCash(1e6), owned: pcs(100), trainShare: 0 };
    s = apply(apply(s, { type: 'clickUpgrade' }), { type: 'clickUpgrade' });
    const pct = CLICK_UPGRADES[1]?.revenuePct ?? 0;
    expect(clickValue(s).toNumber()).toBeCloseTo(
      ECONOMY.benchmarkCash * (CLICK_UPGRADES[0]?.mult ?? 1) + rates(s).cashPerSec.toNumber() * pct,
    );
  });
});

describe('power throttle', () => {
  const over = Math.ceil((garage.baseCapMW * 4) / BUILDINGS.homePc.powerMW);

  it('runs at full speed under the cap', () => {
    expect(throttle({ ...newGame(), owned: pcs(1) })).toBe(1);
  });

  it('scales compute by cap/demand when over the cap, never to zero', () => {
    const s = { ...newGame(), owned: pcs(over) };
    expect(throttle(s)).toBeCloseTo(powerCapMW(s) / (over * BUILDINGS.homePc.powerMW));
    expect(effectiveFlops(s)).toBeGreaterThan(0);
  });

  it('a power upgrade doubles the cap; a new era resets it to the bigger site', () => {
    const s = { ...withCash(1e6), owned: pcs(over) };
    const up = apply(s, { type: 'buyFuse' });
    expect(powerCapMW(up)).toBeCloseTo(powerCapMW(s) * 2);
    const moved = apply({ ...withCap(up, garage.goal), roundClosed: true }, { type: 'advanceEra' });
    expect(moved.fuseLevel).toBe(0);
    expect(powerCapMW(moved)).toBe(warehouse.baseCapMW);
  });
});

describe('training vs inference', () => {
  const s = { ...newGame(), owned: pcs(10) };

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
    const t = { ...s, trainShare: 0 };
    let fine = t;
    for (let i = 0; i < 600; i++) fine = tick(fine, 0.1);
    const coarse = tick(t, 60);
    expect(fine.cash.toNumber()).toBeCloseTo(coarse.cash.toNumber(), 6);
  });
});

describe('research and models', () => {
  const backprop = RESEARCH[0] as (typeof RESEARCH)[number];

  it('research is locked until its capability threshold and then applies its multiplier', () => {
    const rich = withCash(1e6);
    expect(apply(rich, { type: 'research', id: backprop.id })).toBe(rich);
    const done = apply(withCap(rich, backprop.unlockCap), { type: 'research', id: backprop.id });
    expect(multipliers(done).cap).toBeCloseTo(backprop.capMult ?? 1);
    expect(apply(done, { type: 'research', id: backprop.id })).toBe(done); // one-time
  });

  it('the first paper is cheap and later papers cost more', () => {
    const costs = RESEARCH.map((r) => r.cost);
    expect(costs[0]).toBeLessThan(ECONOMY.benchmarkCash * 10);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });

  it('shipping a model needs its capability, pays hype and raises the price of inference', () => {
    const first = MODELS[0] as (typeof MODELS)[number];
    expect(canShip(newGame())).toBe(false);
    const shipped = apply(withCap(newGame(), first.cap), { type: 'ship' });
    expect(shipped.cash.toNumber()).toBe(first.hypeCash);
    expect(multipliers(shipped).cash).toBeCloseTo(first.priceMult);
  });

  it('models of a later era wait for that era', () => {
    const s = { ...withCap(newGame(), 1e9), modelsShipped: MODELS.findIndex((m) => m.era === 1) };
    expect(canShip(s)).toBe(false);
    expect(canShip({ ...s, era: 1 })).toBe(true);
  });
});

describe('P(doom)', () => {
  it('rises with capability, falls with alignment, and cuts revenue', () => {
    const base = { ...withCap(withCash(1e9), 1000), owned: pcs(20), trainShare: 0 };
    const aligned = apply(base, { type: 'research', id: 'redTeam' });
    expect(pDoom(aligned)).toBeLessThan(pDoom(base));
    expect(rates(aligned).cashPerSec.gt(rates(base).cashPerSec)).toBe(true);
    expect(rates(base).cashPerSec.toNumber()).toBeCloseTo(
      20 * ECONOMY.cashPerFlop * (1 - SAFETY.revenuePenalty * pDoom(base)),
    );
  });

  it('ends the run at the doom limit', () => {
    expect(tick(withCap(newGame(), SAFETY.baseSafeCap * 100)).outcome).toBe('doom');
  });
});

describe('eras and the race', () => {
  it('reaching the goal closes the round; advancing moves to the next site', () => {
    const s = tick(withCap({ ...newGame(), research: ['redTeam', 'rlhf'] }, garage.goal));
    expect(s.roundClosed).toBe(true);
    expect(s.outcome).toBeNull();
    const next = apply(s, { type: 'advanceEra' });
    expect(next.era).toBe(1);
    expect(next.roundClosed).toBe(false);
  });

  it('closing the final round wins the game', () => {
    const last = ERAS[ERAS.length - 1] as (typeof ERAS)[number];
    const s = { ...newGame(), era: ERAS.length - 1, research: RESEARCH.map((r) => r.id) };
    expect(tick(withCap(s, last.goal)).outcome).toBe('won');
  });

  it('a rival reaching the goal first loses the round, and a lost run is frozen', () => {
    const deadline = rivalEta(0, garage.goal) ?? 0;
    const lost = tick({ ...newGame(), time: deadline });
    expect(lost.outcome).toBe('lost');
    expect(lost.lostTo).toBe(leader(lost.time).rival.id);
    expect(tick(lost)).toBe(lost);
    expect(apply(lost, { type: 'benchmark' })).toBe(lost);
  });

  it('rivals improve in steps and never go down', () => {
    for (const r of RIVALS) {
      let prev = 0;
      for (let t = 0; t < 7200; t += 30) {
        const c = rivalCap(r, t);
        expect(c).toBeGreaterThanOrEqual(prev);
        prev = c;
      }
    }
  });

  it('pole position changes hands among the rivals', () => {
    const leaders = new Set<string>();
    for (let t = 0; t < 6000; t += 30) leaders.add(leader(t).rival.id);
    expect(leaders.size).toBe(RIVALS.length);
  });

  it('rank is last at the start and first when far ahead', () => {
    expect(playerRank(newGame())).toBe(RIVALS.length + 1);
    expect(playerRank(withCap(newGame(), 1e12))).toBe(1);
  });
});

describe('save codec', () => {
  it('round-trips state', () => {
    let s: State = { ...withCash(1234.5), owned: { ...pcs(4), accelCard: 2 }, fuseLevel: 2, trainShare: 0.3 };
    s = { ...tick(s, 100), clickUpgrades: 2, roundsClosedAt: [12] };
    const out = decode(encode(s, 42));
    expect(out?.savedAt).toBe(42);
    expect(out?.state.cash.toString()).toBe(s.cash.toString());
    expect(out?.state).toMatchObject({
      owned: s.owned,
      fuseLevel: 2,
      clickUpgrades: 2,
      roundsClosedAt: [12],
    });
  });

  it('loading never advances time: the game is paused while closed', () => {
    const s = tick({ ...newGame(), owned: pcs(3) }, 50);
    const out = decode(encode(s, Date.now() - 7 * 24 * 3600 * 1000));
    expect(out?.state.time).toBe(s.time);
    expect(out?.state.cash.toString()).toBe(s.cash.toString());
  });

  it('rejects garbage', () => {
    expect(decode('not a save')).toBeNull();
  });
});
