import path from 'path'
import logger from 'wdio-logger'
import { runTestInFiberContext, executeHooksWithArgs } from 'wdio-config'

import MochaAdapterFactory, { MochaAdapter } from '../src'
import { loadModule } from '../src/utils'
import { EVENTS } from '../src/constants'

jest.mock('../src/utils', () => ({
    loadModule: jest.fn()
}))

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

test('comes with a factory', async () => {
    expect(typeof MochaAdapterFactory.run).toBe('function')
    const result = await MochaAdapterFactory.run(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    expect(result).toBe(0)
})

test('should properly set up jasmine', async () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(adapter.mocha.loadFiles).toBeCalled()
    expect(adapter.mocha.reporter).toBeCalled()
    expect(adapter.mocha.fullTrace).toBeCalled()
    expect(adapter.mocha.run).toBeCalled()
    expect(executeHooksWithArgs.mock.calls).toHaveLength(2)
    expect(adapter.mocha.runner.on.mock.calls).toHaveLength(Object.keys(EVENTS).length)
    expect(adapter.mocha.runner.suite.beforeAll).toBeCalled()
    expect(adapter.mocha.runner.suite.beforeEach).toBeCalled()
    expect(adapter.mocha.runner.suite.afterEach).toBeCalled()
    expect(adapter.mocha.runner.suite.afterAll).toBeCalled()

    expect(adapter.mocha.addFile).toBeCalledWith('/foo/bar.test.js')
})

test('should return amount of errors', async () => {
    const adapter = new MochaAdapter(
        '0-2',
        { mochaOpts: { mockFailureCount: 42 } },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await adapter.run()
    expect(result).toBe(42)
})

test('should throw runtime error if spec is invalid', async () => {
    const runtimeError = new Error('Uuups')
    const adapter = new MochaAdapter(
        '0-2',
        { mochaOpts: { mockRuntimeError: runtimeError } },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    await expect(adapter.run()).rejects.toEqual(runtimeError)
})

test('options', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.requireExternalModules = jest.fn()
    adapter.options({
        require: 'foo/bar.js',
        compilers: ['the/compiler.js']
    }, 'context')
    expect(adapter.requireExternalModules).toBeCalledWith(['the/compiler.js', 'foo/bar.js'], 'context')
})

test('preRequire', () => {
    const mochaOpts = { foo: 'bar', ui: 'tdd' }
    const adapter = new MochaAdapter(
        '0-2',
        { mochaOpts, beforeHook: 'beforeHook123', afterHook: 'afterHook123' },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.preRequire('context', 'file', 'mocha')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], 'beforeHook123', 'afterHook123', 'suiteSetup')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], 'beforeHook123', 'afterHook123', 'setup')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], 'beforeHook123', 'afterHook123', 'test')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], 'beforeHook123', 'afterHook123', 'suiteTeardown')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], 'beforeHook123', 'afterHook123', 'teardown')
})

test('custom ui', () => {
    const mochaOpts = { ui: 'custom-qunit' }
    const adapter = new MochaAdapter(
        '0-2',
        { mochaOpts },
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.preRequire('context', 'file', 'mocha')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], undefined, undefined, 'after')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], undefined, undefined, 'afterEach')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], undefined, undefined, 'beforeEach')
    expect(runTestInFiberContext).toBeCalledWith(['test', 'test.only'], undefined, undefined, 'before')
})

test('wrapHook if successful', async () => {
    const config = { beforeAll: 'somehook' }
    const adapter = new MochaAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const wrappedHook = adapter.wrapHook('beforeAll')

    executeHooksWithArgs.mockImplementation((...args) => Promise.resolve(args))
    await wrappedHook()
    expect(executeHooksWithArgs.mock.calls[0][0]).toBe('somehook')
    expect(executeHooksWithArgs.mock.calls[0][1].type).toBe('beforeAll')
})

test('wrapHook if failing', async () => {
    const config = { beforeAll: 'somehook' }
    const adapter = new MochaAdapter(
        '0-2',
        config,
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const wrappedHook = adapter.wrapHook('beforeAll')

    executeHooksWithArgs.mockImplementation(() => Promise.reject(new Error('uuuups')))
    await wrappedHook()
    expect(executeHooksWithArgs.mock.calls[0][0]).toBe('somehook')
    expect(executeHooksWithArgs.mock.calls[0][1].type).toBe('beforeAll')
    expect(logger().error.mock.calls[0][0].startsWith('Error in beforeAll hook: uuuups')).toBe(true);
})

test('prepareMessage', async () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    await adapter.run()

    adapter.lastError = new Error('uuups')
    let result = adapter.prepareMessage('beforeSuite')
    expect(result.type).toBe('beforeSuite')
    expect(result.error.message).toBe('uuups')

    adapter.runner.test = { title: 'foobar' }
    result = adapter.prepareMessage('afterTest')
    expect(result.type).toBe('afterTest')
    expect(result.title).toBe('foobar')
})

