// Guards the M0 balance targets (docs/BALANCE.md). Failing here means a constant change broke pacing.
import { describe, expect, it } from 'vitest';
import { DEFAULT_GREEDY, runGreedy } from './greedy.ts';

describe('Era 1 pacing (greedy player)', () => {
  const { milestones } = runGreedy(DEFAULT_GREEDY);

  it('first purchase under 10 s', () => expect(milestones.firstPurchase).toBeLessThan(10));
  it('first training under 3 min', () => expect(milestones.firstTraining).toBeLessThan(180));
  it('Era 1 goal in 20-40 min', () => {
    expect(milestones.eraComplete).toBeGreaterThan(20 * 60);
    expect(milestones.eraComplete).toBeLessThan(40 * 60);
  });

  it('a slower, mostly-inference player still finishes within 40 min', () => {
    const slow = runGreedy({ ...DEFAULT_GREEDY, clicksPerSec: 2, trainShare: 0.2 });
    expect(slow.milestones.eraComplete).toBeLessThan(40 * 60);
  });
});
