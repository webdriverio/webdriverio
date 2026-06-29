/**
 * Parallel scenario execution for the Cucumber framework adapter.
 *
 * When `cucumberOpts.parallelMode: 'contexts'` is set, this module
 * replaces the sequential `runCucumber()` call with parallel execution:
 *   1. Parse Gherkin feature files to collect all pickles (scenarios)
 *   2. Pre-create browsing contexts (tabs) in batches, capped at
 *      `maxParallelContexts`
 *   3. Run scenarios in batches via Promise.allSettled()
 *   4. Each scenario runs inside an AsyncLocalStorage scope that
 *      overrides ContextManager.getCurrentContext() — every
 *      command (url, $, click, setValue, getText, etc.) targets
 *      the correct context with zero Proxy or special-casing.
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
import Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type * as messages from '@cucumber/messages'

import type { CucumberOptions, ParallelBrowser, ReporterStep } from './types.js'
import {
    addKeywordToStep,
    convertStatus,
    getFeatureId,
    getRule,
    getScenarioDescription,
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
 * `@cucumber/cucumber/lib/runtime/*` and are NOT part of Cucumber's
 * public API — they can move or be renamed in any release.
 */
let parallelModulesAvailable = true

// ============================================================

/** Maps pickle IDs to assembled TestCase objects. */
interface IAssembledTestCases {
    [pickleId: string]: messages.TestCase
}

interface IAssembleTestCasesOptions {
    eventBroadcaster: EventEmitter
    newId: IdGenerator.NewId
    pickles: messages.Pickle[]
    supportCodeLibrary: SupportCodeLibrary
}

