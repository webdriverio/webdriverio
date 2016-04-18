/**
 *
 * Finger up on the screen.
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/up
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var touchUp = function touchUp(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchUp command');
    }

    return this.requestHandler.create('/session/:sessionId/touch/up', { x: x, y: y });
};

exports['default'] = touchUp;
module.exports = exports['default'];
