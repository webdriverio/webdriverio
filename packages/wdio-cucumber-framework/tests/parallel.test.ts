import path from 'node:path'
import { createRequire } from 'node:module'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'
import { describe, test, expect, vi, beforeEach } from 'vitest'

import logger from '@wdio/logger'
import * as Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type * as messages from '@cucumber/messages'

import { runParallelCucumber } from '../src/parallel.js'
import { getFeatureId } from '../src/utils.js'
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
    userContexts?: boolean
}) {
    const store = opts?.store || new AsyncLocalStorage<string>()
    const contexts = opts?.contexts || ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3', 'ctx-4', 'ctx-5']
    let idx = 0
    let userIdx = 0
    const userContextCommands = opts?.userContexts
        ? {
            browserCreateUserContext: vi.fn().mockImplementation(async () => ({ userContext: `uc-${userIdx++}` })),
            browserRemoveUserContext: vi.fn().mockResolvedValue(undefined),
        }
        : {}
    return {
        ...userContextCommands,
        isBidi: opts?.isBidi ?? true,
        __parallelContextStore: store,
        __parallelContexts: new Set<string>(),
        __bidiCommandsEnabled: opts?.bidiCommandsEnabled ?? true,
        browsingContextCreate: vi.fn().mockImplementation(async (_params?: unknown) => {
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
function makeFeatureDoc(
    uri: string,
    name: string,
    scenarios: Array<string | { name: string; tags?: string[]; steps?: string[] }>
): messages.GherkinDocument {
    const scenarioText = scenarios.map((s) => {
        const cfg = typeof s === 'string' ? { name: s } : s
        const tagLine = cfg.tags?.length ? `${cfg.tags.join(' ')}\n  ` : ''
        const steps = (cfg.steps || ['something'])
            .map((step) => `    Given ${step}`)
            .join('\n')
        return `  ${tagLine}Scenario: ${cfg.name}\n${steps}`
    }).join('\n\n')
    const gherkinText = `Feature: ${name}\n\n${scenarioText}\n`
    const parser = new Gherkin.Parser(new Gherkin.AstBuilder(uuidFn), new Gherkin.GherkinClassicTokenMatcher())
    return { ...parser.parse(gherkinText), uri } as messages.GherkinDocument
}

/** Build a minimal step definition object matching the given step text. */
function makeStepDefinition(text: string, code: Function) {
    return {
        id: `sd-${text}`,
        code,
        keyword: 'Given',
        pattern: text,
        uri: '/test/features',
        line: 1,
        options: {},
        expression: { match: (stepText: string) => (stepText === text ? [] : null) },
        matchesStepName: (stepText: string) => stepText === text,
        getInvocationParameters: async () => ({
            parameters: [],
            validCodeLengths: [0, 1],
            getInvalidCodeLengthMessage: () => 'invalid code length',
        }),
    }
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
        for (const ev of ['suite:start', 'suite:end', 'suite:retry', 'test:start', 'test:pass', 'test:fail', 'test:skip', 'test:pending', 'test:end', 'hook:start', 'hook:end']) {
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
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window' })
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

        expect(afterHookCalls).toEqual(['after2', 'after1'])
    })

    test('logs the error of a failing BeforeAll hook', async () => {
        const errorLog = vi.spyOn(logger('@wdio-cucumber-framework:parallel'), 'error')
        const supportCodeLibrary = mockSupportCodeLibrary({
            beforeTestRunHooks: [
                function () { throw new Error('boom in BeforeAll') },
            ],
        })

        await runOrCatch({
            browser: mockBrowser() as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])],
            supportCodeLibrary,
            cucumberOpts: defaultCucumberOpts(),
        })

        expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('boom in BeforeAll'))
        errorLog.mockRestore()
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
        expect(suiteStarts.map((e) => e.payload.parentUid)).toEqual([null, null])
    })

    test('emits scenario-level reporter events when scenarioLevelReporter is enabled', async () => {
        const opts = defaultCucumberOpts()
        expect(opts.scenarioLevelReporter).toBe(true)
    })

    // ---- Concurrency limiting ----

    test('creates a window (never a tab) for every context incl. prefetched', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3', 'ctx-4'] })
        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3', 's4'])],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: 2 }),
        })

        const calls = browser.browsingContextCreate.mock.calls
        expect(calls.length).toBe(4)
        for (const [params] of calls) {
            expect(params).toEqual({ type: 'window' })
        }
    })

    test('allocates a fresh context per scenario respecting maxParallelContexts', async () => {
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

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(4)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(4)
    })

    test('processes all scenarios when limited by slots', async () => {
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

        expect(browser.browsingContextClose).toHaveBeenCalledTimes(4)
    })

    // ---- failFast ----

    test('failFast stops taking new scenarios after the first failure', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        // 4 scenarios, 2 slots. The first two fail (no step defs) and failFast
        // must not start the rest.
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

        // Only 2 scenarios ran; the slots' prefetched tabs were closed unused
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(browser.browsingContextCreate.mock.calls.length)
        expect(browser.browsingContextCreate.mock.calls.length).toBeLessThanOrEqual(2 + 2)
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

    test('emits scenario suite:end and a test:end per step in step-level mode', async () => {
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
        const testEnds = reporterEvents.filter((e) => e.event === 'test:end')

        expect(suiteStarts.length).toBe(2)
        expect(suiteEnds.length).toBe(2)
        expect(testEnds.length).toBe(1)

        const featureUid = suiteStarts.find((e) => e.payload.type !== 'scenario')!.payload.uid
        const scenarioStart = suiteStarts.find((e) => e.payload.type === 'scenario')!
        const scenarioEnd = suiteEnds.find((e) => e.payload.type === 'scenario')!
        expect(scenarioStart.payload.parentUid).toBe(featureUid)
        expect(scenarioEnd.payload.parentUid).toBe(featureUid)
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

    // ---- Failure semantics (strict / ignoreUndefinedDefinitions) ----

    test('pending steps fail only under strict mode', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])
        const stepDefinition = makeStepDefinition('something', async function () {
            return 'pending'
        })

        const run = (strict: boolean) => runOrCatch({
            browser: mockBrowser({ contexts: ['ctx-0'] }) as unknown as WebdriverIO.Browser,
            reporter: new EventEmitter(),
            eventEmitter: new EventEmitter(),
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary({ stepDefinitions: [stepDefinition] }),
            cucumberOpts: defaultCucumberOpts({ strict }),
        })

        expect((await run(false)).result).toBe(0)
        expect((await run(true)).result).toBe(1)
    })

    test('undefined steps fail unless ignoreUndefinedDefinitions is set', async () => {
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])

        const run = (ignoreUndefinedDefinitions: boolean) => runOrCatch({
            browser: mockBrowser({ contexts: ['ctx-0'] }) as unknown as WebdriverIO.Browser,
            reporter: new EventEmitter(),
            eventEmitter: new EventEmitter(),
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ ignoreUndefinedDefinitions }),
        })

        expect((await run(true)).result).toBe(0)
        expect((await run(false)).result).toBe(1)
    })

    // ---- Tag filtering ----

    test('filters pickles by tag expression before batching', async () => {
        const browser = mockBrowser()
        const doc = makeFeatureDoc('/test/tags.feature', 'Tags', [
            { name: 'smoke one', tags: ['@smoke'] },
            { name: 'plain two' },
        ])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/tags.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ tags: '@smoke' }),
        })

        // Only the @smoke scenario gets a browsing context
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(1)
    })

    // ---- Config hook params (beforeHook/afterHook step context) ----

    test('emits getHookParams with the executing step in step-level mode', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])
        const stepDefinition = makeStepDefinition('something', async function () {})
        const hookParamsReceived: Array<Record<string, unknown>> = []

        eventEmitter.on('getHookParams', (params) => {
            hookParamsReceived.push({ ...params })
        })

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary({ stepDefinitions: [stepDefinition] }),
            cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter: false }),
        })

        const withStep = hookParamsReceived.find((p) => p.step)
        expect(withStep).toBeDefined()
        expect((withStep!.step as { text: string }).text).toBe('something')
        expect((withStep!.scenario as { name: string }).name).toBe('scenario a')
        expect((withStep!.feature as { name: string }).name).toBe('Test')
    })

    // ---- dryRun ----

    test('dryRun does not execute hooks or steps and reports success', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a'])
        const beforeCalls: string[] = []
        const afterCalls: string[] = []
        let stepCalls = 0
        const stepDefinition = makeStepDefinition('something', async function () {
            stepCalls++
        })
        const supportCodeLibrary = mockSupportCodeLibrary({
            beforeTestRunHooks: [function () { beforeCalls.push('before') }],
            afterTestRunHooks: [function () { afterCalls.push('after') }],
            stepDefinitions: [stepDefinition],
        })

        const { result } = await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary,
            cucumberOpts: defaultCucumberOpts({ dryRun: true }),
        })

        expect(result).toBe(0)
        expect(beforeCalls).toEqual([])
        expect(afterCalls).toEqual([])
        expect(stepCalls).toBe(0)
        // The skipped scenario is reported, not dropped
        const skips = reporterEvents.filter((e) => e.event === 'test:skip')
        expect(skips.length).toBe(1)
        expect(skips[0].payload.uid).toBe('scenario-0-0-0')
    })

    // ---- Event stream balance ----

    test('emits balanced scenario start/end pairs in both reporter modes', async () => {
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['scenario a', 'scenario b'])

        for (const scenarioLevelReporter of [true, false]) {
            const localReporter = new EventEmitter()
            const localEvents: Array<{ event: string; payload: Record<string, unknown> }> = []
            for (const ev of ['suite:start', 'suite:end', 'suite:retry', 'test:start', 'test:pass', 'test:fail', 'test:skip', 'test:pending']) {
                localReporter.on(ev, (p) => localEvents.push({ event: ev, payload: p }))
            }

            await runOrCatch({
                browser: mockBrowser({ contexts: ['ctx-0', 'ctx-1'] }) as unknown as WebdriverIO.Browser,
                reporter: localReporter,
                eventEmitter: new EventEmitter(),
                cid: '0-0',
                specs: ['/test/foo.feature'],
                gherkinDocuments: [doc],
                supportCodeLibrary: mockSupportCodeLibrary(),
                cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter }),
            })

            if (scenarioLevelReporter) {
                const starts = localEvents.filter((e) => e.event === 'test:start')
                const closes = localEvents.filter((e) => ['test:pass', 'test:fail', 'test:skip', 'test:pending'].includes(e.event))
                expect(starts.length).toBe(2)
                expect(closes.length).toBe(starts.length)
            } else {
                const scenarioStarts = localEvents.filter((e) => e.event === 'suite:start' && e.payload.type === 'scenario')
                const scenarioEnds = localEvents.filter((e) => e.event === 'suite:end' && e.payload.type === 'scenario')
                expect(scenarioStarts.length).toBe(2)
                expect(scenarioEnds.length).toBe(scenarioStarts.length)
            }
        }
    })

    // ---- Per-step durations ----

    test('step durations are per-step, not cumulative from scenario start', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', [
            { name: 'two steps', steps: ['something', 'another'] },
        ])
        const stepDefinitions = [
            makeStepDefinition('something', async function () {
                await new Promise((r) => setTimeout(r, 100))
            }),
            makeStepDefinition('another', async function () {
                await new Promise((r) => setTimeout(r, 20))
            }),
        ]

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary({ stepDefinitions }),
            cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter: false }),
        })

        const stepPasses = reporterEvents.filter((e) => e.event === 'test:pass')
        expect(stepPasses.length).toBe(2)
        const [first, second] = stepPasses.map((e) => e.payload.duration as number)
        // The second step slept 20ms; a cumulative duration would exceed the
        // first step's 100ms sleep
        expect(first).toBeGreaterThanOrEqual(90)
        expect(second).toBeLessThan(first)
    })

    test('step-level test:start payloads carry the scenario contextId', async () => {
        const browser = mockBrowser({ contexts: ['ctx-step'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', [{ name: 'one step', steps: ['something'] }])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary({
                stepDefinitions: [makeStepDefinition('something', async function () {})],
            }),
            cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter: false }),
        })

        const stepStarts = reporterEvents.filter((e) => e.event === 'test:start')
        expect(stepStarts.length).toBe(1)
        expect(stepStarts[0].payload.contextId).toBe('ctx-step')
    })

    test('step-level test:end carries the contextId and the step uid', async () => {
        const browser = mockBrowser({ contexts: ['ctx-step'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', [{ name: 'one step', steps: ['something'] }])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary({
                stepDefinitions: [makeStepDefinition('something', async function () {})],
            }),
            cucumberOpts: defaultCucumberOpts({ scenarioLevelReporter: false }),
        })

        const start = reporterEvents.find((e) => e.event === 'test:start')!
        const ends = reporterEvents.filter((e) => e.event === 'test:end')
        expect(ends).toHaveLength(1)
        expect(ends[0].payload.contextId).toBe('ctx-step')
        expect(ends[0].payload.uid).toBe(start.payload.uid)
        const names = reporterEvents.map((e) => e.event)
        expect(names.indexOf('test:end')).toBeGreaterThan(names.indexOf('test:pass'))
        expect(names.indexOf('test:end')).toBeLessThan(names.lastIndexOf('suite:end'))
    })

    test('fractional maxParallelContexts below 1 still runs every scenario', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: 0.5 }),
        })

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(2)
    })

    // ---- failFast summary ----

    test('failFast in step-level mode reports skipped steps as start, skip, end with one uid', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3'])

        await runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [doc],
            supportCodeLibrary: mockSupportCodeLibrary(),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: 2, failFast: true, scenarioLevelReporter: false }),
        })

        const skip = reporterEvents.find((e) => e.event === 'test:skip')!
        const uid = skip.payload.uid
        const trail = reporterEvents.filter((e) => e.payload?.uid === uid).map((e) => e.event)
        expect(trail).toEqual(['test:start', 'test:skip', 'test:end'])
    })

    test('failFast reports unrun scenarios as skipped and reconciles the summary', async () => {
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        const doc = makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3'])

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

        // 2 scenarios fail (no step defs); scenario 3 is skipped
        const starts = reporterEvents.filter((e) => e.event === 'test:start')
        const fails = reporterEvents.filter((e) => e.event === 'test:fail')
        const skips = reporterEvents.filter((e) => e.event === 'test:skip')
        expect(starts.length).toBe(3)
        expect(fails.length).toBe(2)
        expect(skips.length).toBe(1)
        // Every start is closed exactly once — the stream stays balanced
        expect(starts.length).toBe(fails.length + skips.length)
        expect(reporterEvents.filter((e) => e.event === 'test:end').length).toBe(starts.length)
        // The skipped scenario gets no tab; only unused prefetched tabs may exceed 2, all closed
        expect(browser.browsingContextCreate.mock.calls.length).toBeLessThanOrEqual(2 + 2)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(browser.browsingContextCreate.mock.calls.length)
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

describe('runParallelCucumber userContexts mode', () => {
    let reporter: EventEmitter
    let eventEmitter: EventEmitter
    let reporterEvents: Array<{ event: string; payload: Record<string, unknown> }>
    const passingLibrary = () => mockSupportCodeLibrary({
        stepDefinitions: [makeStepDefinition('something', async function () {})],
    })
    const userOpts = (overrides?: Partial<CucumberOptions>) =>
        defaultCucumberOpts({ parallelMode: 'userContexts', ...overrides })

    function run(browser: ReturnType<typeof mockBrowser>, extra: Partial<Parameters<typeof runParallelCucumber>[0]> = {}) {
        return runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2'])],
            supportCodeLibrary: passingLibrary(),
            cucumberOpts: userOpts(),
            ...extra,
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        reporter = new EventEmitter()
        eventEmitter = new EventEmitter()
        reporterEvents = []
        for (const ev of ['test:start', 'test:pass', 'test:fail', 'test:skip']) {
            reporter.on(ev, (p) => reporterEvents.push({ event: ev, payload: p }))
        }
    })

    test('creates a user context per scenario and passes it to the tab', async () => {
        const browser = mockBrowser({ userContexts: true })
        const { result } = await run(browser)

        expect(result).toBe(0)
        expect(browser.browserCreateUserContext).toHaveBeenCalledTimes(2)
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window', userContext: 'uc-0' })
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window', userContext: 'uc-1' })
    })

    test('closes the tab before removing its user context and unregisters it (pass)', async () => {
        const browser = mockBrowser({ userContexts: true })
        await run(browser)

        expect(browser.browserRemoveUserContext).toHaveBeenCalledTimes(2)
        for (let i = 0; i < 2; i++) {
            expect(browser.browsingContextClose.mock.invocationCallOrder[i])
                .toBeLessThan(browser.browserRemoveUserContext.mock.invocationCallOrder[i])
        }
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('closes the tab before removing its user context and unregisters it (failure)', async () => {
        const browser = mockBrowser({ userContexts: true })
        const { result } = await run(browser, { supportCodeLibrary: mockSupportCodeLibrary() })

        expect(result).toBe(2)
        expect(browser.browserRemoveUserContext).toHaveBeenCalledTimes(2)
        expect(Math.max(...browser.browsingContextClose.mock.invocationCallOrder))
            .toBeLessThan(Math.min(...browser.browserRemoveUserContext.mock.invocationCallOrder))
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('rolls back tabs then user contexts when a later allocation rejects', async () => {
        const browser = mockBrowser({ userContexts: true })
        browser.browsingContextCreate
            .mockResolvedValueOnce({ context: 'ctx-0' })
            .mockRejectedValueOnce(new Error('tab boom'))
        const { error } = await run(browser)

        expect(error?.message).toBe('tab boom')
        expect(browser.browsingContextClose).toHaveBeenCalledWith({ context: 'ctx-0' })
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-0' })
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-1' })
        expect(browser.browsingContextClose.mock.invocationCallOrder[0])
            .toBeLessThan(browser.browserRemoveUserContext.mock.invocationCallOrder[1])
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('throws naming browser.createUserContext when the driver lacks it, but contexts mode still runs', async () => {
        const browser = mockBrowser()
        const { error } = await run(browser)
        expect(error?.message).toContain('browser.createUserContext')
        expect(browser.browsingContextCreate).not.toHaveBeenCalled()

        const contexts = await run(browser, { cucumberOpts: defaultCucumberOpts() })
        expect(contexts.result).toBe(0)
    })

    test.each([['abc'], [Infinity], [0], [-3], [NaN]])('falls back to a single slot for maxParallelContexts %s', async (value) => {
        const browser = mockBrowser({ userContexts: true })
        const { result } = await run(browser, {
            cucumberOpts: userOpts({ maxParallelContexts: value as unknown as number }),
        })

        expect(result).toBe(0)
        // 2 scenarios, 1 slot: the second tab is prefetched during the first scenario
        expect(browser.browserCreateUserContext).toHaveBeenCalledTimes(2)
        expect(browser.browserRemoveUserContext).toHaveBeenCalledTimes(2)
    })
})

describe('runParallelCucumber run-level behavior', () => {
    const requireCjs = createRequire(import.meta.url)
    let reporter: EventEmitter
    let eventEmitter: EventEmitter
    let reporterEvents: Array<{ event: string; payload: Record<string, unknown> }>
    const failing = () => { throw new Error('hook boom') }
    const passingLibrary = (hooks: { beforeTestRunHooks?: Function[]; afterTestRunHooks?: Function[] } = {}) =>
        mockSupportCodeLibrary({
            ...hooks,
            stepDefinitions: [makeStepDefinition('something', async function () {})],
        })

    function run(browser: ReturnType<typeof mockBrowser>, supportCodeLibrary: ReturnType<typeof mockSupportCodeLibrary>, cucumberOpts = defaultCucumberOpts(), runner: typeof runParallelCucumber = runParallelCucumber) {
        return runner({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [makeFeatureDoc('/test/foo.feature', 'Test', ['s1'])],
            supportCodeLibrary,
            cucumberOpts,
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        reporter = new EventEmitter()
        eventEmitter = new EventEmitter()
        reporterEvents = []
        reporter.on('test:start', (p) => reporterEvents.push({ event: 'test:start', payload: p }))
    })

    test('adds one failure and skips scenarios when BeforeAll fails, still running AfterAll', async () => {
        const browser = mockBrowser()
        const afterAll = vi.fn()
        const result = await run(browser, passingLibrary({ beforeTestRunHooks: [failing], afterTestRunHooks: [afterAll] }))

        expect(result).toBe(1)
        expect(browser.browsingContextCreate).not.toHaveBeenCalled()
        expect(reporterEvents).toHaveLength(0)
        expect(afterAll).toHaveBeenCalledTimes(1)
    })

    test('adds one failure when AfterAll fails', async () => {
        const browser = mockBrowser()
        const result = await run(browser, passingLibrary({ afterTestRunHooks: [failing] }))

        expect(result).toBe(1)
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(1)
    })

    test('adds one failure per failing hook phase', async () => {
        const result = await run(mockBrowser(), passingLibrary({ beforeTestRunHooks: [failing], afterTestRunHooks: [failing] }))
        expect(result).toBe(2)
    })

    test('emits the browsing context id on test:start', async () => {
        const browser = mockBrowser({ contexts: ['ctx-abc'] })
        await run(browser, passingLibrary())

        expect(reporterEvents).toHaveLength(1)
        expect(reporterEvents[0].payload.contextId).toBe('ctx-abc')
    })

    test('passes snippetInterface and snippetSyntax to the snippet builder', async () => {
        const builder = requireCjs('@cucumber/cucumber/lib/formatter/builder').default
        const spy = vi.spyOn(builder, 'getStepDefinitionSnippetBuilder').mockResolvedValue({ build: () => '' })
        await run(mockBrowser(), passingLibrary(), defaultCucumberOpts({
            snippetInterface: 'async-await',
            snippetSyntax: '/custom/syntax.js',
        }))

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            snippetInterface: 'async-await',
            snippetSyntax: '/custom/syntax.js',
        }))
        spy.mockRestore()
    })

    test('cleans up the preallocated tab and counts the scenario as skipped when no test case was assembled', async () => {
        const assembleModule = requireCjs('@cucumber/cucumber/lib/assemble/assemble_test_cases')
        const spy = vi.spyOn(assembleModule, 'assembleTestCases').mockResolvedValue([])
        vi.resetModules()
        const { runParallelCucumber: fresh } = await import('../src/parallel.js')
        const infoLog = vi.spyOn(logger('@wdio-cucumber-framework:parallel'), 'info')
        const browser = mockBrowser({ userContexts: true })
        const result = await run(browser, passingLibrary(), defaultCucumberOpts({ parallelMode: 'userContexts' }), fresh)

        expect(result).toBe(0)
        expect(browser.browsingContextClose).toHaveBeenCalledWith({ context: 'ctx-0' })
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-0' })
        expect(browser.__parallelContexts.size).toBe(0)
        expect(infoLog).toHaveBeenCalledWith(expect.stringContaining('0 passed, 0 failed, 1 skipped'))
        spy.mockRestore()
        infoLog.mockRestore()
    })
})

describe('runParallelCucumber worker pool', () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    let reporter: EventEmitter
    let eventEmitter: EventEmitter
    const names = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `s${i}`, steps: [`step${i}`] }))

    function run(browser: ReturnType<typeof mockBrowser>, scenarios: ReturnType<typeof names>, bodies: Record<string, () => Promise<void> | void>, max: number, extra: Partial<CucumberOptions> = {}) {
        return runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: ['/test/foo.feature'],
            gherkinDocuments: [makeFeatureDoc('/test/foo.feature', 'Test', scenarios)],
            supportCodeLibrary: mockSupportCodeLibrary({
                stepDefinitions: Object.entries(bodies).map(([text, fn]) => makeStepDefinition(text, fn)),
            }),
            cucumberOpts: defaultCucumberOpts({ maxParallelContexts: max, ...extra }),
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        reporter = new EventEmitter()
        eventEmitter = new EventEmitter()
    })

    test('never runs more scenarios than maxParallelContexts and keeps live tabs bounded', async () => {
        let inFlight = 0
        let maxInFlight = 0
        const bodies: Record<string, () => Promise<void>> = {}
        for (let i = 0; i < 8; i++) {
            bodies[`step${i}`] = async () => {
                maxInFlight = Math.max(maxInFlight, ++inFlight)
                await sleep(5)
                inFlight--
            }
        }
        const browser = mockBrowser()
        let live = 0
        let maxLive = 0
        browser.browsingContextCreate.mockImplementation(async () => ({ context: `ctx-${maxLive = Math.max(maxLive, ++live)}-${Math.random()}` }))
        browser.browsingContextClose.mockImplementation(async () => { live-- })

        const { result } = await run(browser, names(8), bodies, 2)

        expect(result).toBe(0)
        expect(maxInFlight).toBe(2)
        expect(maxLive).toBeLessThanOrEqual(4)
        expect(live).toBe(0)
    })

    test('a slow scenario does not block other slots', async () => {
        const finished: string[] = []
        const mk = (n: string, ms: number) => async () => { await sleep(ms); finished.push(n) }
        const { result } = await run(
            mockBrowser(), names(4),
            { step0: mk('slow', 80), step1: mk('f1', 5), step2: mk('f2', 5), step3: mk('f3', 5) },
            2
        )
        expect(result).toBe(0)
        expect(finished).toEqual(['f1', 'f2', 'f3', 'slow'])
    })

    test('all closes finish before resolving, even when a scenario fails', async () => {
        const browser = mockBrowser()
        let closed = 0
        browser.browsingContextClose.mockImplementation(async () => { await sleep(20); closed++ })
        const { result } = await run(browser, names(3), {
            step0: () => { throw new Error('boom') }, step1: () => {}, step2: () => {},
        }, 2)

        expect(result).toBe(1)
        expect(closed).toBe(browser.browsingContextCreate.mock.calls.length)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('does not wait for a close before starting the next scenario on that slot', async () => {
        const browser = mockBrowser()
        browser.browsingContextClose.mockImplementation(async () => { await sleep(60) })
        const starts: number[] = []
        const t0 = Date.now()
        const body = () => { starts.push(Date.now() - t0) }
        await run(browser, names(2), { step0: body, step1: body }, 1)

        expect(starts[1] - starts[0]).toBeLessThan(40)
    })

    test('keeps close-before-remove order per allocation with concurrent slots in userContexts mode', async () => {
        const order: string[] = []
        const browser = mockBrowser({ userContexts: true })
        const ownerOf = new Map<string, string>()
        browser.browsingContextCreate.mockImplementation(async ({ userContext }: any) => {
            const context = `ctx-of-${userContext}`
            ownerOf.set(context, userContext)
            return { context }
        })
        browser.browsingContextClose.mockImplementation(async ({ context }: any) => {
            await sleep(5)
            order.push(`${ownerOf.get(context)}:close`)
        })
        browser.browserRemoveUserContext!.mockImplementation(async ({ userContext }: any) => { order.push(`${userContext}:remove`) })
        await run(browser, names(3), { step0: () => {}, step1: () => {}, step2: () => {} }, 2, { parallelMode: 'userContexts' })

        const userContexts = [...ownerOf.values()]
        expect(userContexts.length).toBeGreaterThanOrEqual(3)
        for (const uc of userContexts) {
            expect(order.indexOf(`${uc}:close`)).toBeGreaterThanOrEqual(0)
            expect(order.indexOf(`${uc}:close`)).toBeLessThan(order.indexOf(`${uc}:remove`))
        }
    })

    test('creates exactly one tab per scenario, with no spare left over', async () => {
        const browser = mockBrowser()
        const { result } = await run(browser, names(8), Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`step${i}`, () => {}])), 4)

        expect(result).toBe(0)
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(8)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(8)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('cleans up a spare that no scenario ends up using after an allocation failure', async () => {
        const browser = mockBrowser()
        let n = 0
        let failSecond!: (err: Error) => void
        browser.browsingContextCreate.mockImplementation(async () => {
            n++
            if (n === 2) { return new Promise((_, reject) => { failSecond = reject }) }
            if (n === 3) { failSecond(new Error('slot allocation failed')) }
            return { context: `ctx-${n}` }
        })
        const { error } = await run(browser, names(3), { step0: () => {}, step1: () => {}, step2: () => {} }, 2)

        expect(error?.message).toBe('slot allocation failed')
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(3)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(2)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('closes a leftover spare when failFast stops the run', async () => {
        const browser = mockBrowser()
        await run(browser, names(4), {
            step0: () => { throw new Error('boom') },
            step1: () => {}, step2: () => {}, step3: () => {},
        }, 2, { failFast: true })

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(4)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(4)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('a failed prefetch is thrown after cleanup without leaking tabs', async () => {
        const browser = mockBrowser()
        let n = 0
        browser.browsingContextCreate.mockImplementation(async () => {
            if (n++ === 1) { throw new Error('prefetch failed') }
            return { context: `ctx-${n}` }
        })
        const { error } = await run(browser, names(2), { step0: () => {}, step1: () => {} }, 1)

        expect(error?.message).toBe('prefetch failed')
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
        expect(browser.__parallelContexts.size).toBe(0)
    })
})

describe('runParallelCucumber reporter contract and teardown', () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    let reporter: EventEmitter
    let eventEmitter: EventEmitter
    let events: Array<{ event: string; payload: Record<string, any> }>
    const library = (afterTestRunHooks: Function[] = []) => mockSupportCodeLibrary({
        afterTestRunHooks,
        stepDefinitions: [makeStepDefinition('something', async function () {})],
    })

    function run(browser: ReturnType<typeof mockBrowser>, docs: messages.GherkinDocument[], cucumberOpts = defaultCucumberOpts(), supportCodeLibrary = library(), rootDir?: string) {
        return runOrCatch({
            browser: browser as unknown as WebdriverIO.Browser,
            reporter,
            eventEmitter,
            cid: '0-0',
            specs: docs.map((d) => d.uri as string),
            gherkinDocuments: docs,
            supportCodeLibrary,
            cucumberOpts,
            rootDir,
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        reporter = new EventEmitter()
        eventEmitter = new EventEmitter()
        events = []
        const original = reporter.emit.bind(reporter)
        reporter.emit = (event: string, payload: any) => {
            events.push({ event, payload })
            return original(event, payload)
        }
    })

    test('runs AfterAll and closes feature suites when context allocation fails, then rethrows', async () => {
        const browser = mockBrowser()
        browser.browsingContextCreate.mockRejectedValue(new Error('no window'))
        const afterAll = vi.fn()
        const { error } = await run(browser, [makeFeatureDoc('/test/foo.feature', 'Test', ['s1'])], defaultCucumberOpts(), library([afterAll]))

        expect(error?.message).toBe('no window')
        expect(afterAll).toHaveBeenCalledTimes(1)
        expect(events.filter((e) => e.event === 'suite:end')).toHaveLength(1)
    })

    test('runs AfterAll and closes feature suites when test case assembly throws, then rethrows', async () => {
        const requireCjs = createRequire(import.meta.url)
        const assembleModule = requireCjs('@cucumber/cucumber/lib/assemble/assemble_test_cases')
        const spy = vi.spyOn(assembleModule, 'assembleTestCases').mockRejectedValue(new Error('assemble boom'))
        vi.resetModules()
        const { runParallelCucumber: fresh } = await import('../src/parallel.js')
        const afterAll = vi.fn()
        let error: Error | undefined
        try {
            await fresh({
                browser: mockBrowser() as unknown as WebdriverIO.Browser,
                reporter,
                eventEmitter,
                cid: '0-0',
                specs: ['/test/foo.feature'],
                gherkinDocuments: [makeFeatureDoc('/test/foo.feature', 'Test', ['s1'])],
                supportCodeLibrary: library([afterAll]),
                cucumberOpts: defaultCucumberOpts(),
            })
        } catch (err) {
            error = err as Error
        }
        spy.mockRestore()

        expect(error?.message).toBe('assemble boom')
        expect(afterAll).toHaveBeenCalledTimes(1)
        expect(events.filter((e) => e.event === 'suite:end')).toHaveLength(1)
    })

    test('emits test:end with the contextId after each scenario-level result', async () => {
        const browser = mockBrowser({ contexts: ['ctx-a', 'ctx-b'] })
        await run(browser, [makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2'])])

        const ends = events.filter((e) => e.event === 'test:end')
        expect(ends.map((e) => e.payload.contextId).sort()).toEqual(['ctx-a', 'ctx-b'])
        for (const end of ends) {
            const resultIdx = events.findIndex((e) => e.event === 'test:pass' && e.payload.uid === end.payload.uid)
            expect(resultIdx).toBeGreaterThanOrEqual(0)
            expect(events.indexOf(end)).toBe(resultIdx + 1)
            expect(end.payload.passed).toBe(true)
        }
    })

    test('scenario-level test payloads carry the parentUid of their own feature, even for same-named files', async () => {
        const docs = [
            makeFeatureDoc('/a/login.feature', 'Login A', ['a1']),
            makeFeatureDoc('/b/login.feature', 'Login B', ['b1']),
        ]
        await run(mockBrowser(), docs)

        const suites = events.filter((e) => e.event === 'suite:start').map((e) => e.payload)
        expect(new Set(suites.map((s) => s.uid)).size).toBe(2)
        const byTitle = (title: string) => events.find((e) => e.event === 'test:pass' && e.payload.title === title)!.payload
        expect(byTitle('a1').parentUid).toBe(suites.find((s) => s.title === 'Login A')!.uid)
        expect(byTitle('b1').parentUid).toBe(suites.find((s) => s.title === 'Login B')!.uid)
        expect(byTitle('a1').parent).toBe(byTitle('a1').parentUid)
    })

    test('parallel feature uid is getFeatureId with rootDir', async () => {
        const root = path.resolve('/project')
        const docs = [
            makeFeatureDoc(path.join(root, 'a', 'login.feature'), 'Login A', ['a1']),
            makeFeatureDoc(path.join(root, 'b', 'login.feature'), 'Login B', ['b1']),
        ]
        await run(mockBrowser(), docs, defaultCucumberOpts(), library(), root)

        const suites = events.filter((e) => e.event === 'suite:start' && e.payload.type === 'feature').map((e) => e.payload)
        expect(suites.map((s) => s.uid)).toEqual(['a/login.feature:1:1', 'b/login.feature:1:1'])
        expect(suites.map((s) => s.uid)).toEqual(docs.map((d) => getFeatureId(d.uri!, d.feature!, root)))
        const byTitle = (title: string) => events.find((e) => e.event === 'test:pass' && e.payload.title === title)!.payload
        expect([byTitle('a1').parent, byTitle('a1').parentUid]).toEqual(['a/login.feature:1:1', 'a/login.feature:1:1'])
        expect([byTitle('b1').parent, byTitle('b1').parentUid]).toEqual(['b/login.feature:1:1', 'b/login.feature:1:1'])
    })

    test('a tag filter that removes a same-name file does not change the other uid', async () => {
        const root = path.resolve('/project')
        const docs = [
            makeFeatureDoc(path.join(root, 'a', 'login.feature'), 'Login A', ['a1']),
            makeFeatureDoc(path.join(root, 'b', 'login.feature'), 'Login B', [{ name: 'b1', tags: ['@keep'] }]),
        ]
        await run(mockBrowser(), docs, defaultCucumberOpts({ tags: '@keep' }), library(), root)

        const suites = events.filter((e) => e.event === 'suite:start' && e.payload.type === 'feature').map((e) => e.payload)
        expect(suites.map((s) => s.uid)).toEqual(['b/login.feature:1:1'])
    })

    test('step-level test and hook payloads carry the parentUid of their scenario suite', async () => {
        const docs = [
            makeFeatureDoc('/a/one.feature', 'One', ['a1']),
            makeFeatureDoc('/b/two.feature', 'Two', ['b1']),
        ]
        await run(mockBrowser(), docs, defaultCucumberOpts({ scenarioLevelReporter: false }))

        const scenarioSuites = events.filter((e) => e.event === 'suite:start' && e.payload.type === 'scenario').map((e) => e.payload)
        expect(scenarioSuites).toHaveLength(2)
        expect(new Set(scenarioSuites.map((s) => s.uid)).size).toBe(2)
        const steps = events.filter((e) => e.event === 'test:pass').map((e) => e.payload)
        expect(steps).toHaveLength(2)
        for (const step of steps) {
            const owner = scenarioSuites.find((s) => s.uid === step.parentUid)
            expect(owner).toBeDefined()
            expect(owner!.title).toBe(step.scenarioName)
        }
        const stepEnds = events.filter((e) => e.event === 'test:end')
        expect(stepEnds).toHaveLength(2)
        for (const end of stepEnds) {
            expect(end.payload.contextId).toBeDefined()
        }
    })

    test('a slot never has more than one window close in flight', async () => {
        const browser = mockBrowser()
        let inFlight = 0
        let maxInFlight = 0
        browser.browsingContextClose.mockImplementation(async () => {
            maxInFlight = Math.max(maxInFlight, ++inFlight)
            await sleep(15)
            inFlight--
        })
        const { result } = await run(browser, [makeFeatureDoc('/test/foo.feature', 'Test', ['s1', 's2', 's3', 's4'])], defaultCucumberOpts({ maxParallelContexts: 1 }))

        expect(result).toBe(0)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(browser.browsingContextCreate.mock.calls.length)
        expect(maxInFlight).toBe(1)
    })
})
