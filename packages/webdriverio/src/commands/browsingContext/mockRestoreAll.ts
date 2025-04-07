import { mockRestoreAll as browserMockRestoreAll } from '../browser/mockRestoreAll.js'

/**
 * Restores all mock information and behavior stored in all registered
 * mocks of the session.
 *
 * <example>
    :mockRestoreAll.js
    it('should restore all mocks', async () => {
        const page = await browser.url('https://webdriver.io')

        const googleMock = await page.mock('https://google.com/')
        googleMock.respond('https://webdriver.io')
        const wdioMock = await page.mock('https://webdriver.io')
        wdioMock.respond('http://json.org')

        await page.url('https://google.com/')
        console.log(await page.getTitle()) // JSON

        await page.mockRestoreAll()

        await page.url('https://google.com/')
        console.log(await page.getTitle()) // Google
    })
 * </example>
 *
 * @alias page.mockRestoreAll
 */
export const mockRestoreAll = browserMockRestoreAll

