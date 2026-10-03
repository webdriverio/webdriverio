import { getDialogManager } from '../../session/dialog.js'

/**
 * Dismiss the user prompt (`alert`, `confirm` or `prompt`) that is open in this
 * browsing context, like pressing "Cancel". Prompts in other tabs stay open.
 *
 * WebdriverIO dismisses prompts automatically unless something listens to the
 * `dialog` event, so register a listener first when you want to answer yourself.
 *
 * <example>
    :dismissAlert.js
    it('dismisses a confirm in one tab only', async () => {
        browser.on('dialog', () => {}) // keep prompts open
        const page = await browser.url('https://webdriver.io')

        const opened = new Promise((resolve) => browser.once('dialog', resolve))
        await page.execute(() => setTimeout(() => window.confirm('Leave?')))
        await opened
        await page.dismissAlert()
    })
 * </example>
 *
 * @alias browsingContext.dismissAlert
 */
export async function dismissAlert (this: WebdriverIO.BrowsingContext): Promise<void> {
    await this.browser.browsingContextHandleUserPrompt({
        context: this.contextId,
        accept: false
    })
    getDialogManager(this.browser).clearPrompt(this.contextId)
}
