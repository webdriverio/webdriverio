import path from 'path'
import mockery from 'mockery'
import * as Cucumber from 'cucumber'
import * as config from '@wdio/config'
const { executeHooksWithArgs, runFnInFiberContext, executeAsync, executeSync } = config

import CucumberAdapterFactory, { CucumberAdapter } from '../src'

global.browser = {
    config: {},
    options: {},
    capabilities: {
        device: '',
        os: 'OS X',
        os_version: 'Sierra',
        browserName: 'chrome'
    }
}

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

const adapterFactory = (cucumberOpts = {}) => new CucumberAdapter(
    '0-2',
    { cucumberOpts },
    ['/foo/bar.feature'],
    { browserName: 'chrome' },
    wdioReporter
)

test('comes with a factory', async () => {
    expect(typeof CucumberAdapterFactory.run).toBe('function')
})

test('should properly set up cucumber', async () => {
    const adapter = adapterFactory({ requireModule: ['@babel/register'] })
    adapter.registerRequiredModules = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(adapter.registerRequiredModules).toBeCalled()
    expect(adapter.loadSpecFiles).toBeCalled()
    expect(adapter.wrapSteps).toBeCalled()
    expect(Cucumber.setDefaultTimeout).toBeCalledWith(60000)
    expect(Cucumber.supportCodeLibraryBuilder.reset).toBeCalled()

    expect(executeHooksWithArgs).toBeCalledTimes(2)
    expect(Cucumber.PickleFilter).toBeCalled()
    expect(Cucumber.getTestCasesFromFilesystem).toBeCalled()
})

test('should properly set up cucumber', async () => {
    const adapter = adapterFactory({ ignoreUndefinedDefinitions: true })
    adapter.registerRequiredModules = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(adapter.registerRequiredModules).toBeCalled()
    expect(adapter.loadSpecFiles).toBeCalled()
    expect(adapter.wrapSteps).toBeCalled()
    expect(Cucumber.setDefaultTimeout).toBeCalledWith(60000)
    expect(Cucumber.supportCodeLibraryBuilder.reset).toBeCalled()

    expect(executeHooksWithArgs).toBeCalledTimes(2)
    expect(Cucumber.PickleFilter).toBeCalled()
    expect(Cucumber.getTestCasesFromFilesystem).toBeCalled()
})

test('should throw when initialization fails', () => {
    const adapter = adapterFactory({ requireModule: ['@babel/register'] })
    adapter.registerRequiredModules = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()

    const runtimeError = new Error('boom')
    Cucumber.Runtime.mockImplementation(() => { throw runtimeError })
    expect(adapter.run()).rejects.toEqual(runtimeError)
})

describe('registerRequiredModules', () => {
    test('should accept path to module', () => {
        const modulePath = path.resolve(__dirname, 'fixtures', 'customModule.js')
        const adapter = adapterFactory({ requireModule: [modulePath] })

        adapter.registerRequiredModules()
        expect(global.MY_VAR).toBe(1)
    })

    test('should accept path to module with args', () => {
        const modulePath = path.resolve(__dirname, 'fixtures', 'customModule.js')
        const adapter = adapterFactory({ requireModule: [[modulePath, { some: 'params' }]] })

        adapter.registerRequiredModules()
        expect(global.MY_PARAMS).toEqual({ some: 'params' })
    })

    test('should accept path function', () => {
        const adapter = adapterFactory({ requireModule: [() => { global.MY_PARAMS = { some: 'fn' } }] })

        adapter.registerRequiredModules()
        expect(global.MY_PARAMS).toEqual({ some: 'fn' })
    })
})

test('requiredFiles', () => {
    const adapter = adapterFactory({ require: ['/foo/bar.js', '/does/not/exist/*.js'] })
    expect(adapter.requiredFiles()).toEqual(['/foo/bar.js'])
})

test('loadSpecFiles', () => {
    const adapter = adapterFactory({ require: ['/foo/bar.js', '/does/not/exist/*.js'] })
    adapter.requiredFiles = jest.fn().mockReturnValue([
        path.join(__dirname, 'fixtures', 'stepDefinitionStub.js'),
        'packages/wdio-cucumber-framework/tests/fixtures/stepDefinitionStub.js'
    ])
    adapter.loadSpecFiles()
    expect(mockery.enable).toBeCalledTimes(1)
    expect(mockery.registerMock).toBeCalledTimes(1)
    expect(mockery.disable).toBeCalledTimes(1)
})

