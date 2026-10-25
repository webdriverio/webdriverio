import { AsyncLocalStorage } from 'node:async_hooks'
import { rmSync } from 'node:fs'
import logger from '@wdio/logger'
import { BaseReporter } from '@wdio/runner'
import type { Frameworks, Options } from '@wdio/types'
import type { Reporter, ReportedHookContext, TestCase, TestModule, TestSuite } from 'vitest/node'

import { ATTEMPT_EVENT, ATTEMPT_HOOK_KINDS, RUNTIME_META_KEY, SESSION_META_KEY, type AttemptHookKind, type AttemptMarker, type RelayedEntry, type SessionMeta } from './types.js'

const log = logger('@wdio/vitest-framework')

// Vitest's console reporter always prints, so a WDIO console reporter would duplicate the output
const CONSOLE_REPORTERS = new Set(['spec', 'dot', 'concise', '@wdio/spec-reporter', '@wdio/dot-reporter', '@wdio/concise-reporter'])

type TestError = { name?: string, message: string, stack?: string, expected?: unknown, actual?: unknown }
type Titled = { uid: string, title: string, fullTitle: string }
type AllHookName = 'beforeAll' | 'afterAll'
type Open = Titled & { kind: 'suite' | 'test', payload: Record<string, unknown> }

type ModuleRun = {
    cid: string
    caps: WebdriverIO.Capabilities
    specs: string[]
    // Undefined when only console reporters were configured: BaseReporter would add the dot reporter by default
    reporter?: BaseReporter
    // Events must reach the reporters in Vitest's order even though the hooks are async.
    queue: Promise<void>
    started: boolean
    failed: boolean
    // Tests that never finished, e.g. the run was cancelled: neither passed nor failed
    incomplete: boolean
    failedTests: number
    suiteCount: number
    hookCount: number
    testCount: number
    entities: Map<string, Open>
    // beforeAll / afterAll hooks that started but never ended: Vitest only calls onHookEnd for hooks that did not throw
    runningHooks: Map<string, Set<AllHookName>>
    wrapper?: Titled
}

const toErrorPayload = ({ name, message, stack }: TestError) => ({ name: name || 'Error', message, stack })

// Vitest gives the errors of a failed beforeEach / afterEach to the test, so the test gets all errors of its attempt
const withHookErrors = (error: ReturnType<typeof toErrorPayload>, marker?: AttemptMarker) => {
    const errors = [error]
    for (const kind of ATTEMPT_HOOK_KINDS) {
        const hookError = marker?.hooks?.[kind]?.state === 'fail' ? marker.hooks[kind].error : undefined
        if (hookError && !errors.some(({ message, stack }) => message === hookError.message && stack === hookError.stack)) {
            errors.push(toErrorPayload(hookError))
        }
    }
    return errors.length > 1 ? { error, errors } : { error }
}
const ALL_HOOK_NAMES: AllHookName[] = ['beforeAll', 'afterAll']
const HOOK_KIND: Record<AllHookName, string> = { beforeAll: 'before all', afterAll: 'after all' }
const HOOK_TITLES: Record<AttemptHookKind, string> = { beforeEach: 'before each', afterEach: 'after each' }
const join = (parent: string, title: string) => parent ? `${parent} ${title}` : title

/**
 * Streams Vitest module, suite and test events into WDIO reporters while the tests run.
 * Vitest reporters run in the launcher process, so this is where the WDIO reporters live
 * too. One module (spec file x capability) is one job, matching one worker of a regular WDIO run.
 */
export class WdioBridgeReporter implements Reporter {
    #config: Options.Testrunner
    #onEvent: (event: Frameworks.FrameworkLaunchEvent) => void
    #onError: (error: unknown) => void
    #runs = new Map<string, ModuleRun>()
    #pending = new Set<Promise<void>>()
    #launched = 0
    #laneModules = new Map<string, boolean>()
    // Reporters resolve the test of an API call (e.g. addStep) by the concurrent test being replayed
    #replayedContext = new AsyncLocalStorage<string>()

