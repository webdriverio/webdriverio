import path from 'node:path'
import type * as ChildProcessModule from 'node:child_process'
import { expect, test, vi, beforeEach } from 'vitest'

import type * as DisplayServerModule from '@wdio/display-server'
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

vi.mock('@wdio/display-server', async () => {
    // Use the real optionsFromConfig so the mapping under test runs through;
    // mock only the runtime classes that would otherwise pull in display-server
    // side-effects (logger init, fs probes, etc.).
    const actual = await vi.importActual<typeof DisplayServerModule>('@wdio/display-server')
    return {
        ...actual,
        DisplayServerManager: vi.fn().mockImplementation(() => ({
            init: vi.fn().mockResolvedValue(true),
            shouldRun: vi.fn().mockReturnValue(true),
            injectDisplayFlags: vi.fn(),
            getDisplayServer: vi.fn().mockReturnValue(null),
        })),
        // The daemon-start path lives in startDisplayDaemonFromConfig now.
        // Default to "no daemon needed" (null) so non-daemon tests don't have
        // to mock around the eager initialize().
        startDisplayDaemonFromConfig: vi.fn().mockResolvedValue(null),
        default: vi.fn()
    }
})

test("should pass xvfbAutoInstall:'sudo' to DisplayServerManager", async () => {
    const displayServer = await import('@wdio/display-server')
    const runner = new LocalRunner(
        {} as never,
        {
            xvfbAutoInstall: 'sudo',
            autoXvfb: true,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
        } as any
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
    })

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({ xvfbAutoInstall: 'sudo', xvfbAutoInstallMode: undefined })
    )
})

test('should pass object-form xvfbAutoInstall to DisplayServerManager', async () => {
    const displayServer = await import('@wdio/display-server')
    const runner = new LocalRunner(
        {} as never,
        {
            xvfbAutoInstall: { mode: 'sudo', command: 'echo install' },
            autoXvfb: true,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
        } as any
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
    })

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({
            xvfbAutoInstall: { mode: 'sudo', command: 'echo install' },
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
        })
    )
})

test('should map new displayServer* options through to DisplayServerManager', async () => {
    const displayServer = await import('@wdio/display-server')
    new LocalRunner(
        {} as never,
        {
            displayServer: 'wayland',
            displayServerEnabled: true,
            displayServerAutoInstall: true,
            displayServerAutoInstallMode: 'sudo',
            displayServerAutoInstallCommand: 'custom-cmd',
            displayServerMaxRetries: 5,
            displayServerRetryDelay: 2000,
        } as any
    )

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({
            displayServer: 'wayland',
            enabled: true,
            autoInstall: true,
            autoInstallMode: 'sudo',
            autoInstallCommand: 'custom-cmd',
            maxRetries: 5,
            retryDelay: 2000,
        })
    )
})

