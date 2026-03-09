import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Simulate a Touch ID fingerprint match event on iOS Simulator.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * :::note
 * This command requires the `allowTouchIdEnroll` capability to be set to `true` in the session.
 * It is only supported on iOS Simulator.
 * :::
 *
 * <example>
    :touchId.js
    it('should simulate a fingerprint match', async () => {
        // Simulate successful fingerprint match
        await browser.touchId(true)
        // Simulate failed fingerprint match
        await browser.touchId(false)
    })
 * </example>
 *
 * @param {boolean} match   Whether the fingerprint match should succeed (`true`) or fail (`false`)
 *
 * @support ["ios"]
 */
export async function touchId(
    this: WebdriverIO.Browser,
    match: boolean
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `touchId` command is only available for mobile platforms.')
    }

    if (!browser.isIOS) {
        throw new Error('The `touchId` command is only available for iOS. For Android, use `fingerPrint` instead.')
    }

    try {
        return await browser.execute('mobile: sendBiometricMatch', { match })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: sendBiometricMatch', '/appium/simulator/touch_id')
        return browser.appiumTouchId(match)
    }
}
