import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Authenticate users by using their fingerprint scan on supported Android emulators. The
 * fingerprintId must be between 1 and 10.
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

    return executeMobile(browser, 'mobile: fingerprint', { fingerprintId })
}
