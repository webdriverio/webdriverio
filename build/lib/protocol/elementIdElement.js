/**
 *
 * Search for an element on the page, starting from an element.
 * The located element will be returned as a WebElement JSON object.
 * The table below lists the locator strategies that each server should support.
 * Each locator must return the first matching element located in the DOM.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @param {String} selector selector to query the element
 * @returns {String} A WebElement JSON object for the located element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/element
 * @type protocol
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var _helpersFindElementStrategy = require('../helpers/findElementStrategy');

var _helpersFindElementStrategy2 = _interopRequireDefault(_helpersFindElementStrategy);

var elementIdElement = function elementIdElement(id, string) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdElement protocol command');
    }

    var found = (0, _helpersFindElementStrategy2['default'])(string, true);
    return this.requestHandler.create('/session/:sessionId/element/' + id + '/element', {
        using: found.using,
        value: found.value
    });
};

exports['default'] = elementIdElement;
module.exports = exports['default'];
