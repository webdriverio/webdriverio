import path from 'path'
import mockery from 'mockery'
import * as Cucumber from 'cucumber'
import * as utils from '@wdio/utils'
const { executeHooksWithArgs, testFnWrapper } = utils

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

const adapterFactory = (cucumberOpts = {}, featureFlags = {}) => new CucumberAdapter(
    '0-2',
    {
        cucumberOpts,
        featureFlags,
        beforeStep: 'beforeStep',
        afterStep: 'afterStep',
        beforeHook: 'beforeHook',
        afterHook: 'afterHook'
    },
    ['/foo/bar.feature'],
    { browserName: 'chrome' },
    wdioReporter
)

test('comes with a factory', async () => {
    expect(typeof CucumberAdapterFactory.init).toBe('function')
})

test('should properly set up cucumber', async () => {
    const adapter = adapterFactory({ requireModule: ['@babel/register'] })
    adapter.registerRequiredModules = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()
    await adapter.init()
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
    await adapter.init()
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
    Cucumber.Runtime.mockImplementationOnce(() => { throw runtimeError })
    expect(adapter.init()).rejects.toEqual(runtimeError)
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

describe.only('hasTests', () => {
    test('should return false if there are no tests', async () => {
        const adapter = adapterFactory()
        adapter.loadSpecFiles = jest.fn()
        await adapter.init()
        expect(adapter.hasTests()).toBe(false)
    })

    test('should return true if the feature is disabled', async () => {
        const adapter = adapterFactory(undefined, { specFiltering: false })
        adapter.loadSpecFiles = jest.fn()
        await adapter.init()
        expect(adapter.hasTests()).toBe(true)
    })

    test('should return true if there are tests', async () => {
        Cucumber.getTestCasesFromFilesystem.mockImplementationOnce(() => ['/foo/bar.js'])
        const adapter = adapterFactory()
        adapter.loadSpecFiles = jest.fn()
        await adapter.init()
        expect(adapter.hasTests()).toBe(true)
    })
})

describe('wrapSteps', () => {
    const adapter = adapterFactory()
    adapter.wrapStep = jest.fn()
    adapter.wrapSteps(adapter.config)

    const functionWrapper = Cucumber.setDefinitionFunctionWrapper.mock.calls[0].pop()

    test('should use proper default values', () => {
        const wrappedFunction = jest.fn()

        functionWrapper(wrappedFunction)
        expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 0, true, adapter.config, '0-2', expect.any(Function))
    })

    test('should use passed arguments', () => {
        const wrappedFunction = jest.fn()

        functionWrapper(wrappedFunction, { retry: 123 })
        expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 123, true, adapter.config, '0-2', expect.any(Function))
    })

    test('should not wrap wdio hooks', () => {
        const wdioHookFn = () => { }

        expect(functionWrapper(wdioHookFn)).toBe(wdioHookFn)
        expect(adapter.wrapStep).toBeCalledTimes(0)
    })

    test('should not detect user hooks as steps', () => {
        const userHookFn = () => { }

        functionWrapper(userHookFn)
        expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 0, false, adapter.config, '0-2', expect.any(Function))
    })

    afterEach(() => {
        adapter.wrapStep.mockClear()
    })
})

describe('wrapStep', () => {
    const fnWrapperArgs = (type, retries) => [
        type, {
            specFn: 'specFn',
            specFnArgs: [1, 2]
        }, {
            beforeFn: `before${type}`,
            beforeFnArgs: expect.any(Function)
        }, {
            afterFn: `after${type}`,
            afterFnArgs: expect.any(Function)
        },
        'cid',
        retries
    ]

    test('should be proper type for Step', () => {
        const adapter = adapterFactory()

        const fn = adapter.wrapStep('specFn', 3, true, adapter.config, 'cid', jest.fn().mockImplementation(() => 'getCurrentStep'))
        fn(1, 2)

        expect(testFnWrapper).toBeCalledWith(...fnWrapperArgs('Step', 3))

        const beforeFnArgs = testFnWrapper.mock.calls[0][2].beforeFnArgs
        expect(beforeFnArgs('context')).toEqual(['uri', 'feature', 'getCurrentStep', 'context'])
        const afterFnArgs = testFnWrapper.mock.calls[0][3].afterFnArgs
        expect(afterFnArgs('context')).toEqual(['uri', 'feature', 'getCurrentStep', 'context'])
    })

    test('should be proper type for Hook', () => {
        const adapter = adapterFactory()

        const fn = adapter.wrapStep('specFn', undefined, false, adapter.config, 'cid', jest.fn().mockImplementation(() => 'getCurrentStep'))
        fn(1, 2)

        expect(testFnWrapper).toBeCalledWith(...fnWrapperArgs('Hook', 0))

        const beforeFnArgs = testFnWrapper.mock.calls[0][2].beforeFnArgs
        expect(beforeFnArgs('context')).toEqual(['uri', 'feature', 'getCurrentStep', 'context'])
        const afterFnArgs = testFnWrapper.mock.calls[0][3].afterFnArgs
        expect(afterFnArgs('context')).toEqual(['uri', 'feature', 'getCurrentStep', 'context'])
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
    testFnWrapper.mockClear()
    mockery.enable.mockClear()
    mockery.registerMock.mockClear()
    mockery.disable.mockClear()
})
