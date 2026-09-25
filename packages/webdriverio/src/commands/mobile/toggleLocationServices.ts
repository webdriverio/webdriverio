import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Toggle the state of the location service.
 *
 * <example>
    :toggleLocationServices.js
    it('should toggle location services', async () => {
        await browser.toggleLocationServices()
    })
 * </example>
 *
 * @support ["android"]
 */
export async function toggleLocationServices(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `toggleLocationServices` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `toggleLocationServices` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: toggleGps', {})
}
