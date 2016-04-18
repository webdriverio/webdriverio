/**
 *
 * Single tap on the touch enabled device.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/click
 * @type protocol
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var touchClick = function touchClick(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdCssProperty protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/touch/click', {
        element: id.toString()
    });
};

exports['default'] = touchClick;
module.exports = exports['default'];
