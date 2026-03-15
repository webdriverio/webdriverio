import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Close the currently open app on the device.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :closeApp.js
    it('should close the current app', async () => {
        await browser.closeApp()
    })
 * </example>
 *
 * @support ["ios","android"]
 */
export async function closeApp(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `closeApp` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: terminateApp', {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: terminateApp', '/appium/app/close')
        return browser.appiumCloseApp()
    }
}
