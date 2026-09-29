import { browser } from '@wdio/globals'

const baseUrl = 'https://guinea-pig.webdriver.io/'

describe('Firefox network mocking', () => {
    before(function () {
        if (!browser.isFirefox) {
            this.skip()
        }
    })

    afterEach(async () => {
        await browser.mockRestoreAll()
    })

    it('responds to a static mock before sending the request to the origin', async () => {
        const url = `${baseUrl}firefox-static-mock.json`
        const mock = await browser.mock(url)
        mock.respond({ mocked: true }, {
            headers: { 'content-type': 'application/json' }
        })

        await browser.url(baseUrl)
        const result = await browser.execute(async (requestUrl) => {
            const response = await fetch(requestUrl)
            return {
                status: response.status,
                contentType: response.headers.get('content-type'),
                body: await response.json()
            }
        }, url)

        expect(result).toEqual({
            status: 200,
            contentType: 'application/json',
            body: { mocked: true }
        })
        await browser.waitUntil(() => mock.calls.length === 1, {
            timeout: 5000,
            timeoutMsg: 'Expected Firefox to record the early mocked response'
        })
    })

    it('supports a request-only dynamic response when fetchResponse is false', async () => {
        const url = `${baseUrl}firefox-request-only-mock.json`
        const mock = await browser.mock(url)
        mock.respond((request) => ({
            url: request.request.url,
            method: request.request.method
        }), {
            headers: { 'content-type': 'application/json' },
            fetchResponse: false
        })

        await browser.url(baseUrl)
        const result = await browser.execute(async (requestUrl) => {
            const response = await fetch(requestUrl)
            return response.json()
        }, url)

        expect(result).toEqual({ url, method: 'GET' })
        await browser.waitUntil(() => mock.calls.length === 1, {
            timeout: 5000,
            timeoutMsg: 'Expected Firefox to record the request-only dynamic response'
        })
    })

    it('fails a request when a dynamic response throws instead of leaving it blocked', async () => {
        const url = `${baseUrl}firefox-failing-mock.json`
        const mock = await browser.mock(url)
        mock.respond(() => {
            throw new Error('mock callback failed')
        }, { fetchResponse: false })

        await browser.url(baseUrl)
        const result = await browser.execute(async (requestUrl) => Promise.race([
            fetch(requestUrl).then(() => 'resolved', () => 'rejected'),
            new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000))
        ]), url)

        expect(result).toBe('rejected')
    })
})
