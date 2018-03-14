import request from 'request'
import { remote } from '../../../src'

describe('url', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should accept a full url', async () => {
        await browser.url('http://google.com')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/url')
        expect(request.mock.calls[1][0].body).toEqual({ url: 'http://google.com/' })
    })

    it('should accept a relative url', async () => {
        await browser.url('/foobar')
        expect(request.mock.calls[0][0].body).toEqual({ url: 'http://foobar.com/foobar' })
    })

    it('should throw an exception when a non-string value passed in', async () => {
        try {
            await browser.url(true)
        } catch (e) {
            expect(e.message).toContain('command needs to be type of string')
        }
    })

    afterEach(() => {
        request.mockClear()
    })
})
