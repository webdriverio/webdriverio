/**
 * Flick on the touch screen using finger motion events. This flickcommand starts
 * at a particulat screen location.
 *
 * @param {String} ID      ID of the element where the flick starts
 * @param {Number} xoffset the x offset in pixels to flick by
 * @param {Number} yoffset the y offset in pixels to flick by
 * @param {Number} speed   the speed in pixels per seconds
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/flick
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchFlick (id, xoffset, yoffset, speed) {

    if((typeof id !== 'string' && typeof id !== 'number') || typeof xoffset !== 'number' || typeof yoffset !== 'number' || typeof speed !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchFlick command'));
    }

    var data = {
        element: id,
        xoffset: xoffset,
        yoffset: yoffset,
        speed: speed,
    };

    this.requestHandler.create(
        '/session/:sessionId/touch/flick',
        data,
        arguments[arguments.length - 1]
    );

};