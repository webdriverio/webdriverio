import { getContextManager } from '../../session/context.js'

/**
 * Get the URL of the current browsing context.
 *
 * In Bidi mode, uses `browsingContext.getTree` to fetch the URL from
 * the context tracked by ContextManager. Falls back to `execute` for
 * non-Bidi sessions to avoid recursion with the protocol command.
 *
 * @returns {Promise<string>} current page URL
 * @alias browser.getUrl
 */
export async function getUrl(this: WebdriverIO.Browser): Promise<string> {
    if (this.isBidi) {
        const contextManager = getContextManager(this)
        const context = await contextManager.getCurrentContext()
        const tree = await this.browsingContextGetTree({ root: context })
        return tree.contexts[0]?.url || ''
    }

    /**
     * Use execute as the non-Bidi fallback to avoid recursion
     * with the protocol `getUrl` command (same name as this wrapper).
     */
    return this.execute(() => window.location.href) as Promise<string>
}
