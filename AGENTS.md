# asi-rush

Incremental/idle web game: 1986 alt-history labs race to build ASI in a growing datacenter. Live: https://ponzgpt.github.io/asi-rush/

## Commands

- Check (before every commit and deploy): `npm run check` (ESLint + Prettier, Vitest, tsc + vite build)
- Dev: `npm run dev` → http://localhost:5173/asi-rush/
- Balance sim: `npm run sim -- [hours] [trainShare] [clicksPerSec] [--timeline]`
- Deploy: push to `main` (GitHub Actions → GitHub Pages)

## Layout

- `src/sim/` pure deterministic sim (10 Hz, no DOM/clock/random); `src/data/` every economy constant
- `src/state/` signals store, loop and event bus (`events.ts`) that audio and scene listen to
- `src/ui/` Preact panels, overlays (boot, help, settings, victory), objectives, i18n (EN + ES)
- `src/scene/` Pixi 480×270 cutaway: procedural pixel painters, bloom; `src/audio/` WebAudio SFX + music
- `src/save/` lz-string base64 codec; docs in `docs/SPEC.md` and `docs/BALANCE.md`

## Non-negotiables

1. `src/sim` stays pure and runs in Node: the balance simulator and offline catch-up replay it headless.
2. No magic numbers in logic; constants live in `src/data` so balance passes only touch tables.
3. Every sim change ships a Vitest test; `balance.test.ts` guards pacing targets (first buy <10 s,
   first training <3 min, Era 1 in 20–40 min). Retune constants and update `docs/BALANCE.md` if it fails.
4. Imports use explicit `.ts` extensions so Node runs `scripts/` natively (no tsx/ts-node).
5. Save format is versioned (`SAVE.version`); bump it and migrate in `decode` when `State` changes shape.
6. Tone: sarcastic corporate humor. Rival labs are parodies of real ones (ClosedAI, Misanthropic, YAI,
   ShallowMind) by the owner's choice; never use real logos or real people's names.
7. All player-facing text goes through `t()` with both EN and ES entries (`es` is typed as complete).
8. No image or audio asset files: art is painted in `src/scene/sprites.ts`, sound synthesized in `src/audio/`,
   so everything stays original, tiny and license-free. `public/og.png` is a capture of the scene.
9. The game clock starts only after the briefing (`startLoop`), so rivals don't advance on a title screen.
10. Rivals are deterministic functions of time (`rivalCap`): the defeat condition must stay reproducible in tests.
