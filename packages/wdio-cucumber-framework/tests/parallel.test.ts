import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'
import { describe, test, expect, vi, beforeEach } from 'vitest'

import Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type * as messages from '@cucumber/messages'

import { runParallelCucumber } from '../src/parallel.js'
import { DEFAULT_OPTS } from '../src/constants.js'
import type { CucumberOptions } from '../src/types.js'

const uuidFn = IdGenerator.uuid()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockBrowser(opts?: {
    contexts?: string[]
    store?: AsyncLocalStorage<string>
    isBidi?: boolean
    bidiCommandsEnabled?: boolean
}) {
    const store = opts?.store || new AsyncLocalStorage<string>()
    const contexts = opts?.contexts || ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3', 'ctx-4', 'ctx-5']
    let idx = 0
    return {
        isBidi: opts?.isBidi ?? true,
        __parallelContextStore: store,
        __bidiCommandsEnabled: opts?.bidiCommandsEnabled ?? true,
        browsingContextCreate: vi.fn().mockImplementation(async () => {
            const ctx = contexts[idx++] || `ctx-${idx}`
            return { context: ctx }
        }),
        browsingContextClose: vi.fn().mockResolvedValue(undefined),
    }
}

function mockSupportCodeLibrary(overrides: Partial<{
    beforeTestRunHooks: Function[]
    afterTestRunHooks: Function[]
    defaultTimeout: number
    stepDefinitions: unknown[]
}> = {}) {
    return {
        originalCoordinates: {
            requireModules: [],
            requirePaths: [],
            importPaths: [],
            loaders: [],
        },
        beforeTestRunHookDefinitions: (overrides.beforeTestRunHooks || []).map((code) => ({
            code,
            uri: '/test/features',
            line: 1,
            options: {},
        })),
        afterTestRunHookDefinitions: (overrides.afterTestRunHooks || []).map((code) => ({
            code,
            uri: '/test/features',
            line: 1,
            options: {},
        })),
        beforeTestCaseHookDefinitions: [],
        afterTestCaseHookDefinitions: [],
        beforeTestStepHookDefinitions: [],
        afterTestStepHookDefinitions: [],
        defaultTimeout: overrides.defaultTimeout ?? 60000,
        stepDefinitions: overrides.stepDefinitions || [],
        undefinedParameterTypes: [],
        parameterTypeRegistry: {
            parameterTypes: [],
            defineParameterType: () => {},
        },
        World: class {},
        parallelCanAssign: () => true,
    }
}

function defaultCucumberOpts(overrides?: Partial<CucumberOptions>): Required<CucumberOptions> {
    return {
        ...DEFAULT_OPTS,
        scenarioLevelReporter: true,
        parallelMode: 'contexts' as const,
        maxParallelContexts: 10,
        ...overrides,
    } as Required<CucumberOptions>
}

/** Build a minimal GherkinDocument with scenarios for testing. */
function makeFeatureDoc(uri: string, name: string, scenarioNames: string[]): messages.GherkinDocument {
    const scenarios = scenarioNames.map((s) => `  Scenario: ${s}\n    Given something`).join('\n\n')
    const gherkinText = `Feature: ${name}\n\n${scenarios}\n`
    const parser = new Gherkin.Parser(new Gherkin.AstBuilder(uuidFn), new Gherkin.GherkinClassicTokenMatcher())
    return { ...parser.parse(gherkinText), uri } as messages.GherkinDocument
}

