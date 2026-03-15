import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Make a GSM call on the Android emulator. Valid actions: 'call', 'accept', 'cancel', 'hold'.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :gsmCall.js
    it('should simulate a GSM call', async () => {
        // Simulate an incoming call
        await browser.gsmCall('+15551234567', 'call')
        // Accept the call
        await browser.gsmCall('+15551234567', 'accept')
    })
 * </example>
 *
 * @param {string}  phoneNumber  The phone number to use for the GSM call simulation
 * @param {string}  action       The action to perform ('call', 'accept', 'cancel', 'hold')
 *
 * @support ["android"]
 */
export async function gsmCall(
    this: WebdriverIO.Browser,
    phoneNumber: string,
    action: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `gsmCall` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `gsmCall` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: gsmCall', { phoneNumber, action })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: gsmCall', '/appium/device/gsm_call')
        return browser.appiumGsmCall(phoneNumber, action)
    }
}
