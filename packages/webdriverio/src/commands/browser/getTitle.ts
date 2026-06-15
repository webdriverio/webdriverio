import { getContextManager } from '../../session/context.js'

/**
 * Get the document title of the current browsing context.
 *
 * In Bidi mode, uses `script.evaluate` to fetch the title from the
 * context tracked by ContextManager. Falls back to `executeScript`
 * for non-Bidi sessions (avoids recursion with the protocol command).
 *
 * @returns {Promise<string>} current page title
 * @alias browser.getTitle
 */
export async function getTitle(this: WebdriverIO.Browser): Promise<string> {
    if (this.isBidi) {
        const contextManager = getContextManager(this)
        const context = await contextManager.getCurrentContext()
        const result = await this.scriptEvaluate({
            expression: 'document.title',
            target: { context },
            awaitPromise: false
        })
        return (result as { result: { value: string } }).result?.value || ''
    }

    /**
     * Use execute (executeScript) as the non-Bidi fallback.
     * This avoids calling the protocol `getTitle` which would recurse
     * since this wrapper overrides it.
     */
    return this.execute(() => document.title) as Promise<string>
}
