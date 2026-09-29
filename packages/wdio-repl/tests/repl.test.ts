import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReplConfig } from '../src/index.js'
import WDIORepl from '../src/index.js'

const { createContext, replServer, runInContext, start } = vi.hoisted(() => {
    const replServer = { on: vi.fn() }
    return {
        replServer,
        createContext: vi.fn(),
        runInContext: vi.fn<(command: string, context: unknown) => unknown>(() => 'someResult'),
        start: vi.fn((_options?: object) => replServer)
    }
})

vi.mock('vm', () => ({
    default: { createContext, runInContext }
}))

vi.mock('repl', () => ({
    default: { start }
}))

const defaultArgs: ReplConfig = {
    commandTimeout: 5000,
    prompt: '\u203A ',
    useGlobal: true,
    useColor: true,
    eval: () => {}
}

function exitStartedRepl () {
    const exit = replServer.on.mock.calls.find(([name]) => name === 'exit')?.[1] as (() => void) | undefined
    if (!exit) {
        throw new Error('expected the REPL to listen for exit')
    }
    exit()
}

describe('eval', () => {
    beforeEach(() => {
        runInContext.mockReset()
        runInContext.mockReturnValue('someResult')
        createContext.mockClear()
        replServer.on.mockClear()
        start.mockClear()
    })

    afterEach(() => {
        vi.clearAllTimers()
        vi.useRealTimers()
    })

    it('should return predefined responses', () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = vi.fn()

        for (const [command, response] of [
            ['browser', '[WebdriverIO REPL client]'],
            ['driver', '[WebdriverIO REPL client]'],
            ['$', '[Function: findElement]'],
            ['$$', '[Function: findElements]']
        ] as const) {
            repl.eval(command, {}, '/some/filename', callback)
            expect(callback).toHaveBeenCalledWith(null, response)
            callback.mockClear()
        }

        repl.eval(' browser ', {}, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(null, '[WebdriverIO REPL client]')
        expect(runInContext).not.toHaveBeenCalled()
        expect(createContext).not.toHaveBeenCalled()
    })

    it('should execute a command and return its result', () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = vi.fn()
        const context = { marker: 'ctx' }

        repl.eval('1+1', context, '/some/filename', callback)
        expect(createContext).toHaveBeenCalledWith(context)
        expect(runInContext).toHaveBeenCalledWith('1+1', context)
        expect(callback).toHaveBeenCalledWith(null, 'someResult')

        callback.mockClear()
        runInContext.mockReturnValueOnce('next')
        repl.eval('2+2', context, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(null, 'next')
    })

    it('should ignore a second command while one is running', () => {
        vi.useFakeTimers()
        runInContext.mockReturnValueOnce(new Promise(() => {}))
        const repl = new WDIORepl(defaultArgs)
        const second = vi.fn()

        repl.eval('1+1', {}, '/some/filename', vi.fn())
        repl.eval('2+2', {}, '/some/filename', second)

        expect(runInContext).toHaveBeenCalledTimes(1)
        expect(runInContext).toHaveBeenCalledWith('1+1', {})
        expect(second).not.toHaveBeenCalled()
    })

    it('should call back if command execution fails', () => {
        const failure = new Error('boom!')
        runInContext.mockImplementationOnce(() => {
            throw failure
        })
        const repl = new WDIORepl(defaultArgs)
        const callback = vi.fn()

        repl.eval('1+1', {}, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(failure, undefined)

        callback.mockClear()
        runInContext.mockReturnValueOnce('recovered')
        repl.eval('2+2', {}, '/some/filename', callback)
        expect(runInContext).toHaveBeenCalledTimes(2)
        expect(callback).toHaveBeenCalledWith(null, 'recovered')
    })
})

describe('handleResult', () => {
    beforeEach(() => {
        runInContext.mockReset()
        runInContext.mockReturnValue('someResult')
        createContext.mockClear()
    })

    it('should return basic result types directly', () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = vi.fn()

        runInContext.mockReturnValueOnce(null)
        repl.eval('null', {}, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(null, null)

        callback.mockClear()
        runInContext.mockReturnValueOnce(1)
        repl.eval('1', {}, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(null, 1)
    })

    it('should handle resolved promises', async () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = vi.fn()
        runInContext.mockReturnValueOnce(Promise.resolve('some result'))

        repl.eval('async', {}, '/some/filename', callback)
        await vi.waitFor(() => {
            expect(callback).toHaveBeenCalledWith(null, 'some result')
        })

        callback.mockClear()
        runInContext.mockReturnValueOnce('after')
        repl.eval('next', {}, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(null, 'after')
    })

    it('should handle rejected promises', async () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = vi.fn()
        runInContext.mockReturnValueOnce(Promise.reject(new Error('boom')))

        repl.eval('async', {}, '/some/filename', callback)
        await vi.waitFor(() => {
            expect(callback).toHaveBeenCalledWith(new Error('boom'), undefined)
        })
        expect((callback.mock.calls[0][0] as Error).stack).toBeUndefined()

        callback.mockClear()
        runInContext.mockReturnValueOnce('after')
        repl.eval('next', {}, '/some/filename', callback)
        expect(callback).toHaveBeenCalledWith(null, 'after')
    })

    it('should timeout if successful command takes too long', async () => {
        const repl = new WDIORepl({ ...defaultArgs, commandTimeout: 100 })
        const callback = vi.fn()
        runInContext.mockReturnValueOnce(new Promise((resolve) => setTimeout(() => resolve('late'), 200)))

        repl.eval('slow', {}, '/some/filename', callback)
        await new Promise((resolve) => setTimeout(resolve, 300))

        expect(callback).toHaveBeenCalledTimes(1)
        expect(callback).toHaveBeenCalledWith(new Error('Command execution timed out'), undefined)

        const next = vi.fn()
        runInContext.mockReturnValueOnce('next')
        repl.eval('next', {}, '/some/filename', next)
        expect(next).toHaveBeenCalledWith(null, 'next')
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should timeout if failing command takes too long', async () => {
        const repl = new WDIORepl({ ...defaultArgs, commandTimeout: 100 })
        const callback = vi.fn()
        runInContext.mockReturnValueOnce(new Promise((_resolve, reject) => setTimeout(() => reject(new Error('late')), 200)))

        repl.eval('slow', {}, '/some/filename', callback)
        await new Promise((resolve) => setTimeout(resolve, 300))

        expect(callback).toHaveBeenCalledTimes(1)
        expect(callback).toHaveBeenCalledWith(new Error('Command execution timed out'), undefined)

        const next = vi.fn()
        runInContext.mockReturnValueOnce('next')
        repl.eval('next', {}, '/some/filename', next)
        expect(next).toHaveBeenCalledWith(null, 'next')
        expect(callback).toHaveBeenCalledTimes(1)
    })
})

describe('start', () => {
    beforeEach(() => {
        runInContext.mockReset()
        runInContext.mockReturnValue('someResult')
        createContext.mockClear()
        replServer.on.mockClear()
        start.mockClear()
    })

    it('should throw if the repl server was already started', async () => {
        const repl = new WDIORepl(defaultArgs)
        const pending = repl.start()
        expect(() => repl.start()).toThrow('a repl was already initialized')
        exitStartedRepl()
        await pending
    })

    it('should resolve when the repl exits and evaluate in the context passed to start', async () => {
        const session = { browser: 'session' }
        const replContext = { browser: 'repl' }
        const repl = new WDIORepl()
        let settled = false
        const pending = repl.start(session).then(() => {
            settled = true
        })

        await Promise.resolve()
        expect(settled).toBe(false)
        expect(replServer.on).toHaveBeenCalledWith('exit', expect.any(Function))

        const options = start.mock.calls.at(-1)?.[0] as ReplConfig
        const callback = vi.fn()
        options.eval.call({ id: 'server' }, '1+1', replContext, '/some/filename', callback)
        expect(runInContext).toHaveBeenCalledWith('1+1', session)
        expect(callback).toHaveBeenCalledWith(null, 'someResult')

        exitStartedRepl()
        await pending
        expect(settled).toBe(true)
    })

    it('should keep a custom eval bound to the repl server and the context from start', async () => {
        const session = { browser: 'session' }
        const replContext = { browser: 'repl' }
        const server = { id: 'repl-server' }
        let self: unknown
        let seen: unknown
        const config: ReplConfig = {
            ...defaultArgs,
            eval: vi.fn(function (this: unknown, _cmd: string, ctx: unknown) {
                self = this
                seen = ctx
            })
        }
        const repl = new WDIORepl(config)
        const pending = repl.start(session)
        const options = start.mock.calls.at(-1)?.[0] as ReplConfig

        options.eval.call(server, '1+1', replContext, '/some/filename', vi.fn())
        expect(seen).toBe(session)
        expect(self).toBe(server)
        expect(config.eval).toHaveBeenCalledWith(
            '1+1',
            session,
            '/some/filename',
            expect.any(Function)
        )

        exitStartedRepl()
        await pending
    })
})
