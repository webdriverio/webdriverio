/**
 * Finger up on the screen.
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/up
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 */

module.exports = function touchUp (x, y, callback) {

    if(typeof x !== 'number' || typeof y !== 'number') {
        throw 'number or type of arguments don\'t agree with touchUp command';
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/up',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions,{x: x, y: y},callback);

};