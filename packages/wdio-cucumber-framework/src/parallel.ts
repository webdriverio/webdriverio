/**
 * Parallel scenario execution for the Cucumber framework adapter.
 *
 * When `cucumberOpts.parallelMode: 'contexts'` is set, this module
 * replaces the sequential `runCucumber()` call with parallel execution:
 *   1. Parse Gherkin feature files to collect all pickles (scenarios)
 *   2. Run scenarios through a pool of `maxParallelContexts` slots; each
 *      pool keeps spare browsing contexts (windows) ready while scenarios run
 *      and closes finished windows in the background (a slot never has more
 *      than one window close in flight; it awaits the previous close first)
 *   3. Await all pending window/user-context cleanups before returning
 *   4. Each scenario runs inside an AsyncLocalStorage scope. WebdriverIO's
 *      ContextManager.getCurrentContext() consults that store first, so
 *      every command (url, $, click, setValue, getText, etc.) targets the
 *      correct browsing context — the ALS store is the choke point, not a
 *      per-command proxy. The webdriverio package still carries explicit
 *      BiDi per-command branches: element commands (addValue, clearValue,
 *      getText, getAttribute, click, ...) are swapped for Bidi equivalents
 *      whenever `wdio:experimentalBiDiCommands` is set, and session-global
 *      window management (switchToWindow, switchToParentFrame, refresh,
 *      closeWindow) throws inside the parallel scope.
 *
 * Uses Cucumber's internal TestCaseRunner (bypasses the sequential
 * Runtime) to achieve per-scenario parallelism while preserving full
 * hook support (Before, After, BeforeStep, AfterStep) and retries.
 *
 * Cucumber's internal modules are loaded via createRequire because
 * the package exports map only has a "require" condition for deep
 * lib/* paths.
 *
 * @module parallel
 */

import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import type { AsyncLocalStorage } from 'node:async_hooks'

import logger from '@wdio/logger'
import * as Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type * as messages from '@cucumber/messages'

import type { CucumberOptions, ParallelBrowser, ParallelMode, ReporterStep } from './types.js'
import {
    addKeywordToStep,
    getAmbiguousStepMessage,
    getFeatureId,
    getFeatureStack,
    getRule,
    getScenarioDescription,
    getStepResult,
    getStepType,
    buildStepPayload,
    formatMessage,
} from './utils.js'

const log = logger('@wdio-cucumber-framework:parallel')
const uuidFn = IdGenerator.uuid()
const require_ = createRequire(import.meta.url)

// ============================================================
// Types for Cucumber internal modules (loaded via createRequire)
// ============================================================

/**
 * Whether the Cucumber internal modules needed for parallel execution
 * were loaded successfully.  These modules live under
 * `@cucumber/cucumber/lib/*` and are NOT part of Cucumber's
 * public API — they can move or be renamed in any release.
 */
let parallelModulesAvailable = true

// ============================================================

/** Maps pickle IDs to assembled TestCase objects. */
interface IAssembledTestCases {
    [pickleId: string]: messages.TestCase
}

interface ISourcedPickle {
    gherkinDocument: messages.GherkinDocument
    pickle: messages.Pickle
}

interface IAssembledTestCase extends ISourcedPickle {
    testCase: messages.TestCase
}

type AssembleTestCases = (
    testRunStartedId: string,
    eventBroadcaster: EventEmitter,
    newId: IdGenerator.NewId,
    sourcedPickles: ReadonlyArray<ISourcedPickle>,
    supportCodeLibrary: SupportCodeLibrary
) => Promise<ReadonlyArray<IAssembledTestCase>>

interface ISnippetBuilder {
    build(request: unknown): string
}

interface IFormatterBuilder {
    getStepDefinitionSnippetBuilder(options: {
        cwd: string
        snippetInterface?: CucumberOptions['snippetInterface']
        snippetSyntax?: string
        supportCodeLibrary: SupportCodeLibrary
    }): Promise<ISnippetBuilder>
}

interface IExecutor {
    runBeforeAllHooks(): Promise<boolean>
    runAfterAllHooks(): Promise<boolean>
}

interface IExecutorConstructor {
    new (
        testRunStartedId: string,
        workerId: string | undefined,
        eventBroadcaster: EventEmitter,
        newId: IdGenerator.NewId,
        options: IRuntimeOptions,
        supportCodeLibrary: SupportCodeLibrary,
        snippetBuilder: ISnippetBuilder
    ): IExecutor
}

interface IRuntimeOptions {
    dryRun: boolean
    failFast: boolean
    filterStacktraces: boolean
    retry: number
    retryTagFilter: string
    strict: boolean
    worldParameters: Record<string, unknown>
}

interface IPickleFilterOptions {
    cwd: string
    featurePaths?: string[]
    names?: string[]
    tagExpression?: string
}

interface IPickleFilter {
    matches(req: { gherkinDocument: messages.GherkinDocument; pickle: messages.Pickle }): boolean
}

interface INewTestCaseRunnerOptions {
    eventBroadcaster: EventEmitter
    gherkinDocument: messages.GherkinDocument
    newId: IdGenerator.NewId
    pickle: messages.Pickle
    testCase: messages.TestCase
    retries: number
    skip: boolean
    filterStackTraces: boolean
    supportCodeLibrary: SupportCodeLibrary
    worldParameters: Record<string, unknown>
    snippetBuilder: ISnippetBuilder
}

interface TestCaseRunnerInstance {
    run(): Promise<messages.TestStepResultStatus>
}

interface TestRunHookDefinition {
    code: Function
    uri?: string
    line?: number
}

