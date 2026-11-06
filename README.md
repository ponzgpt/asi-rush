# ASI RUSH

An incremental/idle web game. 1986, alternate history: rival labs race to build Artificial Superintelligence
out of garages and datacenters. Sarcastic corporate news, glowing amber terminals, questionable fuses.

**Play:** https://ponzgpt.github.io/asi-rush/

Status: M0 — Era 1 "Garage" playable (save/load, export/import, offline progress up to 24 h). See [docs/SPEC.md](docs/SPEC.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5173/asi-rush/
```

## Test

```bash
npm run check      # lint + prettier + vitest + typecheck + build (what CI runs)
npm test           # sim and balance tests only
```

## Simulate

```bash
npm run sim -- 4 0.5 5   # hours, training share, clicks/s → CSV of milestone times
```

Results and tuning notes: [docs/BALANCE.md](docs/BALANCE.md).

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: install → check → build → GitHub Pages.

## How this was made

I'm a vibe coder. I decide what to build, write the spec and the rules it has to follow, and test the result until it
does what I said. AI coding agents write the code; I don't write code by hand. Commits under my name were made by an
agent working for me.

## License

Code: [MIT](LICENSE).
