// Race + course configuration, shared by the scene (fiber.tsx) and the
// onboarding overlay. Adding a race here is all it takes for it to appear
// everywhere: onboarding cards, the sidebar switcher, and the scene.

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
 * from +z, polar 0 = straight overhead); the camera rotates there and then
 * auto-fits the course buoys into frame, unless an explicit zoom + target
 * (copied from the on-screen readout) pins the exact framing */
export interface CameraStart {
    name: string
    azimuth: number
    polar: number
    zoom?: number
    target?: [number, number, number]
}

const CAM_WEST: CameraStart = { name: 'West', azimuth: 63, polar: 37 } // matches the old [20,30,10] default
const CAM_OVERVIEW: CameraStart = { name: 'Overview', azimuth: 63, polar: 0 }

const DEFAULT_CAMERAS: CameraStart[] = [
    CAM_WEST,
    { name: 'East', azimuth: -26.4, polar: 57.9, zoom: 200.1, target: [2.6, 4.5, 2.0] },
    CAM_OVERVIEW,
]

// Aloha Salads runs further northeast, so its East close-up needs its own framing
const SALADS_CAMERAS: CameraStart[] = [
    CAM_WEST,
    { name: 'East', azimuth: -26.4, polar: 57.9, zoom: 200.1, target: [-8.0, 5.1, -2.1] },
    CAM_OVERVIEW,
]

export interface Race {
    /** official race name */
    name: string
    /** advertised course distance in miles */
    miles: number
    course: Course
    /** results JSON in public/, RunSignup format (headings + resultSet.results) */
    resultsUrl: string
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
        miles: 1,
        course: {
            waypoints: [[21.677206, -158.043134],[21.667252, -158.055197],[21.664855, -158.052759]],
            startGateBearing: 130, // TODO tune
            finishGateBearing: 40, // TODO tune
            gateWidthM: 140,
        },
        resultsUrl: '/results-alohasalads.json',
        cameras: SALADS_CAMERAS,
        labelAnchor: [21.667193, -158.045354],
    },
    cholo: {
        name: "Cholo's Waimea Bay",
        miles: 1.2,
        course: {
            waypoints: [[21.642307, -158.063374], [21.638309, -158.069800], [21.638786, -158.070811], [21.642400, -158.065785], [21.640304, -158.063918]],
            startGateBearing: 120, // TODO tune
            finishGateBearing: 30, // TODO tune
            gateWidthM: 120,
        },
        resultsUrl: '/results-choloswaimea.json',
        cameras: DEFAULT_CAMERAS,
        labelAnchor: [21.635984, -158.065193],
    },
    jaco: {
        name: "Jaco Rehab Chun's to Waimea",
        miles: 1.6,
        course: {
            waypoints: [[21.625855, -158.085623], [21.640041, -158.069459], [21.641161, -158.064052]],
            startGateBearing: 140,
            finishGateBearing: 0,
            gateWidthM: 120,
        },
        resultsUrl: '/results-chuns2waimea.json',
        cameras: DEFAULT_CAMERAS,
        labelAnchor: [21.630398, -158.065208],
    },
        challenge: {
        name: "North Shore Challenge",
        miles: 2.3,
        course: {
            waypoints: [[21.66659, -158.052699], [21.655751, -158.064191], [21.643021, -158.067243],[21.640304, -158.063918]],
            startGateBearing: 140,
            finishGateBearing: 30,
            gateWidthM: 120,
        },
        resultsUrl: '/results-northshorechallenge.json',
        cameras: DEFAULT_CAMERAS,
        labelAnchor: [21.645425, -158.061000],
    },
}

/** races on the calendar with no results yet: shown greyed-out in the
 * onboarding, absent from the sidebar switcher */
export const UPCOMING_RACES: { name: string, miles: number }[] = [
    // { name: 'North Shore Soap Factory North Shore Challenge', miles: 2.3 },
]

/** the featured swimmers spotlighted from the onboarding's Betty Ann Barnett page */
export const BETTY_SPOTLIGHT = {
    raceKey: 'cholo',
    bibs: ['1003', '1147', '883'], // Knut (1st place), Betty, Caleb
    labelBib: '1147', // Betty gets the name tooltip
}
