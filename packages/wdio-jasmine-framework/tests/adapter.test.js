import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/utils'
import { setOptions } from 'expect-webdriverio'

import JasmineAdapterFactory, { JasmineAdapter } from '../src'

const INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
}
const TEST_INTERFACES = ['it', 'fit', 'xit']
const BEFORE_HOOK_IDX = 1
const AFTER_HOOK_IDX = 3

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

const hookPayload = (type, suite, error) => ({
    description: `"${type} all" hook`,
    error,
    fullName: `"${type} all" hook`,
    type: 'hook',
    uid: `${suite}-${type}All`
})

const adapterFactory = (config = {}) => new JasmineAdapter(
    '0-2',
    { beforeHook: [], afterHook: [], beforeTest: 'beforeTest', afterTest: 'afterTest', ...config },
    ['/foo/bar.test.js'],
    { browserName: 'chrome' },
    wdioReporter
)

test('comes with a factory', async () => {
    expect(typeof JasmineAdapterFactory.init).toBe('function')
    const instance = await JasmineAdapterFactory.init(
        '0-2',
        { beforeHook: [], afterHook: [] },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await instance.run()
    expect(result).toBe(0)
})

test('should properly set up jasmine', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()

    expect(result).toBe(0)
    expect(setOptions).toBeCalledTimes(1)
    expect(adapter.jrunner.addSpecFiles.mock.calls[0][0]).toEqual(['/foo/bar.test.js'])
    expect(adapter.jrunner.jasmine.addReporter.mock.calls).toHaveLength(1)
    expect(executeHooksWithArgs.mock.calls).toHaveLength(1)

    expect(adapter.jrunner.env.beforeAll.mock.calls).toHaveLength(1)
    expect(adapter.jrunner.env.beforeEach.mock.calls).toHaveLength(0)
    expect(adapter.jrunner.env.afterEach.mock.calls).toHaveLength(0)
    expect(adapter.jrunner.env.afterAll.mock.calls).toHaveLength(1)

    expect(adapter.jrunner.onComplete.mock.calls).toHaveLength(1)
    expect(adapter.jrunner.execute.mock.calls).toHaveLength(1)

    expect(adapter.jrunner.configureDefaultReporter.name).toBe('noop')
    adapter.jrunner.configureDefaultReporter()
})

test('should propery wrap interfaces', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    expect(runTestInFiberContext.mock.calls).toHaveLength(INTERFACES.bdd.length)

    INTERFACES.bdd.forEach((fnName, idx) => {
        const isTest = TEST_INTERFACES.includes(fnName)
        const hook = fnName.includes('All') ? [expect.any(Function)] : []

        expect(runTestInFiberContext.mock.calls[idx][5]).toBe(fnName)
        expect(runTestInFiberContext.mock.calls[idx][BEFORE_HOOK_IDX]).toEqual(isTest ? 'beforeTest' : hook)
        expect(runTestInFiberContext.mock.calls[idx][AFTER_HOOK_IDX]).toEqual(isTest ? 'afterTest' : hook)
    })
})

test('hookArgsFn: should return proper value', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    const hookArgsFn = runTestInFiberContext.mock.calls[0][2]
    adapter.lastTest = { title: 'foo' }
    expect(hookArgsFn('bar')).toEqual([{ title: 'foo' }, 'bar'])
    delete adapter.lastTest
    expect(hookArgsFn('bar')).toEqual([{}, 'bar'])
})

test('emitHookEvent: should emit events for beforeAll and afterAll hooks', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    const allHooks = INTERFACES.bdd.filter(fnName => fnName.includes('All'))
    expect(allHooks).toHaveLength(2)

    adapter.reporter = {
        emit: jest.fn(),
        getUniqueIdentifier: () => 'ID'
    }
    allHooks.forEach((hookName) => {
        const hookIdx = INTERFACES.bdd.indexOf(hookName)
        adapter.reporter.startedSuite = true
        runTestInFiberContext.mock.calls[hookIdx][BEFORE_HOOK_IDX].pop()(null, null, undefined)
        adapter.reporter.startedSuite = false
        runTestInFiberContext.mock.calls[hookIdx][AFTER_HOOK_IDX].pop()(null, null, { error: new Error(hookName) })
    })

    expect(adapter.reporter.emit).toHaveBeenCalledTimes(4)
    expect(adapter.reporter.emit).toBeCalledWith('hook:start', hookPayload('before', 'ID'))
    expect(adapter.reporter.emit).toBeCalledWith('hook:end', hookPayload('before', 'root0-2', { message: 'beforeAll' }))
    expect(adapter.reporter.emit).toBeCalledWith('hook:start', hookPayload('after', 'ID'))
    expect(adapter.reporter.emit).toBeCalledWith('hook:end', hookPayload('after', 'root0-2', { message: 'afterAll' }))
})

