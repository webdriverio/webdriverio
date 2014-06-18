/**
 *
 * Navigate backwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back
 * @type protocol
 *
 */

module.exports = function back() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if (this.desiredCapabilities.browserName === 'safari') {

        /*!
         * helper for safaridriver which doesn not support forward
         * Reason: "Yikes! Safari history navigation does not work. We can go forward or back, but once we do, we can no longer communicate with the page"
         */
        this.execute('history.go(-1)').waitFor('body', 5000).call(callback);

    } else {

        var requestOptions = {
            path: '/session/:sessionId/back',
            method: 'POST'
        };

        this.requestHandler.create(requestOptions, callback);

    }

};