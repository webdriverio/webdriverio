import { STACK_START, STACKTRACE_FILTER } from './constants'

/**
 * filter stack array
 * @param {string} stackRow
 * @returns {boolean}
 */
export const stackTraceFilter = (stackRow: string) => {
    if (stackRow.match(STACK_START)) {
        return !STACKTRACE_FILTER.some(r => stackRow.includes(r))
    }
    return true
}

/**
 * Cleanup stack traces, merge and remove duplicates
 * @param {Error|*} commandError    Error object or anything else including undefined
 * @param {Error}   savedError      Error with root stack trace
 * @returns {Error}
 */
export function sanitizeErrorMessage (commandError: Error, savedError: Error) {
    let name, stack, message
    if (commandError instanceof Error) {
        ({ name, message, stack } = commandError)
    } else {
        name = 'Error'
        message = commandError
    }

    const err = new Error(message)
    err.name = name

    let stackArr = savedError.stack?.split('\n') || []

    /**
     * merge stack traces if `commandError` has stack trace
     */
    if (stack) {
        // remove duplicated error name from stack trace
        stack = stack.replace(`${err.name}: ${err.name}`, err.name)
        // remove first stack trace line from second stack trace
        stackArr[0] = '\n'
        // merge
        stackArr = [...stack.split('\n'), ...stackArr]
    }

    err.stack = stackArr
        // filter stack trace
        .filter(stackTraceFilter)
        // remove duplicates from stack traces
        .reduce((acc, currentValue) => {
            return acc.includes(currentValue) ? acc : `${acc}\n${currentValue}`
        }, '')
        .trim()

    return err
}
