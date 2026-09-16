import { assertMobileNativeDialogCommand, handleMobileDialog } from '../../utils/mobileDialog.js'

/**
 *
 * Accept a native mobile alert or permission dialog.
 *
 * Unlike browser dialogs which emit a `dialog` event, mobile permission dialogs
 * and system alerts are already on screen when the test reaches them. Call this
 * command to accept the dialog in place.
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
    :acceptDialog.js
    it('should accept a permission dialog', async () => {
        // Accept an iOS permission dialog by button label
        await browser.acceptDialog('Allow')

        // Accept an Android alert
        await browser.acceptDialog('OK')

        // Accept whatever the default/first button is
        await browser.acceptDialog()
    })
 * </example>
 *
 * @param {string=} buttonText  The text of the button to tap (e.g. `Allow`, `OK`, `Yes`). If omitted, the default accept action is used.
 *
 * @support ["ios","android"]
 */
export async function acceptDialog(
    this: WebdriverIO.Browser,
    buttonText?: string
): Promise<void> {
    const browser = this

    assertMobileNativeDialogCommand(browser, 'acceptDialog')
    return handleMobileDialog(browser, 'accept', buttonText)
}