interface SupportCodeLibrary {
    readonly beforeTestRunHookDefinitions: TestRunHookDefinition[]
    readonly afterTestRunHookDefinitions: TestRunHookDefinition[]
    readonly beforeTestCaseHookDefinitions: TestRunHookDefinition[]
    readonly afterTestCaseHookDefinitions: TestRunHookDefinition[]
    readonly beforeTestStepHookDefinitions: TestRunHookDefinition[]
    readonly afterTestStepHookDefinitions: TestRunHookDefinition[]
    readonly defaultTimeout: number
    readonly stepDefinitions: unknown[]
}

type EmitSupportCodeMessages = (options: {
    eventBroadcaster: EventEmitter
    supportCodeLibrary: SupportCodeLibrary
    newId: IdGenerator.NewId
}) => void

// ============================================================
// Load Cucumber internal modules via CJS require
// ============================================================

let assembleTestCases: AssembleTestCases
let retriesForPickle: (pickle: messages.Pickle, options: IRuntimeOptions) => number
let FormatterBuilder: IFormatterBuilder
let Executor: IExecutorConstructor
let TestCaseRunner: { new (options: INewTestCaseRunnerOptions): TestCaseRunnerInstance }
let PickleFilter: new (options: IPickleFilterOptions) => IPickleFilter
let emitSupportCodeMessages: EmitSupportCodeMessages
let orderPickles: <T>(items: T[], order: string, logger: { warn(message: string): void }) => void

try {
    ;({ default: PickleFilter } = require_('@cucumber/cucumber/lib/pickle_filter') as {
        default: new (options: IPickleFilterOptions) => IPickleFilter
    })

    ;({ assembleTestCases } = require_('@cucumber/cucumber/lib/assemble/assemble_test_cases') as {
        assembleTestCases: AssembleTestCases
    })

    ;({ retriesForPickle } = require_('@cucumber/cucumber/lib/runtime/helpers') as {
        retriesForPickle: (pickle: messages.Pickle, options: IRuntimeOptions) => number
    })

    ;({ Executor } = require_('@cucumber/cucumber/lib/runtime/executor') as {
        Executor: IExecutorConstructor
    })

    FormatterBuilder = require_('@cucumber/cucumber/lib/formatter/builder').default as IFormatterBuilder

    ;({ emitSupportCodeMessages } = require_('@cucumber/cucumber/lib/api/emit_support_code_messages') as {
        emitSupportCodeMessages: EmitSupportCodeMessages
    })

    ;({ orderPickles } = require_('@cucumber/cucumber/lib/filter/order_pickles') as {
        orderPickles: typeof orderPickles
    })

    TestCaseRunner = require_('@cucumber/cucumber/lib/runtime/test_case_runner').default as {
        new (options: INewTestCaseRunnerOptions): TestCaseRunnerInstance
    }
} catch (err) {
    parallelModulesAvailable = false
    const reqErr = err as Error & { code?: string }
    log.warn(
        `Failed to load Cucumber internal modules required for parallel mode: ${reqErr.message}. ` +
        'This typically means the installed version of @cucumber/cucumber has changed its internal ' +
        'module layout. Parallel mode (parallelMode: \'contexts\') will not be available. ' +
        'Falling back to sequential execution.\n' +
        `Module resolution error: ${reqErr.code || 'unknown'}`
    )
}

export function isParallelAvailable(): boolean {
    return parallelModulesAvailable
}

// ============================================================
// Context allocation
// ============================================================

interface ParallelContextAllocation {
    context: string
    userContext?: string
}

function resolveMaxContexts(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? Math.max(1, Math.floor(value))
        : Math.max(1, fallback)
}

async function removeUserContext(bidi: ParallelBrowser, userContext: string): Promise<void> {
    try {
        await bidi.browserRemoveUserContext?.({ userContext })
    } catch (err) {
        log.debug(`Cleanup error removing user context ${userContext}: ${(err as Error).message}`)
    }
}

async function closeContext(bidi: ParallelBrowser, context: string, level: 'debug' | 'warn', label: string): Promise<void> {
    try {
        await bidi.browsingContextClose({ context })
    } catch (err) {
        log[level](`${label} ${context}: ${(err as Error).message}`)
    }
}

async function cleanupAllocation(bidi: ParallelBrowser, { context, userContext }: ParallelContextAllocation): Promise<void> {
    await closeContext(bidi, context, 'debug', 'Cleanup error closing context')
    if (userContext) {
        await removeUserContext(bidi, userContext)
    }
    bidi.__parallelContexts?.delete(context)
}

async function allocateContext(bidi: ParallelBrowser, mode: ParallelMode): Promise<ParallelContextAllocation> {
    let allocation: ParallelContextAllocation
    if (mode !== 'userContexts') {
        const { context } = await bidi.browsingContextCreate({ type: 'window' })
        allocation = { context }
    } else {
        const { userContext } = await bidi.browserCreateUserContext!({})
        try {
            const { context } = await bidi.browsingContextCreate({ type: 'window', userContext })
            allocation = { context, userContext }
        } catch (err) {
            await removeUserContext(bidi, userContext)
            throw err
        }
    }
    // Register with the session ContextManager so navigations inside these
    // windows don't trigger session-global re-anchoring (tree fetch + switchToWindow).
    bidi.__parallelContexts?.add(allocation.context)
    return allocation
}

// ============================================================
// Feature-grouped pickle collection
// ============================================================

interface FeatureGroup {
    uid: string
    uri: string
    gherkinDocument: messages.GherkinDocument
    pickles: messages.Pickle[]
}

