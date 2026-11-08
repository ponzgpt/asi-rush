import type { Container } from 'pixi.js';
import type { State } from '../sim/sim.ts';

export const W = 480;
export const H = 270;

/** One era's scene: a layer in the world plus a per-frame update. */
export interface SceneModule {
  container: Container;
  update: (s: State, deltaMS: number) => void;
  /** Colors used to extend the scene past its 480x270 frame on tall or wide screens. */
  edges: { top: string; bottom: string; stars: boolean };
}
