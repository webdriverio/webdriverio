import { assertTopLevel } from '../../session/browsingContext.js'
import { traverseTopLevelHistory } from '../../utils/traverseHistory.js'

/**
 * Go back one entry in the history of this tab or window, like the browser's back
 * button, and wait until that page is ready (following the `pageLoadStrategy`
 * capability, like `browser.back()`). Other tabs keep their page.
 *
 * Only a top-level browsing context has its own history, a frame rejects.
 *
 * <example>
    :back.js
    it('goes back in one tab', async () => {
        const page = await browser.url('https://webdriver.io')
        await page.navigate('https://webdriver.io/docs/api')

        await page.back()
        console.log(await page.getUrl()) // outputs: "https://webdriver.io/"
    })
 * </example>
 *
 * @alias browsingContext.back
 */
export async function back (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'back')
    await traverseTopLevelHistory(this.browser, -1, this.contextId)
}