function collectFeatureGroups(
    gherkinDocuments: (messages.GherkinDocument | messages.GherkinDocument[])[],
    rootDir?: string
): FeatureGroup[] {
    return gherkinDocuments
        .flatMap((docOrDocs) => {
            const docs = [docOrDocs].flat(1) as messages.GherkinDocument[]
            return docs.map((doc) => ({
                uid: getFeatureId(doc.uri as string, doc.feature as messages.Feature, rootDir),
                uri: doc.uri || '',
                gherkinDocument: doc,
                pickles: Gherkin.compile(doc, doc.uri || '', uuidFn) as messages.Pickle[],
            }))
        })
        .filter((g) => g.pickles.length > 0)
}

// ============================================================
// Reporter helpers
// ============================================================

function getTitle(
    featureOrScenario: messages.Feature | messages.Pickle,
    tagsInTitle?: boolean
): string {
    const name = featureOrScenario.name
    const tags = featureOrScenario.tags
    if (!tagsInTitle || !tags || !tags.length) {
        return name
    }
    return `${tags.map((tag) => tag.name).join(', ')}: ${name}`
}

function emitSuiteEvent(
    reporter: EventEmitter,
    cid: string,
    specs: string[],
    group: FeatureGroup,
    event: 'suite:start' | 'suite:end'
) {
    const doc = group.gherkinDocument
    const payload = {
        uid: group.uid,
        title: getTitle(doc.feature as messages.Feature),
        type: 'feature' as const,
        file: doc.uri,
        tags: doc.feature?.tags,
        cid,
        specs,
        parentUid: null,
    }
    reporter.emit(event, formatMessage({ payload }))
}

function buildScenarioPayload(params: {
    cid: string
    specs: string[]
    cucumberOpts: Required<CucumberOptions>
    uri: string
    feature: messages.Feature
    pickle: messages.Pickle
    scenarioUID: string
    featureUID: string
}) {
    const { cid, specs, cucumberOpts, uri, feature, pickle, scenarioUID, featureUID } = params
    return {
        uid: scenarioUID,
        title: getTitle(pickle, cucumberOpts.tagsInTitle),
        parent: featureUID,
        type: 'scenario',
        description: getScenarioDescription(feature, pickle.astNodeIds[0]),
        file: uri,
        tags: pickle.tags,
        rule: getRule(feature, pickle.astNodeIds[0]),
        cid,
        specs,
    }
}

/**
 * Report a scenario that never executed (failFast stopped the run).
 * Mirrors what a TestCaseRunner invoked with `skip: true` would emit:
 * scenario-level mode pairs test:start with test:skip; step-level mode
 * opens the scenario suite, reports every step skipped, and closes it.
 */
function emitSkippedScenario(
    reporter: EventEmitter,
    cid: string,
    specs: string[],
    cucumberOpts: Required<CucumberOptions>,
    group: FeatureGroup,
    pickle: messages.Pickle,
    scenarioIndex: number
): void {
    const uri = group.gherkinDocument.uri || ''
    const feature = group.gherkinDocument.feature as messages.Feature
    const payload = buildScenarioPayload({
        cid,
        specs,
        cucumberOpts,
        uri,
        feature,
        pickle,
        scenarioUID: `scenario-${cid}-${scenarioIndex}`,
        featureUID: group.uid,
    })

    if (cucumberOpts.scenarioLevelReporter !== false) {
        const skipped = { ...payload, parentUid: group.uid, state: 'skip', duration: 0, passed: true }
        reporter.emit('test:start', formatMessage({ payload: { ...payload, parentUid: group.uid } }))
        reporter.emit('test:skip', formatMessage({ payload: skipped }))
        reporter.emit('test:end', formatMessage({ payload: skipped }))
        return
    }

    reporter.emit('suite:start', formatMessage({ payload: { ...payload, parentUid: group.uid } }))
    pickle.steps = addKeywordToStep(pickle.steps as ReporterStep[], feature)
    for (const step of pickle.steps || []) {
        const stepPayload = buildStepPayload(uri, feature, pickle, step, {
            type: 'step',
            state: 'skip',
            passed: true,
            duration: 0,
        })
        const skippedStep = { ...stepPayload, parentUid: payload.uid }
        reporter.emit('test:start', formatMessage({ payload: skippedStep }))
        reporter.emit('test:skip', formatMessage({ payload: skippedStep }))
        reporter.emit('test:end', formatMessage({ payload: skippedStep }))
    }
    const closed = { ...payload, parentUid: group.uid, duration: 0 }
    reporter.emit('suite:end', formatMessage({ payload: closed }))
}

// ============================================================
// Feature-level helpers
// ============================================================

/**
 * Run BeforeAll/AfterAll hooks once per run — Cucumber semantics, not once
 * per feature group. These hooks have no scenario, so they run in the
 * session-global context; they must not rely on per-scenario browsing
 * contexts. WDIO's beforeFeature/afterFeature config hooks receive the first
 * feature's uri/feature (sequential mode feeds them the last-parsed document
 * — a pre-existing quirk either way).
 */
async function runTestRunHooks(
    eventEmitter: EventEmitter,
    runHooks: () => Promise<boolean>,
    groups: FeatureGroup[],
    hookName: string
): Promise<boolean> {
    const group = groups[0]
    eventEmitter.emit('getHookParams', {
        uri: group.uri,
        feature: group.gherkinDocument.feature,
    })
    try {
        if (await runHooks()) {
            return true
        }
        log.error(`${hookName} hook failed`)
    } catch (err) {
        log.error(`${hookName} hook failed: ${(err as Error).message}`)
    }
    return false
}

