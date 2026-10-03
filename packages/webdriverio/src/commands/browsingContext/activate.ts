import { assertTopLevel } from '../../session/browsingContext.js'

/**
 * Bring the tab or window of this browsing context to the front and focus it.
 *
 * Commands run in every held browsing context whether it is in front or not, so you
 * only need this when the page reacts to focus or visibility, or before a visual check.
 * It does not change which context `browser.url()` navigates.
 *
 * Only a top-level browsing context can be activated, a frame rejects.
 *
 * <example>
    :activate.js
    it('brings a background tab to the front', async () => {
        const page = await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        await page.activate() // the first tab is in front again
        console.log(await tab.getTitle()) // the tab behind it still answers commands
    })
 * </example>
 *
 * @alias browsingContext.activate
 */
export async function activate (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'activate')
    await this.browser.browsingContextActivate({ context: this.contextId })
}
