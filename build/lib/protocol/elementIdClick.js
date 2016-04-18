/**
 *
 * Click on an element.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/click
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdClick = function elementIdClick(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdClick protocol command');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/element/' + id + '/click',
        method: 'POST'
    });
};

exports['default'] = elementIdClick;
module.exports = exports['default'];
