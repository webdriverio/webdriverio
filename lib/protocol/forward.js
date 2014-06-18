/**
 * Navigate forwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward
 * @type protocol
 *
 */

module.exports = function forward () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(this.desiredCapabilities.browserName === 'safari') {

        /*!
         * helper for safaridriver which doesn not support forward
         * Reason: "Yikes! Safari history navigation does not work. We can go forward or back, but once we do, we can no longer communicate with the page"
         */
        this.execute('history.go(+1)').waitFor('body', 5000).call(callback);

    } else {

        var requestOptions = {
            path: '/session/:sessionId/forward',
            method: 'POST'
        };

        this.requestHandler.create(requestOptions, callback);

    }
};
