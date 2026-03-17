import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Set the battery percentage on the Android emulator. Value must be in the range [0, 100].
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :powerCapacity.js
    it('should set battery to 75%', async () => {
        await browser.powerCapacity(75)
    })
 * </example>
 *
 * @param {number}  percent  The battery percentage to set (0–100)
 *
 * @support ["android"]
 */
export async function powerCapacity(
    this: WebdriverIO.Browser,
    percent: number
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `powerCapacity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `powerCapacity` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: powerCapacity', { percent })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: powerCapacity', '/appium/device/power_capacity')
        return browser.appiumPowerCapacity(percent)
    }
}
