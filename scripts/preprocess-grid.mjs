#!/usr/bin/env node
// Converts a grid GeoJSON (features with row/col/z properties) into a compact
// binary heightfield the app can fetch at runtime:
//   <out>.bin        Float32 elevations, row-major (row * nCols + col), NaN = no data
//   <out>.meta.json  grid dimensions + EPSG:3857 georeferencing
//
// Large files are streamed line-by-line (works because the GeoJSON has one
// feature per line), so this handles multi-hundred-MB inputs without blowing
// up memory.
//
// usage: node scripts/preprocess-grid.mjs <input.json> <output-basename>
//   e.g. node scripts/preprocess-grid.mjs src/assets/waimea-10m.json public/data/waimea-10m

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const [input, outBase] = process.argv.slice(2)
if (!input || !outBase) {
    console.error('usage: node scripts/preprocess-grid.mjs <input.json> <output-basename>')
    process.exit(1)
}

// cell center in EPSG:3857 meters, from bbox properties or geometry
function centerOf(feat) {
    const p = feat.properties
    if (p.left !== undefined) {
        return [(p.left + p.right) / 2, (p.top + p.bottom) / 2]
    }
    const g = feat.geometry
    const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates[0]
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const [x, y] of pts) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
    }
    return [(minX + maxX) / 2, (minY + maxY) / 2]
}

const rows = []
const cols = []
const zs = []
let maxRow = -Infinity, maxCol = -Infinity

// georeferencing samples at the grid extremes
let minColVal = Infinity, minColCX = 0
let maxColVal = -Infinity, maxColCX = 0
let minRowVal = Infinity, minRowCY = 0
let maxRowVal = -Infinity, maxRowCY = 0

function ingest(feat) {
    const p = feat.properties
    const [cx, cy] = centerOf(feat)
    rows.push(p.row)
    cols.push(p.col)
    zs.push(p.z ?? 0) // null elevation -> sea level, matches previous behavior
    if (p.row > maxRow) maxRow = p.row
    if (p.col > maxCol) maxCol = p.col
    if (p.col < minColVal) { minColVal = p.col; minColCX = cx }
    if (p.col > maxColVal) { maxColVal = p.col; maxColCX = cx }
    if (p.row < minRowVal) { minRowVal = p.row; minRowCY = cy }
    if (p.row > maxRowVal) { maxRowVal = p.row; maxRowCY = cy }
}

const sizeMB = fs.statSync(input).size / 1e6
if (sizeMB < 100) {
    const json = JSON.parse(fs.readFileSync(input, 'utf8'))
    for (const feat of json.features) ingest(feat)
} else {
    const rl = readline.createInterface({
        input: fs.createReadStream(input),
        crlfDelay: Infinity,
    })
    for await (const line of rl) {
        let t = line.trim()
        if (!t.startsWith('{') || !t.includes('"Feature"')) continue
        if (t.endsWith(',')) t = t.slice(0, -1)
        ingest(JSON.parse(t))
    }
}

if (rows.length === 0) {
    console.error('no features parsed — unexpected file format?')
    process.exit(1)
}

const nRows = maxRow + 1
const nCols = maxCol + 1

// meters per cell, derived from the extreme cell centers
const cellX = (maxColCX - minColCX) / (maxColVal - minColVal)
const cellY = (minRowCY - maxRowCY) / (maxRowVal - minRowVal) // rows go north -> south
const col0CenterX = minColCX - minColVal * cellX
const row0CenterY = minRowCY + minRowVal * cellY

const elev = new Float32Array(nRows * nCols).fill(NaN)
for (let i = 0; i < rows.length; i++) {
    elev[rows[i] * nCols + cols[i]] = zs[i]
}

const meta = {
    name: path.basename(outBase),
    crs: 'EPSG:3857',
    nRows,
    nCols,
    cellX,
    cellY,
    col0CenterX,
    row0CenterY,
    count: rows.length,
}

fs.mkdirSync(path.dirname(outBase), { recursive: true })
fs.writeFileSync(`${outBase}.bin`, Buffer.from(elev.buffer))
fs.writeFileSync(`${outBase}.meta.json`, JSON.stringify(meta, null, 2))

console.log(`${input} (${sizeMB.toFixed(0)}MB) -> ${outBase}.bin (${(elev.byteLength / 1e6).toFixed(1)}MB)`)
console.log(meta)
