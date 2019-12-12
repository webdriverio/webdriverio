import request from 'request'
import { remote } from '../../../src'

describe('setCookies', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should output the expected format', async () => {
        await browser.setCookies([{ name: 'cookie1', value: 'dummy-value-1' }])
        expect(request.mock.calls.length).toBe(2)
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(request.mock.calls[1][0].body).toEqual({ 'cookie': { name: 'cookie1', value: 'dummy-value-1' } })
    })

    it('should support passing an object', async () => {
        await browser.setCookies({ name: 'cookie1', value: 'dummy-value-1' })
        expect(request.mock.calls.length).toBe(1)
        expect(request.mock.calls[0][0].method).toBe('POST')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(request.mock.calls[0][0].body).toEqual({ 'cookie': { name: 'cookie1', value: 'dummy-value-1' } })
    })

    it('can be called multiple times', async () => {
        await browser.setCookies({ name: 'cookie1', value: 'dummy-value-1' })
        await browser.setCookies({ name: 'cookie2', value: 'dummy-value-1' })
        expect(request.mock.calls.length).toBe(2)
        expect(request.mock.calls[0][0].method).toBe('POST')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(request.mock.calls[0][0].body).toEqual({ 'cookie': { name: 'cookie1', value: 'dummy-value-1' } })
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(request.mock.calls[1][0].body).toEqual({ 'cookie': { name: 'cookie2', value: 'dummy-value-1' } })
    })

    it('should work with multiple objects passed', async () => {
        const cookies = [
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie2', value: 'dummy-value-2' },
            { name: 'cookie3', value: 'dummy-value-3' }
        ]

        await browser.setCookies(cookies)

        cookies.forEach((cookie, i) => {
            expect(request.mock.calls[i][0].method).toBe('POST')
            expect(request.mock.calls[i][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
            expect(request.mock.calls[i][0].body).toEqual({ 'cookie': cookie })
        })
    })

    it('should throw error if invalid arguments are passed', async () => {
        await expect(browser.setCookies([2]))
            .rejects
            .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies.html for documentation.'))
    })

    afterEach(() => {
        request.mockClear()
    })
})
