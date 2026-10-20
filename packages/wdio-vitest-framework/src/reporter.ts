import logger from '@wdio/logger'
import { BaseReporter } from '@wdio/runner'
import type { Frameworks, Options } from '@wdio/types'
import type { Reporter, TestCase, TestModule, TestSuite } from 'vitest/node'

import { SESSION_META_KEY, type SessionMeta } from './types.js'

const log = logger('@wdio/vitest-framework')

// Vitest's console reporter always prints, so a WDIO console reporter would duplicate the output
const CONSOLE_REPORTERS = new Set(['spec', 'dot', 'concise', '@wdio/spec-reporter', '@wdio/dot-reporter', '@wdio/concise-reporter'])

type TestError = { name?: string, message: string, stack?: string }
type Titled = { uid: string, title: string, fullTitle: string }
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
    testCount: number
    entities: Map<string, Open>
    wrapper?: Titled
}

const toErrorPayload = ({ name, message, stack }: TestError) => ({ name: name || 'Error', message, stack })
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
            run.entities.delete(testSuite.id)
            this.#emit(run, 'suite:end', this.#suitePayload(run, testSuite, suite))
        })
    }

    onTestCaseReady(testCase: TestCase) {
        const run = this.#tryRun(testCase.module)
        return run && this.#enqueue(run, () => this.#openTest(run, testCase))
    }

    onTestCaseResult(testCase: TestCase) {
        const run = this.#tryRun(testCase.module)
        return run && this.#enqueue(run, () => {
            const base = this.#openTest(run, testCase)
            run.entities.delete(testCase.id)
            const result = testCase.result()
            const duration = testCase.diagnostic()?.duration ?? 0
            if (result.state === 'failed') {
                run.failedTests++
                const error = toErrorPayload(result.errors[0])
                this.#emit(run, 'test:fail', { ...base, duration, error })
                this.#emit(run, 'test:end', { ...base, duration, passed: false, error })
            } else if (result.state === 'passed') {
                this.#emit(run, 'test:pass', { ...base, duration, passed: true })
                this.#emit(run, 'test:end', { ...base, duration, passed: true })
            } else {
                // TestResultPending: collected but never finished; 'skipped' is a deliberate skip
                run.incomplete ||= result.state === 'pending'
                this.#emit(run, 'test:pending', { ...base, duration, pending: true })
                this.#emit(run, 'test:end', { ...base, duration, passed: false, pending: true })
            }
        })
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
            cid, caps, specs, reporter, started: false, failed: false, incomplete: false, failedTests: 0, suiteCount: 0, testCount: 0, entities: new Map(),
            queue: Promise.resolve()
        }
        this.#runs.set(testModule.id, run)
        this.#notify(run, { type: 'job:start', cid, caps, specs })
        run.queue = reporter?.initReporters().catch((err) => this.#fail(run, err)) ?? Promise.resolve()
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
        const base = { uid: test.uid, title: test.title, fullTitle: test.fullTitle, parent: parent.title, parentUid: parent.uid }
        if (!known) {
            run.entities.set(testCase.id, { ...test, kind: 'test', payload: base })
            this.#emit(run, 'test:start', base)
        }
        return base
    }

    /**
     * Bail, a failing beforeAll or an abort leave entities that became ready without a result.
     */
    #closeUnfinished(run: ModuleRun, testModule: TestModule, failed: boolean) {
        const open = [...run.entities.values()]
        for (const { kind, payload } of open) {
            if (kind !== 'test') {
                continue
            }
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
                this.#closeUnfinished(run, testModule, failed)
                this.#closeWrapper(run)
                // session or hook errors skip the tests, so the module fails without a failed test
                if ((failed || run.incomplete) && run.failedTests === 0) {
                    run.failedTests = 1
                }
                this.#emit(run, 'runner:end', { failures: run.failedTests, retries: 0 })
            } finally {
                await run.reporter?.waitForSync()
            }
        })
        this.#runs.delete(testModule.id)
        this.#notify(run, { type: 'job:end', cid: run.cid, passed: run.failedTests === 0 && !run.failed && !run.incomplete })
    }
}
