import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import logger from '@wdio/logger'
import { executeHooksWithArgs } from '@wdio/utils'
import { startTests } from '@vitest/runner'

import VitestAdapterFactory, { VitestAdapter } from '../src/index.js'
import { WDIOVitestRunner } from '../src/runner.js'

vi.mock('@vitest/runner')
vi.mock('@vitest/runner/utils', () => ({
    getTests: vi.fn().mockReturnValue([]),
    getSuites: vi.fn().mockReturnValue([]),
    hasTests: vi.fn().mockReturnValue(true),
}))
vi.mock('@wdio/utils')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.spyOn(WDIOVitestRunner.prototype, 'importFile').mockResolvedValue(undefined)

const wdioReporter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn()
} as const

const adapterFactory = (config: any = {}) => new VitestAdapter(
    '0-2',
    { rootDir: '/test', ...config },
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
    expect(typeof VitestAdapterFactory.init).toBe('function')
    const instance = await VitestAdapterFactory.init!(
        '0-2',
        {},
        ['/foo/bar.test.js'],
        { browserName: 'chrome' },
        wdioReporter
    )
    const result = await instance.run()
    expect(result).toBe(0)
})

test('should properly set up vitest adapter', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()
    expect(result).toBe(0)
    expect(vi.mocked(startTests)).toBeCalled()
    const hookNames = vi.mocked(executeHooksWithArgs).mock.calls.map((c: unknown[]) => c[0])
    expect(hookNames).toContain('beforeSuite')
    expect(hookNames).toContain('afterSuite')
    expect(hookNames).toContain('after')
})

test('should pass config options to runner', async () => {
    const adapter = adapterFactory({
        vitestOpts: {
            testTimeout: 30000,
            hookTimeout: 15000,
            retry: 2,
            maxConcurrency: 10,
            grep: 'my test',
        }
    })
    await adapter.init()

    const runner = adapter['_runner']!
    expect(runner.config.testTimeout).toBe(30000)
    expect(runner.config.hookTimeout).toBe(15000)
    expect(runner.config.retry).toBe(2)
    expect(runner.config.maxConcurrency).toBe(10)
    expect(runner.config.testNamePattern).toEqual(/my test/)
})

test('should use default config when no options provided', async () => {
    const adapter = adapterFactory()
    await adapter.init()

    const runner = adapter['_runner']!
    expect(runner.config.testTimeout).toBe(10000)
    expect(runner.config.hookTimeout).toBe(10000)
    expect(runner.config.retry).toBe(0)
    expect(runner.config.maxConcurrency).toBe(5)
    expect(runner.config.passWithNoTests).toBe(false)
    expect(runner.config.testNamePattern).toBeUndefined()
})

test('should support RegExp grep option', async () => {
    const adapter = adapterFactory({
        vitestOpts: {
            grep: /test pattern/i,
        }
    })
    await adapter.init()

    const runner = adapter['_runner']!
    expect(runner.config.testNamePattern).toEqual(/test pattern/i)
})

test('should call beforeSuite and afterSuite hooks', async () => {
    const adapter = adapterFactory({
        beforeSuite: vi.fn(),
        afterSuite: vi.fn(),
    })
    await adapter.init()
    await adapter.run()

    const hookCalls = vi.mocked(executeHooksWithArgs).mock.calls
    const beforeSuiteCall = hookCalls.find((c: any) => c[0] === 'beforeSuite')
    const afterSuiteCall = hookCalls.find((c: any) => c[0] === 'afterSuite')

    expect(beforeSuiteCall).toBeTruthy()
    expect(afterSuiteCall).toBeTruthy()
})

test('should call after hooks with results', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    await adapter.run()

    const afterCall = vi.mocked(executeHooksWithArgs).mock.calls.find(
        (c: any) => c[0] === 'after'
    )
    expect(afterCall).toBeTruthy()
    expect(afterCall![2]).toHaveLength(3)
})

test('should throw runtime error if startTests fails', async () => {
    const runtimeError = new Error('Runtime failure')
    vi.mocked(startTests).mockRejectedValueOnce(runtimeError)

    const adapter = adapterFactory()
    await adapter.init()
    await expect(adapter.run()).rejects.toEqual(runtimeError)
})

test('should throw spec load error', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    adapter['_specLoadError'] = new Error('Load error')
    await expect(adapter.run()).rejects.toEqual(new Error('Load error'))
})

test('should pass spec load error to after hook', async () => {
    const specError = new Error('Spec load error')
    const adapter = adapterFactory()
    await adapter.init()
    adapter['_specLoadError'] = specError
    await expect(adapter.run()).rejects.toEqual(specError)

    const afterCall = vi.mocked(executeHooksWithArgs).mock.calls.find(
        (c: unknown[]) => c[0] === 'after'
    )
    expect(afterCall).toBeTruthy()
    const afterArgs = afterCall![2] as unknown[]
    expect(afterArgs[0]).toBe(specError)
})

