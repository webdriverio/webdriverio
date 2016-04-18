/**
 *
 * Refresh the current page.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/refresh
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var refresh = function refresh() {
    return this.requestHandler.create({
        path: '/session/:sessionId/refresh',
        method: 'POST'
    });
};

exports['default'] = refresh;
module.exports = exports['default'];
