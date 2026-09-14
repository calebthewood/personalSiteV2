import react from '@vitejs/plugin-react-swc'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'

// The Hawaii DEM tile pyramid (~1.4GB of GeoTIFF tiles + land-cover attribute
// tiles) under data/hi_dem is gitignored and must stay out of public/ (vite
// copies public into dist on build). This dev-only middleware serves it at
// /tiles/* and /attrs/*, the same layout the swim map expects from
// VITE_DEM_BASE in production.
const DEM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data/hi_dem')

function serveDemTiles(): Plugin {
  const mount = (server: ViteDevServer, route: string, dir: string) => {
    server.middlewares.use(route, (req, res, next) => {
      const rel = decodeURIComponent((req.url ?? '').split('?')[0])
      const file = path.join(dir, rel)
      if (!file.startsWith(dir + path.sep)) return next()
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.statusCode = 404
        res.end('not found')
        return
      }
      res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'image/tiff')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      createReadStream(file).pipe(res)
    })
  }
  return {
    name: 'serve-dem-tiles',
    configureServer(server) {
      mount(server, '/tiles', path.join(DEM_DIR, 'tiles'))
      mount(server, '/attrs', path.join(DEM_DIR, 'attrs'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveDemTiles()],
  json: {
    stringify: false
  }
})
