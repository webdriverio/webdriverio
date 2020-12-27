import * as path from 'path'
import { isFunctionAsync } from '@wdio/utils'
import { supportCodeLibraryBuilder } from '@cucumber/cucumber'
import { messages } from '@cucumber/messages'

import { CUCUMBER_HOOK_DEFINITION_TYPES } from './constants'
import { TestHookDefinitionConfig } from './types'

/**
 * NOTE: this function is exported for testing only
 */
export function createStepArgument ({ argument }: messages.Pickle.IPickleStep) {
    if (!argument) {
        return undefined
    }

    if (argument.dataTable) {
        return {
            rows: argument.dataTable.rows?.map((row: any) => (
                {
                    cells: row.cells.map((cell: any) => cell.value),
                    locations: row.cells.map((cell: any) => cell.location)
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
 * builds test full title from test parent and title
 * NOTE: this function is exported for testing only
 * @param {string} parent parent suite/scenario
 * @param {string} stepTitle step/test title
 */
export function getTestFullTitle(parent: any, stepTitle: any) {
    return `${parent}: ${stepTitle}`
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
        content.fullTitle = getTestFullTitle(payload.parent, payload.title)
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
 * @param {object[]} result cucumber global result object
 */
export const getDataFromResult = ([{ uri }, feature, ...scenarios]: any) => ({ uri, feature, scenarios })

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
                const userHookAsyncFn = async function (this: any, ...args: any) {
                    return hookFn.apply(this, args)
                }
                const userHookFn = function (this: any, ...args: any) {
                    return hookFn.apply(this, args)
                }
                testRunHookDefinition.code = (isFunctionAsync(hookFn)) ? userHookAsyncFn : userHookFn
            }
        })
    })
}
