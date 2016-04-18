/**
 *
 * Search for multiple elements on the page, starting from an element. The located
 * elements will be returned as a WebElement JSON objects. The table below lists the
 * locator strategies that each server should support. Elements should be returned in
 * the order located in the DOM.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @param {String} selector selector to query the elements
 * @returns {Object[]} A list of WebElement JSON objects for the located elements.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/elements
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

var elementIdElements = function elementIdElements(id, selector) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdElements protocol command');
    }

    var found = (0, _helpersFindElementStrategy2['default'])(selector, true);
    return this.requestHandler.create('/session/:sessionId/element/' + id + '/elements', {
        using: found.using,
        value: found.value
    });
};

exports['default'] = elementIdElements;
module.exports = exports['default'];
