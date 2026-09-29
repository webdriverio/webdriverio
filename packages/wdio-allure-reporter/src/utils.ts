import stripAnsi from 'strip-ansi'
import type { CommandArgs, HookStats, Tag, TestStats } from '@wdio/reporter'
import type { Options } from '@wdio/types'
import type { Label, StatusDetails } from 'allure-js-commons'
import { Status as AllureStatus } from 'allure-js-commons'
import CompoundError from './compoundError.js'
import { DEFAULT_CID } from './constants.js'
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
        if (test.error.name && test.error.name.toLowerCase().includes('assert')) {
            return AllureStatus.FAILED
        }

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

/**
 * Normalize a browser/device family name for Allure historyId.
 * Vendor aliases such as `Google Chrome` / `googlechrome` collapse to `chrome`
 * so history stays stable across Appium and desktop capability spellings.
 */
export function normalizeCapabilityName(value: string): string {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, ' ')
    const compact = trimmed.replace(/[^a-z0-9]/g, '')
    if (compact === 'googlechrome' || compact === 'chrome') {
        return 'chrome'
    }
    if (compact === 'microsoftedge' || compact === 'msedge' || compact === 'edge') {
        return 'edge'
    }
    return trimmed
}
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

export function isEmptyObject(value: unknown): boolean {
    return isObject(value) && Object.keys(value).length === 0
}

export const toPackageLabel = (p?: string) => {
    if (!p) {return ''}
    const fsPath = fromUrlish(p)
    const noPos = dropPosSuffix(fsPath)
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
