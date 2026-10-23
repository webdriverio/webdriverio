import { beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '@wdio/logger'

import { WdioBridgeReporter } from '../src/reporter.js'

const initGate = vi.hoisted(() => ({ promise: undefined as Promise<void> | undefined }))
const instances = vi.hoisted(() => [] as {
    cid: string
    caps: unknown
    config: { reporters?: unknown[] }
    emitted: [string, Record<string, any>][]
    listener?: (message: unknown) => void
    waitForSync: ReturnType<typeof vi.fn>
    initReporters: ReturnType<typeof vi.fn>
}[])

vi.mock('@wdio/runner', () => ({
    BaseReporter: class {
        emitted: [string, Record<string, any>][] = []
        listener?: (message: unknown) => void
        initReporters = vi.fn(() => initGate.promise ?? Promise.resolve())
        waitForSync = vi.fn().mockResolvedValue(undefined)
        constructor(public config: unknown, public cid: string, public caps: unknown) {
            instances.push(this as never)
        }
        emit(event: string, payload: Record<string, any>) {
            this.emitted.push([event, { ...payload }])
        }
        onMessage(listener: (message: unknown) => void) {
            this.listener = listener
        }
    }
}))

const requestedCaps = { browserName: 'chrome', 'appium:deviceName': 'Pixel' }
const sessionCaps = { browserName: 'chrome', browserVersion: '130' }

type Result = { state: 'passed' | 'failed' | 'skipped', errors?: { name?: string, message: string, stack?: string }[] }
const passed: Result = { state: 'passed' }

let nextId = 0
const makeModule = (overrides: Record<string, unknown> = {}) => ({
    type: 'module' as const,
    id: 'chrome-0:/repo/a.spec.ts',
    moduleId: '/repo/a.spec.ts',
    relativeModuleId: 'a.spec.ts',
    project: { config: { provide: { wdioCapabilities: requestedCaps } } },
    meta: () => ({ wdio: { sessionId: 'sess-1', capabilities: sessionCaps } }),
    state: () => 'passed',
    ...overrides
}) as any
const makeSuite = (module: any, parent: any, name: string) => ({ type: 'suite' as const, id: `suite-${nextId++}`, name, module, parent }) as any
const makeTest = (module: any, parent: any, name: string, result: Result, duration?: number) => ({
    type: 'test' as const,
    id: `test-${nextId++}`,
    name,
    module,
    parent,
    result: () => result,
    diagnostic: () => duration === undefined ? undefined : { duration }
}) as any

const config = { reporters: ['junit'] } as WebdriverIO.Config

describe('WdioBridgeReporter', () => {
    let events: any[]
    let errors: unknown[]
    let reporter: WdioBridgeReporter

    const runTests = async (module: any, ...entities: ({ suite: any, tests?: any[] } | any)[]) => {
        reporter.onTestModuleStart(module)
        for (const entity of entities) {
            if (entity.type === 'suite') {
                await reporter.onTestSuiteReady(entity)
            } else {
                await reporter.onTestCaseReady(entity)
                await reporter.onTestCaseResult(entity)
            }
        }
    }
    const describeBlock = async (suite: any, tests: any[]) => {
        await reporter.onTestSuiteReady(suite)
        for (const test of tests) {
            await reporter.onTestCaseReady(test)
            await reporter.onTestCaseResult(test)
        }
        await reporter.onTestSuiteResult(suite)
    }
    const emittedOf = () => instances[instances.length - 1].emitted
    const names = (emitted: [string, unknown][]) => emitted.map(([name]) => name)

    beforeEach(() => {
        instances.length = 0
        initGate.promise = undefined
        nextId = 0
        events = []
        errors = []
        reporter = new WdioBridgeReporter(config, (event) => events.push(event), (err) => errors.push(err))
    })

    it('emits job:start with the requested caps and job:end passed for a passing module', async () => {
        const module = makeModule()
        const login = makeSuite(module, module, 'login')
        reporter.onTestModuleStart(module)
        await describeBlock(login, [makeTest(module, login, 'shows form', passed, 12)])
        await reporter.onTestModuleEnd(module)

        expect(events[0]).toEqual({ type: 'job:start', cid: '0-0', caps: requestedCaps, specs: ['/repo/a.spec.ts'] })
        expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: true })
    })

    it('emits job:start on onTestModuleStart without creating events for the reporters yet', () => {
        reporter.onTestModuleStart(makeModule())

        expect(events).toEqual([{ type: 'job:start', cid: '0-0', caps: requestedCaps, specs: ['/repo/a.spec.ts'] }])
        expect(emittedOf()).toEqual([])
    })

    it('streams a passing test inside its describe with duration', async () => {
        const module = makeModule()
        const login = makeSuite(module, module, 'login')
        reporter.onTestModuleStart(module)
        await describeBlock(login, [makeTest(module, login, 'shows form', passed, 12)])
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        expect(names(emitted)).toEqual(['runner:start', 'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end', 'runner:end'])
        expect(emitted[0][1]).toMatchObject({
            specs: ['/repo/a.spec.ts'],
            sessionId: 'sess-1',
            isMultiRemote: false,
            capabilities: { browserName: 'chrome', browserVersion: '130', sessionId: 'sess-1' },
            retry: 0
        })
        expect(Object.keys(emitted[0][1].instanceOptions)).toEqual(['sess-1'])
        expect(emitted[1][1]).toMatchObject({ uid: 'suite-0-0-0', title: 'login', fullTitle: 'login', parent: '', parentUid: null })
        expect(emitted[2][1]).toMatchObject({ uid: 'test-0-0-0', title: 'shows form', fullTitle: 'login shows form', parent: 'login', parentUid: 'suite-0-0-0' })
        expect(emitted[3][1]).toMatchObject({ duration: 12, passed: true })
        expect(emitted[4][1]).toMatchObject({ duration: 12, passed: true })
        expect(emitted[5][1]).toMatchObject({ uid: 'suite-0-0-0', title: 'login' })
        expect(emitted[6][1]).toEqual({ specs: ['/repo/a.spec.ts'], file: '/repo/a.spec.ts', failures: 0, retries: 0 })
    })

    it('emits test:start when the test becomes ready, before its result exists', async () => {
        const module = makeModule()
        const test = makeTest(module, module, 'alone', passed, 3)
        reporter.onTestModuleStart(module)
        await reporter.onTestCaseReady(test)

        expect(names(emittedOf())).toEqual(['runner:start', 'suite:start', 'test:start'])
    })

    it('reports a failed test with the error shape and fails the job', async () => {
        const boom = { name: 'AssertionError', message: 'expected 1 to be 2', stack: 'at spec', diff: 'ignored' }
        const module = makeModule({ state: () => 'failed' })
        const s = makeSuite(module, module, 's')
        reporter.onTestModuleStart(module)
        await describeBlock(s, [makeTest(module, s, 'bad', { state: 'failed', errors: [boom] }, 5)])
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        const error = { name: 'AssertionError', message: 'expected 1 to be 2', stack: 'at spec' }
        expect(emitted.find(([name]) => name === 'test:fail')![1]).toMatchObject({ duration: 5, error })
        expect(emitted.find(([name]) => name === 'test:end')![1]).toMatchObject({ passed: false, error })
        expect(emitted.at(-1)![1]).toMatchObject({ failures: 1 })
        expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: false })
    })

    it('defaults the error name', async () => {
        const module = makeModule({ state: () => 'failed' })
        reporter.onTestModuleStart(module)
        await runTests(module, makeTest(module, module, 'bad', { state: 'failed', errors: [{ message: 'nope' }] }))

        expect(emittedOf().find(([name]) => name === 'test:fail')![1].error).toMatchObject({ name: 'Error', message: 'nope' })
    })

    it('counts a failed module without a failed test as one failure', async () => {
        const module = makeModule({ state: () => 'failed' })
        reporter.onTestModuleStart(module)
        await reporter.onTestModuleEnd(module)

        expect(emittedOf().at(-1)![1]).toMatchObject({ failures: 1 })
        expect(events.at(-1)).toMatchObject({ type: 'job:end', passed: false })
    })

    it('reports skipped tests without a ready event as pending with zero duration', async () => {
        const module = makeModule()
        const s = makeSuite(module, module, 's')
        const skipped = makeTest(module, s, 'later', { state: 'skipped' })
        reporter.onTestModuleStart(module)
        await reporter.onTestSuiteReady(s)
        await reporter.onTestCaseResult(skipped)
        await reporter.onTestSuiteResult(s)
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        expect(names(emitted)).toEqual(['runner:start', 'suite:start', 'test:start', 'test:pending', 'test:end', 'suite:end', 'runner:end'])
        expect(emitted.find(([name]) => name === 'test:pending')![1]).toMatchObject({ pending: true, duration: 0 })
        expect(emitted.find(([name]) => name === 'test:end')![1]).toMatchObject({ pending: true, passed: false })
        expect(events.at(-1)).toMatchObject({ passed: true })
    })

    it('emits job:end passed false when the module never finished (cancelled run)', async () => {
        const module = makeModule({ state: () => 'pending' })
        const s = makeSuite(module, module, 'cancelled')
        reporter.onTestModuleStart(module)
        await reporter.onTestSuiteReady(s)
        const test = makeTest(module, s, 'interrupted', { state: 'pending' })
        await reporter.onTestCaseReady(test)
        await reporter.onTestModuleEnd(module)
        expect(emittedOf().find(([name]) => name === 'runner:end')![1]).toMatchObject({ failures: 1 })
        expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: false })
    })

    it('emits job:end passed false when a test result is still pending', async () => {
        const module = makeModule({ state: () => 'skipped' })
        const s = makeSuite(module, module, 's')
        await runTests(module, makeTest(module, s, 'never ran', { state: 'pending' }))
        await reporter.onTestModuleEnd(module)
        expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: false })
    })

    it('keeps job:end passed for a module with only deliberately skipped tests', async () => {
        const module = makeModule({ state: () => 'skipped' })
        const s = makeSuite(module, module, 's')
        await runTests(module, makeTest(module, s, 'skipped', { state: 'skipped' }))
        await reporter.onTestModuleEnd(module)
        expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: true })
    })

    it('nests describes through parentUid', async () => {
        const module = makeModule()
        const outer = makeSuite(module, module, 'outer')
        const inner = makeSuite(module, outer, 'inner')
        const deep = makeTest(module, inner, 'deep', passed, 1)
        reporter.onTestModuleStart(module)
        await reporter.onTestSuiteReady(outer)
        await describeBlock(inner, [deep])
        await reporter.onTestSuiteResult(outer)
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        const suiteStarts = emitted.filter(([name]) => name === 'suite:start').map(([, payload]) => payload)
        expect(suiteStarts[0]).toMatchObject({ uid: 'suite-0-0-0', parentUid: null, fullTitle: 'outer' })
        expect(suiteStarts[1]).toMatchObject({ uid: 'suite-0-0-1', parentUid: 'suite-0-0-0', title: 'inner', fullTitle: 'outer inner' })
        expect(emitted.find(([name]) => name === 'test:start')![1]).toMatchObject({ parentUid: 'suite-0-0-1', parent: 'inner', fullTitle: 'outer inner deep' })
        expect(emitted.filter(([name]) => name === 'suite:end').map(([, payload]) => payload.uid)).toEqual(['suite-0-0-1', 'suite-0-0-0'])
        expect(names(emitted)).toEqual([
            'runner:start', 'suite:start', 'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end', 'suite:end', 'runner:end'
        ])
    })

    it('wraps top-level tests in a suite titled with the relative spec path and closes it at module end', async () => {
        const module = makeModule()
        reporter.onTestModuleStart(module)
        await runTests(module, makeTest(module, module, 'alone', passed, 3), makeTest(module, module, 'second', passed, 1))
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        expect(names(emitted)).toEqual([
            'runner:start', 'suite:start', 'test:start', 'test:pass', 'test:end', 'test:start', 'test:pass', 'test:end', 'suite:end', 'runner:end'
        ])
        expect(emitted[1][1]).toMatchObject({ uid: 'suite-0-0-0', title: 'a.spec.ts', fullTitle: 'a.spec.ts', parentUid: null })
        expect(emitted[2][1]).toMatchObject({ title: 'alone', fullTitle: 'a.spec.ts alone', parentUid: 'suite-0-0-0' })
        expect(emitted[8][1]).toMatchObject({ uid: 'suite-0-0-0' })
    })

    it('merges the requested caps below the session caps in runner:start', async () => {
        const module = makeModule()
        reporter.onTestModuleStart(module)
        await reporter.onTestSuiteReady(makeSuite(module, module, 's'))

        const emitted = emittedOf()
        expect(emitted[0][1].capabilities).toEqual({ browserName: 'chrome', 'appium:deviceName': 'Pixel', browserVersion: '130', sessionId: 'sess-1' })
        expect(instances[0].caps).toEqual(emitted[0][1].capabilities)
    })

    it('falls back to the requested caps and an empty session id without session meta', async () => {
        const module = makeModule({ meta: () => ({}) })
        reporter.onTestModuleStart(module)
        await reporter.onTestModuleEnd(module)

        expect(emittedOf()[0][1]).toMatchObject({ sessionId: '', capabilities: { ...requestedCaps, sessionId: '' } })
    })

    it('reads the session meta when the first suite or test is ready, not at module start', async () => {
        let meta: Record<string, unknown> = {}
        const module = makeModule({ meta: () => meta })
        reporter.onTestModuleStart(module)
        meta = { wdio: { sessionId: 'late', capabilities: sessionCaps } }
        await reporter.onTestSuiteReady(makeSuite(module, module, 's'))

        expect(emittedOf()[0][1]).toMatchObject({ sessionId: 'late' })
    })

    it('gives every module its own cid and reporter', async () => {
        const first = makeModule({ id: 'm1' })
        const second = makeModule({ id: 'm2' })
        for (const module of [first, second]) {
            reporter.onTestModuleStart(module)
            await reporter.onTestModuleEnd(module)
        }

        expect(instances.map(({ cid }) => cid)).toEqual(['0-0', '0-1'])
        expect(events.filter(({ type }) => type === 'job:end').map(({ cid }) => cid)).toEqual(['0-0', '0-1'])
    })

    it('forwards reporter messages with their cid', async () => {
        const module = makeModule()
        reporter.onTestModuleStart(module)
        await reporter.onTestModuleEnd(module)

        instances[0].listener!({ origin: 'reporter', name: 'printFailureMessage', cid: '0-0' })
        expect(events.filter(({ type }) => type === 'message')).toEqual([{ type: 'message', message: { origin: 'reporter', name: 'printFailureMessage', cid: '0-0' } }])
    })

    it('does not emit job:end before the reporters synced', async () => {
        const module = makeModule()
        reporter.onTestModuleStart(module)
        let resolveSync!: () => void
        instances[0].waitForSync.mockReturnValue(new Promise<void>((resolve) => { resolveSync = resolve }))

        const pending = reporter.onTestModuleEnd(module)
        await vi.waitFor(() => expect(instances[0].waitForSync).toHaveBeenCalled())
        expect(events.some(({ type }) => type === 'job:end')).toBe(false)

        resolveSync()
        await pending
        expect(events.at(-1)).toMatchObject({ type: 'job:end', passed: true })
    })

    it('keeps events in order when the reporter init is slow', async () => {
        const module = makeModule()
        let resolveInit!: () => void
        initGate.promise = new Promise<void>((resolve) => { resolveInit = resolve })
        reporter.onTestModuleStart(module)
        const test = makeTest(module, module, 'alone', passed, 1)
        const ready = reporter.onTestCaseReady(test)
        const result = reporter.onTestCaseResult(test)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(emittedOf()).toEqual([])
        resolveInit()
        await Promise.all([ready, result])

        expect(names(emittedOf())).toEqual(['runner:start', 'suite:start', 'test:start', 'test:pass', 'test:end'])
    })

    it('creates the job on demand for a module that never started', async () => {
        const module = makeModule()
        await reporter.onTestModuleEnd(module)

        expect(events.map(({ type }) => type)).toEqual(['job:start', 'job:end'])
        expect(names(emittedOf())).toEqual(['runner:start', 'runner:end'])
    })

    it('does not mutate the passed config and copies the reporters', async () => {
        const original = { reporters: ['junit'] as unknown[] } as WebdriverIO.Config
        const bridge = new WdioBridgeReporter(original, () => {})
        bridge.onTestModuleStart(makeModule())

        const passedConfig = instances[0].config
        expect(passedConfig).not.toBe(original)
        expect(passedConfig.reporters).not.toBe(original.reporters)
        passedConfig.reporters!.push('dot')
        expect(original.reporters).toEqual(['junit'])
    })

    describe('console reporters', () => {
        const build = (reporters: unknown[]) => {
            const bridge = new WdioBridgeReporter({ reporters } as WebdriverIO.Config, (event) => events.push(event))
            bridge.onTestModuleStart(makeModule())
            return bridge
        }

        it('drops string and tuple console reporters and keeps the others', () => {
            build(['spec', ['@wdio/dot-reporter', {}], 'concise', ['junit', { outputDir: 'x' }], 'allure'])

            expect(instances[0].config.reporters).toEqual([['junit', { outputDir: 'x' }], 'allure'])
        })

        it('keeps only junit for a mixed spec and junit list', () => {
            build(['spec', ['junit', { outputDir: 'x' }]])

            expect(instances[0].config.reporters).toEqual([['junit', { outputDir: 'x' }]])
        })

        it('passes class reporters through, also as a tuple', () => {
            class spec {}
            class Custom {}
            build([spec, [Custom, { a: 1 }]])

            expect(instances[0].config.reporters).toEqual([spec, [Custom, { a: 1 }]])
        })

        it('warns once with the dropped names', () => {
            const warn = vi.spyOn(logger('@wdio/vitest-framework'), 'warn')
            const bridge = build(['spec', ['dot', {}], 'junit'])
            bridge.onTestModuleStart(makeModule({ id: 'other' }))

            expect(warn).toHaveBeenCalledTimes(1)
            expect(warn.mock.calls[0][0]).toContain('spec, dot')
        })

        it('does not warn when nothing is dropped', () => {
            const warn = vi.spyOn(logger('@wdio/vitest-framework'), 'warn')
            warn.mockClear()
            build(['junit'])

            expect(warn).not.toHaveBeenCalled()
        })

        it.each([
            ['passed', passed, true],
            ['failed', { state: 'failed', errors: [{ message: 'boom' }] } as Result, false]
        ])('constructs no BaseReporter but still emits job events for a %s module', async (_, result, expected) => {
            const bridge = build(['spec'])
            const module = makeModule({ state: () => result.state })
            const test = makeTest(module, module, 'alone', result, 1)
            await bridge.onTestCaseReady(test)
            await bridge.onTestCaseResult(test)
            await bridge.onTestModuleEnd(module)

            expect(instances).toHaveLength(0)
            expect(events.map(({ type }) => type)).toEqual(['job:start', 'job:end'])
            expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: expected })
        })

        it('counts a module that failed without a failed test', async () => {
            const bridge = build([])
            await bridge.onTestModuleEnd(makeModule({ state: () => 'failed', errors: () => [] }))

            expect(instances).toHaveLength(0)
            expect(events.at(-1)).toMatchObject({ type: 'job:end', passed: false })
        })
    })

    it('emits job:end with passed false and counts an error when onEvent throws', async () => {
        const failing = new WdioBridgeReporter(config, (event) => {
            if (event.type === 'job:start') {
                throw new Error('cli interface exploded')
            }
        }, (err) => errors.push(err))
        const module = makeModule()
        failing.onTestModuleStart(module)
        await failing.onTestModuleEnd(module)

        expect(errors).toHaveLength(1)
        expect(names(emittedOf())).toEqual(['runner:start', 'runner:end'])
    })

    it('does not throw from the hooks and counts an error when the module cannot be set up', async () => {
        const broken = makeModule({ project: undefined })

        expect(() => reporter.onTestModuleStart(broken)).not.toThrow()
        await reporter.onTestModuleEnd(broken)
        await reporter.onTestRunEnd()
        expect(errors).toHaveLength(2)
        expect(events).toEqual([])
    })

    it('counts module work that rejects and settles before onTestRunEnd', async () => {
        const failing = new WdioBridgeReporter(config, (event) => {
            if (event.type === 'job:end') {
                throw new Error('cli interface exploded')
            }
        }, (err) => errors.push(err))
        const module = makeModule()
        failing.onTestModuleStart(module)
        await failing.onTestModuleEnd(module)
        expect(errors).toHaveLength(1)
        await failing.onTestRunEnd()

        expect(errors).toHaveLength(1)
    })

    it('closes a wrapper suite before a top-level describe starts and opens a new one for later top-level tests', async () => {
        const module = makeModule()
        const s = makeSuite(module, module, 'block')
        reporter.onTestModuleStart(module)
        await runTests(module, makeTest(module, module, 'first', passed, 1))
        await describeBlock(s, [makeTest(module, s, 'inner', passed, 1)])
        await runTests(module, makeTest(module, module, 'last', passed, 1))
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        expect(names(emitted)).toEqual([
            'runner:start',
            'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end',
            'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end',
            'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end',
            'runner:end'
        ])
        const uids = emitted.filter(([name]) => name === 'suite:start').map(([, payload]) => payload.uid)
        expect(new Set(uids).size).toBe(3)
        expect(emitted.filter(([name]) => name === 'suite:start').map(([, payload]) => payload.parentUid)).toEqual([null, null, null])
        expect(emitted.filter(([name]) => name === 'suite:end').map(([, payload]) => payload.uid)).toEqual(uids)
        expect(emitted.filter(([name]) => name === 'test:start').map(([, payload]) => payload.parentUid)).toEqual(uids)
    })

    it('fails tests and closes suites that never got a result when the module failed', async () => {
        const module = makeModule({ state: () => 'failed', errors: () => [{ name: 'Error', message: 'beforeAll exploded' }] })
        const outer = makeSuite(module, module, 'outer')
        const inner = makeSuite(module, outer, 'inner')
        const test = makeTest(module, inner, 'stuck', passed)
        reporter.onTestModuleStart(module)
        await reporter.onTestSuiteReady(outer)
        await reporter.onTestSuiteReady(inner)
        await reporter.onTestCaseReady(test)
        await reporter.onTestModuleEnd(module)

        const emitted = emittedOf()
        expect(names(emitted)).toEqual([
            'runner:start', 'suite:start', 'suite:start', 'test:start', 'test:fail', 'test:end', 'suite:end', 'suite:end', 'runner:end'
        ])
        expect(emitted.find(([name]) => name === 'test:fail')![1]).toMatchObject({ uid: 'test-0-0-0', error: { name: 'Error', message: 'beforeAll exploded' } })
        expect(emitted.filter(([name]) => name === 'suite:end').map(([, payload]) => payload.uid)).toEqual(['suite-0-0-1', 'suite-0-0-0'])
        expect(emitted.at(-1)![1]).toMatchObject({ failures: 1 })
        expect(events.at(-1)).toMatchObject({ passed: false })
    })

    describe('failing all-hooks', () => {
        const hookEvents = (emitted: [string, Record<string, any>][]) => emitted.filter(([name]) => name.startsWith('hook:'))

        it('reports a failing afterAll as a paired failed hook before its suite ends', async () => {
            const module = makeModule()
            const s = makeSuite(module, module, 'cleanup')
            s.errors = () => [{ name: 'Error', message: 'after boom', stack: 'at hook' }]
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'beforeAll', entity: s })
            reporter.onHookEnd({ name: 'beforeAll', entity: s })
            reporter.onHookStart({ name: 'afterAll', entity: s })
            await describeBlock(s, [makeTest(module, s, 'ok', passed)])
            await reporter.onTestModuleEnd(module)

            const emitted = emittedOf()
            expect(names(emitted)).toEqual(['runner:start', 'suite:start', 'test:start', 'test:pass', 'test:end', 'hook:start', 'hook:end', 'suite:end', 'runner:end'])
            const [[, start], [, end]] = hookEvents(emitted)
            expect(start).toMatchObject({ title: '"after all" hook in "cleanup"', parent: 'cleanup', parentUid: 'suite-0-0-0', file: '/repo/a.spec.ts' })
            expect(end).toMatchObject({ uid: start.uid, title: start.title, state: 'fail', error: { name: 'Error', message: 'after boom', stack: 'at hook' } })
        })

        it('reports a failing beforeAll with the before all title', async () => {
            const module = makeModule()
            const s = makeSuite(module, module, 'setup')
            s.errors = () => [{ message: 'before boom' }]
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'beforeAll', entity: s })
            await describeBlock(s, [])
            await reporter.onTestModuleEnd(module)

            const [[, start], [, end]] = hookEvents(emittedOf())
            expect(start.title).toBe('"before all" hook in "setup"')
            expect(end).toMatchObject({ uid: start.uid, state: 'fail', error: { name: 'Error', message: 'before boom' } })
        })

        it('reports a failing module level hook under the root title', async () => {
            const module = makeModule({ state: () => 'failed', errors: () => [{ name: 'Error', message: 'session boom' }] })
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'beforeAll', entity: module })
            await reporter.onTestModuleEnd(module)

            const emitted = emittedOf()
            const [[, start], [, end]] = hookEvents(emitted)
            expect(start).toMatchObject({ title: '"before all" hook in "{root}"', parent: 'a.spec.ts' })
            expect(end).toMatchObject({ uid: start.uid, state: 'fail', error: { message: 'session boom' } })
            expect(names(emitted).indexOf('hook:end')).toBeLessThan(names(emitted).indexOf('suite:end'))
        })

        it('emits no hook events for hooks that finished', async () => {
            const module = makeModule()
            const s = makeSuite(module, module, 'fine')
            reporter.onTestModuleStart(module)
            for (const name of ['beforeAll', 'afterAll'] as const) {
                reporter.onHookStart({ name, entity: s })
                reporter.onHookEnd({ name, entity: s })
            }
            reporter.onHookStart({ name: 'beforeAll', entity: module })
            reporter.onHookEnd({ name: 'beforeAll', entity: module })
            await describeBlock(s, [makeTest(module, s, 'ok', passed)])
            await reporter.onTestModuleEnd(module)

            expect(hookEvents(emittedOf())).toEqual([])
        })
    })

    it('uses a generic error for an unfinished test when the module has no errors', async () => {
        const module = makeModule({ state: () => 'failed', errors: () => [] })
        const test = makeTest(module, module, 'stuck', passed)
        reporter.onTestModuleStart(module)
        await reporter.onTestCaseReady(test)
        await reporter.onTestModuleEnd(module)

        expect(emittedOf().find(([name]) => name === 'test:fail')![1].error).toMatchObject({ name: 'Error', message: 'test did not finish' })
    })

    it('reports unfinished tests as pending when the module did not fail', async () => {
        const module = makeModule()
        const s = makeSuite(module, module, 's')
        reporter.onTestModuleStart(module)
        await reporter.onTestSuiteReady(s)
        await reporter.onTestCaseReady(makeTest(module, s, 'skipped by bail', passed))
        await reporter.onTestModuleEnd(module)

        expect(names(emittedOf())).toEqual([
            'runner:start', 'suite:start', 'test:start', 'test:pending', 'test:end', 'suite:end', 'runner:end'
        ])
        expect(events.at(-1)).toMatchObject({ passed: true })
    })

    it('emits job:end with passed false when the reporter sync rejects', async () => {
        const module = makeModule()
        reporter.onTestModuleStart(module)
        instances[0].waitForSync.mockRejectedValue(new Error('unsynced'))
        await reporter.onTestModuleEnd(module)

        expect(events.at(-1)).toEqual({ type: 'job:end', cid: '0-0', passed: false })
        expect(errors).toHaveLength(1)
    })

    it('logs and counts module work that rejects in onTestRunEnd', async () => {
        const failing = new WdioBridgeReporter(config, (event) => {
            if (event.type === 'job:end') {
                throw new Error('cli interface exploded')
            }
        }, (err) => errors.push(err))
        const module = makeModule()
        failing.onTestModuleStart(module)
        failing.onTestModuleEnd(module).catch(() => {})
        await failing.onTestRunEnd()

        expect(errors).toHaveLength(1)
    })

    it('waits for pending module work in onTestRunEnd', async () => {
        const module = makeModule()
        reporter.onTestModuleStart(module)
        void reporter.onTestModuleEnd(module)
        await reporter.onTestRunEnd()

        expect(events.at(-1)).toMatchObject({ type: 'job:end', passed: true })
    })
})
