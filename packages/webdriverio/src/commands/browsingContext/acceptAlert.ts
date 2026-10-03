import { getDialogManager } from '../../session/dialog.js'

/**
 * Accept the user prompt (`alert`, `confirm` or `prompt`) that is open in this
 * browsing context. Prompts in other tabs stay open.
 *
 * WebdriverIO dismisses prompts automatically unless something listens to the
 * `dialog` event, so register a listener first. In a listener you can also
 * answer with the [dialog object](/docs/api/dialog) directly.
 *
 * <example>
    :acceptAlert.js
    it('accepts a confirm in a background tab', async () => {
        browser.on('dialog', () => {}) // keep prompts open
        await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io', { type: 'tab' })

        const opened = new Promise((resolve) => browser.once('dialog', resolve))
        await tab.execute(() => setTimeout(() => window.confirm('Continue?')))
        await opened
        await tab.acceptAlert()
    })
 * </example>
 *
 * @param {string=} userText  text to enter into a `prompt`
 * @alias browsingContext.acceptAlert
 */
export async function acceptAlert (this: WebdriverIO.BrowsingContext, userText?: string): Promise<void> {
    await this.browser.browsingContextHandleUserPrompt({
        context: this.contextId,
        accept: true,
        ...(userText !== undefined ? { userText } : {})
    })
    getDialogManager(this.browser).clearPrompt(this.contextId)
}
