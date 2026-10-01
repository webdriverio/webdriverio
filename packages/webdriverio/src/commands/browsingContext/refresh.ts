export async function refresh (this: WebdriverIO.BrowsingContext): Promise<void> {
    await this.browser.browsingContextReload({
        context: this.contextId,
        wait: 'complete'
    })
}
