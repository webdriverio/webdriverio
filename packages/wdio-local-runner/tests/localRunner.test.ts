import path from 'node:path'
import child from 'node:child_process'
import { expect, test, vi } from 'vitest'

import LocalRunner from '../src/index.js'

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('child_process', () => {
    const childProcessMock = {
        on: vi.fn(),
        send: vi.fn(),
        kill: vi.fn()
    }

    return {
        default: { fork: vi.fn().mockReturnValue(childProcessMock) }
    }
})

test('should fork a new process', async () => {
    const runner = new LocalRunner(undefined as never, {
        outputDir: '/foo/bar',
        runnerEnv: { FORCE_COLOR: 1 }
    } as any)
    const worker = runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0
    })
    worker['_handleMessage']({ name: 'ready' } as any)
    await sleep()

    expect(worker.isBusy).toBe(true)
    expect(vi.mocked(child.fork).mock.calls[0][0].endsWith('run.js')).toBe(true)

    const { env } = vi.mocked(child.fork).mock.calls[0][2]! as any
    expect(env.WDIO_LOG_PATH).toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-5\.log/)
    expect(env.FORCE_COLOR).toBe(1)
    expect(worker.childProcess?.on).toHaveBeenCalled()

    expect(worker.childProcess?.send).toHaveBeenCalledWith({
        args: {},
        caps: {},
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        retries: 0,
        specs: ['/foo/bar.test.js']
    })

    worker.postMessage('runAgain', { foo: 'bar' })
})

test('should shut down worker processes', async () => {
    const runner = new LocalRunner(undefined as never, {
        outputDir: '/foo/bar',
        runnerEnv: { FORCE_COLOR: 1 }
    } as any)
    const worker1 = runner.run({
        cid: '0-4',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0
    })
    worker1['_handleMessage']({ name: 'ready' } as any)
    await sleep()
    const worker2 = runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0
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

    expect(after - before).toBeGreaterThanOrEqual(750)
    const call1: any = vi.mocked(worker1.childProcess?.send)!.mock.calls.pop()![0]
    expect(call1.cid).toBe('0-5')
    expect(call1.command).toBe('endSession')
    const call2: any = vi.mocked(worker1.childProcess?.send)!.mock.calls.pop()![0]
    expect(call2.cid).toBe('0-4')
    expect(call2.command).toBe('endSession')
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner(undefined as never, {
        outputDir: '/foo/bar',
        runnerEnv: { FORCE_COLOR: 1 }
    } as any)

    runner.run({
        cid: '0-8',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: { sessionId: 'abc' },
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0
    })
    runner.workerPool['0-8'].isBusy = false

    await runner.shutdown()

    expect(runner.workerPool['0-8']).toBeFalsy()
})

test('should shut down worker processes in watch mode - regular', async () => {
    const runner = new LocalRunner(undefined as never, {
        outputDir: '/foo/bar',
        runnerEnv: { FORCE_COLOR: 1 },
        watch: true,
    } as any)

    const worker = runner.run({
        cid: '0-6',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: { sessionId: 'abc' },
        caps: {},
        specs: ['/foo/bar2.test.js'],
        execArgv: [],
        retries: 0
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

    const call: any = vi.mocked(worker.childProcess?.send)!.mock.calls.pop()![0]
    expect(call.cid).toBe('0-6')
    expect(call.command).toBe('endSession')
    expect(call.args.watch).toBe(true)
    expect(call.args.isMultiremote).toBeFalsy()
    expect(call.args.config.sessionId).toBe('abc')
    expect(call.args.config.host).toEqual('foo')
})

test('should shut down worker processes in watch mode - mutliremote', async () => {
    const runner = new LocalRunner(undefined as never, {
        outputDir: '/foo/bar',
        runnerEnv: { FORCE_COLOR: 1 },
        watch: true,
    } as any)

    const worker = runner.run({
        cid: '0-7',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        args: {},
        caps: {},
        specs: ['/foo/bar.test.js'],
        execArgv: [],
        retries: 0
    })
    worker['_handleMessage']({ name: 'ready' } as any)
    runner.workerPool['0-7'].isMultiremote = true
    runner.workerPool['0-7'].instances = { foo: { sessionId: '123' } }
    runner.workerPool['0-7'].caps = {
        foo: {
            capabilities: { browser: 'chrome' }
        }
    } as any

    setTimeout(() => {
        worker.isBusy = false
    }, 260)

    const before = Date.now()
    await runner.shutdown()
    const after = Date.now()

    expect(after - before).toBeGreaterThanOrEqual(300)

    const call: any = vi.mocked(worker.childProcess?.send)!.mock.calls.pop()![0]
    expect(call.cid).toBe('0-7')
    expect(call.command).toBe('endSession')
    expect(call.args.watch).toBe(true)
    expect(call.args.isMultiremote).toBe(true)
    expect(call.args.instances).toEqual({ foo: { sessionId: '123' } })
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner(undefined as never, {} as any)
    expect(runner.initialise()).toBe(undefined)
})
