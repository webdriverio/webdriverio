import logger from '@wdio/logger'

import { SESSION_MOCKS } from './mock'

const log = logger('webdriverio:mockRestoreAll')

/**
 * Restores all mock information and behavior stored in all registered
 * mocks of the session.
 *
 * <example>
    :mockRestoreAll.js
    it('should restore all mocks', () => {
        const googleMock = browser.mock('https://google.com/')
        googleMock.respond('https://webdriver.io')
        const wdioMock = browser.mock('https://webdriver.io')
        wdioMock.respond('http://json.org')

        browser.url('https://google.com/')
        console.log(browser.getTitle()) // JSON

        browser.mockRestoreAll()

        browser.url('https://google.com/')
        console.log(browser.getTitle()) // Google
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
