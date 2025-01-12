import type { SwitchContextOptions } from '../../types.js'

/**
 *
 * Switch into the context with the given name
 *
 *
 * <example>
    :example.test.js
    it('should switch to a webview with the default Appium `context`-method', async () => {
        // For Android, the context will be '`WEBVIEW_{packageName}`'
        await driver.switchContext('WEBVIEW_com.wdiodemoapp')
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.switchContext('WEBVIEW_94703.19')
    })
 * </example>
 *
 * @param {string|SwitchContextOptions}   context          The name of the context to switch to. An object with more context options can be provided.
 * @param {SwitchContextOptions}         options          dragAndDrop command options
 * @param {string}                        options.context  the name of the context to switch to
 * @param {string=}                       options.title    the title of the page to switch to. This will be the content of the title-tag of a webviewpage.
 * @param {string=}                       options.url      the url of the page to switch to. This will be the `url` of a webviewpage.
 * @skipUsage
 * @TODO: Also change the context manager because it needs to keep track of the context to which we switch, so we also need to add the renamed Appium commands to the context manager.
 */
export async function switchContext(
    this: WebdriverIO.Browser,
    options: string | SwitchContextOptions
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `switchContext` command is only available for mobile platforms.')
    }

    if (!options) {
        throw new Error('You need to provide at least a context name to switch to. See https://webdriver.io/docs/api/mobile/switchContext for more information.')
    }

    if (typeof options === 'string') {
        return browser.switchAppiumContext(options as string)
    }

}
