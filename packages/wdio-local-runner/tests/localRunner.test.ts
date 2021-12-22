import child from 'child_process'

import LocalRunner from '../src'

jest.mock('child_process', () => {
    const childProcessMock = {
        on: jest.fn(),
        send: jest.fn(),
        kill: jest.fn()
    }

    return { fork: jest.fn().mockReturnValue(childProcessMock) }
})

test('should fork a new process', () => {
    const runner = new LocalRunner('/path/to/wdio.conf.js', {
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
    const childProcess = worker.childProcess
    worker.emit = jest.fn()

    expect(worker.isBusy).toBe(true)
    expect((child.fork as jest.Mock).mock.calls[0][0].endsWith('run.js')).toBe(true)

    const { env } = (child.fork as jest.Mock).mock.calls[0][2]
    expect(env.WDIO_LOG_PATH).toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-5\.log/)
    expect(env.FORCE_COLOR).toBe(1)
    expect(childProcess?.on).toHaveBeenCalled()

    expect(childProcess?.send).toHaveBeenCalledWith({
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
    const runner = new LocalRunner('/path/to/wdio.conf.js', {
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
    const call1 = (worker1.childProcess?.send as jest.Mock).mock.calls.pop()[0]
    expect(call1.cid).toBe('0-5')
    expect(call1.command).toBe('endSession')
    const call2 = (worker1.childProcess?.send as jest.Mock).mock.calls.pop()[0]
    expect(call2.cid).toBe('0-4')
    expect(call2.command).toBe('endSession')
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner('/path/to/wdio.conf.js', {
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
    const runner = new LocalRunner('/path/to/wdio.conf.js', {
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

    const call2 = (worker.childProcess?.send as jest.Mock).mock.calls.pop()[0]
    expect(call2.cid).toBe('0-6')
    expect(call2.command).toBe('endSession')
    expect(call2.args.watch).toBe(true)
    expect(call2.args.isMultiremote).toBeFalsy()
    expect(call2.args.config.sessionId).toBe('abc')
    expect(call2.args.config.host).toEqual('foo')
    expect(call2.args.caps).toEqual({ browser: 'chrome' })
})

test('should shut down worker processes in watch mode - mutliremote', async () => {
    const runner = new LocalRunner('/path/to/wdio.conf.js', {
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

    const call1 = (worker.childProcess?.send as jest.Mock).mock.calls.pop()[0]
    expect(call1.cid).toBe('0-7')
    expect(call1.command).toBe('endSession')
    expect(call1.args.watch).toBe(true)
    expect(call1.args.isMultiremote).toBe(true)
    expect(call1.args.instances).toEqual({ foo: { sessionId: '123' } })
    expect(call1.args.caps).toEqual({ foo: { capabilities: { browser: 'chrome' } } })
})

test('should avoid shutting down if worker is not busy', async () => {
    const runner = new LocalRunner('/path/to/wdio.conf.js', {} as any)
    expect(runner.initialise()).toBe(undefined)
})
