import path from 'path'

import { isFunctionAsync } from '@wdio/utils'
import logger from '@wdio/logger'

import * as Cucumber from '@cucumber/cucumber'
import { supportCodeLibraryBuilder } from '@cucumber/cucumber'
import { messages } from '@cucumber/messages'
import { Capabilities } from '@wdio/types'

import { CUCUMBER_HOOK_DEFINITION_TYPES, ReporterStep } from './constants'
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

enum StepType {
    hook = 'hook',
    test = 'test'
}

/**
 * Get step type
 * @param {string} type `Step` or `Hook`
 */
export function getStepType (step: messages.TestCase.ITestStep) {
    return step.hookId ? StepType.hook : StepType.test
}

export function getFeatureId (uri: string, feature: messages.GherkinDocument.IFeature) {
    return `${path.basename(uri)}:${feature.location?.line}:${feature.location?.column}`
}

/**
 * Builds test title from step keyword and text
 * @param {string} keyword
 * @param {string} text
 * @param {string} type
 */
export function getTestStepTitle (keyword:string = '', text:string = '', type:string) {
    const title = (!text && type.toLowerCase() !== 'hook') ? 'Undefined Step' : text
    return `${keyword.trim()} ${title.trim()}`.trim()
}

/**
 * build payload for test/hook event
 */
export function buildStepPayload(
    uri: string,
    feature: messages.GherkinDocument.IFeature,
    scenario: messages.IPickle,
    step: ReporterStep,
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
        // @ts-ignore
        title: getTestStepTitle(step.keyword, step.text, params.type),
        parent: scenario.id,
        argument: createStepArgument(step),
        file: uri,
        tags: scenario.tags,
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
export function filterPickles (capabilities: Capabilities.RemoteCapability, pickle?: messages.IPickle) {
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
        .find((filter: Capabilities.Capabilities) => Object.keys(filter)
            .every((key: keyof Capabilities.Capabilities) => match((capabilities as any)[key], filter[key] as RegExp))))
}

/**
 * The reporters need to have the keywords, like `Given|When|Then`. They are NOT available
 * on the scenario, they ARE on the feature.
 * This will aad them
 */
export function addKeywordToStep(steps:ReporterStep[], feature:messages.GherkinDocument.IFeature){
    return steps.map(step => {
        // Steps without a astNodeIds are hooks
        if (step.astNodeIds && step.astNodeIds.length > 0 && feature.children) {
            // Points to the AST node locations of the pickle. The last one represents the unique id of the pickle.
            // A pickle constructed from Examples will have the first id originating from the Scenario AST node, and
            // the second from the TableRow AST node.
            // See https://github.com/cucumber/cucumber/blob/master/messages/messages.md
            const astNodeId = step.astNodeIds[0]
            feature.children.find((child) =>
                // @ts-ignore
                child[Object.keys(child)[0]].steps.find((featureScenarioStep:ReporterStep) => {
                    if (featureScenarioStep.id === astNodeId.toString()) {
                        step.keyword = featureScenarioStep.keyword
                    }
                    return
                })
            )
            return step
        }
        return step
    })
}
