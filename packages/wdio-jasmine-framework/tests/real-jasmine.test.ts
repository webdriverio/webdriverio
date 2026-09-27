import path from 'node:path'
import { expect, test, vi } from 'vitest'

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
