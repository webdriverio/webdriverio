import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/utils'
import { setOptions } from 'expect-webdriverio'
import { EventEmitter } from 'node:events'

import JasmineAdapterFactory, { JasmineAdapter } from '../src'

const INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
}
const TEST_INTERFACES = ['it', 'fit', 'xit']
const BEFORE_HOOK_IDX = 1
const AFTER_HOOK_IDX = 3

const wdioReporter: EventEmitter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
} as any

const hookPayload = (type: string, error?: Error) => ({
    id: '',
    description: `"${type} all" hook`,
    duration: null,
    ...(error ? { error } : {}),
    fullName: `"${type} all" hook`,
    properties: {},
    start: expect.any(Date),
    type: 'hook',
    passedExpectations: [],
    failedExpectations: [],
    deprecationWarnings: [],
    status: '',
    pendingReason: ''
})

const adapterFactory = (config = {}) => new JasmineAdapter(
    '0-2',
    { beforeHook: [], afterHook: [], beforeTest: 'beforeTest', afterTest: 'afterTest', ...config } as any,
    ['/foo/bar.test.js'],
    { browserName: 'chrome' } as any,
    wdioReporter
)

test('comes with a factory', async () => {
    expect(typeof JasmineAdapterFactory.init).toBe('function')
    const instance = await JasmineAdapterFactory.init!(
        '0-2',
        { beforeHook: [], afterHook: [] },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await instance.run()
    expect(result).toBe(0)
})

it('should fail to run if jasmine runner is not initialised', async () => {
    const adapter = adapterFactory()
    const err = await adapter.run().catch((err: Error) => err) as Error
    expect(err.message).toBe('Jasmine not initiate yet')
})

test('should properly set up jasmine', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()

    expect(result).toBe(0)
    expect(setOptions).toBeCalledTimes(1)
    expect((adapter['_jrunner']!.addSpecFiles as jest.Mock).mock.calls[0][0]).toEqual(['/foo/bar.test.js'])
    // @ts-ignore outdated types
    expect((adapter['_jrunner']!.jasmine.addReporter as jest.Mock).mock.calls).toHaveLength(1)
    expect((executeHooksWithArgs as jest.Mock).mock.calls).toHaveLength(1)

    expect((adapter['_jrunner']!.env.beforeAll as jest.Mock).mock.calls).toHaveLength(1)
    expect((adapter['_jrunner']!.env.beforeEach as jest.Mock).mock.calls).toHaveLength(0)
    expect((adapter['_jrunner']!.env.afterEach as jest.Mock).mock.calls).toHaveLength(0)
    expect((adapter['_jrunner']!.env.afterAll as jest.Mock).mock.calls).toHaveLength(1)

    expect((adapter['_jrunner']!.onComplete as jest.Mock).mock.calls).toHaveLength(1)
    expect((adapter['_jrunner']!.execute as jest.Mock).mock.calls).toHaveLength(1)

    expect(adapter['_jrunner']!.configureDefaultReporter.name).toBe('noop')
    // @ts-ignore outdated types
    adapter['_jrunner']!.configureDefaultReporter()
})

test('should propery wrap interfaces', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    expect((runTestInFiberContext as jest.Mock).mock.calls).toHaveLength(INTERFACES.bdd.length)

    INTERFACES.bdd.forEach((fnName, idx) => {
        const isTest = TEST_INTERFACES.includes(fnName)
        const hook = fnName.includes('All') ? [expect.any(Function)] : []

        expect((runTestInFiberContext as jest.Mock).mock.calls[idx][5]).toBe(fnName)
        expect((runTestInFiberContext as jest.Mock).mock.calls[idx][BEFORE_HOOK_IDX]).toEqual(isTest ? 'beforeTest' : hook)
        expect((runTestInFiberContext as jest.Mock).mock.calls[idx][AFTER_HOOK_IDX]).toEqual(isTest ? 'afterTest' : hook)
    })
})

test('hookArgsFn: should return proper value', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    const hookArgsFn = (runTestInFiberContext as jest.Mock).mock.calls[0][2]
    adapter['_lastTest'] = { title: 'foo' } as any
    expect(hookArgsFn('bar')).toEqual([{ title: 'foo' }, 'bar'])
    delete adapter['_lastTest']
    expect(hookArgsFn('bar')).toEqual([{}, 'bar'])
})

