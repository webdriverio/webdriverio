import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Launch the app configured in the current session capabilities.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :launchApp.js
    it('should launch the app', async () => {
        await browser.launchApp()
    })
 * </example>
 *
 * @support ["ios","android"]
 */
export async function launchApp(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `launchApp` command is only available for mobile platforms.')
    }

    const mobileCmd = browser.isIOS ? 'mobile: launchApp' : 'mobile: activateApp'

    try {
        return await browser.execute(mobileCmd, {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning(mobileCmd, '/appium/app/launch')
        return browser.appiumLaunchApp()
    }
}
