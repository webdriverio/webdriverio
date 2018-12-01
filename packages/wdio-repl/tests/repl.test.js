import vm from 'vm'
import replMock from 'repl'

import WDIORepl from '../src/index'

jest.mock('vm', () => {
    class VMMock {
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

describe('eval', () => {
    it('should return predefined responses', () => {
        const repl = new WDIORepl({})
        const callback = jest.fn()
        repl._runCmd = jest.fn()

        repl.eval('browser', null, null, callback)
        expect(callback).toBeCalledWith(null, '[WebdriverIO REPL client]')
        callback.mockClear()

        repl.eval('driver', null, null, callback)
        expect(callback).toBeCalledWith(null, '[WebdriverIO REPL client]')
        callback.mockClear()

        repl.eval('$', null, null, callback)
        expect(callback).toBeCalledWith(null, '[Function: findElement]')
        callback.mockClear()

        repl.eval('$$', null, null, callback)
        expect(callback).toBeCalledWith(null, '[Function: findElements]')
        callback.mockClear()

        expect(repl._runCmd).toBeCalledTimes(0)
    })

    it('should call _runCmd', () => {
        const repl = new WDIORepl({})
        repl._runCmd = jest.fn()
        repl.eval('1+1', 'someContext', null, 'someCallback')
        expect(repl._runCmd).toBeCalledWith('1+1', 'someContext', 'someCallback')
        expect(repl.isCommandRunning).toBe(true)
    })

    it('should not be able to call a command twice', () => {
        const repl = new WDIORepl({})
        repl._runCmd = jest.fn()
        repl.eval('1+1', 'someContext', null, 'someCallback')
        repl.eval('2+2', 'someOtherContext', null, 'someOtherCallback')
        expect(repl._runCmd).toBeCalledTimes(1)
    })
})

describe('runCmd', () => {
    it('should call result handler', () => {
        const repl = new WDIORepl({})
        repl._handleResult = jest.fn()
        repl._runCmd('1+1', 'someContext', 'someCallback')
        expect(vm.runInContext).toBeCalledWith('1+1', 'someContext')
        expect(repl._handleResult).toBeCalledWith('someResult', 'someCallback')
    })

    it('should call back if failed', () => {
        const repl = new WDIORepl({})
        const callback = jest.fn()

        repl.isCommandRunning
        vm.runInContextFail = true
        repl._runCmd('1+1', 'someContext', callback)
        expect(callback).toBeCalled()
        expect(repl.isCommandRunning).toBe(false)
    })
})

describe('handleResult', () => {
    it('should return basic result types directly', () => {
        const repl = new WDIORepl({})
        const callback = jest.fn()
        repl.isCommandRunning = true

        repl._handleResult(null, callback)
        expect(callback).toBeCalledWith(null, null)
        expect(repl.isCommandRunning).toBe(false)
        callback.mockClear()

        repl._handleResult(1, callback)
        expect(callback).toBeCalledWith(null, 1)
    })

    it('should handle resolved promises', async () => {
        const repl = new WDIORepl({})
        const callback = jest.fn()
        const result = Promise.resolve('some result')
        repl.isCommandRunning = true

        repl._handleResult(result, callback)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(callback).toBeCalledWith(null, 'some result')
        expect(repl.isCommandRunning).toBe(false)
    })

    it('should handle rejected promises', async () => {
        const repl = new WDIORepl({})
        const callback = jest.fn()
        const result = Promise.reject(new Error('boom'))
        repl.isCommandRunning = true

        repl._handleResult(result, callback)
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(callback).toBeCalledWith(new Error('boom'))
        expect(repl.isCommandRunning).toBe(false)
    })

    it('should timeout if successful command takes too long', async () => {
        const repl = new WDIORepl({ commandTimeout: 100 })
        const callback = jest.fn()
        const result = new Promise((resolve) => setTimeout(resolve, 200))
        repl.isCommandRunning = true

        repl._handleResult(result, callback)
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(callback).toBeCalledTimes(1)
        expect(callback).toBeCalledWith(new Error('Command execution timed out'))
        expect(repl.isCommandRunning).toBe(false)
    })

    it('should timeout if failing command takes too long', async () => {
        const repl = new WDIORepl({ commandTimeout: 100 })
        const callback = jest.fn()
        const result = new Promise((resolve, reject) => setTimeout(reject, 200))
        repl.isCommandRunning = true

        repl._handleResult(result, callback)
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(callback).toBeCalledTimes(1)
        expect(callback).toBeCalledWith(new Error('Command execution timed out'))
        expect(repl.isCommandRunning).toBe(false)
    })
})

describe('start', () => {
    it('should throw repl server was already started', () => {
        const repl = new WDIORepl({})
        repl.replServer = true
        expect(() => repl.start('context')).toThrow()
    })

    it('should start and stop repl', async () => {
        const repl = new WDIORepl({})
        await repl.start()
        expect(replMock.start).toBeCalled()
        expect(repl.replServer.on).toBeCalled()
    })

    it('should allow run eval with own context', async () => {
        const context = 'mySuperContext'
        const config = { eval: jest.fn() }
        const repl = new WDIORepl(config)
        await repl.start(context)

        repl.config.eval('1+1', 'myContext')
        expect(config.eval).toBeCalledWith('1+1', 'mySuperContext', undefined, undefined)
    })
})
