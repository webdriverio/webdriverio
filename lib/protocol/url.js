/**
 *
 * Protocol binding to load or get the URL of the browser. If a baseUrl is
 * specified in the config, it will be prepended to the url parameter using
 * node's url.resolve() method.
 *
 * <example>
    :url.js
    // navigate to a new URL
    browser.url('http://webdriver.io');
    // receive url
    console.log(browser.getUrl()); // outputs: "http://webdriver.io"
    :baseUrlResolutions.js
    // With a base URL of http://example.com/site, the following url parameters resolve as such:
    // When providing a scheme:
    // http://webdriver.io
    browser.url('http://webdriver.io');
    // When not starting with a slash, the URL resolves relative to the baseUrl
    // http://example.com/site/relative
    browser.url('relative');
    // When starting with a slash, the URL resolves relative to the root path of the baseUrl
    // http://example.com/rootRelative
    browser.url('/rootRelative');
 * </example>
 *
 * @param {String=} url  the URL to navigate to
 * @return {String}     the current URL
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get
 * @see  https://nodejs.org/api/url.html#url_url_resolve_from_to
 * @type protocol
 *
 */

import nodeUrl from 'url'

export default function url (uri) {
    let data = {}

    if (typeof uri === 'string') {
        data.url = uri
        if (typeof this.options.baseUrl === 'string') {
            data.url = nodeUrl.resolve(this.options.baseUrl, data.url)
        }
    }

    return this.requestHandler.create('/session/:sessionId/url', data)
}
