# Balance — Era I

Targets: first purchase < 10 s · first training (Capability ≥ 1) < 3 min · Era I goal (Capability ≥ 1000) in 20–40 min.
Guarded by `src/sim/balance.test.ts`. Constants: `src/data/economy.ts`.

## Model player (`src/sim/greedy.ts`)

Clicks "Run benchmark" at N clicks/s while clicking out-earns idle income; ships every model as soon as it can;
publishes every paper it can afford; then buys the option with the best FLOP/s per dollar (fuse included, valued
by the throttle it removes). Sets the slider once.

## Results (2026-11-07, `capK = 0.015`, model price ×1.25 each)

| Milestone              | Greedy (5 clicks/s, 50% train)   | Slow (2 clicks/s, 20% train)                |
| ---------------------- | -------------------------------- | ------------------------------------------- |
| First purchase         | 0m01s                            | 0m02s                                       |
| First Accelerator Card | 0m17s                            | 0m51s                                       |
| First training         | 0m35s                            | 1m02s                                       |
| First Server Rack      | 4m20s                            | 13m38s                                      |
| First Bigger Fuse      | 4m25s                            | 13m44s                                      |
| Last paper published   | 21m41s                           | 27m43s                                      |
| **Era I complete**     | **26m08s**                       | **34m53s**                                  |
| Leaderboard            | #5 → #3 at 8 min → #1 at ~21 min | ends #3 (Halcyon and Sovereign close first) |

## Tuning log

- Adding research and model multipliers made the economy snowball: `capK` 0.05 finished in 12 min.
- Model price ×1.5 → ×1.25 and `capK` 0.05 → 0.015 brought it back to 26 / 35 min.
- Rivals were retuned (exponents 1.5–1.8) so an optimal player overtakes the top lab only around minute 21;
  a relaxed player loses the race but still completes the era.
- Costs keep the spec's 1.12 growth; fuse cost growth 3.5 makes late-game power the binding constraint
  (greedy ends with compute throttled), which is the intended pressure for Era II's datacenter.
