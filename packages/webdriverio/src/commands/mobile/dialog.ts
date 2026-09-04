/**
 * Returns a MobileDialog instance for interacting with native mobile alerts
 * (iOS/Android permission dialogs, system alerts, etc.).
 *
 * Unlike browser dialogs which emit a 'dialog' event, mobile dialogs must be
 * handled manually by calling this method to get a dialog instance.
 *
 * <example>
    :mobileDialog.js
    // Handle an iOS permission dialog
    const dialog = await browser.dialog();
    console.log(await dialog.message()); // Get alert text
    await dialog.accept('Allow'); // Click the "Allow" button

    // Handle an Android alert
    const dialog = await browser.dialog();
    await dialog.accept('OK'); // Click the "OK" button

    // Dismiss a dialog by clicking "Cancel"
    const dialog = await browser.dialog();
    await dialog.dismiss();
 * </example>
 *
 * @support ["ios","android"]
 * @returns {MobileDialog} A MobileDialog instance for interacting with native mobile alerts.
 */
export function dialog(this: WebdriverIO.Browser): MobileDialog {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `dialog` command is only available for mobile platforms.')
    }

    return new MobileDialog(browser)
}

/**
 * MobileDialog class for interacting with native mobile alerts (iOS/Android).
 * Provides a similar interface to browser Dialog but works with native system dialogs
 * using element selectors instead of WebDriver alert commands.
 */
export class MobileDialog {
    #browser: WebdriverIO.Browser

    /**
     * iOS SpringBoard bundle ID used to activate the system UI for accessing permission dialogs
     */
    static SPRINGBOARD_BUNDLE_ID = 'com.apple.springboard'

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser
    }

    /**
     * Returns a placeholder message since native mobile dialogs
     * don't provide message content through WebDriver.
     *
     * @returns {string} An empty string as native dialogs don't expose messages via WebDriver.
     */
    message(): string {
        // Native mobile dialogs don't expose their message content through WebDriver
        return ''
    }

    /**
     * Returns 'alert' as the type for native mobile dialogs.
     *
     * @returns {string} Always returns 'alert' for native mobile dialogs.
     */
    type(): string {
        // Native mobile dialogs are always treated as alerts
        return 'alert'
    }

    /**
     * Returns an empty string as native mobile dialogs don't have default values.
     *
     * @returns {string} Always returns an empty string.
     */
    defaultValue(): string {
        // Native mobile dialogs don't have default values
        return ''
    }

    /**
     * Accepts the mobile dialog by clicking the specified button.
     * For iOS: Uses accessibility ID selector to find the button.
     * For Android: Uses XPath to find the button by text.
     *
     * @param {string=} buttonText  The text of the button to click (e.g., 'OK', 'Allow', 'Yes').
     *                               Defaults to 'OK' if not provided.
     * @returns {Promise<void>}
     */
    async accept(buttonText?: string): Promise<void> {
        return this.#handleMobileDialog('accept', buttonText)
    }

    /**
     * Dismisses the mobile dialog by clicking the cancel/dismiss button.
     * For iOS: Uses accessibility ID selector to find the button.
     * For Android: Uses XPath to find the button by text.
     *
     * @param {string=} buttonText  The text of the button to click (e.g., 'Cancel', 'Don't Allow', 'No').
     *                               Defaults to 'Cancel' if not provided.
     * @returns {Promise<void>}
     */
    async dismiss(buttonText?: string): Promise<void> {
        return this.#handleMobileDialog('dismiss', buttonText)
    }

    /**
     * Handle mobile dialog acceptance/dismissal using element selectors.
     * For iOS: Uses accessibility IDs to find and click alert buttons.
     * For Android: Uses XPath to find and click buttons by text.
     *
     * @param {'accept' | 'dismiss'} action The action to perform on the dialog
     * @param {string=} userText Optional button text to click (e.g., 'OK', 'Allow', 'Cancel')
     */
    async #handleMobileDialog(action: 'accept' | 'dismiss', userText?: string): Promise<void> {
        const browser = this.#browser
        const buttonText = userText || (action === 'accept' ? 'OK' : 'Cancel')

        if (browser.isIOS) {
            // Get the current app's bundle ID before switching to SpringBoard
            const { bundleId } = await browser.execute('mobile: activeAppInfo') as { bundleId: string }

            // Activate SpringBoard so the permission dialog is accessible
            await browser.execute('mobile: activateApp', { bundleId: MobileDialog.SPRINGBOARD_BUNDLE_ID })

            try {
                // iOS: Use accessibility ID selector for the button (fastest/most reliable)
                await browser.$(`~${buttonText}`).click()
            } catch (err) {
                // Only ignore "no such element" errors (dialog not present or already handled).
                if (
                    err instanceof Error &&
                    (err.message.includes('no such element') || err.message.includes('Unable to find an element'))
                ) {
                    return
                }
                throw err
            } finally {
                // Always reactivate the original app, even if button click failed
                await browser.execute('mobile: activateApp', { bundleId })
            }
            return
        }

        // Android: Use XPath to find button by text
        // Escape single quotes in button text to prevent XPath injection
        const escapedText = buttonText.replace(/'/g, "\\'")
        const buttonSelector = `//android.widget.Button[@text='${escapedText}']`

        try {
            await browser.$(buttonSelector).click()
        } catch (err) {
            // Only ignore "no such element" errors (dialog not present or already handled).
            if (
                err instanceof Error &&
                (err.message.includes('no such element') || err.message.includes('Unable to find an element'))
            ) {
                return
            }
            throw err
        }
    }
}
