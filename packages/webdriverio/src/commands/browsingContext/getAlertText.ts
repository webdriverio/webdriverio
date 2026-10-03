import { getDialogManager } from '../../session/dialog.js'

/**
 * Get the message of the user prompt (`alert`, `confirm` or `prompt`) that is
 * open in this browsing context. Rejects with `no such alert` when none is open.
 *
 * WebdriverIO dismisses prompts automatically unless something listens to the
 * `dialog` event, so register a listener first.
 *
 * <example>
    :getAlertText.js
    it('reads the message of a prompt', async () => {
        browser.on('dialog', () => {}) // keep prompts open
        const page = await browser.url('https://webdriver.io')

        const opened = new Promise((resolve) => browser.once('dialog', resolve))
        await page.execute(() => setTimeout(() => window.alert('Saved')))
        await opened
        console.log(await page.getAlertText()) // outputs: "Saved"
        await page.acceptAlert()
    })
 * </example>
 *
 * @alias browsingContext.getAlertText
 * @return {string}  the prompt message
 */
export async function getAlertText (this: WebdriverIO.BrowsingContext): Promise<string> {
    const stored = getDialogManager(this.browser).promptMessage(this.contextId)
    if (stored !== undefined) {
        return stored
    }
    return this.browser.getAlertText()
}
