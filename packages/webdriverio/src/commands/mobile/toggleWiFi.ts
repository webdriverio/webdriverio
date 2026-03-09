import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Set the WiFi state on the device.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * :::note
 * Unlike the deprecated API which toggled the WiFi state, this command requires an explicit
 * `enabled` parameter to set the desired state directly.
 *
 * This command is only supported on Android.
 * :::
 *
 * <example>
    :toggleWiFi.js
    it('should set WiFi state', async () => {
        await browser.toggleWiFi(true)  // enable WiFi
        await browser.toggleWiFi(false) // disable WiFi
    })
 * </example>
 *
 * @param {boolean} enabled   Set to `true` to enable WiFi, `false` to disable it.
 *
 * @support ["android"]
 */
export async function toggleWiFi(
    this: WebdriverIO.Browser,
    enabled: boolean
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `toggleWiFi` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `toggleWiFi` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: setConnectivity', { wifi: enabled })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: setConnectivity', '/appium/device/toggle_wifi')
        return browser.appiumToggleWiFi()
    }
}
