import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import url from 'node:url'
import path from 'node:path'
import Mocha from 'mocha'
import logger from '@wdio/logger'
import { wrapGlobalTestMethod, executeHooksWithArgs } from '@wdio/utils'

import MochaAdapterFactory, { MochaAdapter } from '../src/index.js'
import { EVENTS } from '../src/constants.js'
import { runParallelTests } from '../src/parallel.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

vi.mock('mocha')
vi.mock('@wdio/utils')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/parallel.js', () => ({
    runParallelTests: vi.fn().mockResolvedValue(0),
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
    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()
    expect(result).toBe(0)

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

test('should properly load mocha hooks', async () => {
    const adapter = adapterFactory({
        rootDir: __dirname,
        mochaOpts: {
            require: ['./__fixtures__/mochaHooks.js']
        }
    })
    await adapter.init()
    expect(adapter['_config'].mochaOpts).toEqual({
        require: ['./__fixtures__/mochaHooks.js'],
        failHookAffectedTests: true,
        rootHooks: {
            beforeAll: [],
            beforeEach: [expect.any(Function)],
            afterAll: [],
            afterEach: []
        }
    })
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

test('should pass error to hook if spec could not be loaded', async () => {
    const runtimeError = new Error('Uuups')
    const adapter = adapterFactory({ mochaOpts: { mockFailureCount: 0 } })
    await adapter.init()
    adapter['_specLoadError'] = runtimeError
    await expect(adapter.run()).rejects.toEqual(runtimeError)

    expect(vi.mocked(executeHooksWithArgs).mock.calls[0][0]).toBe('after')
    expect(vi.mocked(executeHooksWithArgs).mock.calls[0][2]).toHaveLength(3)
    expect((vi.mocked(executeHooksWithArgs).mock.calls[0][2] as any)[0]).toBe(runtimeError)
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

describe('prepareMessage', () => {
    test('should prepare a message', async () => {
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

    test('should prepare a message when suites array is empty', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        await adapter.init()
        await adapter.run()

        adapter['_runner']!.suite.suites = []
        adapter['_suiteStartDate'] = Date.now() - 5000

        const result = adapter.prepareMessage('afterSuite')
        expect(result.type).toBe('afterSuite')
        expect(result.title).toBeUndefined()
        expect(result.duration).toBeUndefined()
    })

    test('should fall back to _mocha.suite when _runner is unset (parallel mode)', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory()
        await adapter.init()
        // _runner is only set by the sequential mocha.run() path
        adapter['_mocha']!.suite = { suites: [{ title: 'parallel suite' }] } as any

        const result = adapter.prepareMessage('beforeSuite')
        expect(result.type).toBe('beforeSuite')
        expect(result.title).toBe('parallel suite')
    })
})

describe('parallel mode config hooks', () => {
    test('emits paired hook events around beforeSuite/afterSuite', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            const result = await adapter.run()
            expect(result).toBe(0)
        } finally {
            delete (globalThis as any).browser
        }

        const hookStarts = wdioReporter.emit.mock.calls.filter((c) => c[0] === 'hook:start')
        const hookEnds = wdioReporter.emit.mock.calls.filter((c) => c[0] === 'hook:end')

        // beforeSuite + afterSuite → two start/end pairs
        expect(hookStarts.length).toBe(2)
        expect(hookEnds.length).toBe(2)
        // the titles of the root-suite hooks of a sequential run
        expect(hookStarts.map((c) => c[1].title)).toEqual(['"before all" hook in "{root}"', '"after all" hook in "{root}"'])
        expect(hookEnds.map((c) => c[1].title)).toEqual(['"before all" hook in "{root}"', '"after all" hook in "{root}"'])
        expect(hookStarts[0][1].fullTitle).toBe('"before all" hook in "{root}"')
        expect(hookStarts[0][1].parent).toBe('')
        expect(hookStarts[0][1].type).toBe('hook:start')
        // start/end share a uid; afterSuite end carries duration + state
        expect(hookStarts[0][1].uid).toBe(hookEnds[0][1].uid)
        expect(hookStarts[1][1].uid).toBe(hookEnds[1][1].uid)
        expect(hookEnds[1][1].state).toBe('pass')
        expect(hookEnds[1][1].duration).toBeGreaterThanOrEqual(0)
        expect(runParallelTests).toBeCalledTimes(1)
    })

    test('sends the kind of the beforeSuite / afterSuite root hooks, and the uid of the hook:start on a failing hook:end', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any
        vi.mocked(executeHooksWithArgs).mockImplementation(async (hookName: string) => {
            if (hookName === 'beforeSuite' || hookName === 'afterSuite') {
                throw new Error(`${hookName} boom`)
            }
            return []
        })

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
            vi.mocked(executeHooksWithArgs).mockReset()
        }

        const hooks = wdioReporter.emit.mock.calls.filter((c) => c[0].startsWith('hook:')).map(([event, p]) => [event, p.uid, p.hookKind, p.state])
        expect(hooks).toEqual([
            ['hook:start', 'hook-0-0', 'beforeAll', undefined],
            ['hook:end', 'hook-0-0', 'beforeAll', 'fail'],
            ['hook:start', 'hook-0-1', 'afterAll', undefined],
            ['hook:end', 'hook-0-1', 'afterAll', 'fail']
        ])
        // the root suite has no suite event
        expect(wdioReporter.emit.mock.calls.some(([, p]) => 'hookSuiteUid' in p)).toBe(false)
    })

    test('titles beforeSuite/afterSuite with the first and the last test of the root suite, as Mocha does', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }], tests: [{ title: 'first' }, { title: 'last' }] } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
        }

        const hookStarts = wdioReporter.emit.mock.calls.filter((c) => c[0] === 'hook:start')
        expect(hookStarts.map((c) => c[1].title)).toEqual(['"before all" hook for "first"', '"after all" hook for "last"'])
    })

    test('beforeSuite hook:end does not leak its duration into the afterSuite payload', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        const rootSuite = { title: 'first suite' }
        adapter['_mocha']!.suite = { suites: [rootSuite] } as any
        const now = vi.spyOn(Date, 'now')
        now.mockReturnValue(1000)
        vi.mocked(executeHooksWithArgs).mockImplementationOnce(async () => {
            now.mockReturnValue(1500)
            return []
        })
        vi.mocked(runParallelTests).mockImplementationOnce(async () => {
            now.mockReturnValue(9000)
            return 0
        })

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
            now.mockRestore()
        }

        const hookEnds = wdioReporter.emit.mock.calls.filter((c) => c[0] === 'hook:end')
        const hookStarts = wdioReporter.emit.mock.calls.filter((c) => c[0] === 'hook:start')
        expect(hookEnds[0][1].duration).toBe(500)
        expect(hookStarts[1][1].duration).toBe(8000)
        expect(hookEnds[1][1].duration).toBe(8000)
    })
})

