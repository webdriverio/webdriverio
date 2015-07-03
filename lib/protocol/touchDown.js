/**
 *
 * Finger down on the screen.
 *
 * @param {Number} x  X coordinate on the screen
 * @param {Number} y  Y coordinate on the screen
 *
 * @see  http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/down
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchDown (x, y) {

    if(typeof x !== 'number' || typeof y !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchDown command');
    }

    return this.requestHandler.create(
        '/session/:sessionId/touch/down',
        {x: x, y: y}
    );

};