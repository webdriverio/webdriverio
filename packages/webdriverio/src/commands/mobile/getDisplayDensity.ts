import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Get the display density from the device.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
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

    try {
        return await browser.execute('mobile: getDisplayDensity', {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: getDisplayDensity', '/appium/device/display_density')
        return browser.appiumGetDisplayDensity()
    }
}
