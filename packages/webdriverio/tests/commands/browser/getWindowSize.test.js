import request from 'request'
import { remote } from '../../../src'

describe('getWindowSize', () => {
    let browser

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
        expect(request.mock.calls[1][0].method).toBe('GET')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/window/rect')
    })

    it('should get size of NO-W3C browser window', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.getWindowSize()
        expect(request.mock.calls[1][0].method).toBe('GET')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/window/current/size')
    })

    afterEach(() => {
        request.mockClear()
    })
})
