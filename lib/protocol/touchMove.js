/**
 * Finger move on the screen.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/move
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 */

module.exports = function touchMove (x, y, callback) {

    if(arguments.length !== 3 || typeof x !== 'number' || typeof y !== 'number') {
        throw 'number or type of arguments don\'t agree with touchMove command';
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/move',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions,{x: x, y: y},callback);

};