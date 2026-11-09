import { describe, expect, it } from 'vitest';
import { pilePosition } from './pile.ts';

describe('pilePosition', () => {
  const hw = {
    slots: [
      { x: 0, y: 100 },
      { x: 40, y: 100 },
    ],
    pile: { dx: 3, dy: -2 },
  };

  it('gives every unit its own place, however many there are', () => {
    const places = new Set(Array.from({ length: 300 }, (_, i) => JSON.stringify(pilePosition(hw, i))));
    expect(places.size).toBe(300);
  });

  it('fills every spot once before piling up', () => {
    expect(pilePosition(hw, 1)).toEqual({ x: 40, y: 100, depth: 0 });
    expect(pilePosition(hw, 2)).toEqual({ x: 3, y: 98, depth: 1 });
  });
});
