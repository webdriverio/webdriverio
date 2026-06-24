import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Check whether the device screen is locked.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :isLocked.js
    it('should check if the device is locked', async () => {
        const locked = await browser.isLocked()
        console.log('Device is locked:', locked)
    })
 * </example>
 *
 * @returns {`Promise<boolean>`} `true` if the device is locked, `false` otherwise
 *
 * @support ["ios","android"]
 */
export async function isLocked(
    this: WebdriverIO.Browser
): Promise<boolean> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `isLocked` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: isLocked', {}) as boolean
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: isLocked', '/appium/device/is_locked')
        return browser.appiumIsLocked() as Promise<boolean>
    }
}
