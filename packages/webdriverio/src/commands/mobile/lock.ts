import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Lock the device screen.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :lock.js
    it('should lock the screen', async () => {
        // Lock the screen indefinitely
        await browser.lock()
    })
 * </example>
 *
 * <example>
    :lock.timeout.js
    it('should lock the screen for 5 seconds (iOS only)', async () => {
        // Lock the screen for 5 seconds, then auto-unlock (iOS only)
        await browser.lock(5)
    })
 * </example>
 *
 * @param {number}  [seconds]   How long to lock the screen in seconds (iOS only)
 *
 * @support ["ios","android"]
 */
export async function lock(
    this: WebdriverIO.Browser,
    seconds?: number
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `lock` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: lock', { seconds })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: lock', '/appium/device/lock')
        return browser.appiumLock(seconds)
    }
}
