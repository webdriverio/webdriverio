/**
 *
 * Navigate backwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back
 *
 */

module.exports = function back () {

    var callback = arguments[arguments.length - 1];

    if(this.desiredCapabilities.browserName === 'safari') {

        /**
         * helper for safaridriver which doesn not support forward
         */
        this.execute('history.go(-1)');

    } else {

        var requestOptions = {
            path: '/session/:sessionId/back',
            method: 'POST'
        };

        this.requestHandler.create(requestOptions,callback);

    }

};
