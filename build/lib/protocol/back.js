/**
 *
 * Navigate backwards in the browser history, if possible.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var back = function back() {
    if (this.desiredCapabilities.browserName === 'safari') {
        /*!
         * helper for safaridriver which doesn not support forward
         * Reason: "Yikes! Safari history navigation does not work. We can go forward or back,
         * but once we do, we can no longer communicate with the page"
         */
        return this.execute('history.go(-1)');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/back',
        method: 'POST'
    });
};

exports['default'] = back;
module.exports = exports['default'];
