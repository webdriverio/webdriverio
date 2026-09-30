import { annotateWebExtensionError } from '../../utils/webExtension.js'

/**
 * Uninstall a web extension that was installed with [`installExtension`](/docs/api/browser/installExtension).
 *
 * Pass the extension id string that `installExtension` returned. There is no restore-function
 * wrapper: the id is what you keep, and this command matches [`webExtension.uninstall`](https://w3c.github.io/webdriver-bidi/#command-webExtension-uninstall).
 *
 * <example>
    :uninstallExtension.js
    const id = await browser.installExtension('./dist')
    await browser.uninstallExtension(id)
 * </example>
 *
 * The session must speak WebDriver BiDi. A classic session throws an error that names
 * `webExtension.uninstall`. Safari has no BiDi session, so this command does not cover Safari.
 * Uninstalling an id the browser does not know returns `no such web extension`.
 *
 * On Chrome and Edge this command stays unavailable until the browser is started with
 * `--enable-unsafe-extension-debugging` and `--remote-debugging-pipe`. See
 * [`installExtension`](/docs/api/browser/installExtension).
 *
 * [`browser.webExtensionUninstall`](/docs/api/webdriverBidi) remains available when you want the spec payload.
 * This does not remove Firefox [`uninstallAddOn`](/docs/api/gecko#uninstalladdon).
 *
 * @alias browser.uninstallExtension
 * @param {string} extensionId extension id returned by `installExtension`
 * @type utility
 * @uses protocol/webExtensionUninstall
 */
export async function uninstallExtension (
    this: WebdriverIO.Browser,
    extensionId: string
): Promise<void> {
    if (!this.isBidi) {
        throw new Error('uninstallExtension requires a WebDriver BiDi session (webExtension.uninstall)')
    }
    if (typeof extensionId !== 'string' || extensionId.length === 0) {
        throw new Error('uninstallExtension expects the extension id returned by installExtension')
    }

    try {
        await this.webExtensionUninstall({ extension: extensionId })
    } catch (err) {
        throw annotateWebExtensionError(err, 'webExtension.uninstall')
    }
}
