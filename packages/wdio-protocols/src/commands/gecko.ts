// gecko types
export default interface GeckoCommands {
    /**
     * Gecko Protocol Command
     *
     * Captures a screenshot of the entire page.
     * @ref https://phabricator.services.mozilla.com/source/mozilla-central/browse/default/testing/geckodriver/src/command.rs$43-46
     *
     */
    fullPageScreenshot(): string

    /**
     * Gecko Protocol Command
     *
     * Get the context that is currently in effect, e.g. `CHROME` or `CONTENT`.
     * @ref https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L615-L622
     *
     * @example
     * ```js
     * console.log(await browser.getMozContext()); // outputs: 'CHROME'
     * ```
     */
    getMozContext(): string

    /**
     * Gecko Protocol Command
     *
     * Changes target context for commands between chrome- and content.<br /><br />Changing the current context has a stateful impact on all subsequent commands. The `CONTENT` context has normal web platform document permissions, as if you would evaluate arbitrary JavaScript. The `CHROME` context gets elevated permissions that lets you manipulate the browser chrome itself, with full access to the XUL toolkit.
     * @ref https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L615-L645
     *
     * @example
     * ```js
     * console.log(await browser.getMozContext()); // outputs: 'CHROME'
     * browser.setMozContext('CONTENT');
     * console.log(await browser.getMozContext()); // outputs: 'CONTENT'
     * ```
     */
    setMozContext(context: string): void

    /**
     * Gecko Protocol Command
     *
     * Installs a new addon with the current session. This function will return an ID that may later be used to uninstall the addon using `uninstallAddon`.
     * @ref https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L647-L668
     *
     * @example
     * ```js
     * // Create a buffer of the add on .zip file
     * const extension = await fs.promises.readFile('/path/to/extension.zip')
     * // Load extension in Firefox
     * const id = await browser.installAddOn(extension.toString('base64'), false);
     * ```
     */
    installAddOn(addon: string, temporary: boolean): string

    /**
     * Gecko Protocol Command
     *
     * Uninstalls an addon from the current browser session's profile.
     * @ref https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L670-L687
     *
     * @example
     * ```js
     * // Create a buffer of the add on .zip file
     * const extension = await fs.promises.readFile('/path/to/extension.zip')
     * // Load extension in Firefox
     * const id = await browser.installAddOn(extension.toString('base64'), false);
     * // ...
     * await browser.uninstallAddOn(id)
     * ```
     */
    uninstallAddOn(id: string): void
}