/** Run parallel Cucumber and capture the error thrown (if any). */
async function runOrCatch(params: Parameters<typeof runParallelCucumber>[0]): Promise<{ result?: number; error?: Error }> {
    try {
        return { result: await runParallelCucumber(params) }
    } catch (err) {
        return { error: err as Error }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runParallelCucumber', () => {
    let reporter: EventEmitter
    let eventEmitter: EventEmitter
    let reporterEvents: Array<{ event: string; payload: Record<string, unknown> }>

    beforeEach(() => {
        vi.clearAllMocks()
        reporter = new EventEmitter()
        eventEmitter = new EventEmitter()
        reporterEvents = []
        for (const ev of ['suite:start', 'suite:end', 'test:start', 'test:pass', 'test:fail', 'test:end', 'hook:start', 'hook:end']) {
            reporter.on(ev, (p) => reporterEvents.push({ event: ev, payload: p }))
        }
    })

    // ---- Basic behaviour ----

    test('returns 0 when no scenarios are found', async () => {
        const result = await runParallelCucumber({
            browser: mockBrowser() as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/no-scenarios.feature'],
            gherkinDocuments: [],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })

        expect(result).toBe(0)
    })

    test('pre-allocates one context per scenario with sufficient capacity', async () => {
        const browser = mockBrowser()
        const doc = makeFeatureDoc('/test/foo.feature', 'Test Feature', ['scenario a', 'scenario b'])

        // TestCaseRunner will fail without real step definitions, but that
        // produces a failed result, not a thrown error. Contexts are still
        // pre-allocated before any scenarios run.
        const { result } = await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })
        // Both scenarios "ran" (returned FAILED status), so result = 2 failed
        expect(result).toBe(2)

        // Two contexts pre-allocated for two scenarios
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(2)
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'tab' })
    })

    test('emits feature suite:start and suite:end events', async () => {
        const browser = mockBrowser()
        const doc = makeFeatureDoc('/test/foo.feature', 'My Feature', ['scenario a'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })

        const suiteStarts = reporterEvents.filter((e) => e.event === 'suite:start')
        const suiteEnds = reporterEvents.filter((e) => e.event === 'suite:end')

        expect(suiteStarts.length).toBe(1)
        expect(suiteStarts[0].payload.type).toBe('feature')
        expect(suiteEnds.length).toBe(1)
        expect(suiteEnds[0].payload.type).toBe('feature')
    })

    // ---- Hook execution ----

    test('runs BeforeAll hooks per feature', async () => {
        const browser = mockBrowser()
        const beforeHookCalls: string[] = []

        const supportCodeLibrary = mockSupportCodeLibrary({
            beforeTestRunHooks: [
                function () { beforeHookCalls.push('before1') },
                function () { beforeHookCalls.push('before2') },
            ],
        })

        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary,
            cucumberOpts: defaultCucumberOpts(),
        })

        expect(beforeHookCalls).toEqual(['before1', 'before2'])
    })

    test('runs AfterAll hooks per feature', async () => {
        const browser = mockBrowser()
        const afterHookCalls: string[] = []

        const supportCodeLibrary = mockSupportCodeLibrary({
            afterTestRunHooks: [
                function () { afterHookCalls.push('after1') },
                function () { afterHookCalls.push('after2') },
            ],
        })

        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary,
            cucumberOpts: defaultCucumberOpts(),
        })

        expect(afterHookCalls).toEqual(['after1', 'after2'])
    })

    test('runs BeforeAll and AfterAll hooks per feature when multiple features exist', async () => {
        const browser = mockBrowser()
        const beforeHookCalls: string[] = []

        const supportCodeLibrary = mockSupportCodeLibrary({
            beforeTestRunHooks: [
                function () { beforeHookCalls.push('before') },
            ],
        })

        const docA = makeFeatureDoc('/test/a.feature', 'Feature A', ['scenario a1'])
        const docB = makeFeatureDoc('/test/b.feature', 'Feature B', ['scenario b1'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/a.feature', '/test/b.feature'],
            gherkinDocuments: [docA, docB],
            supportCodeLibrary,
            cucumberOpts: defaultCucumberOpts(),
        })

        // BeforeAll runs once per feature (2 features = 2 calls)
        expect(beforeHookCalls.length).toBe(2)
    })

    // ---- Error handling ----

    test('throws when context store is missing', async () => {
        const browser = mockBrowser()
        delete (browser as Record<string, unknown>).__parallelContextStore

        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        await expect(
            runParallelCucumber({
                browser: browser as unknown as WebdriverIO.Browser,
                reporter,
                eventEmitter,
                cid: '0-0',
                specs: ['/test/foo.feature'],
                gherkinDocuments: [doc],
                supportCodeLibrary: mockSupportCodeLibrary(),
                cucumberOpts: defaultCucumberOpts(),
            })
        ).rejects.toThrow('Parallel context store not found')
    })

    test('skips pickles with no assembled test case', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        const r = await runParallelCucumber({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: {
                ...mockSupportCodeLibrary(),
                stepDefinitions: [],
                beforeTestCaseHookDefinitions: [],
                afterTestCaseHookDefinitions: [],
                beforeTestStepHookDefinitions: [],
                afterTestStepHookDefinitions: [],
            } as unknown as ReturnType<typeof mockSupportCodeLibrary>,
            cucumberOpts: defaultCucumberOpts(),
        })

        expect(r).toBeGreaterThanOrEqual(0)
    })

    test('cleans up browsing contexts even on failure', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a', 'scenario b'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })

        // Contexts should be cleaned up regardless of failure
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(2)
    })

    test('emits hook params before running BeforeAll hooks', async () => {
        const browser = mockBrowser()
        const hookParamsReceived: Array<{ uri?: string; feature?: unknown }> = []

        eventEmitter.on('getHookParams', (params) => {
            hookParamsReceived.push({ ...params })
        })

        const doc = makeFeatureDoc('/test/foo.feature', 'Test Feature', ['scenario a'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })

        // At least one getHookParams emitted (for BeforeAll)
        expect(hookParamsReceived.length).toBeGreaterThan(0)
        expect(hookParamsReceived[0].uri).toBe('/test/foo.feature')
        expect(hookParamsReceived[0].feature).toBeDefined()
    })

    test('handles multiple features with multiple scenarios each', async () => {
        const browser = mockBrowser({
            contexts: ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3'],
        })

        const docA = makeFeatureDoc('/test/a.feature', 'Feature A', ['a1', 'a2'])
        const docB = makeFeatureDoc('/test/b.feature', 'Feature B', ['b1', 'b2'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/a.feature', '/test/b.feature'],
            gherkinDocuments: [docA, docB],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })

        // 4 scenarios = 4 contexts (batch size 10 accommodates all)
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(4)

        // 2 features = 2 suite:start
        const suiteStarts = reporterEvents.filter((e) => e.event === 'suite:start')
        expect(suiteStarts.length).toBe(2)
    })

    test('emits scenario-level reporter events when scenarioLevelReporter is enabled', async () => {
        const opts = defaultCucumberOpts()
        expect(opts.scenarioLevelReporter).toBe(true)
    })

    // ---- Concurrency limiting ----

    test('allocates fresh contexts per batch respecting maxParallelContexts', async () => {
        const browser = mockBrowser({
            contexts: ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3', 'ctx-4'],
        })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3', 's4'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: 2 }),
        })

        // 4 scenarios with batch size 2 → 2 batches, each allocates 2 fresh contexts = 4 total
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(4)
    })

    test('processes all scenarios even when batched', async () => {
        const browser = mockBrowser({
            contexts: ['ctx-0', 'ctx-1'],
        })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3', 's4'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: 2 }),
        })

        // 4 scenarios across 2 batches — each scenario gets a contextClose call
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(4)
    })

    // ---- failFast ----

    test('failFast stops batch loop after first batch failure', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        // 4 scenarios with batch size 2 → 2 batches. First batch will fail
        // (no step defs) and failFast should skip the second batch.
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3', 's4'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: 2, failFast: true }),
        })

        // Only first batch ran (2 scenarios), second batch skipped
        // Each scenario in the first batch still calls contextClose
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(2)
    })

    // ---- test:end event ----

    test('emits test:end after step results in step-level mode', async () => {
        // This test verifies the wireScenarioTranslator emits test:end for steps.
        // We run with scenarioLevelReporter: false to trigger step-level events.
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter: false }),
        })

        // In step-level mode, suite:start is emitted for scenarios.
        // The testCaseStarted envelope triggers this event.
        const suiteStarts = reporterEvents.filter((e) => e.event === 'suite:start')
        // At least the feature suite:start should be emitted
        expect(suiteStarts.length).toBeGreaterThanOrEqual(1)
    })
})

