import { beforeEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({ aroundEach: undefined as unknown as (runTest: () => Promise<void>, context: unknown) => Promise<void> }))
const store = vi.hoisted(() => ({ run: vi.fn(async (_id: string, fn: () => Promise<void>) => fn()) }))
const browser = vi.hoisted(() => ({ sessionId: 'sess-1', capabilities: { browserName: 'chrome', browserVersion: '130' }, isBidi: true, __parallelContextStore: undefined as unknown, deleteSession: vi.fn() }))
const utils = vi.hoisted(() => ({
    allocateContext: vi.fn(async () => ({ context: 'ctx-1' })),
    cleanupAllocation: vi.fn(async () => {}),
    executeHooksWithArgs: vi.fn(async () => [])
}))
const callbacks = vi.hoisted(() => ({ beforeAll: undefined as unknown as (...args: unknown[]) => Promise<void>, afterAll: undefined as unknown as () => Promise<void> }))
const configFile = '/repo/wdio.conf.ts'
const mockConfig = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

vi.mock('vitest', () => ({
    aroundEach: vi.fn((fn) => { hooks.aroundEach = fn }),
    beforeAll: vi.fn((fn) => { callbacks.beforeAll = fn }),
    afterAll: vi.fn((fn) => { callbacks.afterAll = fn }),
    inject: vi.fn((key: string) => key === 'wdioConfigFile' ? configFile : { browserName: 'chrome', hostname: 'grid' })
}))
vi.mock('@wdio/utils', () => utils)
vi.mock('@wdio/config/node', () => ({
    ConfigParser: class {
        initialize = vi.fn()
        getConfig = () => mockConfig.value
    }
}))
vi.mock('expect-webdriverio', () => ({ expect: { name: 'wdio-expect' }, setDefaultOptions: vi.fn() }))
vi.mock('webdriverio', () => ({
    PARALLEL_CONTEXT_STORE_KEY: '__parallelContextStore',
    remote: vi.fn(async () => browser)
}))

const task = (concurrent: boolean, result?: object) => ({ task: { name: 't', fullName: 'f > t', concurrent, suite: undefined, result } })
const afterTestResult = () => utils.executeHooksWithArgs.mock.calls.find(([name]) => name === 'afterTest')![2][2]

describe('setup', () => {
    let fileTask: { filepath: string, meta: Record<string, unknown> }

    beforeEach(async () => {
        vi.clearAllMocks()
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
        expect(store.run).toHaveBeenCalledWith('ctx-1', runTest)
        expect(utils.cleanupAllocation).toHaveBeenCalledWith(browser, { context: 'ctx-1' })
    })

    it('cleans up and reports a failure when a concurrent test fails', async () => {
        const error = new Error('boom')
        await hooks.aroundEach(vi.fn(async () => {}), task(true, { state: 'fail', errors: [error] }))
        expect(utils.cleanupAllocation).toHaveBeenCalledTimes(1)
        expect(afterTestResult()).toMatchObject({ passed: false, error })
    })

    it('cleans up when running the test rejects', async () => {
        store.run.mockRejectedValueOnce(new Error('run failed'))
        await expect(hooks.aroundEach(vi.fn(), task(true))).rejects.toThrow('run failed')
        expect(utils.cleanupAllocation).toHaveBeenCalledTimes(1)
        expect(afterTestResult()).toMatchObject({ passed: false })
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
})
