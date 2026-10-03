import { assertTopLevel } from '../../session/browsingContext.js'

/**
 * Close the tab or window of this browsing context. Other tabs and windows stay
 * open, and the session keeps running as long as one of them is left.
 *
 * Commands on the closed context, and on frames of it, reject afterwards.
 * Mocks made on the context end with it.
 *
 * Only a top-level browsing context can be closed, a frame rejects.
 *
 * <example>
    :closeWindow.js
    it('closes a tab it opened', async () => {
        const page = await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        await tab.closeWindow()
        console.log((await browser.browsingContexts()).length) // outputs: 1
        console.log(await page.getTitle()) // the first tab is unchanged
    })
 * </example>
 *
 * @alias browsingContext.closeWindow
 */
export async function closeWindow (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'closeWindow')
    await this.browser.browsingContextClose({ context: this.contextId })
}
