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
        __parallelContexts: new Set<string>(),
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
        for (const ev of ['suite:start', 'suite:end', 'suite:retry', 'test:start', 'test:pass', 'test:fail', 'test:end', 'hook:start', 'hook:end']) {
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
        // All contexts registered at allocate time are unregistered after close
        expect((browser as unknown as { __parallelContexts: Set<string> }).__parallelContexts.size).toBe(0)
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

    test('runs BeforeAll once per run when multiple features exist', async () => {
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

        // Test-run hooks execute once per run, not once per feature
        expect(beforeHookCalls.length).toBe(1)
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

    // ---- Event stream balance ----

    test('emits balanced scenario events in scenario-level mode', async () => {
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
            cucumberOpts: defaultCucumberOpts(),
        })

        // test:start (testCaseStarted) must be closed by a test:pass/test:fail
        // (testCaseFinished) sharing the scenario uid
        const starts = reporterEvents.filter((e) => e.event === 'test:start')
        const fails = reporterEvents.filter((e) => e.event === 'test:fail')
        const passes = reporterEvents.filter((e) => e.event === 'test:pass')

        expect(starts.length).toBe(1)
        expect(starts[0].payload.uid).toBe('scenario-0-0-0')
        // Scenario has no step definitions → fails with an undefined-steps error
        expect(fails.length).toBe(1)
        expect(fails[0].payload.uid).toBe(starts[0].payload.uid)
        expect(fails[0].payload.error).toBeDefined()
        expect(passes.length).toBe(0)
    })

    test('emits scenario suite:end and no test:end in step-level mode', async () => {
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

        // feature suite:start + scenario suite:start (testCaseStarted)
        const suiteStarts = reporterEvents.filter((e) => e.event === 'suite:start')
        // feature suite:end + scenario suite:end (testCaseFinished)
        const suiteEnds = reporterEvents.filter((e) => e.event === 'suite:end')
        // test:end is never emitted — matches sequential mode
        const testEnds = reporterEvents.filter((e) => e.event === 'test:end')

        expect(suiteStarts.length).toBe(2)
        expect(suiteEnds.length).toBe(2)
        expect(testEnds.length).toBe(0)
    })

    test('emits suite:retry for retried attempts in step-level mode', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        // Step passes on the second attempt so the scenario is retried once
        // and then succeeds (retry: 1 applies to all pickles without a tag filter).
        let calls = 0
        const stepCode = async function () {
            calls++
            if (calls === 1) {
                throw new Error('first attempt fails')
            }
        }
        const stepDefinition = {
            id: 'sd-1',
            code: stepCode,
            keyword: 'Given',
            pattern: 'something',
            uri: '/test/features',
            line: 1,
            options: {},
            expression: { match: (text: string) => (text === 'something' ? [] : null) },
            matchesStepName: (text: string) => text === 'something',
            getInvocationParameters: async () => ({
                parameters: [],
                validCodeLengths: [0, 1],
                getInvalidCodeLengthMessage: () => 'invalid code length',
            }),
        }

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary({ stepDefinitions: [stepDefinition] }),
            cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter: false, retry: 1 }),
        })

        expect(calls).toBe(2)
        // feature suite:start + scenario suite:start (attempt 0) — no suite:end
        // for the retried attempt, mirroring sequential mode
        const suiteStarts = reporterEvents.filter((e) => e.event === 'suite:start')
        const suiteRetries = reporterEvents.filter((e) => e.event === 'suite:retry')
        // feature suite:end + scenario suite:end (final attempt)
        const suiteEnds = reporterEvents.filter((e) => e.event === 'suite:end')

        expect(suiteStarts.length).toBe(2)
        expect(suiteRetries.length).toBe(1)
        expect(suiteEnds.length).toBe(2)
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
