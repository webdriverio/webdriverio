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

test('wrapSteps', () => {
    config.hasWdioSyncSupport = false
    const adapter = adapterFactory()
    adapter.wrapStep = jest.fn()
    adapter.wrapSteps(adapter.config)

    const functionWrapper = Cucumber.setDefinitionFunctionWrapper.mock.calls[0].pop()
    const wrappedFunction = jest.fn()
    functionWrapper(wrappedFunction)

    expect(executeSync).toBeCalledTimes(0)
    expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 0, true, adapter.config)

    functionWrapper(wrappedFunction, { retry: 123 })
    expect(adapter.wrapStep).toBeCalledWith(expect.any(Function), 123, true, adapter.config)
})

test('wrapStepSync', () => {
    config.hasWdioSyncSupport = true
    const adapter = adapterFactory()

    const fn = adapter.wrapStep('some code', 123, true, adapter.config)
    expect(typeof fn).toBe('function')

    fn(1, 2, 3)
    expect(executeSync).toBeCalledWith(expect.any(Function), 123, [1, 2, 3])
})

test('wrapStepSync with default', () => {
    config.hasWdioSyncSupport = true
    const adapter = adapterFactory()

    const fn = adapter.wrapStep('fn')
    expect(typeof fn).toBe('function')

    fn(1, 2, 3)
    expect(executeSync).toBeCalledWith('fn', 0, [1, 2, 3])
})

test('wrapStepAsync', () => {
    config.hasWdioSyncSupport = false
    const adapter = adapterFactory()

    const fn = adapter.wrapStep('fn', 123)
    expect(typeof fn).toBe('function')

    fn(1, 2, 3)
    expect(executeAsync).toBeCalledWith('fn', 123, [1, 2, 3])
})

test('wrapStepAsync with default value', () => {
    config.hasWdioSyncSupport = false
    const adapter = adapterFactory()

    const fn = adapter.wrapStep('fn')
    expect(typeof fn).toBe('function')

    fn(1, 2, 3)
    expect(executeAsync).toBeCalledWith('fn', 0, [1, 2, 3])
})

afterEach(() => {
    Cucumber.supportCodeLibraryBuilder.reset.mockReset()
    Cucumber.setDefaultTimeout.mockReset()
    executeHooksWithArgs.mockClear()
    runFnInFiberContext.mockClear()
    mockery.enable.mockClear()
    mockery.registerMock.mockClear()
    mockery.disable.mockClear()
})
