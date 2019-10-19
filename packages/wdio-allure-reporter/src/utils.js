import process from 'process'
import CompoundError from './compoundError'
import { testStatuses, mochaEachHooks, mochaAllHooks } from './constants'

/**
 * Get Allure test status from a TestStat object.
 * @param test {Object} - TestStat object
 * @param config {Object} - WDIO config object
 * @private
 */
export const getTestStatus = (test, config) => {
    if (config.framework === 'jasmine') {
        return testStatuses.FAILED
    }

    if (test.error.name) {
        return test.error.name === 'AssertionError' ? testStatuses.FAILED : testStatuses.BROKEN
    }

    if (test.error.stack) {
        const stackTrace = test.error.stack.trim()
        return stackTrace.startsWith('AssertionError') ? testStatuses.FAILED : testStatuses.BROKEN
    }

    return testStatuses.BROKEN
}

/**
 * Check whether object is empty.
 * @param object {Object}
 * @private
 */
export const isEmpty = (object) => !object || Object.keys(object).length === 0

/**
 * Check whether `title` is a Mocha `beforeEach` or `afterEach` hook.
 * @param title {String} - The hook’s title
 * @returns {boolean}
 * @private
 */
export const isMochaEachHooks = title => mochaEachHooks.some(hook => title.includes(hook))

/**
 * Check whether `title` is a Mocha `beforeAll` or `afterAll` hook.
 * @param title {String} - The hook’s title
 * @returns {boolean}
 * @private
 */
export const isMochaAllHooks = title => mochaAllHooks.some(hook => title.includes(hook))

/**
 * Call reporter.
 * @param {string} event  - Event name
 * @param {Object} msg - Event payload
 * @private
 */
export const tellReporter = (event, msg = {}) => {
    process.emit(event, msg)
}

/**
 * Properly format errors from different test runners.
 * @param {Object} test - TestStat object
 * @returns {Object} - Error object
 * @private
 */
export const getErrorFromFailedTest = (test) => {
    if (test.errors && Array.isArray(test.errors)) {
        return test.errors.length === 1 ? test.errors[0] : new CompoundError(...test.errors)
    }
    return test.error
}