test('emitHookEvent: should emit events for beforeAll and afterAll hooks', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    const allHooks = INTERFACES.bdd.filter(fnName => fnName.includes('All'))
    expect(allHooks).toHaveLength(2)

    adapter['_reporter'] = { emit: jest.fn() } as any
    allHooks.forEach((hookName) => {
        const hookIdx = INTERFACES.bdd.indexOf(hookName)
        adapter['_reporter'].startedSuite = true as any
        ;(runTestInFiberContext as jest.Mock).mock.calls[hookIdx][BEFORE_HOOK_IDX].pop()(null, null, undefined)
        adapter['_reporter'].startedSuite = false as any
        ;(runTestInFiberContext as jest.Mock).mock.calls[hookIdx][AFTER_HOOK_IDX].pop()(null, null, { error: new Error(hookName) })
    })

    expect(adapter['_reporter'].emit).toHaveBeenCalledTimes(4)

    expect(adapter['_reporter'].emit).toBeCalledWith('hook:start', hookPayload('before'))
    expect(adapter['_reporter'].emit).toBeCalledWith('hook:end', hookPayload('before', new Error('beforeAll')))
    expect(adapter['_reporter'].emit).toBeCalledWith('hook:start', hookPayload('after'))
    expect(adapter['_reporter'].emit).toBeCalledWith('hook:end', hookPayload('after', new Error('afterAll')))
})

test('should properly configure the jasmine environment', async () => {
    const stopOnSpecFailure = false
    const failSpecWithNoExpectations = false
    const stopSpecOnExpectationFailure = false
    const random = false
    const failFast = false
    const seed = false

    const adapter = adapterFactory({
        jasmineOpts: {
            stopOnSpecFailure,
            stopSpecOnExpectationFailure,
            random,
            failFast,
        }
    })
    await adapter.init()
    await adapter.run()
    // @ts-ignore outdated types
    expect(adapter['_jrunner']!.jasmine.getEnv().configure).toBeCalledWith({
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
        jasmineOpts: { expectationResultHandler: jest.fn() },
        beforeHook: [],
        afterHook: []
    }
    const adapter = adapterFactory(config)
    await adapter.init()
    await adapter.run()
    adapter['_jrunner']!.jasmine.Spec.prototype.addExpectationResult('foobar')
    expect(config.jasmineOpts.expectationResultHandler).toBeCalledWith('foobar', undefined)
})

test('get data from beforeAll hook', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()
    expect(adapter['_lastSpec']).toBeUndefined()

    // @ts-ignore outdated types
    adapter['_jrunner']!.jasmine.Suite.prototype.beforeAll.call({
        result: 'some result'
    }, 'foobar')
    expect(adapter['_lastSpec']).toBe('some result')
    // @ts-ignore outdated types
    expect(adapter['_jrunner']!.beforeAllHook).toBeCalledWith('foobar')
})

test('get data from execute hook', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()
    expect(adapter['_lastTest']).toBeUndefined()

    adapter['_jrunner']!.jasmine.Spec.prototype.execute.call({
        result: {
            text: 'some result'
        }
    }, 'barfoo')

    // @ts-ignore outdated types
    expect(adapter['_lastTest'].text).toBe('some result')
    // @ts-ignore outdated types
    expect(typeof adapter['_lastTest'].start).toBe('number')
    // @ts-ignore outdated types
    expect(adapter['_jrunner']!.executeHook).toBeCalledWith('barfoo')
})

test('customSpecFilter', () => {
    const specMock = {
        getFullName: () => 'my test @smoke',
        pend: jest.fn()
    } as any
    const config = {
        jasmineOpts: { grepMatch: '@smoke' }
    }
    const adapter = adapterFactory(config)

    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(0)

    adapter['_jasmineOpts'].grep = '@random'
    expect(adapter.customSpecFilter(specMock)).toBe(false)
    expect(specMock.pend.mock.calls).toHaveLength(1)

    adapter['_jasmineOpts'].invertGrep = true
    expect(adapter.customSpecFilter(specMock)).toBe(true)
    expect(specMock.pend.mock.calls).toHaveLength(1)

    adapter['_jasmineOpts'].grep = '@smoke'
    adapter['_jasmineOpts'].invertGrep = true
    expect(adapter.customSpecFilter(specMock)).toBe(false)
    expect(specMock.pend.mock.calls).toHaveLength(2)
})

