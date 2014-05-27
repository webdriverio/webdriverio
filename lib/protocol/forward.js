/**
 * Navigate forwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward
 *
 */

module.exports = function forward () {

    var callback = arguments[arguments.length - 1];

    if(this.desiredCapabilities.browserName === 'safari') {

        /**
         * helper for safaridriver which doesn not support forward
         * Reason: "Yikes! Safari history navigation does not work. We can go forward or back, but once we do, we can no longer communicate with the page"
         */
        this.execute('history.go(+1)', callback);

    } else {

        var requestOptions = {
            path: '/session/:sessionId/forward',
            method: 'POST'
        };

        this.requestHandler.create(requestOptions, callback);

    }
};
