# ASI RUSH

An incremental game about the real race to AI, told as a clicker: from beige PCs in a garage, through the AI
winters, the dot-com boom, GPUs and transformers, to superintelligence. Four rival labs (parodies of the ones
that actually ran the race in each era) want to get there first.

**Play:** https://asi-rush.technoir.cloud (about 90 minutes for five eras; English and Spanish)

![ASI RUSH](public/og.png)

## What you do

1. **Run benchmarks** for your first dollars.
2. **Buy hardware** that follows history: beige PCs and workstations, black towers and 1U servers, RGB gaming
   rigs and GPU boxes, gold AI pods, rack-scale superchips. Plus a bigger power hookup when the lights dim.
3. **Split compute** between serving (cash) and training (Capability, with diminishing returns).
4. **Publish research** (backprop, RLHF, a leaked fax about attention) and **ship models** that charge more per token.
5. **Race the labs of each era** to five milestones: read handwritten digits (garage), beat the chess champion
   (dot-com office), beat a Go grandmaster (GPU loft), ship a chatbot to 100M users (datacenter), superintelligence
   (frontier). Lose a milestone to a rival and you replay the era; let P(doom) hit 99% and it's over.

Runs entirely in your browser: each visitor plays their own game, saved locally every 30 s. The game pauses
while the tab is closed or hidden, rivals included. Export/import from Settings.
Original pixel art and synthesized audio, no asset files. Space runs a benchmark. Spec: [docs/SPEC.md](docs/SPEC.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5173/
```

## Test

```bash
npm run check      # lint + prettier + vitest + typecheck + build (what CI runs)
npm test           # sim and balance tests only
```

## Simulate

```bash
npm run sim -- 4 0.5 5 --timeline   # hours, training share, clicks/s → CSV of milestones (+ per-minute timeline)
```

Results and tuning notes: [docs/BALANCE.md](docs/BALANCE.md).

## Deploy

`./scripts/deploy.sh` refuses a dirty tree, runs the check, builds an nginx image tagged with the commit on the VPS
and rolls it out as a Docker Swarm service behind Traefik at https://asi-rush.technoir.cloud. CI
(`.github/workflows/ci.yml`) runs the same check on every push. The old GitHub Pages address now serves only
`pages/index.html`, which forwards players to the new domain with their local save.

## How this was made

I'm a vibe coder. I decide what to build, write the spec and the rules it has to follow, and test the result until it
does what I said. AI coding agents write the code; I don't write code by hand. Commits under my name were made by an
agent working for me.

## License

Code: [MIT](LICENSE).
