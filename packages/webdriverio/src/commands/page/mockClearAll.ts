import { mockClearAll as browserMockClearAll } from '../browser/mockClearAll.js'

/**
 * Resets all information stored in all registered mocks of the session.
 *
 * <example>
    :mockClearAll.js
    it('should clear all mocks', async () => {
        const page = await browser.url('https://webdriver.io')
        const docMock = await page.mock('**', {
            headers: { 'Content-Type': 'text/html' }
        })
        const jsMock = await page.mock('**', {
            headers: { 'Content-Type': 'application/javascript' }
        })

        await page.url('https://guinea-pig.webdriver.io/')
        console.log(docMock.calls.length, jsMock.calls.length) // returns "1 4"

        await page.url('https://guinea-pig.webdriver.io/')
        console.log(docMock.calls.length, jsMock.calls.length) // returns "2 4" (JavaScript comes from cache)

        await page.mockClearAll()
        console.log(docMock.calls.length, jsMock.calls.length) // returns "0 0"
    })
 * </example>
 *
 * @alias page.mockClearAll
 */
export const mockClearAll = browserMockClearAll