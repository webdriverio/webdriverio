import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Set the GSM signal strength on the Android emulator. Value must be in range [0, 4] where 0 is
 * no signal and 4 is full signal.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :gsmSignal.js
    it('should set GSM signal to full strength', async () => {
        await browser.gsmSignal('4')
    })
 * </example>
 *
 * @param {string}  signalStrength  The signal strength to set (0–4, where 0 is none and 4 is full)
 *
 * @support ["android"]
 */
export async function gsmSignal(
    this: WebdriverIO.Browser,
    signalStrength: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `gsmSignal` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `gsmSignal` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: gsmSignal', { signalStrength })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: gsmSignal', '/appium/device/gsm_signal')
        return browser.appiumGsmSignal(signalStrength)
    }
}
