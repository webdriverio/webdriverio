import { expect, browser, $ } from '@wdio/globals'
import type { RespondWithOptions } from 'webdriverio'
import { html, render } from 'lit'

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

    it('keeps fetches to loaded scripts under mock control while the page is busy', async () => {
        const scriptMock = await browser.mock(import.meta.url)
        scriptMock.respond('mocked script')

        try {
            const response = fetch(import.meta.url)
            // Node receives the BiDi event while the page cannot handle it yet.
            const deadline = performance.now() + 200
            while (performance.now() < deadline) { /* keep the page busy */ }
            expect(await (await response).text()).toBe('mocked script')
        } finally {
            await scriptMock.restore()
        }
    })

    let imgMock: WebdriverIO.Mock
    it('can redirect images', async () => {
        imgMock = await browser.mock('https://placehold.co/**')
        imgMock.redirect('https://placehold.co/600x500')
        render(
            html`<img src="https://placehold.co/400x400" />`,
            document.body
        )
        await expect($('img')).toHaveSize({ width: 600, height: 500 })
    })

    it('shows image after clearing mock', async () => {
        imgMock.restore()
        render(
            html`<img src="https://placehold.co/400x400?invalidateCache" />`,
            document.body
        )
        await expect($('img')).toHaveSize({ width: 400, height: 400 })
    })
})