test('should properly configure the jasmine environment', async () => {
    const stopOnSpecFailure = false
    const failSpecWithNoExpectations = false
    const stopSpecOnExpectationFailure = false
    const random = false
    const failFast = false
    const seed = false

    const adapter = adapterFactory({
        jasmineNodeOpts: {
            stopOnSpecFailure,
            stopSpecOnExpectationFailure,
            random,
            failFast,
        }
    })
    await adapter.init()
    await adapter.run()
    expect(adapter.jrunner.jasmine.getEnv().configure).toBeCalledWith({
        specFilter: expect.any(Function),
        failSpecWithNoExpectations,
        oneFailurePerSpec: stopSpecOnExpectationFailure,
        stopOnSpecFailure,
        random,
        seed,
        failFast,
    })
})

test('set custom ', async () => {
    const config = {
        jasmineNodeOpts: { expectationResultHandler: jest.fn() },
        beforeHook: [],
        afterHook: []
    }
    const adapter = adapterFactory(config)
    await adapter.init()
    await adapter.run()
    adapter.jrunner.jasmine.Spec.prototype.addExpectationResult('foobar')
    expect(config.jasmineNodeOpts.expectationResultHandler).toBeCalledWith('foobar', undefined)
})

test('get data from beforeAll hook', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()
    expect(adapter.lastSpec).toBeUndefined()

    adapter.jrunner.jasmine.Suite.prototype.beforeAll.call({
        result: 'some result'
    }, 'foobar')
    expect(adapter.lastSpec).toBe('some result')
    expect(adapter.jrunner.beforeAllHook).toBeCalledWith('foobar')
})

test('get data from execute hook', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()
    expect(adapter.lastTest).toBeUndefined()

    adapter.jrunner.jasmine.Spec.prototype.execute.call({
        result: {
            text: 'some result'
        }
    }, 'barfoo')

    expect(adapter.lastTest.text).toBe('some result')
    expect(typeof adapter.lastTest.start).toBe('number')
    expect(adapter.jrunner.executeHook).toBeCalledWith('barfoo')
})

test('customSpecFilter', () => {
    const specMock = {
        getFullName: () => 'my test @smoke',
        pend: jest.fn()
    }
    const config = {
        jasmineNodeOpts: { grepMatch: '@smoke' }
    }
    const adapter = adapterFactory(config)

    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(0)

    adapter.jasmineNodeOpts.grep = '@random'
    expect(adapter.customSpecFilter(specMock)).toBe(false)
    expect(specMock.pend.mock.calls).toHaveLength(1)

    adapter.jasmineNodeOpts.invertGrep = true
    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(1)

    adapter.jasmineNodeOpts.grep = '@smoke'
    adapter.jasmineNodeOpts.invertGrep = true
    expect(adapter.customSpecFilter(specMock)).toBe(false)
    expect(specMock.pend.mock.calls).toHaveLength(2)
})

test('wrapHook if successful', async () => {
    executeHooksWithArgs.mockClear()
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll')
    const doneCallback = jest.fn()

    executeHooksWithArgs.mockImplementation((...args) => Promise.resolve(args))
    await wrappedHook(doneCallback)
    expect(executeHooksWithArgs.mock.calls[0][0]).toBe('somehook')
    expect(executeHooksWithArgs.mock.calls[0][1].type).toBe('beforeAll')
    expect(doneCallback.mock.calls).toHaveLength(1)
})