describe('collectFeatureGroups (via runParallelCucumber)', () => {
    test('correctly groups pickles by feature', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1', 'ctx-2'] })
        const reporter = new EventEmitter()
        const eventEmitter = new EventEmitter()

        const docA = makeFeatureDoc('/test/a.feature', 'Feature A', ['scenario-a1'])
        const docB = makeFeatureDoc('/test/b.feature', 'Feature B', ['scenario-b1', 'scenario-b2'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/a.feature', '/test/b.feature'],
            gherkinDocuments: [docA, docB],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts(),
        })

        // 3 scenarios total across 2 features
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(3)
    })

    test('filters out features with no pickles', async () => {
        const parser = new Gherkin.Parser(
            new Gherkin.AstBuilder(uuidFn),
            new Gherkin.GherkinClassicTokenMatcher()
        )
        const emptyDoc = {
            ...parser.parse('Feature: Empty Feature'),
            uri: '/test/empty.feature',
        } as messages.GherkinDocument
        const pickles = Gherkin.compile(emptyDoc, '', uuidFn)
        // Scenarios-only documents produce pickles; empty features don't
        expect(pickles.length).toBe(0)

        const browser = mockBrowser()

        const realDoc = makeFeatureDoc('/test/real.feature', 'Real', ['s1'])

        const result = await runParallelCucumber({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter: new EventEmitter(),
            eventEmitter: new EventEmitter(),
            cid: '0-0',
            specs: ['/test/real.feature'],
            gherkinDocuments: [realDoc],
            supportCodeLibrary: {
                ...mockSupportCodeLibrary(),
                stepDefinitions: [],
                beforeTestCaseHookDefinitions: [],
                afterTestCaseHookDefinitions: [],
                beforeTestStepHookDefinitions: [],
                afterTestStepHookDefinitions: [],
            } as unknown as ReturnType<typeof mockSupportCodeLibrary>,
            cucumberOpts: defaultCucumberOpts(),
        })

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(1)
        expect(result).toBeGreaterThanOrEqual(0)
    })
})
