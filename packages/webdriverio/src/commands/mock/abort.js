/**
 * Abort the request with one of the following error codes:
 * `Failed`, `Aborted`, `TimedOut`, `AccessDenied`, `ConnectionClosed`,
 * `ConnectionReset`, `ConnectionRefused`, `ConnectionAborted`,
 * `ConnectionFailed`, `NameNotResolved`, `InternetDisconnected`,
 * `AddressUnreachable`, `BlockedByClient`, `BlockedByResponse`.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', () => {
        const mock = await browser.network.mock('/todos')
        mock.abort('Failed')
    })
 * </example>
 *
 * @alias mock.abort
 * @param {string} errorCode  error code of the response
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
