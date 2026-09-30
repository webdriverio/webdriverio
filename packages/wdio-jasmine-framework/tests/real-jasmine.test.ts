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
