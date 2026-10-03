import type { UrlCommandOptions } from '../browser/navigateInContext.js'
import { navigateInContext } from '../browser/navigateInContext.js'

/**
 * Navigate this browsing context to a URL and wait until the page has loaded.
 * It works for a tab, a window or a frame. Only this context navigates: other tabs
 * keep their page, and the parents of a frame stay where they are.
 *
 * `browser.url()` always navigates the session's first top-level browsing context,
 * so use `navigate()` for any other one. It takes the same options as
 * [`browser.url()`](/docs/api/browser/url), and a relative URL resolves against
 * the `baseUrl` option. Returns this context, with `url` and `request` updated.
 *
 * <example>
    :navigate.js
    it('navigates one tab without touching the other', async () => {
        const page = await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io', { type: 'tab' })

        await tab.navigate('https://webdriver.io/docs/api', { wait: 'interactive' })
        console.log(tab.url) // outputs: "https://webdriver.io/docs/api"
        console.log(await page.getUrl()) // outputs: "https://webdriver.io/"
    })
 * </example>
 *
 * @param {string}            url                    the URL to navigate to, absolute or relative to `baseUrl`
 * @param {UrlCommandOptions=} options               navigation options, the same as for `browser.url()`
 * @param {string=}           options.wait           the readiness to wait for: `none`, `interactive`, `complete` (default) or `networkIdle`
 * @param {number=}           options.timeout        how long to wait for the page to load, in milliseconds
 * @param {Function=}         options.onBeforeLoad   a function that runs in the page before its own scripts
 * @param {Object=}           options.auth           basic authentication credentials, `{ user, pass }`
 * @param {Object=}           options.headers        headers to send with the request
 * @alias browsingContext.navigate
 * @return {WebdriverIO.BrowsingContext}  this browsing context
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
