import { validateUrl } from '../../utils/index.js'

/**
 *
 * Protocol binding to load the URL of the browser. If a baseUrl is
 * specified in the config, it will be prepended to the url parameter using
 * node's url.resolve() method. Calling `browser.url('...')` with the same url as last
 * time will trigger a page reload.
 *
 * <example>
    :url.js
    // navigate to a new URL
    await browser.url('https://webdriver.io');
    // receive url
    console.log(await browser.getUrl()); // outputs: "https://webdriver.io"

    :baseUrlResolutions.js
    // With a base URL of http://example.com/site, the following url parameters resolve as such:
    // When providing a scheme:
    // https://webdriver.io
    await browser.url('https://webdriver.io');

    // When not starting with a slash, the URL resolves relative to the baseUrl
    // http://example.com/site/relative
    await browser.url('relative');

    // When starting with a slash, the URL resolves relative to the root path of the baseUrl
    // http://example.com/rootRelative
    await browser.url('/rootRelative');
 * </example>
 *
 * @param {String=} url  the URL to navigate to
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get
 * @see  https://nodejs.org/api/url.html#url_url_resolve_from_to
 * @type protocol
 *
 */
export function url (
    this: WebdriverIO.Browser,
    path: string
) {
    if (typeof path !== 'string') {
        throw new Error('Parameter for "url" command needs to be type of string')
    }

    if (typeof this.options.baseUrl === 'string' && this.options.baseUrl) {
        path = (new URL(path, this.options.baseUrl)).href
    }

    return this.navigateTo(validateUrl(path))
}