/** A lightweight stopwatch used by TestCaseRunner. */
interface IStopwatch {
    start(): IStopwatch
    stop(): IStopwatch
    duration(): messages.Duration
    timestamp(): messages.Timestamp
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

interface INewTestCaseRunnerOptions {
    eventBroadcaster: EventEmitter
    stopwatch: IStopwatch
    gherkinDocument: messages.GherkinDocument
    newId: IdGenerator.NewId
    pickle: messages.Pickle
    testCase: messages.TestCase
    retries: number
    skip: boolean
    filterStackTraces: boolean
    supportCodeLibrary: SupportCodeLibrary
    worldParameters: Record<string, unknown>
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

// ============================================================
// Load Cucumber internal modules via CJS require
// ============================================================

let assembleTestCases: (opts: IAssembleTestCasesOptions) => Promise<IAssembledTestCases>
let createStopwatch: (base?: messages.Duration) => IStopwatch
let retriesForPickle: (pickle: messages.Pickle, options: IRuntimeOptions) => number
let makeRunTestRunHooks: (
    dryRun: boolean,
    defaultTimeout: number,
    worldParameters: Record<string, unknown>,
    errorMessage: (name: string, location: string) => string
) => (definitions: TestRunHookDefinition[], name: string) => Promise<void>
let TestCaseRunner: { new (options: INewTestCaseRunnerOptions): TestCaseRunnerInstance }

try {
    ;({ assembleTestCases } = require_('@cucumber/cucumber/lib/runtime/assemble_test_cases') as {
        assembleTestCases: (opts: IAssembleTestCasesOptions) => Promise<IAssembledTestCases>
    })

    ;({ create: createStopwatch } = require_('@cucumber/cucumber/lib/runtime/stopwatch') as {
        create: (base?: messages.Duration) => IStopwatch
    })

    ;({ retriesForPickle } = require_('@cucumber/cucumber/lib/runtime/helpers') as {
        retriesForPickle: (pickle: messages.Pickle, options: IRuntimeOptions) => number
    })

    ;({ makeRunTestRunHooks } = require_('@cucumber/cucumber/lib/runtime/run_test_run_hooks') as {
        makeRunTestRunHooks: (
            dryRun: boolean,
            defaultTimeout: number,
            worldParameters: Record<string, unknown>,
            errorMessage: (name: string, location: string) => string
        ) => (definitions: TestRunHookDefinition[], name: string) => Promise<void>
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
// Context pre-allocation
// ============================================================

async function preallocateContexts(
    browser: WebdriverIO.Browser,
    count: number
): Promise<string[]> {
    const bidi = browser as ParallelBrowser
    const results = await Promise.allSettled(
        Array.from({ length: count }, () =>
            bidi.browsingContextCreate({ type: 'tab' })
        )
    )
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
        // Close any successfully-created contexts before throwing
        const created = results
            .filter((r): r is PromiseFulfilledResult<{ context: string }> => r.status === 'fulfilled')
            .map((r) => r.value.context)
        await Promise.allSettled(
            created.map((ctx) => bidi.browsingContextClose({ context: ctx }).catch(
                (err) => { log.warn(`[Parallel] preallocate rollback: failed to close context ${ctx}: ${(err as Error).message}`) }
            ))
        )
        throw (failed[0] as PromiseRejectedResult).reason
    }
    return (results as PromiseFulfilledResult<{ context: string }>[]).map((r) => r.value.context)
}

// ============================================================
// Feature-grouped pickle collection
// ============================================================

interface FeatureGroup {
    uri: string
    gherkinDocument: messages.GherkinDocument
    pickles: messages.Pickle[]
}

function collectFeatureGroups(
    gherkinDocuments: (messages.GherkinDocument | messages.GherkinDocument[])[]
): FeatureGroup[] {
    return gherkinDocuments
        .flatMap((docOrDocs) => {
            const docs = [docOrDocs].flat(1) as messages.GherkinDocument[]
            return docs.map((doc) => ({
                uri: doc.uri || '',
                gherkinDocument: doc,
                pickles: Gherkin.compile(doc, '', uuidFn) as messages.Pickle[],
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
        uid: getFeatureId(doc.uri as string, doc.feature as messages.Feature),
        title: getTitle(doc.feature as messages.Feature),
        type: 'feature' as const,
        file: doc.uri,
        tags: doc.feature?.tags,
        cid,
        specs,
    }
    reporter.emit(event, formatMessage({ payload }))
}

// ============================================================
// Feature-level helpers
// ============================================================

async function runFeatureHooks(
    eventEmitter: EventEmitter,
    runHooks: ReturnType<typeof makeRunTestRunHooks>,
    groups: FeatureGroup[],
    hookDefinitions: TestRunHookDefinition[],
    hookName: string
): Promise<void> {
    for (const group of groups) {
        eventEmitter.emit('getHookParams', {
            uri: group.uri,
            feature: group.gherkinDocument.feature,
        })
        try {
            await runHooks(hookDefinitions, hookName)
        } catch (err) {
            log.error(
                `${hookName} hook failed for "${group.uri}": ${(err as Error).message}`
            )
        }
    }
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
    cid: string
    specs: string[]
    gherkinDocument: messages.GherkinDocument
    pickle: messages.Pickle
    testCase: messages.TestCase
    cucumberOpts: Required<CucumberOptions>
    scenarioIndex: number
}

function wireScenarioTranslator(params: ScenarioTranslatorParams) {
    const {
        broadcaster, reporter, cid, specs,
        gherkinDocument, pickle, testCase, cucumberOpts,
        scenarioIndex,
    } = params

    const uri = gherkinDocument.uri || ''
    const feature = gherkinDocument.feature as messages.Feature
    const scenarioUID = `scenario-${cid}-${scenarioIndex}`
    const scenarioLevel = cucumberOpts.scenarioLevelReporter !== false

    let testStart: Date | undefined

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
    }>()
    for (const ts of testCase.testSteps) {
        stepLookup.set(ts.id, {
            pickleStep: ts.pickleStepId ? pickleStepById.get(ts.pickleStepId) : undefined,
            isHook: !!ts.hookId,
        })
    }

    const onTestCaseStarted = (_started: messages.TestCaseStarted) => {
        testStart = new Date()

        const reporterScenario = { ...pickle, id: scenarioUID } as unknown as messages.Pickle & { rule?: string }
        reporterScenario.rule = getRule(feature, pickle.astNodeIds[0])

        const payload = {
            uid: scenarioUID,
            title: getTitle(pickle, cucumberOpts.tagsInTitle),
            parent: getFeatureId(uri, feature),
            type: 'scenario',
            description: getScenarioDescription(feature, pickle.astNodeIds[0]),
            file: uri,
            tags: pickle.tags,
            rule: reporterScenario.rule,
            cid,
            specs,
        }
        reporter.emit(
            scenarioLevel ? 'test:start' : 'suite:start',
            formatMessage({ payload })
        )
    }

    const onTestStepStarted = (started: messages.TestStepStarted) => {
        if (scenarioLevel) { return }
        const info = stepLookup.get(started.testStepId)
        if (!info) { return }

        const step = info.pickleStep || { id: started.testStepId, text: '' } as messages.PickleStep
        const type = info.isHook ? 'hook' : getStepType({ id: step.id, hookId: info.isHook ? 'hook' : undefined } as unknown as messages.TestStep)

        const payload = buildStepPayload(uri, feature, pickle, step as ReporterStep, { type })
        reporter.emit(`${type}:start`, formatMessage({ payload }))
    }

    const onTestStepFinished = (finished: messages.TestStepFinished) => {
        if (scenarioLevel) { return }
        const info = stepLookup.get(finished.testStepId)
        if (!info) { return }

        const result = finished.testStepResult
        const step = info.pickleStep || { id: finished.testStepId, text: '' } as messages.PickleStep
        const type = info.isHook ? 'hook' : getStepType({ id: step.id, hookId: info.isHook ? 'hook' : undefined } as unknown as messages.TestStep)

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
                duration: testStart ? Date.now() - testStart.getTime() : 0,
            })
            reporter.emit('hook:end', formatMessage({ payload }))
            return
        }

        const state = convertStatus(result.status)
        const error = result.message ? new Error(result.message) : undefined
        const duration = testStart ? Date.now() - testStart.getTime() : 0
        const passed = ['pass', 'skip', 'pending'].includes(state)

        const payload = buildStepPayload(uri, feature, pickle, step as ReporterStep, {
            type: 'step',
            state,
            error,
            duration,
            passed,
        })
        reporter.emit(`test:${state}`, formatMessage({ payload }))
        reporter.emit('test:end', { ...formatMessage({ payload }), passed })
    }

    broadcaster.on('envelope', (envelope: messages.Envelope) => {
        if (envelope.testCaseStarted) { return onTestCaseStarted(envelope.testCaseStarted) }
        if (envelope.testStepStarted) { return onTestStepStarted(envelope.testStepStarted) }
        if (envelope.testStepFinished) { return onTestStepFinished(envelope.testStepFinished) }
    })
}

// ============================================================
// Concurrency batching
// ============================================================

type ScenarioResult = { status: messages.TestStepResultStatus | 'SKIPPED'; name: string; duration: number }

function isFailedResult(r: PromiseSettledResult<ScenarioResult>): boolean {
    return r.status === 'rejected' ||
        (r.status === 'fulfilled' && r.value.status !== 'PASSED' && r.value.status !== 'SKIPPED')
}

async function runBatch(
    batch: { pickle: messages.Pickle; group: FeatureGroup; index: number; contextId: string }[],
    params: {
        browser: WebdriverIO.Browser
        reporter: EventEmitter
        cid: string
        specs: string[]
        cucumberOpts: Required<CucumberOptions>
        supportCodeLibrary: SupportCodeLibrary
        runtimeOptions: IRuntimeOptions
        assembledTestCases: IAssembledTestCases
        parallelStore: AsyncLocalStorage<string>
    }
): Promise<PromiseSettledResult<ScenarioResult>[]> {
    const {
        browser, reporter, cid, specs, cucumberOpts,
        supportCodeLibrary, runtimeOptions, assembledTestCases, parallelStore,
    } = params
    const bidi = browser as ParallelBrowser

    return Promise.allSettled(
        batch.map(async ({ pickle, group, index, contextId }) => {
            const testCase = assembledTestCases[pickle.id]

            if (!testCase) {
                log.warn(`No assembled test case for pickle "${pickle.name}"`)
                return { status: 'SKIPPED' as const, name: pickle.name, duration: 0 }
            }

            return parallelStore.run(contextId, async () => {
                const scenarioBroadcaster = new EventEmitter()
                const stopwatch = createStopwatch()

                wireScenarioTranslator({
                    broadcaster: scenarioBroadcaster,
                    reporter,
                    cid,
                    specs,
                    gherkinDocument: group.gherkinDocument,
                    pickle,
                    testCase,
                    cucumberOpts,
                    scenarioIndex: index,
                })

                const runner = new TestCaseRunner({
                    eventBroadcaster: scenarioBroadcaster,
                    stopwatch,
                    gherkinDocument: group.gherkinDocument,
                    newId: IdGenerator.uuid(),
                    pickle,
                    testCase,
                    retries: retriesForPickle(pickle, runtimeOptions),
                    skip: false,
                    filterStackTraces: true,
                    supportCodeLibrary,
                    worldParameters: runtimeOptions.worldParameters,
                })

                const testStart = Date.now()
                const status = await runner.run()
                const duration = Date.now() - testStart

                return { status, name: pickle.name, duration }
            }).finally(async () => {
                await bidi.browsingContextClose({ context: contextId })
                    .catch((err) => {
                        log.debug(
                            `Cleanup error closing context ${contextId}: ${(err as Error).message}`
                        )
                    })
            })
        })
    )
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
        gherkinDocuments, supportCodeLibrary, cucumberOpts,
    } = params
    const bidi = browser as ParallelBrowser
    const worldParams = (cucumberOpts.worldParameters || {}) as Record<string, unknown>

    // --- 1. Collect feature groups with pickles ---
    const featureGroups = collectFeatureGroups(gherkinDocuments)
    const allPickles = featureGroups.flatMap((g) => g.pickles)

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
    const maxContexts = Math.max(1, cucumberOpts.maxParallelContexts || 1)
    const batchSize = Math.min(maxContexts, allPickles.length)
    const failFast = cucumberOpts.failFast || false

    log.info(
        `[Parallel] Collected ${allPickles.length} scenarios across ${featureGroups.length} feature(s). ` +
        `Batch size: ${batchSize}, max contexts: ${maxContexts}`
    )

    const parallelStore = bidi.__parallelContextStore as AsyncLocalStorage<string>
    if (!parallelStore) {
        throw new Error('Parallel context store not found on browser instance.')
    }

    const runHooks = makeRunTestRunHooks(
        false,
        supportCodeLibrary.defaultTimeout,
        worldParams,
        (hookName: string, location: string) =>
            `Hook "${hookName}" errored at ${location}`
    )

    await runFeatureHooks(eventEmitter, runHooks, featureGroups,
        supportCodeLibrary.beforeTestRunHookDefinitions, 'a BeforeAll')

    emitFeatureSuiteEvents(reporter, cid, specs, featureGroups, 'suite:start')

    // --- 5. Assemble test cases ---
    const assembleBroadcaster = new EventEmitter()
    const assembledTestCases = await assembleTestCases({
        eventBroadcaster: assembleBroadcaster,
        newId: uuidFn,
        pickles: allPickles,
        supportCodeLibrary,
    })

    // --- 6. Runtime options for TestCaseRunner ---
    const runtimeOptions: IRuntimeOptions = {
        dryRun: cucumberOpts.dryRun || false,
        failFast,
        filterStacktraces: true,
        retry: cucumberOpts.retry || 0,
        retryTagFilter: cucumberOpts.retryTagFilter || '',
        strict: cucumberOpts.strict || false,
        worldParameters: worldParams,
    }

    // --- 7. Run scenarios in batches ---
    const runStart = Date.now()
    const allResults: PromiseSettledResult<ScenarioResult>[] = []

    for (let batchStart = 0; batchStart < allPickles.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, allPickles.length)
        const currentBatchSize = batchEnd - batchStart

        // Pre-allocate fresh contexts for this batch (closed per-scenario in runBatch)
        const allocStart = Date.now()
        const contexts = await preallocateContexts(browser, currentBatchSize)
        log.info(`[Parallel] ${contexts.length} contexts created in ${Date.now() - allocStart}ms`)

        const batch: { pickle: messages.Pickle; group: FeatureGroup; index: number; contextId: string }[] = []

        for (let i = batchStart; i < batchEnd; i++) {
            const pickle = allPickles[i]
            const group = pickleToGroup.get(pickle)!
            batch.push({
                pickle,
                group,
                index: i,  // stable array index, not a shared mutable counter
                contextId: contexts[i - batchStart],
            })
        }

        log.info(`[Parallel] Running batch ${Math.floor(batchStart / batchSize) + 1}: scenarios ${batchStart + 1}-${batchEnd}`)

        const batchResults = await runBatch(batch, {
            browser,
            reporter,
            cid,
            specs,
            cucumberOpts,
            supportCodeLibrary,
            runtimeOptions,
            assembledTestCases,
            parallelStore,
        })
        allResults.push(...batchResults)

        if (failFast && batchResults.some(isFailedResult)) {
            log.info('[Parallel] failFast enabled — stopping after first batch with failures.')
            break
        }
    }

    const totalDuration = Date.now() - runStart

    emitFeatureSuiteEvents(reporter, cid, specs, [...featureGroups].reverse(), 'suite:end')

    await runFeatureHooks(eventEmitter, runHooks, [...featureGroups].reverse(),
        supportCodeLibrary.afterTestRunHookDefinitions, 'an AfterAll')

    let passed = 0, failed = 0
    for (const r of allResults) {
        if (isFailedResult(r)) { failed++ } else { passed++ }
    }

    log.info(
        `[Parallel] ${allPickles.length} scenarios: ${passed} passed, ${failed} failed in ${totalDuration}ms`
    )

    return failed
}
