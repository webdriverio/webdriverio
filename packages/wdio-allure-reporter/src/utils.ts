import stripAnsi from 'strip-ansi'
import type { HookStats, TestStats, SuiteStats, CommandArgs, Tag } from '@wdio/reporter'
import type { Options } from '@wdio/types'
import type { Label, AllureTest, AllureGroup } from 'allure-js-commons'
import { Status as AllureStatus, md5, LabelName } from 'allure-js-commons'
import CompoundError from './compoundError.js'
import { allHooks, eachHooks, linkPlaceholder } from './constants.js'

/**
 * Get allure test status by TestStat object
 * @param stats {Object} - TestStat object
 * @private
 */
export const getTestStatus = (
    stats: TestStats | HookStats | ExecutableItemWrapper
): AllureStatus => {
    if (stats instanceof ExecutableItemWrapper && stats.wrappedItem) {
        const hookSteps = stats.wrappedItem.steps
        if (
            Array.isArray(hookSteps) &&
            hookSteps.length &&
            !stats.status &&
            !stats.wrappedItem.statusDetails
        ) {
            const statusPriority = {
                [Status.FAILED]: 0,
                [Status.BROKEN]: 1,
                [Status.SKIPPED]: 2,
                [Status.PASSED]: 3,
            }
            let finalStatus = Status.PASSED
            for (const step of hookSteps) {
                if (step.status && statusPriority[step.status] < statusPriority[finalStatus]) {
                    finalStatus = step.status
                }
            }
            return finalStatus === Status.FAILED? Status.BROKEN : finalStatus

        }

        const errorDetails = stats.wrappedItem.statusDetails
        const isError = errorDetails !== undefined
        const state = ('state' in stats)? stats.state : undefined

        let finalStatus
        switch (state) {
        case 'passed':
            finalStatus = isError ? Status.BROKEN: Status.PASSED
            break
        case 'failed':
            finalStatus = isError ? Status.FAILED: Status.FAILED
            break
        default:
            finalStatus = isError ? Status.BROKEN: stats.status || Status.BROKEN
        }
        return finalStatus

    } else if ('error' in stats || 'state' in stats) {
        const testStats = stats as TestStats
        const completeErrorStr = `${testStats.error?.message || ''}${testStats.error?.stack || ''}`.trim().toLowerCase()
        const isError = completeErrorStr.startsWith('assertionerror') || completeErrorStr.includes('expect')
        let finalStatus
        switch (testStats.state) {
        case 'passed':
            finalStatus = completeErrorStr.length ? isError? Status.FAILED : Status.BROKEN : Status.PASSED
            break
        case 'failed':
            finalStatus = completeErrorStr.length ? isError? Status.FAILED : Status.BROKEN : Status.FAILED
            break
        default:
            finalStatus = completeErrorStr.length ? isError? Status.FAILED : Status.BROKEN : Status.BROKEN
        }
        return finalStatus
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
export const updateHookInfo = (newHookStats: HookStats, hookElement: ExecutableItemWrapper, hookRootStep: AllureStep) => {
    // stage to finish for all hook.
    hookElement.stage = hookRootStep.stage =
        Stage.FINISHED
    // set error detail information
    const formattedError = getErrorFromFailedTest(newHookStats)
    hookElement.detailsMessage = hookRootStep.detailsMessage = formattedError?.message
    hookElement.detailsTrace = hookRootStep.detailsTrace = formattedError?.stack

    // set status
    hookRootStep.status = getTestStatus(Object.assign(hookRootStep, newHookStats))
    hookElement.status = getTestStatus(hookElement)

    // const hookSteps = hookRootStep.wrappedItem.steps

    // // if error exists the status is set to Broken
    // if (!formattedError && newHookStats.state) {
    //     let finalStatus = Status.PASSED
    //     for (const step of hookSteps) {
    //         // if the step status is undefined, the step will be passed by default
    //         if (statusPriority[step.status || Status.PASSED] < statusPriority[finalStatus]) {
    //             finalStatus = step.status || Status.PASSED
    //         }
    //     }
    //
    //     hookElement.status = hookRootStep.status = finalStatus
    // } else {
    //     let defaultStatus
    //     switch (newHookStats.state) {
    //     case 'passed':
    //         defaultStatus = Status.PASSED
    //         break
    //     case 'failed':
    //         defaultStatus = Status.FAILED
    //         break
    //     default:
    //         defaultStatus = Status.BROKEN
    //     }
    //     hookElement.status = hookRootStep.status = defaultStatus
    // }
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
