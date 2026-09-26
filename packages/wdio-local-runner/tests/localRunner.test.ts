import path from 'node:path'
import type * as ChildProcessModule from 'node:child_process'
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

const childProcessMock = {
    on: vi.fn(),
    send: vi.fn(),
    kill: vi.fn(),
    stdout: { pipe: vi.fn() },
    stderr: { pipe: vi.fn() },
}

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof ChildProcessModule>()
    return {
        ...actual,
        fork: vi.fn().mockImplementation(() => childProcessMock),
    }
})

vi.mock('@wdio/display-server', () => ({
    startDisplayDaemonFromConfig: vi.fn().mockResolvedValue(null), // No daemon by default, so tests that don't need one can ignore initialize().
}))

test('should fork a new process', async () => {
    const runner = new LocalRunner(
        {} as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            displayServerEnabled: true
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
    })
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
        {} as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            displayServerEnabled: true
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
    })
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
    })
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

    expect(after - before).toBeGreaterThanOrEqual(740)
    const call1: any = vi.mocked(worker1.childProcess?.send)!.mock.calls.pop()![0]
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
        {} as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            displayServerEnabled: true
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
    })
    runner.workerPool['0-8'].isBusy = false

    await runner.shutdown()

    expect(runner.workerPool['0-8']).toBeFalsy()
})

test('should shut down worker processes in watch mode - regular', async () => {
    const runner = new LocalRunner(
        {} as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            watch: true,
            displayServerEnabled: true
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
    })
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
    expect(call.args.isMultiRemote).toBeFalsy()
    expect(call.args.config.sessionId).toBe('abc')
    expect(call.args.config.host).toEqual('foo')
})

test('should shut down worker processes in watch mode - mutliremote', async () => {
    const runner = new LocalRunner(
        {} as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            watch: true,
            displayServerEnabled: true
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
    })
    worker['_handleMessage']({ name: 'ready' } as any)
    runner.workerPool['0-7'].isMultiRemote = true
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
    expect(call.args.isMultiRemote).toBe(true)
    expect(call.args.instances).toEqual({ foo: { sessionId: '123' } })
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner({} as never, {
        displayServerEnabled: true
    } as any)
    expect(await runner.initialize()).toBe(undefined)
})

test('starts a display-server daemon during initialize() when one is needed', async () => {
    const displayServer = await import('@wdio/display-server')
    const stopSpy = vi.fn().mockResolvedValue(undefined)
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockResolvedValueOnce({ stop: stopSpy })

    const config = { displayServerEnabled: true } as WebdriverIO.Config
    const runner = new LocalRunner({} as never, config)
    await runner.initialize()

    expect(displayServer.startDisplayDaemonFromConfig).toHaveBeenCalledTimes(1)
    expect(displayServer.startDisplayDaemonFromConfig).toHaveBeenCalledWith(config)
})

test('continues without a display when starting the daemon throws', async () => {
    const displayServer = await import('@wdio/display-server')
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockRejectedValueOnce(new Error('mkdtemp ENOSPC'))

    const runner = new LocalRunner({} as never, { displayServerEnabled: true } as WebdriverIO.Config)

    await expect(runner.initialize()).resolves.toBeUndefined()
    expect(runner['daemon']).toBeNull()
})

test('shuts down cleanly when startDisplayDaemonFromConfig returns null', async () => {
    const displayServer = await import('@wdio/display-server')
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockResolvedValueOnce(null)

    const runner = new LocalRunner({} as never, { displayServerEnabled: true } as any)
    await runner.initialize()

    expect(displayServer.startDisplayDaemonFromConfig).toHaveBeenCalledTimes(1)
    await runner.shutdown()
})

test('keeps the daemon through shutdown() and stops it in dispose()', async () => {
    const displayServer = await import('@wdio/display-server')
    const stopSpy = vi.fn().mockResolvedValue(undefined)
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockResolvedValueOnce({ stop: stopSpy })

    const runner = new LocalRunner({} as never, { displayServerEnabled: true } as any)
    await runner.initialize()
    await runner.shutdown()

    expect(stopSpy).not.toHaveBeenCalled()

    await runner.dispose()

    expect(stopSpy).toHaveBeenCalledTimes(1)
})
