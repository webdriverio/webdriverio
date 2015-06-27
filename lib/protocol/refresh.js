/**
 *
 * Refresh the current page.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/refresh
 * @type protocol
 *
 */

module.exports = function refresh() {

    var requestOptions = {
        path: '/session/:sessionId/refresh',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};
