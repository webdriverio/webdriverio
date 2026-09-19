import { assertMobileNativeDialogCommand, handleMobileDialog } from '../../utils/mobileDialog.js'

/**
 *
 * Dismiss a native mobile alert or permission dialog.
 *
 * Unlike browser dialogs which emit a `dialog` event, mobile permission dialogs
 * and system alerts are already on screen when the test reaches them. Call this
 * command to dismiss the dialog in place.
 *
 * :::info
 *
 * This command only works with the following up-to-date components:
 *  - Appium server (version 2.0.0 or higher)
 *  - `appium-uiautomator2-driver` (for Android)
 *  - `appium-xcuitest-driver` (for iOS)
 *
 * Make sure your local or cloud-based Appium environment is regularly updated to avoid compatibility issues.
 *
 * :::
 *
 * <example>
    :dismissDialog.js
    it('should dismiss a permission dialog', async () => {
        // Dismiss an iOS permission dialog by button label
        await browser.dismissDialog("Don't Allow")

        // Dismiss an Android alert
        await browser.dismissDialog('Cancel')

        // Dismiss whatever the default/cancel button is
        await browser.dismissDialog()
    })
 * </example>
 *
 * @param {string=} buttonText  The text of the button to tap (e.g. `Cancel`, `Don't Allow`, `No`). If omitted, the default dismiss action is used.
 *
 * @support ["ios","android"]
 */
export async function dismissDialog(
    this: WebdriverIO.Browser,
    buttonText?: string
): Promise<void> {
    const browser = this

    assertMobileNativeDialogCommand(browser, 'dismissDialog')
    return handleMobileDialog(browser, 'dismiss', buttonText)
}