/**
 * Set once test-run hooks begin executing (BeforeAll). Once side-effecting
 * hooks have run, a mid-run failure must NOT fall back to sequential
 * execution — that would double-execute every scenario and duplicate
 * reports. Exported so the adapter (index.ts) can decide whether a
 * sequential fallback is still safe.
 */
let executionStarted = false
export function parallelRunHasStarted(): boolean {
    return executionStarted
}

function emitFeatureSuiteEvents(
    reporter: EventEmitter,
    cid: string,
    specs: string[],
    groups: FeatureGroup[],
    event: 'suite:start' | 'suite:end'
): void {
    for (const group of groups) {
        emitSuiteEvent(reporter, cid, specs, group, event)
    }
}

// ============================================================
// Per-scenario envelope → WDIO reporter translator
// ============================================================

interface ScenarioTranslatorParams {
    broadcaster: EventEmitter
    reporter: EventEmitter
    eventEmitter: EventEmitter
    cid: string
    specs: string[]
    gherkinDocument: messages.GherkinDocument
    featureUID: string
    pickle: messages.Pickle
    testCase: messages.TestCase
    cucumberOpts: Required<CucumberOptions>
    scenarioIndex: number
    contextId: string
    supportCode: SupportCodeMessages
}

interface SupportCodeMessages {
    stepDefinitions: Map<string, messages.StepDefinition>
    /** hook id → the hook title of the sequential formatter */
    hookTitles: Map<string, string>
}

/**
 * the step definition and hook messages of the support code, which the sequential formatter gets from Cucumber
 */
function collectSupportCodeMessages(supportCodeLibrary: SupportCodeLibrary): SupportCodeMessages {
    const stepDefinitions = new Map<string, messages.StepDefinition>()
    const hookTitles = new Map<string, string>()
    const eventBroadcaster = new EventEmitter()
    eventBroadcaster.on('envelope', (envelope: messages.Envelope) => {
        if (envelope.stepDefinition) {
            stepDefinitions.set(envelope.stepDefinition.id, envelope.stepDefinition)
        }
        if (envelope.hook) {
            const { id, name, tagExpression } = envelope.hook
            hookTitles.set(id, `${name || ''} ${tagExpression || ''}`.trim())
        }
    })
    emitSupportCodeMessages({ eventBroadcaster, supportCodeLibrary, newId: uuidFn })
    return { stepDefinitions, hookTitles }
}

