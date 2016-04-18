/**
 *
 * Returns the visible text for the element.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {String} visible text for the element
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/text
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdText = function elementIdText(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdText protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/text');
};

exports['default'] = elementIdText;
module.exports = exports['default'];
