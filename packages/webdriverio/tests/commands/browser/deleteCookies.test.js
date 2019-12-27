import request from 'request'
import { remote } from '../../../src'

describe('deleteCookies', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should delete all cookies', async () => {
        await browser.deleteCookies()

        expect(request.mock.calls[1][0].method).toBe('DELETE')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie')
    })

    it('should support passing a string', async () => {
        await browser.deleteCookies('cookie1')

        expect(request.mock.calls[0][0].method).toBe('DELETE')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie/cookie1')
    })

    it('should support passing a array with a string', async () => {
        await browser.deleteCookies(['cookie1'])

        expect(request.mock.calls[0][0].method).toBe('DELETE')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/cookie/cookie1')
    })

    it('should delete cookies that match by name', async () => {
        const cookieNames = ['cookie1', 'cookie2', 'cookie3']
        await browser.deleteCookies(cookieNames)

        cookieNames.forEach((name, i) => {
            expect(request.mock.calls[i][0].method).toBe('DELETE')
            expect(request.mock.calls[i][0].uri.path).toBe(`/wd/hub/session/foobar-123/cookie/${name}`)
        })
    })

    it('should throw error if invalid arguments are passed', async () => {
        await expect(browser.deleteCookies([2]))
            .rejects
            .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/deleteCookies.html for documentation.'))
    })

    afterEach(() => {
        request.mockClear()
    })
})
