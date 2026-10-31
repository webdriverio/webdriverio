import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
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
    FeatureChild,
    StepDefinition,
    TestStepResult
} from '@cucumber/messages'
import { getWorstTestStepResult } from '@cucumber/messages'
import type { Capabilities } from '@wdio/types'
import type { HookKind, ReporterStep, TestHookDefinitionConfig, Payload, TestRunHookStart, UserRunHook } from './types.js'
import { AMBIGUOUS_STEP_MESSAGE, CUCUMBER_HOOK_DEFINITION_TYPES } from './constants.js'
const log = logger('@wdio/cucumber-framework:utils')
const require_ = createRequire(import.meta.url)

function createStepArgument ({ argument }: PickleStep) {
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
        const { name, message, stack, type } = payload.error as Error & { type?: string }
        // as the Mocha framework: the concise reporter prints the type
        content.error = { name, message, stack, type: type || name } as Error
    }

    if (payload.title && payload.parent) {
        content.fullTitle = `${payload.parent}: ${payload.title}`
    }

    return content
}

const HOOK_KINDS: Record<string, HookKind> = {
    BEFORE_TEST_CASE: 'beforeEach',
    AFTER_TEST_CASE: 'afterEach',
    BEFORE_TEST_STEP: 'beforeStep',
    AFTER_TEST_STEP: 'afterStep',
    BEFORE_TEST_RUN: 'beforeAll',
    AFTER_TEST_RUN: 'afterAll'
}

/**
 * The hook kind of a Cucumber hook message; `undefined` when the Cucumber version sends no `type`
 */
