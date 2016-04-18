/**
 *
 * Finger move on the screen.
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/move
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var touchMove = function touchMove(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchMove command');
    }

    return this.requestHandler.create('/session/:sessionId/touch/move', { x: x, y: y });
};

exports['default'] = touchMove;
module.exports = exports['default'];
