import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '@wdio/logger'

import { WdioBridgeReporter } from '../src/reporter.js'

const initGate = vi.hoisted(() => ({ promise: undefined as Promise<void> | undefined }))
const instances = vi.hoisted(() => [] as {
    cid: string
    caps: unknown
    config: { reporters?: unknown[] }
    emitted: [string, Record<string, any>][]
    listener?: (message: unknown) => void
    resolver?: () => string | undefined
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
        resolver?: () => string | undefined
        setContextIdResolver(resolver: () => string | undefined) {
            this.resolver = resolver
        }
    }
}))

const requestedCaps = { browserName: 'chrome', 'appium:deviceName': 'Pixel' }
const sessionCaps = { browserName: 'chrome', browserVersion: '130' }

type Result = { state: 'passed' | 'failed' | 'skipped', errors?: { name?: string, message: string, stack?: string }[] }
const passed: Result = { state: 'passed' }

let nextId = 0
const makeModule = (overrides: Record<string, unknown> = {}) => {
    const tests: any[] = []
    return {
        tests,
        children: { allTests: () => tests },
        type: 'module' as const,
        id: 'chrome-0:/repo/a.spec.ts',
        moduleId: '/repo/a.spec.ts',
        relativeModuleId: 'a.spec.ts',
        project: { config: { provide: { wdioCapabilities: requestedCaps } } },
        meta: () => ({ wdio: { sessionId: 'sess-1', capabilities: sessionCaps } }),
        state: () => 'passed',
        errors: () => [] as { name?: string, message: string }[],
        ...overrides
    } as any
}
const withRegistered = (module: any, test: any) => {
    module.tests?.push(test)
    return test
}
const makeSuite = (module: any, parent: any, name: string) => ({ type: 'suite' as const, id: `suite-${nextId++}`, name, module, parent }) as any
const makeTest = (module: any, parent: any, name: string, result: Result, duration?: number, extra: Record<string, unknown> = {}) => withRegistered(module, {
    type: 'test' as const,
    id: `test-${nextId++}`,
    name,
    module,
    parent,
    result: () => result,
    diagnostic: () => duration === undefined ? undefined : { duration },
    meta: () => ({}),
    options: { concurrent: false },
    ...extra
})

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

    it('takes the test times from the Vitest diagnostic instead of the event receipt time', async () => {
        const module = makeModule()
        const timed = makeTest(module, module, 'b', passed, 40, { diagnostic: () => ({ duration: 40, startTime: 1_000 }) })
        const failing = makeTest(module, module, 'c', { state: 'failed', errors: [{ message: 'boom' }] } as Result, 3, { diagnostic: () => ({ duration: 3, startTime: 2_000 }) })
        await runTests(module, timed, failing)

        const emitted = emittedOf()
        expect(emitted.find(([name]) => name === 'test:pass')![1]).toMatchObject({ start: 1_000, end: 1_040, duration: 40 })
        expect(emitted.find(([name]) => name === 'test:fail')![1]).toMatchObject({ start: 2_000, end: 2_003 })
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

    it('sends the module error on runner:end when no failed test or hook represents the failure', async () => {
        const module = makeModule({ state: () => 'failed', errors: () => [{ name: 'Error', message: 'Cannot find module ./missing' }] })
        reporter.onTestModuleStart(module)
        await reporter.onTestModuleEnd(module)

        expect(emittedOf().at(-1)![1]).toMatchObject({ failures: 1, error: 'Cannot find module ./missing' })
    })

    it('does not send the module error when a failed test already represents it', async () => {
        const module = makeModule({ state: () => 'failed', errors: () => [{ name: 'Error', message: 'module boom' }] })
        await runTests(module, makeTest(module, module, 'bad', { state: 'failed', errors: [{ message: 'nope' }] }))
        await reporter.onTestModuleEnd(module)

        expect(emittedOf().at(-1)![1]).not.toHaveProperty('error')
    })

    it('does not send the module error when a failed hook already represents it', async () => {
        const module = makeModule({ state: () => 'failed', errors: () => [{ name: 'Error', message: 'session boom' }] })
        reporter.onTestModuleStart(module)
        reporter.onHookStart({ name: 'beforeAll', entity: module })
        await reporter.onTestModuleEnd(module)

        expect(emittedOf().at(-1)![1]).not.toHaveProperty('error')
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

        it('keeps a failed beforeAll when the afterAll of the same suite then passes', async () => {
            const module = makeModule()
            const s = makeSuite(module, module, 'setup')
            s.errors = () => [{ message: 'before boom' }]
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'beforeAll', entity: s })
            reporter.onHookStart({ name: 'afterAll', entity: s })
            reporter.onHookEnd({ name: 'afterAll', entity: s })
            await describeBlock(s, [])
            await reporter.onTestModuleEnd(module)

            const ends = hookEvents(emittedOf()).filter(([name]) => name === 'hook:end').map(([, payload]) => payload)
            expect(ends.map(({ title, error }) => [title, error.message])).toEqual([['"before all" hook in "setup"', 'before boom']])
        })

        it('reports both hooks with their own errors when beforeAll and afterAll fail', async () => {
            const module = makeModule()
            const s = makeSuite(module, module, 'both')
            s.errors = () => [{ message: 'before boom' }, { message: 'middle' }, { message: 'after boom' }]
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'afterAll', entity: s })
            reporter.onHookStart({ name: 'beforeAll', entity: s })
            await describeBlock(s, [])
            await reporter.onTestModuleEnd(module)

            const ends = hookEvents(emittedOf()).filter(([name]) => name === 'hook:end').map(([, payload]) => payload)
            expect(ends.map(({ title, error }) => [title, error.message])).toEqual([
                ['"before all" hook in "both"', 'before boom'], ['"after all" hook in "both"', 'after boom']
            ])
            expect(new Set(ends.map(({ uid }) => uid)).size).toBe(2)
        })

        it('gives the only error to both unfinished hooks', async () => {
            const module = makeModule()
            const s = makeSuite(module, module, 'one')
            s.errors = () => [{ message: 'shared boom' }]
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'beforeAll', entity: s })
            reporter.onHookStart({ name: 'afterAll', entity: s })
            await describeBlock(s, [])
            await reporter.onTestModuleEnd(module)

            const ends = hookEvents(emittedOf()).filter(([name]) => name === 'hook:end').map(([, payload]) => payload)
            expect(ends.map(({ error }) => error.message)).toEqual(['shared boom', 'shared boom'])
        })

        it('keeps a failed module level beforeAll when the module afterAll passes', async () => {
            const module = makeModule({ state: () => 'failed', errors: () => [{ name: 'Error', message: 'session boom' }] })
            reporter.onTestModuleStart(module)
            reporter.onHookStart({ name: 'beforeAll', entity: module })
            reporter.onHookStart({ name: 'afterAll', entity: module })
            reporter.onHookEnd({ name: 'afterAll', entity: module })
            await reporter.onTestModuleEnd(module)

            const ends = hookEvents(emittedOf()).filter(([name]) => name === 'hook:end').map(([, payload]) => payload)
            expect(ends.map(({ title, error }) => [title, error.message])).toEqual([['"before all" hook in "{root}"', 'session boom']])
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

    describe('relayed runtime calls', () => {
        const runtimeMeta = (...entries: { event: string, payload: unknown, retry: number }[]) => ({ 'wdio:runtime': entries })

        it('replays the calls between test:start and test:pass', async () => {
            const module = makeModule()
            const meta = runtimeMeta(
                { event: 'allure:runtimeMessage', payload: { type: 'step_start' }, retry: 0 },
                { event: 'junit:addProperty', payload: { name: 'k', value: 'v' }, retry: 0 }
            )
            reporter.onTestModuleStart(module)
            const test = makeTest(module, module, 'replayed', passed, 1, { meta: () => meta })
            await reporter.onTestCaseReady(test)
            await reporter.onTestCaseResult(test)

            const emitted = emittedOf()
            const start = emitted.findIndex(([name]) => name === 'test:start')
            expect(emitted.slice(start, start + 5).map(([name]) => name)).toEqual(['test:start', 'allure:runtimeMessage', 'junit:addProperty', 'test:pass', 'test:end'])
            expect(emitted[start + 1][1]).toEqual({ type: 'step_start' })
            expect(emitted[start + 2][1]).toEqual({ name: 'k', value: 'v' })
        })

        describe('pending attachment files', () => {
            let dir: string
            beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-vitest-pending-')) })
            afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

            const pending = (name: string, retry: number) => {
                const pendingFile = path.join(dir, `.wdio-attachment-${name}.tmp`)
                fs.writeFileSync(pendingFile, name)
                return { event: 'allure:runtimeMessage', payload: { type: 'attachment_path', data: { path: pendingFile } }, retry, pendingFile }
            }

            it('hands the files of every attempt to the reporters', async () => {
                const module = makeModule()
                const [first, last] = [pending('first', 0), pending('last', 1)]
                const test = makeTest(module, module, 't', passed, 1, {
                    diagnostic: () => ({ duration: 1, retryCount: 1 }),
                    meta: () => runtimeMeta(first, last)
                })
                await runTests(module, test)

                expect(fs.existsSync(first.pendingFile)).toBe(true)
                expect(fs.existsSync(last.pendingFile)).toBe(true)
                expect(emittedOf().filter(([name]) => name === 'allure:runtimeMessage').map(([, payload]) => payload)).toEqual([first.payload, last.payload])
            })

            it('removes the files of tests that are closed without a result', async () => {
                const module = makeModule({ state: () => 'failed', errors: () => [] })
                const [a, b] = [pending('a', 0), pending('b', 1)]
                const test = makeTest(module, module, 't', passed, 1, { meta: () => runtimeMeta(a, b) })
                reporter.onTestModuleStart(module)
                await reporter.onTestCaseReady(test)
                await reporter.onTestModuleEnd(module)

                expect(fs.existsSync(a.pendingFile)).toBe(false)
                expect(fs.existsSync(b.pendingFile)).toBe(false)
                expect(names(emittedOf())).not.toContain('allure:runtimeMessage')
            })

            it('does not fail when a file is already gone', async () => {
                const module = makeModule({ state: () => 'failed', errors: () => [] })
                const gone = { ...pending('gone', 0), pendingFile: path.join(dir, 'missing.tmp') }
                const test = makeTest(module, module, 't', passed, 1, { meta: () => runtimeMeta(gone) })
                reporter.onTestModuleStart(module)
                await reporter.onTestCaseReady(test)
                await reporter.onTestModuleEnd(module)

                expect(errors).toEqual([])
            })
        })

        it('replays nothing without relayed calls', async () => {
            const module = makeModule()
            await runTests(module, makeTest(module, module, 't', passed))

            expect(names(emittedOf())).toEqual(['runner:start', 'suite:start', 'test:start', 'test:pass', 'test:end'])
        })

        describe('retries', () => {
            const call = (name: string, retry: number) => ({ event: 'junit:addProperty', payload: { name, value: name }, retry })
            const attempt = (retry: number, state: 'passed' | 'failed', error?: object) => ({
                event: 'wdio:attempt', retry, payload: { start: 100 * retry, end: 100 * retry + 10, state, ...(error && { error }) }
            })
            const failedTwice = (final: Result, extra: Record<string, unknown> = {}) => {
                const module = makeModule()
                const test = makeTest(module, module, 't', final, 5, {
                    diagnostic: () => ({ duration: 5, retryCount: 2 }),
                    meta: () => runtimeMeta(
                        call('a0', 0), attempt(0, 'failed', { name: 'AssertionError', message: 'fail 1', stack: 's1', expected: 1, actual: 2 }),
                        call('a1', 1), attempt(1, 'failed', { message: 'fail 2' }),
                        call('a2', 2), attempt(2, final.state === 'passed' ? 'passed' : 'failed')
                    ),
                    ...extra
                })
                return { module, test }
            }
            const runtimeMeta = (...entries: object[]) => ({ 'wdio:runtime': entries })
            const sequence = () => emittedOf().slice(emittedOf().findIndex(([name]) => name === 'test:start')).map(([name, payload]) => payload?.uid ? `${name}(${payload.uid})` : name)

            it('reports every attempt: retry for the failed ones, pass for the last', async () => {
                const { module, test } = failedTwice(passed)
                await runTests(module, test)

                expect(sequence()).toEqual([
                    'test:start(test-0-0-0)', 'junit:addProperty', 'test:retry(test-0-0-0)',
                    'test:start(test-0-0-0-retry-1)', 'junit:addProperty', 'test:retry(test-0-0-0-retry-1)',
                    'test:start(test-0-0-0-retry-2)', 'junit:addProperty', 'test:pass(test-0-0-0-retry-2)', 'test:end(test-0-0-0-retry-2)'
                ])
                expect(emittedOf().filter(([name]) => name === 'junit:addProperty').map(([, payload]) => payload.name)).toEqual(['a0', 'a1', 'a2'])
            })

            it('gives the retry the worker timing, error and attempt index', async () => {
                const { module, test } = failedTwice(passed)
                await runTests(module, test)

                const retries = emittedOf().filter(([name]) => name === 'test:retry').map(([, payload]) => payload)
                expect(retries[0]).toMatchObject({
                    title: 't', parent: 'a.spec.ts', file: '/repo/a.spec.ts', specs: ['/repo/a.spec.ts'], start: 0, end: 10, duration: 10, pending: false,
                    error: { name: 'AssertionError', message: 'fail 1', stack: 's1' }
                })
                expect(retries[1]).toMatchObject({ start: 100, end: 110, error: { name: 'Error', message: 'fail 2' } })
                const starts = emittedOf().filter(([name]) => name === 'test:start').map(([, payload]) => payload.retries)
                expect(starts).toEqual([undefined, 1, 2])
            })

            it('times the final attempt by its own marker, not the cumulative diagnostic', async () => {
                const { module, test } = failedTwice(passed, { diagnostic: () => ({ duration: 5647, startTime: 0, retryCount: 2 }) })
                await runTests(module, test)

                const byName = (name: string) => emittedOf().find(([n]) => n === name)![1]
                expect(byName('test:pass')).toMatchObject({ start: 200, end: 210, duration: 10 })
                expect(byName('test:end')).toMatchObject({ duration: 10 })
            })

            it('counts only the final attempt as a failed test', async () => {
                const { module, test } = failedTwice({ state: 'failed', errors: [{ message: 'fail 3' }] })
                await runTests(module, test)
                await reporter.onTestModuleEnd(module)

                expect(sequence().filter((entry) => !entry.startsWith('junit')).slice(0, 7)).toEqual([
                    'test:start(test-0-0-0)', 'test:retry(test-0-0-0)', 'test:start(test-0-0-0-retry-1)', 'test:retry(test-0-0-0-retry-1)',
                    'test:start(test-0-0-0-retry-2)', 'test:fail(test-0-0-0-retry-2)', 'test:end(test-0-0-0-retry-2)'
                ])
                expect(names(emittedOf())).not.toContain('context:end')
                expect(emittedOf().find(([name]) => name === 'runner:end')![1]).toMatchObject({ failures: 1 })
            })

            describe('errors across attempts, with Vitest accumulating result.errors', () => {
                const accumulated = [{ message: 'e0' }, { message: 'e1' }, { message: 'e2' }]
                const markedAttempts = (final: 'passed' | 'failed') => [
                    attempt(0, 'failed', { message: 'e0' }), attempt(1, 'failed', { message: 'e1' }),
                    attempt(2, final, ...(final === 'failed' ? [{ message: 'e2' }] : []))
                ]

                it('reports e0 and e1 as retries and e2 as the failure of the final attempt', async () => {
                    const module = makeModule()
                    const test = makeTest(module, module, 't', { state: 'failed', errors: accumulated }, 5, {
                        diagnostic: () => ({ duration: 5, retryCount: 2 }), meta: () => runtimeMeta(...markedAttempts('failed'))
                    })
                    await runTests(module, test)

                    expect(emittedOf().filter(([name]) => name === 'test:retry').map(([, payload]) => payload.error.message)).toEqual(['e0', 'e1'])
                    expect(emittedOf().find(([name]) => name === 'test:fail')![1].error.message).toBe('e2')
                    expect(emittedOf().find(([name]) => name === 'test:end')![1].error.message).toBe('e2')
                })

                it('reports e0 and e1 as retries and then a pass when the final attempt passes', async () => {
                    const module = makeModule()
                    const test = makeTest(module, module, 't', passed, 5, {
                        diagnostic: () => ({ duration: 5, retryCount: 2 }), meta: () => runtimeMeta(...markedAttempts('passed'))
                    })
                    await runTests(module, test)

                    expect(sequence().filter((entry) => entry.startsWith('test:')).map((entry) => entry.split('(')[0])).toEqual([
                        'test:start', 'test:retry', 'test:start', 'test:retry', 'test:start', 'test:pass', 'test:end'
                    ])
                    expect(emittedOf().filter(([name]) => name === 'test:retry').map(([, payload]) => payload.error.message)).toEqual(['e0', 'e1'])
                })

                it('falls back to the last accumulated error when the final attempt left no marker', async () => {
                    const module = makeModule()
                    const test = makeTest(module, module, 't', { state: 'failed', errors: accumulated }, 5, {
                        diagnostic: () => ({ duration: 5, retryCount: 2 }), meta: () => runtimeMeta(attempt(0, 'failed', { message: 'e0' }), attempt(1, 'failed', { message: 'e1' }))
                    })
                    await runTests(module, test)

                    expect(emittedOf().find(([name]) => name === 'test:fail')![1].error.message).toBe('e2')
                })
            })

            it('keeps the contextId across attempts and closes the context once', async () => {
                const { module, test } = failedTwice(passed, { options: { concurrent: true } })
                await runTests(module, test)

                const testEvents = emittedOf().filter(([name]) => name.startsWith('test:'))
                expect(new Set(testEvents.map(([, payload]) => payload.contextId))).toEqual(new Set([test.id]))
                expect(new Set(testEvents.map(([, payload]) => payload.uid)).size).toBe(3)
                const ends = emittedOf().filter(([name]) => name === 'context:end')
                expect(ends).toEqual([['context:end', expect.objectContaining({ type: 'context:end', cid: '0-0', uid: 'test-0-0-0-retry-2', contextId: test.id, specs: ['/repo/a.spec.ts'] })]])
                expect(names(emittedOf()).slice(-2)).toEqual(['test:end', 'context:end'])
            })

            it('sends context:end for a lane test that was not retried, and none without lanes', async () => {
                const module = makeModule()
                const laned = makeTest(module, module, 'c', passed, 1, { options: { concurrent: true } })
                await runTests(module, laned)
                expect(names(emittedOf()).slice(-3)).toEqual(['test:pass', 'test:end', 'context:end'])

                instances.length = 0
                const plain = makeModule({ id: 'chrome-0:/repo/b.spec.ts', moduleId: '/repo/b.spec.ts' })
                await runTests(plain, makeTest(plain, plain, 's', passed, 1))
                expect(names(emittedOf())).not.toContain('context:end')
            })

            it('reports a retry whose attempt left no marker with a generic error', async () => {
                const module = makeModule()
                const test = makeTest(module, module, 't', passed, 1, {
                    diagnostic: () => ({ duration: 1, retryCount: 1 }),
                    meta: () => runtimeMeta(call('first', 0))
                })
                await runTests(module, test)

                expect(emittedOf().find(([name]) => name === 'test:retry')![1]).toMatchObject({ duration: 0, error: { message: 'test failed' } })
                expect(emittedOf().filter(([name]) => name === 'junit:addProperty').map(([, payload]) => payload.name)).toEqual(['first'])
            })

            describe('hooks', () => {
                const hookOf = (state: 'pass' | 'fail', error?: object) => ({ state, ...(error && { error }) })
                const withHooks = (retry: number, state: 'passed' | 'failed', hooks?: object, error?: object) => ({
                    event: 'wdio:attempt', retry, payload: { start: 100 * retry, end: 100 * retry + 10, state, ...(error && { error }), ...(hooks && { hooks }) }
                })
                const bothHooks = { beforeEach: hookOf('pass'), afterEach: hookOf('pass') }
                const hookSequence = () => sequence().filter((entry) => !entry.startsWith('junit'))
                const build = (final: Result, entries: object[], extra: Record<string, unknown> = {}) => {
                    const module = makeModule()
                    const test = makeTest(module, module, 't', final, 5, { diagnostic: () => ({ duration: 5, retryCount: 2 }), meta: () => runtimeMeta(...entries), ...extra })
                    return { module, test }
                }

                it('sends one hook pair per kind and attempt around the test events, as a sequential Mocha run', async () => {
                    const { module, test } = build(passed, [
                        call('a0', 0), withHooks(0, 'failed', bothHooks, { message: 'f1' }),
                        call('a1', 1), withHooks(1, 'failed', bothHooks, { message: 'f2' }),
                        call('a2', 2), withHooks(2, 'passed', bothHooks)
                    ])
                    await runTests(module, test)

                    const hook = (attempt: string, kind: string) => [`hook:start(test-0-0-0${attempt}-${kind})`, `hook:end(test-0-0-0${attempt}-${kind})`]
                    expect(hookSequence()).toEqual([
                        'test:start(test-0-0-0)', ...hook('', 'beforeEach'), 'test:retry(test-0-0-0)', ...hook('', 'afterEach'),
                        'test:start(test-0-0-0-retry-1)', ...hook('-retry-1', 'beforeEach'), 'test:retry(test-0-0-0-retry-1)', ...hook('-retry-1', 'afterEach'),
                        'test:start(test-0-0-0-retry-2)', ...hook('-retry-2', 'beforeEach'), 'test:pass(test-0-0-0-retry-2)', 'test:end(test-0-0-0-retry-2)', ...hook('-retry-2', 'afterEach')
                    ])
                    const uids = emittedOf().filter(([name]) => name.startsWith('hook:start')).map(([, payload]) => payload.uid)
                    expect(new Set(uids).size).toBe(6)
                    const retried = emittedOf().filter(([name]) => name.startsWith('hook:')).map(([, payload]) => [payload.uid, payload.retried])
                    expect(retried.filter(([, flag]) => flag === true)).toHaveLength(8)
                    expect(retried.filter(([uid]) => uid.includes('-retry-2'))).toHaveLength(4)
                    expect(retried.filter(([uid]) => uid.includes('-retry-2')).map(([, flag]) => flag)).toEqual([undefined, undefined, undefined, undefined])
                })

                it('gives the hooks the Mocha titles and the test parent, file and specs', async () => {
                    const { module, test } = build(passed, [withHooks(0, 'failed', bothHooks, { message: 'f1' }), withHooks(1, 'failed'), withHooks(2, 'passed')])
                    await runTests(module, test)

                    const [start, end] = emittedOf().filter(([name]) => name.startsWith('hook:')).map(([, payload]) => payload)
                    expect(start).toEqual({
                        type: 'hook:start', cid: '0-0', specs: ['/repo/a.spec.ts'], file: '/repo/a.spec.ts', uid: 'test-0-0-0-beforeEach',
                        title: '"before each" hook for "t"', fullTitle: 'a.spec.ts "before each" hook for "t"', parent: 'a.spec.ts', parentUid: expect.any(String), retried: true
                    })
                    expect(end).toEqual({ ...start, type: 'hook:end', duration: 0, state: 'pass' })
                    const after = emittedOf().filter(([name]) => name === 'hook:start').map(([, payload]) => payload.title)
                    expect(after).toEqual(['"before each" hook for "t"', '"after each" hook for "t"'])
                })

                it('ends a failed beforeEach with its error, then the failed test result', async () => {
                    const { module, test } = build({ state: 'failed', errors: [{ message: 'be' }] }, [
                        withHooks(0, 'failed', { beforeEach: hookOf('fail', { message: 'be', stack: 's' }), afterEach: hookOf('pass') }, { message: 'be' }),
                        withHooks(1, 'failed'), withHooks(2, 'failed')
                    ])
                    await runTests(module, test)

                    expect(hookSequence().slice(0, 5)).toEqual([
                        'test:start(test-0-0-0)', 'hook:start(test-0-0-0-beforeEach)', 'hook:end(test-0-0-0-beforeEach)', 'test:retry(test-0-0-0)', 'hook:start(test-0-0-0-afterEach)'
                    ])
                    const end = emittedOf().find(([name, payload]) => name === 'hook:end' && payload.uid === 'test-0-0-0-beforeEach')![1]
                    expect(end).toMatchObject({ state: 'fail', error: { name: 'Error', message: 'be', stack: 's' } })
                })

                it('falls back to the attempt error when the worker could not tell the hook error', async () => {
                    const { module, test } = build(passed, [
                        withHooks(0, 'failed', { afterEach: hookOf('fail') }, { message: 'attempt error' }), withHooks(1, 'failed'), withHooks(2, 'passed')
                    ])
                    await runTests(module, test)

                    expect(emittedOf().find(([name]) => name === 'hook:end')![1]).toMatchObject({ state: 'fail', error: { message: 'attempt error' } })
                })

                it('sends no hook events when no hook ran, and never an end without a start', async () => {
                    const { module, test } = build(passed, [withHooks(0, 'failed'), withHooks(1, 'failed'), withHooks(2, 'passed')])
                    await runTests(module, test)
                    expect(names(emittedOf()).filter((name) => name.startsWith('hook:'))).toEqual([])

                    instances.length = 0
                    reporter = new WdioBridgeReporter(config, (event) => events.push(event), (err) => errors.push(err))
                    const second = build(passed, [withHooks(0, 'failed', bothHooks), withHooks(1, 'failed', { afterEach: hookOf('pass') }), withHooks(2, 'passed', { beforeEach: hookOf('pass') })])
                    await runTests(second.module, second.test)
                    const hooks = names(emittedOf()).filter((name) => name.startsWith('hook:'))
                    expect(hooks.filter((name) => name === 'hook:start')).toHaveLength(hooks.filter((name) => name === 'hook:end').length)
                    expect(hooks.every((name, index) => name === (index % 2 === 0 ? 'hook:start' : 'hook:end'))).toBe(true)
                })

                describe('a failed hook is the failure of its test', () => {
                    const once = (final: Result, entries: object[]) => build(final, entries, { diagnostic: () => ({ duration: 5, retryCount: 0 }) })
                    const payloadOf = (name: string, uid: string) => emittedOf().find(([event, payload]) => event === name && payload.uid === uid)![1]

                    // Vitest counts the error of a failed beforeEach / afterEach one time, as the failure of the test
                    it('names the test on a failed afterEach of the final attempt', async () => {
                        const { module, test } = once({ state: 'failed', errors: [{ message: 'ae' }] }, [
                            withHooks(0, 'failed', { beforeEach: hookOf('pass'), afterEach: hookOf('fail', { message: 'ae', stack: 's' }) }, { message: 'ae', stack: 's' })
                        ])
                        await runTests(module, test)

                        expect(payloadOf('hook:start', 'test-0-0-0-afterEach').failedTestUid).toBe('test-0-0-0')
                        expect(payloadOf('hook:end', 'test-0-0-0-afterEach').failedTestUid).toBe('test-0-0-0')
                        expect(payloadOf('hook:end', 'test-0-0-0-beforeEach')).not.toHaveProperty('failedTestUid')
                        expect(payloadOf('test:fail', 'test-0-0-0')).not.toHaveProperty('errors')
                    })

                    it('names the attempt on the failed hooks of a retried attempt', async () => {
                        const { module, test } = build(passed, [
                            withHooks(0, 'failed', { beforeEach: hookOf('fail', { message: 'be' }) }, { message: 'be' }),
                            withHooks(1, 'failed', { afterEach: hookOf('fail', { message: 'ae' }) }, { message: 'ae' }),
                            withHooks(2, 'passed', bothHooks)
                        ])
                        await runTests(module, test)

                        expect(payloadOf('hook:end', 'test-0-0-0-beforeEach').failedTestUid).toBe('test-0-0-0')
                        expect(payloadOf('hook:end', 'test-0-0-0-retry-1-afterEach').failedTestUid).toBe('test-0-0-0-retry-1')
                        expect(payloadOf('hook:end', 'test-0-0-0-retry-2-afterEach')).not.toHaveProperty('failedTestUid')
                    })

                    it('does not name a test that did not fail', async () => {
                        const { module, test } = once({ state: 'pending' } as never, [
                            withHooks(0, 'failed', { beforeEach: hookOf('fail') })
                        ])
                        await runTests(module, test)

                        expect(payloadOf('hook:end', 'test-0-0-0-beforeEach')).toMatchObject({ state: 'fail' })
                        expect(payloadOf('hook:end', 'test-0-0-0-beforeEach')).not.toHaveProperty('failedTestUid')
                    })

                    it('keeps two errors that have the same message but no stack', async () => {
                        const { module, test } = once({ state: 'failed', errors: [{ message: 'timeout' }, { message: 'timeout' }] }, [
                            withHooks(0, 'failed', { afterEach: hookOf('fail', { message: 'timeout' }) }, { message: 'timeout' })
                        ])
                        await runTests(module, test)

                        expect(payloadOf('test:fail', 'test-0-0-0').errors).toHaveLength(2)
                    })

                    it('gives the test the errors of the body and of the afterEach', async () => {
                        const { module, test } = once({ state: 'failed', errors: [{ message: 'body' }, { message: 'ae' }] }, [
                            withHooks(0, 'failed', { afterEach: hookOf('fail', { message: 'ae', stack: 's2' }) }, { message: 'body', stack: 's1' })
                        ])
                        await runTests(module, test)

                        const fail = payloadOf('test:fail', 'test-0-0-0')
                        expect(fail.error).toEqual({ name: 'Error', message: 'body', stack: 's1' })
                        expect(fail.errors).toEqual([{ name: 'Error', message: 'body', stack: 's1' }, { name: 'Error', message: 'ae', stack: 's2' }])
                        expect(payloadOf('hook:end', 'test-0-0-0-afterEach').failedTestUid).toBe('test-0-0-0')
                    })
                })

                it('tags hooks with the contextId and closes the context after the last afterEach', async () => {
                    const { module, test } = build(passed, [withHooks(0, 'failed', bothHooks), withHooks(1, 'failed', bothHooks), withHooks(2, 'passed', bothHooks)], { options: { concurrent: true } })
                    await runTests(module, test)

                    const hooks = emittedOf().filter(([name]) => name.startsWith('hook:')).map(([, payload]) => payload)
                    expect(hooks).toHaveLength(12)
                    expect(hooks.every((payload) => payload.contextId === test.id)).toBe(true)
                    expect(names(emittedOf()).slice(-3)).toEqual(['hook:start', 'hook:end', 'context:end'])
                    expect(emittedOf().filter(([name]) => name === 'context:end')).toHaveLength(1)
                })
            })
        })

        it('tags concurrent tests with a contextId and resolves it while replaying', async () => {
            const module = makeModule()
            const seen: (string | undefined)[] = []
            const test = makeTest(module, module, 't', passed, 1, {
                options: { concurrent: true },
                meta: () => runtimeMeta({ event: 'junit:addProperty', payload: { name: 'k', value: 'v' }, retry: 0 })
            })
            reporter.onTestModuleStart(module)
            await reporter.onTestCaseReady(test)
            const instance = instances[0] as any
            const resolver = instance.resolver as () => string | undefined
            instance.emit = (event: string) => { seen.push(resolver()); instance.emitted.push([event, {}]) }
            await reporter.onTestCaseResult(test)

            expect(seen.length).toBeGreaterThan(0)
            expect(seen.every((id) => id === test.id)).toBe(true)
            expect(resolver()).toBeUndefined()
        })

        it('adds the contextId to the concurrent test payloads', async () => {
            const module = makeModule()
            const concurrent = makeTest(module, module, 'c', passed, 1, { options: { concurrent: true } })
            await runTests(module, concurrent)

            const byTitle = (title: string) => emittedOf().filter(([name, payload]) => name.startsWith('test:') && payload.title === title).map(([, payload]) => payload.contextId)
            expect(byTitle('c')).toEqual([concurrent.id, concurrent.id, concurrent.id])
        })

        it('tags every test of a module that has a concurrent test', async () => {
            const module = makeModule()
            const sequential = makeTest(module, module, 's', passed, 1)
            const concurrent = makeTest(module, module, 'c', passed, 1, { options: { concurrent: true } })
            await runTests(module, sequential, concurrent)

            const byTitle = (title: string) => emittedOf().filter(([name, payload]) => name.startsWith('test:') && payload.title === title).map(([, payload]) => payload.contextId)
            expect(byTitle('s')).toEqual([sequential.id, sequential.id, sequential.id])
            expect(byTitle('c')).toEqual([concurrent.id, concurrent.id, concurrent.id])
        })

        it('resolves the contextId while closing an unfinished concurrent test', async () => {
            const module = makeModule({ state: () => 'failed', errors: () => [] })
            const test = makeTest(module, module, 'stuck', passed, 1, { options: { concurrent: true } })
            reporter.onTestModuleStart(module)
            await reporter.onTestCaseReady(test)
            const instance = instances[0] as any
            const resolver = instance.resolver as () => string | undefined
            const seen: [string, string | undefined][] = []
            instance.emit = (event: string) => { seen.push([event, resolver()]); instance.emitted.push([event, {}]) }
            await reporter.onTestModuleEnd(module)

            expect(seen.filter(([event]) => event.startsWith('test:'))).toEqual([['test:fail', test.id], ['test:end', test.id]])
        })

        it('leaves a purely sequential module untagged', async () => {
            const module = makeModule()
            await runTests(module, makeTest(module, module, 's', passed, 1))

            expect(emittedOf().filter(([name]) => name.startsWith('test:')).every(([, payload]) => payload.contextId === undefined)).toBe(true)
        })
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
