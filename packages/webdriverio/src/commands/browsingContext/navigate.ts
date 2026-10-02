import type { UrlCommandOptions } from '../browser/navigateInContext.js'
import { navigateInContext } from '../browser/navigateInContext.js'

/**
 * Navigate this browsing context. `browser.url()` stays on the browser and
 * always targets the session's initial context. `url` on this object is the
 * document URL string, so the command is `navigate`.
 */
export async function navigate (
    this: WebdriverIO.BrowsingContext,
    path: string,
    options: UrlCommandOptions = {}
): Promise<WebdriverIO.BrowsingContext> {
    if (typeof path !== 'string') {
        throw new Error('Parameter for "navigate" command needs to be type of string')
    }

    const browser = this.browser
    if (typeof browser.options.baseUrl === 'string' && browser.options.baseUrl) {
        path = (new URL(path, browser.options.baseUrl)).href
    }

    const request = await navigateInContext(browser, this.contextId, path, options)
    this.url = path
    if (request) {
        this.request = request
    }
    return this
}
