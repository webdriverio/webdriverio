import { STACKTRACE_FILTER_FN } from './constants'

/**
 * helper function that cleans up the stacktrace to remove all fibers and wdio-sync
 * execution entries
 */
export function sanitizeErrorMessage (e) {
    let stack = e.stack.split(/\n/g)
    let errorMsg = stack.shift()
    let cwd = process.cwd()

    /**
     * filter out stack traces to wdio-sync and fibers
     * and transform absolute path to relative
     */
    stack = stack.filter(STACKTRACE_FILTER_FN)
    stack = stack.map((e) => '    ' + e.replace(cwd + '/', '').trim())

    /**
     * error stack can be empty when test execution is aborted and
     * the application is not running
     */
    let errorLine = 'unknown error line'
    if (stack && stack.length) {
        errorLine = stack.shift().trim()
    }

    /**
     * correct error occurence
     */
    let lineToFix = stack[stack.length - 1]
    if (lineToFix && lineToFix.indexOf('index.js') > -1) {
        stack[stack.length - 1] = lineToFix.slice(0, lineToFix.indexOf('index.js')) + errorLine
    } else {
        stack.unshift('    ' + errorLine)
    }

    /**
     * add back error message
     */
    stack.unshift(errorMsg)

    return stack.join('\n')
}

/**
 * filter out arguments passed to specFn & hookFn, don't allow callbacks
 * as there is no need for user to call e.g. `done()`
 */
export function filterSpecArgs (args) {
    return args.filter((arg) => typeof arg !== 'function')
}
