import request from 'request'
import { remote } from '../../../src'

describe('setWindowSize', () => {
    let browser

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
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/window/rect')
        expect(request.mock.calls[1][0].body).toEqual({ x: null, y: null, width: 777, height: 888 })
    })

    it('should resize NO-W3C browser window', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.setWindowSize(999, 1111)
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/window/current/size')
        expect(request.mock.calls[1][0].body).toEqual({ width: 999, height: 1111 })
    })

    describe('input checks', () => {
        it('should throw error if width or height is not number', () => {
            const invalidTypeError = 'setWindowSize expects width and height of type number'

            expect(() => browser.setWindowSize('777', 888))
                .toThrowError(invalidTypeError)
            expect(() => browser.setWindowSize(777))
                .toThrowError(invalidTypeError)
        })

        it('should throw error if width or height not in the 0 to 2^31 − 1 range', () => {
            const invalidValueError = 'setWindowSize expects width and height to be a number in the 0 to 2^31 − 1 range'

            expect(() => browser.setWindowSize(-1, 500))
                .toThrowError(invalidValueError)
            expect(() => browser.setWindowSize(2147483648, 500))
                .toThrowError(invalidValueError)
            expect(() => browser.setWindowSize(-0.01, 500))
                .toThrowError(invalidValueError)
            expect(() => browser.setWindowSize(2147483647.01, 500))
                .toThrowError(invalidValueError)
        })
    })

    afterEach(() => {
        request.mockClear()
    })
})