describe('parallel mode setBrowser', () => {
    test('uses the browser from setBrowser when globalThis.browser is unset', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any
        const browser = { isBidi: true, __bidiCommandsEnabled: true } as any
        adapter.setBrowser(browser)

        expect(await adapter.run()).toBe(0)
        expect(runParallelTests).toHaveBeenLastCalledWith(
            expect.anything(), browser, expect.anything(), expect.anything(), expect.anything(),
            undefined, expect.anything()
        )
    })

    test('throws when neither setBrowser nor globalThis.browser provides one', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        await expect(adapter.run()).rejects.toThrow('Parallel mode requires a browser instance')
    })
})

describe('parallel mode mocha options', () => {
    test('threads grep/invert/timeout into runParallelTests', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts', timeout: 5000, allowUncaught: true } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any
        adapter['_mocha']!.options = { grep: /beta/, invert: true } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            const result = await adapter.run()
            expect(result).toBe(0)
        } finally {
            delete (globalThis as any).browser
        }

        expect(runParallelTests).toBeCalledWith(
            expect.anything(), expect.anything(), expect.anything(), '0-2', ['/foo/bar.test.js'],
            undefined,
            { grep: /beta/, invert: true, timeout: 5000, mode: 'contexts', failHookAffectedTests: true, allowUncaught: true }
        )
    })

    test('passes parallelMode: userContexts through as mode', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'userContexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any
        vi.mocked(runParallelTests).mockClear()

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
        }

        expect(vi.mocked(runParallelTests).mock.calls[0][6]).toMatchObject({ mode: 'userContexts' })
    })

    test('interpolates the mode into the sequential-fallback warning', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'userContexts' } })
        await adapter.init()
        const warn = vi.mocked(logger('').warn)
        warn.mockClear()

        ;(globalThis as any).browser = { isBidi: false }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
        }

        expect(warn.mock.calls.some((c) => String(c[0]).includes('parallelMode: "userContexts"'))).toBe(true)
    })

    test('applies filterOnly when the suite has .only tests', async () => {
        const filterOnly = vi.fn()
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }], hasOnly: () => true, filterOnly } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
        }

        expect(filterOnly).toBeCalledTimes(1)
    })

    test('does not apply filterOnly without .only tests', async () => {
        const filterOnly = vi.fn()
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts' } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }], hasOnly: () => false, filterOnly } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await adapter.run()
        } finally {
            delete (globalThis as any).browser
        }

        expect(filterOnly).not.toBeCalled()
    })

    test('throws when bail is set', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts', bail: true } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await expect(adapter.run()).rejects.toThrow('bail is not supported in parallel mode')
        } finally {
            delete (globalThis as any).browser
        }
    })

    test('throws when retries is set', async () => {
        // @ts-ignore params not needed for test scenario
        const adapter = adapterFactory({ mochaOpts: { parallelMode: 'contexts', retries: 3 } })
        await adapter.init()
        adapter['_mocha']!.suite = { suites: [{ title: 'first suite' }] } as any

        ;(globalThis as any).browser = { isBidi: true, __bidiCommandsEnabled: true }
        try {
            await expect(adapter.run()).rejects.toThrow('retries is not supported in parallel mode')
        } finally {
            delete (globalThis as any).browser
        }
    })
})

