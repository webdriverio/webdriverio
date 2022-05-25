import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import Mocha from 'mocha'
import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/utils'
import { setOptions } from 'expect-webdriverio'

import MochaAdapterFactory, { MochaAdapter } from '../src'
import { loadModule } from '../src/utils'
import { EVENTS } from '../src/constants'

vi.mock('mocha')
vi.mock('@wdio/utils')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('expect-webdriverio')
vi.mock('../src/utils', () => ({
    loadModule: vi.fn()
}))

const wdioReporter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn()
} as const
const adapterFactory = (config: any) => new MochaAdapter(
    '0-2',
    { ...config },
    ['/foo/bar.test.js'],
    { browserName: 'chrome' },
    wdioReporter as any
)

beforeEach(() => {
    wdioReporter.write.mockReset()
    wdioReporter.emit.mockReset()
    wdioReporter.on.mockReset()
})

test('comes with a factory', async () => {
    expect(typeof MochaAdapterFactory.init).toBe('function')
    const instance = await MochaAdapterFactory.init!(
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
    // @ts-ignore params not needed for test scenario
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(setOptions).toBeCalledTimes(1)
    expect(adapter['_mocha']!['loadFiles']).not.toBeCalled()
    expect(adapter['_mocha']!.loadFilesAsync).toBeCalled()
    expect(adapter['_mocha']!.reporter).toBeCalled()
    expect(adapter['_mocha']!.fullTrace).toBeCalled()
    expect(adapter['_mocha']!.run).toBeCalled()
    expect(vi.mocked(executeHooksWithArgs).mock.calls).toHaveLength(1)

    // @ts-ignore outdated types
    const runner = adapter['_mocha']!['runner']
    expect(runner.on.mock.calls).toHaveLength(Object.keys(EVENTS).length)
    expect(runner.suite.beforeAll).toBeCalled()
    expect(runner.suite.beforeEach).not.toBeCalled()
    expect(runner.suite.afterEach).not.toBeCalled()
    expect(runner.suite.afterAll).toBeCalled()

    expect(adapter['_mocha']!.addFile).toBeCalledWith('/foo/bar.test.js')
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
    adapter['_specLoadError'] = runtimeError
    await expect(adapter.run()).rejects.toEqual(runtimeError)
})

test('options', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    adapter.requireExternalModules = vi.fn()
    adapter.options({
        require: ['foo/bar.js'],
        compilers: ['the/compiler.js']
    }, 'context' as any)
    expect(adapter.requireExternalModules).toBeCalledWith(['the/compiler.js', 'foo/bar.js'], 'context')
})

test('preRequire', () => {
    const mochaOpts = { foo: 'bar', ui: 'tdd' }
    const adapter = adapterFactory({ mochaOpts, beforeHook: 'beforeHook123', afterHook: 'afterHook123', beforeTest: 'beforeTest234', afterTest: 'afterTest234' })
    adapter.preRequire('context' as any, 'file', 'mocha' as any)
    expect(runTestInFiberContext).toBeCalledWith(
        false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'suiteSetup', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'setup', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        true, 'beforeTest234', expect.any(Function), 'afterTest234', expect.any(Function), 'test', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'suiteTeardown', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'teardown', '0-2')

    const hookArgsFn = vi.mocked(runTestInFiberContext).mock.calls[0][2]
    expect(hookArgsFn({ test: { foo: 'bar', parent: { title: 'parent' } } }))
        .toEqual([{ foo: 'bar', parent: 'parent' }, { test: { foo: 'bar', parent: { title: 'parent' } } }])
})

test('custom ui', () => {
    const mochaOpts = { ui: 'custom-qunit' }
    const adapter = adapterFactory({ mochaOpts })
    adapter.preRequire('context' as any, 'file', 'mocha' as any)
    expect(runTestInFiberContext).toBeCalledWith(
        false, undefined, expect.any(Function), undefined, expect.any(Function), 'after', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        false, undefined, expect.any(Function), undefined, expect.any(Function), 'afterEach', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        false, undefined, expect.any(Function), undefined, expect.any(Function), 'beforeEach', '0-2')
    expect(runTestInFiberContext).toBeCalledWith(
        false, undefined, expect.any(Function), undefined, expect.any(Function), 'before', '0-2')
})

