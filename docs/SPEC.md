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
| `src/data`            | All economy constants (buildings, research, models, rivals, milestones) and newswire lines         |
| `src/state`           | Signals store wrapping the sim; game loop, narration (log, headlines), event bus, autosave         |
| `src/ui`              | Preact: header goal bar, stats, objectives, benchmark key, allocation, tabs, log, overlays; i18n   |
| `src/scene`           | Pixi at 480×270: procedural pixel-art painters, garage cutaway, bloom, CRT scanlines in CSS        |
| `src/audio`           | WebAudio: synthesized SFX per game event, room tone, 4-layer generative synth score                |
| `src/save`            | Versioned JSON → lz-string base64; autosave 30 s; offline catch-up ≤ 24 h in 60 s steps            |
| `scripts/simulate.ts` | Headless greedy player; milestone CSV and per-minute timeline                                      |

## Era I — "The Garage" (shipped)

- **Resources:** Runway (cash), Compute (FLOP/s), Power (kW vs. fuse cap), Capability, P(doom).
- **Hardware**, cost `C0 · 1.12^n`, buy ×1/×10/Max: Home PC, Accelerator Card, Server Rack. Revealed progressively.
- **Power:** demand > cap ⇒ compute × cap/demand (throttle, never off). "Bigger Fuse" (repeatable) doubles the cap.
- **Allocation slider:** serving → cash; training → `dCap/s = k · capMult · (trainFLOPs/flopRef)^0.35`.
- **Research** (9 one-time papers, unlocked by Capability): multipliers on training, revenue, compute, power draw,
  plus alignment. Names nod to real history and industry vocabulary (backprop 1986, scraping, RLHF, scaling laws).
- **Models** (5 releases): ship when Capability allows; each raises price per token and pays launch hype.
- **Rivals** (4 fictional labs) on a display-only leaderboard: `cap(t) = start + 1000 · (t/goal)^exp`.
- **Risk:** `Risk = Cap^1.5 / (1 + alignment)`, shown as `P(doom) = risk / (risk + 5000)`.
- **Layout:** full-viewport command deck on desktop (resources + live leaderboard + log | scene + benchmark +
  allocation | release, research, hardware), two columns on tablets, one on phones. No tabs: every action is visible.
- **Onboarding:** BIOS boot, briefing with the loop in four steps, lab naming, 9 guided objectives with coach marks
  (a ring and bubble on the control each objective needs; skippable), help/glossary.
- **Allocation:** each side shows its rate and what it buys; presets (make money / balanced / get smarter) and the ETA
  to the next model release.
- **Leaderboard:** always visible, rows slide when labs overtake each other, gap to every rival.
- **Feedback:** per-event SFX, a six-section synth score (~90 s per pass, 4 seeded melody variants) whose layers build with Capability, scene reacts (screens, LEDs, sparks,
  neighbours' lights dim on overload, whiteboard plots your scaling curve), lab log, newswire with event headlines.
- **Goal:** Capability ≥ 1000 → "Series A closed" with stats and a share-to-X card.

## Roadmap

- **M0** Era 1 playable prototype, save/load, offline, deployed. ✅
- **M0.5** Overhaul: art, audio, onboarding, research, models, rivals, share card. ✅
- **M0.6** Full-screen layout, tutorial coach marks, live leaderboard, allocation clarity, long-form music. ✅
- **M1** Simulator + balance: richer strategies, timeline CSV, pacing curves, tuning across Eras 1–2.
- **M2** Vertical slice with art and audio (Eras 1–2): bitmap fonts, CRT filter, sprites, synth score.
- **M3** Rivals (4 fictional labs) + "Pivot" prestige.
- **M4** Eras 3–5 and 4 endings.
- **M5** Polish, mobile, Steam via Tauri.
