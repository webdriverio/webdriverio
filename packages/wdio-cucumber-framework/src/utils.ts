import path from 'path'

import { isFunctionAsync } from '@wdio/utils'
import logger from '@wdio/logger'

import * as Cucumber from '@cucumber/cucumber'
import { supportCodeLibraryBuilder } from '@cucumber/cucumber'
import { messages } from '@cucumber/messages'

import { CUCUMBER_HOOK_DEFINITION_TYPES } from './constants'
import { TestHookDefinitionConfig } from './types'

const log = logger('@wdio/cucumber-framework:utils')

type IPickleTableRow = messages.PickleStepArgument.PickleTable.IPickleTableRow
type IPickleTableCell = messages.PickleStepArgument.PickleTable.PickleTableRow.IPickleTableCell

/**
 * NOTE: this function is exported for testing only
 */
export function createStepArgument ({ argument }: messages.Pickle.IPickleStep) {
    if (!argument) {
        return undefined
    }

    if (argument.dataTable) {
        return {
            rows: argument.dataTable.rows?.map((row: IPickleTableRow) => (
                {
                    cells: row.cells?.map((cell: IPickleTableCell) => cell.value)
                }
            ))
        }
    }

    if (argument.docString) {
        return argument.docString.content
    }

    return undefined
}

/**
 * format message
 * @param {object} message { type: string, payload: object }
 */
export function formatMessage ({ payload = {} }: any) {
    let content = { ...payload }

    /**
     * need to convert Error to plain object, otherwise it is lost on process.send
     */
    if (payload.error && (payload.error.message || payload.error.stack)) {
        const { name, message, stack } = payload.error
        content.error = { name, message, stack }
    }

    if (payload.title && payload.parent) {
        content.fullTitle = `${payload.parent}: ${payload.title}`
    }

    return content
}

/**
 * Get step type
 * @param {string} type `Step` or `Hook`
 */
export function getStepType (step: messages.TestCase.ITestStep) {
    return step.hookId ? 'hook' : 'test'
}

export function getFeatureId (uri: string, feature: messages.GherkinDocument.IFeature) {
    return `${path.basename(uri)}:${feature.location?.line}:${feature.location?.column}`
}

/**
 * build payload for test/hook event
 */
export function buildStepPayload(
    uri: string,
    feature: messages.GherkinDocument.IFeature,
    scenario: messages.IPickle,
    step: messages.Pickle.IPickleStep,
    params: {
        type: string
        state?: messages.TestStepFinished.TestStepResult.Status | string | null
        error?: Error
        duration?: number
        title?: string | null
        passed?: boolean
        file?: string
    }
) {
    return {
        uid: step.id,
        title: step.text,
        parent: scenario.id,
        argument: createStepArgument(step),
        file: uri,
        tags: scenario.tags,
        // keyword: step.keyword,
        featureName: feature.name,
        scenarioName: scenario.name,
        ...params
    }
}

/**
 * wrap every user defined hook with function named `userHookFn`
 * to identify later on is function a step, user hook or wdio hook.
 * @param {object} options `Cucumber.supportCodeLibraryBuilder.options`
 */
export function setUserHookNames (options: typeof supportCodeLibraryBuilder) {
    CUCUMBER_HOOK_DEFINITION_TYPES.forEach(hookName => {
        options[hookName].forEach((testRunHookDefinition: TestHookDefinitionConfig) => {
            const hookFn = testRunHookDefinition.code
            if (!hookFn.name.startsWith('wdioHook')) {
                const userHookAsyncFn = async function (this: Cucumber.World, ...args: any) {
                    return hookFn.apply(this, args)
                }
                const userHookFn = function (this: Cucumber.World, ...args: any) {
                    return hookFn.apply(this, args)
                }
                testRunHookDefinition.code = (isFunctionAsync(hookFn)) ? userHookAsyncFn : userHookFn
            }
        })
    })
}

/**
 * Returns true/false if testCase should be kept for current capabilities
 * according to tag in the syntax  @skip([conditions])
 * For example "@skip(browserName=firefox)" or "@skip(browserName=chrome,platform=/.+n?x/)"
 * @param {*} testCase
 */
export function filterPickles (capabilities: WebDriver.Capabilities, pickle?: messages.IPickle) {
    const skipTag = /^@skip\((.*)\)$/

    const match = (value: string, expr: RegExp) => {
        if (Array.isArray(expr)) {
            return expr.indexOf(value) >= 0
        } else if (expr instanceof RegExp) {
            return expr.test(value)
        }
        return (expr && ('' + expr).toLowerCase()) === (value && ('' + value).toLowerCase())
    }

    const parse = (skipExpr: string) =>
        skipExpr.split(';').reduce((acc: Record<string, string>, splitItem: string) => {
            const pos = splitItem.indexOf('=')
            if (pos > 0) {
                try {
                    acc[splitItem.substring(0, pos)] = eval(splitItem.substring(pos + 1))
                } catch (e) {
                    log.error(`Couldn't use tag "${splitItem}" for filtering because it is malformed`)
                }
            }
            return acc
        }, {})

    return !(pickle && pickle.tags && pickle.tags
        .map(p => p.name?.match(skipTag))
        .filter(Boolean)
        .map(m => parse(m![1]))
        .find((filter: WebDriver.Capabilities) => Object.keys(filter)
            .every((key: keyof WebDriver.Capabilities) => match(capabilities[key] as string, filter[key] as RegExp))))
}
