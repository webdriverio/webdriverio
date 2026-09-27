/**
 * performance tracing categories
 */
export const DEFAULT_TRACING_CATEGORIES = [
    // Exclude default categories. We'll be selective to minimize trace size
    '-*',

    // Used instead of 'toplevel' in Chrome 71+
    'disabled-by-default-lighthouse',

    // Used for Cumulative Layout Shift metric
    'loading',

    // All compile/execute events are captured by parent events in devtools.timeline..
    // But the v8 category provides some nice context for only <0.5% of the trace size
    'v8',
    // Same situation here. This category is there for RunMicrotasks only, but with other teams
    // accidentally excluding microtasks, we don't want to assume a parent event will always exist
    'v8.execute',

    // For extracting UserTiming marks/measures
    'blink.user_timing',

    // Not mandatory but not used much
    'blink.console',

    // Most of the events we need are from these two categories
    'devtools.timeline',
    'disabled-by-default-devtools.timeline',

    // Up to 450 (https://goo.gl/rBfhn4) JPGs added to the trace
    'disabled-by-default-devtools.screenshot',

    // This doesn't add its own events, but adds a `stackTrace` property to devtools.timeline events
    'disabled-by-default-devtools.timeline.stack',

    // Additional categories used by DevTools. Not used by Lighthouse, but included to facilitate
    // loading traces from Lighthouse into the Performance panel.
    'disabled-by-default-devtools.timeline.frame',
    'latencyInfo',
]

/**
 * ignored urls in request logger
 */
export const IGNORED_URLS = [
    'data:,', // empty pages
    'about:', // new tabs
    'chrome-extension://' // all chrome extensions
] as const

export const FRAME_LOAD_START_TIMEOUT = 2000
export const DEFAULT_NETWORK_THROTTLING_STATE = 'online' as const
export const DEFAULT_FORM_FACTOR = 'desktop' as const
export const UNSUPPORTED_ERROR_MESSAGE = (
    'Can\'t connect to Chrome DevTools! The @wdio/lighthouse-service currently only supports Chrome and Chromium!\n\n' +
    'Given that cloud vendors don\'t expose access to the Chrome DevTools Protocol this service also usually only works when ' +
    'running tests locally or through a Selenium Grid (https://www.selenium.dev/documentation/grid/) v4 or higher.'
)

/**
 * Lighthouse throttling constants (core/config/constants.js).
 * Regular 3G uses `mobileRegular3G`, Good 3G uses `mobileSlow4G`.
 */
export const NETWORK_STATES = {
    offline: {
        offline: true,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0
    },
    GPRS: {
        offline: false,
        downloadThroughput: 50 * 1024 / 8,
        uploadThroughput: 20 * 1024 / 8,
        latency: 500
    },
    'Regular 2G': {
        offline: false,
        downloadThroughput: 250 * 1024 / 8,
        uploadThroughput: 50 * 1024 / 8,
        latency: 300
    },
    'Good 2G': {
        offline: false,
        downloadThroughput: 450 * 1024 / 8,
        uploadThroughput: 150 * 1024 / 8,
        latency: 150
    },
    'Regular 3G': {
        offline: false,
        latency: 300 * 3.75,
        downloadThroughput: Math.floor(700 * 1024 / 8),
        uploadThroughput: Math.floor(700 * 1024 / 8)
    },
    'Good 3G': {
        offline: false,
        latency: 150 * 3.75,
        downloadThroughput: Math.floor(1.6 * 1024 * 1024 / 8),
        uploadThroughput: Math.floor(750 * 1024 / 8)
    },
    'Regular 4G': {
        offline: false,
        downloadThroughput: 4 * 1024 * 1024 / 8,
        uploadThroughput: 3 * 1024 * 1024 / 8,
        latency: 20
    },
    'DSL': {
        offline: false,
        downloadThroughput: 2 * 1024 * 1024 / 8,
        uploadThroughput: 1 * 1024 * 1024 / 8,
        latency: 5
    },
    'Wifi': {
        offline: false,
        downloadThroughput: 30 * 1024 * 1024 / 8,
        uploadThroughput: 15 * 1024 * 1024 / 8,
        latency: 2
    },
    online: {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1
    }
}

export const CLICK_TRANSITION = 'click transition'
export const DEFAULT_THROTTLE_STATE = {
    networkThrottling: DEFAULT_NETWORK_THROTTLING_STATE as keyof typeof NETWORK_STATES,
    cpuThrottling: 0,
    cacheEnabled: false,
    formFactor: DEFAULT_FORM_FACTOR
} as const

export const NETWORK_RECORDER_EVENTS = [
    'Network.requestWillBeSent',
    'Network.requestServedFromCache',
    'Network.responseReceived',
    'Network.dataReceived',
    'Network.loadingFinished',
    'Network.loadingFailed',
    'Network.resourceChangedPriority'
] as const

/**
 * PWA checks preserved from the original Lighthouse PWA category.
 * Lighthouse 12+ removed that category, so the service implements these checks
 * with Chrome DevTools Protocol and page inspection.
 */
export const PWA_AUDIT_NAMES = [
    'isInstallable',
    'serviceWorker',
    'splashScreen',
    'themedOmnibox',
    'contentWith',
    'viewport',
    'appleTouchIcon',
    'maskableIcon'
] as const

export const TRACE_COMMANDS = ['click', 'navigateTo', 'url'] as const
