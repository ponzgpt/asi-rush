# Balance

Targets: first purchase < 10 s · first training < 3 min · Series A in 20–40 min · an expert and a typical player
reach superintelligence first; a passive player loses a round (the race is real). Guarded by
`src/sim/balance.test.ts`. Constants: `src/data/economy.ts`.

## Model player (`src/sim/greedy.ts`)

Clicks "Run benchmark" while clicking adds at least a quarter on top of idle income; buys click upgrades when
they cost under a quarter of its cash; advances to the next era as soon as a round closes; ships every model
and publishes every paper it can; then buys the option with the best FLOP/s per dollar (power upgrade included).

## Results (2026-11-08)

| Player                             | Series A   | Series B   | Superintelligence | Outcome                      |
| ---------------------------------- | ---------- | ---------- | ----------------- | ---------------------------- |
| Expert (5 clicks/s, 50% training)  | 23m14s     | 51m28s     | 86m35s            | wins                         |
| Typical (3 clicks/s, 40%)          | 24m47s     | 54m37s     | 92m22s            | wins                         |
| Relaxed (2 clicks/s, 30%)          | 26m14s     | 57m54s     | 99m08s            | wins, narrowly               |
| Passive (1 click/s, 20%)           | —          | —          | —                 | loses the Series A at 26m46s |
| **Fastest rival reaches the goal** | **26m50s** | **59m10s** | **105m00s**       |                              |

## Rivals

Rivals follow a reference curve (the typical player's log10 Capability by minute) at their own speed
(0.83–0.87) and only improve when they ship: each release jumps them to where their curve will be at the next
release. Different cadences (177–446 s) make them overtake each other ~30 times per game, and every lab leads at
some point. Parameters came from a search scoring: deadlines near 30/64/105 min, ≥3 lead changes per era, and the
typical player staying within ×2 of the leader. With head starts, rivals lead the first ~10 minutes.

## Tuning log

- Era II/III hardware and papers were scaled until the expert's eras last ~25–35 min each.
- P(doom) = x^1.5 / (1 + x^1.5), x = Capability / (400 · 4^alignment). Eight alignment papers are spread over the
  three eras; skipping them costs up to 60% of revenue and can end the run at 99%.
- First paper costs $15 (teaches the mechanic); costs then rise monotonically to $800B.
