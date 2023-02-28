import stripAnsi from 'strip-ansi'
import type { HookStats, TestStats, SuiteStats, CommandArgs, Tag } from '@wdio/reporter'
import type { Options } from '@wdio/types'
import type { Label } from 'allure-js-commons'
import { Status as AllureStatus } from 'allure-js-commons'
import CompoundError from './compoundError.js'
import { mochaEachHooks, mochaAllHooks, linkPlaceholder } from './constants.js'

/**
 * Get allure test status by TestStat object
 * @param test {Object} - TestStat object
 * @param config {Object} - wdio config object
 * @private
 */
export const getTestStatus = (
    test: TestStats | HookStats,
    config?: Options.Testrunner
): AllureStatus => {
    if (config && config.framework === 'jasmine') {
        return AllureStatus.FAILED
    }

    if (test.error) {
        if (test.error.message) {
            const message = test.error.message.trim().toLowerCase()

            return message.startsWith('assertionerror') ||
                message.includes('expect')
                ? AllureStatus.FAILED
                : AllureStatus.BROKEN
        }

        if (test.error.stack) {
            const stackTrace = test.error.stack.trim().toLowerCase()

            return stackTrace.startsWith('assertionerror') ||
                stackTrace.includes('expect')
                ? AllureStatus.FAILED
                : AllureStatus.BROKEN
        }
    }

    return AllureStatus.BROKEN
}

/**
 * Check is object is empty
 * @param object {Object}
 * @private
 */
export const isEmpty = (object: any) =>
    !object || Object.keys(object).length === 0

/**
 * Is mocha beforeEach / afterEach hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isMochaEachHooks = (title: string) =>
    mochaEachHooks.some((hook) => title.includes(hook))

/**
 * Is mocha beforeAll / afterAll hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isMochaAllHooks = (title: string) =>
    mochaAllHooks.some((hook) => title.includes(hook))

/**
 * Properly format error from different test runners
 * @param {Object} test - TestStat object
 * @returns {Object} - error object
 * @private
 */
export const getErrorFromFailedTest = (
    test: TestStats | HookStats
): Error | CompoundError | undefined => {
    if (test.errors && Array.isArray(test.errors)) {
        for (let i = 0; i < test.errors.length; i += 1) {
            if (test.errors[i].message) {
                test.errors[i].message = stripAnsi(test.errors[i].message)
            }
            if (test.errors[i].stack) {
                test.errors[i].stack = stripAnsi(test.errors[i].stack!)
            }
        }
        return test.errors.length === 1
            ? test.errors[0]
            : new CompoundError(...(test.errors as Error[]))
    }

    if (test.error) {
        if (test.error.message) {
            test.error.message = stripAnsi(test.error.message)
        }
        if (test.error.stack) {
            test.error.stack = stripAnsi(test.error.stack)
        }
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
        throw Error(
            `The link template "${template}" must contain ${linkPlaceholder} substring.`
        )
    }

    return template.replace(linkPlaceholder, id)
}

export const findLast = <T>(
    arr: Array<T>,
    predicate: (el: T) => boolean
): T | undefined => {
    let result: T | undefined

    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            result = arr[i]
            break
        }
    }

    return result
}

export const isScreenshotCommand = (command: CommandArgs): boolean => {
    const isScrenshotEndpoint = /\/session\/[^/]*(\/element\/[^/]*)?\/screenshot/

    return (
        // WebDriver protocol
        (command.endpoint && isScrenshotEndpoint.test(command.endpoint)) ||
        // DevTools protocol
        command.command === 'takeScreenshot'
    )
}

export const getSuiteLabels = ({ tags }: SuiteStats): Label[] => {
    if (!tags) {
        return []
    }

    return (tags as Tag[]).reduce<Label[]>((acc, tag: Tag) => {
        const label = tag.name.replace(/[@]/, '').split('=')

        if (label.length === 2) {
            return acc.concat({ name: label[0], value: label[1] })
        }

        return acc
    }, [])
}
