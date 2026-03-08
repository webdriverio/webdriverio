import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Lock the device screen.
 *
 * This command tries the modern `mobile: lock` execute method first (supported by Appium 3 and
 * Appium 2 drivers from 2023+). If the driver does not support it, it falls back to the legacy
 * `/appium/device/lock` protocol endpoint and logs a deprecation warning.
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
 * @see https://appium.github.io/appium.io/docs/en/commands/device/interactions/lock/
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
