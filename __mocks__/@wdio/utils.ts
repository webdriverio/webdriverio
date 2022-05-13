import {
    isFunctionAsync as isFnAsync,
    getArgumentType as getArgumentTypeOrig,
    isValidParameter as isValidParameterOrig,
    commandCallStructure as commandCallStructureOrig
} from '../../../src/utils'
import webdriverMonadOrig from '../../../src/monad'
import {
    isW3C as isW3cOrig,
    sessionEnvironmentDetector as sessionEnvDetector,
    capabilitiesEnvironmentDetector as capabilitiesEnvDetector,
    devtoolsEnvironmentDetector as devtoolsEnvDetector
} from '../../../src/envDetector'

class DotReporter {
    options: any
    emit: any
    constructor (options: any) {
        this.options = options
        this.emit = jest.fn()
    }
}

class RunnerMock {}
class FoobarServiceMock {
    beforeSuite () {}
    afterCommand () {}
}

const frameworkMocks = {
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
    }
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
    framework: frameworkMocks
}

export const initialisePlugin = jest.fn().mockImplementation(
    (name: keyof typeof frameworkMocks, type: keyof typeof pluginMocks) => (
        { default: (pluginMocks[type] as any)[name] }
    )
)
export const initialiseWorkerService = jest.fn().mockReturnValue([])
export const initialiseLauncherService = jest.fn().mockReturnValue({
    launcherServices: [],
    ignoredWorkerServices: []
})
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
export const wrapCommand = (_: any, origFn: any) => origFn
export const runTestInFiberContext = jest.fn().mockReturnValue(jest.fn())
export const executeHooksWithArgs = jest.fn()
export const runFnInFiberContext = jest.fn().mockImplementation((fn) => {
    return function (this: unknown, ...args: any[]) {
        return Promise.resolve(fn.apply(this, args))
    }
})
export const setWdioSyncSupport = (value: boolean) => { hasWdioSyncSupport = value }
export let hasWdioSyncSupport = false
export const testFnWrapper = jest.fn()
export const isW3C = isW3cOrig
export const sessionEnvironmentDetector = jest.fn().mockImplementation(
    // @ts-ignore
    (...args) => sessionEnvDetector(...args))
export const capabilitiesEnvironmentDetector = capabilitiesEnvDetector
export const devtoolsEnvironmentDetector = devtoolsEnvDetector
export const transformCommandLogResult = jest.fn().mockImplementation((data) => data)
export const canAccess = jest.fn()
export const sleep = jest.fn().mockImplementation(jest.requireActual('../../../src/utils').sleep)
export const UNICODE_CHARACTERS = jest.requireActual('../../../src/constants').UNICODE_CHARACTERS
