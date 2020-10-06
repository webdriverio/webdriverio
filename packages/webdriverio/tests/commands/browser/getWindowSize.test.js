import got from 'got'
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
        expect(got.mock.calls[1][1].method).toBe('GET')
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/window/rect')
    })

    it('should get size of NO-W3C browser window', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.getWindowSize()
        expect(got.mock.calls[1][1].method).toBe('GET')
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/window/current/size')
    })

    afterEach(() => {
        got.mockClear()
    })
})
