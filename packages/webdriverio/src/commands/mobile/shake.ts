import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Perform a shake action on the device. Supports iOS Simulator and real devices.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :shake.js
    it('should shake the device', async () => {
        await browser.shake()
    })
 * </example>
 *
 * @support ["ios"]
 */
export async function shake(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `shake` command is only available for mobile platforms.')
    }

    if (!browser.isIOS) {
        throw new Error('The `shake` command is only available for iOS.')
    }

    try {
        return await browser.execute('mobile: shake', {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: shake', '/appium/device/shake')
        return browser.appiumShake()
    }
}