function wireScenarioTranslator(params: ScenarioTranslatorParams): (error: Error) => void {
    const {
        broadcaster, reporter, eventEmitter, cid, specs,
        gherkinDocument, featureUID, pickle, testCase, cucumberOpts,
        scenarioIndex, contextId, supportCode,
    } = params

    const uri = gherkinDocument.uri || ''
    const feature = gherkinDocument.feature as messages.Feature
    const scenarioUID = `scenario-${cid}-${scenarioIndex}`
    const scenarioLevel = cucumberOpts.scenarioLevelReporter !== false

    let testStart: Date | undefined
    let stepStart: Date | undefined
    let stepResults: messages.TestStepResult[] = []
    let scenarioOpen = false
    let openStep: Record<string, unknown> | undefined
    /**
     * test:end of the last finished step is held back: only testCaseFinished
     * knows whether a retry follows, and the reporter's per-context state must
     * not be cleared for a step whose attempt is repeated.
     */
    let pendingStepEnd: Record<string, unknown> | undefined

    const flushStepEnd = () => {
        if (!pendingStepEnd) { return }
        reporter.emit('test:end', formatMessage({ payload: pendingStepEnd }))
        pendingStepEnd = undefined
    }

    /**
     * Shared scenario payload — every event emitted for this scenario
     * (test:start, test:pass/fail, suite:end) uses the same uid and
     * metadata so reporters can pair start/end events.
     */
    const scenarioPayloadParams = {
        cid,
        specs,
        cucumberOpts,
        uri,
        feature,
        pickle,
        scenarioUID,
        featureUID,
    }

    // Enrich pickle steps with keywords from the feature
    if (pickle.steps && feature) {
        pickle.steps = addKeywordToStep(
            pickle.steps as ReporterStep[],
            feature
        )
    }

    // Build step lookup: testStepId → step metadata
    // Pre-index pickle steps by ID so the per-step join is O(1) instead of O(n).
    const pickleStepById = new Map<string, messages.PickleStep>()
    for (const s of pickle.steps || []) {
        pickleStepById.set(s.id, s)
    }
    const stepLookup = new Map<string, {
        pickleStep?: messages.PickleStep
        isHook: boolean
        hookTitle: string
        stepDefinitionIds: readonly string[]
    }>()
    for (const ts of testCase.testSteps) {
        stepLookup.set(ts.id, {
            pickleStep: ts.pickleStepId ? pickleStepById.get(ts.pickleStepId) : undefined,
            isHook: !!ts.hookId,
            hookTitle: (ts.hookId && supportCode.hookTitles.get(ts.hookId)) || '',
            stepDefinitionIds: ts.stepDefinitionIds ?? [],
        })
    }

    const onTestCaseStarted = (started: messages.TestCaseStarted) => {
        testStart = new Date()
        stepResults = []
        scenarioOpen = true
        pendingStepEnd = undefined

        // Mirrors sequential mode (cucumberFormatter.ts): retry attempts emit
        // `suite:retry` instead of `suite:start` in step-level mode, keeping
        // the event stream balanced (the final attempt closes with `suite:end`).
        const isRetry = typeof started.attempt === 'number' && started.attempt > 0
        reporter.emit(
            scenarioLevel ? 'test:start' : (isRetry ? 'suite:retry' : 'suite:start'),
            formatMessage({
                payload: {
                    ...buildScenarioPayload(scenarioPayloadParams),
                    contextId,
                    parentUid: featureUID,
                },
            })
        )
        eventEmitter.emit('getHookParams', { uri, feature, scenario: pickle })
    }

    const onTestStepStarted = (started: messages.TestStepStarted) => {
        if (scenarioLevel) { return }
        const info = stepLookup.get(started.testStepId)
        if (!info) { return }

        const step = info.pickleStep || { id: started.testStepId, text: info.hookTitle } as messages.PickleStep
        const type = info.isHook ? 'hook' : getStepType({ id: step.id, hookId: info.isHook ? 'hook' : undefined } as unknown as messages.TestStep)

        // Mirror cucumberFormatter.ts updateCurrentPickle so config
        // beforeHook/afterHook wrappers receive the executing step
        eventEmitter.emit('getHookParams', { uri, feature, scenario: pickle, step })

        // Per-step anchor so step/hook durations don't accumulate from scenario start
        stepStart = new Date()

        const payload = { ...buildStepPayload(uri, feature, pickle, step as ReporterStep, { type }), contextId, parentUid: scenarioUID }
        if (!info.isHook) {
            flushStepEnd()
            openStep = payload
        }
        reporter.emit(`${type}:start`, formatMessage({ payload }))
    }

    // Cucumber 13 sends no message for an ambiguous step, as in cucumberFormatter.ts withAmbiguousMessage
    const withAmbiguousMessage = (result: messages.TestStepResult, stepDefinitionIds: readonly string[] = []) => {
        if (result.status !== 'AMBIGUOUS' || result.message) { return result }
        const message = getAmbiguousStepMessage(stepDefinitionIds
            .map((id) => supportCode.stepDefinitions.get(id))
            .filter((definition): definition is messages.StepDefinition => Boolean(definition)))
        return message ? { ...result, message } : result
    }

    const onTestStepFinished = (finished: messages.TestStepFinished) => {
        const info = stepLookup.get(finished.testStepId)
        const result = withAmbiguousMessage(finished.testStepResult, info?.stepDefinitionIds)
        stepResults.push(result)

        if (scenarioLevel) { return }
        if (!info) { return }

        const step = info.pickleStep || { id: finished.testStepId, text: info.hookTitle } as messages.PickleStep
        const type = info.isHook ? 'hook' : getStepType({ id: step.id, hookId: info.isHook ? 'hook' : undefined } as unknown as messages.TestStep)
        const duration = stepStart ? Date.now() - stepStart.getTime() : 0

        if (type === 'hook') {
            let error: Error | undefined
            if (result.message) {
                error = new Error(result.message.split('\n')[0])
                error.stack = result.message
            }
            const payload = buildStepPayload(uri, feature, pickle, step as ReporterStep, {
                type: 'hook',
                state: result.status,
                error,
                duration,
            })
            reporter.emit('hook:end', formatMessage({ payload: { ...payload, parentUid: scenarioUID } }))
            return
        }

        const { state, error, pendingReason, titleSuffix } = getStepResult(
            result,
            {
                title: step.text,
                isStep: true,
                ignoreUndefinedDefinitions: cucumberOpts.ignoreUndefinedDefinitions,
                failAmbiguousDefinitions: cucumberOpts.failAmbiguousDefinitions,
                featureStack: () => getFeatureStack(uri, feature, pickle, step),
            }
        )
        const passed = ['pass', 'skip', 'pending'].includes(state)

        const payload = {
            ...buildStepPayload(uri, feature, pickle, step as ReporterStep, {
                type: 'step',
                state,
                error,
                ...(pendingReason ? { pendingReason } : {}),
                duration,
                passed,
            }),
            contextId,
            parentUid: scenarioUID,
        }
        payload.title += titleSuffix
        reporter.emit(`test:${state}`, formatMessage({ payload }))
        openStep = undefined
        pendingStepEnd = payload
    }

    /**
     * Closes the scenario event pair started in onTestCaseStarted. Mirrors the
     * sequential formatter (cucumberFormatter.ts onTestCaseFinished): step-level
     * mode emits a scenario `suite:end`, scenario-level mode emits `test:pass` /
     * `test:fail` resolved from the first non-passing step result (or the last).
     */
    const onTestCaseFinished = (finished: messages.TestCaseFinished) => {
        if (finished.willBeRetried) {
            pendingStepEnd = undefined
            return
        }
        scenarioOpen = false
        flushStepEnd()

        const duration = testStart ? Date.now() - testStart.getTime() : 0

        if (!scenarioLevel) {
            const payload = { ...buildScenarioPayload(scenarioPayloadParams), parentUid: featureUID, duration }
            reporter.emit('suite:end', formatMessage({ payload }))
            return
        }

        const finalResult = stepResults.find((r) => r.status !== 'PASSED') || stepResults[stepResults.length - 1]
        if (!finalResult) {
            // Empty scenario (no steps) — nothing failed
            const payload = { ...buildScenarioPayload(scenarioPayloadParams), parentUid: featureUID, state: 'pass', duration, passed: true }
            reporter.emit('test:pass', formatMessage({ payload }))
            reporter.emit('test:end', formatMessage({ payload: { ...payload, contextId } }))
            return
        }

        const { state, error, pendingReason, titleSuffix } = getStepResult(finalResult, {
            title: getTitle(pickle, cucumberOpts.tagsInTitle),
            isStep: false,
            ignoreUndefinedDefinitions: cucumberOpts.ignoreUndefinedDefinitions,
            failAmbiguousDefinitions: cucumberOpts.failAmbiguousDefinitions,
            featureStack: () => getFeatureStack(uri, feature, pickle),
        })
        const passed = ['pass', 'skip'].includes(state)
        const payload = {
            ...buildScenarioPayload(scenarioPayloadParams),
            parentUid: featureUID,
            state,
            error,
            ...(pendingReason ? { pendingReason } : {}),
            duration,
            passed,
        }
        payload.title += titleSuffix
        reporter.emit(`test:${state}`, formatMessage({ payload }))
        reporter.emit('test:end', formatMessage({ payload: { ...payload, contextId } }))
    }

    broadcaster.on('envelope', (envelope: messages.Envelope) => {
        if (envelope.testCaseStarted) { return onTestCaseStarted(envelope.testCaseStarted) }
        if (envelope.testStepStarted) { return onTestStepStarted(envelope.testStepStarted) }
        if (envelope.testStepFinished) { return onTestStepFinished(envelope.testStepFinished) }
        if (envelope.testCaseFinished) { return onTestCaseFinished(envelope.testCaseFinished) }
    })

    /**
     * runner.run() rejected mid-scenario: close whatever is open so the
     * reporter's per-context state is released.
     */
    return (error: Error) => {
        if (!scenarioOpen) { return }
        scenarioOpen = false
        const duration = testStart ? Date.now() - testStart.getTime() : 0
        if (scenarioLevel) {
            const payload = { ...buildScenarioPayload(scenarioPayloadParams), parentUid: featureUID, state: 'fail', error, duration, passed: false }
            reporter.emit('test:fail', formatMessage({ payload }))
            reporter.emit('test:end', formatMessage({ payload: { ...payload, contextId } }))
            return
        }
        if (openStep) {
            const payload = { ...openStep, state: 'fail', error, passed: false }
            reporter.emit('test:fail', formatMessage({ payload }))
            reporter.emit('test:end', formatMessage({ payload }))
            openStep = undefined
        }
        flushStepEnd()
        const payload = { ...buildScenarioPayload(scenarioPayloadParams), parentUid: featureUID, duration }
        reporter.emit('suite:end', formatMessage({ payload }))
    }
}

