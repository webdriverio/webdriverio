/**
 * Finger move on the screen.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/move
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 */

module.exports = function touchMove (x, y, callback) {

    if(typeof x !== 'number' || typeof y !== 'number') {
        return callback(new Error('number or type of arguments don\'t agree with touchMove command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/touch/move',
        {x: x, y: y},
        callback
    );

};