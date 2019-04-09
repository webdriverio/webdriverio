const STACK_START = /^\s+at /

const STACKTRACE_FILTER = [
    // exclude @wdio/sync from stack traces
    'node_modules/@wdio/sync/',

    // exclude webdriverio stack traces
    'node_modules/webdriverio/build/',

    // exclude Request emit
    ' (events.js:',
    ' (domain.js:',

    // other excludes
    '(internal/process/next_tick.js',
    'new Promise (<anonymous>)',
    'Generator.next (<anonymous>)',
    '__awaiter ('
]

/**
 * filter stack array
 * @param {string} stackRow
 * @returns {boolean}
 */
export const STACKTRACE_FILTER_FN = (stackRow) => {
    if (stackRow.match(STACK_START)) {
        return !STACKTRACE_FILTER.some(r => stackRow.includes(r))
    }
    return true
}