// ============================================================
// Scenario execution
// ============================================================

type ScenarioResult = { status: messages.TestStepResultStatus | 'SKIPPED'; name: string; duration: number }

/**
 * Mirrors Cucumber's shouldCauseFailure (runtime/helpers.js) plus WDIO's
 * ignoreUndefinedDefinitions extension: AMBIGUOUS/FAILED always fail,
 * UNDEFINED fails unless ignored, PENDING fails only under strict mode.
 * dryRun never fails (steps are skipped, not executed). A rejected result
 * is an infrastructure failure, not a test status — always failed.
 */
function isFailedResult(
    r: PromiseSettledResult<ScenarioResult>,
    cucumberOpts: Required<CucumberOptions>
): boolean {
    if (r.status === 'rejected') { return true }
    if (cucumberOpts.dryRun) { return false }
    const { status } = r.value
    return status === 'FAILED' || status === 'AMBIGUOUS' ||
        (status === 'UNDEFINED' && !cucumberOpts.ignoreUndefinedDefinitions) ||
        (status === 'PENDING' && cucumberOpts.strict)
}

async function runScenario(
    { pickle, group, index, allocation }: { pickle: messages.Pickle; group: FeatureGroup; index: number; allocation: ParallelContextAllocation },
    params: {
        reporter: EventEmitter
        eventEmitter: EventEmitter
        cid: string
        specs: string[]
        cucumberOpts: Required<CucumberOptions>
        supportCodeLibrary: SupportCodeLibrary
        runtimeOptions: IRuntimeOptions
        assembledTestCases: IAssembledTestCases
        parallelStore: AsyncLocalStorage<string>
        snippetBuilder: ISnippetBuilder
        supportCode: SupportCodeMessages
    }
): Promise<ScenarioResult> {
    const {
        reporter, eventEmitter, cid, specs, cucumberOpts,
        supportCodeLibrary, runtimeOptions, assembledTestCases, parallelStore, snippetBuilder, supportCode,
    } = params
    const contextId = allocation.context
    const testCase = assembledTestCases[pickle.id]

    if (!testCase) {
        log.warn(`No assembled test case for pickle "${pickle.name}"`)
        return { status: 'SKIPPED' as const, name: pickle.name, duration: 0 }
    }

    return parallelStore.run(contextId, async () => {
        const scenarioBroadcaster = new EventEmitter()

        const abortScenario = wireScenarioTranslator({
            broadcaster: scenarioBroadcaster,
            reporter,
            eventEmitter,
            cid,
            specs,
            gherkinDocument: group.gherkinDocument,
            featureUID: group.uid,
            pickle,
            testCase,
            cucumberOpts,
            scenarioIndex: index,
            contextId,
            supportCode,
        })

        // skip: dryRun mirrors Cucumber's Runtime (runtime/index.js)
        const runner = new TestCaseRunner({
            eventBroadcaster: scenarioBroadcaster,
            gherkinDocument: group.gherkinDocument,
            newId: IdGenerator.uuid(),
            pickle,
            testCase,
            retries: retriesForPickle(pickle, runtimeOptions),
            skip: runtimeOptions.dryRun,
            filterStackTraces: true,
            supportCodeLibrary,
            worldParameters: runtimeOptions.worldParameters,
            snippetBuilder,
        })

        const testStart = Date.now()
        let status: messages.TestStepResultStatus
        try {
            status = await runner.run()
        } catch (err) {
            abortScenario(err as Error)
            throw err
        }
        const duration = Date.now() - testStart

        return { status, name: pickle.name, duration }
    })
}

