import path from 'node:path'
import { expect, describe, it, vi, beforeEach, beforeAll, type MockInstance } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setWindowSize', () => {
    let browser: WebdriverIO.Browser
    let browsingContextSetViewport: MockInstance

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi',
            }
        })
        browsingContextSetViewport = vi.spyOn(browser, 'browsingContextSetViewport')
        browsingContextSetViewport.mockImplementation(() => ({}))
    })

    beforeEach(() => {
        browsingContextSetViewport.mockClear()
    })

    it('should resize W3C browser window', async () => {
        await browser.setViewport({ width: 777, height: 888, devicePixelRatio: 123 })
        expect(browsingContextSetViewport).toBeCalledTimes(1)
        expect(browsingContextSetViewport).toBeCalledWith({
            context: '',
            viewport: {
                width: 777,
                height: 888,
            },
            devicePixelRatio: 123
        })
    })

    describe('input checks', () => {
        it('should throw error if width or height is not number', async () => {
            const invalidTypeError = 'setViewport expects width and height of type number'

            // @ts-ignore tets invalid parameter
            let err = await browser.setViewport({ width: '777', height: 888 }).catch((err: Error) => err)
            expect((err as Error).message).toBe(invalidTypeError)
            // @ts-ignore test invalid parameter
            err = await browser.setViewport({ width: 777 }).catch((err: Error) => err)
            expect((err as Error).message).toBe(invalidTypeError)
        })

        it('should throw error if width or height not in the 0 to 2^31 − 1 range', async () => {
            const invalidValueError = 'setViewport expects width and height to be a number in the 0 to 2^31 − 1 range'

            // @ts-ignore test invalid parameter
            let err: Error = await browser.setViewport({ width: -1, height: 500 }).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
            // @ts-ignore test invalid parameter
            err = await browser.setViewport({ width: Number.MAX_SAFE_INTEGER + 100, height: 500 }).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
            // @ts-ignore test invalid parameter
            err = await browser.setViewport({ width: -0.01, height: 500 }).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
        })

        it('should throw error if devicePixelRatio is not a number', async () => {
            const invalidValueError = 'setViewport expects devicePixelRatio to be a number in the 0 to 2^31 − 1 range'

            // @ts-ignore test invalid parameter
            let err: Error = await browser.setViewport({ width: 777, height: 888, devicePixelRatio: '123' }).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
            // @ts-ignore test invalid parameter
            err = await browser.setViewport({ width: 777, height: 888, devicePixelRatio: -1 }).catch((err: Error) => err)
            expect(err.message).toBe(invalidValueError)
        })
    })
})
