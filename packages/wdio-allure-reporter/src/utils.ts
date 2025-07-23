import stripAnsi from 'strip-ansi'
import type { CommandArgs, HookStats, Tag, TestStats } from '@wdio/reporter'
import type { Options } from '@wdio/types'
import type { FixtureResult, Label, StatusDetails, TestResult } from 'allure-js-commons'
import { Status, Status as AllureStatus } from 'allure-js-commons'
import CompoundError from './compoundError.js'
import { allHooks, DEFAULT_CID, eachHooks, linkPlaceholder } from './constants.js'
import type { WDIORunnable } from './types.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

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
export const isEmpty = (object: never) =>

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

export const getStatusDetailsFromFailedTest = (test: TestStats | HookStats): StatusDetails | undefined => {
    const error = getErrorFromFailedTest(test)

    if (!error) {
        return undefined
    }

    return {
        message: error.message,
        trace: error.stack,
    }
}

export const cleanCucumberHooks = (hook: FixtureResult | TestResult) => {
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

export const getRunnablePath = (runnable: WDIORunnable): string[] => {
    if (runnable.parent) {
        return [...getRunnablePath(runnable.parent), runnable.title]
    }

    return [runnable.title]
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

export const findLastIndex = <T>(arr: T[], predicate: (el: T) => boolean): number => {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            return i
        }
    }

    return -1
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

export const convertSuiteTagsToLabels = (tags: string[] | Tag[]): Label[] => {
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

export const last = <T>(arr: T[]): T => arr[arr.length - 1]

export const getCid = () => {
    const cid = process.env.WDIO_WORKER

    return cid ?? DEFAULT_CID
}
const toPosix = (p: string) => p.replace(/[\\/]+/g, '/')
export const fromUrlish = (p: string) => {
    if (!p) {return p}
    if (p.startsWith('file:')) {
        const cleaned = dropPosSuffix(p)
        try {
            return fileURLToPath(cleaned)
        } catch {
            return cleaned.replace(/^file:\/*/, '')
        }
    }
    return p
}
const dropPosSuffix = (p: string) => p.replace(/:(\d+)(?::\d+)?$/, '')
export const absPosix = (p: string) => {
    const s = fromUrlish(p)
    const abs = path.isAbsolute(s) ? s : path.resolve(s)
    return toPosix(abs)
}
export const relNoSlash = (p?: string) => {
    if (!p) {
        return ''
    }
    const rel = toPosix(path.relative(process.cwd(), absPosix(p)))
    return rel.replace(/^\.\/+/, '')
}
export const toFullName = (file: string, title: string) => `${relNoSlash(file)}#${title}`
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

export function isEmptyObject(value: unknown): boolean {
    return isObject(value) && Object.keys(value).length === 0
}

export const toPackageLabel = (p?: string) => {
    if (!p) {return ''}
    const fsPath = fromUrlish(p)
    const noPos = fsPath.split(':')[0]        // отрезать позицию, если есть
    const rel = relNoSlash(noPos)
    return rel.replace(/\//g, '.')
}

export const toPackageLabelCucumber = (p?: string): string => {
    if (!p) {return ''}
    let fsPath = p
    if (p.startsWith('file:')) {
        const cleaned = dropPosSuffix(p)
        try {
            fsPath = fileURLToPath(cleaned)
        } catch {
            fsPath = cleaned.replace(/^file:\/*/, '')
        }
    }
    const rel = relNoSlash(fsPath)
    return rel.replace(/\//g, '.')
}
