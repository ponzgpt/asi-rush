# ASI RUSH — Spec

## Premise

Incremental/idle web game. Alternate 1986: rival labs build datacenters racing to Artificial Superintelligence.
Sarcastic corporate humor in a Fallout-ish register (evoked, never copied: no Vault Boy, Pip-Boy, or real labs).
80s pixel art, CRT look, John Carpenter-style synth score (later). Main view: side cutaway of a growing datacenter.

## Stack

Vite + TypeScript (strict) · PixiJS v8 (scene) · Preact + @preact/signals (DOM UI) · break_eternity.js (numbers)
· lz-string (saves) · Vitest · ESLint + Prettier · GitHub Pages via Actions.

## Architecture

| Dir                   | Role                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/sim`             | Pure deterministic sim, fixed 10 Hz tick, `apply(state, action)` / `tick(state, dt)`; runs in Node    |
| `src/data`            | All economy constants (buildings, research, models, rivals, milestones) and newswire lines            |
| `src/state`           | Signals store wrapping the sim; game loop, narration (log, headlines), event bus, autosave            |
| `src/ui`              | Preact: header goal bar, stats, objectives, benchmark key, allocation, tabs, log, overlays; i18n      |
| `src/scene`           | Pixi at 480×270: procedural pixel-art painters, garage cutaway, bloom, CRT scanlines in CSS           |
| `src/audio`           | WebAudio: synthesized SFX per game event, room tone, 4-layer generative synth score                   |
| `src/save`            | Versioned JSON → lz-string base64; autosave 30 s; no catch-up: the game pauses while closed or hidden |
| `scripts/simulate.ts` | Headless greedy player; milestone CSV and per-minute timeline                                         |

## Game (shipped)

- **Eras and rounds:** Era I Garage → Series A (1,000 Capability), Era II Warehouse → Series B (100,000),
  Era III Campus → Superintelligence (10,000,000). Each era is a new scene, new hardware and a bigger grid
  connection (power upgrades: Bigger Fuse, Substation, Power Plant). Old hardware keeps working.
- **Winning and losing:** close each round before every rival. If the leading rival reaches the goal first the
  round is lost (retry the era from its start). If P(doom) reaches 99% the game is over. The header shows the
  fastest rival's ETA and yours.
- **Resources:** Runway (cash), Compute (FLOP/s), Power (vs. site cap), Capability, P(doom).
- **Hardware** (cost `C0 · 1.12^n`, buy ×1/×10/Max): Home PC, Accelerator Card, Server Rack · Vector Supercomputer,
  Hypercube Array · Wafer-Scale Engine, Data Hall. Over the power cap, compute throttles (never stops).
- **Allocation:** serving → cash; training → `dCap/s = k · capMult · (trainFLOPs/flopRef)^0.35`; presets and the ETA
  to the next release make the trade-off explicit.
- **Benchmark key:** clicks pay cash; 7 upgrades (cherry-picked examples … benchmark saturation) multiply it and
  add a share of revenue per click, so clicking stays useful all game.
- **Research:** 22 one-time papers across the eras. The first costs $15; later ones cost more and multiply more.
  Eight are alignment papers.
- **P(doom):** `x^1.5 / (1 + x^1.5)`, `x = Capability / (400 · 4^alignment)`. Revenue × (1 − 0.6 · P(doom)).
- **Models:** 13 releases; each raises price per token and pays launch hype.
- **Rivals:** ClosedAI, Misanthropic, YAI, ShallowMind (parodies). Stepped curves, ~30 lead changes per game,
  release headlines on the newswire.
- **Layout:** hero bar (title, lab name, ☰ menu with music, sound, fullscreen, help, settings) · NYSE-style
  newswire (headlines plus live lab "quotes": capability and 5-minute change) · left: leaderboard and log ·
  centre: the round strip (era, round, progress with the leader's marker, rival and player ETAs, game clock) above
  the lab, with resources and P(doom) as an in-scene HUD · right: release, research and hardware (each scrolls on
  its own), then the benchmark key, its upgrade and the allocation. The scene grows extra sky and ground to fill
  tall frames.
- **Tutorial:** 9 objectives with coach marks until the Series A, then one-off tips (papers, click upgrades,
  P(doom), deadlines, each new era). Help has a "winning and losing" section and a glossary.
- **Audio:** per-event SFX, room tone and five original synth tracks that rotate every two passes, with era
  playlists, seeded melody variations and layers that build with progress.

## Roadmap

- **M0** Era 1 playable prototype, save/load, offline, deployed. ✅
- **M0.5** Overhaul: art, audio, onboarding, research, models, rivals, share card. ✅
- **M0.6** Full-screen layout, tutorial coach marks, live leaderboard, allocation clarity, long-form music. ✅
- **Pause rule:** game time only advances while the tab is open and visible. Closing or hiding it pauses everything,
  rivals included, so nobody comes back to a round lost while away.
- **Title screen:** full-screen title over a still of the garage, music from the first key or click (and real
  fullscreen on desktop), then the BIOS boot and the briefing.
- **M0.7** Eras II–III with scenes, funding rounds, defeat conditions, P(doom) mechanic, click upgrades, parody
  rivals that trade the lead, contextual tips, five-track soundtrack. ✅
- **M1** Simulator + balance: richer strategies, timeline CSV, pacing curves, tuning across Eras 1–2.
- **M2** Vertical slice with art and audio (Eras 1–2): bitmap fonts, CRT filter, sprites, synth score.
- **M3** Rivals (4 fictional labs) + "Pivot" prestige.
- **M4** Eras 3–5 and 4 endings.
- **M5** Polish, mobile, Steam via Tauri.
