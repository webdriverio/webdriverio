/**
 *
 * Protocol bindings for all sessionStorage operations. This command is not part of the official Webdriver
 * specification. Therefor it might not be supported in your browser.
 *
 * <example>
    :sessionStorage.js
    it('should set/receive values from session storage', function () {
        // get the storage item for the given key
        var values = browser.sessionStorage('GET', someKey);

        // get all key/value pairs of the storage
        var storage = browser.sessionStorage();

        // set the storage item for the given key
        browser.sessionStorage('POST', {key: someKey, value: someValue});

        // remove the storage item for the given key
        browser.sessionStorage('DELETE', 'someKey');

        // clear the storage
        browser.sessionStorage('DELETE');
    });
 * </example>
 *
 * @param {String=}        method  method for storage operation
 * @param {Object|String=} args    operation arguments
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidsession_storage
 * @type protocol
 *
 */

export default function sessionStorage (method = 'GET', args) {
    /**
     * set default options
     */
    let data = {}
    let requestOptions = {
        path: '/session/:sessionId/session_storage',
        method: method.toUpperCase()
    }

    if (requestOptions.method === 'POST' && typeof args === 'object') {
        data = {
            key: args.key,
            value: args.value
        }
    }

    /**
     * add/delete specific key
     */
    if ((requestOptions.method === 'DELETE' && typeof args === 'string') ||
       (requestOptions.method === 'GET' && typeof args === 'string')) {
        requestOptions.path += '/key/' + args
    }

    return this.requestHandler.create(requestOptions, data)
}