test('emit does not emit anything on root level', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    // @ts-ignore test invalid params
    adapter.emit(null, { root: true })
    expect(wdioReporter.emit).not.toBeCalled()
})

test('emit ignores a second test:start for the test that is open', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    const t1 = { title: 't1', type: 'test' }
    const t2 = { title: 't2', type: 'test' }

    // failing beforeEach with failHookAffectedTests: Mocha 11.8+ sends `test` twice (mochajs/mocha#6442)
    adapter.emit('test:start', t1)
    adapter.emit('test:start', t1)
    adapter.emit('test:fail', t1, new Error('hook failed') as any)
    adapter.emit('test:end', t1)
    adapter.emit('test:start', t2)

    expect(wdioReporter.emit.mock.calls.map(([type, { uid }]) => [type, uid])).toEqual([
        ['test:start', 'test-0-0'],
        ['test:fail', 'test-0-0'],
        ['test:end', 'test-0-0'],
        ['test:start', 'test-0-1'],
    ])
})

test('emit gives an it.skip its own uid after a test that a failed beforeEach left open', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    const t1 = { title: 't1', type: 'test' }
    const t2 = { title: 't2', type: 'test' }

    // failHookAffectedTests: false: Mocha sends no `test end` for the test of a failed beforeEach
    adapter.emit('suite:start', { title: 'A' })
    adapter.emit('test:start', t1)
    adapter.emit('hook:start', { title: '"before each" hook', type: 'hook' })
    adapter.emit('hook:end', { title: '"before each" hook', type: 'hook' }, new Error('hook failed') as any)
    adapter.emit('suite:end', { title: 'A' })
    adapter.emit('suite:start', { title: 'B' })
    adapter.emit('test:pending', t2)
    adapter.emit('test:end', t2)

    expect(wdioReporter.emit.mock.calls
        .filter(([type]) => type.startsWith('test:'))
        .map(([type, { uid }]) => [type, uid])
    ).toEqual([
        ['test:start', 'test-00-0'],
        ['test:pending', 'test-01-0'],
        ['test:end', 'test-01-0'],
    ])
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

test('emit gives a test that this.skip() skips at runtime the uid of its test:start', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()
    const t1 = { title: 't1', type: 'test' }
    const t2 = { title: 't2', type: 'test' }
    const t3 = { title: 't3', type: 'test' }

    // this.skip() in the test or in beforeEach: Mocha sends test, pending, test end
    adapter.emit('test:start', t1)
    adapter.emit('hook:start', { title: '"before each" hook', type: 'hook' })
    adapter.emit('hook:end', { title: '"before each" hook', type: 'hook' })
    adapter.emit('test:pending', t1)
    adapter.emit('test:end', t1)
    // it.skip: Mocha sends pending and test end, with no test start
    adapter.emit('test:pending', t2)
    adapter.emit('test:end', t2)
    adapter.emit('test:start', t3)

    expect(wdioReporter.emit.mock.calls.map(([type, { uid }]) => [type, uid])).toEqual([
        ['test:start', 'test-0-0'],
        ['hook:start', 'hook-0-0'],
        ['hook:end', 'hook-0-0'],
        ['test:pending', 'test-0-0'],
        ['test:end', 'test-0-0'],
        ['test:pending', 'test-0-1'],
        ['test:end', 'test-0-1'],
        ['test:start', 'test-0-2'],
    ])
})

