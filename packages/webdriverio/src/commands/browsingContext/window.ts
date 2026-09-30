import { assertTopLevel } from '../../session/browsingContext.js'

export async function closeWindow (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'closeWindow')
    await this.browser.browsingContextClose({ context: this.contextId })
}

export async function activate (this: WebdriverIO.BrowsingContext): Promise<void> {
    assertTopLevel(this, 'activate')
    await this.browser.browsingContextActivate({ context: this.contextId })
}
