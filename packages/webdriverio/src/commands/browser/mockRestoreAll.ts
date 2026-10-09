import logger from '@wdio/logger'

import { SESSION_MOCKS } from './mock.js'
import { contextIdOf } from '../../session/browsingContext.js'

const log = logger('webdriverio:mockRestoreAll')

/**
 * Restores all registered mocks for the calling browser or browsing context.
 * Other multiremote sessions and held tabs are not affected.
 *
 * <example>
    :mockRestoreAll.js
    it('should restore all mocks', async () => {
        const googleMock = await browser.mock('https://google.com/')
        googleMock.respond('https://webdriver.io')
        const wdioMock = await browser.mock('https://webdriver.io')
        wdioMock.respond('http://json.org')

        await browser.url('https://google.com/')
        console.log(await browser.getTitle()) // JSON

        await browser.mockRestoreAll()

        await browser.url('https://google.com/')
        console.log(await browser.getTitle()) // Google
    })
 * </example>
 *
 * @alias browser.mockRestoreAll
 */
export async function mockRestoreAll (this: WebdriverIO.Browser | WebdriverIO.BrowsingContext): Promise<void> {
    const handle = await contextIdOf(this)
    log.trace(`Restoring mocks for ${handle}`)

    // Restoring a mock removes it from SESSION_MOCKS: iterate a stable snapshot.
    for (const mock of Array.from(SESSION_MOCKS[handle] ?? [])) {
        await mock.restore()
    }
}
