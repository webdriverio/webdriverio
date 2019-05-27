import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/config'

import JasmineAdapterFactory, { JasmineAdapter } from '../src'

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

test('comes with a factory', async () => {
    expect(typeof JasmineAdapterFactory.run).toBe('function')
    const result = await JasmineAdapterFactory.run(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    expect(result).toBe(0)
})

test('should properly set up jasmine', async () => {
    const adapter = new JasmineAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await adapter.run()
    expect(result).toBe(0)
    expect(adapter.jrunner.addSpecFiles.mock.calls[0][0]).toEqual(['/foo/bar.test.js'])
    expect(adapter.jrunner.jasmine.addReporter.mock.calls).toHaveLength(1)
    expect(runTestInFiberContext.mock.calls).toHaveLength(7)
    expect(executeHooksWithArgs.mock.calls).toHaveLength(2)

    expect(adapter.jrunner.env.beforeAll.mock.calls).toHaveLength(1)
    expect(adapter.jrunner.env.beforeEach.mock.calls).toHaveLength(1)
    expect(adapter.jrunner.env.afterEach.mock.calls).toHaveLength(1)
    expect(adapter.jrunner.env.afterAll.mock.calls).toHaveLength(1)

    expect(adapter.jrunner.onComplete.mock.calls).toHaveLength(1)
    expect(adapter.jrunner.execute.mock.calls).toHaveLength(1)

    expect(adapter.jrunner.configureDefaultReporter.name).toBe('noop')
    adapter.jrunner.configureDefaultReporter()
})

test('should properly configure the jasmine environment', async () => {
    const stopOnSpecFailure = false
    const stopSpecOnExpectationFailure = false
    const random = false
    const failFast = false

    const adapter = new JasmineAdapter(
        '0-2',
        {
            jasmineNodeOpts: {
                stopOnSpecFailure,
                stopSpecOnExpectationFailure,
                random,
                failFast,
            }
        },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    await adapter.run()
    expect(adapter.jrunner.jasmine.getEnv().configure).toBeCalledWith({
        specFilter: expect.any(Function),
        oneFailurePerSpec: stopSpecOnExpectationFailure,
        stopOnSpecFailure,
        random,
        failFast,
    })
})

test('set custom ', async () => {
    const config = {
        jasmineNodeOpts: { expectationResultHandler: jest.fn() }
    }
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    await adapter.run()
    adapter.jrunner.jasmine.Spec.prototype.addExpectationResult('foobar')
    expect(config.jasmineNodeOpts.expectationResultHandler).toBeCalledWith('foobar', undefined)
})

test('get data from beforeAll hook', async () => {
    const adapter = new JasmineAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    await adapter.run()
    expect(adapter.lastSpec).toBeUndefined()

    adapter.jrunner.jasmine.Suite.prototype.beforeAll.call({
        result: 'some result'
    }, 'foobar')
    expect(adapter.lastSpec).toBe('some result')
    expect(adapter.jrunner.beforeAllHook).toBeCalledWith('foobar')
})

test('get data from execute hook', async () => {
    const adapter = new JasmineAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
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
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(0)

    adapter.jasmineNodeOpts.grep = '@random'
    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(1)

    adapter.jasmineNodeOpts.invertGrep = true
    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(1)

    adapter.jasmineNodeOpts.grep = '@smoke'
    adapter.jasmineNodeOpts.invertGrep = true
    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(2)
})

test('wrapHook if successful', async () => {
    executeHooksWithArgs.mockClear()
    const config = { beforeAll: 'somehook' }
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
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
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
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
    const adapter = new JasmineAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

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
    const adapter = new JasmineAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
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
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

    adapter.expectationResultHandler = jest.fn().mockImplementation(() => 'barfoo')
    const handler = adapter.getExpectationResultHandler(jasmine)
    expect(handler).toBe('foobar')
})

test('getExpectationResultHandler returns modified origHandler if expectationResultHandler is given', () => {
    const jasmine = { Spec: { prototype: { addExpectationResult: 'foobar' } } }
    const config = { jasmineNodeOpts: { expectationResultHandler: jest.fn() } }
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

    adapter.expectationResultHandler = jest.fn().mockImplementation(() => 'barfoo')
    const handler = adapter.getExpectationResultHandler(jasmine)
    expect(handler).toBe('barfoo')
    expect(adapter.expectationResultHandler).toBeCalledWith('foobar')
})

test('expectationResultHandler', () => {
    const origHandler = jest.fn()
    const config = { jasmineNodeOpts: { expectationResultHandler: jest.fn() } }
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

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
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

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
    const adapter = new JasmineAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

    const resultHandler = adapter.expectationResultHandler(origHandler)
    resultHandler(false, 'foobar')
    expect(origHandler).toBeCalledWith(false, 'foobar')
})

test('prepareMessage', () => {
    const adapter = new JasmineAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
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

afterEach(() => {
    runTestInFiberContext.mockClear()
    executeHooksWithArgs.mockClear()
})
