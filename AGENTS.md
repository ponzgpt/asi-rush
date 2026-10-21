# asi-rush

Incremental/idle web game: 1986 alt-history labs race to build ASI in a growing datacenter. Live: https://ponzgpt.github.io/asi-rush/

## Commands

- Check (before every commit and deploy): `npm run check` (ESLint + Prettier, Vitest, tsc + vite build)
- Dev: `npm run dev` → http://localhost:5173/asi-rush/
- Balance sim: `npm run sim -- [hours] [trainShare] [clicksPerSec]`
- Deploy: push to `main` (GitHub Actions → GitHub Pages)

## Layout

- `src/sim/` pure deterministic sim (10 Hz, no DOM/clock/random); `src/data/` every economy constant
- `src/state/` signals store + loop; `src/ui/` Preact panels + i18n; `src/scene/` Pixi 480×270 cutaway
- `src/save/` lz-string base64 codec; docs in `docs/SPEC.md` and `docs/BALANCE.md`

## Non-negotiables

1. `src/sim` stays pure and runs in Node: the balance simulator and offline catch-up replay it headless.
2. No magic numbers in logic; constants live in `src/data` so balance passes only touch tables.
3. Every sim change ships a Vitest test; `balance.test.ts` guards pacing targets (first buy <10 s,
   first training <3 min, Era 1 in 20–40 min). Retune constants and update `docs/BALANCE.md` if it fails.
4. Imports use explicit `.ts` extensions so Node runs `scripts/` natively (no tsx/ts-node).
5. Save format is versioned (`SAVE.version`); bump it and migrate in `decode` when `State` changes shape.
6. Tone: sarcastic Fallout-style corporate humor, evoked not copied — no Vault Boy, Pip-Boy or real labs.
7. Game text in English via `t()`; Spanish lives in `src/ui/i18n.ts` and falls back to English.
