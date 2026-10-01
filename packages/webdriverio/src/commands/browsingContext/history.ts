import { assertTopLevel } from '../../session/browsingContext.js'

export async function back (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'back')
    await this.browser.browsingContextTraverseHistory({
        context: this.contextId,
        delta: -1
    })
}

export async function forward (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'forward')
    await this.browser.browsingContextTraverseHistory({
        context: this.contextId,
        delta: 1
    })
}
