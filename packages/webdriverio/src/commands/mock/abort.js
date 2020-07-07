/**
 * Abort the request with one of the following error codes:
 * `Failed`, `Aborted`, `TimedOut`, `AccessDenied`, `ConnectionClosed`,
 * `ConnectionReset`, `ConnectionRefused`, `ConnectionAborted`,
 * `ConnectionFailed`, `NameNotResolved`, `InternetDisconnected`,
 * `AddressUnreachable`, `BlockedByClient`, `BlockedByResponse`.
 *
 * <example>
    :abort.js
    it('should block Google Analytics from page', () => {
        const mock = browser.network.mock('https://www.google-analytics.com/**')
        mock.abort('Failed')
    })
 * </example>
 *
 * @alias mock.abort
 * @param {string} errorCode  error code of the response
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