// ============================================================
// Main entry point — replaces runCucumber() for parallel mode
// ============================================================

export async function runParallelCucumber(params: {
    browser: WebdriverIO.Browser
    reporter: EventEmitter
    eventEmitter: EventEmitter
    cid: string
    specs: string[]
    gherkinDocuments: (messages.GherkinDocument | messages.GherkinDocument[])[]
    supportCodeLibrary: SupportCodeLibrary
    cucumberOpts: Required<CucumberOptions>
    rootDir?: string
}): Promise<number> {
    if (!isParallelAvailable()) {
        throw new Error(
            'Cucumber parallel mode is not available because internal Cucumber modules ' +
            'could not be loaded. This is likely due to a version mismatch with @cucumber/cucumber. ' +
            'Check the logs for the specific module resolution error.'
        )
    }

    const {
        browser, reporter, eventEmitter, cid, specs,
        gherkinDocuments, supportCodeLibrary, cucumberOpts, rootDir,
    } = params
    const bidi = browser as ParallelBrowser
    const worldParams = (cucumberOpts.worldParameters || {}) as Record<string, unknown>

    // --- 1. Collect feature groups with pickles ---
    // Filter at pickle level like Cucumber's filter plugin does at runtime.
    // index.ts init() already combined the dynamic skip tags and user tags
    // into cucumberOpts.tags and filtered the specs at feature level via
    // loadSources; this drops the non-matching scenarios inside kept features.
    const pickleFilter = new PickleFilter({
        cwd: process.cwd(),
        featurePaths: specs,
        names: cucumberOpts.name,
        tagExpression: cucumberOpts.tags,
    })
    const featureGroups = collectFeatureGroups(gherkinDocuments, rootDir)
        .map((group) => ({
            ...group,
            pickles: group.pickles.filter((pickle) =>
                pickleFilter.matches({ gherkinDocument: group.gherkinDocument, pickle })
            ),
        }))
        .filter((g) => g.pickles.length > 0)
    const allPickles = featureGroups.flatMap((g) => g.pickles)
    // as Cucumber's filter plugin does in sequential mode
    orderPickles(allPickles, cucumberOpts.order, log)

    if (allPickles.length === 0) {
        log.info('No scenarios found for parallel execution.')
        return 0
    }

    // --- Build pickle → group lookup (O(1) instead of O(n²)) ---
    const pickleToGroup = new Map<messages.Pickle, FeatureGroup>()
    for (const g of featureGroups) {
        for (const p of g.pickles) {
            pickleToGroup.set(p, g)
        }
    }

    // --- 2. Determine concurrency cap ---
    const maxContexts = resolveMaxContexts(cucumberOpts.maxParallelContexts, 1)
    const slotCount = Math.min(maxContexts, allPickles.length)
    const failFast = cucumberOpts.failFast || false

    log.info(
        `[Parallel] Collected ${allPickles.length} scenarios across ${featureGroups.length} feature(s). ` +
        `Slots: ${slotCount}, max contexts: ${maxContexts}`
    )

    const mode: ParallelMode = cucumberOpts.parallelMode === 'userContexts' ? 'userContexts' : 'contexts'
    if (mode === 'userContexts' && !bidi.browserCreateUserContext) {
        throw new Error(
            'cucumberOpts.parallelMode "userContexts" requires browser.createUserContext, ' +
            'which this driver does not provide. Use a driver with BiDi user context support ' +
            'or set parallelMode to "contexts" (shares cookies and storage between scenarios).'
        )
    }

    const parallelStore = bidi.__parallelContextStore as AsyncLocalStorage<string>
    if (!parallelStore) {
        throw new Error('Parallel context store not found on browser instance.')
    }
    const parallelContexts = bidi.__parallelContexts
    if (!parallelContexts) {
        throw new Error(
            'Parallel context registry not found on browser instance. ' +
            'The session ContextManager must expose __parallelContexts for re-anchor protection.'
        )
    }

    const runtimeOptions: IRuntimeOptions = {
        dryRun: cucumberOpts.dryRun || false,
        failFast,
        filterStacktraces: true,
        retry: cucumberOpts.retry || 0,
        retryTagFilter: cucumberOpts.retryTagFilter || '',
        strict: cucumberOpts.strict || false,
        worldParameters: worldParams,
    }

    const testRunStartedId = uuidFn()
    const runBroadcaster = new EventEmitter()
    runBroadcaster.on('envelope', (envelope: messages.Envelope) => {
        const result = envelope.testRunHookFinished?.result
        if (result?.status === 'FAILED') {
            log.error(`Test run hook failed: ${result.exception?.message ?? result.message}`)
        }
    })
    const snippetBuilder = await FormatterBuilder.getStepDefinitionSnippetBuilder({
        cwd: process.cwd(),
        snippetInterface: cucumberOpts.snippetInterface,
        snippetSyntax: cucumberOpts.snippetSyntax,
        supportCodeLibrary,
    })
    const executor = new Executor(
        testRunStartedId, undefined, runBroadcaster, uuidFn,
        runtimeOptions, supportCodeLibrary, snippetBuilder
    )

    // BeforeAll side effects cannot be replayed by a sequential fallback
    executionStarted = true
    const beforeAllOk = await runTestRunHooks(eventEmitter, () => executor.runBeforeAllHooks(), featureGroups, 'a BeforeAll')

    emitFeatureSuiteEvents(reporter, cid, specs, featureGroups, 'suite:start')

    // Once BeforeAll ran, AfterAll and suite:end must run even if assembly or
    // context allocation throws; the error is rethrown afterwards.
    let runFailure: { error: unknown } | undefined
    // --- 5. Assemble test cases ---
    // Mirrors Cucumber's coordinator: a failed BeforeAll skips assembly and scenarios.
    const assembledTestCases: IAssembledTestCases = {}
    if (beforeAllOk) {
        try {
            const assembled = await assembleTestCases(
                testRunStartedId,
                runBroadcaster,
                uuidFn,
                allPickles.map((pickle) => ({ gherkinDocument: pickleToGroup.get(pickle)!.gherkinDocument, pickle })),
                supportCodeLibrary
            )
            for (const { pickle, testCase } of assembled) {
                assembledTestCases[pickle.id] = testCase
            }
        } catch (error) {
            runFailure = { error }
        }
    } else {
        log.error(`[Parallel] BeforeAll hook failed — skipping ${allPickles.length} scenario(s).`)
    }

    // --- 7. Run scenarios through the slot pool ---
    // Each slot owns one live window and at most one closing. The run keeps a
    // shared pool of spares, never more than the scenarios not yet taken, so
    // window create/close stays off the gap between scenarios.
    const runStart = Date.now()
    const allResults: PromiseSettledResult<ScenarioResult>[] = []
    const cleanups: Promise<void>[] = []
    const runParams = {
        reporter, eventEmitter, cid, specs, cucumberOpts, supportCodeLibrary,
        runtimeOptions, assembledTestCases, parallelStore, snippetBuilder,
        supportCode: collectSupportCodeMessages(supportCodeLibrary),
    }
    let cursor = beforeAllOk && !runFailure ? 0 : allPickles.length
    const spares: Promise<ParallelContextAllocation>[] = []
    let stopped = false
    let allocationFailed = false
    let allocationError: unknown

    const runSlot = async () => {
        let pendingClose: Promise<void> | undefined
        // A close failure is reported through `cleanups`; here we only serialize.
        const closeInBackground = async (allocation: ParallelContextAllocation) => {
            await pendingClose?.catch(() => {})
            pendingClose = cleanupAllocation(bidi, allocation)
            cleanups.push(pendingClose)
        }
        while (!stopped) {
            const index = cursor++
            if (index >= allPickles.length) { break }
            let allocation: ParallelContextAllocation
            try {
                allocation = await (spares.shift() ?? allocateContext(bidi, mode))
            } catch (err) {
                if (!allocationFailed) { allocationFailed = true; allocationError = err }
                stopped = true
                break
            }
            if (!stopped && allPickles.length - cursor > spares.length) {
                const next = allocateContext(bidi, mode)
                next.catch(() => {})
                spares.push(next)
            }
            const pickle = allPickles[index]
            let result: PromiseSettledResult<ScenarioResult>
            try {
                result = {
                    status: 'fulfilled',
                    value: await runScenario({ pickle, group: pickleToGroup.get(pickle)!, index, allocation }, runParams),
                }
            } catch (reason) {
                result = { status: 'rejected', reason }
            } finally {
                await closeInBackground(allocation)
            }
            allResults.push(result)
            if (failFast && isFailedResult(result, cucumberOpts)) { stopped = true }
        }
    }

    try {
        await Promise.all(Array.from({ length: slotCount }, runSlot))
    } catch (error) {
        runFailure ??= { error }
    } finally {
        for (const spare of spares.splice(0)) {
            const unused = await spare.catch(() => undefined)
            if (unused) { cleanups.push(cleanupAllocation(bidi, unused)) }
        }
        const settled = await Promise.allSettled(cleanups)
        for (const r of settled) {
            if (r.status === 'rejected') { log.warn(`[Parallel] cleanup failed: ${(r.reason as Error).message}`) }
        }
    }
    if (allocationFailed) { runFailure = { error: allocationError } }

    if (!runFailure && failFast && stopped) {
        // Mirror Cucumber's failFast: remaining pickles report as skipped
        // (the runtime runs them with the runner's skip flag) instead of
        // vanishing — the summary math reconciles passed + failed + skipped.
        const firstUnrun = Math.min(cursor, allPickles.length)
        for (let i = firstUnrun; i < allPickles.length; i++) {
            const pickle = allPickles[i]
            emitSkippedScenario(
                reporter, cid, specs, cucumberOpts,
                pickleToGroup.get(pickle)!, pickle, i
            )
        }
        log.info(
            '[Parallel] failFast enabled — stopping after first failure. ' +
            `${allPickles.length - firstUnrun} scenario(s) skipped (not executed).`
        )
    }

    const totalDuration = Date.now() - runStart

    emitFeatureSuiteEvents(reporter, cid, specs, [...featureGroups].reverse(), 'suite:end')

    const afterAllOk = await runTestRunHooks(eventEmitter, () => executor.runAfterAllHooks(), featureGroups, 'an AfterAll')
    if (runFailure) { throw runFailure.error }

    let passed = 0, failed = 0, skipped = allPickles.length - allResults.length
    for (const r of allResults) {
        if (isFailedResult(r, cucumberOpts)) {
            failed++
        } else if (r.status === 'fulfilled' && r.value.status === 'SKIPPED') {
            skipped++
        } else {
            passed++
        }
    }
    const hookFailures = Number(!beforeAllOk) + Number(!afterAllOk)

    log.info(
        `[Parallel] ${allPickles.length} scenarios: ${passed} passed, ${failed} failed, ${skipped} skipped in ${totalDuration}ms`
    )

    return failed + hookFailures
}
