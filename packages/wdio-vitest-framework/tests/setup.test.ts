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
const callbacks = vi.hoisted(() => ({ beforeAll: undefined as unknown as (...args: unknown[]) => Promise<void>, afterAll: undefined as unknown as () => Promise<void> }))
const configFile = '/repo/wdio.conf.ts'
const injected = vi.hoisted(() => ({ caps: { browserName: 'chrome', hostname: 'grid' } as Record<string, unknown> }))
const mockConfig = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

vi.mock('vitest', () => ({
    aroundEach: vi.fn((fn) => { hooks.aroundEach = fn }),
    beforeAll: vi.fn((fn) => { callbacks.beforeAll = fn }),
    afterAll: vi.fn((fn) => { callbacks.afterAll = fn }),
    inject: vi.fn((key: string) => key === 'wdioConfigFile' ? configFile : key === 'wdioArgs' ? args.value : key === 'wdioProjectIndex' ? 2 : injected.caps)
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
const soft = vi.hoisted(() => ({ options: undefined as unknown, error: undefined as unknown, instances: [] as unknown[] }))
vi.mock('expect-webdriverio', () => ({
    expect: { name: 'wdio-expect' },
    setDefaultOptions: vi.fn(),
    SoftAssertionService: class {
        constructor(options: unknown) { soft.options = options; soft.instances.push(this) }
    }
}))
vi.mock('webdriverio', () => ({
    PARALLEL_CONTEXT_STORE_KEY: '__parallelContextStore',
    remote: vi.fn(async () => browser)
}))

const task = (concurrent: boolean, result?: object) => ({ task: { name: 't', fullName: 'f > t', concurrent, suite: undefined, result } })
const afterTestResult = () => utils.executeHooksWithArgs.mock.calls.find(([name]) => name === 'afterTest')![2][2]

describe('setup', () => {
    let fileTask: { filepath: string, meta: Record<string, unknown> }
    let signalListenersBefore: [NodeJS.Signals, NodeJS.SignalsListener[]][]

    // every beforeAll in this file registers handlers that only afterAll removes
    afterEach(() => {
        signalListenersBefore.forEach(([signal, before]) => process.listeners(signal).filter((listener) => !before.includes(listener)).forEach((listener) => process.off(signal, listener)))
    })

    beforeEach(async () => {
        signalListenersBefore = (['SIGINT', 'SIGTERM'] as const).map((signal) => [signal, process.listeners(signal)])
        vi.clearAllMocks()
        added.services = []
        soft.options = undefined
        soft.instances = []
        soft.error = undefined
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
            await callbacks.afterAll()
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
            await callbacks.afterAll()
            await callbacks.afterAll()
            expect(calls.filter((name) => name === 'afterSession')).toHaveLength(1)
        })

        it('runs afterSession when deleteSession fails', async () => {
            const { calls } = await startWithRecorder()
            await callbacks.beforeAll({}, { file: fileTask })
            browser.deleteSession.mockRejectedValueOnce(new Error('gone'))
            await expect(callbacks.afterAll()).rejects.toThrow('gone')
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
        await hooks.aroundEach(vi.fn(async () => {}), task(true, { state: 'fail', errors: [error] }))
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
        await hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'fail', errors: [new Error('a')] }))
        await hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'pass' }))
        await hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'fail', errors: [new Error('b')] }))
        await callbacks.afterAll()
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [2, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('passes 0 to the after hook when all tests pass', async () => {
        await hooks.aroundEach(vi.fn(async () => {}), task(false, { state: 'pass' }))
        await callbacks.afterAll()
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [0, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('counts a failing before hook as a failure', async () => {
        utils.executeHooksWithArgs.mockImplementationOnce(async () => { throw new Error('before failed') })
        await expect(callbacks.beforeAll({}, { file: { filepath: '/repo/a.spec.ts', meta: {} } })).rejects.toThrow('before failed')
        await callbacks.afterAll()
        expect(utils.executeHooksWithArgs).toHaveBeenCalledWith('after', mockConfig.value.after, [1, expect.anything(), ['/repo/a.spec.ts']])
    })

    it('deletes the session even when the after hook fails', async () => {
        utils.executeHooksWithArgs.mockImplementation(async (name: string) => { if (name === 'after') { throw new Error('after failed') } return [] })
        await expect(callbacks.afterAll()).rejects.toThrow('after failed')
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
            await callbacks.afterAll()
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
            await callbacks.afterAll()
            expect([signalListeners('SIGINT'), signalListeners('SIGTERM')]).toEqual([before[0] - 1, before[1] - 1])
            process.emit('SIGINT')
            expect(kill).not.toHaveBeenCalled()
        })
    })
})
