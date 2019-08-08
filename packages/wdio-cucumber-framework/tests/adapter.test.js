import path from 'path'
import mockery from 'mockery'
import * as Cucumber from 'cucumber'
import { executeHooksWithArgs, runFnInFiberContext, executeAsync } from '@wdio/config'

import CucumberAdapterFactory, { CucumberAdapter } from '../src'
import { getTestCases } from '../src/utils'

jest.mock('../src/utils')

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
    expect(getTestCases).toBeCalled()
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
    expect(getTestCases).toBeCalled()
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
    const adapter = adapterFactory()
    adapter.wrapStepSync = jest.fn()
    adapter.wrapStepAsync = jest.fn()
    adapter.wrapSteps()

    const functionWrapper = Cucumber.setDefinitionFunctionWrapper.mock.calls[0].pop()
    const wrappedFunction = jest.fn()
    functionWrapper(wrappedFunction)

    expect(adapter.wrapStepSync).toBeCalledTimes(0)
    expect(adapter.wrapStepAsync).toBeCalledWith(expect.any(Function), 0)

    functionWrapper(wrappedFunction, { retry: 123 })
    expect(adapter.wrapStepAsync).toBeCalledWith(expect.any(Function), 123)
})

test('wrapStepSync', () => {
    const adapter = adapterFactory()

    const fn = adapter.wrapStepSync('some code', 123)
    expect(typeof fn).toBe('function')
    expect(typeof fn(1, 2, 3).then).toBe('function')
    expect(runFnInFiberContext).toBeCalledTimes(1)
})

test('wrapStepSync with default', () => {
    const adapter = adapterFactory()

    const fn = adapter.wrapStepSync('some code')
    expect(typeof fn).toBe('function')
    expect(typeof fn(1, 2, 3).then).toBe('function')
    expect(runFnInFiberContext).toBeCalledTimes(1)
})

test('wrapStepAsync', () => {
    const adapter = adapterFactory()

    const fn = adapter.wrapStepAsync('fn', 123)
    expect(typeof fn).toBe('function')

    fn(1, 2, 3)
    expect(executeAsync).toBeCalledWith('fn', 123, [1, 2, 3])
})

test('wrapStepAsync with default value', () => {
    const adapter = adapterFactory()

    const fn = adapter.wrapStepAsync('fn')
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
