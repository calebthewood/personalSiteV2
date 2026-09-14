// Race + course configuration, shared by the scene (fiber.tsx) and the
// onboarding overlay. Adding a race here is all it takes for it to appear
// everywhere: onboarding cards, the sidebar switcher, and the scene. Courses
// can be anywhere in the state: the basemap (dem-map.tsx) covers all of the
// islands.

// scene units per EPSG:3857 meter; a 200m cell -> 0.5 units
export const UNITS_PER_METER = 0.0025

export interface Course {
    /** [lat, lng] waypoints from start to finish; first/last become 2-buoy gates, middles are single turn buoys */
    waypoints: number[][]
    /** gate orientation, degrees clockwise from north (the axis the two gate buoys sit along) */
    startGateBearing: number
    finishGateBearing: number
    /** true meters between the two gate buoys */
    gateWidthM: number
}

/** a named camera starting point: viewing angles in degrees (azimuth 0 = looking
 * from +z, polar 0 = straight overhead). The camera rotates there and then
 * auto-fits the course buoys into frame. Two ways to adjust that framing:
 *  - `fit`: multiply the auto-fit zoom (0.75 = a quarter further out, 1.5 =
 *    closer) while keeping the course centered - the usual knob
 *  - `zoom` + `target`: pin the exact framing (copy both from the camera
 *    readout in the settings dialog); the target is a [lat, lng] on the sea
 *    surface. A `zoom` alone keeps the auto-fit center at that zoom.
 * Camera arrays are shared between races (DEFAULT_CAMERAS, WAIKIKI_CAMERAS):
 * give a race its own array to tune one race without touching the others. */
export interface CameraStart {
    name: string
    azimuth: number
    polar: number
    /** scale on the auto-fit zoom; ignored when zoom is given */
    fit?: number
    zoom?: number
    target?: [number, number]
}

const CAM_WEST: CameraStart = { name: 'West', azimuth: 63, polar: 37 }
const CAM_OVERVIEW: CameraStart = { name: 'Overview', azimuth: 63, polar: 0 }

const DEFAULT_CAMERAS: CameraStart[] = [
    CAM_WEST,
    { name: 'East', azimuth: -26.4, polar: 57.9, zoom: 200.1, target: [21.640531, -158.067649] },
    CAM_OVERVIEW,
]

// Aloha Salads runs further northeast, so its East close-up needs its own framing
const SALADS_CAMERAS: CameraStart[] = [
    CAM_WEST,
    { name: 'East', azimuth: -26.4, polar: 57.9, zoom: 200.1, target: [21.675930, -158.052917] },
    CAM_OVERVIEW,
]

// Waikiki courses run along the shore; no East pin, so every view auto-fits
// the course
const WAIKIKI_CAMERAS: CameraStart[] = [
    CAM_WEST,
    { name: 'East', azimuth: -26.4, polar: 57.9 },
    CAM_OVERVIEW,
]

// Duke's is a tight loop off the beach: the East close-up sits back a little
// so the shoreline stays in frame
const DUKES_CAMERAS: CameraStart[] = [
    CAM_WEST,
    { name: 'East', azimuth: -26.4, polar: 57.9, fit: 0.5 },
    CAM_OVERVIEW,
]

export interface Race {
    /** official race name */
    name: string
    /** url path segment: /projects/swim-map/<slug> */
    slug: string
    /** advertised course distance in miles */
    miles: number
    /** where it is, for the race cards */
    region: string
    course: Course
    /** seasons with fetched results (see scripts/fetch-results.mjs), ascending */
    years: number[]
    /** camera starting points; the first is applied when the race is selected */
    cameras: CameraStart[]
    /** [lat, lng] where the swimmer name label floats, tuned per race so it
     * never blocks the course */
    labelAnchor: [number, number]
}

