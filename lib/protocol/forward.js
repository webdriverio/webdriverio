/**
 * Navigate forwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward
 * @type protocol
 *
 */

module.exports = function forward () {

    if(this.desiredCapabilities.browserName === 'safari') {

        /*!
         * helper for safaridriver which doesn not support forward
         * Reason: "Yikes! Safari history navigation does not work. We can go forward or back,
         * but once we do, we can no longer communicate with the page"
         */
        return this.execute('history.go(+1)').waitForExist('body', 5000);

    } else {

        var requestOptions = {
            path: '/session/:sessionId/forward',
            method: 'POST'
        };

        return this.requestHandler.create(requestOptions);

    }
};
