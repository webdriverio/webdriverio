import logger from '@wdio/logger'

import { SESSION_MOCKS } from './mock.js'

const log = logger('webdriverio:mockRestoreAll')

/**
 * Restores all mock information and behavior stored in all registered
 * mocks of the session.
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
export default async function mockRestoreAll () {
    for (const [handle, mocks] of Object.entries(SESSION_MOCKS)) {
        log.trace(`Clearing mocks for ${handle}`)
        for (const mock of mocks) {
            mock.restore()
        }
    }
}
