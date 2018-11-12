import child from 'child_process'

import LocalRunner from '../src'

jest.mock('child_process', () => {
    const childProcessMock = {
        on: jest.fn(),
        send: jest.fn(),
        stdout: { pipe: jest.fn().mockReturnValue({ pipe: jest.fn() }) },
        stderr: { pipe: jest.fn().mockReturnValue({ pipe: jest.fn() }) }
    }

    return { fork: jest.fn().mockReturnValue(childProcessMock) }
})

test('should fork a new process', () => {
    const runner = new LocalRunner('/path/to/wdio.conf.js', {
        logDir: '/foo/bar',
        runnerEnv: { FORCE_COLOR: 1 }
    })
    const worker = runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        argv: {},
        caps: {},
        processNumber: 123,
        specs: ['/foo/bar.test.js']
    })
    const childProcess = worker.childProcess
    worker.emit = jest.fn()

    expect(child.fork.mock.calls[0][0].endsWith('/run.js')).toBe(true)

    const { env } = child.fork.mock.calls[0][2]
    expect(env.WDIO_LOG_PATH).toBe('/foo/bar/wdio-0-5.log')
    expect(env.FORCE_COLOR).toBe('1')
    expect(childProcess.on).toBeCalled()

    expect(childProcess.send).toBeCalledWith({
        argv: {},
        caps: {},
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        server: undefined,
        specs: [ '/foo/bar.test.js' ]
    })

    const messageCb = childProcess.on.mock.calls[0][1]
    messageCb({ foo: 'bar' })
    expect(worker.emit).toBeCalledWith('message', { foo: 'bar', cid: '0-5' })

    const errorCb = childProcess.on.mock.calls[1][1]
    errorCb({ foo: 'bar' })
    expect(worker.emit).toBeCalledWith('error', { foo: 'bar', cid: '0-5' })

    const exitCb = childProcess.on.mock.calls[2][1]
    exitCb(23)
    expect(worker.emit).toBeCalledWith('exit', { cid: '0-5', exitCode: 23 })
})
