import process from 'process'
import {testStatuses, mochaIgnoredHooks} from './constants'
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
 * Filter unnecessary mocha hooks
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const ignoredHooks = title => mochaIgnoredHooks.some(hook => title.includes(hook))

/**
 * Call reporter
 * @param {string} event  - event name
 * @param {Object} msg - event payload
 * @private
 */
export const tellReporter = (event, msg = {}) => {
    process.emit(event, msg)
}
