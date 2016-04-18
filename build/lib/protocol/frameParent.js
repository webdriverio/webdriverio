/**
 * Change focus to the parent context. If the current context is the top level browsing context,
 * the context remains unchanged.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame/parent
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var frameParent = function frameParent() {
    return this.requestHandler.create({
        path: '/session/:sessionId/frame/parent',
        method: 'POST'
    });
};

exports['default'] = frameParent;
module.exports = exports['default'];