test('wrapHook if successful', async () => {
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll' as any)

    vi.mocked(executeHooksWithArgs).mockImplementation((...args: any[]) => Promise.resolve(args))
    await wrappedHook()
    expect(vi.mocked(executeHooksWithArgs).mock.calls[0][0]).toBe('beforeAll')
    expect(vi.mocked(executeHooksWithArgs).mock.calls[0][1]).toBe('somehook')
    expect((vi.mocked(executeHooksWithArgs).mock.calls[0][2] as any)[0].type).toBe('beforeAll')
})

test('wrapHook if failing', async () => {
    const config = { beforeAll: 'somehook' }
    const adapter = adapterFactory(config)
    const wrappedHook = adapter.wrapHook('beforeAll' as any)

    vi.mocked(executeHooksWithArgs).mockImplementation(() => Promise.reject(new Error('uuuups')))
    await wrappedHook()
    expect(vi.mocked(executeHooksWithArgs).mock.calls[0][0])
        .toBe('beforeAll')
    expect(vi.mocked(executeHooksWithArgs).mock.calls[0][1])
        .toBe('somehook')
    expect((vi.mocked(executeHooksWithArgs).mock.calls[0][2] as any)[0].type)
        .toBe('beforeAll')
    expect(vi.mocked(logger('').error).mock.calls[0][0]
        .startsWith('Error in beforeAll hook: uuuups')).toBe(true)
})

test('prepareMessage', async () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    let result = adapter.prepareMessage('beforeSuite')
    expect(result.type).toBe('beforeSuite')

    adapter['_runner']!.test = { title: 'foobar', file: '/foo/bar.test.js' } as any
    result = adapter.prepareMessage('afterTest')
    expect(result.type).toBe('afterTest')
    expect(result.title).toBe('foobar')
    expect(result.file).toBe('/foo/bar.test.js')
    adapter['_suiteStartDate'] = Date.now() - 5000
    result = adapter.prepareMessage('afterSuite')
    expect(result.type).toBe('afterSuite')
    expect(result.title).toBe('first suite')
    expect(result.duration).toBeDefined()
    expect(result.duration! >= 5000 && result.duration! <= 5020).toBeTruthy()
})

describe('formatMessage', () => {
    test('should do nothing if no error or params are given', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        let params = { type: 'foobar' }
        let message = adapter.formatMessage(params as any)
        expect(message).toMatchSnapshot()
    })

    test('should format an error message', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'foobar', err: new Error('uups') }
        const message = adapter.formatMessage(params as any)

        // delete stack to avoid differences in stack paths
        // @ts-ignore test scenario
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format an error message with timeout error', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = {
            type: 'foobar',
            payload: {
                title: 'barfoo',
                parent: { title: 'parentfoo' }
            },
            err: new Error('For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.')
        }
        const message = adapter.formatMessage(params as any)

        // delete stack to avoid differences in stack paths
        // @ts-ignore test scenario
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format payload', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: 'parentfoo' },
            context: 'some context',
            ctx: { currentTest: { title: 'current test' } },
            file: '/foo/bar.test.js'
        } }
        const message = adapter.formatMessage(params as any)
        expect(message).toMatchSnapshot()
    })

    test('should format parent title', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: '', suites: [{ title: 'first suite' }] }
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.parent).toEqual('')
    })

    test('should format fullTitle', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: {
                title: 'Parent 2',
                parent: {
                    title: 'Parent 1'
                }
            }
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.fullTitle).toEqual('Parent 1.Parent 2.barfoo')
    })

    test('should format test status', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'afterTest', payload: {
            title: 'barfoo',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.passed).toBe(false)
        expect(message.duration).toBe(123)
    })

    test('should format title for mocha beforeAll hook if parent title is present', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'beforeAll', payload: {
            title: '"before all" hook',
            parent: {
                title: 'WebdriverIO'
            },
            state: 'failed',
            duration: 123
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.title).toBe('"before all" hook for WebdriverIO')
    })

    test('should not format title for mocha beforeAll hook if parent title is not present', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'beforeAll', payload: {
            title: '"before all" hook',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.title).toBe('"before all" hook')
    })

    test('should format title for mocha afterAll hook if parent title is present', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'afterAll', payload: {
            title: '"after all" hook',
            parent: {
                title: 'WebdriverIO'
            },
            state: 'failed',
            duration: 123
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.title).toBe('"after all" hook for WebdriverIO')
    })

    test('should not format title for mocha afterAll hook if parent title is not present', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        const params = { type: 'afterAll', payload: {
            title: '"after all" hook',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = adapter.formatMessage(params as any)
        expect(message.title).toBe('"after all" hook')
    })
})

