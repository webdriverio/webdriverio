import path from 'path'
import Mocha from 'mocha'
import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/utils'
import { setOptions } from 'expect-webdriverio'

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
const adapterFactory = (config) => new MochaAdapter(
    '0-2',
    { ...config },
    ['/foo/bar.test.js'],
    { browserName: 'chrome' },
    wdioReporter
)

beforeEach(() => {
    wdioReporter.write.mockReset()
    wdioReporter.emit.mockReset()
    wdioReporter.on.mockReset()
})

test('comes with a factory', async () => {
    expect(typeof MochaAdapterFactory.init).toBe('function')
    const instance = await MochaAdapterFactory.init(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await instance.run()
    expect(result).toBe(0)
})

test('should properly set up mocha', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(setOptions).toBeCalledTimes(1)
    expect(adapter.mocha.loadFiles).not.toBeCalled()
    expect(adapter.mocha.loadFilesAsync).toBeCalled()
    expect(adapter.mocha.reporter).toBeCalled()
    expect(adapter.mocha.fullTrace).toBeCalled()
    expect(adapter.mocha.run).toBeCalled()
    expect(executeHooksWithArgs.mock.calls).toHaveLength(1)
    expect(adapter.mocha.runner.on.mock.calls).toHaveLength(Object.keys(EVENTS).length)
    expect(adapter.mocha.runner.suite.beforeAll).toBeCalled()
    expect(adapter.mocha.runner.suite.beforeEach).not.toBeCalled()
    expect(adapter.mocha.runner.suite.afterEach).not.toBeCalled()
    expect(adapter.mocha.runner.suite.afterAll).toBeCalled()

    expect(adapter.mocha.addFile).toBeCalledWith('/foo/bar.test.js')
})

test('should return amount of errors', async () => {
    const adapter = adapterFactory({ mochaOpts: { mockFailureCount: 42 } })
    await adapter.init()
    const result = await adapter.run()
    expect(result).toBe(42)
})

test('should throw runtime error if spec is invalid', async () => {
    const runtimeError = new Error('Uuups')
    const adapter = adapterFactory({ mochaOpts: { mockRuntimeError: runtimeError } })
    await adapter.init()
    await expect(adapter.run()).rejects.toEqual(runtimeError)
})

test('should throw runtime error if spec could not be loaded', async () => {
    const runtimeError = new Error('Uuups')
    const adapter = adapterFactory({ mochaOpts: { mockFailureCount: 0 } })
    await adapter.init()
    adapter.specLoadError = runtimeError
    await expect(adapter.run()).rejects.toEqual(runtimeError)
})

test('options', () => {
    const adapter = adapterFactory()
    adapter.requireExternalModules = jest.fn()
    adapter.options({
        require: 'foo/bar.js',
        compilers: ['the/compiler.js']
    }, 'context')
    expect(adapter.requireExternalModules).toBeCalledWith(['the/compiler.js', 'foo/bar.js'], 'context')
})

