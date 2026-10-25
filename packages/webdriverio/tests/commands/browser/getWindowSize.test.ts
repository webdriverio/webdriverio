import path from 'node:path'
import { expect, describe, it, vi, beforeAll, afterEach } from 'vitest'
import { AsyncLocalStorage } from 'node:async_hooks'
import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore } from '../../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const noopParallelContextStore = getParallelContextStore()

describe('getWindowSize', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should get size of W3C browser window', async () => {
        await browser.getWindowSize()
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ pathname: '/session/foobar-123/window/rect' }),
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('throws inside a parallel test scope without touching the window', async () => {
        const store = new AsyncLocalStorage<string>()
        setParallelContextStore(store)
        try {
            await expect(store.run('ctx-1', () => browser.getWindowSize())).rejects.toThrow(
                '"getWindowSize" is not supported inside parallel mode tests because parallel tests share one OS window, use setViewport to size a test\'s page'
            )
            expect(fetch).not.toHaveBeenCalled()
        } finally {
            setParallelContextStore(noopParallelContextStore)
        }
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
