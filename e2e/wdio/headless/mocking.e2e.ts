import { browser } from '@wdio/globals'

describe('network mocking', () => {
    it('marks a request as mocked even without overwrites', async () => {
        const baseUrl = 'https://guinea-pig.webdriver.io/'
        const mock = await browser.mock(`${baseUrl}components/hammerjs/hammer.js`, {
            method: 'get',
            statusCode: 200,
        })
        await browser.url(baseUrl)
        await browser.waitUntil(() => mock.calls.length === 1, {
            timeoutMsg: 'Expected mock to be made',
            timeout: 2000
        })
    })
})
