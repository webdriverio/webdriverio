import WDIORunnerRepl from '../src/repl'

test('should parse error object', () => {
    const childProcess = { send: jest.fn() }
    const repl = new WDIORunnerRepl(childProcess, {})
    const err = repl._getError({
        error: true,
        message: 'foobar',
        stack: 'fooo:1:1\nbar:2:1'
    })
    expect(err).toBeInstanceOf(Error)
    expect(repl._getError({ foo: 'bar' })).toBe(null)
})

test('should send child process message that debugger has started', () => {
    const childProcess = { send: jest.fn() }
    const repl = new WDIORunnerRepl(childProcess, {})
    repl.start({})
    expect(childProcess.send)
        .toBeCalledWith({ origin: 'debugger', name: 'start' })
})

test('should send command to child process', () => {
    const childProcess = { send: jest.fn() }
    const callback = jest.fn()
    const repl = new WDIORunnerRepl(childProcess, {})

    expect(repl.commandIsRunning).toBe(false)
    expect(repl.callback).toBe(undefined)
    repl.eval('1+1', null, null, callback)
    expect(repl.commandIsRunning).toBe(true)
    expect(childProcess.send).toBeCalledWith({
        origin: 'debugger',
        name: 'eval',
        content: { cmd: '1+1' }
    })
    expect(typeof repl.callback).toBe('function')

    repl.callback()
    expect(callback).toBeCalled()
})

test('should not send command if command is already running', () => {
    const childProcess = { send: jest.fn() }
    const callback = jest.fn()
    const repl = new WDIORunnerRepl(childProcess, {})
    repl.commandIsRunning = true

    repl.eval('1+1', null, null, callback)
    expect(childProcess.send).toBeCalledTimes(0)
})

test('should pass in result to callback', () => {
    const repl = new WDIORunnerRepl()
    repl.callback = jest.fn()
    repl.commandIsRunning = true

    repl.onResult({ result: 'foobar' })
    expect(repl.callback).toBeCalledWith(null, 'foobar')
})
