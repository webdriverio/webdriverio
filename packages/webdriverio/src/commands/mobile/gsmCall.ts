import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Make a GSM call on the Android emulator. Valid actions: 'call', 'accept', 'cancel', 'hold'.
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

    return executeMobile(browser, 'mobile: gsmCall', { phoneNumber, action })
}
