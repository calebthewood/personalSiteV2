# calebwood — personal site

Personal portfolio (neo-brutalist) merged with interactive projects. Vite + React + TypeScript + Tailwind.

## Pages

- `/` — home
- `/projects` — project cards
  - `/projects/swim-map` — **Open Water Replay**: a 3D voxel map of Waimea Bay replaying real North Shore Swim Series races (react-three-fiber; keeps its own dark UI)
  - `/projects/whittle` — wordle-assist word filter
  - `/projects/game-of-life` — Conway's Game of Life
  - `/projects/aegean-calculator` — Linear-B numeral calculator
- `/portfolio` — UHERO dashboard links
- `/contact`

## Develop

```sh
bun install
bun run dev      # dev server
bun run build    # typecheck + production build
bun run lint
```

## Voxel map data

The map loads compact binary heightfields from `public/data/` (`*.bin` + `*.meta.json`). These are generated from raw grid GeoJSON (kept locally in `src/assets/`, gitignored — multi-GB) via:

```sh
bun run preprocess
```

Race results in `public/results-*.json` are RunSignup exports; courses and camera presets live in `src/projects/swim-map/races.ts`.