test('should fork a new process', async () => {
    const runner = new LocalRunner(
        {} as never,
        {
            outputDir: '/foo/bar',
            runnerEnv: { FORCE_COLOR: 1 },
            autoXvfb: true,
            xvfbAutoInstall: undefined,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
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
            autoXvfb: true,
            xvfbAutoInstall: undefined,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
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
            autoXvfb: true,
            xvfbAutoInstall: undefined,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
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
            autoXvfb: true,
            xvfbAutoInstall: undefined,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
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
    expect(call.args.isMultiremote).toBeFalsy()
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
            autoXvfb: true,
            xvfbAutoInstall: undefined,
            xvfbAutoInstallMode: undefined,
            xvfbAutoInstallCommand: undefined
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
    const runner = new LocalRunner({} as never, {
        autoXvfb: true,
        xvfbAutoInstall: undefined,
        xvfbAutoInstallMode: undefined,
        xvfbAutoInstallCommand: undefined
    } as any)
    expect(await runner.initialize()).toBe(undefined)
})

test('starts a display-server daemon during initialize() when one is needed', async () => {
    const displayServer = await import('@wdio/display-server')
    const stopSpy = vi.fn().mockResolvedValue(undefined)
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockResolvedValueOnce({ stop: stopSpy })

    const runner = new LocalRunner({} as never, { autoXvfb: true } as any)
    await runner.initialize()

    expect(displayServer.startDisplayDaemonFromConfig).toHaveBeenCalledTimes(1)
})

test('shuts down cleanly when startDisplayDaemonFromConfig returns null', async () => {
    const displayServer = await import('@wdio/display-server')
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockResolvedValueOnce(null)

    const runner = new LocalRunner({} as never, { autoXvfb: true } as any)
    await runner.initialize()

    expect(displayServer.startDisplayDaemonFromConfig).toHaveBeenCalledTimes(1)
    // No daemon was started, so shutdown shouldn't try to stop anything.
    await runner.shutdown()
})

test('stops the daemon during shutdown() when one was started in initialize()', async () => {
    const displayServer = await import('@wdio/display-server')
    const stopSpy = vi.fn().mockResolvedValue(undefined)
    vi.mocked(displayServer.startDisplayDaemonFromConfig).mockResolvedValueOnce({ stop: stopSpy })

    const runner = new LocalRunner({} as never, { autoXvfb: true } as any)
    await runner.initialize()
    await runner.shutdown()

    expect(stopSpy).toHaveBeenCalledTimes(1)
})

test('injects display flags into every spawned worker (independent of daemon state)', async () => {
    const runner = new LocalRunner({} as never, { autoXvfb: true } as any)

    const mockInject = vi.fn()
    runner['displayServerManager'] = {
        init: vi.fn().mockResolvedValue(true),
        injectDisplayFlags: mockInject,
        shouldRun: vi.fn().mockReturnValue(true),
        getDisplayServer: vi.fn().mockReturnValue(null),
    } as any

    const caps1 = { browserName: 'chrome' }
    const caps2 = { browserName: 'firefox' }

    await runner.run({
        cid: '0-a',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: caps1 as any,
        specs: ['/foo/a.test.js'],
        execArgv: [],
        retries: 0,
    })
    await runner.run({
        cid: '0-b',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: caps2 as any,
        specs: ['/foo/b.test.js'],
        execArgv: [],
        retries: 0,
    })

    // injectDisplayFlags fires per worker so Chrome/Edge get
    // --ozone-platform=wayland on every spec when Wayland is in play.
    expect(mockInject).toHaveBeenCalledTimes(2)
    expect(mockInject).toHaveBeenNthCalledWith(1, caps1)
    expect(mockInject).toHaveBeenNthCalledWith(2, caps2)
})

test('should pass xvfbAutoInstall:true to DisplayServerManager', async () => {
    const displayServer = await import('@wdio/display-server')
    const runner = new LocalRunner(
        {} as never,
        {
            xvfbAutoInstall: true,
            autoXvfb: true
        } as any
    )

    await runner.run({
        cid: 'auto-1',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0,
    })

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({ xvfbAutoInstall: true })
    )
})

test('should pass xvfbAutoInstall:false to DisplayServerManager', async () => {
    const displayServer = await import('@wdio/display-server')
    const runner = new LocalRunner(
        {} as never,
        {
            xvfbAutoInstall: false,
            autoXvfb: true
        } as any
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
    })

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({ xvfbAutoInstall: false })
    )
})

test('should pass autoXvfb:true to DisplayServerManager by default', async () => {
    const displayServer = await import('@wdio/display-server')
    const runner = new LocalRunner(
        {} as never,
        {
            autoXvfb: true
        } as any
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
    })

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({ autoXvfb: true })
    )
})

test('should pass autoXvfb:false to DisplayServerManager when autoXvfb is false', async () => {
    const displayServer = await import('@wdio/display-server')
    const runner = new LocalRunner(
        {} as never,
        {
            autoXvfb: false
        } as any
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
    })

    expect(vi.mocked(displayServer.DisplayServerManager)).toHaveBeenCalledWith(
        expect.objectContaining({ autoXvfb: false })
    )
})
