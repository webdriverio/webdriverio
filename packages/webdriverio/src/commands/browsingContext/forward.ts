import { assertTopLevel } from '../../session/browsingContext.js'
import { traverseTopLevelHistory } from '../../utils/traverseHistory.js'

/**
 * Go forward one entry in the history of this tab or window, like the browser's
 * forward button, and wait until that page is ready (following the
 * `pageLoadStrategy` capability, like `browser.forward()`). Other tabs keep their page.
 *
 * Only a top-level browsing context has its own history, a frame rejects.
 *
 * <example>
    :forward.js
    it('goes forward in one tab', async () => {
        const page = await browser.url('https://webdriver.io')
        await page.navigate('https://webdriver.io/docs/api')
        await page.back()

        await page.forward()
        console.log(await page.getUrl()) // outputs: "https://webdriver.io/docs/api/"
    })
 * </example>
 *
 * @alias browsingContext.forward
 */
export async function forward (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'forward')
    await traverseTopLevelHistory(this.browser, 1, this.contextId)
}
