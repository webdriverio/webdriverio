import vm from 'vm'
import replMock from 'repl'
import expect from 'expect'

import WDIORepl, { ReplConfig } from '../src/index'

jest.mock('vm', () => {
    class VMMock {
        createContext: () => any
        runInContext: () => any
        runInContextFail: boolean = false

        constructor () {
            this.createContext = jest.fn(),
            this.runInContext = jest.fn().mockImplementation(() => {
                if (this.runInContextFail) {
                    throw new Error('boom!')
                }

                return 'someResult'
            })
        }
    }

    return new VMMock()
})

jest.mock('repl', () => {
    const replInstance = {
        on: jest.fn().mockImplementation(
            (name, callback) => setTimeout(
                () => callback(name),
                100
            )
        )
    }

    return { start: jest.fn().mockReturnValue(replInstance) }
})

const defaultArgs: ReplConfig = {
    commandTimeout: 5000,
    prompt: '\u203A ',
    useGlobal: true,
    useColor: true,
    eval: () => {}
}

describe('eval', () => {
    it('should return predefined responses', () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = jest.fn()
        repl['_runCmd'] = jest.fn()

        repl.eval('browser', {}, '/some/filname.js', callback)
        expect(callback).toBeCalledWith(null, '[WebdriverIO REPL client]')
        callback.mockClear()

        repl.eval('driver', {}, '/some/filname.js', callback)
        expect(callback).toBeCalledWith(null, '[WebdriverIO REPL client]')
        callback.mockClear()

        repl.eval('$', {}, '/some/filname.js', callback)
        expect(callback).toBeCalledWith(null, '[Function: findElement]')
        callback.mockClear()

        repl.eval('$$', {}, '/some/filname.js', callback)
        expect(callback).toBeCalledWith(null, '[Function: findElements]')
        callback.mockClear()

        expect(repl['_runCmd']).toBeCalledTimes(0)
    })

    it('should call _runCmd', () => {
        const repl = new WDIORepl(defaultArgs)
        repl['_runCmd'] = jest.fn()
        repl.eval('1+1', {}, '/some/filename', jest.fn())
        expect(repl['_runCmd'])
            .toBeCalledWith('1+1', expect.any(Object), expect.any(Function))
        expect(repl['_isCommandRunning']).toBe(true)
    })

    it('should not be able to call a command twice', () => {
        const repl = new WDIORepl(defaultArgs)
        repl['_runCmd'] = jest.fn()
        repl.eval('1+1', {}, '/some/filename', jest.fn())
        repl.eval('2+2', {}, '/some/filename', jest.fn())
        expect(repl['_runCmd']).toBeCalledTimes(1)
    })
})

describe('runCmd', () => {
    it('should call result handler', () => {
        const repl = new WDIORepl(defaultArgs)
        repl['_handleResult'] = jest.fn()
        repl['_runCmd']('1+1', {}, jest.fn())
        expect(vm.runInContext).toBeCalledWith('1+1', {})
        expect(repl['_handleResult'])
            .toBeCalledWith('someResult', expect.any(Function))
    })

    it('should call back if failed', () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = jest.fn()

        // @ts-ignore
        vm.runInContextFail = true
        repl['_runCmd']('1+1', {}, callback)
        expect(callback).toBeCalled()
        expect(repl['_isCommandRunning']).toBe(false)
    })
})

describe('handleResult', () => {
    it('should return basic result types directly', () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = jest.fn()
        repl['_isCommandRunning'] = true

        repl['_handleResult'](null, callback)
        expect(callback).toBeCalledWith(null, null)
        expect(repl['_isCommandRunning']).toBe(false)
        callback.mockClear()

        repl['_handleResult'](1, callback)
        expect(callback).toBeCalledWith(null, 1)
    })

    it('should handle resolved promises', async () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = jest.fn()
        const result = Promise.resolve('some result')
        repl['_isCommandRunning'] = true

        repl['_handleResult'](result, callback)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(callback).toBeCalledWith(null, 'some result')
        expect(repl['_isCommandRunning']).toBe(false)
    })

    it('should handle rejected promises', async () => {
        const repl = new WDIORepl(defaultArgs)
        const callback = jest.fn()
        const result = Promise.reject(new Error('boom'))
        repl['_isCommandRunning'] = true

        repl['_handleResult'](result, callback)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(callback).toBeCalledWith(new Error('boom'), undefined)
        expect(repl['_isCommandRunning']).toBe(false)
    })

    it('should timeout if successful command takes too long', async () => {
        const repl = new WDIORepl({ ...defaultArgs, commandTimeout: 100 })
        const callback = jest.fn()
        const result = new Promise((resolve) => setTimeout(resolve, 200))
        repl['_isCommandRunning'] = true

        repl['_handleResult'](result, callback)
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(callback).toBeCalledTimes(1)
        expect(callback).toBeCalledWith(new Error('Command execution timed out'), undefined)
        expect(repl['_isCommandRunning']).toBe(false)
    })

    it('should timeout if failing command takes too long', async () => {
        const repl = new WDIORepl({ ...defaultArgs, commandTimeout: 100 })
        const callback = jest.fn()
        const result = new Promise((resolve, reject) => setTimeout(reject, 200))
        repl['_isCommandRunning'] = true

        repl['_handleResult'](result, callback)
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(callback).toBeCalledTimes(1)
        expect(callback).toBeCalledWith(new Error('Command execution timed out'), undefined)
        expect(repl['_isCommandRunning']).toBe(false)
    })
})

describe('start', () => {
    it('should throw repl server was already started', () => {
        const repl = new WDIORepl(defaultArgs)
        // @ts-ignore
        repl._replServer = true
        expect(() => repl.start({})).toThrow()
    })

    it('should start and stop repl', async () => {
        const repl = new WDIORepl(defaultArgs)
        await repl.start({})
        expect(replMock.start).toBeCalled()

        // @ts-ignore
        expect(repl._replServer.on).toBeCalled()
    })

    it('should allow run eval with own context', async () => {
        const config = { ...defaultArgs, eval: jest.fn() }
        const repl = new WDIORepl(config)
        await repl.start({})

        // @ts-ignore
        repl._config.eval('1+1', {}, '/some/filename', jest.fn())
        expect(config.eval).toBeCalledWith(
            '1+1',
            expect.any(Object),
            '/some/filename',
            expect.any(Function)
        )
    })
})