test('preRequire', () => {
    const mochaOpts = { foo: 'bar', ui: 'tdd' }
    const adapter = adapterFactory({ mochaOpts, beforeHook: 'beforeHook123', afterHook: 'afterHook123', beforeTest: 'beforeTest234', afterTest: 'afterTest234' })
    adapter.preRequire('context', 'file', 'mocha')
    expect(runTestInFiberContext).toBeCalledWith(false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'suiteSetup', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'setup', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(true, 'beforeTest234', expect.any(Function), 'afterTest234', expect.any(Function), 'test', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'suiteTeardown', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'teardown', '0-2')

    const hookArgsFn = runTestInFiberContext.mock.calls[0][2]
    expect(hookArgsFn({ test: { foo: 'bar', parent: { title: 'parent' } } }))
        .toEqual([{ foo: 'bar', parent: 'parent' }, { test: { foo: 'bar', parent: { title: 'parent' } } }])
})

test('custom ui', () => {
    const mochaOpts = { ui: 'custom-qunit' }
    const adapter = adapterFactory({ mochaOpts })
    adapter.preRequire('context', 'file', 'mocha')
    expect(runTestInFiberContext).toBeCalledWith(false, undefined, expect.any(Function), undefined, expect.any(Function), 'after', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(false, undefined, expect.any(Function), undefined, expect.any(Function), 'afterEach', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(false, undefined, expect.any(Function), undefined, expect.any(Function), 'beforeEach', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(false, undefined, expect.any(Function), undefined, expect.any(Function), 'before', '0-2')
})

test('wrapHook if successful', async () => {
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll')

    executeHooksWithArgs.mockImplementation((...args) => Promise.resolve(args))
    await wrappedHook()
    expect(executeHooksWithArgs.mock.calls[0][0]).toBe('somehook')
    expect(executeHooksWithArgs.mock.calls[0][1].type).toBe('beforeAll')
})

test('wrapHook if failing', async () => {
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll')

    executeHooksWithArgs.mockImplementation(() => Promise.reject(new Error('uuuups')))
    await wrappedHook()
    expect(executeHooksWithArgs.mock.calls[0][0]).toBe('somehook')
    expect(executeHooksWithArgs.mock.calls[0][1].type).toBe('beforeAll')
    expect(logger().error.mock.calls[0][0].startsWith('Error in beforeAll hook: uuuups')).toBe(true)
})

test('prepareMessage', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    adapter.lastError = new Error('uuups')
    let result = adapter.prepareMessage('beforeSuite')
    expect(result.type).toBe('beforeSuite')
    expect(result.error.message).toBe('uuups')

    adapter.runner.test = { title: 'foobar', file: '/foo/bar.test.js' }
    result = adapter.prepareMessage('afterTest')
    expect(result.type).toBe('afterTest')
    expect(result.title).toBe('foobar')
    expect(result.file).toBe('/foo/bar.test.js')
})

describe('formatMessage', () => {
    test('should do nothing if no error or params are given', () => {
        const adapter = adapterFactory()
        let params = { type: 'foobar' }
        let message = adapter.formatMessage(params)
        expect(message).toMatchSnapshot()
    })

    test('should format an error message', () => {
        const adapter = adapterFactory()
        const params = { type: 'foobar', err: new Error('uups') }
        const message = adapter.formatMessage(params)

        // delete stack to avoid differences in stack paths
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format an error message with timeout error', () => {
        const adapter = adapterFactory()
        const params = {
            type: 'foobar',
            payload: {
                title: 'barfoo',
                parent: { title: 'parentfoo' }
            },
            err: new Error('For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.')
        }
        const message = adapter.formatMessage(params)

        // delete stack to avoid differences in stack paths
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format payload', () => {
        const adapter = adapterFactory()
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: 'parentfoo' },
            context: 'some context',
            ctx: { currentTest: { title: 'current test' } },
            file: '/foo/bar.test.js'
        } }
        const message = adapter.formatMessage(params)
        expect(message).toMatchSnapshot()
    })

    test('should format parent title', () => {
        const adapter = adapterFactory()
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: '', suites: [{ title: 'first suite' }] }
        } }
        const message = adapter.formatMessage(params)
        expect(message.parent).toEqual('')
    })

    test('should use fullTitle function if given', () => {
        const adapter = adapterFactory()
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: {},
            fullTitle: () => 'full title'
        } }
        const message = adapter.formatMessage(params)
        expect(message.fullTitle).toEqual('full title')
    })

    test('should format test status', () => {
        const adapter = adapterFactory()
        const params = { type: 'afterTest', payload: {
            title: 'barfoo',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = adapter.formatMessage(params)
        expect(message.passed).toBe(false)
        expect(message.duration).toBe(123)
    })
})

test('requireExternalModules', () => {
    const adapter = adapterFactory()
    adapter.requireExternalModules(['/foo/bar.js', null, './bar/foo.js'], { myContext: 123 })
    expect(loadModule).toBeCalledWith('/foo/bar.js', { myContext: 123 })
    expect(loadModule).toBeCalledWith(path.resolve(__dirname, '..', '..', '..', 'bar', 'foo.js'), { myContext: 123 })
})

test('emit does not emit anything on root level', () => {
    const adapter = adapterFactory()
    adapter.emit(null, { root: true })
    expect(wdioReporter.emit).not.toBeCalled()
})

test('emit properly reports to reporter', () => {
    const adapter = adapterFactory()
    adapter.getUID = () => 123
    adapter.emit(
        'suite:start',
        { title: 'foobar' },
        new Error('uups')
    )

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('suite:start')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
    expect(wdioReporter.emit.mock.calls[0][1].cid).toBe('0-2')
    expect(wdioReporter.emit.mock.calls[0][1].uid).toBe(123)
})

test('emits "before all"-hook errors as hook:end', () => {
    const adapter = adapterFactory()
    adapter.getUID = () => 123
    adapter.emit(
        'test:fail',
        { title: '"before all" hook' },
        new Error('uups')
    )

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('hook:end')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
})

test('emits "before each"-hook errors as hook:end', () => {
    const adapter = adapterFactory()
    adapter.getUID = () => 123
    adapter.emit(
        'test:fail',
        { title: '"before each" hook' },
        new Error('uups')
    )

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('hook:end')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
})

