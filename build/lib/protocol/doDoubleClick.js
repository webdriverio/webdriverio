/**
 *
 * Double-clicks at the current mouse coordinates (set by moveto).
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/doubleclick
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var doDoubleClick = function doDoubleClick() {
    return this.requestHandler.create({
        path: '/session/:sessionId/doubleclick',
        method: 'POST'
    });
};

exports['default'] = doDoubleClick;
module.exports = exports['default'];
