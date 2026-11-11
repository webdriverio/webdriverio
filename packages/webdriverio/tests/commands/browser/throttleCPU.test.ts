import path from 'node:path'
import { expect, test, beforeEach, vi } from 'vitest'
import puppeteer from 'puppeteer-core'

import { AsyncLocalStorage } from 'node:async_hooks'
import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore } from '../../../src/session/context.js'

vi.mock('fetch')
vi.mock('puppeteer-core')
/**
 * Given that Puppeteer is not a direct dependency of this package, we can't mock
 * it and dynamically import it. Instead, we mock the "userImport" helper and make
 * it resolve to the mocked Puppeteer.
 */
vi.mock('@wdio/utils', async (origMod) => {
    const orig = await origMod() as any
    // resolve the mocked puppeteer-core
    const puppeteer = await import('puppeteer-core')
    return {
        ...orig,
        userImport: vi.fn().mockResolvedValue(puppeteer.default)
    }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const noopParallelContextStore = getParallelContextStore()

// @ts-ignore mock feature
const cdpSession = new puppeteer.CDPSessionMock()

beforeEach(() => {
    vi.mocked(fetch).mockClear()
    cdpSession.send.mockClear()
})

test('should fail if wrong params applied', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    // @ts-expect-error wrong parameter
    const err: Error = await browser.throttleCPU().catch((err: Error) => err)
    expect(err.message).toContain('Invalid factor for "throttleCPU". Expected it to be a number (int)')
})

test('should slowdown the CPU by a factor of 2', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    await browser.throttleCPU(2)
    expect(cdpSession.send.mock.calls).toMatchSnapshot()
})

test('should throw inside a parallel test scope and not touch the first tab', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })
    const store = new AsyncLocalStorage<string>()
    setParallelContextStore(store)
    try {
        await expect(store.run('ctx-1', () => browser.throttleCPU(2))).rejects.toThrow(
            '"throttleCPU" is not supported inside parallel mode tests because it targets the whole browser'
        )
        expect(cdpSession.send).not.toHaveBeenCalled()
    } finally {
        setParallelContextStore(noopParallelContextStore)
    }
})
