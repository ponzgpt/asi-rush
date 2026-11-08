// Tiny typed pub/sub so audio, scene and UI react to game moments without knowing about each other.
export type GameEvent =
  | 'benchmark'
  | 'buy'
  | 'denied'
  | 'fuse'
  | 'throttle'
  | 'research'
  | 'ship'
  | 'click'
  | 'overtake'
  | 'overtaken'
  | 'rival'
  | 'round'
  | 'era'
  | 'victory'
  | 'defeat'
  | 'ui';

type Listener = (e: GameEvent) => void;
const listeners = new Set<Listener>();

export function on(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(e: GameEvent) {
  for (const fn of listeners) fn(e);
}
