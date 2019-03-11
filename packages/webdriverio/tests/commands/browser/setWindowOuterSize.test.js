import request from 'request'
import { remote } from '../../../src'

describe('setWindowOuterSize', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should resize W3C browser window', () => {
        browser.setWindowOuterSize(777, 888)
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

        browser.setWindowOuterSize(999, 1111)
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/window/current/size')
        expect(request.mock.calls[1][0].body).toEqual({ width: 999, height: 1111 })
    })

    describe('input checks', () => {
        it('should throw error if width is not number', () => {
            expect(() => browser.setWindowOuterSize('777', 888))
                .toThrowError('setWindowOuterSize expects width and height of type number')
        })

        it('should throw error if height is not number', () => {
            expect(() => browser.setWindowOuterSize(777))
                .toThrowError('setWindowOuterSize expects width and height of type number')
        })

        it('should throw error if width < 0', () => {
            expect(() => browser.setWindowOuterSize(-1, 500))
                .toThrowError('setWindowOuterSize expects width and height to be a number in the 0 to 2^31 − 1 range')
        })

        it('should throw error if width > 2^31 − 1', () => {
            expect(() => browser.setWindowOuterSize(2147483648, 500))
                .toThrowError('setWindowOuterSize expects width and height to be a number in the 0 to 2^31 − 1 range')
        })

        it('should throw error if height < 0', () => {
            expect(() => browser.setWindowOuterSize(-0.01, 500))
                .toThrowError('setWindowOuterSize expects width and height to be a number in the 0 to 2^31 − 1 range')
        })

        it('should throw error if height > 2^31 − 1', () => {
            expect(() => browser.setWindowOuterSize(2147483647.01, 500))
                .toThrowError('setWindowOuterSize expects width and height to be a number in the 0 to 2^31 − 1 range')
        })
    })

    afterEach(() => {
        request.mockClear()
    })
})