/**
 *
 * Determine if an element is currently enabled.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Boolean} true if the element is enabled
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/enabled
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdEnabled = function elementIdEnabled(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdEnabled protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/enabled');
};

exports['default'] = elementIdEnabled;
module.exports = exports['default'];