test('requireExternalModules', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    // @ts-ignore test invalid params
    adapter.requireExternalModules(['/foo/bar.js', null, './bar/foo.js'], { myContext: 123 } as any)
    expect(loadModule).toBeCalledWith('/foo/bar.js', { myContext: 123 })
    expect(loadModule).toBeCalledWith(path.resolve(__dirname, '..', '..', '..', 'bar', 'foo.js'), { myContext: 123 })
})

test('emit does not emit anything on root level', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    // @ts-ignore test invalid params
    adapter.emit(null, { root: true })
    expect(wdioReporter.emit).not.toBeCalled()
})

test('emit properly reports to reporter', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    adapter.getUID = () => '123'
    adapter.emit(
        'suite:start',
        { title: 'foobar' },
        new Error('uups') as any
    )

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('suite:start')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
    expect(wdioReporter.emit.mock.calls[0][1].cid).toBe('0-2')
    expect(wdioReporter.emit.mock.calls[0][1].uid).toBe('123')
})

test('emits "before all"-hook errors as hook:end', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    adapter.getUID = () => '123'
    adapter.emit(
        'test:fail',
        { title: '"before all" hook' },
        new Error('uups') as any
    )

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('hook:end')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
})

test('emits "before each"-hook errors as hook:end', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    adapter.getUID = () => '123'
    adapter.emit(
        'test:fail',
        { title: '"before each" hook' },
        new Error('uups') as any
    )

    expect(wdioReporter.emit.mock.calls[0][0]).toBe('hook:end')
    expect(wdioReporter.emit.mock.calls[0][1].error.message).toBe('uups')
})

test('getUID', () => {
    // @ts-ignore params not needed for test scenario
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
        adapter['_hasTests'] = false
        adapter['_mocha']! = {
            loadFilesAsync: vi.fn(),
            suite: 1 // mochaRunner.total
        } as any
        await adapter._loadFiles({})
        expect(adapter['_hasTests']).toBe(true)
    })

    test('should set _hasTests to false if there no tests to run', async () => {
        const adapter = adapterFactory({})
        adapter['_hasTests'] = false
        adapter['_mocha']! = {
            loadFilesAsync: vi.fn(),
            options: { grep: 'regexp foo' },
            suite: 0 // mochaRunner.total
        } as any
        await adapter._loadFiles({ grep: 'foo', invert: 'invert' as any })
        expect(vi.mocked(Mocha.Runner).mock.results[0].value.grep).toBeCalledWith('regexp foo', 'invert')
        expect(adapter['_hasTests']).toBe(false)
    })

    test('should propagate error', async () => {
        const adapter = adapterFactory({})
        // @ts-ignore test scenario
        delete adapter['_hasTests']
        adapter['_mocha']! = {
            loadFilesAsync: vi.fn().mockImplementation(
                () => Promise.reject(new Error('foo'))
            ),
        } as any
        await adapter._loadFiles({})
        expect(adapter['_mocha']!.loadFilesAsync).toBeCalled()
        expect(adapter['_hasTests']).toBe(undefined)
        expect(adapter['_specLoadError']!.message)
            .toContain('Unable to load spec files')
    })
})

describe('hasTests', () => {
    test('should return true if feature is not enabled', () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        adapter['_hasTests'] = true
        expect(adapter.hasTests()).toBe(true)
        adapter['_hasTests'] = false
        expect(adapter.hasTests()).toBe(false)
    })
})

afterEach(() => {
    vi.mocked(Mocha.Runner).mockClear()
    vi.mocked(runTestInFiberContext).mockReset()
    vi.mocked(executeHooksWithArgs).mockReset()
    vi.mocked(setOptions).mockClear()
})
