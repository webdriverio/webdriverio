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
        runnerEnv: { FORCE_COLOR: false }
    })
    const childProcess = runner.run({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        argv: {},
        caps: {},
        processNumber: 123,
        specs: ['/foo/bar.test.js'],
        isMultiremote: false
    })
    runner.emit = jest.fn()

    expect(child.fork.mock.calls[0][0].endsWith('/run.js')).toBe(true)

    const { env } = child.fork.mock.calls[0][2]
    expect(env.WDIO_LOG_PATH).toBe('/foo/bar/wdio-0-5.log')
    expect(env.FORCE_COLOR).toBe('true')
    expect(childProcess.on).toBeCalled()

    expect(childProcess.send).toBeCalledWith({
        cid: '0-5',
        command: 'run',
        configFile: '/path/to/wdio.conf.js',
        argv: {},
        caps: {},
        processNumber: 123,
        specs: [ '/foo/bar.test.js' ],
        server: undefined,
        isMultiremote: false
    })

    const messageCb = childProcess.on.mock.calls[0][1]
    messageCb({ foo: 'bar' })
    expect(runner.emit).toBeCalledWith('message', { foo: 'bar', cid: '0-5' })

    const exitCb = childProcess.on.mock.calls[1][1]
    exitCb(23)
    expect(runner.emit).toBeCalledWith('end', { cid: '0-5', exitCode: 23 })
})
