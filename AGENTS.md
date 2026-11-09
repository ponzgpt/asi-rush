# asi-rush

Incremental/idle web game: the real AI race, five eras from a garage to superintelligence. Live: https://ponzgpt.github.io/asi-rush/

## Commands

- Check (before every commit and deploy): `npm run check` (ESLint + Prettier, Vitest, tsc + vite build)
- Dev: `npm run dev` → http://localhost:5173/asi-rush/
- Balance sim: `npm run sim -- [hours] [trainShare] [clicksPerSec] [--timeline]`
- Deploy: push to `main` (GitHub Actions → GitHub Pages)

## Layout

- `src/sim/` pure deterministic sim (10 Hz, no DOM/clock/random); `src/data/` every economy constant
- `src/state/` signals store, loop and event bus (`events.ts`) that audio and scene listen to
- `src/ui/` Preact panels, overlays (boot, help, settings, victory), objectives, i18n (EN + ES)
- `src/scene/` Pixi 480×270 rooms, one per era (`era1..5.ts` on `room.ts`), adventure-game art; `src/audio/` synth
- `src/save/` lz-string base64 codec; docs in `docs/SPEC.md` and `docs/BALANCE.md`

## Non-negotiables

1. `src/sim` stays pure and runs in Node: the balance simulator replays it headless.
2. No magic numbers in logic; constants live in `src/data` so balance passes only touch tables.
3. Every sim change ships a Vitest test; `balance.test.ts` guards pacing targets (first buy <10 s,
   first training <3 min, Era 1 in 20–40 min). Retune constants and update `docs/BALANCE.md` if it fails.
4. Imports use explicit `.ts` extensions so Node runs `scripts/` natively (no tsx/ts-node).
5. Save format is versioned (`SAVE.version`); bump it and migrate in `decode` when `State` changes shape.
6. Tone: sarcastic corporate humor. Rival labs and paper authors are parodies of real AI labs and scientists
   (ClosedAI, Hintern, LeCan…) by the owner's choice; never real logos or exact real names. Each era has its own
   roster, so the leaderboard follows history.
7. All player-facing text goes through `t()` with both EN and ES entries (`es` is typed as complete).
8. No image or audio asset files: art is painted in code and lit by `src/scene/paint.ts`; sound is synthesized.
   Hardware must look like its era and be shown 1:1 (one sprite per unit, no "+N"); resources live in the room
   as objects (`gauges.ts`), not as a HUD over it.
9. The game clock starts only after the briefing (`startLoop`), so rivals don't advance on a title screen.
10. Rivals are deterministic functions of time (`rivalCap`): the defeat condition must stay reproducible in tests.
11. Time only advances while the page is open and visible; never add offline catch-up for one side only.
