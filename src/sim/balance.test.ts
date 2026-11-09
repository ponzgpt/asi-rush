// Guards the pacing targets (docs/BALANCE.md). Failing here means a constant change broke pacing.
import { describe, expect, it } from 'vitest';
import { DEFAULT_GREEDY, runGreedy } from './greedy.ts';

// each case replays a full 90-120 min game headless; CI runners need more than the 5 s default
describe('pacing', { timeout: 60_000 }, () => {
  const expert = runGreedy(DEFAULT_GREEDY);

  it('first purchase under 10 s and first training under 3 min', () => {
    expect(expert.milestones.firstPurchase).toBeLessThan(10);
    expect(expert.milestones.firstTraining).toBeLessThan(180);
  });

  it('the first milestone (garage era) in 20-40 min', () => {
    expect(expert.milestones.garage).toBeGreaterThan(20 * 60);
    expect(expert.milestones.garage).toBeLessThan(40 * 60);
  });

  it('an expert reaches ASI first, in under two hours', () => {
    expect(expert.final.outcome).toBe('won');
    expect(expert.milestones.asi).toBeLessThan(2 * 3600);
  });

  it('a typical player (3 clicks/s, 40% training) also wins', () => {
    expect(runGreedy({ ...DEFAULT_GREEDY, clicksPerSec: 3, trainShare: 0.4 }).final.outcome).toBe('won');
  });

  it('a passive player (1 click/s, 20% training) loses a round: the race is real', () => {
    expect(runGreedy({ ...DEFAULT_GREEDY, clicksPerSec: 1, trainShare: 0.2 }).final.outcome).toBe('lost');
  });
});
