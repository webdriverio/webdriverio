import path from 'node:path'
import logger from '@wdio/logger'
import { isFunctionAsync } from '@wdio/utils'
import type { supportCodeLibraryBuilder, World } from '@cucumber/cucumber'

import type {
    TableRow,
    TableCell,
    PickleStep,
    TestStep,
    Feature,
    Pickle,
    TestStepResultStatus,
    FeatureChild
} from '@cucumber/messages'
import type { Capabilities } from '@wdio/types'
import type { ReporterStep, TestHookDefinitionConfig, Payload } from './types.js'
import { CUCUMBER_HOOK_DEFINITION_TYPES } from './constants.js'
const log = logger('@wdio/cucumber-framework:utils')

/**
 * NOTE: this function is exported for testing only
 */
export function createStepArgument ({ argument }: PickleStep) {
    if (!argument) {
        return undefined
    }

    if (argument.dataTable) {
        return {
            rows: argument.dataTable.rows?.map((row: TableRow) => (
                {
                    cells: row.cells?.map((cell: TableCell) => cell.value)
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
export function formatMessage ({ payload = {} }: { payload: Payload }): Payload {
    const content = { ...payload }

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
export function getStepType (step: TestStep) {
    return step.hookId ? StepType.hook : StepType.test
}

export function getFeatureId (uri: string, feature: Feature) {
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
    feature: Feature,
    scenario: Pickle,
    step: ReporterStep,
    params: {
        type: string
        state?: TestStepResultStatus | string | null
        error?: Error
        duration?: number
        title?: string | null
        passed?: boolean
        file?: string
    }
) {
    return {
        ...params,
        uid: step.id,
        // @ts-ignore
        title: getTestStepTitle(step.keyword, step.text, params.type),
        parent: scenario.id,
        argument: createStepArgument(step),
        file: uri,
        tags: scenario.tags,
        featureName: feature.name,
        scenarioName: scenario.name,
    }
}

/**
 * The reporters need to have the rule.
 * They are NOT available on the scenario, they ARE on the feature.
 * This will add them to it
 */
export function getRule(feature: Feature, scenarioId: string){
    const rules = feature.children?.filter((child) => Object.keys(child)[0] === 'rule')
    const rule = rules.find((rule) => {
        const scenarioRule = rule.rule?.children?.find((child) => child.scenario?.id === scenarioId)
        if (scenarioRule) {
            return rule
        }
    })
    return rule?.rule?.name
}

/**
 * The reporters need to have the keywords, like `Given|When|Then`. They are NOT available
 * on the scenario, they ARE on the feature.
 * This will aad them
 */
export function addKeywordToStep(steps: ReporterStep[], feature: Feature){
    return steps.map(step => {
        // Steps without a astNodeIds are hooks
        if (step.astNodeIds && step.astNodeIds.length > 0 && feature.children) {
            // Points to the AST node locations of the pickle. The last one represents the unique id of the pickle.
            // A pickle constructed from Examples will have the first id originating from the Scenario AST node, and
            // the second from the TableRow AST node.
            // See https://github.com/cucumber/cucumber/blob/master/messages/messages.md
            const astNodeId = step.astNodeIds[0]

            const rules  = feature.children.filter((child)=> Object.keys(child)[0]=== 'rule')
            let featureChildren = feature.children.filter((child)=> Object.keys(child)[0]!== 'rule')
            const rulesChildrens = rules.map((child) => child.rule?.children as FeatureChild).flat()
            featureChildren = featureChildren.concat(rulesChildrens)

            featureChildren.find((child) =>
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

/**
 * Generates skip tags based on capabilities and provided tags.
 *
 * @param {Capabilities.RemoteCapability} capabilities - The capabilities for which skip tags will be generated.
 * @param {string[][]} tags - The original tags of scenarios.
 * @returns {string[]} - An array of generated skip tags in Cucumber tag expression format.
 */
export function generateSkipTagsFromCapabilities(capabilities: Capabilities.ResolvedTestrunnerCapabilities, tags: string[][]): string[] {
    const generatedTags: string[] = []

    const skipTag = /^@skip$|^@skip\((.*)\)$/

    const match = (value: string, expr: RegExp) => {
        if (Array.isArray(expr)) {
            return expr.indexOf(value) >= 0
        } else if (expr instanceof RegExp) {
            return expr.test(value)
        }
        return (
            (expr && ('' + expr).toLowerCase()) ===
            (value && ('' + value).toLowerCase())
        )
    }

    const parse = (skipExpr: string) =>
        skipExpr.split(';').reduce((acc: Record<string, string>, splitItem: string) => {
            const pos = splitItem.indexOf('=')
            if (pos > 0) {
                try {
                    acc[splitItem.substring(0, pos)] = (0, eval)(
                        splitItem.substring(pos + 1)
                    )
                } catch {
                    log.error(`Couldn't use tag "${splitItem}" for filtering because it is malformed`)
                }
            }
            return acc
        }, {})

    tags.flat(1).forEach((tag) => {
        const matched = tag.match(skipTag)
        if (matched) {
            const isSkip = [parse(matched[1] ?? '')]
                .find((filter: WebdriverIO.Capabilities) => Object.keys(filter)
                    .every((key: keyof WebdriverIO.Capabilities) => match((capabilities as Record<string, string>)[key], filter[key] as RegExp)))
            if (isSkip) {
                generatedTags.push(`(not ${tag.replace(/[()\\]/g, '\\$&')})`)
            }
        }
    })

    return generatedTags
}

/**
 * Retrives scenario description if available.
 */
export function getScenarioDescription(feature: Feature, scenarioId: string){
    const children = feature.children?.find((child) => child?.scenario?.id === scenarioId)
    return children?.scenario?.description || ''
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
                const userHookAsyncFn = async function (this: World, ...args: unknown[]) {
                    return hookFn.apply(this, args)
                }
                const userHookFn = function (this: World, ...args: unknown[]) {
                    return hookFn.apply(this, args)
                }
                testRunHookDefinition.code = (isFunctionAsync(hookFn)) ? userHookAsyncFn : userHookFn
            }
        })
    })
}
/**
 * Convert Cucumber status to WebdriverIO test status for reporting.
 * Maps statuses like PASSED, PENDING, etc., to WebdriverIO's shorthand test status values.
 * @param {TestStepResultStatus} status - The Cucumber status (e.g., 'PENDING')
 * @returns {'pass' | 'fail' | 'skip' | 'pending'} - The corresponding WebdriverIO test status
 */
export function convertStatus(status: TestStepResultStatus): 'pass' | 'fail' | 'skip' | 'pending' {
    switch (status) {
    case 'PASSED': return 'pass'
    case 'PENDING': return 'pending'
    case 'SKIPPED': return 'skip'
    case 'AMBIGUOUS': return 'skip'
    case 'FAILED': return 'fail'
    case 'UNDEFINED': return 'pass'
    default: return 'fail'
    }
}
