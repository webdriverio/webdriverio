/**
 *
 * Get the element on the page that currently has focus. The element will be returned as a WebElement JSON object.
 *
 * @returns {String} A WebElement JSON object for the active element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/active
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var elementActive = function elementActive() {
    return this.requestHandler.create({
        path: '/session/:sessionId/element/active',
        method: 'POST'
    });
};

exports['default'] = elementActive;
module.exports = exports['default'];
