# calebwood — personal site

Personal portfolio (neo-brutalist) merged with interactive projects. Vite + React + TypeScript + Tailwind.

## Pages

- `/` — home
- `/projects` — project cards
  - `/projects/swim-map` — **Open Water Replay**: a 3D voxel map of the Hawaiian islands replaying real open water races (react-three-fiber; keeps its own dark UI)
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

The swim map's terrain is a state-wide Hawaii DEM tile pyramid (`src/projects/swim-map/dem-map.tsx`): 256×256 GeoTIFF tiles at 20/40/80/160 m (sparse, near shore) and 320/640/1280 m (gapless), plus land-cover attribute tiles on the same grid. The pyramid lives in `data/hi_dem/{tiles,attrs}` (gitignored, ~1.4 GB; see `data/hi_dem/handoff.md` for the format). In dev the vite middleware serves it at `/tiles/*` and `/attrs/*`.

In production the pyramid is served by nginx from the same box as the site: copy `data/hi_dem/` to `/var/www/hi_dem/` on the server and include `deploy/nginx-dem-tiles.conf` in the site's `server` block (it maps `/tiles/` and `/attrs/` onto that folder). To host the tiles somewhere else instead, set `VITE_DEM_BASE` at build time (e.g. `https://cdn.example.com/hi_dem`) and enable CORS there.

The map's state lives in the url, so views are shareable: `/projects/swim-map/<race slug>?year=2025&view=east&swimmers=2026-883,2025-883`. Race slugs come from `races.ts`; `view` is a lowercased camera preset name; swimmers are `year-bib` pairs, so one person can race against their earlier seasons. Defaults (latest season, first view, no swimmers) are left out of the query.

Race results in `public/results/<race>-<year>.json` come from `bun run fetch-results` (RunSignup API + RACE RESULT, see `scripts/fetch-results.mjs`); courses, camera presets and label anchors live in `src/projects/swim-map/races.ts`. Courses can be anywhere in the state.
