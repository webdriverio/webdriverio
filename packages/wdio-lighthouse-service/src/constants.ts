import InstallableManifest from 'lighthouse/lighthouse-core/audits/installable-manifest.js'
import ServiceWorker from 'lighthouse/lighthouse-core/audits/service-worker.js'
import SplashScreen from 'lighthouse/lighthouse-core/audits/splash-screen.js'
import ThemedOmnibox from 'lighthouse/lighthouse-core/audits/themed-omnibox.js'
import ContentWidth from 'lighthouse/lighthouse-core/audits/content-width.js'
import Viewport from 'lighthouse/lighthouse-core/audits/viewport.js'
import AppleTouchIcon from 'lighthouse/lighthouse-core/audits/apple-touch-icon.js'
import MaskableIcon from 'lighthouse/lighthouse-core/audits/maskable-icon.js'

import { throttling } from 'lighthouse/lighthouse-core/config/constants.js'

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

    // Additional categories used by devtools. Not used by Lighthouse, but included to facilitate
    // loading traces from Lighthouse into the Performance panel.
    'disabled-by-default-devtools.timeline.frame',
    'latencyInfo',

    // CPU sampling profiler data only enabled for debugging purposes
    // 'disabled-by-default-v8.cpu_profiler',
    // 'disabled-by-default-v8.cpu_profiler.hires',
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
export const TRACING_TIMEOUT = 15000
export const MAX_TRACE_WAIT_TIME = 45000
export const DEFAULT_NETWORK_THROTTLING_STATE = 'online' as const
export const DEFAULT_FORM_FACTOR = 'desktop' as const
export const UNSUPPORTED_ERROR_MESSAGE = (
    'Can\'t connect to Chrome DevTools! The @wdio/lighthouse-service currently only supports Chrome and Chromium!\n\n' +
    'Given that cloud vendors don\'t expose access to the Chrome DevTools Protocol this service also usually only works when ' +
    'running tests locally or through a Selenium Grid (https://www.selenium.dev/documentation/grid/) v4 or higher.'
)

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
        latency: throttling.mobileRegular3G.requestLatencyMs,
        // DevTools expects throughput in bytes per second rather than kbps
        downloadThroughput: Math.floor(throttling.mobileRegular3G.downloadThroughputKbps * 1024 / 8),
        uploadThroughput: Math.floor(throttling.mobileRegular3G.uploadThroughputKbps * 1024 / 8)
    },
    'Good 3G': {
        offline: false,
        latency: throttling.mobileSlow4G.requestLatencyMs,
        // DevTools expects throughput in bytes per second rather than kbps
        downloadThroughput: Math.floor(throttling.mobileSlow4G.downloadThroughputKbps * 1024 / 8),
        uploadThroughput: Math.floor(throttling.mobileSlow4G.uploadThroughputKbps * 1024 / 8)
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

export const PWA_AUDITS = {
    isInstallable: InstallableManifest,
    serviceWorker: ServiceWorker,
    splashScreen: SplashScreen,
    themedOmnibox: ThemedOmnibox,
    contentWith: ContentWidth,
    viewport: Viewport,
    appleTouchIcon: AppleTouchIcon,
    maskableIcon: MaskableIcon
} as const
