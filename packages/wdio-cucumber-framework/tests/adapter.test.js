import path from 'path'
import mockery from 'mockery'
import * as Cucumber from 'cucumber'
import { executeHooksWithArgs, runFnInFiberContext, executeAsync } from '@wdio/config'

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

test('comes with a factory', async () => {
    expect(typeof CucumberAdapterFactory.run).toBe('function')
})

test('should properly set up cucumber', async () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { compiler: ['js:@babel/register'] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.registerCompilers = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(adapter.registerCompilers).toBeCalled()
    expect(adapter.loadSpecFiles).toBeCalled()
    expect(adapter.wrapSteps).toBeCalled()
    expect(Cucumber.setDefaultTimeout).toBeCalledWith(60000)
    expect(Cucumber.supportCodeLibraryBuilder.reset).toBeCalled()

    expect(executeHooksWithArgs).toBeCalledTimes(2)
    expect(Cucumber.PickleFilter).toBeCalled()
    expect(Cucumber.getTestCasesFromFilesystem).toBeCalled()
})

test('should throw when initialization fails', () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { compiler: ['js:@babel/register'] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.registerCompilers = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()

    const runtimeError = new Error('boom')
    Cucumber.Runtime.mockImplementation(() => { throw runtimeError })
    expect(adapter.run()).rejects.toEqual(runtimeError)
})

test('registerCompilers', () => {
    const compilerPath = path.resolve(__dirname, 'fixtures', 'customCompiler.js')
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { compiler: ['js:' + compilerPath] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.registerCompilers()
    expect(global.MY_VAR).toBe(1)
})

test('registerCompilers as method', () => {
    const compilerPath = path.resolve(__dirname, 'fixtures', 'customCompiler.js')
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { compiler: [['js:' + compilerPath, { some: 'params' }]] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.registerCompilers()
    expect(global.MY_PARAMS).toEqual({ some: 'params' })
})

test('requiredFiles', () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { require: ['/foo/bar.js', '/does/not/exist/*.js'] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
    expect(adapter.requiredFiles()).toEqual(['/foo/bar.js'])
})

test('loadSpecFiles', () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { require: ['/foo/bar.js', '/does/not/exist/*.js'] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
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
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: {} },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
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
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: {} },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )

    const fn = adapter.wrapStepSync('some code', 123)
    expect(typeof fn).toBe('function')
    expect(typeof fn(1, 2, 3).then).toBe('function')
    expect(runFnInFiberContext).toBeCalledTimes(1)
})

test('wrapStepSync with default', () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: {} },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )

    const fn = adapter.wrapStepSync('some code')
    expect(typeof fn).toBe('function')
    expect(typeof fn(1, 2, 3).then).toBe('function')
    expect(runFnInFiberContext).toBeCalledTimes(1)
})

test('wrapStepAsync', () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: {} },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )

    const fn = adapter.wrapStepAsync('fn', 123)
    expect(typeof fn).toBe('function')

    fn(1, 2, 3)
    expect(executeAsync).toBeCalledWith('fn', 123, [1, 2, 3])
})

test('wrapStepAsync with default value', () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: {} },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )

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
