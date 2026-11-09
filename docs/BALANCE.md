# Balance

Targets: first purchase < 10 s · first training < 3 min · first milestone in 20–40 min · an expert and a typical player
reach superintelligence first; a passive player loses a round (the race is real). Guarded by
`src/sim/balance.test.ts`. Constants: `src/data/economy.ts`.

## Model player (`src/sim/greedy.ts`)

Clicks "Run benchmark" while clicking adds at least a quarter on top of idle income; buys click upgrades when
they cost under a quarter of its cash; advances to the next era as soon as a round closes; ships every model
and publishes every paper it can; then buys the option with the best FLOP/s per dollar (power upgrade included).

## Results (2026-11-09)

| Player                             | I Garage   | II Office  | III Loft   | IV Datacenter | V Frontier  | Outcome         |
| ---------------------------------- | ---------- | ---------- | ---------- | ------------- | ----------- | --------------- |
| Expert (5 clicks/s, 50% training)  | 23m32s     | 40m57s     | 55m45s     | 71m08s        | 89m24s      | wins            |
| Typical (3 clicks/s, 40%)          | 25m55s     | 43m56s     | 59m52s     | 75m58s        | 95m21s      | wins            |
| Relaxed (2 clicks/s, 30%)          | 28m53s     | 46m34s     | 63m33s     | 81m45s        | 102m17s     | wins            |
| Passive (1 click/s, 20%)           | —          | —          | —          | —             | —           | loses at 30m44s |
| **Fastest rival reaches the goal** | **30m45s** | **50m55s** | **69m00s** | **87m00s**    | **111m05s** |                 |

## Rivals

Rivals follow a reference curve (the typical player's log10 Capability by minute) at their own speed
(0.86–0.88) and only improve when they ship: each release jumps them to where their curve will be at the next
release. Different cadences (195–423 s) make them overtake each other ~66 times per game, and every slot leads at
some point. Parameters came from a search scoring: deadlines near 31/51/69/87/111 min, ≥3 lead changes per era, and the
typical player staying within ×2 of the leader. With head starts, rivals lead the first ~10 minutes.

## Tuning log

- Era II/III hardware and papers were scaled until the expert's eras last ~25–35 min each.
- P(doom) = x^1.5 / (1 + x^1.5), x = Capability / (400 · 5^alignment). Eleven alignment papers are spread over the
  five eras; skipping them costs up to 60% of revenue and can end the run at 99%.
- First paper costs $15 (teaches the mechanic); costs then rise monotonically to $800B.
