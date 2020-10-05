import { throttling } from 'lighthouse/lighthouse-core/config/constants'

/**
 * performance tracing categories
 */
export const DEFAULT_TRACING_CATEGORIES = [
    // Exclude default categories. We'll be selective to minimize trace size
    '-*',

    // Used instead of 'toplevel' in Chrome 71+
    'disabled-by-default-lighthouse',

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

    // Most the events we need come in on these two
    'devtools.timeline',
    'disabled-by-default-devtools.timeline',

    // Up to 450 (https://goo.gl/rBfhn4) JPGs added to the trace
    'disabled-by-default-devtools.screenshot',

    // This doesn't add its own events, but adds a `stackTrace` property to devtools.timeline events
    'disabled-by-default-devtools.timeline.stack',

    // Include screenshots for frame viewer
    'disabled-by-default-devtools.screenshot'
]

/**
 * ignored urls in request logger
 */
export const IGNORED_URLS = [
    'data:,', // empty pages
    'about:', // new tabs
    'chrome-extension://' // all chrome extensions
]

export const FRAME_LOAD_START_TIMEOUT = 2000
export const TRACING_TIMEOUT = 10000
export const CPU_IDLE_TRESHOLD = 10000
export const MAX_TRACE_WAIT_TIME = 45000
export const NETWORK_IDLE_TIMEOUT = 5000
export const DEFAULT_NETWORK_THROTTLING_STATE = 'Good 3G'
export const UNSUPPORTED_ERROR_MESSAGE = 'The @wdio/devtools-service currently only supports Chrome version 63 and up, and Chromium as the browserName!'

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
