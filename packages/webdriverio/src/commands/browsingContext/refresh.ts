/**
 * Reload the document of this browsing context and wait until the new document
 * has loaded. Other tabs and frames are not reloaded. A frame reloads only its own
 * document and keeps its browsing context, so the object you hold stays usable.
 *
 * <example>
    :refresh.js
    it('reloads one frame', async () => {
        const page = await browser.url('https://the-internet.herokuapp.com/nested_frames')
        const bottom = await page.frame({ selector: 'frame[name="frame-bottom"]' })

        await bottom.refresh()
        console.log(await bottom.$('body').getText()) // outputs: "BOTTOM", the frame is still usable
    })
 * </example>
 *
 * @alias browsingContext.refresh
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
        /**
         * Reload after this script returned. A message, not `setTimeout`:
         * fake timers (e.g. `emulate('clock')`) replace `setTimeout`.
         */
        const channel = new MessageChannel()
        channel.port1.onmessage = () => location.reload()
        channel.port2.postMessage(null)
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
