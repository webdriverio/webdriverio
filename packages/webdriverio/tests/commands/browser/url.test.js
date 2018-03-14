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

    it('should have a sessionId when instance was created', () => {
        expect(browser.sessionId).toBe('foobar-123')
        expect(request.mock.calls).toHaveLength(1)
        expect(request.mock.calls[0][0].method).toBe('POST')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session')
    })

    it('should accept a full url', async () => {
        await browser.url('http://google.com')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/url')
        expect(request.mock.calls[0][0].body).toEqual({ url: 'http://google.com/' })
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
