import logger from '@wdio/logger'
import { mocksOf } from '../../utils/interception/scope.js'

const log = logger('webdriverio:mockRestoreAll')

/**
 * Restores all mock information and behavior stored in all registered
 * mocks of the session. On a browsing context, it restores only the mocks made
 * for that tab or window. Inside a parallel test, it restores only the mocks
 * that the test created, also on tabs it opened.
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
    const mocks = mocksOf(this)
    log.trace(`Restoring ${mocks.length} mock(s)`)
    for (const mock of mocks) {
        await mock.restore()
    }
}
