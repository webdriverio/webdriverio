/**
 *
 * Protocol binding to load or get the URL of the browser.
 *
 * <example>
    :url.js
    // navigate to a new URL
    browser.url('http://webdriver.io');
    // receive url
    console.log(browser.getUrl()); // outputs: "http://webdriver.io"
 * </example>
 *
 * @param {String=} url  the URL to navigate to
 * @return {String}     the current URL
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get
 * @type protocol
 *
 */

export default function url (uri) {
    let data = {}

    if (typeof uri === 'string') {
        data.url = uri
        if (typeof this.options.baseUrl === 'string' && /^(\/|\?)/.test(data.url)) {
            data.url = this.options.baseUrl + data.url
        }
    }

    return this.requestHandler.create('/session/:sessionId/url', data)
}
