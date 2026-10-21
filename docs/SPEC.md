# ASI RUSH — Spec

## Premise

Incremental/idle web game. Alternate 1986: rival labs build datacenters racing to Artificial Superintelligence.
Sarcastic corporate humor in a Fallout-ish register (evoked, never copied: no Vault Boy, Pip-Boy, or real labs).
80s pixel art, CRT look, John Carpenter-style synth score (later). Main view: side cutaway of a growing datacenter.

## Stack

Vite + TypeScript (strict) · PixiJS v8 (scene) · Preact + @preact/signals (DOM UI) · break_eternity.js (numbers)
· lz-string (saves) · Vitest · ESLint + Prettier · GitHub Pages via Actions.

## Architecture

| Dir                   | Role                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `src/sim`             | Pure deterministic sim, fixed 10 Hz tick, `apply(state, action)` / `tick(state, dt)`; runs in Node |
| `src/data`            | All economy constants (buildings, costs, ratios, milestones) and news lines                        |
| `src/state`           | Signals store wrapping the sim; game loop, event log, autosave                                     |
| `src/ui`              | Preact panels: resources, shop, allocation slider, ticker, log, save; i18n                         |
| `src/scene`           | Pixi at 480×270, integer scale, `nearest`, `roundPixels`; placeholder rectangles                   |
| `src/save`            | Versioned JSON → lz-string base64; autosave 30 s; offline catch-up ≤ 24 h in 60 s steps            |
| `scripts/simulate.ts` | Headless greedy player; prints milestone times as CSV                                              |

## M0 — Era 1 "Garage" (shipped)

- Resources: Cash, Compute (FLOP/s), Power (MW, capped), Capability, Risk.
- Buildings, cost `C0 · 1.12^n`: Home PC, Accelerator Card, Server Rack. Each adds compute and draws power.
- Power demand > cap ⇒ compute × cap/demand (throttle, never off). "Bigger Fuse" (repeatable) doubles the cap.
- Training/inference slider. Inference → Cash. Training → `dCap/s = k · (trainFLOPs/flopRef)^0.35`
  (applied as a per-second rate so tick size does not change results).
- `Risk = Cap^1.5 / (1 + alignment)`, alignment = 0 in M0 (display only).
- "Run Benchmark" click for early cash. News ticker. Goal: Capability ≥ 1000 → "Investors have noticed you. Era 2 coming soon."

## Roadmap

- **M0** Era 1 playable prototype, save/load, offline, deployed. ✅
- **M1** Simulator + balance: richer strategies, timeline CSV, pacing curves, tuning across Eras 1–2.
- **M2** Vertical slice with art and audio (Eras 1–2): bitmap fonts, CRT filter, sprites, synth score.
- **M3** Rivals (4 fictional labs) + "Pivot" prestige.
- **M4** Eras 3–5 and 4 endings.
- **M5** Polish, mobile, Steam via Tauri.
