/**
 *
 * Get the context of the current session.
 *
 *
 * <example>
    :example.test.js
    it('should return the current context', async () => {
        // For Android
        await driver.getContext()
        // Returns 'WEBVIEW_com.wdiodemoapp' or 'NATIVE_APP'
        //
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.getContext()
        // Returns 'WEBVIEW_94703.19' or 'NATIVE_APP'
    })
 * </example>
 *
 * @TODO: Also change the context manager because it needs to keep track of the context to which we switch, so we also need to add the renamed Appium commands to the context manager.
 */
export async function getContext(
    this: WebdriverIO.Browser,
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getContext` command is only available for mobile platforms.')
    }

    return browser.getAppiumContext()
}
