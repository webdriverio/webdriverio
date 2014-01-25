/**
 * Finger down on the screen.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/down
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 */

module.exports = function touchDown (x, y, callback) {

    if(typeof x !== 'number' || typeof y !== 'number') {
        return callback(new Error('number or type of arguments don\'t agree with touchDown command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/touch/down',
        {x: x, y: y},
        callback
    );

};