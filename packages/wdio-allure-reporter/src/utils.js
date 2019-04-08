import process from 'process'
import CompoundError from './compoundError'
import { testStatuses, mochaEachHooks } from './constants'

/**
 * Get allure test status by TestStat object
 * @param test {Object} - TestStat object
 * @param config {Object} - wdio config object
 * @private
 */
export const getTestStatus = (test, config) => {
    if (config.framework === 'jasmine') {
        return testStatuses.FAILED
    }

    if (test.error.name) {
        return test.error.name === 'AssertionError' ? testStatuses.FAILED : testStatuses.BROKEN
    }

    const stackTrace = test.error.stack.trim()
    return stackTrace.startsWith('AssertionError') ? testStatuses.FAILED : testStatuses.BROKEN

}

/**
 * Check is object is empty
 * @param object {Object}
 * @private
 */
export const isEmpty = (object) => !object || Object.keys(object).length === 0

/**
 * Is mocha beforeEach / afterEach hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isMochaEachHooks = title => mochaEachHooks.some(hook => title.includes(hook))

/**
 * Call reporter
 * @param {string} event  - event name
 * @param {Object} msg - event payload
 * @private
 */
export const tellReporter = (event, msg = {}) => {
    process.emit(event, msg)
}

/**
 * Properly format error from different test runners
 * @param {Object} test - TestStat object
 * @returns {Object} - error object
 * @private
 */
export const getErrorFromFailedTest = (test) => {
    if (test.errors && Array.isArray(test.errors)) {
        return test.errors.length === 1 ? test.errors[0] : new CompoundError(...test.errors)
    }
    return test.error
}
