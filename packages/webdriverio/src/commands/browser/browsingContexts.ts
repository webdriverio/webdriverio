import { contextIdValue } from '../../session/browsingContext.js'
import { getBrowsingContext } from '../../browsingContext.js'

/**
 * Get every open tab and window of the session as a [browsing context](/docs/api/browsingContext),
 * in the order the browser reports them. This includes tabs the page opened itself,
 * e.g. through `target="_blank"` or `window.open()`. Frames are not in this list,
 * get them with [`frame()`](/docs/api/browsingContext/frame) on their tab.
 *
 * Only available in a WebDriver BiDi session.
 *
 * <example>
    :browsingContexts.js
    it('finds a tab the page opened', async () => {
        const page = await browser.url('https://the-internet.herokuapp.com/windows')
        await page.$('a[href="/windows/new"]').click()

        const tab = await browser.waitUntil(async () => (
            (await browser.browsingContexts()).find((context) => context.url.endsWith('/windows/new'))
        ))
        console.log(await tab.$('h3').getText()) // outputs: "New Window"
    })
 * </example>
 *
 * @alias browser.browsingContexts
 * @return {BrowsingContext[]} the open tabs and windows
 */
export async function browsingContexts (
    this: WebdriverIO.Browser
): Promise<WebdriverIO.BrowsingContext[]> {
    if (!this.isBidi) {
        throw new Error('`browsingContexts` is only available in a WebDriver BiDi session')
    }
    const { contexts } = await this.browsingContextGetTree({})
    return contexts.map((info) => getBrowsingContext(this, contextIdValue(info.context), {
        isFrame: false,
        url: info.url
    }))
}
