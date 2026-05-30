import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Open Android notifications.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :openNotifications.js
    it('should open the Android notification shade', async () => {
        await browser.openNotifications()
    })
 * </example>
 *
 * @support ["android"]
 */
export async function openNotifications(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `openNotifications` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `openNotifications` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: openNotifications', {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: openNotifications', '/appium/device/open_notifications')
        return browser.appiumOpenNotifications()
    }
}