test('wrapHook if failing', async () => {
    executeHooksWithArgs.mockClear()
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll')
    const doneCallback = jest.fn()

    executeHooksWithArgs.mockImplementation(() => Promise.reject(new Error('uuuups')))
    await wrappedHook(doneCallback)
    expect(executeHooksWithArgs.mock.calls[0][0]).toBe('somehook')
    expect(executeHooksWithArgs.mock.calls[0][1].type).toBe('beforeAll')
    expect(doneCallback.mock.calls).toHaveLength(1)
    expect(logger().info.mock.calls[0][0].startsWith('Error in beforeAll hook: uuuups')).toBe(true)
})

test('formatMessage', () => {
    const adapter = adapterFactory()

    let message = adapter.formatMessage({ type: 'foobar' })
    expect(message).toEqual({ type: 'foobar' })

    message = adapter.formatMessage({
        type: 'foobar',
        payload: {
            failedExpectations: [new Error('foobar')]
        }
    })
    expect(message.error.message).toBe('foobar')

    adapter.lastSpec = { description: 'lasttestdesc' }
    message = adapter.formatMessage({
        type: 'afterTest',
        payload: {
            id: 'spec1',
            description: 'foodesc',
            fullName: 'foo',
            file: '/some/test.js',
            failedExpectations: [],
            start: Date.now() - 2000
        }
    })
    expect(message.duration).toBeGreaterThan(1999)
    expect(message.duration).toBeLessThan(2005)
    expect(message.passed).toBe(true)
    expect(message.parent).toBe('lasttestdesc')
    expect(message.title).toBe('foodesc')

    message = adapter.formatMessage({
        type: 'afterTest',
        payload: {
            description: 'foodesc',
            fullName: 'foo',
            file: '/some/test.js',
            start: Date.now() - 2000,
            duration: 123
        }
    })
    expect(message.duration).toBe(123)
})

test('formatMessage should pass all failedExpectations as errors', () => {
    const adapter = adapterFactory()
    const message = adapter.formatMessage({
        type: 'foobar',
        payload: {
            failedExpectations: [new Error('foobar'), { message: 'I am also a failed expectation but not an exception' }]
        }
    })

    expect(message.errors.length).toBe(2)
    expect(message.errors[1].message).toBe('I am also a failed expectation but not an exception')
})

test('getExpectationResultHandler returns origHandler if none is given', () => {
    const jasmine = { Spec: { prototype: { addExpectationResult: 'foobar' } } }
    const config = { jasmineNodeOpts: {} }
    const adapter = adapterFactory(config)

    adapter.expectationResultHandler = jest.fn().mockImplementation(() => 'barfoo')
    const handler = adapter.getExpectationResultHandler(jasmine)
    expect(handler).toBe('foobar')
})

test('getExpectationResultHandler returns modified origHandler if expectationResultHandler is given', () => {
    const jasmine = { Spec: { prototype: { addExpectationResult: 'foobar' } } }
    const config = { jasmineNodeOpts: { expectationResultHandler: jest.fn() } }
    const adapter = adapterFactory(config)

    adapter.expectationResultHandler = jest.fn().mockImplementation(() => 'barfoo')
    const handler = adapter.getExpectationResultHandler(jasmine)
    expect(handler).toBe('barfoo')
    expect(adapter.expectationResultHandler).toBeCalledWith('foobar')
})

test('expectationResultHandler', () => {
    const origHandler = jest.fn()
    const config = { jasmineNodeOpts: { expectationResultHandler: jest.fn() } }
    const adapter = adapterFactory(config)

    const resultHandler = adapter.expectationResultHandler(origHandler)
    resultHandler(true, 'foobar')
    expect(config.jasmineNodeOpts.expectationResultHandler).toBeCalledWith(true, 'foobar')
    expect(origHandler).toBeCalledWith(true, 'foobar')
})

test('expectationResultHandler failing', () => {
    const origHandler = jest.fn()
    const err = new Error('uuups')
    const config = { jasmineNodeOpts: { expectationResultHandler: () => {
        throw err
    } } }
    const adapter = adapterFactory(config)

    const resultHandler = adapter.expectationResultHandler(origHandler)
    resultHandler(true, 'foobar')
    expect(origHandler).toBeCalledWith(
        false,
        {
            passed: false,
            message: 'expectationResultHandlerError: uuups',
            error: err
        }
    )
})

