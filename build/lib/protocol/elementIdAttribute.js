/**
 *
 * Get the value of an element's attribute.
 *
 * @param {String} ID             ID of a WebElement JSON object to route the command to
 * @param {String} attributeName  attribute name of element you want to receive
 *
 * @returns {String|null} The value of the attribute, or null if it is not set on the element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/attribute/:name
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdAttribute = function elementIdAttribute(id, attributeName) {
    if (typeof id !== 'string' && typeof id !== 'number' || typeof attributeName !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdAttribute protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/attribute/' + attributeName);
};

exports['default'] = elementIdAttribute;
module.exports = exports['default'];
