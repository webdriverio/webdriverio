import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Set the GSM signal strength on the Android emulator.
 *
 * <example>
    :gsmSignal.js
    it('should set GSM signal to full strength', async () => {
        await browser.gsmSignal(4)
    })
    it('should set GSM signal to no signal', async () => {
        await browser.gsmSignal(0)
    })
 * </example>
 *
 * @param {number}  signalStrength  The signal strength to set. Accepted values: `0` (no signal), `1` (very poor), `2` (poor), `3` (moderate), `4` (good/full)
 *
 * @support ["android"]
 */
export async function gsmSignal(
    this: WebdriverIO.Browser,
    signalStrength: number
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `gsmSignal` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `gsmSignal` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: gsmSignal', { signalStrength })
}
