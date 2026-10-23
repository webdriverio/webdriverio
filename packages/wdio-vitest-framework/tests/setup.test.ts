import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({ aroundEach: undefined as unknown as (runTest: () => Promise<void>, context: unknown) => Promise<void> }))
const store = vi.hoisted(() => ({ run: vi.fn(async (_id: string, fn: () => Promise<void>) => fn()) }))
const browser = vi.hoisted(() => ({ sessionId: 'sess-1', capabilities: { browserName: 'chrome', browserVersion: '130' }, isBidi: true, __parallelContextStore: undefined as unknown, deleteSession: vi.fn() }))
const utils = vi.hoisted(() => ({
    allocateContext: vi.fn(async () => ({ context: 'ctx-1' })),
    cleanupAllocation: vi.fn(async () => {}),
    executeHooksWithArgs: vi.fn(async () => []),
    initializeWorkerService: vi.fn(async () => [] as unknown[])
}))
const added = vi.hoisted(() => ({ services: [] as unknown[] }))
const args = vi.hoisted(() => ({ value: { baseUrl: 'http://x' } as Record<string, unknown> }))
const parser = vi.hoisted(() => ({ args: [] as unknown[] }))
const callbacks = vi.hoisted(() => ({ beforeAll: undefined as unknown as (...args: unknown[]) => Promise<void>, afterAll: undefined as unknown as (...args: unknown[]) => Promise<void> }))
const configFile = '/repo/wdio.conf.ts'
const injected = vi.hoisted(() => ({ caps: { browserName: 'chrome', hostname: 'grid' } as Record<string, unknown> }))
const attachmentDir = vi.hoisted(() => ({ value: null as string | null }))
const mockConfig = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
const logs = vi.hoisted(() => ({ warn: vi.fn(), debug: vi.fn() }))

vi.mock('@wdio/logger', () => ({ default: () => ({ warn: logs.warn, debug: logs.debug, info: vi.fn(), error: vi.fn() }) }))

vi.mock('vitest', () => ({
    aroundEach: vi.fn((fn) => { hooks.aroundEach = fn }),
    beforeAll: vi.fn((fn) => { callbacks.beforeAll = fn }),
    afterAll: vi.fn((fn) => { callbacks.afterAll = fn }),
    inject: vi.fn((key: string) => key === 'wdioAllureAttachmentDir' ? attachmentDir.value : key === 'wdioConfigFile' ? configFile : key === 'wdioArgs' ? args.value : key === 'wdioProjectIndex' ? 2 : injected.caps)
}))
vi.mock('@wdio/utils', () => utils)
vi.mock('@wdio/config/node', () => ({
    ConfigParser: class {
        constructor(...args: unknown[]) { parser.args = args }
        initialize = vi.fn()
        getConfig = () => mockConfig.value
        addService = vi.fn((service: unknown) => { added.services.push(service) })
    }
}))
const softFailure = vi.hoisted(() => new Error('1 soft assertion failure'))
const soft = vi.hoisted(() => ({ options: undefined as unknown, error: undefined as unknown, instances: [] as unknown[], failures: new Map<string, string>() }))
vi.mock('expect-webdriverio', () => ({
    expect: { name: 'wdio-expect' },
    setDefaultOptions: vi.fn(),
    SoftAssertionService: class {
        constructor(options: unknown) { soft.options = options; soft.instances.push(this) }
        getTestId(test: { file: string, parent: string, title: string }) { return `${test.file}:${test.parent}:${test.title}` }
        // mirrors expect-webdriverio: only a test without its own error asserts the recorded soft failures
        afterTest(test: { file: string, parent: string, title: string }, _: unknown, result: { error?: unknown }) {
            const id = this.getTestId(test)
            if (!result.error && soft.failures.has(id)) {
                soft.failures.delete(id)
                result.error = softFailure
            }
        }
    },
    SoftAssertService: { getInstance: () => ({ clearFailures: (id: string) => { soft.failures.delete(id) } }) }
}))
vi.mock('webdriverio', () => ({
    PARALLEL_CONTEXT_STORE_KEY: '__parallelContextStore',
    remote: vi.fn(async () => browser)
}))

const task = (concurrent: boolean, result?: object) => ({ task: { name: 't', fullName: 'f > t', concurrent, suite: undefined, result, meta: {} as Record<string, unknown> } })
const testTask = (state: string) => ({ type: 'test', result: { state } })
const file = (tasks: object[] = [], errors?: Error[]) => ({ tasks, result: { state: errors ? 'fail' : 'pass', errors } })
const RELAYED_EVENTS = ['allure:startStep', 'allure:endStep', 'allure:runtimeMessage', 'junit:addProperty']
const afterTestResult = () => utils.executeHooksWithArgs.mock.calls.find(([name]) => name === 'afterTest')![2][2]

