import logger from '@wdio/logger'
import { mocksOf } from '../../utils/interception/scope.js'

const log = logger('webdriverio:mockClearAll')

/**
 * Resets all information stored in all registered mocks of the session. On a
 * browsing context, or inside a parallel test, it resets only the mocks made
 * for that tab or window.
 *
 * <example>
    :mockClearAll.js
    it('should clear all mocks', async () => {
        const docMock = await browser.mock('**', {
            headers: { 'Content-Type': 'text/html' }
        })
        const jsMock = await browser.mock('**', {
            headers: { 'Content-Type': 'application/javascript' }
        })

        await browser.url('https://guinea-pig.webdriver.io/')
        console.log(docMock.calls.length, jsMock.calls.length) // returns "1 4"

        await browser.url('https://guinea-pig.webdriver.io/')
        console.log(docMock.calls.length, jsMock.calls.length) // returns "2 4" (JavaScript comes from cache)

        await browser.mockClearAll()
        console.log(docMock.calls.length, jsMock.calls.length) // returns "0 0"
    })
 * </example>
 *
 * @alias browser.mockClearAll
 */
export async function mockClearAll (this: WebdriverIO.Browser | WebdriverIO.BrowsingContext): Promise<void> {
    const mocks = mocksOf(this)
    log.trace(`Clearing ${mocks.length} mock(s)`)
    for (const mock of mocks) {
        mock.clear()
    }
}
