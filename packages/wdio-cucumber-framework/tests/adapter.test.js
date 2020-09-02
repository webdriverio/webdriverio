import path from 'path'
import mockery from 'mockery'
import * as Cucumber from 'cucumber'
import * as utils from '@wdio/utils'
import { setOptions } from 'expect-webdriverio'

const { executeHooksWithArgs, testFnWrapper } = utils

import CucumberAdapterFactory, { CucumberAdapter } from '../src'

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

const adapterFactory = (cucumberOpts = {}, capabilities = {}) => new CucumberAdapter(
    '0-2',
    {
        cucumberOpts,
        beforeStep: 'beforeStep',
        afterStep: 'afterStep',
        beforeHook: 'beforeHook',
        afterHook: 'afterHook'
    },
    ['/foo/bar.feature'],
    { browserName: 'chrome', ...capabilities },
    wdioReporter
)

beforeEach(() => {
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
})

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

    expect(setOptions).toBeCalledTimes(1)
    expect(adapter.registerRequiredModules).toBeCalled()
    expect(adapter.loadSpecFiles).toBeCalled()
    expect(adapter.wrapSteps).toBeCalled()
    expect(Cucumber.setDefaultTimeout).toBeCalledWith(60000)
    expect(Cucumber.supportCodeLibraryBuilder.reset).toBeCalled()

    expect(executeHooksWithArgs).toBeCalledTimes(1)
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

    expect(executeHooksWithArgs).toBeCalledTimes(1)
    expect(Cucumber.PickleFilter).toBeCalled()
    expect(Cucumber.getTestCasesFromFilesystem).toBeCalled()
})

test('should throw when initialization fails', async () => {
    const adapter = adapterFactory({ requireModule: ['@babel/register'] })
    adapter.registerRequiredModules = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()

    const runtimeError = new Error('boom')
    Cucumber.PickleFilter.mockImplementationOnce(() => { throw runtimeError })
    await expect(adapter.init()).rejects.toEqual(runtimeError)
})

