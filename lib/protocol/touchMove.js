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

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchMove(x, y) {

    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchMove command');
    }

    return this.requestHandler.create(
        '/session/:sessionId/touch/move',
        {x: x, y: y}
    );

};