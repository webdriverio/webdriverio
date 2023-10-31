import stripAnsi from 'strip-ansi'
import type { CommandArgs, HookStats, SuiteStats, Tag, TestStats } from '@wdio/reporter'
import type {
    AllureGroup, AllureStep, AllureTest, ExecutableItemWrapper, FixtureResult, Label, TestResult
} from 'allure-js-commons'
import { LabelName, md5, Stage, Status, Status as AllureStatus } from 'allure-js-commons'
import CompoundError from './compoundError.js'
import { allHooks, eachHooks, linkPlaceholder } from './constants.js'

/**
 * Get allure test status by TestStat object
 * @param test {Object} - TestStat object
 * @private
 */
export const getTestStatus = (
    test: TestStats | HookStats,
): AllureStatus => {

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
    } else if (test.errors) {
        return AllureStatus.FAILED
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
    if (test.errors && Array.isArray(test.errors) && test.errors.length) {
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
export const getHookStatus = (newHookStats: HookStats, hookElement: ExecutableItemWrapper, hookRootStep: AllureStep) => {
    // stage to finish for all hook.
    hookElement.stage = hookRootStep.stage =
        Stage.FINISHED
    // set error detail information
    const formattedError = getErrorFromFailedTest(newHookStats)
    hookElement.detailsMessage = hookRootStep.detailsMessage = formattedError?.message
    hookElement.detailsTrace = hookRootStep.detailsTrace = formattedError?.stack

    let finalStatus = Status.PASSED
    // set status to hook root step
    const hookSteps = hookRootStep.wrappedItem.steps
    if (Array.isArray(hookSteps) && hookSteps.length) {
        const statusPriority = {
            [Status.FAILED]: 0,
            [Status.BROKEN]: 1,
            [Status.SKIPPED]: 2,
            [Status.PASSED]: 3,
        }
        let stepStatus = Status.PASSED
        for (const step of hookSteps) {
            if (step.status && statusPriority[step.status] < statusPriority[finalStatus]) {
                stepStatus = step.status
            }
        }
        finalStatus = stepStatus === Status.FAILED? Status.BROKEN : stepStatus
    } else if (newHookStats.error || (Array.isArray(newHookStats.errors) && newHookStats.errors.length)){
        finalStatus = Status.BROKEN
    }

    hookElement.status = hookRootStep.status = finalStatus
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

export const setAllureIds = (test: AllureTest | undefined, suite: AllureGroup | undefined) => {
    if (!test) {
        return
    }
    const params = test.wrappedItem.parameters.slice()
    const paramsPart = params
        .sort((a, b) => a.name?.localeCompare(b.name))
        .map(it => it.name + it.value)
        .join('')
    const hash = md5(`${suite?.name}${test.wrappedItem.name}${paramsPart}`)
    test.historyId = hash
    if ('labels' in test.wrappedItem) {
        if (test.wrappedItem.labels?.find((label: Label) => label.name === LabelName.AS_ID)) {
            return
        }
    }

    test.testCaseId = hash
}
