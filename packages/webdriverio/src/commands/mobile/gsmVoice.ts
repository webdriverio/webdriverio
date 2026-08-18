import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Set the GSM voice state on the Android emulator. Valid values: 'unregistered', 'home',
 * 'roaming', 'searching', 'denied', 'off', 'on'.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :gsmVoice.js
    it('should set GSM voice state to home', async () => {
        await browser.gsmVoice('home')
    })
 * </example>
 *
 * @param {string}  state  The GSM voice state to set ('unregistered', 'home', 'roaming', 'searching', 'denied', 'off', 'on')
 *
 * @support ["android"]
 */
export async function gsmVoice(
    this: WebdriverIO.Browser,
    state: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `gsmVoice` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `gsmVoice` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: gsmVoice', { state })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: gsmVoice', '/appium/device/gsm_voice')
        return browser.appiumGsmVoice(state)
    }
}
