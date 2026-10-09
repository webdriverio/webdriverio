import logger from '@wdio/logger'

import { SESSION_MOCKS } from './mock.js'
import { contextIdOf } from '../../session/browsingContext.js'

const log = logger('webdriverio:mockClearAll')

/**
 * Resets the registered mocks for the calling browser or browsing context.
 * Other multiremote sessions and held tabs are not affected.
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
    const handle = await contextIdOf(this)
    log.trace(`Clearing mocks for ${handle}`)

    for (const mock of SESSION_MOCKS[handle] ?? []) {
        mock.clear()
    }
}
