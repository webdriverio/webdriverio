import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Authenticate users by using their fingerprint scan on supported Android emulators. The
 * fingerprintId must be between 1 and 10.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :fingerPrint.js
    it('should authenticate with fingerprint', async () => {
        await browser.fingerPrint(1)
    })
 * </example>
 *
 * @param {number}  fingerprintId  The fingerprint sensor ID to simulate (1–10)
 *
 * @support ["android"]
 */
export async function fingerPrint(
    this: WebdriverIO.Browser,
    fingerprintId: number
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `fingerPrint` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `fingerPrint` command is only available for Android. For iOS, use `touchId` instead.')
    }

    try {
        return await browser.execute('mobile: fingerPrint', { fingerprintId })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: fingerPrint', '/appium/device/finger_print')
        return browser.appiumFingerPrint(fingerprintId)
    }
}
