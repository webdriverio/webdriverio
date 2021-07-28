/**
 * Abort the request once with one of the following error codes:
 * `Failed`, `Aborted`, `TimedOut`, `AccessDenied`, `ConnectionClosed`,
 * `ConnectionReset`, `ConnectionRefused`, `ConnectionAborted`,
 * `ConnectionFailed`, `NameNotResolved`, `InternetDisconnected`,
 * `AddressUnreachable`, `BlockedByClient`, `BlockedByResponse`.
 *
 * <example>
    :abortOnce.js
    it('should block mock only once', async () => {
        const mock = await browser.mock('https://webdriver.io')
        mock.abortOnce('Failed')

        await browser.url('https://webdriver.io')
            // catch failing command as page can't be loaded
            .catch(() => {})
        console.log(await browser.getTitle()) // outputs: ""

        await browser.url('https://webdriver.io')
        console.log(await browser.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
    })
 * </example>
 *
 * @alias mock.abort
 * @param {ErrorCode} errorCode  error code of the response, can be one of: `Failed`, `Aborted`, `TimedOut`, `AccessDenied`, `ConnectionClosed`, `ConnectionReset`, `ConnectionRefused`, `ConnectionAborted`, `ConnectionFailed`, `NameNotResolved`, `InternetDisconnected`, `AddressUnreachable`, `BlockedByClient`, `BlockedByResponse`
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