test('should throw when run fails', async () => {
    const adapter = adapterFactory({ requireModule: ['@babel/register'] })
    adapter.registerRequiredModules = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()

    await adapter.init()

    const runtimeError = new Error('boom')
    // eslint-disable-next-line
    Cucumber.Runtime = jest.fn().mockImplementationOnce(() => ({
        start: () => { throw runtimeError }
    }))

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

describe('hasTests', () => {
    test('should return false if there are no tests', async () => {
        const adapter = adapterFactory()
        adapter.loadSpecFiles = jest.fn()
        await adapter.init()
        expect(adapter.hasTests()).toBe(false)
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
        expect(beforeFnArgs('context')).toEqual([
            { uri: 'uri', feature: 'feature', step: 'getCurrentStep' },
            'context']
        )
        const afterFnArgs = testFnWrapper.mock.calls[0][3].afterFnArgs
        expect(afterFnArgs('context')).toEqual([
            { uri: 'uri', feature: 'feature', step: 'getCurrentStep' },
            'context']
        )
    })

    test('should be proper type for Hook', () => {
        const adapter = adapterFactory()

        const fn = adapter.wrapStep('specFn', undefined, false, adapter.config, 'cid', jest.fn().mockImplementation(() => 'getCurrentStep'))
        fn(1, 2)

        expect(testFnWrapper).toBeCalledWith(...fnWrapperArgs('Hook', 0))

        const beforeFnArgs = testFnWrapper.mock.calls[0][2].beforeFnArgs
        expect(beforeFnArgs('context')).toEqual([
            { uri: 'uri', feature: 'feature', step: 'getCurrentStep' },
            'context']
        )
        const afterFnArgs = testFnWrapper.mock.calls[0][3].afterFnArgs
        expect(afterFnArgs('context')).toEqual([
            { uri: 'uri', feature: 'feature', step: 'getCurrentStep' },
            'context']
        )
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

    afterAll(() => {
        delete global.result
    })

    test('beforeScenario', () => {
        const world = { pickle: 'pickle', sourceLocation: 'sourceLocation', foo: 'bar' }
        beforeScenario(world)
        expect(executeHooksWithArgs).toBeCalledWith(adapterConfig.beforeScenario, ['uri', 'feature', 'pickle', 'sourceLocation', world])
    })
    test('afterScenario', () => {
        const world = { pickle: 'pickle', sourceLocation: 'sourceLocation', result: 'result', foo: 'bar' }
        afterScenario(world)
        expect(executeHooksWithArgs).toBeCalledWith(adapterConfig.afterScenario, ['uri', 'feature', 'pickle', 'result', 'sourceLocation', world])
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

describe('skip filters', () => {
    const CHROME = { browserName:'Chrome', platformName:'linux' }
    const FIREFOX = { browserName:'firefox', platformName:'linux' }

    test('should skip using single capabilities', () => {
        const adapter = adapterFactory({}, CHROME)
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName="chrome")'
                }]
            }
        })).toBeFalsy()
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName="firefox")'
                }]
            }
        })).toBeTruthy()
        expect(adapter.filter({
            pickle: {
                tags: []
            }
        })).toBeTruthy()
    })

    test('should skip using multiple properties', () => {
        const adapter = adapterFactory({}, CHROME)
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName="chrome";platformName="linux")'
                }]
            }
        })).toBeFalsy()
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName="chrome";platformName="windows")'
                }]
            }
        })).toBeTruthy()
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName="firefox")'
                }]
            }
        })).toBeTruthy()
    })

    test('should skip with lists', () => {
        const adapter = adapterFactory({}, CHROME)
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName=["Chrome","Firefox"])'
                }]
            }
        })).toBeFalsy()
    })

    test('should skip all specs if empty', () => {
        const adapter = adapterFactory({}, CHROME)
        expect(adapter.filter({
            pickle: {
                tags: [{
                    name: '@skip()'
                }]
            }
        })).toBeFalsy()
    })

    test('should skip with regexp', () => {
        const chromeAdapter = adapterFactory({}, CHROME)
        const ffAdapter = adapterFactory({}, FIREFOX)
        expect(chromeAdapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName=/C.*e/)'
                }]
            }
        })).toBeFalsy()
        expect(ffAdapter.filter({
            pickle: {
                tags: [{
                    name: '@skip(browserName=/c.*e/)'
                }]
            }
        })).toBeTruthy()

    })

    test('should not cause failures if no pickles or tags are provided', () => {
        const adapter = adapterFactory({}, CHROME)
        expect(adapter.filter({})).toBeTruthy()
        expect(adapter.filter({ pickle: {} })).toBeTruthy()
    })

    test('should also filter triggered events', async () => {
        const events = {
            'pickle-accepted': [],
            'other-event': []
        }
        const adapter = adapterFactory({ ignoreUndefinedDefinitions: true })
        Object.keys(events).forEach(n => adapter.eventBroadcaster.addListener(n, param => events[n].push(param)))
        Cucumber.getTestCasesFromFilesystem.mockImplementation(({ eventBroadcaster }) => {
            eventBroadcaster.emit('pickle-accepted', { pickle: { name: 'skipped', tags: [{ name: '@skip()' }] } })
            eventBroadcaster.emit('pickle-accepted', { pickle: { name: 'should reach', tags: [] } })
            eventBroadcaster.emit('other-event', {})
            return []
        })
        await adapter.init()
        expect(events['pickle-accepted'].length).toBe(1)
        expect(events['other-event'].length).toBe(1)
        expect(events['pickle-accepted'][0].pickle.name).toBe('should reach')
    })

})

afterEach(() => {
    delete global.browser
    delete global.MY_VAR
    delete global.MY_PARAMS

    Cucumber.setDefinitionFunctionWrapper.mockClear()
    Cucumber.supportCodeLibraryBuilder.reset.mockReset()
    Cucumber.setDefaultTimeout.mockReset()
    executeHooksWithArgs.mockClear()
    testFnWrapper.mockClear()
    mockery.enable.mockClear()
    mockery.registerMock.mockClear()
    mockery.disable.mockClear()
    setOptions.mockClear()
})
