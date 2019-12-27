import request from 'request'
import { remote } from '../../../src'

describe('setTimeout', () => {

    it('should set timeout', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.setTimeout({ implicit: 5000 })
        expect(request.mock.calls.length).toBe(2)
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[1][0].body).toEqual({ 'implicit': 5000 })

        await browser.setTimeout({ pageLoad: 10000 })
        expect(request.mock.calls.length).toBe(3)
        expect(request.mock.calls[2][0].method).toBe('POST')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[2][0].body).toEqual({ 'pageLoad': 10000 })

        await browser.setTimeout({ script: 60000 })
        expect(request.mock.calls.length).toBe(4)
        expect(request.mock.calls[3][0].method).toBe('POST')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[3][0].body).toEqual({ 'script': 60000 })

        await browser.setTimeout({
            implicit: 0,
            pageLoad: 300000,
            script: 30000,
        })
        expect(request.mock.calls.length).toBe(5)
        expect(request.mock.calls[4][0].method).toBe('POST')
        expect(request.mock.calls[4][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[4][0].body).toEqual({
            'implicit': 0,
            'pageLoad': 300000,
            'script': 30000,
        })

        await browser.setTimeout({})
        expect(request.mock.calls.length).toBe(6)
        expect(request.mock.calls[5][0].method).toBe('POST')
        expect(request.mock.calls[5][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[5][0].body).toEqual({})
    })

    it('should set timeout (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.setTimeout({ implicit: 5000 })
        expect(request.mock.calls.length).toBe(2)
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[1][0].body).toEqual({ 'type': 'implicit', 'ms': 5000 })

        await browser.setTimeout({ 'page load': 10000 })
        expect(request.mock.calls.length).toBe(3)
        expect(request.mock.calls[2][0].method).toBe('POST')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[2][0].body).toEqual({ 'type': 'page load', 'ms': 10000 })

        await browser.setTimeout({ script: 60000 })
        expect(request.mock.calls.length).toBe(4)
        expect(request.mock.calls[3][0].method).toBe('POST')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[3][0].body).toEqual({ 'type': 'script', 'ms': 60000 })

        await browser.setTimeout({
            implicit: 0,
            pageLoad: 300000,
            script: 30000,
        })
        expect(request.mock.calls.length).toBe(7)
        expect(request.mock.calls[4][0].method).toBe('POST')
        expect(request.mock.calls[4][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[4][0].body).toEqual({ 'type': 'implicit', 'ms': 0 })
        expect(request.mock.calls[5][0].method).toBe('POST')
        expect(request.mock.calls[5][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[5][0].body).toEqual({ 'type': 'page load', 'ms': 300000 })
        expect(request.mock.calls[6][0].method).toBe('POST')
        expect(request.mock.calls[6][0].uri.path).toBe('/wd/hub/session/foobar-123/timeouts')
        expect(request.mock.calls[6][0].body).toEqual({ 'type': 'script', 'ms': 30000 })

        await browser.setTimeout({})
        expect(request.mock.calls.length).toBe(7)
    })

    it('should throw error on setting invalid timeout', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const invalidTimeoutParameterError = new Error('Parameter for "setTimeout" command needs to be an object')
        await expect(browser.setTimeout('0'))
            .rejects
            .toEqual(invalidTimeoutParameterError)
        await expect(browser.setTimeout(5000))
            .rejects
            .toEqual(invalidTimeoutParameterError)

        const invalidTimeoutValueError = new Error('Specified timeout values are not valid integer (see https://webdriver.io/docs/api/browser/setTimeout.html for documentation).')
        await expect(browser.setTimeout({ implicit: Number.MAX_SAFE_INTEGER + 1 }))
            .rejects
            .toEqual(invalidTimeoutValueError)
        await expect(browser.setTimeout({ pageLoad: -2000 }))
            .rejects
            .toEqual(invalidTimeoutValueError)
        await expect(browser.setTimeout({ 'page load': null }))
            .rejects
            .toEqual(invalidTimeoutValueError)
        await expect(browser.setTimeout({ script: '4000' }))
            .rejects
            .toEqual(invalidTimeoutValueError)
        await expect(browser.setTimeout({ timeouts: { script: 5000 } }))
            .rejects
            .toEqual(invalidTimeoutValueError)
    })

    afterEach(() => {
        request.mockClear()
    })
})