// key order = display order in the onboarding cards and the sidebar switcher
export const RACES: Record<string, Race> = {
    salads: {
        name: 'Aloha Salads Summer Sprint',
        slug: 'aloha-salads',
        miles: 1,
        region: 'North Shore · Oahu',
        course: {
            waypoints: [[21.677206, -158.043134], [21.667252, -158.055197], [21.664855, -158.052759]],
            startGateBearing: 130, // TODO tune
            finishGateBearing: 40, // TODO tune
            gateWidthM: 140,
        },
        years: [2024, 2025, 2026],
        cameras: SALADS_CAMERAS,
        labelAnchor: [21.667193, -158.045354],
    },
    cholo: {
        name: "Cholo's Waimea Bay",
        slug: 'cholos',
        miles: 1.2,
        region: 'North Shore · Oahu',
        course: {
            waypoints: [[21.642307, -158.063374], [21.638309, -158.069800], [21.638786, -158.070811], [21.642400, -158.065785], [21.640304, -158.063918]],
            startGateBearing: 120, // TODO tune
            finishGateBearing: 30, // TODO tune
            gateWidthM: 120,
        },
        years: [2023, 2024, 2025, 2026],
        cameras: DEFAULT_CAMERAS,
        labelAnchor: [21.635984, -158.065193],
    },
    jaco: {
        name: "Jaco Rehab Chun's to Waimea",
        slug: 'chuns-to-waimea',
        miles: 1.6,
        region: 'North Shore · Oahu',
        course: {
            waypoints: [[21.625855, -158.085623], [21.640041, -158.069459], [21.641161, -158.064052]],
            startGateBearing: 140,
            finishGateBearing: 0,
            gateWidthM: 120,
        },
        years: [2023, 2024, 2025, 2026],
        cameras: DEFAULT_CAMERAS,
        labelAnchor: [21.630398, -158.065208],
    },
    challenge: {
        name: 'North Shore Challenge',
        slug: 'north-shore-challenge',
        miles: 2.3,
        region: 'North Shore · Oahu',
        course: {
            waypoints: [[21.66659, -158.052699], [21.655751, -158.064191], [21.643021, -158.067243], [21.640304, -158.063918]],
            startGateBearing: 140,
            finishGateBearing: 30,
            gateWidthM: 120,
        },
        years: [2023, 2024, 2025, 2026],
        cameras: DEFAULT_CAMERAS,
        labelAnchor: [21.645425, -158.061000],
    },
    dukes: {
        name: "Duke's Waikiki Ocean Mile Swim",
        slug: 'dukes',
        miles: 1,
        region: 'Waikiki · Oahu',
        course: {
            // TODO placeholder buoys off Waikiki, replace with real course data
            waypoints: [[21.275923, -157.828358], [21.2727908, -157.8310223] ,[21.2720902, -157.8271443],[21.275923, -157.828358]],
            startGateBearing: 100, // TODO tune
            finishGateBearing: 100, // TODO tune
            gateWidthM: 120,
        },
        years: [2023, 2024, 2025, 2026],
        cameras: DUKES_CAMERAS,
        labelAnchor: [21.267500, -157.827000], // TODO tune
    },
    roughwater: {
        name: 'Waikiki Rough Water Swim',
        slug: 'rough-water',
        miles: 2.4,
        region: 'Waikiki · Oahu',
        course: {
            // TODO placeholder buoys (Kaimana Beach -> Duke Kahanamoku Beach), replace with real course data
            waypoints: [[21.263253, -157.821863], [21.260748, -157.827290], [21.275509, -157.840660],[21.281329, -157.838253]],
            startGateBearing: 0, // TODO tune
            finishGateBearing: 120, // TODO tune
            gateWidthM: 90,
        },
        // 2023 and earlier were published outside RACE RESULT (see fetch-results.mjs)
        years: [2024, 2025, 2026],
        cameras: WAIKIKI_CAMERAS,
        labelAnchor: [21.263000, -157.831000], // TODO tune
    },
}

/** race key for a url slug (undefined when the slug is unknown) */
export const raceKeyForSlug = (slug: string | undefined) =>
    Object.keys(RACES).find(k => RACES[k].slug === slug)

/** url form of a camera starting point's name ("West" -> "west") */
export const viewSlug = (c: CameraStart) => c.name.toLowerCase().replace(/\s+/g, '-')

/** Swimmers are identified by season + bib ("2026-883"): bibs are reissued
 * every year, and keying on both lets one person race against their earlier
 * selves. This is also the form used in the url's `swimmers` param. */
export const swimmerId = (year: number, bib: string) => `${year}-${bib}`
export const parseSwimmerId = (id: string): { year: number, bib: string } | null => {
    const m = id.match(/^(\d{4})-(.+)$/)
    return m ? { year: Number(m[1]), bib: m[2] } : null
}

/** path of a season's results JSON in public/, RunSignup format
 * (headings + resultSet.results), written by scripts/fetch-results.mjs */
export const resultsUrl = (raceKey: string, year: number) => `/results/${raceKey}-${year}.json`

/** latest season with results, the default when a race is selected */
export const latestYear = (race: Race) => race.years[race.years.length - 1]

/** races on the calendar with no results yet: shown greyed-out in the
 * onboarding, absent from the sidebar switcher */
export const UPCOMING_RACES: { name: string, miles: number }[] = [
    // { name: 'North Shore Soap Factory North Shore Challenge', miles: 2.3 },
]

/** the featured swimmers spotlighted from the onboarding's Betty Ann Barnett page */
export const BETTY_SPOTLIGHT = {
    raceKey: 'cholo',
    year: 2026, // bibs are season-specific
    bibs: ['1003', '1147', '883'], // Knut (1st place), Betty, Caleb
    labelBib: '1147', // Betty gets the name tooltip
}
