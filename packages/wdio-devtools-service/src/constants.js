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
