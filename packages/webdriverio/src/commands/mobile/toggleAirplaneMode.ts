import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Set the airplane mode state on the device.
 *
 * :::note
 * Unlike the deprecated API which toggled the airplane mode state, this command requires an
 * explicit `enabled` parameter to set the desired state directly.
 *
 * This command is only supported on Android.
 * :::
 *
 * <example>
    :toggleAirplaneMode.js
    it('should set airplane mode', async () => {
        // Enable airplane mode
        await browser.toggleAirplaneMode(true)
        // Disable airplane mode
        await browser.toggleAirplaneMode(false)
    })
 * </example>
 *
 * @param {boolean} enabled   Set to `true` to enable airplane mode, `false` to disable it.
 *
 * @support ["android"]
 */
export async function toggleAirplaneMode(
    this: WebdriverIO.Browser,
    enabled: boolean
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `toggleAirplaneMode` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `toggleAirplaneMode` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: setConnectivity', { airplaneMode: enabled })
}
