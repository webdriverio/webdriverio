import path from 'node:path'
import { expect, test, vi } from 'vitest'
import { executeHooksWithArgs } from '@wdio/utils'

import { JasmineAdapter } from '../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))

test('initializes against Jasmine 6 private Spec and Suite', async () => {
    const reporter = { emit: vi.fn(), on: vi.fn(), write: vi.fn() }
    const adapter = new JasmineAdapter(
        '0-0',
        { beforeHook: [], afterHook: [] } as any,
        [],
        { browserName: 'chrome' } as any,
        reporter as any
    )

    await expect(adapter.init()).resolves.toBe(adapter)
})

test('oneFailurePerSpec stops the spec after a failed sync expect', async () => {
    vi.mocked(executeHooksWithArgs).mockResolvedValue([])
    const reporter = { emit: vi.fn(), on: vi.fn(), write: vi.fn() }
    const adapter = new JasmineAdapter(
        '0-0',
        { beforeHook: [], afterHook: [], jasmineOpts: { oneFailurePerSpec: true } } as any,
        [path.join(__dirname, '__fixtures__', 'stopOnFailure.js')],
        { browserName: 'chrome' } as any,
        reporter as any
    )

    await adapter.init()
    expect(await adapter.run()).toBe(1)
    expect((globalThis as { __wdioStopOnFailure?: string[] }).__wdioStopOnFailure).toEqual(['before', 'next'])
})

test('expect.extend() in the before hook adds the matcher to Jasmine', async () => {
    vi.mocked(executeHooksWithArgs).mockResolvedValue([])
    const reporter = { emit: vi.fn(), on: vi.fn(), write: vi.fn() }
    const adapter = new JasmineAdapter(
        '0-0',
        { beforeHook: [], afterHook: [] } as any,
        [path.join(__dirname, '__fixtures__', 'customMatcher.js')],
        { browserName: 'chrome' } as any,
        reporter as any
    )

    await adapter.init()
    await adapter.setupExpect({} as any, {} as any, vi.fn(() => ({})) as any)
    ;(globalThis as any).expect.extend({
        toBeFoo (actual: unknown) {
            return { pass: actual === 'foo', message: () => `expected ${actual} to be "foo"` }
        },
        async toHaveSize (actual: unknown) {
            const value = await actual
            return { pass: value === 'big', message: () => `expected ${value} to be "big"` }
        }
    })
    expect(await adapter.run()).toBe(0)
})

test('the global expect has the asymmetric matchers of expect-webdriverio, expect.multiRemote() included', async () => {
    const reporter = { emit: vi.fn(), on: vi.fn(), write: vi.fn() }
    const adapter = new JasmineAdapter(
        '0-0',
        { beforeHook: [], afterHook: [] } as any,
        [],
        { browserName: 'chrome' } as any,
        reporter as any
    )
    const wdioExpect = { oneOf: vi.fn(), multiRemote: vi.fn(), not: {} }

    await adapter.init()
    await adapter.setupExpect(wdioExpect as any, {} as any, vi.fn(() => ({})) as any)

    expect((globalThis as any).expect.oneOf).toBe(wdioExpect.oneOf)
    expect((globalThis as any).expect.multiRemote).toBe(wdioExpect.multiRemote)
})
