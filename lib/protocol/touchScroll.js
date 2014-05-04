/**
 * Scroll on the touch screen using finger based motion events. If
 * element ID is given start scrolling at a particular screen location.
 *
 * @param {String} id       the element where the scroll starts.
 * @param {Number} xoffset  in pixels to scroll by
 * @param {Number} yoffset  in pixels to scroll by
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/scroll
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchScroll (id, xoffset, yoffset) {

    if((typeof id !== 'string' && typeof id !== 'number') || typeof xoffset !== 'number' || typeof yoffset !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchScroll command'));
    }

    var data = {
        element: id,
        xoffset: xoffset,
        yoffset: yoffset
    };

    this.requestHandler.create(
        '/session/:sessionId/touch/scroll',
        data,
        arguments[arguments.length - 1]
    );

};