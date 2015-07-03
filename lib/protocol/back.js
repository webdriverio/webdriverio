/**
 *
 * Navigate backwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back
 * @type protocol
 *
 */

module.exports = function back() {

    if (this.desiredCapabilities.browserName === 'safari') {

        /*!
         * helper for safaridriver which doesn not support forward
         * Reason: "Yikes! Safari history navigation does not work. We can go forward or back,
         * but once we do, we can no longer communicate with the page"
         */
        return this.execute('history.go(-1)').waitForExist('body', 5000);

    }

    var requestOptions = {
        path: '/session/:sessionId/back',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};