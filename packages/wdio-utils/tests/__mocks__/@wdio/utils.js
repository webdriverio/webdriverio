import {
    isFunctionAsync as isFnAsync,
    getArgumentType as getArgumentTypeOrig,
    isValidParameter as isValidParameterOrig,
    commandCallStructure as commandCallStructureOrig
} from '../../../src/utils'
import webdriverMonadOrig from '../../../src/monad'
import {
    sessionEnvironmentDetector as sessionEnvDetector,
    capabilitiesEnvironmentDetector as capabilitiesEnvDetector,
    devtoolsEnvironmentDetector as devtoolsEnvDetector
} from '../../../src/envDetector'

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
            init () { return this },
            hasTests () { return true },
            run() { return 0 }
        },
        testWithFailures: {
            init () { return this },
            hasTests () { return true },
            run() { return 123 }
        },
        testThrows: {
            init () { return this },
            hasTests () { return true },
            run() { throw new Error('framework testThrows failed') }
        },
        testNoTests: {
            init () { return this },
            hasTests () { return false }
        },
    }
}

export const initialisePlugin = jest.fn().mockImplementation(
    (name, type) => pluginMocks[type][name])
export const initialiseServices = jest.fn().mockReturnValue([])
export const isValidParameter = isValidParameterOrig
export const commandCallStructure = commandCallStructureOrig
export const isFunctionAsync = isFnAsync
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
export const setWdioSyncSupport = value => { hasWdioSyncSupport = value }
export let hasWdioSyncSupport = false
export const testFnWrapper = jest.fn()
export const sessionEnvironmentDetector = sessionEnvDetector
export const capabilitiesEnvironmentDetector = capabilitiesEnvDetector
export const devtoolsEnvironmentDetector = devtoolsEnvDetector
