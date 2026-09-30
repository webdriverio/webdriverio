import { contextIdValue } from '../../session/browsingContext.js'
import { getBrowsingContext } from '../../browsingContext.js'

/**
 * Top-level browsing contexts of this session: the open tabs and windows.
 * Frames are reached with `context.frame()`, not this list.
 *
 * @alias browser.browsingContexts
 * @return {BrowsingContext[]} open top-level browsing contexts
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
