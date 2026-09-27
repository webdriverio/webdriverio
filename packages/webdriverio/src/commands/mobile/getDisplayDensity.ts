import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Get the display density from the device.
 *
 * <example>
    :getDisplayDensity.js
    it('should get the display density', async () => {
        const density = await browser.getDisplayDensity()
        console.log('Display density:', density)
    })
 * </example>
 *
 * @support ["android"]
 */
export async function getDisplayDensity(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getDisplayDensity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getDisplayDensity` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: getDisplayDensity', {})
}
