// Fetch swim race results and write them to public/results/<key>-<year>.json
// in the { headings, resultSet: { results } } shape the swim-map reads (see
// parseRacers in src/projects/swim-map/fiber.tsx). Two sources: the RunSignup
// API (North Shore Swim Series, Duke's) and published RACE RESULT lists
// (Waikiki Rough Water) — editions with an `rr` block use the latter.
//
// Usage:
//   npm run fetch-results                 # all races, latest year each
//   npm run fetch-results cholo           # one race, latest year
//   npm run fetch-results cholo 2024      # one race, one year
//   npm run fetch-results all all         # everything (initial backfill)
//
// Auth: RTG_API_KEY / RTG_API_SECRET in .env (api_key + api_secret query params).
// RunSignup allows at most 2 concurrent API calls; we fetch sequentially.
//
// Each season is a separate RunSignup race, so every year has its own
// raceId/eventId/resultSetId triple. To add a new season, discover the ids with:
//   /rest/races?name=<race name>&start_date=<jan 1 of year>&end_date=<dec 31>
//   /rest/race/:race_id?events=T                      -> event_id
//   /rest/race/:race_id/results/get-result-sets?event_id=... -> result_set_id
// then add the year here AND to the race's `years` list in
// src/projects/swim-map/races.ts.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// keys match src/projects/swim-map/races.ts
const EDITIONS = {
    salads: {
        2024: { raceId: 166305, eventId: 862551, resultSetId: 464486 },
        2025: { raceId: 186074, eventId: 1014118, resultSetId: 558780 },
        2026: { raceId: 209294, eventId: 1172546, resultSetId: 661955 },
    },
    cholo: {
        2023: { raceId: 149376, eventId: 737893, resultSetId: 389245 },
        2024: { raceId: 166918, eventId: 867100, resultSetId: 467791 },
        2025: { raceId: 186735, eventId: 1019366, resultSetId: 562397 },
        2026: { raceId: 210027, eventId: 1177785, resultSetId: 665534 },
    },
    jaco: {
        2023: { raceId: 149931, eventId: 741679, resultSetId: 391857 },
        2024: { raceId: 167418, eventId: 870863, resultSetId: 471046 },
        2025: { raceId: 187413, eventId: 1024088, resultSetId: 565444 },
        2026: { raceId: 210945, eventId: 1183615, resultSetId: 669558 },
    },
    challenge: {
        2023: { raceId: 150691, eventId: 746707, resultSetId: 393962 },
        2024: { raceId: 168068, eventId: 875698, resultSetId: 473736 },
        2025: { raceId: 188048, eventId: 1029482, resultSetId: 569145 },
        2026: { raceId: 211743, eventId: 1189288, resultSetId: 673373 },
    },
    dukes: {
        2023: { raceId: 152375, eventId: 758250, resultSetId: 400950 },
        2024: { raceId: 169786, eventId: 889816, resultSetId: 482207 },
        2025: { raceId: 189880, eventId: 1041916, resultSetId: 576832 },
        2026: { raceId: 209567, eventId: 1174473, resultSetId: 681717 },
    },
    // Waikiki Rough Water is not on RunSignup; it publishes through RACE RESULT.
    // `key` is the event's public Simple API list key, copied from the published
    // results URL (my-us-1.raceresult.com/<eventId>/results/list?key=...); no
    // account credentials involved. contest 1 = the main "Swim (NO FINS)" wave
    // (contest 2 is the small w/ FINS wave, ranked separately, not fetched).
    roughwater: {
        2025: { rr: { server: 'my-us-1', eventId: 352413, key: 'f0fb595e8607e6dee42dd4dcadd83557', contest: 1 } },
        2026: { rr: { server: 'my-us-1', eventId: 414181, key: 'dd5ecd05512526adb813332a7c7a48cb', contest: 1 } },
    },
}

function loadEnv() {
    for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
}

async function apiGet(path, params) {
    const url = new URL(`https://api.runsignup.com/rest/${path}`)
    url.search = new URLSearchParams({
        format: 'json',
        api_key: process.env.RTG_API_KEY,
        api_secret: process.env.RTG_API_SECRET,
        ...params,
    })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
    const json = await res.json()
    if (json.error) throw new Error(`API error for ${path}: ${JSON.stringify(json.error)}`)
    return json
}

const PER_PAGE = 1000

async function fetchAllResults({ raceId, eventId, resultSetId }) {
    let headers = null
    const rows = []
    for (let page = 1; ; page++) {
        const json = await apiGet(`race/${raceId}/results/get-results`, {
            event_id: eventId,
            individual_result_set_id: resultSetId,
            page,
            results_per_page: PER_PAGE,
        })
        const set = json.individual_results_sets?.[0]
        if (!set) throw new Error(`no result set in response for race ${raceId}`)
        headers ??= set.results_headers
        rows.push(...set.results)
        if (set.results.length < PER_PAGE) break
    }
    return { headers, rows }
}

/** division columns come as sparse "division-<id>-placement" fields whose
 * display name (e.g. "M Open", "Male 30 to 34") lives in results_headers;
 * the swimmer's division is the first non-null one, skipping the catch-all
 * "All Male"/"All Female" aggregates */
function pickDivision(row, headers) {
    for (const key of Object.keys(headers)) {
        if (!/^division-\d+-placement$/.test(key)) continue
        const name = headers[key]
        if (name === 'All Male' || name === 'All Female') continue
        if (row[key] != null) return { division: name, divisionPlace: row[key] }
    }
    return { division: '', divisionPlace: '' }
}