    constructor(config: WebdriverIO.Config, onEvent: (event: Frameworks.FrameworkLaunchEvent) => void, onError: (error: unknown) => void = () => {}) {
        const reporterName = (entry: unknown) => Array.isArray(entry) ? entry[0] : entry
        const isConsole = (entry: unknown) => typeof reporterName(entry) === 'string' && CONSOLE_REPORTERS.has(reporterName(entry))
        const configured = config.reporters ?? []
        const dropped = configured.filter(isConsole).map(reporterName)
        if (dropped.length > 0) {
            log.warn(`The ${dropped.join(', ')} reporter(s) are not used with the Vitest framework; Vitest prints the console output. File reporters such as junit or allure still receive the results.`)
        }
        // BaseReporter fills in the default dot reporter, which must not leak into the launcher's config
        this.#config = { ...config, reporters: configured.filter((entry) => !isConsole(entry)) } as Options.Testrunner
        this.#onEvent = onEvent
        this.#onError = onError
    }

    onTestModuleStart(testModule: TestModule) {
        this.#tryRun(testModule)
    }

    onTestSuiteReady(testSuite: TestSuite) {
        const run = this.#tryRun(testSuite.module)
        return run && this.#enqueue(run, () => this.#openSuite(run, testSuite))
    }

    onTestSuiteResult(testSuite: TestSuite) {
        const run = this.#tryRun(testSuite.module)
        return run && this.#enqueue(run, () => {
            const suite = this.#openSuite(run, testSuite)
            this.#emitFailedHook(run, testSuite, suite, testSuite.name)
            run.entities.delete(testSuite.id)
            this.#emit(run, 'suite:end', this.#suitePayload(run, testSuite, suite))
        })
    }

    onHookStart(hook: ReportedHookContext) {
        const { name, entity } = hook
        if (entity.type === 'test' || !(name in HOOK_KIND)) {
            return
        }
        const run = this.#tryRun(entity.type === 'module' ? entity : entity.module)
        if (run) {
            const running = run.runningHooks.get(entity.id) ?? new Set<AllHookName>()
            running.add(name as AllHookName)
            run.runningHooks.set(entity.id, running)
        }
    }

    onHookEnd(hook: ReportedHookContext) {
        const { entity } = hook
        if (entity.type === 'test') {
            return
        }
        this.#runs.get((entity.type === 'module' ? entity : entity.module).id)?.runningHooks.get(entity.id)?.delete(hook.name as AllHookName)
    }

    onTestCaseReady(testCase: TestCase) {
        const run = this.#tryRun(testCase.module)
        return run && this.#enqueue(run, () => this.#inContext(testCase, () => this.#openTest(run, testCase)))
    }

    onTestCaseResult(testCase: TestCase) {
        const run = this.#tryRun(testCase.module)
        return run && this.#enqueue(run, () => this.#inContext(testCase, () => {
            const base = this.#openTest(run, testCase)
            run.entities.delete(testCase.id)
            const result = testCase.result()
            const diagnostic = testCase.diagnostic()
            const attempts = this.#attempts(testCase)
            const finalAttempt = attempts.length - 1
            attempts.slice(0, finalAttempt).forEach(({ calls, marker }, attempt) => {
                const retryBase = this.#attemptBase(base, attempt)
                if (attempt > 0) {
                    this.#emit(run, 'test:start', { ...retryBase, retries: attempt })
                }
                this.#emitHook(run, retryBase, 'beforeEach', marker, true)
                this.#replay(run, calls)
                const times = marker ? { start: marker.start, end: marker.end } : {}
                this.#emit(run, 'test:retry', {
                    ...retryBase, ...times, duration: marker ? marker.end - marker.start : 0, pending: false,
                    ...withHookErrors(toErrorPayload(marker?.error ?? { message: 'test failed' }), marker)
                })
                this.#emitHook(run, retryBase, 'afterEach', marker, true)
            })
            const last = this.#attemptBase(base, finalAttempt)
            if (finalAttempt > 0) {
                this.#emit(run, 'test:start', { ...last, retries: finalAttempt })
            }
            this.#emitHook(run, last, 'beforeEach', attempts[finalAttempt].marker)
            this.#replay(run, attempts[finalAttempt].calls)
            // diagnostic() spans every attempt, so a retried test is timed by its final attempt's marker; a lone attempt keeps diagnostic()
            const finalMarker = finalAttempt > 0 ? attempts[finalAttempt].marker : undefined
            const duration = finalMarker ? finalMarker.end - finalMarker.start : diagnostic?.duration ?? 0
            // Events reach the launcher batched, so the receipt time is not the time the test ran; startTime is the worker's Date.now()
            const times = finalMarker ? { start: finalMarker.start, end: finalMarker.end }
                : diagnostic?.startTime === undefined ? {} : { start: diagnostic.startTime, end: diagnostic.startTime + duration }
            if (result.state === 'failed') {
                run.failedTests++
                const error = toErrorPayload(attempts[finalAttempt].marker?.error ?? result.errors[result.errors.length - 1])
                this.#emit(run, 'test:fail', { ...last, ...times, duration, ...withHookErrors(error, attempts[finalAttempt].marker) })
                this.#emit(run, 'test:end', { ...last, duration, passed: false, error })
            } else if (result.state === 'passed') {
                this.#emit(run, 'test:pass', { ...last, ...times, duration, passed: true })
                this.#emit(run, 'test:end', { ...last, duration, passed: true })
            } else {
                // TestResultPending: collected but never finished; 'skipped' is a deliberate skip
                run.incomplete ||= result.state === 'pending'
                this.#emit(run, 'test:pending', { ...last, ...times, duration, pending: true })
                this.#emit(run, 'test:end', { ...last, duration, passed: false, pending: true })
            }
            this.#emitHook(run, last, 'afterEach', attempts[finalAttempt].marker)
            if (typeof last.contextId === 'string') {
                this.#emit(run, 'context:end', { type: 'context:end', cid: run.cid, uid: last.uid, contextId: last.contextId })
            }
        }))
    }

    onTestModuleEnd(testModule: TestModule) {
        const run = this.#tryRun(testModule)
        if (!run) {
            return
        }
        const done = this.#finish(run, testModule).catch((err) => this.#fail(run, err))
        this.#pending.add(done)
        return done.finally(() => this.#pending.delete(done))
    }

    async onTestRunEnd() {
        await Promise.all(this.#pending)
    }

    #tryRun(testModule: TestModule) {
        try {
            return this.#run(testModule)
        } catch (err) {
            this.#fail(undefined, err)
        }
    }

    #run(testModule: TestModule) {
        const existing = this.#runs.get(testModule.id)
        if (existing) {
            return existing
        }
        const cid = `0-${this.#launched++}`
        const requested = testModule.project.config.provide.wdioCapabilities!
        const caps = ('alwaysMatch' in requested ? requested.alwaysMatch : requested) as WebdriverIO.Capabilities
        const specs = [testModule.moduleId]
        const reporter = this.#config.reporters!.length > 0 ? new BaseReporter(this.#config, cid, caps) : undefined
        reporter?.onMessage((message) => this.#notify(run, { type: 'message', message }))
        const run: ModuleRun = {
            cid, caps, specs, reporter, started: false, failed: false, incomplete: false, failedTests: 0, suiteCount: 0, hookCount: 0, testCount: 0, entities: new Map(), runningHooks: new Map(),
            queue: Promise.resolve()
        }
        this.#runs.set(testModule.id, run)
        this.#notify(run, { type: 'job:start', cid, caps, specs })
        // BaseReporter only hands the resolver to reporters that exist, which initReporters creates asynchronously
        run.queue = reporter?.initReporters()
            .then(() => reporter.setContextIdResolver(() => this.#replayedContext.getStore()))
            .catch((err) => this.#fail(run, err)) ?? Promise.resolve()
        return run
    }

    #fail(run: ModuleRun | undefined, error: unknown) {
        if (run) {
            run.failed = true
        }
        log.error(`Failed to report ${run?.specs[0] ?? 'a Vitest module'} to the WDIO reporters:`, error)
        this.#onError(error)
    }

    #notify(run: ModuleRun, event: Frameworks.FrameworkLaunchEvent) {
        try {
            this.#onEvent(event)
        } catch (err) {
            this.#fail(run, err)
        }
    }

    #enqueue(run: ModuleRun, task: () => unknown) {
        run.queue = run.queue.then(async () => { await task() }).catch((err) => this.#fail(run, err))
        return run.queue
    }

    #inContext<T>(testCase: TestCase, fn: () => T): T {
        return this.#hasLanes(testCase.module) ? this.#replayedContext.run(testCase.id, fn) : fn()
    }

    // The Allure reporter latches into lane mode on the first contextId it sees, so one module must not mix tagged and untagged tests
    #hasLanes(testModule: TestModule) {
        let lanes = this.#laneModules.get(testModule.id)
        if (lanes === undefined) {
            lanes = [...testModule.children.allTests()].some((test) => test.options.concurrent)
            this.#laneModules.set(testModule.id, lanes)
        }
        return lanes
    }

    #relayedEntries(testCase: TestCase) {
        return ((testCase.meta() as Record<string, unknown>)[RUNTIME_META_KEY] ?? []) as RelayedEntry[]
    }
    // The worker closes every attempt with a marker; an attempt that died before it (a failing beforeTest) has none
    #attempts(testCase: TestCase) {
        const entries = this.#relayedEntries(testCase)
        const finalRetry = testCase.diagnostic()?.retryCount ?? 0
        return Array.from({ length: finalRetry + 1 }, (_, attempt) => {
            const own = entries.filter(({ retry }) => retry === attempt)
            const marker = own.find(({ event }) => event === ATTEMPT_EVENT)?.payload as AttemptMarker | undefined
            return { calls: own.filter(({ event }) => event !== ATTEMPT_EVENT), marker }
        })
    }

    // A retry is a new test to the reporters, as in a sequential WDIO run; attempt 0 keeps the uid of the test:start sent when the test became ready
    #attemptBase<T extends { uid: string }>(base: T, attempt: number): T {
        return attempt === 0 ? base : { ...base, uid: `${base.uid}-retry-${attempt}` }
    }

    // The worker reports one outcome per hook kind and attempt, not one per registered hook
    #emitHook(run: ModuleRun, test: Titled & { parent: string, parentUid: string, contextId?: string }, kind: AttemptHookKind, marker?: AttemptMarker, retried = false) {
        const outcome = marker?.hooks?.[kind]
        if (!outcome) {
            return
        }
        const title = `"${HOOK_TITLES[kind]}" hook for "${test.title}"`
        const testParent = test.fullTitle === test.title ? '' : test.fullTitle.slice(0, -(test.title.length + 1))
        const base = {
            uid: `${test.uid}-${kind}`, title, fullTitle: join(testParent, title), parent: test.parent, parentUid: test.parentUid,
            ...(test.contextId !== undefined && { contextId: test.contextId }),
            ...(retried && { retried }),
            // the test (attempt) failed with this error: reporters show the hook, but do not count it again
            ...(outcome.state === 'fail' && { failedTestUid: test.uid })
        }
        const error = outcome.state === 'fail' ? outcome.error ?? marker!.error ?? { message: 'hook failed' } : undefined
        this.#emit(run, 'hook:start', { ...base, type: 'hook:start', cid: run.cid })
        this.#emit(run, 'hook:end', {
            ...base, type: 'hook:end', cid: run.cid, duration: 0, state: outcome.state,
            ...(error && { error: toErrorPayload(error) })
        })
    }

    #replay(run: ModuleRun, calls: RelayedEntry[]) {
        calls.forEach(({ event, payload }) => {
            run.reporter?.emit(event, payload as Parameters<BaseReporter['emit']>[1])
        })
    }

    // Nobody else knows about files of calls that are never replayed, so they would stay in the results folder
    #discardFiles(entries: RelayedEntry[]) {
        entries.forEach(({ pendingFile }) => {
            if (!pendingFile) {
                return
            }
            try {
                rmSync(pendingFile, { force: true })
            } catch (err) {
                log.debug(`Could not remove ${pendingFile}: ${(err as Error).message}`)
            }
        })
    }

    #emit(run: ModuleRun, event: string, payload: Record<string, unknown>) {
        run.reporter?.emit(event, { specs: run.specs, file: run.specs[0], ...payload } as Parameters<BaseReporter['emit']>[1])
    }

    /**
     * Lazy, because the session starts in the setup file's beforeAll, after onTestModuleStart.
     */
    #ensureStarted(run: ModuleRun, testModule: TestModule) {
        if (run.started || !run.reporter) {
            return
        }
        run.started = true
        const session = (testModule.meta() as Record<string, unknown>)[SESSION_META_KEY] as SessionMeta | undefined
        const sessionId = session?.sessionId ?? ''
        // The session capabilities lack the requested ones the driver drops, such as appium:deviceName
        const capabilities = { ...run.caps, ...session?.capabilities, sessionId }
        run.reporter.caps = capabilities as typeof run.reporter.caps
        this.#emit(run, 'runner:start', {
            config: this.#config,
            capabilities,
            sessionId,
            isMultiRemote: false,
            instanceOptions: { [sessionId]: this.#config },
            retry: 0
        })
    }

    #parent(run: ModuleRun, parent: TestSuite | TestModule): Titled {
        if (parent.type === 'suite') {
            return this.#openSuite(run, parent)
        }
        if (!run.wrapper) {
            const title = parent.relativeModuleId
            run.wrapper = { uid: `suite-${run.cid}-${run.suiteCount++}`, title, fullTitle: title }
            this.#emit(run, 'suite:start', { ...run.wrapper, parent: '', parentUid: null })
        }
        return run.wrapper
    }

    // Reporters nest suites on a stack, so the wrapper must not overlap a top-level describe
    #closeWrapper(run: ModuleRun) {
        if (run.wrapper) {
            this.#emit(run, 'suite:end', { ...run.wrapper, parent: '', parentUid: null })
            run.wrapper = undefined
        }
    }

    #suitePayload(run: ModuleRun, testSuite: TestSuite, suite: Titled) {
        return { ...suite, parent: '', parentUid: testSuite.parent.type === 'suite' ? this.#parent(run, testSuite.parent).uid : null }
    }

    #openSuite(run: ModuleRun, testSuite: TestSuite): Titled {
        this.#ensureStarted(run, testSuite.module)
        const known = run.entities.get(testSuite.id)
        if (known) {
            return known
        }
        if (testSuite.parent.type !== 'suite') {
            this.#closeWrapper(run)
        }
        const parent = testSuite.parent.type === 'suite' ? this.#parent(run, testSuite.parent) : undefined
        const titled = { uid: `suite-${run.cid}-${run.suiteCount++}`, title: testSuite.name, fullTitle: join(parent?.fullTitle ?? '', testSuite.name) }
        const payload = this.#suitePayload(run, testSuite, titled)
        const suite: Open = { ...titled, kind: 'suite', payload }
        run.entities.set(testSuite.id, suite)
        this.#emit(run, 'suite:start', payload)
        return suite
    }

    #openTest(run: ModuleRun, testCase: TestCase) {
        this.#ensureStarted(run, testCase.module)
        const known = run.entities.get(testCase.id)
        const parent = this.#parent(run, testCase.parent)
        const test = known ?? { uid: `test-${run.cid}-${run.testCount++}`, title: testCase.name, fullTitle: join(parent.fullTitle, testCase.name) }
        const base = { uid: test.uid, title: test.title, fullTitle: test.fullTitle, parent: parent.title, parentUid: parent.uid, ...(this.#hasLanes(testCase.module) && { contextId: testCase.id }) }
        if (!known) {
            run.entities.set(testCase.id, { ...test, kind: 'test', payload: base })
            this.#emit(run, 'test:start', base)
        }
        return base
    }

    /**
     * Mocha reports a failing all-hook as a failed hook of its suite, which the JUnit reporter turns into a failed testcase.
     */
    #emitFailedHook(run: ModuleRun, entity: TestSuite | TestModule, parent: Titled, title: string) {
        const unfinished = run.runningHooks.get(entity.id)
        run.runningHooks.delete(entity.id)
        const hookNames = ALL_HOOK_NAMES.filter((name) => unfinished?.has(name))
        const errors = hookNames.length > 0 ? entity.errors() : []
        hookNames.forEach((hookName, index) => {
            const kind = HOOK_KIND[hookName]
            const hookTitle = `"${kind}" hook in "${title}"`
            const hook = { title: hookTitle, fullTitle: hookTitle, parent: parent.title, parentUid: parent.uid, uid: `hook-${run.cid}-${run.hookCount++}` }
            const own = hookNames.length > 1 && errors.length > 1 ? errors[index === 0 ? 0 : errors.length - 1] : errors[0]
            const error = toErrorPayload(own ?? { message: `${hookName} hook failed` })
            this.#emit(run, 'hook:start', hook)
            this.#emit(run, 'hook:end', { ...hook, state: 'fail', duration: 0, error })
        })
    }

    /**
     * Bail, a failing beforeAll or an abort leave entities that became ready without a result.
     */
    #closeUnfinished(run: ModuleRun, testModule: TestModule, failed: boolean) {
        const open = [...run.entities.values()]
        const unfinishedIds = new Set([...run.entities].filter(([, { kind }]) => kind === 'test').map(([id]) => id))
        for (const testCase of testModule.children.allTests()) {
            if (unfinishedIds.has(testCase.id)) {
                this.#discardFiles(this.#relayedEntries(testCase))
            }
        }
        for (const { kind, payload } of open) {
            if (kind !== 'test') {
                continue
            }
            const close = () => {
                if (failed) {
                    run.failedTests++
                    const error = toErrorPayload(testModule.errors()[0] ?? { message: 'test did not finish' })
                    this.#emit(run, 'test:fail', { ...payload, duration: 0, error })
                    this.#emit(run, 'test:end', { ...payload, duration: 0, passed: false, error })
                } else {
                    this.#emit(run, 'test:pending', { ...payload, duration: 0, pending: true })
                    this.#emit(run, 'test:end', { ...payload, duration: 0, passed: false, pending: true })
                }
            }
            if (typeof payload.contextId === 'string') {
                this.#replayedContext.run(payload.contextId, close)
            } else {
                close()
            }
        }
        for (const { kind, payload } of open.reverse()) {
            if (kind === 'suite') {
                this.#emit(run, 'suite:end', payload)
            }
        }
        run.entities.clear()
    }

    async #finish(run: ModuleRun, testModule: TestModule) {
        await this.#enqueue(run, async () => {
            try {
                this.#ensureStarted(run, testModule)
                const state = testModule.state()
                const failed = state === 'failed'
                // TestModuleState 'pending': the module did not finish, which a cancelled run leaves behind
                run.incomplete ||= state === 'pending'
                if (run.runningHooks.get(testModule.id)?.size) {
                    this.#emitFailedHook(run, testModule, this.#parent(run, testModule), '{root}')
                }
                this.#closeUnfinished(run, testModule, failed)
                this.#closeWrapper(run)
                // An import or setup error leaves no failed test or hook to report it, so it goes on runner:end like the
                // WDIO runner's session init error, which the JUnit reporter writes as the failure of an empty suite
                const moduleError = failed && run.failedTests === 0 && run.hookCount === 0 ? testModule.errors()[0] : undefined
                // session or hook errors skip the tests, so the module fails without a failed test
                if ((failed || run.incomplete) && run.failedTests === 0) {
                    run.failedTests = 1
                }
                this.#emit(run, 'runner:end', { failures: run.failedTests, retries: 0, ...(moduleError && { error: moduleError.message }) })
            } finally {
                await run.reporter?.waitForSync()
            }
        })
        this.#runs.delete(testModule.id)
        this.#laneModules.delete(testModule.id)
        this.#notify(run, { type: 'job:end', cid: run.cid, passed: run.failedTests === 0 && !run.failed && !run.incomplete })
    }
}
