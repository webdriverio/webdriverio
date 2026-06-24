import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Send the currently running app for this session to the background.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * Pass `-1` to keep the app in the background indefinitely, or `null` to send the app to the
 * background without restoring it.
 *
 * <example>
    :background.js
    it('should background the app', async () => {
        // Background the app for 5 seconds
        await browser.background(5)
        // Background the app indefinitely
        await browser.background(-1)
    })
 * </example>
 *
 * @param {number|null} seconds   Number of seconds to background the app. Pass `-1` to keep it
 *                                in the background indefinitely, or `null` to not restore it.
 *
 * @support ["ios","android"]
 */
export async function background(
    this: WebdriverIO.Browser,
    seconds: number | null
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `background` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: backgroundApp', { seconds })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: backgroundApp', '/appium/app/background')
        return browser.appiumBackground(seconds)
    }
}
