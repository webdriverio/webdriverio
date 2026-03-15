import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Get the name of the current Android activity.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :getCurrentActivity.js
    it('should get the current Android activity', async () => {
        const activity = await browser.getCurrentActivity()
        console.log('Current activity:', activity)
    })
 * </example>
 *
 * @returns {`Promise<string>`} The name of the current Android activity
 *
 * @support ["android"]
 */
export async function getCurrentActivity(
    this: WebdriverIO.Browser
): Promise<string> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getCurrentActivity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getCurrentActivity` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: getCurrentActivity', {}) as string
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: getCurrentActivity', '/appium/device/current_activity')
        return browser.appiumGetCurrentActivity() as Promise<string>
    }
}