test('formatMessage', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )

    let params = { type: 'foobar' }
    let message = adapter.formatMessage(params)
    expect(message).toEqual(params)

    params = { type: 'foobar', err: new Error('uups') }
    message = adapter.formatMessage(params)
    expect(message.error.message).toEqual('uups')
    expect(message.error.type).toEqual('Error')

    params = { type: 'foobar', payload: {
        title: 'barfoo',
        parent: { title: 'parentfoo' },
        context: 'some context',
        ctx: { currentTest: { title: 'current test' } }
    } }
    message = adapter.formatMessage(params)
    expect(message.title).toEqual('barfoo')
    expect(message.parent).toEqual('parentfoo')
    expect(message.currentTest).toEqual('current test')
    expect(message.fullTitle).toBe('parentfoo barfoo')

    params = { type: 'foobar', payload: {
        title: 'barfoo',
        parent: { title: '', suites: [{ title: 'first suite' }] }
    } }
    message = adapter.formatMessage(params)
    expect(message.parent).toEqual('first suite')

    params = { type: 'foobar', payload: {
        title: 'barfoo',
        parent: {},
        fullTitle: () => 'full title'
    } }
    message = adapter.formatMessage(params)
    expect(message.fullTitle).toEqual('full title')

    params = { type: 'afterTest', payload: {
        title: 'barfoo',
        parent: {},
        state: 'failed',
        duration: 123
    } }
    message = adapter.formatMessage(params)
    expect(message.passed).toBe(false)
    expect(message.duration).toBe(123)
})

test('requireExternalModules', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.requireExternalModules(['/foo/bar.js', null, './bar/foo.js'], { myContext: 123 })
    expect(loadModule).toBeCalledWith('/foo/bar.js', { myContext: 123 })
    expect(loadModule).toBeCalledWith(path.resolve(__dirname, '..', '..', '..', 'bar', 'foo.js'), { myContext: 123 })
})

test('emit does not emit anything on root level', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.emit(null, { root: true })
    expect(wdioReporter.emit).not.toBeCalled()
})

test('emit properly reports to reporter', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.formatMessage = () => ({ error: new Error('uups') })
    adapter.generateUID = () => ({ uid: 123, parentUid: 456 })
    adapter.emit('suite:start', {})

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('suite:start')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
    expect(wdioReporter.emit.mock.calls[0][1].cid).toBe('0-2')
    expect(wdioReporter.emit.mock.calls[0][1].uid).toBe(123)
})

test('generateUID', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.getUID = (...args) => args

    let result = adapter.generateUID({ type: 'suite:start', title: 'foobar' })
    expect(result.uid).toEqual([ 'foobar', 'suite', true ])
    expect(result.parentUid).toEqual([ 'foobar', 'suite', true ])

    result = adapter.generateUID({ type: 'suite:end', title: 'foobar' })
    expect(result.uid).toEqual([ 'foobar', 'suite' ])
    expect(result.parentUid).toEqual([ 'foobar', 'suite' ])

    result = adapter.generateUID({ type: 'hook:start', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'hook', true ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    result = adapter.generateUID({ type: 'hook:end', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'hook' ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    result = adapter.generateUID({ type: 'test:start', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'test', true ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    result = adapter.generateUID({ type: 'test:pending', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'test' ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    result = adapter.generateUID({ type: 'test:end', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'test' ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    result = adapter.generateUID({ type: 'test:pass', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'test' ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    result = adapter.generateUID({ type: 'test:fail', title: 'foobar', parent: 'barfoo' })
    expect(result.uid).toEqual([ 'foobar', 'test' ])
    expect(result.parentUid).toEqual([ 'barfoo', 'suite' ])

    expect(() => adapter.generateUID({ type: 'test:nonexisting' })).toThrow()
})

test('getUID', () => {
    const adapter = new MochaAdapter(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    expect(adapter.getUID('foobar', 'test')).toBe('foobar0')
    expect(adapter.getUID('foobar', 'test')).toBe('foobar0')
    expect(adapter.getUID('foobarloo', 'test')).toBe('foobarloo1')
    expect(adapter.getUID('foobarloo', 'test', true)).toBe('foobarloo2')
})

afterEach(() => {
    runTestInFiberContext.mockReset()
    executeHooksWithArgs.mockReset()
})
