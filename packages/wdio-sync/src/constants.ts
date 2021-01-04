export const STACK_START = /^\s+at /

export const STACKTRACE_FILTER = [
    // exclude @wdio/sync from stack traces
    'node_modules/@wdio/sync/',

    // exclude webdriverio and webdriver stack traces
    'node_modules/webdriverio/build/',
    'node_modules/webdriver/build/',

    // exclude request
    'node_modules/request/request',

    // exclude EventEmitter
    ' (events.js:',
    ' (domain.js:',

    // other excludes
    '(internal/process/next_tick.js',
    'new Promise (<anonymous>)',
    'Generator.next (<anonymous>)',
    '__awaiter ('
] as const