test('wrapHook if successful', async () => {
    (executeHooksWithArgs as jest.Mock).mockClear()
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll' as any)

    ;(executeHooksWithArgs as jest.Mock).mockImplementation((...args) => Promise.resolve(args))
    await wrappedHook()
    expect((executeHooksWithArgs as jest.Mock).mock.calls[0][0]).toBe('beforeAll')
    expect((executeHooksWithArgs as jest.Mock).mock.calls[0][1]).toBe('somehook')
    expect((executeHooksWithArgs as jest.Mock).mock.calls[0][2][0].type).toBe('beforeAll')
})

test('wrapHook if failing', async () => {
    (executeHooksWithArgs as jest.Mock).mockClear()
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll' as any)

    ;(executeHooksWithArgs as jest.Mock).mockImplementation(() => Promise.reject(new Error('uuuups')))
    await wrappedHook()
    expect((executeHooksWithArgs as jest.Mock).mock.calls[0][0]).toBe('beforeAll')
    expect((executeHooksWithArgs as jest.Mock).mock.calls[0][1]).toBe('somehook')
    expect((executeHooksWithArgs as jest.Mock).mock.calls[0][2][0].type).toBe('beforeAll')
    expect((logger('').info as jest.Mock).mock.calls[0][0].startsWith('Error in beforeAll hook: uuuups')).toBe(true)
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
    expect(message.error?.message).toBe('foobar')

    adapter['_lastSpec'] = { description: 'lasttestdesc' } as any
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

    expect(message.errors?.length).toBe(2)
    expect(message.errors![1].message).toBe('I am also a failed expectation but not an exception')
})

test('getExpectationResultHandler returns origHandler if none is given', () => {
    const jasmine = { Spec: { prototype: { addExpectationResult: 'foobar' } } }
    const config = { jasmineOpts: {} }
    const adapter = adapterFactory(config)

    adapter.expectationResultHandler = jest.fn().mockImplementation(() => 'barfoo')
    const handler = adapter.getExpectationResultHandler(jasmine as any)
    expect(handler).toBe('foobar')
})

test('getExpectationResultHandler returns modified origHandler if expectationResultHandler is given', () => {
    const jasmine = { Spec: { prototype: { addExpectationResult: 'foobar' } } }
    const config = { jasmineOpts: { expectationResultHandler: jest.fn() } }
    const adapter = adapterFactory(config)

    adapter.expectationResultHandler = jest.fn().mockImplementation(() => 'barfoo')
    const handler = adapter.getExpectationResultHandler(jasmine as any)
    expect(handler).toBe('barfoo')
    expect(adapter.expectationResultHandler).toBeCalledWith('foobar')
})

test('expectationResultHandler', () => {
    const origHandler = jest.fn()
    const config = { jasmineOpts: { expectationResultHandler: jest.fn() } }
    const adapter = adapterFactory(config)

    const resultHandler = adapter.expectationResultHandler(origHandler)
    // @ts-ignore mock feature
    resultHandler(true, 'foobar')
    expect(config.jasmineOpts.expectationResultHandler).toBeCalledWith(true, 'foobar')
    expect(origHandler).toBeCalledWith(true, 'foobar')
})

test('expectationResultHandler failing', () => {
    const origHandler = jest.fn()
    const err = new Error('uuups')
    const config = { jasmineOpts: { expectationResultHandler: () => {
        throw err
    } } }
    const adapter = adapterFactory(config)

    const resultHandler = adapter.expectationResultHandler(origHandler)
    // @ts-ignore mock feature
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
    const config = { jasmineOpts: { expectationResultHandler: () => {
        throw new Error('uuups')
    } } }
    const adapter = adapterFactory(config)

    const resultHandler = adapter.expectationResultHandler(origHandler)
    // @ts-ignore mock feature
    resultHandler(false, 'foobar')
    expect(origHandler).toBeCalledWith(false, 'foobar')
})

test('prepareMessage', () => {
    const adapter = adapterFactory()
    adapter.formatMessage = (params) => params
    adapter['_jrunner'] = {} as any
    adapter['_jrunner']!.specFiles = ['/some/path.test.js']
    adapter['_lastSpec'] = { foo: 'bar' } as any
    adapter['_lastTest'] = { bar: 'foo' } as any

    const msg = adapter.prepareMessage('beforeSuite')
    expect(msg.type).toBe('beforeSuite')
    // @ts-ignore overwritten formatMessage
    expect(msg.payload.file).toBe('/some/path.test.js')
    // @ts-ignore overwritten formatMessage
    expect(msg.payload.foo).toBe('bar')

    const msgSpec = adapter.prepareMessage('beforeTest')
    expect(msgSpec.type).toBe('beforeTest')
    // @ts-ignore overwritten formatMessage
    expect(msgSpec.payload.file).toBe('/some/path.test.js')
    // @ts-ignore overwritten formatMessage
    expect(msgSpec.payload.bar).toBe('foo')
})

