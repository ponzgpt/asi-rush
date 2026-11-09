// Where each unit of hardware stands. Pure, so the 1:1 rule is tested in Node.

export interface Slot {
  x: number; // left edge
  y: number; // bottom edge (sprites stand on it)
}

/**
 * Where the i-th unit of a hardware type stands: spots fill one deep first, then units pile up behind the ones
 * already there. Every unit owned is one sprite, so the room shows exactly what you own.
 */
export function pilePosition(hw: { slots: Slot[]; pile?: { dx: number; dy: number } }, i: number) {
  const n = hw.slots.length;
  const slot = hw.slots[i % n] as Slot;
  const depth = Math.floor(i / n);
  const step = hw.pile ?? { dx: 2, dy: -2 };
  return { x: slot.x + depth * step.dx, y: slot.y + depth * step.dy, depth };
}
