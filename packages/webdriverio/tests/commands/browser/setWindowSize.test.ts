import path from 'node:path'
import { expect, describe, afterEach, it, vi, beforeAll } from 'vitest'
import { AsyncLocalStorage } from 'node:async_hooks'
import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore } from '../../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const noopParallelContextStore = getParallelContextStore()

describe('setWindowSize', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should resize W3C browser window', async () => {
        await browser.setWindowSize(777, 888)
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ pathname: '/session/foobar-123/window/rect' }),
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ x: null, y: null, width: 777, height: 888 }) })
        )
    })

    it('throws inside a parallel test scope without touching the window', async () => {
        const store = new AsyncLocalStorage<string>()
        setParallelContextStore(store)
        try {
            await expect(store.run('ctx-1', () => browser.setWindowSize(777, 888))).rejects.toThrow(
                '"setWindowSize" is not supported inside parallel mode tests because parallel tests share one OS window, use setViewport to size a test\'s page'
            )
            expect(fetch).not.toHaveBeenCalled()
        } finally {
            setParallelContextStore(noopParallelContextStore)
        }
    })

    describe('input checks', () => {
        it('should throw error if width or height is not number', async () => {
            const invalidTypeError = 'setWindowSize expects width and height of type number'

            // @ts-ignore tets invalid parameter
            let err = await browser.setWindowSize('777', 888).catch((err: Error) => err)
            expect((err as Error).message).toBe(invalidTypeError)
            // @ts-ignore test invalid parameter
            err = await browser.setWindowSize(777).catch((err: Error) => err)
            expect((err as Error).message).toBe(invalidTypeError)
        })

        it('should throw error if width or height not in the 0 to 2^31 − 1 range', async () => {
            const invalidValueError = 'setWindowSize expects width and height to be a number in the 0 to 2^31 − 1 range'

            // @ts-ignore test invalid parameter
            let err: Error = await browser.setWindowSize(-1, 500).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
            // @ts-ignore test invalid parameter
            err = await browser.setWindowSize(Number.MAX_SAFE_INTEGER + 100, 500).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
            // @ts-ignore test invalid parameter
            err = await browser.setWindowSize(-0.01, 500).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
