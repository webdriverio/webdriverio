import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Toggle the state of the location service.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
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

    try {
        return await browser.execute('mobile: toggleGps', {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: toggleGps', '/appium/device/toggle_location_services')
        return browser.appiumToggleLocationServices()
    }
}
