import type { ChildProcess } from 'child_process'

import WDIORunnerRepl from '../src/repl'

const replConfig = {
    commandTimeout: 0,
    eval: () => {},
    prompt: 'foobar',
    useGlobal: true,
    useColor: true
}

test('should parse error object', () => {
    const childProcess = { send: jest.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    const err = repl['_getError']({
        error: true,
        message: 'foobar',
        stack: 'fooo:1:1\nbar:2:1'
    })
    expect(err).toBeInstanceOf(Error)
    expect(repl['_getError']({ foo: 'bar' })).toBe(null)
})

test('should send child process message that debugger has started', () => {
    const childProcess = { send: jest.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.start({})
    expect(childProcess.send)
        .toBeCalledWith({ origin: 'debugger', name: 'start' })
})

test('should send command to child process', () => {
    const childProcess = { send: jest.fn() }
    const callback = jest.fn()
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)

    expect(repl.commandIsRunning).toBe(false)
    expect(repl.callback).toBe(undefined)
    repl.eval('1+1', {}, '/foo/bar', callback)
    expect(repl.commandIsRunning).toBe(true)
    expect(childProcess.send).toBeCalledWith({
        origin: 'debugger',
        name: 'eval',
        content: { cmd: '1+1' }
    })
    expect(typeof repl.callback).toBe('function')

    repl.callback!(null, {})
    expect(callback).toBeCalled()
})

test('should not send command if command is already running', () => {
    const childProcess = { send: jest.fn() }
    const callback = jest.fn()
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.commandIsRunning = true

    repl.eval('1+1', {}, '/foo/bar', callback)
    expect(childProcess.send).toBeCalledTimes(0)
})

test('should pass in result to callback', () => {
    const childProcess = { send: jest.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.callback = jest.fn()
    repl.commandIsRunning = true

    repl.onResult({ result: 'foobar' })
    expect(repl.callback).toBeCalledWith(null, 'foobar')
})

test('should switch flag even if no callback is set', () => {
    const childProcess = { send: jest.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.commandIsRunning = true

    repl.onResult({ result: 'foobar' })
    expect(repl.commandIsRunning).toBe(false)
})
