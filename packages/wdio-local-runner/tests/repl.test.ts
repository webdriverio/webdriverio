import type { ChildProcess } from 'node:child_process'
import { expect, test, vi } from 'vitest'

import WDIORunnerRepl from '../src/repl.js'

const replConfig = {
    commandTimeout: 0,
    eval: () => {},
    prompt: 'foobar',
    useGlobal: true,
    useColor: true
}

test('should pass parsed errors to the result callback', () => {
    const childProcess = { send: vi.fn() }
    const callback = vi.fn()
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.callback = callback

    repl.onResult({
        error: 'true',
        message: 'foobar',
        stack: 'fooo:1:1\nbar:2:1',
        result: 'ignored'
    })

    const err = callback.mock.calls[0][0] as Error
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('foobar')
    expect(err.stack).toBe('fooo:1:1\nbar:2:1')
    expect(callback.mock.calls[0][1]).toBe('ignored')
})

test('should send child process message that debugger has started', () => {
    const childProcess = { send: vi.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.start({})
    expect(childProcess.send)
        .toHaveBeenCalledWith({ origin: 'debugger', name: 'start' })
})

test('should send command to child process', () => {
    const childProcess = { send: vi.fn() }
    const callback = vi.fn()
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)

    expect(repl.commandIsRunning).toBe(false)
    expect(repl.callback).toBe(undefined)
    repl.eval('1+1', {}, '/foo/bar', callback)
    expect(repl.commandIsRunning).toBe(true)
    expect(childProcess.send).toHaveBeenCalledWith({
        origin: 'debugger',
        name: 'eval',
        content: { cmd: '1+1' }
    })
    expect(typeof repl.callback).toBe('function')

    repl.callback!(null, {})
    expect(callback).toHaveBeenCalled()
})

test('should not send command if command is already running', () => {
    const childProcess = { send: vi.fn() }
    const callback = vi.fn()
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.commandIsRunning = true

    repl.eval('1+1', {}, '/foo/bar', callback)
    expect(childProcess.send).toHaveBeenCalledTimes(0)
})

test('should pass in result to callback', () => {
    const childProcess = { send: vi.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.callback = vi.fn()
    repl.commandIsRunning = true

    repl.onResult({ result: 'foobar' })
    expect(repl.callback).toHaveBeenCalledWith(null, 'foobar')
})

test('should switch flag even if no callback is set', () => {
    const childProcess = { send: vi.fn() }
    const repl = new WDIORunnerRepl(childProcess as unknown as ChildProcess, replConfig)
    repl.commandIsRunning = true

    repl.onResult({ result: 'foobar' })
    expect(repl.commandIsRunning).toBe(false)
})
