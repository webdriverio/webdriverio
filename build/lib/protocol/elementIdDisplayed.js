/**
 *
 * Determine if an element is currently displayed.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Boolean} true if the element is displayed
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/displayed
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdDisplayed = function elementIdDisplayed(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdDisplayed protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/displayed');
};

exports['default'] = elementIdDisplayed;
module.exports = exports['default'];
