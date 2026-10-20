import stripAnsi from 'strip-ansi'
import { dialects } from '@cucumber/gherkin'
import type { HookStats, TestStats } from '@wdio/reporter'

import { FAILED, UNDEFINED, UNDEFINED_STEP_ERROR, UNDEFINED_STEP_SUFFIX } from './constants.js'
import type { ErrorMessage, Step } from './types.js'

/**
 * Return the list of step keywords in the specified language
 *
 * @param language {string}
 *
 * @return {string[]}
 */
const stepKeywords = new Map<string, string[]>()
const keywordRegExps = new Map<string, RegExp>()

/**
 * Escape a text for a RegExp
 */
export function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * `true` for a Gherkin language code, for example `fr` (not `en-US`)
 */
export function isKnownLanguage(language: string): boolean {
    return Object.prototype.hasOwnProperty.call(dialects, language)
}

export function getStepKeywords(language: string): string[] {
    let keywords = stepKeywords.get(language)
    if (!keywords) {
        const dialect = dialects[language]
        keywords = ([] as string[])
            .concat(dialect.given, dialect.when, dialect.then, dialect.and, dialect.but)
            .map((keyword) => keyword.replace(/\s*$/, ''))
        stepKeywords.set(language, keywords)
    }
    return keywords
}

/**
 * Add a failed message
 *
 * @param {object}  testObject
 *
 * @return {object}
 */
export function getFailedMessage(testObject: TestStats | HookStats): ErrorMessage {
    if (testObject.state === FAILED) {
        return {
            error_message: stripAnsi(testObject.error?.stack ?? testObject.error?.message ?? ''),
        }
    }

    return {}
}

/**
 * The status of a step as Cucumber writes it: the framework reports an undefined step
 * as failed, or as pending with `ignoreUndefinedDefinitions`
 */
export function getStepStatus(testObject: TestStats | HookStats): string {
    const message = testObject.error?.message ?? ''
    if (
        (testObject.title ?? '').endsWith(UNDEFINED_STEP_SUFFIX) ||
        (testObject.state === FAILED && message.startsWith('Step "') && message.endsWith(UNDEFINED_STEP_ERROR))
    ) {
        return UNDEFINED
    }
    return testObject.state || ''
}

/**
 * Check if the steps contain valid steps
 *
 * @param {array} steps
 *
 * @param {string} language
 *
 * @return {boolean}
 */
export function containsSteps(steps: Step[], language: string): boolean {
    const stepKeywords = getStepKeywords(language)
    return steps.some((step) => !!step.keyword && stepKeywords.includes(step.keyword))
}

/**
 * Returns the first word in case it's a keyword in the specified language
 *
 * @param {array} title
 *
 * @param {string} language
 *
 * @return {string|undefined}
 */
export function keywordStartsWith(title: string, language: string): string | undefined {
    let regex = keywordRegExps.get(language)
    if (!regex) {
        const keywords = [...getStepKeywords(language), 'After', 'Before']
        regex = new RegExp(`^(${keywords.map(escapeRegExp).join('|')})\\s`)
        keywordRegExps.set(language, regex)
    }
    return (regex.exec(title) || []).pop()
}