test('expectationResultHandler failing with failing test', () => {
    const origHandler = jest.fn()
    const config = { jasmineNodeOpts: { expectationResultHandler: () => {
        throw new Error('uuups')
    } } }
    const adapter = adapterFactory(config)

    const resultHandler = adapter.expectationResultHandler(origHandler)
    resultHandler(false, 'foobar')
    expect(origHandler).toBeCalledWith(false, 'foobar')
})

test('prepareMessage', () => {
    const adapter = adapterFactory()
    adapter.formatMessage = (params) => params
    adapter.jrunner.specFiles = ['/some/path.test.js']
    adapter.lastSpec = { foo: 'bar' }
    adapter.lastTest = { bar: 'foo' }

    const msg = adapter.prepareMessage('beforeSuite')
    expect(msg.type).toBe('beforeSuite')
    expect(msg.payload.file).toBe('/some/path.test.js')
    expect(msg.payload.foo).toBe('bar')

    const msgSpec = adapter.prepareMessage('beforeTest')
    expect(msgSpec.type).toBe('beforeTest')
    expect(msgSpec.payload.file).toBe('/some/path.test.js')
    expect(msgSpec.payload.bar).toBe('foo')
})

describe('_grep', () => {
    test('should increase totalTests counter if test is not filtered by grep', () => {
        const adapter = adapterFactory()
        expect(adapter.totalTests).toBe(0)

        adapter.customSpecFilter = jest.fn().mockImplementation(spec => !!spec.disable)

        adapter._grep({
            children: [
                { disable: false }, { disable: true },
                { children: [{ disable: true }] }]
        })
        expect(adapter.totalTests).toBe(2)
    })
})

describe('loadFiles', () => {
    test('should set _hasTests to true if there are tests to run', () => {
        const adapter = adapterFactory({})
        adapter._hasTests = null
        adapter.jrunner.loadRequires = jest.fn()
        adapter.jrunner.loadHelpers = jest.fn()
        adapter.jrunner.loadSpecs = jest.fn()
        adapter.jrunner.env = { topSuite() { return { children: [1] } } }

        adapter._loadFiles({})

        expect(adapter.jrunner.loadRequires).toBeCalled()
        expect(adapter.jrunner.loadHelpers).toBeCalled()
        expect(adapter.jrunner.loadSpecs).toBeCalled()
        expect(adapter._hasTests).toBe(true)
    })

    test('should set _hasTests to false if there no tests to run', () => {
        const adapter = adapterFactory()
        adapter._hasTests = null
        adapter.jasmineNodeOpts.requires = ['r']
        adapter.jasmineNodeOpts.helpers = ['h']
        adapter.jrunner.addRequires = jest.fn()
        adapter.jrunner.addHelperFiles = jest.fn()
        adapter.jrunner.loadRequires = jest.fn()
        adapter.jrunner.loadHelpers = jest.fn()
        adapter.jrunner.loadSpecs = jest.fn()
        adapter.jrunner.env = { topSuite() { return { children: [] } } }

        adapter._loadFiles({})

        expect(adapter.jrunner.addRequires).toHaveBeenCalledWith(adapter.jasmineNodeOpts.requires)
        expect(adapter.jrunner.addHelperFiles).toHaveBeenCalledWith(adapter.jasmineNodeOpts.helpers)
        expect(adapter._hasTests).toBe(false)
    })

    test('should not fail on exception', () => {
        const adapter = adapterFactory()
        adapter._hasTests = null

        adapter.jrunner.loadRequires = jest.fn().mockImplementation(() => { throw new Error('foo') }),

        adapter._loadFiles({})
        expect(adapter.jrunner.loadRequires).toBeCalled()
        expect(adapter._hasTests).toBe(null)
    })
})

describe('hasTests', () => {
    test('should return flag result', () => {
        const adapter = adapterFactory()
        adapter._hasTests = true
        expect(adapter.hasTests()).toBe(true)
        adapter._hasTests = false
        expect(adapter.hasTests()).toBe(false)
    })
})

afterEach(() => {
    setOptions.mockClear()
    runTestInFiberContext.mockClear()
    executeHooksWithArgs.mockClear()
})