describe('_grep', () => {
    test('should increase totalTests counter if test is not filtered by grep', () => {
        const adapter = adapterFactory()
        expect(adapter['_totalTests']).toBe(0)

        adapter.customSpecFilter = jest.fn().mockImplementation(spec => !!spec.disable)

        adapter._grep({
            children: [
                { disable: false }, { disable: true },
                { children: [{ disable: true }] }]
        } as any)
        expect(adapter['_totalTests']).toBe(2)
    })
})

describe('loadFiles', () => {
    it('should throw an error if jasmine runner is not defined', () => {
        const adapter = adapterFactory({})
        expect(adapter._loadFiles.bind(adapter)).toThrow()
    })

    test('should set _hasTests to true if there are tests to run', () => {
        const adapter = adapterFactory({})
        // @ts-ignore test scenario
        delete adapter['_hasTests']
        adapter['_jrunner'] = {} as any
        // @ts-ignore outdated types
        adapter['_jrunner']!.loadRequires = jest.fn()
        adapter['_jrunner']!.loadHelpers = jest.fn()
        adapter['_jrunner']!.loadSpecs = jest.fn()
        // @ts-ignore outdated types
        adapter['_jrunner']!.env = { topSuite () { return { children: [1] } } }

        adapter._loadFiles()

        // @ts-ignore outdated types
        expect(adapter['_jrunner']!.loadRequires).toBeCalled()
        expect(adapter['_jrunner']!.loadHelpers).toBeCalled()
        expect(adapter['_jrunner']!.loadSpecs).toBeCalled()
        expect(adapter['_hasTests']).toBe(true)
    })

    test('should set _hasTests to false if there no tests to run', () => {
        const adapter = adapterFactory()
        // @ts-ignore test scenario
        delete adapter['_hasTests']
        adapter['_jrunner'] = {} as any
        adapter['_jasmineOpts'].requires = ['r']
        adapter['_jasmineOpts'].helpers = ['h']
        // @ts-ignore outdated types
        adapter['_jrunner']!.addRequires = jest.fn()
        // @ts-ignore outdated types
        adapter['_jrunner']!.addHelperFiles = jest.fn()
        // @ts-ignore outdated types
        adapter['_jrunner']!.loadRequires = jest.fn()
        adapter['_jrunner']!.loadHelpers = jest.fn()
        adapter['_jrunner']!.loadSpecs = jest.fn()
        // @ts-ignore outdated types
        adapter['_jrunner']!.env = { topSuite() { return { children: [] } } }

        adapter._loadFiles()

        // @ts-ignore outdated types
        expect(adapter['_jrunner']!.addRequires).toHaveBeenCalledWith(adapter['_jasmineOpts'].requires)
        // @ts-ignore outdated types
        expect(adapter['_jrunner']!.addHelperFiles).toHaveBeenCalledWith(adapter['_jasmineOpts'].helpers)
        expect(adapter['_hasTests']).toBe(false)
    })

    test('should not fail on exception', () => {
        const adapter = adapterFactory()
        adapter['_jrunner'] = {} as any
        // @ts-ignore test scenario
        delete adapter['_hasTests']

        // @ts-ignore outdated types
        adapter['_jrunner']!.loadRequires = jest.fn().mockImplementation(() => { throw new Error('foo') }),

        adapter._loadFiles()
        // @ts-ignore outdated types
        expect(adapter['_jrunner']!.loadRequires).toBeCalled()
        expect(adapter['_hasTests']).toBe(undefined)
    })
})

describe('hasTests', () => {
    test('should return flag result', () => {
        const adapter = adapterFactory()
        adapter['_hasTests'] = true
        expect(adapter.hasTests()).toBe(true)
        adapter['_hasTests'] = false
        expect(adapter.hasTests()).toBe(false)
    })
})

afterEach(() => {
    (setOptions as jest.Mock).mockClear()
    ;(runTestInFiberContext as jest.Mock).mockClear()
    ;(executeHooksWithArgs as jest.Mock).mockClear()
})
