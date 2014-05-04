/**
 *
 * Finger move on the screen.
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/move
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchMove (x, y) {

    if(typeof x !== 'number' || typeof y !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchMove command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/touch/move',
        {x: x, y: y},
        arguments[arguments.length - 1]
    );

};