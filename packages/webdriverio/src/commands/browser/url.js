/**
 *
 * Protocol binding to load the URL of the browser. If a baseUrl is
 * specified in the config, it will be prepended to the url parameter using
 * node's url.resolve() method.
 *
 * <example>
    :url.js
    // navigate to a new URL
    browser.url('https://webdriver.io');
    // receive url
    console.log(browser.getUrl()); // outputs: "https://webdriver.io"

    :baseUrlResolutions.js
    // With a base URL of http://example.com/site, the following url parameters resolve as such:
    // When providing a scheme:
    // https://webdriver.io
    browser.url('https://webdriver.io');
    // When not starting with a slash, the URL resolves relative to the baseUrl
    // http://example.com/site/relative
    browser.url('relative');
    // When starting with a slash, the URL resolves relative to the root path of the baseUrl
    // http://example.com/rootRelative
    browser.url('/rootRelative');
 * </example>
 *
 * @param {String=} url  the URL to navigate to
 * @param {Function=} inject pass script as a function
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get
 * @see  https://nodejs.org/api/url.html#url_url_resolve_from_to
 * @type protocol
 *
 */

import nodeUrl from 'url'
import { validateUrl } from '../../utils'

export default async function url (path, { inject } = {} ) {
    /**
     * If inject is a function, then we attach puppeteer to the existing browser instance and
     * injects the passed function on the active tab
     *
     */
    if(inject) {
        if(typeof inject !== 'function') {
            throw new Error('Parameter "inject" for url command needs to be type of function')
        } else if(typeof inject === 'function') {
            const browser = await this.getPuppeteer()
            const allPages = await browser.pages()
            for(let page of allPages) {
                const state = await page.evaluate(() => document.visibilityState) // eslint-disable-line
                if(state === 'visible') {
                    await page.evaluate(inject)
                    break
                }
            }
        }
    }

    if (typeof path !== 'string') {
        throw new Error('Parameter "path" for url command needs to be type of string')
    }

    if (typeof this.options.baseUrl === 'string') {
        path = nodeUrl.resolve(this.options.baseUrl, path)
    }

    return this.navigateTo(validateUrl(path))
}
