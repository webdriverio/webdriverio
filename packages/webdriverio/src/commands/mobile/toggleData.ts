import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Set the mobile data state on the device.
 *
 * :::note
 * Unlike the deprecated API which toggled the data state, this command requires an explicit
 * `enabled` parameter to set the desired state directly.
 *
 * This command is only supported on Android.
 * :::
 *
 * <example>
    :toggleData.js
    it('should set mobile data state', async () => {
        await browser.toggleData(true)  // enable data
        await browser.toggleData(false) // disable data
    })
 * </example>
 *
 * @param {boolean} enabled   Set to `true` to enable mobile data, `false` to disable it.
 *
 * @support ["android"]
 */
export async function toggleData(
    this: WebdriverIO.Browser,
    enabled: boolean
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `toggleData` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `toggleData` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: setConnectivity', { data: enabled })
}
