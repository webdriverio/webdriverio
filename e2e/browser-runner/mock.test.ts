import type { RespondWithOptions } from 'webdriverio'

const CORS_PARAMS: RespondWithOptions = {
    headers: { 'Access-Control-Allow-Origin': '*' }
}

describe('WebdriverIO mock command', () => {
    it('supports mocking of API requests', async () => {
        const apiMock = await browser.mock('**/api/**')
        apiMock
            .respondOnce({ foo: 'bar' }, CORS_PARAMS)
            .respondOnce('Hello World', CORS_PARAMS)

        const jsonAPI = await fetch('https://api.webdriver.io/api/foo')
        expect(await jsonAPI.json()).toEqual({ foo: 'bar' })
        const textAPI = await fetch('https://api.webdriver.io/api/bar')
        expect(await textAPI.text()).toBe('Hello World')
    })
})