export function hookKindOf(hook?: { type?: string }): HookKind | undefined {
    return hook?.type ? HOOK_KINDS[hook.type] : undefined
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

function realPath (p: string) {
    try {
        return fs.realpathSync.native(p)
    } catch {
        return p
    }
}

/**
 * `<path from rootDir>:<line>:<column>`, the same in every run. Links are resolved only when the
 * path is not under rootDir, so linked folders (e.g. pnpm packages) keep their own uid.
 */
export function getFeatureId (uri: string, feature: Feature, rootDir = process.cwd()) {
    const file = path.resolve(uri)
    const isUnder = (relative: string) => relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
    const resolved = path.join(realPath(path.dirname(file)), path.basename(file))
    const relative = [
        path.relative(path.resolve(rootDir), file),
        path.relative(realPath(rootDir), file)
    ].find(isUnder) ?? path.relative(realPath(rootDir), resolved)
    const id = relative.split(path.sep).join('/').replaceAll('%', '%25').replaceAll(':', '%3A').replaceAll('#', '%23')
    return `${id}:${feature.location?.line}:${feature.location?.column}`
}

/**
 * Builds test title from step keyword and text
 * @param {string} keyword
 * @param {string} text
 * @param {string} type
 */
function getTestStepTitle (keyword:string = '', text:string = '', type:string) {
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
        pendingReason?: string
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

/**
 * The error text of an ambiguous step: one line for each matching step definition.
 * @param {StepDefinition[]} stepDefinitions - the definitions that match the step
 * @returns {string | undefined} - the text, or `undefined` without a definition
 */
export function getAmbiguousStepMessage(stepDefinitions: readonly StepDefinition[]): string | undefined {
    if (stepDefinitions.length === 0) {
        return undefined
    }
    const lines = stepDefinitions.map(({ pattern, sourceReference }) => {
        // Cucumber sends `pattern.toString()`, with the slashes, for a regular expression with flags
        const source = pattern.type === 'REGULAR_EXPRESSION' && !pattern.source.startsWith('/')
            ? `/${pattern.source}/`
            : pattern.source
        if (!sourceReference.uri) {
            return `  ${source}`
        }
        const line = sourceReference.location ? `:${sourceReference.location.line}` : ''
        return `  ${source} - ${sourceReference.uri}${line}`
    })
    return [AMBIGUOUS_STEP_MESSAGE, ...lines].join('\n')
}

/**
 * Cucumber 13 sends no message for an ambiguous step: give the result the matching step definitions as message.
 * @param stepDefinitionIds - gives the step definition ids of the step, only for an ambiguous result with no message
 * @returns the same result when it is not ambiguous, has a message, or no definition is found
 */
export function withAmbiguousMessage(
    result: TestStepResult,
    stepDefinitionIds: () => readonly string[],
    stepDefinitions: ReadonlyMap<string, StepDefinition>
): TestStepResult {
    if (result.status !== 'AMBIGUOUS' || result.message) {
        return result
    }
    const message = getAmbiguousStepMessage(stepDefinitionIds()
        .map((id) => stepDefinitions.get(id))
        .filter((definition): definition is StepDefinition => Boolean(definition)))
    return message ? { ...result, message } : result
}

/**
 * stack lines with the location of the scenario and the step in the feature file
 */
export function getFeatureStack(uri: string, feature: Feature, scenario: Pickle, step?: PickleStep): string {
    let stack = `\tat Feature(${uri}):1:1\n`
    const children = feature.children?.flatMap((child) => child.rule ? child.rule.children : [child]) ?? []
    const featScenario = children.find(c => scenario.astNodeIds && c.scenario?.id === scenario.astNodeIds[0])?.scenario
    if (featScenario) {
        stack += `\tat Scenario(${featScenario.name}):${featScenario.location?.line}:${featScenario.location?.column}\n`

        const steps = [...children.flatMap((c) => c.background?.steps ?? []), ...(featScenario.steps ?? [])]
        const featStep = steps.find(s => step?.astNodeIds && s.id === step.astNodeIds[0])
        if (featStep) {
            stack += `\tat Step(${featStep.text}):${featStep.location?.line}:${featStep.location?.column}\n`
        }
    }
    return stack
}

/**
 * a scenario as Cucumber names it: `"name" (path:line)`, with the line of the example row for an outline
 */
export function scenarioLabel(uri: string, feature: Feature | undefined, scenario: Pickle): string {
    const [scenarioId, rowId] = scenario.astNodeIds ?? []
    const children = feature?.children?.flatMap((child) => child.rule ? child.rule.children : [child]) ?? []
    const featScenario = children.find((c) => c.scenario?.id === scenarioId)?.scenario
    const row = featScenario?.examples?.flatMap((examples) => examples.tableBody).find((r) => r.id === rowId)
    const line = (row ?? featScenario)?.location?.line
    return `"${scenario.name}" (${path.relative(process.cwd(), uri)}${line ? `:${line}` : ''})`
}

interface RunHookDefinition {
    id: string
    name?: string
    uri?: string
    line?: number
    code: Function
}

/**
 * the user BeforeAll / AfterAll hooks by hook id: the kind comes from the list, also when Cucumber sends
 * no hook `type`; WDIO's own run hooks (`wdioHook*`, see `setUserHookNames`) are left out
 */
export function userRunHooks(library: { beforeTestRunHookDefinitions: RunHookDefinition[], afterTestRunHookDefinitions: RunHookDefinition[] }) {
    const hooks: Record<string, UserRunHook> = {}
    const add = (definitions: RunHookDefinition[], kind: UserRunHook['kind']) => {
        for (const { id, name, uri, line, code } of definitions) {
            if (!code.name.startsWith('wdioHook')) {
                hooks[id] = { kind, name, uri, line }
            }
        }
    }
    add(library.beforeTestRunHookDefinitions, 'BeforeAll')
    add(library.afterTestRunHookDefinitions, 'AfterAll')
    return hooks
}

/**
 * the `hook:start` of a BeforeAll or AfterAll: Cucumber runs it once for each run, outside of any scenario,
 * so it is a hook of the feature suite; no contextId, so the base reporter gives it its commands (hookOwner)
 */
export function testRunHookStart({ uid, hook, featureUid, uri }: { uid: string, hook: UserRunHook, featureUid: string, uri: string }): TestRunHookStart {
    const { kind, name, uri: hookUri, line } = hook
    return {
        type: 'hook',
        uid,
        title: `${kind}${name ? ` "${name}"` : ''}${hookUri ? ` (${path.relative(process.cwd(), hookUri)}${line ? `:${line}` : ''})` : ''}`,
        parent: featureUid,
        parentUid: featureUid,
        hookKind: kind === 'AfterAll' ? 'afterAll' : 'beforeAll',
        hookSuiteUid: featureUid,
        file: uri,
    }
}

/**
 * the `hook:end` of a run hook: a passed one has no state (HookStats), SKIPPED is a dry run
 */
export function testRunHookEnd(start: TestRunHookStart, result: TestStepResult): TestRunHookStart & { duration: number, state?: 'failed' | 'skipped', error?: Error } {
    const duration = Math.round((result.duration?.seconds ?? 0) * 1000 + (result.duration?.nanos ?? 0) / 1e6)
    if (result.status === 'FAILED') {
        const message = result.message ?? ''
        const error = new Error(result.exception?.message ?? message.split('\n')[0])
        error.name = result.exception?.type ?? 'Error'
        error.stack = message
        return { ...start, duration, state: 'failed', error }
    }
    return { ...start, duration, ...(result.status === 'SKIPPED' && { state: 'skipped' as const }) }
}

/**
 * with `strict`, Cucumber fails the run on a pending step or hook, but shows it as pending
 * (a warning, issue_helpers.js): name the scenarios (see `scenarioLabel`) that make the run fail
 */
export function strictPendingWarning(scenarios: string[]) {
    return `The run fails because cucumberOpts.strict is true and ${scenarios.length} ${scenarios.length === 1 ? 'scenario has' : 'scenarios have'} ` +
        `a pending step or hook: ${scenarios.join(', ')}`
}

/**
 * Cucumber's own rule for the retries of a scenario (`retry`, `retryTagFilter`), from a file that
 * Cucumber does not export: `undefined` when it cannot be loaded
 */
let cucumberRetriesForPickle: ((pickle: Pickle, options: { retry: number, retryTagFilter: string }) => number) | null | undefined
export function retriesForPickle(pickle: Pickle, options: { retry: number, retryTagFilter: string }): number | undefined {
    if (cucumberRetriesForPickle === undefined) {
        try {
            ;({ retriesForPickle: cucumberRetriesForPickle } = require_('@cucumber/cucumber/lib/runtime/helpers'))
        } catch (err) {
            cucumberRetriesForPickle = null
            log.warn(`Failed to load Cucumber's retry rule: ${(err as Error).message}. A step that fails in an attempt that Cucumber retries is reported as failed.`)
        }
    }
    return cucumberRetriesForPickle?.(pickle, options)
}

export interface StepResult {
    state: 'pass' | 'fail' | 'skip' | 'pending'
    error?: Error
    pendingReason?: string
    /** reporters tell an undefined step from a pending one by this suffix */
    titleSuffix: string
    /** the result counts as a failure of the run */
    failed: boolean
}

/**
 * the result of a scenario from the results of its steps and hooks: of the results that fail under the
 * options (see `getStepResult`), the worst one as Cucumber orders them (a retried attempt has a FAILED one);
 * else the first result that did not pass, else the last one; `undefined` for a scenario with no steps
 */
export function getScenarioResult(
    results: TestStepResult[],
    options: { ignoreUndefinedDefinitions: boolean, failAmbiguousDefinitions: boolean, strict: boolean }
): TestStepResult | undefined {
    const failing = results.filter(({ status }) => status === 'FAILED' ||
        (status === 'UNDEFINED' && !options.ignoreUndefinedDefinitions) ||
        (status === 'AMBIGUOUS' && options.failAmbiguousDefinitions) ||
        (status === 'PENDING' && options.strict))
    if (failing.length) {
        return getWorstTestStepResult(failing)
    }
    return results.find(({ status }) => status !== 'PASSED') || results[results.length - 1]
}

/**
 * The reported state of a step or scenario result, the same in sequential and parallel runs.
 * @param result - the Cucumber result
 * @param params.title - the step text, or the scenario title
 * @param params.isStep - `false` for a scenario that is reported as a test (`scenarioLevelReporter`)
 * @param params.featureStack - gives the location of the step in the feature file (see `getFeatureStack`), only for the errors that show it
 */
export function getStepResult(
    result: TestStepResult,
    params: { title: string, isStep: boolean, ignoreUndefinedDefinitions: boolean, failAmbiguousDefinitions: boolean, strict: boolean, featureStack: () => string }
): StepResult {
    const { title, isStep, featureStack } = params
    let state = convertStatus(result.status)
    let error = result.message ? new Error(result.message) : undefined
    let titleSuffix = ''
    let failed = false

    if (result.status === 'UNDEFINED') {
        if (params.ignoreUndefinedDefinitions) {
            state = 'pending'
            titleSuffix = ' (undefined step)'
        } else {
            state = 'fail'
            failed = true
            error = new Error(
                (isStep ? `Step "${title}" is not defined. ` : `Scenario ${title} has undefined steps. `) +
                'You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.'
            )
            error.stack = `${error.message}\n${featureStack()}`
        }
    } else if (result.status === 'PENDING' && params.strict) {
        // as Cucumber: still pending, but the run fails
        failed = true
    } else if (result.status === 'FAILED') {
        state = 'fail'
        failed = true
        error = new Error(result.message?.split('\n')[0])
        error.stack = result.message as string
    } else if (result.status === 'AMBIGUOUS' && params.failAmbiguousDefinitions) {
        state = 'fail'
        failed = true
        const message = result.message || (
            (isStep
                ? `Step "${title}" matches multiple step definitions. `
                : `Scenario "${title}" contains a step matching multiple step definitions. `) +
            'Make the step definitions unique by removing duplicate or overlapping expressions.'
        )
        error = new Error(message.split('\n')[0])
        error.stack = `${message}\n${featureStack()}`
    }

    // reporters show the reason of a skipped test from `pendingReason`, not from its error
    const pendingReason = result.status === 'AMBIGUOUS' && state === 'skip' ? result.message : undefined
    return { state, error, ...(pendingReason ? { pendingReason } : {}), titleSuffix, failed }
}
