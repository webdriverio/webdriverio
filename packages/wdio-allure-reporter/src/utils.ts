import stripAnsi from 'strip-ansi'
import type { HookStats, TestStats, SuiteStats, CommandArgs, Tag } from '@wdio/reporter'
import type { Options } from '@wdio/types'
import type { Label, AllureTest, AllureGroup, FixtureResult, TestResult, AllureStep, ExecutableItemWrapper } from 'allure-js-commons'
import { Status as AllureStatus, md5, Stage, Status } from 'allure-js-commons'
import CompoundError from './compoundError.js'
import { eachHooks, allHooks, linkPlaceholder } from './constants.js'

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
 * Is mocha/jasmine beforeEach hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isBeforeEachTypeHook = (title: string) =>
    title.includes(eachHooks[0])

/**
 * Is mocha/jasmine beforeAll / beforeEach hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isBeforeTypeHook = (title: string) =>
    title.includes(allHooks[0]) || title.includes(eachHooks[0])

/**
 * Is mocha/jasmine beforeEach / afterEach hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isEachTypeHooks = (title: string) =>
    eachHooks.some((hook) => title.includes(hook))

/**
 * Is mocha/jasmine beforeAll / afterAll hook
 * @param title {String} - hook title
 * @returns {boolean}
 * @private
 */
export const isAllTypeHooks = (title: string) =>
    allHooks.some((hook) => title.includes(hook))

/**
 * Properly format error from different test runners
 * @param {object} test - TestStat object
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
 * Update the hook information with the new one, it could be use when a hook ends
 * @param {HookStats} newHookStats - New information that will be applied to current hook info
 * @param {ExecutableItemWrapper} hookElement - hook element registered in the report
 * @param {AllureStep} hookRootStep - root hook step
 *
 * @private
 */
export const updateHookInfo = (newHookStats: HookStats, hookElement: ExecutableItemWrapper, hookRootStep: AllureStep) => {
    // stage to finish for all hook.
    hookElement.stage = hookRootStep.stage =
        Stage.FINISHED
    // set status values
    switch (newHookStats.state) {
    case 'passed':
        hookElement.status =
            hookRootStep.status = Status.PASSED
        break
    case 'failed':
        hookElement.status =
            hookRootStep.status = Status.FAILED
        break
    default:
        hookElement.status =
            hookRootStep.status = Status.BROKEN
    }
    // set error data
    const formattedError = getErrorFromFailedTest(newHookStats)
    hookElement.detailsMessage =
        hookRootStep.detailsMessage =
            formattedError?.message
    hookElement.detailsTrace =
        hookRootStep.detailsTrace =
            formattedError?.stack
}

export const cleanCucumberHooks = (hook:  FixtureResult | TestResult) => {
    const currentStep = hook.steps[hook.steps.length - 1]
    if (
        currentStep &&
        currentStep.steps.length === 0 &&
        currentStep.attachments.length === 0 &&
        hook.attachments.length === 0 &&
        currentStep.status === Status.PASSED
    ) {
        hook.steps.pop()
    }
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

export const setHistoryId = (test: AllureTest | undefined, suite: AllureGroup | undefined) => {
    if (!test) {
        return
    }
    const params = test.wrappedItem.parameters.slice()
    const paramsPart = params
        .sort((a, b) => a.name?.localeCompare(b.name))
        .map(it => it.name + it.value)
        .join('')
    test.historyId = md5(`${suite?.name}${test.wrappedItem.name}${paramsPart}`)
}
