/**
 * > This is a __beta__ feature. Please give us feedback and file [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) if certain scenarions don't work as expected!
 *
 * Abort the request once with one of the following error codes:
 * `Failed`, `Aborted`, `TimedOut`, `AccessDenied`, `ConnectionClosed`,
 * `ConnectionReset`, `ConnectionRefused`, `ConnectionAborted`,
 * `ConnectionFailed`, `NameNotResolved`, `InternetDisconnected`,
 * `AddressUnreachable`, `BlockedByClient`, `BlockedByResponse`.
 *
 * <example>
    :abortOnce.js
    it('should block mock only once', () => {
        const mock = browser.mock('https://webdriver.io')
        mock.abortOnce('Failed')

        browser.url('https://webdriver.io')
            // catch failing command as page can't be loaded
            .catch(() => {})
        console.log(browser.getTitle()) // outputs: ""

        browser.url('https://webdriver.io')
        console.log(browser.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
    })
 * </example>
 *
 * @alias mock.abort
 * @param {ErrorCode} errorCode  error code of the response, can be one of: `Failed`, `Aborted`, `TimedOut`, `AccessDenied`, `ConnectionClosed`, `ConnectionReset`, `ConnectionRefused`, `ConnectionAborted`, `ConnectionFailed`, `NameNotResolved`, `InternetDisconnected`, `AddressUnreachable`, `BlockedByClient`, `BlockedByResponse`
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
