/**
 *
 * Get all the contexts available in the current session.
 *
 *
 * <example>
    :example.test.js
    it('should return all contexts in the current session with the default Appium `contexts`-method.', async () => {
        // For Android
        await driver.getContexts()
        // Returns ['NATIVE_APP', 'WEBVIEW_com.wdiodemoapp', ...]
        //
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.getContexts()
        // Returns ['NATIVE_APP', 'WEBVIEW_94703.19', ...]
    })
 * </example>
 *
 * @param {boolean=}    getDetailed  If true, return detailed information about the contexts. Default: `false`
 *
 * @TODO: Also change the context manager because it needs to keep track of the context to which we switch, so we also need to add the renamed Appium commands to the context manager.
 */
export async function getContexts(
    this: WebdriverIO.Browser,
    options?: boolean
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `switchContext` command is only available for mobile platforms.')
    }

    if (!options) {
        return browser.getAppiumContexts()
    }

}