test('getUID', () => {
    const adapter = adapterFactory()

    // disabling indent eslint rule for better visibility
    /*eslint-disable indent */
    expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-0-0')
    expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-0-0')
    expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-0-1')
    expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-0-1')
    expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-0-0')
        expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-00-0')
        expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-00-0')
        expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-1-0')
            expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-2-0')
                expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-20-0')
                expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-20-0')
                expect(adapter.getUID({ type: 'test:start' })).toBe('test-20-0')
                expect(adapter.getUID({ type: 'test:pass' })).toBe('test-20-0')
                expect(adapter.getUID({ type: 'test:end' })).toBe('test-20-0')
                expect(adapter.getUID({ type: 'test:start' })).toBe('test-20-1')
                expect(adapter.getUID({ type: 'test:fail' })).toBe('test-20-1')
                expect(adapter.getUID({ type: 'test:end' })).toBe('test-20-1')
                expect(adapter.getUID({ type: 'test:pending' })).toBe('test-20-2')
                expect(adapter.getUID({ type: 'test:end' })).toBe('test-20-2')
                expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-20-1')
                expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-20-1')
            expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-2-0')
            expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-10-0')
            expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-10-0')
            expect(adapter.getUID({ type: 'test:start' })).toBe('test-10-0')
            expect(adapter.getUID({ type: 'test:fail' })).toBe('test-10-0')
            expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-10-1')
            expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-10-1')
            expect(adapter.getUID({ type: 'test:start' })).toBe('test-10-1')
            expect(adapter.getUID({ type: 'test:fail' })).toBe('test-10-1')
        expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-1-0')
        expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-1-1')
        expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-1-1')
        expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-1-2')
            expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-2-1')
            expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-2-1')
            expect(adapter.getUID({ type: 'hook:start' })).toBe('hook-12-0')
            expect(adapter.getUID({ type: 'hook:end' })).toBe('hook-12-0')
            expect(adapter.getUID({ type: 'test:start' })).toBe('test-12-0')
            expect(adapter.getUID({ type: 'test:fail' })).toBe('test-12-0')
            expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-2-2')
            expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-2-2')
        expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-1-2')
        expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-1-3')
        expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-1-3')
        expect(adapter.getUID({ type: 'suite:start' })).toBe('suite-1-4')
        expect(adapter.getUID({ type: 'test:start' })).toBe('test-14-0')
        expect(adapter.getUID({ type: 'test:fail' })).toBe('test-14-0')
        expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-1-4')
        expect(adapter.getUID({ type: 'test:start' })).toBe('test-00-0')
        expect(adapter.getUID({ type: 'test:fail' })).toBe('test-00-0')
    expect(adapter.getUID({ type: 'suite:end' })).toBe('suite-0-0')
    expect(() => adapter.getUID({ type: 'test:nonexisting' })).toThrow()
    /*eslint-enable indent */
})

describe('loadFiles', () => {
    test('should set _hasTests to true if there are tests to run', async () => {
        const adapter = adapterFactory({})
        adapter._hasTests = null
        adapter.mocha = {
            loadFilesAsync: jest.fn(),
            suite: 1 // mochaRunner.total
        }
        await adapter._loadFiles({})
        expect(adapter._hasTests).toBe(true)
    })

    test('should set _hasTests to false if there no tests to run', async () => {
        const adapter = adapterFactory({})
        adapter._hasTests = null
        adapter.mocha = {
            loadFilesAsync: jest.fn(),
            options: { grep: 'regexp foo' },
            suite: 0 // mochaRunner.total
        }
        await adapter._loadFiles({ grep: 'foo', invert: 'invert' })
        expect(Mocha.Runner.mock.results[0].value.grep).toBeCalledWith('regexp foo', 'invert')
        expect(adapter._hasTests).toBe(false)
    })

    test('should propagate error', async () => {
        const adapter = adapterFactory({})
        adapter._hasTests = null
        adapter.mocha = {
            loadFilesAsync: jest.fn().mockImplementation(
                () => Promise.reject(new Error('foo'))
            ),
        }
        await adapter._loadFiles({})
        expect(adapter.mocha.loadFilesAsync).toBeCalled()
        expect(adapter._hasTests).toBe(null)
        expect(adapter.specLoadError.message)
            .toContain('Unable to load spec files')
    })
})

describe('hasTests', () => {
    test('should return true if feature is not enabled', () => {
        const adapter = adapterFactory()
        adapter._hasTests = true
        expect(adapter.hasTests()).toBe(true)
        adapter._hasTests = false
        expect(adapter.hasTests()).toBe(false)
    })
})

afterEach(() => {
    Mocha.Runner.mockClear()
    runTestInFiberContext.mockReset()
    executeHooksWithArgs.mockReset()
    setOptions.mockClear()
})
