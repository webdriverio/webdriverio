import { assertTopLevel } from '../../session/browsingContext.js'
import { traverseTopLevelHistory } from '../../utils/traverseHistory.js'

/**
 * Like `browser.back()` and `browser.forward()`, wait until the page the
 * traversal lands on is ready, so the next command doesn't race it.
 */
export async function back (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'back')
    await traverseTopLevelHistory(this.browser, -1, this.contextId)
}

export async function forward (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'forward')
    await traverseTopLevelHistory(this.browser, 1, this.contextId)
}
