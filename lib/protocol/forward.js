/**
 * Navigate forwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward
 *
 * @test forward.js test/spec/desktop/forward/index.js
 * @test pageA.html test/spec/desktop/forward/pageA.html
 * @test pageB.html test/spec/desktop/forward/pageB.html
 */

module.exports = function forward () {

    var callback = arguments[arguments.length - 1];

    if(this.desiredCapabilities.browserName === 'safari') {

        /**
         * helper for safaridriver which doesn not support forward
         */
        this.execute('history.go(+1)', arguments[arguments.length - 1]);

    } else {

        var requestOptions = {
            path: '/session/:sessionId/forward',
            method: 'POST'
        };

        this.requestHandler.create(requestOptions, arguments[arguments.length - 1]);

    }
};
