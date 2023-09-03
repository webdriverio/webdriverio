import path from 'node:path'
import logger from '@wdio/logger'
import type TagExpressionParser from '@cucumber/tag-expressions'
import { compile } from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'

import type {
    TableRow,
    TableCell,
    PickleStep,
    TestStep,
    Feature,
    Pickle,
    TestStepResultStatus,
    GherkinDocument
} from '@cucumber/messages'
import type { Capabilities } from '@wdio/types'
import type { ReporterStep } from './types.js'

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
export function formatMessage ({ payload = {} }: any) {
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
            const rulesChildrens:any = rules.map((child)=>child.rule?.children).flat()
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

export function shouldRun(doc: GherkinDocument, tagParser: ReturnType<typeof TagExpressionParser>) {
    if (!doc.feature) {
        return false
    }
    const pickles = compile(doc, '', IdGenerator.uuid())
    const tags = pickles.map((pickle) => pickle.tags.map((tag) => tag.name))
    return tags.some((tag) => tagParser.evaluate(tag))
}

/**
 * Generates skip tags based on capabilities and provided tags.
 *
 * @param {Capabilities.RemoteCapability} capabilities - The capabilities for which skip tags will be generated.
 * @param {string[][]} tags - The original tags of scenarios.
 * @returns {string[]} - An array of generated skip tags in Cucumber tag expression format.
 */
export function generateSkipTagsFromCapabilities(capabilities: Capabilities.RemoteCapability, tags: string[][]): string[] {
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
                    acc[splitItem.substring(0, pos)] = eval(
                        splitItem.substring(pos + 1)
                    )
                } catch (err: any) {
                    log.error(`Couldn't use tag "${splitItem}" for filtering because it is malformed`)
                }
            }
            return acc
        }, {})

    tags.flat(1).forEach((tag) => {
        const matched = tag.match(skipTag)
        if (matched) {
            const isSkip = [parse(matched[1] ?? '')]
                .find((filter: Capabilities.Capabilities) => Object.keys(filter)
                    .every((key: keyof Capabilities.Capabilities) => match((capabilities as any)[key], filter[key] as RegExp)))
            if (isSkip) {
                generatedTags.push(`(not ${tag.replace(/(\(|\))/g, '\\$1')})`)
            }
        }
    })

    return generatedTags
}

/**
 * Retrives scenario description if available.
 */
export function getScenarioDescription(feature: Feature, scenarioId: string){
    const children = feature.children?.find((child) => child?.scenario?.id === scenarioId)!
    return children?.scenario?.description || ''
}