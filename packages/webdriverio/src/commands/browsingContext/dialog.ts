import { getDialogManager } from '../../session/dialog.js'

export async function acceptAlert (this: WebdriverIO.BrowsingContext, userText?: string): Promise<void> {
    await this.browser.browsingContextHandleUserPrompt({
        context: this.contextId,
        accept: true,
        ...(userText !== undefined ? { userText } : {})
    })
    getDialogManager(this.browser).clearPrompt(this.contextId)
}

export async function dismissAlert (this: WebdriverIO.BrowsingContext): Promise<void> {
    await this.browser.browsingContextHandleUserPrompt({
        context: this.contextId,
        accept: false
    })
    getDialogManager(this.browser).clearPrompt(this.contextId)
}

export async function getAlertText (this: WebdriverIO.BrowsingContext): Promise<string> {
    const stored = getDialogManager(this.browser).promptMessage(this.contextId)
    if (stored !== undefined) {
        return stored
    }
    return this.browser.getAlertText()
}
