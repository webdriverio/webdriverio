/**
 * Reload this browsing context and wait until the new document has loaded.
 */
export async function refresh (this: WebdriverIO.BrowsingContext): Promise<void> {
    if (this.isFrame) {
        return reloadFrame(this)
    }
    await this.browser.browsingContextReload({
        context: this.contextId,
        wait: 'complete'
    })
}

/**
 * Chromium answers `browsingContext.reload` on a frame by replacing the
 * frame's browsing context, so the held frame would stop working. Reload from
 * inside the frame instead, which keeps its context, and wait for a new
 * document to finish loading within the session's page load timeout.
 */
async function reloadFrame (frame: WebdriverIO.BrowsingContext) {
    const token = await frame.execute(() => {
        const marker = Math.random().toString(36).slice(2)
        ;(window as unknown as { __wdioReload?: string }).__wdioReload = marker
        setTimeout(() => location.reload(), 0)
        return marker
    })
    const capabilities = frame.browser.capabilities as { timeouts?: { pageLoad?: number } }
    await frame.waitUntil(async () => {
        const state = await frame.execute(() => ({
            marker: (window as unknown as { __wdioReload?: string }).__wdioReload,
            ready: document.readyState
        })).catch(() => undefined)
        return Boolean(state && state.marker !== token && state.ready === 'complete')
    }, {
        timeout: capabilities.timeouts?.pageLoad ?? 300000,
        interval: 50,
        timeoutMsg: 'The frame did not finish reloading'
    })
}
