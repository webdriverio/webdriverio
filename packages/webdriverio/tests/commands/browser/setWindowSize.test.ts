import path from 'node:path'
import { expect, describe, afterEach, it, vi, beforeAll } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/window/rect')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ x: null, y: null, width: 777, height: 888 })
    })

    it('should resize NO-W3C browser window', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.setWindowSize(999, 1111)
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/window/current/size')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ width: 999, height: 1111 })
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
        vi.mocked(got).mockClear()
    })
})