describe('setup', () => {
    let fileTask: { filepath: string, meta: Record<string, unknown> }
    let signalListenersBefore: [NodeJS.Signals, NodeJS.SignalsListener[]][]

    // every beforeAll in this file registers handlers that only afterAll removes
    afterEach(() => {
        RELAYED_EVENTS.forEach((event) => process.removeAllListeners(event))
        signalListenersBefore.forEach(([signal, before]) => process.listeners(signal).filter((listener) => !before.includes(listener)).forEach((listener) => process.off(signal, listener)))
    })

    beforeEach(async () => {
        signalListenersBefore = (['SIGINT', 'SIGTERM'] as const).map((signal) => [signal, process.listeners(signal)])
        vi.clearAllMocks()
        delete (globalThis as Record<symbol, unknown>)[Symbol.for('@wdio/vitest-framework:relay')]
        added.services = []
        soft.options = undefined
        soft.instances = []
        soft.error = undefined
        soft.failures.clear()
        args.value = { baseUrl: 'http://x' }
        utils.initializeWorkerService.mockResolvedValue([])
        injected.caps = { browserName: 'chrome', hostname: 'grid' }
        mockConfig.value = { waitforTimeout: 1000, waitforInterval: 100, vitestOpts: { parallelMode: 'contexts' }, before: [vi.fn()], capabilities: [] }
        browser.isBidi = true
        browser.__parallelContextStore = store
        vi.resetModules()
        await import('../src/setup.js')
        fileTask = { filepath: '/repo/a.spec.ts', meta: {} }
        await callbacks.beforeAll({}, { file: fileTask })
    })

    it('creates the session, sets globals, and runs the before hook', async () => {
        const { remote } = await import('webdriverio')
        expect(remote).toHaveBeenCalledWith(expect.objectContaining({
            hostname: 'grid',
            capabilities: { browserName: 'chrome' },
            waitforTimeout: 1000
        }))
        expect(vi.mocked(remote).mock.calls[0][0]).not.toHaveProperty('before')
        expect((globalThis as Record<string, unknown>).browser).toBe(browser)
        expect((globalThis as Record<string, unknown>).expect).toEqual({ name: 'wdio-expect' })
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('before', mockConfig.value.before, [{ browserName: 'chrome', hostname: 'grid' }, ['/repo/a.spec.ts'], browser])
    })

    it('registers the globals for @wdio/globals', () => {
        const registry = (globalThis as unknown as { _wdioGlobals: Map<string, unknown> })._wdioGlobals
        expect(registry.get('browser')).toBe(browser)
        expect(registry.get('driver')).toBe(browser)
        expect(registry.get('expect')).toEqual({ name: 'wdio-expect' })
    })

    it('only registers the globals for @wdio/globals when injectGlobals is false', async () => {
        const global = globalThis as unknown as Record<string, unknown> & { _wdioGlobals: Map<string, unknown> }
        delete global.browser
        global._wdioGlobals.clear()
        mockConfig.value = { ...mockConfig.value, injectGlobals: false }
        await callbacks.beforeAll({}, { file: fileTask })
        expect(global.browser).toBeUndefined()
        expect(global._wdioGlobals.get('browser')).toBe(browser)
    })

    it('gives the worker config parser the launcher CLI args', () => {
        expect(parser.args.slice(0, 2)).toEqual([configFile, { baseUrl: 'http://x' }])
    })

    it('passes W3C capabilities with firstMatch to remote and unwrapped alwaysMatch to the hooks', async () => {
        injected.caps = { alwaysMatch: { browserName: 'chrome', hostname: 'grid' }, firstMatch: [{ platformName: 'linux' }] }
        vi.clearAllMocks()
        await callbacks.beforeAll({}, { file: fileTask })
        const { remote } = await import('webdriverio')
        expect(vi.mocked(remote).mock.calls[0][0]).toMatchObject({
            hostname: 'grid',
            capabilities: { alwaysMatch: { browserName: 'chrome' }, firstMatch: [{ platformName: 'linux' }] }
        })
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('before', mockConfig.value.before, [{ browserName: 'chrome', hostname: 'grid' }, ['/repo/a.spec.ts'], browser])
    })

    it('strips connection keys from every firstMatch entry', async () => {
        injected.caps = { alwaysMatch: { browserName: 'chrome' }, firstMatch: [{ platformName: 'linux', hostname: 'grid', port: 4444 }, {}] }
        vi.clearAllMocks()
        await callbacks.beforeAll({}, { file: fileTask })
        const { remote } = await import('webdriverio')
        expect(vi.mocked(remote).mock.calls[0][0]).toMatchObject({
            capabilities: { alwaysMatch: { browserName: 'chrome' }, firstMatch: [{ platformName: 'linux' }, {}] }
        })
    })

    describe('reporter runtime relay', () => {
        const runInTest = async (body: () => void, overrides: { concurrent?: boolean, result?: object } = {}) => {
            const context = task(overrides.concurrent ?? false, overrides.result)
            await hooks.aroundEach(vi.fn(async () => { body() }), context)
            const calls = (context.task.meta['wdio:runtime'] as { event: string }[]).filter(({ event }) => event !== 'wdio:attempt')
            return calls.length > 0 ? calls : undefined
        }
        const callsOf = (context: ReturnType<typeof task>) => (context.task.meta['wdio:runtime'] as { event: string }[]).filter(({ event }) => event !== 'wdio:attempt')

        it('adds no listeners when the module is evaluated again in the same process', async () => {
            const counts = () => RELAYED_EVENTS.map((event) => process.listenerCount(event))
            const before = counts()
            vi.resetModules()
            await import('../src/setup.js')
            await callbacks.beforeAll({}, { file: fileTask })

            expect(before).toEqual([1, 1, 1, 1])
            expect(counts()).toEqual(before)
            const meta = await runInTest(() => { process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never) })
            expect(meta).toHaveLength(1)
        })

        it('stores junit properties and allure runtime messages in the task meta', async () => {
            const message = { type: 'metadata', data: { labels: [] } }
            const meta = await runInTest(() => {
                process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never)
                process.emit('allure:runtimeMessage' as never, message as never)
            })
            expect(meta).toEqual([
                { event: 'junit:addProperty', payload: { name: 'k', value: 'v' }, retry: 0 },
                { event: 'allure:runtimeMessage', payload: message, retry: 0 }
            ])
        })

        it('converts allure:startStep and a status string allure:endStep into timestamped runtime messages', async () => {
            vi.useFakeTimers({ toFake: ['Date'] })
            try {
                vi.setSystemTime(1000)
                const meta = await runInTest(() => {
                    process.emit('allure:startStep' as never, 'step' as never)
                    vi.setSystemTime(2000)
                    process.emit('allure:endStep' as never, 'passed' as never)
                })
                expect(meta).toEqual([
                    { event: 'allure:runtimeMessage', payload: { type: 'step_start', data: { name: 'step', start: 1000 } }, retry: 0 },
                    { event: 'allure:runtimeMessage', payload: { type: 'step_stop', data: { status: 'passed', stop: 2000 } }, retry: 0 }
                ])
            } finally {
                vi.useRealTimers()
            }
        })

        it('keeps status details of an object allure:endStep', async () => {
            const meta = await runInTest(() => {
                process.emit('allure:endStep' as never, { status: 'failed', statusDetails: { message: 'boom' } } as never)
            }) as { payload: { data: object } }[]
            expect(meta[0].payload.data).toMatchObject({ status: 'failed', statusDetails: { message: 'boom' }, stop: expect.any(Number) })
        })

        it('tags entries with the current retry attempt', async () => {
            const meta = await runInTest(() => {
                process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never)
            }, { result: { retryCount: 2 } }) as { retry: number }[]
            expect(meta[0].retry).toBe(2)
        })

        it('isolates concurrent tests', async () => {
            const first = task(true)
            const second = task(true)
            const run = (context: ReturnType<typeof task>, name: string) => hooks.aroundEach(vi.fn(async () => {
                await new Promise((resolve) => setTimeout(resolve, 5))
                process.emit('junit:addProperty' as never, { name, value: name } as never)
            }), context)
            await Promise.all([run(first, 'a'), run(second, 'b')])
            expect(callsOf(first)).toEqual([expect.objectContaining({ payload: { name: 'a', value: 'a' } })])
            expect(callsOf(second)).toEqual([expect.objectContaining({ payload: { name: 'b', value: 'b' } })])
        })

        it('drops calls made outside a test', () => {
            expect(() => process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never)).not.toThrow()
        })

        it('does not leak a finished test into later calls', async () => {
            const context = task(false)
            await hooks.aroundEach(vi.fn(async () => {}), context)
            process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never)
            expect(callsOf(context)).toEqual([])
        })

        describe('attempt markers', () => {
            afterEach(() => {
                utils.executeHooksWithArgs.mockImplementation(async () => [])
            })

            const markers = (context: ReturnType<typeof task>) => (context.task.meta['wdio:runtime'] as { event: string, retry: number, payload: any }[]).filter(({ event }) => event === 'wdio:attempt')

            it('records one marker per attempt after the afterTest hook, tagged with the attempt', async () => {
                const order: string[] = []
                utils.executeHooksWithArgs.mockImplementation(async (name: string) => { order.push(name) })
                const context = task(false, { retryCount: 1 })
                await hooks.aroundEach(vi.fn(async () => {
                    process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never)
                    order.push('test')
                }), context)

                expect(order).toEqual(['beforeTest', 'test', 'afterTest'])
                const meta = context.task.meta['wdio:runtime'] as { event: string }[]
                expect(meta.map(({ event }) => event)).toEqual(['junit:addProperty', 'wdio:attempt'])
                expect(markers(context)).toEqual([{ event: 'wdio:attempt', retry: 1, payload: { start: expect.any(Number), end: expect.any(Number), state: 'passed' } }])
            })

            it('serializes the error of a failed attempt with its expected and actual values', async () => {
                const failure = Object.assign(new Error('nope'), { expected: 'a', actual: 'b' })
                const context = task(false, { retryCount: 0 })
                await hooks.aroundEach(vi.fn(async () => { Object.assign(context.task.result, { state: 'fail', errors: [failure] }) }), context)

                expect(markers(context)[0].payload).toMatchObject({
                    state: 'failed',
                    error: { name: 'Error', message: 'nope', stack: failure.stack, expected: 'a', actual: 'b' }
                })
            })

            it('takes the error of each attempt although Vitest accumulates result.errors across attempts', async () => {
                const errors = ['e0', 'e1', 'e2'].map((message) => new Error(message))
                const context = task(false, { retryCount: 0 })
                for (const retryCount of errors.keys()) {
                    await hooks.aroundEach(vi.fn(async () => {
                        Object.assign(context.task.result, { retryCount, state: 'fail', errors: errors.slice(0, retryCount + 1) })
                    }), context)
                }

                expect(markers(context).map(({ payload }) => payload.error.message)).toEqual(['e0', 'e1', 'e2'])
            })

            it('still records the marker when afterTest throws', async () => {
                utils.executeHooksWithArgs.mockImplementation(async (name: string) => { if (name === 'afterTest') { throw new Error('hook') } })
                const context = task(false)
                await expect(hooks.aroundEach(vi.fn(async () => {}), context)).rejects.toThrow('hook')

                expect(markers(context)).toHaveLength(1)
            })
        })
        describe('attempt hooks', () => {
            afterEach(() => {
                utils.executeHooksWithArgs.mockImplementation(async () => [])
            })

            const markers = (context: ReturnType<typeof task>) => (context.task.meta['wdio:runtime'] as { event: string, payload: any }[]).filter(({ event }) => event === 'wdio:attempt')
            const attemptWith = async (result: Record<string, any>, after: Record<string, any>, retryCount = 0) => {
                const context = task(false, { retryCount, ...result })
                await hooks.aroundEach(vi.fn(async () => { Object.assign(context.task.result, after) }), context)
                return markers(context)[0].payload
            }

            it('records the state of the hook kinds that ran in the attempt', async () => {
                const payload = await attemptWith({}, { hooks: { beforeEach: 'pass', afterEach: 'pass', beforeAll: 'pass' } })
                expect(payload.hooks).toEqual({ beforeEach: { state: 'pass' }, afterEach: { state: 'pass' } })
            })

            it('attributes a failing beforeEach to the first error of this attempt, not an earlier one', async () => {
                const earlier = new Error('previous attempt')
                const failure = new Error('before each failed')
                const payload = await attemptWith({ errors: [earlier] }, { hooks: { beforeEach: 'run', afterEach: 'pass' }, errors: [earlier, failure] }, 1)
                expect(payload.hooks).toEqual({
                    beforeEach: { state: 'fail', error: expect.objectContaining({ message: 'before each failed' }) },
                    afterEach: { state: 'pass' }
                })
            })

            it('attributes a failing afterEach to the last error of this attempt', async () => {
                const body = new Error('body')
                const after = new Error('after each failed')
                const payload = await attemptWith({}, { state: 'fail', hooks: { beforeEach: 'pass', afterEach: 'run' }, errors: [body, after] })
                expect(payload.hooks).toEqual({
                    beforeEach: { state: 'pass' },
                    afterEach: { state: 'fail', error: expect.objectContaining({ message: 'after each failed' }) }
                })
            })

            it('adds no hooks field when the test has no hooks', async () => {
                expect(await attemptWith({}, {})).not.toHaveProperty('hooks')
            })

            it('does not take the previous attempt hook states when beforeTest throws', async () => {
                utils.executeHooksWithArgs.mockImplementation(async (name: string) => { if (name === 'beforeTest') { throw new Error('beforeTest') } })
                const runTest = vi.fn()
                const context = task(false, { retryCount: 1, hooks: { beforeEach: 'pass', afterEach: 'pass' } })
                await expect(hooks.aroundEach(runTest, context)).rejects.toThrow('beforeTest')

                expect(runTest).not.toHaveBeenCalled()
                expect(markers(context)).toEqual([{ event: 'wdio:attempt', retry: 1, payload: { start: expect.any(Number), end: expect.any(Number), state: 'failed', error: expect.objectContaining({ message: 'beforeTest' }) } }])
            })
        })

        describe('unclonable assertion values', () => {
            const marker = async (error: object) => {
                const context = task(false, { retryCount: 0 })
                await hooks.aroundEach(vi.fn(async () => { Object.assign(context.task.result, { state: 'fail', errors: [error] }) }), context)
                return (context.task.meta['wdio:runtime'] as { event: string, payload: any }[]).find(({ event }) => event === 'wdio:attempt')!.payload.error
            }

            it('keeps primitives and clonable objects', async () => {
                const error = await marker(Object.assign(new Error('x'), { expected: 1, actual: { a: [1] } }))
                expect(error).toMatchObject({ expected: 1, actual: { a: [1] } })
            })

            it('turns an object holding a function into a string that survives structured clone', async () => {
                const error = await marker(Object.assign(new Error('x'), { expected: { fn: () => 1, nested: { deep: 1 } }, actual: 'plain' }))
                expect(typeof error.expected).toBe('string')
                expect(error.expected).toContain('deep')
                expect(error.actual).toBe('plain')
                expect(() => structuredClone(error)).not.toThrow()
            })
        })

        describe('Allure attachments', () => {
            const content = Buffer.from([1, 2, 3, 250]).toString('base64')
            const attachment = (wrapInStep = true) => ({ type: 'attachment_content', data: { name: 'shot', content, encoding: 'base64', contentType: 'image/png', fileExtension: '.png', wrapInStep, timestamp: 7 } })
            let resultsDir: string

            const configure = async (dir: string | null) => {
                attachmentDir.value = dir
                await callbacks.beforeAll({}, { file: fileTask })
            }
            const send = (message: unknown) => runInTest(() => { process.emit('allure:runtimeMessage' as never, message as never) }) as Promise<{ payload: any }[]>
            const pendingFiles = (dir = resultsDir) => fs.existsSync(dir) ? fs.readdirSync(dir) : []

            beforeEach(() => {
                resultsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-vitest-allure-'))
            })
            afterEach(() => {
                fs.rmSync(resultsDir, { recursive: true, force: true })
            })

            it('writes the bytes into the injected results folder and relays only an attachment_path message', async () => {
                await configure(resultsDir)
                const [entry] = await send(attachment())
                expect(entry.payload).toEqual({ type: 'attachment_path', data: { name: 'shot', contentType: 'image/png', fileExtension: '.png', wrapInStep: true, timestamp: 7, path: expect.stringContaining(resultsDir) } })
                expect(fs.readFileSync(entry.payload.data.path).equals(Buffer.from(content, 'base64'))).toBe(true)
                expect(JSON.stringify(entry.payload)).not.toContain(content)
                expect((entry as { pendingFile?: string }).pendingFile).toBe(entry.payload.data.path)
            })

            it('ignores the worker-side reporter list, the launcher decides', async () => {
                mockConfig.value = { ...mockConfig.value, reporters: [['allure', { outputDir: resultsDir }]] }
                await configure(null)
                const [entry] = await send(attachment())
                expect(entry.payload).toEqual(attachment())
                expect(pendingFiles()).toEqual([])
            })

            it('offloads the global variant and leaves other messages inline', async () => {
                await configure(resultsDir)
                const step = { type: 'step_start', data: { name: 's', start: 1 } }
                const entries = await send({ ...attachment(), type: 'global_attachment_content' })
                expect(entries[0].payload.type).toBe('global_attachment_path')
                expect((await send(step))[0].payload).toEqual(step)
            })

            it('keeps the content inline without a warning when no folder is injected', async () => {
                await configure(null)
                const [entry] = await send(attachment())
                expect(entry.payload).toEqual(attachment())
                expect(entry).not.toHaveProperty('pendingFile')
                expect(logs.warn).not.toHaveBeenCalled()
                expect(pendingFiles()).toEqual([])
            })

            it('keeps the content inline and warns once when the file cannot be written', async () => {
                const blocker = path.join(resultsDir, 'file')
                fs.writeFileSync(blocker, '')
                await configure(path.join(blocker, 'results'))
                const first = await send(attachment())
                const second = await send(attachment())
                expect(first[0].payload).toEqual(attachment())
                expect(second[0].payload).toEqual(attachment())
                expect(logs.warn).toHaveBeenCalledTimes(1)
            })

            it('keeps the content inline and warns once when the worker module cannot be loaded', async () => {
                vi.doMock('@wdio/allure-reporter/worker', () => { throw new Error('cannot load') })
                try {
                    await configure(resultsDir)
                } finally {
                    vi.doUnmock('@wdio/allure-reporter/worker')
                }
                expect(logs.warn).toHaveBeenCalledTimes(1)
                expect(logs.warn.mock.calls[0][0]).toContain('Could not load @wdio/allure-reporter/worker')
                const [entry] = await send(attachment())
                expect(entry.payload).toEqual(attachment())
            })
        })

        it('warns once when a reporter API is called outside a test', () => {
            process.emit('allure:runtimeMessage' as never, { type: 'step_start', data: { name: 's', start: 1 } } as never)
            process.emit('junit:addProperty' as never, { name: 'k', value: 'v' } as never)
            expect(logs.warn).toHaveBeenCalledTimes(1)
            expect(logs.warn.mock.calls[0][0]).toContain('Dropped allure:runtimeMessage')
        })
    })

    describe('worker services', () => {
        class FakeService {
            calls: string[]
            constructor(calls: string[]) { this.calls = calls }
        }

        async function startWithRecorder() {
            const calls: string[] = []
            const service = new FakeService(calls)
            utils.initializeWorkerService.mockResolvedValue([service])
            utils.executeHooksWithArgs.mockImplementation(async (name: string, _hooks: unknown, hookArgs: unknown[]) => {
                calls.push(name)
                if (name === 'beforeSession') {
                    (hookArgs[1] as Record<string, unknown>)['sauce:options'] = { name: 'spec' }
                }
                return []
            })
            const { remote } = await import('webdriverio')
            vi.mocked(remote).mockImplementation(async () => { calls.push('remote'); return browser as never })
            browser.deleteSession.mockImplementation(async () => { calls.push('deleteSession') })
            return { calls, service }
        }

        it('initializes the worker services with the config, the capabilities and the ignored list, and registers them', async () => {
            args.value = { ignoredWorkerServices: ['sauce'] }
            const { service } = await startWithRecorder()
            await callbacks.beforeAll({}, { file: fileTask })
            expect(utils.initializeWorkerService).toHaveBeenLastCalledWith(mockConfig.value, expect.objectContaining({ browserName: 'chrome' }), ['sauce'])
            expect(added.services).toContain(service)
        })

        it('defaults the ignored worker services to an empty list', () => {
            expect(utils.initializeWorkerService).toHaveBeenLastCalledWith(expect.anything(), expect.anything(), [])
        })

        it('runs the hooks in session order and passes the cid to beforeSession', async () => {
            const { calls } = await startWithRecorder()
            await callbacks.beforeAll({}, { file: fileTask })
            await hooks.aroundEach(vi.fn(async () => { calls.push('test') }), task(false))
            await callbacks.afterAll({}, file())
            expect(calls).toEqual(['beforeSession', 'remote', 'before', 'beforeTest', 'test', 'afterTest', 'after', 'deleteSession', 'afterSession'])
            const [, , beforeSessionArgs] = utils.executeHooksWithArgs.mock.calls.find(([name]) => name === 'beforeSession')!
            expect(beforeSessionArgs).toEqual([mockConfig.value, expect.objectContaining({ browserName: 'chrome' }), ['/repo/a.spec.ts'], `2-${process.env.VITEST_POOL_ID ?? 0}`])
            const [, , afterSessionArgs] = utils.executeHooksWithArgs.mock.calls.find(([name]) => name === 'afterSession')!
            expect(afterSessionArgs).toEqual([mockConfig.value, expect.objectContaining({ browserName: 'chrome' }), ['/repo/a.spec.ts']])
        })

        it('hands the capabilities mutated by beforeSession to remote() and leaves the injected ones untouched', async () => {
            await startWithRecorder()
            await callbacks.beforeAll({}, { file: fileTask })
            const { remote } = await import('webdriverio')
            expect(vi.mocked(remote).mock.calls.at(-1)![0]).toMatchObject({ capabilities: { browserName: 'chrome', 'sauce:options': { name: 'spec' } } })
            expect(injected.caps).not.toHaveProperty('sauce:options')
        })

        it('runs afterSession when the session could not be started, and only once', async () => {
            const { calls } = await startWithRecorder()
            const { remote } = await import('webdriverio')
            vi.mocked(remote).mockRejectedValueOnce(new Error('no session'))
            await expect(callbacks.beforeAll({}, { file: fileTask })).rejects.toThrow('no session')
            await callbacks.afterAll({}, file())
            await callbacks.afterAll({}, file())
            expect(calls.filter((name) => name === 'afterSession')).toHaveLength(1)
        })

        it('runs afterSession when deleteSession fails', async () => {
            const { calls } = await startWithRecorder()
            await callbacks.beforeAll({}, { file: fileTask })
            browser.deleteSession.mockRejectedValueOnce(new Error('gone'))
            await expect(callbacks.afterAll({}, file())).rejects.toThrow('gone')
            expect(calls.at(-1)).toBe('afterSession')
        })

        it('passes the command hooks to remote() but no other hooks', async () => {
            const beforeCommand = [vi.fn()]
            const afterCommand = vi.fn()
            mockConfig.value = { ...mockConfig.value, beforeCommand, afterCommand, beforeTest: [vi.fn()] }
            await callbacks.beforeAll({}, { file: fileTask })
            const { remote } = await import('webdriverio')
            const options = vi.mocked(remote).mock.calls.at(-1)![0] as Record<string, unknown>
            expect(options.beforeCommand).toBe(beforeCommand)
            expect(options.afterCommand).toBe(afterCommand)
            expect(options).not.toHaveProperty('beforeTest')
            expect(options).not.toHaveProperty('before')
        })

        it('passes non-hook function options to remote()', async () => {
            const transformRequest = vi.fn()
            const transformResponse = vi.fn()
            const onReload = [vi.fn()]
            mockConfig.value = { ...mockConfig.value, transformRequest, transformResponse, onReload, beforeCommand: [vi.fn()], afterTest: [vi.fn()] }
            await callbacks.beforeAll({}, { file: fileTask })
            const { remote } = await import('webdriverio')
            const options = vi.mocked(remote).mock.calls.at(-1)![0] as Record<string, unknown>
            expect(options.transformRequest).toBe(transformRequest)
            expect(options.transformResponse).toBe(transformResponse)
            expect(options.onReload).toBe(onReload)
            expect(options).toHaveProperty('beforeCommand')
            expect(options).not.toHaveProperty('before')
            expect(options).not.toHaveProperty('afterTest')
        })
    })

    describe('soft assertions', () => {
        const softError = new Error('1 soft assertion failure')
        const mutateReport = (error?: unknown) => utils.executeHooksWithArgs.mockImplementation(async (name: string, _hooks: unknown, hookArgs: unknown[]) => {
            if (name === 'afterTest' && error) {
                (hookArgs[2] as { error?: unknown }).error = error
            }
            return []
        })

        afterEach(() => { utils.executeHooksWithArgs.mockImplementation(async () => []) })

        it('registers the soft assertion service before the worker services, enabled by default', async () => {
            const service = {}
            utils.initializeWorkerService.mockResolvedValue([service])
            await callbacks.beforeAll({}, { file: fileTask })
            expect(soft.options).toEqual({ autoAssertOnTestEnd: true })
            expect(added.services.indexOf(soft.instances.at(-1))).toBeLessThan(added.services.indexOf(service))
        })

        it('honors autoAssertOnTestEnd: false', async () => {
            mockConfig.value = { ...mockConfig.value, autoAssertOnTestEnd: false }
            await callbacks.beforeAll({}, { file: fileTask })
            expect(soft.options).toEqual({ autoAssertOnTestEnd: false })
        })

        it('fails the test with the error an afterTest service puts on the result', async () => {
            mutateReport(softError)
            await expect(hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'pass' }))).rejects.toBe(softError)
        })

        it('passes when no afterTest service adds an error', async () => {
            mutateReport()
            await expect(hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'pass' }))).resolves.toBeUndefined()
        })

        it('does not throw the soft failures of a failed attempt in the passing retry', async () => {
            utils.executeHooksWithArgs.mockImplementation(async (name: string, _hooks: unknown, hookArgs: unknown[]) => {
                if (name === 'afterTest') {
                    (soft.instances.at(-1) as { afterTest: (...a: unknown[]) => void }).afterTest(...hookArgs)
                }
                return []
            })
            const own = new Error('boom')
            const attempt0 = vi.fn(async () => { soft.failures.set('/repo/a.spec.ts::t', 'x'); throw own })
            await expect(hooks.aroundEach(attempt0, task(false))).rejects.toBe(own)
            await expect(hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'pass' }))).resolves.toBeUndefined()
        })

        it('keeps the error of a test that already failed', async () => {
            const own = new Error('boom')
            mutateReport(softError)
            await expect(hooks.aroundEach(vi.fn(async () => { throw own }), task(false))).rejects.toBe(own)
        })
    })

    describe('afterTest result', () => {
        it('reports the retry count of the Vitest task', async () => {
            await hooks.aroundEach(vi.fn(async () => {}), { task: { ...task(false, { state: 'pass', retryCount: 2 }).task, retry: 3 } })
            expect(afterTestResult()).toMatchObject({ retries: { limit: 3, attempts: 2 }, skipped: false })
        })

        it('defaults to no retries', async () => {
            await hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'pass' }))
            expect(afterTestResult()).toMatchObject({ retries: { limit: 0, attempts: 0 } })
        })

        it('marks skipped tests', async () => {
            await hooks.aroundEach(vi.fn(async () => {}), { task: { ...task(false, { state: 'skip' }).task, mode: 'skip' } })
            expect(afterTestResult()).toMatchObject({ skipped: true })
        })
    })

    it('stores the session id and capabilities on the file meta for the reporter', () => {
        expect(fileTask.meta.wdio).toEqual({ sessionId: 'sess-1', capabilities: { browserName: 'chrome', browserVersion: '130' } })
    })

    it('declares no named context parameter, which Vitest would parse for fixtures', () => {
        expect(hooks.aroundEach.length).toBe(0)
    })

    it('runs non-concurrent tests directly', async () => {
        const runTest = vi.fn(async () => {})
        await hooks.aroundEach(runTest, task(false))
        expect(runTest).toHaveBeenCalledTimes(1)
        expect(store.run).not.toHaveBeenCalled()
        expect(utils.allocateContext).not.toHaveBeenCalled()
        expect(afterTestResult()).toMatchObject({ passed: true })
    })

    it('runs concurrent tests inside the allocated context and cleans up', async () => {
        const runTest = vi.fn(async () => {})
        await hooks.aroundEach(runTest, task(true))
        expect(utils.allocateContext).toHaveBeenCalledWith(browser, 'contexts')
        expect(store.run).toHaveBeenCalledWith('ctx-1', expect.any(Function))
        expect(runTest).toHaveBeenCalledTimes(1)
        expect(utils.cleanupAllocation).toHaveBeenCalledWith(browser, { context: 'ctx-1' })
    })

    it('runs beforeTest and afterTest inside the concurrent context, before cleanup', async () => {
        const order: string[] = []
        store.run.mockImplementationOnce(async (_id: string, fn: () => Promise<void>) => {
            order.push('enter')
            await fn()
            order.push('exit')
        })
        utils.executeHooksWithArgs.mockImplementation(async (name: string) => { order.push(name); return [] })
        utils.cleanupAllocation.mockImplementationOnce(async () => { order.push('cleanup') })
        await hooks.aroundEach(vi.fn(async () => { order.push('test') }), task(true))
        expect(order).toEqual(['enter', 'beforeTest', 'test', 'afterTest', 'exit', 'cleanup'])
    })

    it('still runs afterTest with the error inside the context when a concurrent test throws', async () => {
        const error = new Error('boom')
        await expect(hooks.aroundEach(vi.fn(async () => { throw error }), task(true))).rejects.toThrow('boom')
        expect(afterTestResult()).toMatchObject({ passed: false, error })
        expect(utils.cleanupAllocation).toHaveBeenCalledTimes(1)
    })

    it('cleans up and reports a failure when a concurrent test fails', async () => {
        const error = new Error('boom')
        const context = task(true, {})
        await hooks.aroundEach(vi.fn(async () => { Object.assign(context.task.result, { state: 'fail', errors: [error] }) }), context)
        expect(utils.cleanupAllocation).toHaveBeenCalledTimes(1)
        expect(afterTestResult()).toMatchObject({ passed: false, error })
    })

    it('cleans up when entering the context rejects', async () => {
        store.run.mockRejectedValueOnce(new Error('run failed'))
        await expect(hooks.aroundEach(vi.fn(), task(true))).rejects.toThrow('run failed')
        expect(utils.cleanupAllocation).toHaveBeenCalledTimes(1)
    })

    it('throws for test.concurrent without parallelMode', async () => {
        mockConfig.value.vitestOpts = {}
        await callbacks.beforeAll({}, { file: { filepath: '/repo/a.spec.ts', meta: {} } })
        await expect(hooks.aroundEach(vi.fn(), task(true))).rejects.toThrow('test.concurrent needs vitestOpts.parallelMode')
    })

    it('throws when the session is not Bidi', async () => {
        browser.isBidi = false
        await expect(hooks.aroundEach(vi.fn(), task(true))).rejects.toThrow('needs a WebDriver Bidi session')
    })

    it('throws when the parallel context store is missing', async () => {
        browser.__parallelContextStore = undefined
        await expect(hooks.aroundEach(vi.fn(), task(true))).rejects.toThrow('__parallelContextStore is missing')
    })

    it('passes the number of failed tests to the after hook', async () => {
        await callbacks.afterAll({}, file([testTask('fail'), testTask('pass'), testTask('fail')]))
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [2, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('passes 0 to the after hook when all tests pass, including one that passed on retry', async () => {
        await callbacks.afterAll({}, file([testTask('pass'), testTask('pass')]))
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [0, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('counts a failed beforeAll of the file, whose tests were skipped, as a failure', async () => {
        await callbacks.afterAll({}, file([testTask('skip')], [new Error('beforeAll failed')]))
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [1, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('counts failed tests and failed hooks of nested suites', async () => {
        const nested = { type: 'suite', tasks: [testTask('fail'), testTask('pass')], result: { state: 'fail', errors: [new Error('afterAll failed')] } }
        const clean = { type: 'suite', tasks: [testTask('pass')], result: { state: 'pass' } }
        await callbacks.afterAll({}, file([nested, clean, testTask('fail')]))
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [3, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('deletes the session even when the after hook fails', async () => {
        utils.executeHooksWithArgs.mockImplementation(async (name: string) => { if (name === 'after') { throw new Error('after failed') } return [] })
        await expect(callbacks.afterAll({}, file())).rejects.toThrow('after failed')
        expect(browser.deleteSession).toHaveBeenCalledTimes(1)
    })
    describe('exit signals', () => {
        const kill = vi.spyOn(process, 'kill').mockImplementation((() => true) as never)
        const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
        const signalListeners = (signal: 'SIGINT' | 'SIGTERM') => process.listeners(signal).length

        beforeEach(() => {
            exit.mockClear()
            kill.mockClear()
            browser.deleteSession.mockReset()
            utils.executeHooksWithArgs.mockReset().mockResolvedValue([])
        })

        it('deletes the session, runs afterSession once, and re-raises SIGINT', async () => {
            process.emit('SIGINT')
            await vi.waitFor(() => expect(kill).toHaveBeenCalledWith(process.pid, 'SIGINT'))
            expect(exit).not.toHaveBeenCalled()
            expect(signalListeners('SIGINT')).toBe(signalListenersBefore[0][1].length)
            expect(browser.deleteSession).toHaveBeenCalledTimes(1)
            expect(utils.executeHooksWithArgs.mock.calls.filter(([name]) => name === 'afterSession')).toHaveLength(1)
        })

        it('re-raises SIGTERM', async () => {
            process.emit('SIGTERM')
            await vi.waitFor(() => expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM'))
        })

        it('does not tear down twice when afterAll runs as well', async () => {
            process.emit('SIGINT')
            await callbacks.afterAll({}, file())
            await vi.waitFor(() => expect(kill).toHaveBeenCalled())
            expect(browser.deleteSession).toHaveBeenCalledTimes(1)
            expect(utils.executeHooksWithArgs.mock.calls.filter(([name]) => name === 'afterSession')).toHaveLength(1)
        })

        it('re-raises after the timeout when deleteSession hangs', async () => {
            vi.useFakeTimers()
            try {
                browser.deleteSession.mockReturnValue(new Promise(() => {}))
                process.emit('SIGINT')
                await vi.advanceTimersByTimeAsync(9_999)
                expect(kill).not.toHaveBeenCalled()
                await vi.advanceTimersByTimeAsync(1)
                expect(kill).toHaveBeenCalledWith(process.pid, 'SIGINT')
            } finally {
                vi.useRealTimers()
            }
        })

        it('still re-raises when teardown fails', async () => {
            browser.deleteSession.mockRejectedValue(new Error('gone'))
            process.emit('SIGINT')
            await vi.waitFor(() => expect(kill).toHaveBeenCalledWith(process.pid, 'SIGINT'))
        })

        it('removes the handlers after normal teardown', async () => {
            const before = [signalListeners('SIGINT'), signalListeners('SIGTERM')]
            await callbacks.afterAll({}, file())
            expect([signalListeners('SIGINT'), signalListeners('SIGTERM')]).toEqual([before[0] - 1, before[1] - 1])
            process.emit('SIGINT')
            expect(kill).not.toHaveBeenCalled()
        })
    })
})
