import { restore as restoreBrowser } from '../browser/restore.js'

/**
 *
 * This command restores specific or all emulated behaviors that were set using the `emulate` command.
 *
 * <example>
    :restore.js
    let context: WebdriverIO.BrowsingContext
    before(async () => {
        context = await browser.url('https://webdriver.io')
        await context.emulate('geolocation', { latitude: 52.52, longitude: 13.405 })
        await context.emulate('userAgent', 'foobar')
        await context.emulate('colorScheme', 'dark')
        await context.emulate('onLine', false)
    })

    it('should restore all emulated behavior', async () => {
        await context.url('https://webdriver.io')
        // test within an emulated environment...
    })

    after(async () => {
        // restore all emulated behavior
        await context.restore()
        // or only restore specific emulated behavior
        // await context.restore(['geolocation', 'userAgent'])
    })
 * </example>
 *
 * @alias page.restore
 * @type utility
 *
 */
export const restore = restoreBrowser