test('wrapHook if successful', async () => {
    const config = { beforeSuite: 'somehook' }
    const adapter = adapterFactory(config)
    await adapter.init()
    const wrappedHook = adapter.wrapHook('beforeSuite' as any)

    vi.mocked(executeHooksWithArgs).mockImplementation((...args: any[]) => Promise.resolve(args))
    await wrappedHook()
    const call = vi.mocked(executeHooksWithArgs).mock.calls[vi.mocked(executeHooksWithArgs).mock.calls.length - 1]
    expect(call[0]).toBe('beforeSuite')
    expect(call[1]).toBe('somehook')
    expect((call[2] as any)[0].type).toBe('beforeSuite')
    vi.mocked(executeHooksWithArgs).mockReset()
})

test('wrapHook if failing', async () => {
    const config = { beforeSuite: 'somehook' }
    const adapter = adapterFactory(config)
    await adapter.init()
    const wrappedHook = adapter.wrapHook('beforeSuite' as any)

    vi.mocked(executeHooksWithArgs).mockImplementation(() => Promise.reject(new Error('uuuups')))
    await wrappedHook()
    const call = vi.mocked(executeHooksWithArgs).mock.calls[vi.mocked(executeHooksWithArgs).mock.calls.length - 1]
    expect(call[0]).toBe('beforeSuite')
    expect(vi.mocked(logger('').error).mock.calls[0][0]
        .startsWith('Error in beforeSuite hook: uuuups')).toBe(true)
    vi.mocked(executeHooksWithArgs).mockReset()
})

describe('hasTests', () => {
    test('should return true by default', async () => {
        const adapter = adapterFactory()
        await adapter.init()
        expect(adapter.hasTests()).toBe(true)
    })
})

test('should handle file:// protocol in specs', async () => {
    const adapter = adapterFactory()
    adapter['_specs'] = ['file:///foo/bar.test.js']
    await adapter.init()
    await adapter.run()

    expect(vi.mocked(startTests)).toBeCalled()
    const specs = vi.mocked(startTests).mock.calls[0][0]
    expect(specs[0]).toBe('/foo/bar.test.js')
})

test('should set up global test methods', async () => {
    const adapter = adapterFactory({
        beforeTest: vi.fn(),
        afterTest: vi.fn(),
        beforeHook: vi.fn(),
        afterHook: vi.fn(),
    })
    await adapter.init()

    const g = globalThis as Record<string, unknown>
    expect(g.describe).toBeDefined()
    expect(g.it).toBeDefined()
    expect(g.test).toBeDefined()
    expect(g.beforeAll).toBeDefined()
    expect(g.afterAll).toBeDefined()
    expect(g.beforeEach).toBeDefined()
    expect(g.afterEach).toBeDefined()
})

test('should handle afterSuite duration', async () => {
    const adapter = adapterFactory()
    await adapter.init()
    adapter['_suiteStartDate'] = Date.now() - 5000
    const payload = adapter['_buildSuitePayload']('afterSuite')
    expect(payload.type).toBe('afterSuite')
    expect(payload.duration).toBeDefined()
    expect(payload.duration! >= 4900).toBeTruthy()
})

test('should handle _loadFiles error gracefully', async () => {
    const importError = new Error('Module not found')
    vi.spyOn(WDIOVitestRunner.prototype, 'importFile').mockRejectedValueOnce(importError)

    const adapter = adapterFactory()
    await adapter.init()

    expect(adapter.hasTests()).toBe(false)
    expect(adapter['_specLoadError']).toBeDefined()
    expect(adapter['_specLoadError']!.message).toContain('Unable to load spec files')
})

test('should support multiple spec files', async () => {
    const adapter = new VitestAdapter(
        '0-2',
        { rootDir: '/test' } as any,
        ['/foo/bar.test.js', '/foo/baz.test.js'],
        { browserName: 'chrome' },
        wdioReporter as any
    )
    await adapter.init()
    await adapter.run()

    const specArgs = vi.mocked(startTests).mock.calls[0][0]
    expect(specArgs).toHaveLength(2)
    expect(specArgs).toContain('/foo/bar.test.js')
    expect(specArgs).toContain('/foo/baz.test.js')
})

test('should handle beforeSuite hook error without crashing', async () => {
    vi.mocked(executeHooksWithArgs).mockRejectedValueOnce(new Error('hook error'))

    const adapter = adapterFactory()
    await adapter.init()
    const result = await adapter.run()
    expect(result).toBe(0)
})

test('should return failed count from runner', async () => {
    const adapter = adapterFactory()
    await adapter.init()

    vi.mocked(startTests).mockImplementationOnce(async (_specs, runner) => {
        (runner as any)._failedCount = 3
        return []
    })

    const result = await adapter.run()
    expect(result).toBe(3)
})

afterEach(() => {
    vi.mocked(startTests).mockReset()
    vi.mocked(startTests).mockResolvedValue([])
    vi.mocked(executeHooksWithArgs).mockReset()
})
