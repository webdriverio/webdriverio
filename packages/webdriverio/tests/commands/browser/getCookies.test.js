import request from 'request'
import { remote } from '../../../src'

describe('getCookies', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should return all cookies', async () => {
        const cookies = await browser.getCookies()

        expect(request.mock.calls[1][0].method).toBe('GET')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(cookies).toEqual([
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie2', value: 'dummy-value-2' },
            { name: 'cookie3', value: 'dummy-value-3' },
        ])
    })

    it('should support passing a string', async () => {
        const cookies = await browser.getCookies('cookie1')

        expect(request.mock.calls[0][0].method).toBe('GET')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
    })

    it('should support passing a array with strings', async () => {
        const cookies = await browser.getCookies(['cookie1'])

        expect(request.mock.calls[0][0].method).toBe('GET')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
    })

    it('should get all cookies and filter out cookies that match by name', async () => {
        const cookieNames = ['cookie1', 'doesn-not-exist', 'cookie3']
        const cookies = await browser.getCookies(cookieNames)

        expect(request.mock.calls[0][0].method).toBe('GET')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
        expect(cookies).toEqual([
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie3', value: 'dummy-value-3' },
        ])
    })

    it('should throw error if invalid arguments are passed', async () => {
        await expect(browser.getCookies([2]))
            .rejects
            .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/getCookies.html for documentation.'))
    })

    afterEach(() => {
        request.mockClear()
    })
})
