import {
    getArgumentType as getArgumentTypeOrig,
    isValidParameter as isValidParameterOrig,
    commandCallStructure as commandCallStructureOrig
} from '../../../src/utils'
import webdriverMonadOrig from '../../../src/monad'
class DotReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
    }
}

class RunnerMock {}
class FoobarServiceMock {
    beforeSuite () {}
    afterCommand () {}
}

const pluginMocks = {
    reporter: {
        dot: DotReporter
    },
    service: {
        foobar: FoobarServiceMock
    },
    runner: {
        local: RunnerMock
    },
    framework: {
        testNoFailures: {
            run() { return 0 }
        },
        testWithFailures: {
            run() { return 123 }
        },
        testThrows: {
            run() { throw new Error('framework testThrows failed') }
        }
    }
}

export const initialisePlugin = jest.fn().mockImplementation(
    (name, type) => pluginMocks[type][name])
export const initialiseServices = jest.fn().mockReturnValue([])
export const isValidParameter = isValidParameterOrig
export const commandCallStructure = commandCallStructureOrig
export const safeRequire = jest.fn().mockReturnValue(() => {})
export const webdriverMonad = webdriverMonadOrig
export const getArgumentType = getArgumentTypeOrig

/**
 * shim
 */
export const executeSync = jest.fn()
export const executeAsync = jest.fn()
export const wrapCommand = (_, origFn) => origFn
export const runTestInFiberContext = jest.fn().mockReturnValue(jest.fn())
export const executeHooksWithArgs = jest.fn()
export const runFnInFiberContext = jest.fn().mockImplementation((fn) => {
    return function (...args) {
        return Promise.resolve(fn.apply(this, args))
    }
})
export let hasWdioSyncSupport = false
export const testFnWrapper = jest.fn()
