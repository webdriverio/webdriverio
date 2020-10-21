import got from 'got'
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
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/url')
        expect(got.mock.calls[1][1].json)
            .toEqual({ url: 'http://google.com/' })
    })

    it('should accept a relative url', async () => {
        await browser.url('/foobar')
        expect(got.mock.calls[0][1].json)
            .toEqual({ url: 'http://foobar.com/foobar' })
    })

    it('should throw an exception when a non-string value passed in', async () => {
        try {
            await browser.url(true)
        } catch (e) {
            expect(e.message).toContain('command needs to be type of string')
        }
    })

    afterEach(() => {
        got.mockClear()
    })
})