const HEADINGS = [
    { key: 'race_placement', name: 'Place' },
    { key: 'bib_num', name: 'Bib' },
    { key: 'name', name: 'Name' },
    { key: 'gender', name: 'Gender' },
    { key: 'city', name: 'City' },
    { key: 'state', name: 'State' },
    { key: 'countrycode', name: 'Country' },
    { key: 'clock_time', name: 'Clock Time' },
    { key: 'chip_time', name: 'Chip Time' },
    { key: 'avg_pace', name: 'Pace' },
    { key: 'age', name: 'Age' },
    { key: 'division_place', name: 'Division Place' },
    { key: 'division', name: 'Division' },
]

// ---- RACE RESULT (Simple API list) source ----

/** fetch a published RACE RESULT list and convert it to the same
 * { headings, resultSet } shape; rows are positional arrays whose column
 * meaning is defined by DataFields (names vary slightly per event, so columns
 * are found by keyword) */
async function fetchRaceResult({ server, eventId, key, contest }) {
    const url = new URL(`https://${server}.raceresult.com/${eventId}/results/list`)
    url.search = new URLSearchParams({
        key,
        listname: 'Online|Final Results',
        page: 'results',
        contest,
        r: 'all',
        l: 0,
    })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} for RACE RESULT event ${eventId}`)
    const file = await res.json()

    const field = needle => file.DataFields.findIndex(f => f.toUpperCase().includes(needle))
    const iBib = field('BIB')
    const iRank = field('AUTORANK')
    const iName = field('DISPLAYNAME')
    const iFlag = field('COUNTRY')
    const iDivision = field('AGEGROUP')
    const iDivRank = file.DataFields.findIndex(f => /RANK/i.test(f) && !/AUTORANK/i.test(f))
    const iTime = field('FINISH')

    const results = []
    for (const rows of Object.values(file.data)) {
        for (const row of rows) {
            // rank "1." -> 1; DNF/DSQ rows carry status text here instead (and
            // sometimes a pulled-from-water time), so drop non-finishers
            const place = parseInt(row[iRank] ?? '', 10)
            if (Number.isNaN(place)) continue
            // "Kupsky, Woobie" -> "Woobie Kupsky"
            const raw = row[iName] ?? ''
            const comma = raw.indexOf(',')
            const name = comma >= 0
                ? `${raw.slice(comma + 1).trim()} ${raw.slice(0, comma).trim()}`
                : raw
            const division = row[iDivision] ?? ''
            results.push([
                place,
                String(row[iBib] ?? ''),
                name,
                division.startsWith('Male') ? 'M' : division.startsWith('Female') ? 'F' : '',
                '', // city
                '', // state
                // "[img:/graphics/flags/US.svg]" -> "US"
                (row[iFlag] ?? '').match(/flags\/(\w+)\.svg/)?.[1] ?? '',
                row[iTime] ?? '', // clock_time (gun; RACE RESULT lists publish no chip time)
                row[iTime] ?? '', // chip_time
                '', // pace
                '', // age
                String(iDivRank >= 0 ? row[iDivRank] ?? '' : ''),
                division,
            ])
        }
    }
    return { headings: HEADINGS, resultSet: { results } }
}

function toResultsFile({ headers, rows }) {
    const results = rows.map(r => {
        const { division, divisionPlace } = pickDivision(r, headers)
        return [
            r.place,
            String(r.bib ?? ''),
            [r.first_name, r.last_name].filter(Boolean).join(' '),
            r.gender ?? '',
            r.city ?? '',
            r.state ?? '',
            r.country_code ?? '',
            r.clock_time ?? '',
            r.chip_time ?? '',
            r.pace ?? '',
            r.age ?? '',
            String(divisionPlace),
            division,
        ]
    })
    return { headings: HEADINGS, resultSet: { results } }
}

async function main() {
    loadEnv()
    const [raceArg = 'all', yearArg = 'latest'] = process.argv.slice(2)
    const keys = raceArg === 'all' ? Object.keys(EDITIONS) : [raceArg]
    const targets = []
    for (const key of keys) {
        const editions = EDITIONS[key]
        if (!editions) {
            console.error(`unknown race key "${key}" — expected one of: ${Object.keys(EDITIONS).join(', ')}, all`)
            process.exit(1)
        }
        const years = Object.keys(editions).map(Number).sort((a, b) => a - b)
        const wanted = yearArg === 'all' ? years
            : yearArg === 'latest' ? [years[years.length - 1]]
                : [Number(yearArg)]
        for (const year of wanted) {
            if (!editions[year]) {
                console.error(`no ${year} edition for "${key}" — have: ${years.join(', ')}`)
                process.exit(1)
            }
            targets.push({ key, year, ...editions[year] })
        }
    }
    if (targets.some(t => !t.rr) && (!process.env.RTG_API_KEY || !process.env.RTG_API_SECRET)) {
        console.error('missing RTG_API_KEY / RTG_API_SECRET in .env')
        process.exit(1)
    }
    mkdirSync(resolve(root, 'public/results'), { recursive: true })
    for (const t of targets) {
        const file = t.rr ? await fetchRaceResult(t.rr) : toResultsFile(await fetchAllResults(t))
        const out = `results/${t.key}-${t.year}.json`
        writeFileSync(resolve(root, 'public', out), JSON.stringify(file))
        console.log(`${t.key} ${t.year}: ${file.resultSet.results.length} results -> public/${out}`)
    }
}

main().catch(err => { console.error(err.message); process.exit(1) })
