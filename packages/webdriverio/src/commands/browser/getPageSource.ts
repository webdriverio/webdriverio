import { getContextManager } from '../../session/context.js'

/**
 * Get the page source (DOM) of the current browsing context.
 *
 * In Bidi mode, uses `script.evaluate` to fetch the source from the
 * context tracked by ContextManager. Falls back to `executeScript`
 * for non-Bidi sessions.
 *
 * @returns {Promise<string>} current page source
 * @alias browser.getPageSource
 */
export async function getPageSource(this: WebdriverIO.Browser): Promise<string> {
    if (this.isBidi) {
        const contextManager = getContextManager(this)
        const context = await contextManager.getCurrentContext()
        const result = await this.scriptEvaluate({
            expression: 'document.documentElement.outerHTML',
            target: { context },
            awaitPromise: false
        })
        return (result as { result: { value: string } }).result?.value || ''
    }

    /**
     * Use execute for the non-Bidi fallback to avoid recursion
     * with the protocol `getPageSource` command.
     */
    return this.execute(() => document.documentElement.outerHTML) as Promise<string>
}
