import process from 'process'
import CompoundError from './compoundError'
import { mochaEachHooks, mochaAllHooks, linkPlaceholder } from './constants'
import stripAnsi from 'strip-ansi'
import Allure from 'allure-js-commons'
import { HookStats, TestStats } from '@wdio/reporter'

/**
 * Get allure test status by TestStat object
 * @param test {Object} - TestStat object
 * @param config {Object} - wdio config object
 * @private
 */
export const getTestStatus = (test: TestStats | HookStats, config: WebdriverIO.Config) : Allure.Status => {
    if (config.framework === 'jasmine') {
        return 'failed'
    }

    if (test.error) {
        if (test.error.name && test.error.message) {
            const message = test.error.message.trim()
            return (test.error.name === 'AssertionError' || message.includes('Expect'))  ? 'failed' : 'broken'
        }

        if (test.error.name) {
            return test.error.name === 'AssertionError' ? 'failed' : 'broken'
        }

        if (test.error.stack) {
            const stackTrace = test.error.stack.trim()
            return (stackTrace.startsWith('AssertionError') || stackTrace.includes('Expect'))  ? 'failed' : 'broken'
        }
    }

    return 'broken'
}

/**
 * Check is object is empty
 * @param object {Object}
 * @private
 */
export const isEmpty = (object: any) => !object || Object.keys(object).length === 0

/**
 * Is mocha beforeEach / afterEach hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isMochaEachHooks = (title: string) => mochaEachHooks.some(hook => title.includes(hook))

/**
 * Is mocha beforeAll / afterAll hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isMochaAllHooks = (title: string) => mochaAllHooks.some(hook => title.includes(hook))

/**
 * Call reporter
 * @param {string} event  - event name
 * @param {Object} msg - event payload
 * @private
 */
export const tellReporter = (event: string, msg: any = {}) => {
    // Node 14 typings does not accept string in process.emit, but allow string in process.on
    process.emit(event as any, msg)
}

/**
 * Properly format error from different test runners
 * @param {Object} test - TestStat object
 * @returns {Object} - error object
 * @private
 */
export const getErrorFromFailedTest = (test: TestStats | HookStats) : Error | CompoundError | undefined  => {
    if (test.errors && Array.isArray(test.errors)) {
        for (let i = 0; i < test.errors.length; i += 1){
            if (test.errors[i].message) test.errors[i].message = stripAnsi(test.errors[i].message)
            if (test.errors[i].stack) test.errors[i].stack = stripAnsi(test.errors[i].stack!)
        }
        return test.errors.length === 1 ? test.errors[0] : new CompoundError(...test.errors as Error[])
    }

    if (test.error) {
        if (test.error.message) test.error.message = stripAnsi(test.error.message)
        if (test.error.stack) test.error.stack = stripAnsi(test.error.stack)
    }

    return test.error
}

/**
 * Substitute task id to link template
 * @param {string} template - link template
 * @param {string} id - task id
 * @returns {string} - link after substitution
 * @private
 */
export const getLinkByTemplate = (template: string | undefined, id: string) => {
    if (typeof template !== 'string') {
        return id
    }
    if (!template.includes(linkPlaceholder)) {
        throw Error(`The link template "${template}" must contain ${linkPlaceholder} substring.`)
    }
    return template.replace(linkPlaceholder, id)
}
