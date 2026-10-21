# Balance — Era 1

Targets: first purchase < 10 s · first training (Capability ≥ 1) < 3 min · Era 1 goal (Capability ≥ 1000) in 20–40 min.
Guarded by `src/sim/balance.test.ts`. Constants: `src/data/economy.ts`.

## Model player (`src/sim/greedy.ts`)

Clicks "Run Benchmark" at N clicks/s while clicking out-earns idle income; buys the option with the best
FLOP/s-per-dollar (fuse included, valued by the throttle it removes) as soon as affordable; sets the slider once.

## Results (2026-10-21, `capK = 0.08`)

| Milestone              | Greedy (5 clicks/s, 50% train) | Slow (2 clicks/s, 20% train) |
| ---------------------- | ------------------------------ | ---------------------------- |
| First purchase         | 0m01s                          | 0m02s                        |
| First training         | 0m14s                          | 0m20s                        |
| First Accelerator Card | 0m17s                          | 0m41s                        |
| First Server Rack      | 4m20s                          | 7m50s                        |
| First Bigger Fuse      | 4m28s                          | 8m13s                        |
| **Era 1 complete**     | **32m25s**                     | **39m20s**                   |

Greedy end state: 17 PCs, 11 cards, 7 racks, fuse level 5.

## Tuning log

- `capK` 0.05 → 44m16s (too slow). 0.06 → 39m12s / slow 46m57s. 0.07 → 35m27s / 42m43s. **0.08 → 32m25s / 39m20s.**
- Train share barely moves completion time (0.2 → 49m, 0.7 → 43m at k=0.05): the 0.35 exponent makes
  capability rate weakly dependent on compute, so the slider is a weak lever. Revisit in M1 (e.g. data/algorithm upgrades).
- First power throttle arrives ~4 min in; the fuse becomes the best buy right after the first Server Rack.
