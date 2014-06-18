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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof x !== 'number' || typeof y !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchDown command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/touch/down',
        {x: x, y: y},
        callback
    );

};