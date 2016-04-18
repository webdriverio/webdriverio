/**
 *
 * Maximize the specified window if not already maximized. If the :windowHandle URL parameter is "current",
 * the currently active window will be maximized.
 *
 * @param {String=} windowHandle window to maximize (if parameter is falsy the currently active window will be maximized)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/maximize
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var windowHandleMaximize = function windowHandleMaximize() {
    var windowHandle = arguments.length <= 0 || arguments[0] === undefined ? 'current' : arguments[0];

    return this.requestHandler.create({
        path: '/session/:sessionId/window/' + windowHandle + '/maximize',
        method: 'POST'
    });
};

exports['default'] = windowHandleMaximize;
module.exports = exports['default'];
