import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'

import LocalRunner from '../src/index.js'

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
    vi.clearAllMocks()
})

vi.mock(
    '@wdio/logger',
    () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger'))
)

vi.mock('@wdio/xvfb', () => {
    const childProcessMock = {
        on: vi.fn(),
        send: vi.fn(),
        kill: vi.fn(),
    }

    return {
        ProcessFactory: vi.fn().mockImplementation(() => ({
            createWorkerProcess: vi.fn().mockResolvedValue(childProcessMock)
        })),
        XvfbManager: vi.fn().mockImplementation(() => ({
            init: vi.fn().mockResolvedValue(true),
            shouldRun: vi.fn().mockReturnValue(true)
        })),
        default: vi.fn()
    }
})

test("should pass xvfbAutoInstall:'sudo' to XvfbManager", async () => {
    const xvfb = await import('@wdio/xvfb')
    const runner = new LocalRunner(
        undefined as never,
        { xvfbAutoInstall: 'sudo' } as any
    )

    await runner.run({
        cid: 'auto-3',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(vi.mocked(xvfb.XvfbManager)).toHaveBeenCalledWith(
        expect.objectContaining({ autoInstall: 'sudo' })
    )
})

test('should pass object-form xvfbAutoInstall to XvfbManager', async () => {
    const xvfb = await import('@wdio/xvfb')
    const runner = new LocalRunner(
        undefined as never,
        { xvfbAutoInstall: { mode: 'sudo', command: 'echo install' } } as any
    )

    await runner.run({
        cid: 'auto-4',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(vi.mocked(xvfb.XvfbManager)).toHaveBeenCalledWith(
        expect.objectContaining({ autoInstall: { mode: 'sudo', command: 'echo install' } })
    )
})
test('should fork a new process', async () => {
    const runner = new LocalRunner(
        undefined as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
        } as any
    )
    const worker = await runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    worker['_handleMessage']({ name: 'ready' } as any)
    await sleep()

    expect(worker.isBusy).toBe(true)
    expect(worker.childProcess?.on).toHaveBeenCalled()

    expect(worker.childProcess?.send).toHaveBeenCalledWith({
        args: {},
        caps: {},
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        retries: 0,
        specs: ['/foo/bar.test.js'],
    })

    await worker.postMessage('runAgain', { foo: 'bar' } as any)
})

test('should shut down worker processes', async () => {
    const runner = new LocalRunner(
        undefined as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
        } as any
    )
    const worker1 = await runner.run({
        cid: '0-4',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    worker1['_handleMessage']({ name: 'ready' } as any)
    await sleep()
    const worker2 = await runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    worker2['_handleMessage']({ name: 'ready' } as any)
    await sleep()
    setTimeout(() => {
        worker1.isBusy = false
        setTimeout(() => {
            worker2.isBusy = false
        }, 260)
    }, 260)

    const before = Date.now()
    await runner.shutdown()
    const after = Date.now()

    expect(after - before).toBeGreaterThanOrEqual(750)
    const call1: any = vi
        .mocked(worker1.childProcess?.send)!
        .mock.calls.pop()![0]
    expect(call1.cid).toBe('0-5')
    expect(call1.command).toBe('endSession')
    const call2: any = vi
        .mocked(worker1.childProcess?.send)!
        .mock.calls.pop()![0]
    expect(call2.cid).toBe('0-4')
    expect(call2.command).toBe('endSession')
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner(
        undefined as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
        } as any
    )

    await runner.run({
        cid: '0-8',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: { sessionId: 'abc' } as any,
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    runner.workerPool['0-8'].isBusy = false

    await runner.shutdown()

    expect(runner.workerPool['0-8']).toBeFalsy()
})

test('should shut down worker processes in watch mode - regular', async () => {
    const runner = new LocalRunner(
        undefined as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            watch: true,
        } as any
    )

    const worker = await runner.run({
        cid: '0-6',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: { sessionId: 'abc' } as any,
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    worker['_handleMessage']({ name: 'ready' } as any)
    runner.workerPool['0-6'].sessionId = 'abc'
    runner.workerPool['0-6'].server = { host: 'foo' }
    runner.workerPool['0-6'].caps = { browser: 'chrome' } as any

    setTimeout(() => {
        worker.isBusy = false
    }, 260)

    const before = Date.now()
    await runner.shutdown()
    const after = Date.now()

    expect(after - before).toBeGreaterThanOrEqual(300)

    const call: any = vi
        .mocked(worker.childProcess?.send)!
        .mock.calls.pop()![0]
    expect(call.cid).toBe('0-6')
    expect(call.command).toBe('endSession')
    expect(call.args.watch).toBe(true)
    expect(call.args.isMultiremote).toBeFalsy()
    expect(call.args.config.sessionId).toBe('abc')
    expect(call.args.config.host).toEqual('foo')
})

test('should shut down worker processes in watch mode - mutliremote', async () => {
    const runner = new LocalRunner(
        undefined as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            watch: true,
        } as any
    )

    const worker = await runner.run({
        cid: '0-7',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    worker['_handleMessage']({ name: 'ready' } as any)
    runner.workerPool['0-7'].isMultiremote = true
    runner.workerPool['0-7'].instances = { foo: { sessionId: '123' } }
    runner.workerPool['0-7'].caps = {
        foo: {
            capabilities: { browser: 'chrome' },
        },
    } as any

    setTimeout(() => {
        worker.isBusy = false
    }, 260)

    const before = Date.now()
    await runner.shutdown()
    const after = Date.now()

    expect(after - before).toBeGreaterThanOrEqual(300)

    const call: any = vi
        .mocked(worker.childProcess?.send)!
        .mock.calls.pop()![0]
    expect(call.cid).toBe('0-7')
    expect(call.command).toBe('endSession')
    expect(call.args.watch).toBe(true)
    expect(call.args.isMultiremote).toBe(true)
    expect(call.args.instances).toEqual({ foo: { sessionId: '123' } })
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner(undefined as never, {} as any)
    expect(await runner.initialize()).toBe(undefined)
})

test('should initialize xvfb lazily during first run when needed', async () => {
    const runner = new LocalRunner(undefined as never, {} as any)

    // Mock the xvfbManager instance that was created in constructor
    const mockInit = vi.fn().mockResolvedValue(true)
    runner['xvfbManager'] = { init: mockInit } as any

    // Initialize should not call xvfb.init
    await runner.initialize()
    expect(mockInit).not.toHaveBeenCalled()

    // First run should initialize xvfb
    await runner.run({
        cid: '0-1',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: { 'goog:chromeOptions': { args: ['--headless'] } },
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(mockInit).toHaveBeenCalledWith({ 'goog:chromeOptions': { args: ['--headless'] } })
})

test('should not initialize xvfb during run when not needed', async () => {
    const runner = new LocalRunner(undefined as never, {} as any)

    // Mock the xvfbManager instance that was created in constructor
    const mockInit = vi.fn().mockResolvedValue(false)
    runner['xvfbManager'] = { init: mockInit } as any

    await runner.initialize()

    await runner.run({
        cid: '0-2',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(mockInit).toHaveBeenCalled()
    // Verify that xvfb didn't actually initialize (returned false)
    const initResult = await mockInit.mock.results[0].value
    expect(initResult).toBe(false)
})

test('should handle xvfb initialization failure gracefully', async () => {
    const runner = new LocalRunner(undefined as never, {} as any)

    // Mock the xvfbManager instance that was created in constructor
    const mockInit = vi.fn().mockResolvedValue(true)
    runner['xvfbManager'] = { init: mockInit } as any

    // Should not throw during run, just log the error
    await expect(runner.run({
        cid: '0-3',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)).resolves.toBeDefined()
    expect(mockInit).toHaveBeenCalled()
})

test('should only initialize xvfb once across multiple runs', async () => {
    const runner = new LocalRunner(undefined as never, {} as any)

    // Mock the xvfbManager instance that was created in constructor
    const mockInit = vi.fn().mockResolvedValue(true)
    runner['xvfbManager'] = { init: mockInit } as any

    // First run should initialize xvfb
    await runner.run({
        cid: '0-4',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar1.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    // Second run should not initialize xvfb again
    await runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(mockInit).toHaveBeenCalledTimes(1)
})

test('should handle xvfb operations with existing workers', async () => {
    const runner = new LocalRunner(
        undefined as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
        } as any
    )

    // Mock the xvfbManager instance that was created in constructor
    const mockInit = vi.fn().mockResolvedValue(true)
    const mockShouldRun = vi.fn().mockReturnValue(true)
    runner['xvfbManager'] = { init: mockInit, shouldRun: mockShouldRun } as any

    // Start a worker (should initialize xvfb)
    const worker = await runner.run({
        cid: '0-9',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)
    worker['_handleMessage']({ name: 'ready' } as any)

    setTimeout(() => {
        worker.isBusy = false
    }, 100)

    await runner.shutdown()

    expect(mockInit).toHaveBeenCalled()
})

test('should skip xvfb initialization when disabled in config', async () => {
    const runner = new LocalRunner(
        undefined as never,
        { autoXvfb: false } as any
    )

    // Mock the xvfbManager instance that was created in constructor
    const mockInit = vi.fn().mockResolvedValue(true)
    runner['xvfbManager'] = { init: mockInit } as any

    await runner.run({
        cid: '0-10',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(mockInit).not.toHaveBeenCalled()
})

test('should pass xvfbAutoInstall:true to XvfbManager', async () => {
    const xvfb = await import('@wdio/xvfb')
    const runner = new LocalRunner(
        undefined as never,
        { xvfbAutoInstall: true } as any
    )

    // Trigger lazy init to ensure constructor ran
    await runner.run({
        cid: 'auto-1',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(vi.mocked(xvfb.XvfbManager)).toHaveBeenCalledWith(
        expect.objectContaining({ autoInstall: true })
    )
})

test('should pass xvfbAutoInstall:false to XvfbManager', async () => {
    const xvfb = await import('@wdio/xvfb')
    const runner = new LocalRunner(
        undefined as never,
        { xvfbAutoInstall: false } as any
    )

    await runner.run({
        cid: 'auto-2',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(vi.mocked(xvfb.XvfbManager)).toHaveBeenCalledWith(
        expect.objectContaining({ autoInstall: false })
    )
})

test('should pass enabled:true to XvfbManager by default', async () => {
    const xvfb = await import('@wdio/xvfb')
    const runner = new LocalRunner(
        undefined as never,
        {} as any
    )

    await runner.run({
        cid: 'en-1',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(vi.mocked(xvfb.XvfbManager)).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
    )
})

test('should pass enabled:false to XvfbManager when autoXvfb is false', async () => {
    const xvfb = await import('@wdio/xvfb')
    const runner = new LocalRunner(
        undefined as never,
        { autoXvfb: false } as any
    )

    await runner.run({
        cid: 'en-2',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    } as any)

    expect(vi.mocked(xvfb.XvfbManager)).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
    )
})