test('getUID', () => {
    // @ts-ignore params not needed for test scenario
    const adapter = adapterFactory()

    // disabling indent eslint rule for better visibility
    /* eslint-disable @stylistic/indent */
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
    /* eslint-enable @stylistic/indent */
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
        expect(adapter.hasTests()).toBe(true)
    })

    test('should set _hasTests to false if there no tests to run', async () => {
        const adapter = adapterFactory({})
        adapter['_hasTests'] = true
        adapter['_mocha']! = {
            loadFilesAsync: vi.fn(),
            options: { grep: 'regexp foo' },
            suite: 0 // mochaRunner.total
        } as any
        await adapter._loadFiles({ grep: 'foo', invert: 'invert' as any })
        expect(vi.mocked(Mocha.Runner).mock.results[0].value.grep).toBeCalledWith('regexp foo', 'invert')
        expect(adapter.hasTests()).toBe(false)
    })

    test('should propagate error', async () => {
        const adapter = adapterFactory({})
        adapter['_mocha']! = {
            loadFilesAsync: vi.fn().mockImplementation(
                () => Promise.reject(new Error('foo'))
            ),
        } as any
        await adapter._loadFiles({})
        expect(adapter['_mocha']!.loadFilesAsync).toBeCalled()
        expect(adapter.hasTests()).toBe(true)
        expect(adapter['_specLoadError']!.message)
            .toContain('Unable to load spec files')
    })

    test('should decorate file with esmDecorator', async () => {
        const adapter = adapterFactory({})

        adapter['_mocha']! = {
            loadFilesAsync: vi.fn()
        } as any

        await adapter._loadFiles({})

        expect(adapter['_mocha']!.loadFilesAsync).toBeCalled()

        const loadFilesOptions: any = vi.mocked(adapter['_mocha']!.loadFilesAsync).mock.lastCall?.at(0)
        expect(loadFilesOptions).toBeDefined()

        const mockFilePath = '/foo/bar.test.js'
        const decoratedFilePath = loadFilesOptions.esmDecorator(mockFilePath)

        expect(decoratedFilePath).toContain(mockFilePath)
        expect(decoratedFilePath).toContain('?invalidateCache=')
    })
})

afterEach(() => {
    vi.mocked(Mocha.Runner).mockClear()
    vi.mocked(wrapGlobalTestMethod).mockReset()
    vi.mocked(executeHooksWithArgs).mockReset()
})