describe('wrapSteps', () => {
    const adapter = adapterFactory()
    adapter.wrapStep = jest.fn()
    adapter.wrapSteps(adapter.config)

    const functionWrapper = Cucumber.setDefinitionFunctionWrapper.mock.calls[0].pop()

    test('should use proper default values', () => {
        const wrappedFunction = jest.fn()

        functionWrapper(wrappedFunction)
        expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 0, true, adapter.config, '0-2')
    })

    test('should use passed arguments', () => {
        const wrappedFunction = jest.fn()

        functionWrapper(wrappedFunction, { retry: 123 })
        expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 123, true, adapter.config, '0-2')
    })

    test('should not wrap wdio hooks', () => {
        const wdioHookFn = () => { }

        expect(functionWrapper(wdioHookFn)).toBe(wdioHookFn)
        expect(adapter.wrapStep).toBeCalledTimes(0)
    })

    test('should not detect user hooks as steps', () => {
        const userHookFn = () => { }

        functionWrapper(userHookFn)
        expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 0, false, adapter.config, '0-2')
    })

    afterEach(() => {
        adapter.wrapStep.mockClear()
    })
})

describe('wrapStep', () => {
    test('should use sync if hasWdioSyncSupport is true', () => {
        config.hasWdioSyncSupport = true
        const adapter = adapterFactory()

        const fn = adapter.wrapStep('some code', 123, true, adapter.config)
        expect(typeof fn).toBe('function')

        fn(1, 2, 3)
        expect(executeSync).toBeCalledWith(expect.any(Function), 123, [1, 2, 3])
    })

    test('should set proper default arguments', () => {
        config.hasWdioSyncSupport = true
        const adapter = adapterFactory()

        const fn = adapter.wrapStep('fn', undefined, undefined, {})
        expect(typeof fn).toBe('function')

        fn(1, 2, 3)
        expect(executeSync).toBeCalledWith(expect.any(Function), 0, [1, 2, 3])
    })

    test('should use async if function name is sync', () => {
        config.hasWdioSyncSupport = true
        const adapter = adapterFactory()

        const code = function async () { }
        const fn = adapter.wrapStep(code, 123, undefined, {})
        expect(typeof fn).toBe('function')

        fn(1, 2, 3)
        expect(executeAsync).toBeCalledWith(expect.any(Function), 123, [1, 2, 3])
    })

    test('should use async hasWdioSyncSupport is false and set proper default arguments', () => {
        config.hasWdioSyncSupport = false
        const adapter = adapterFactory()

        const fn = adapter.wrapStep('fn', undefined, undefined, {})
        expect(typeof fn).toBe('function')

        fn(1, 2, 3)
        expect(executeAsync).toBeCalledWith(expect.any(Function), 0, [1, 2, 3])
    })
})

describe('addHooks', () => {
    global.result = [{ uri: 'uri' }, 'feature', 'scenario1', 'scenario2']
    Cucumber.Before.mockImplementationOnce(fn => fn)
    Cucumber.After.mockImplementationOnce(fn => fn)
    Cucumber.BeforeAll.mockImplementationOnce(fn => fn)
    Cucumber.AfterAll.mockImplementationOnce(fn => fn)
    const adapter = adapterFactory()
    const adapterConfig = {
        beforeScenario: jest.fn(),
        afterScenario: jest.fn(),
        beforeFeature: jest.fn(),
        afterFeature: jest.fn(),
    }
    adapter.addWdioHooks(adapterConfig)
    const beforeScenario = Cucumber.Before.mock.calls[0][0]
    const afterScenario = Cucumber.After.mock.calls[0][0]
    const beforeFeature = Cucumber.BeforeAll.mock.calls[0][0]
    const afterFeature = Cucumber.AfterAll.mock.calls[0][0]

    test('beforeScenario', () => {
        beforeScenario({ pickle: 'pickle', sourceLocation: 'sourceLocation' })
        expect(executeHooksWithArgs).toBeCalledWith(adapterConfig.beforeScenario, ['uri', 'feature', 'pickle', 'sourceLocation'])
    })
    test('afterScenario', () => {
        afterScenario({ pickle: 'pickle', sourceLocation: 'sourceLocation', result: 'result' })
        expect(executeHooksWithArgs).toBeCalledWith(adapterConfig.afterScenario, ['uri', 'feature', 'pickle', 'result', 'sourceLocation'])
    })
    test('beforeFeature', () => {
        beforeFeature()
        expect(executeHooksWithArgs).toBeCalledWith(adapterConfig.beforeFeature, ['uri', 'feature', ['scenario1', 'scenario2']])
    })
    test('afterFeature', () => {
        afterFeature()
        expect(executeHooksWithArgs).toBeCalledWith(adapterConfig.afterFeature, ['uri', 'feature', ['scenario1', 'scenario2']])
    })
})

afterEach(() => {
    Cucumber.setDefinitionFunctionWrapper.mockClear()
    Cucumber.supportCodeLibraryBuilder.reset.mockReset()
    Cucumber.setDefaultTimeout.mockReset()
    executeHooksWithArgs.mockClear()
    runFnInFiberContext.mockClear()
    mockery.enable.mockClear()
    mockery.registerMock.mockClear()
    mockery.disable.mockClear()
})
