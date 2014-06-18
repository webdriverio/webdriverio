/**
 * Scroll on the touch screen using finger based motion events. If
 * element ID is given start scrolling at a particular screen location.
 *
 * @param {String} id       the element where the scroll starts.
 * @param {Number} xoffset  in pixels to scroll by
 * @param {Number} yoffset  in pixels to scroll by
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/scroll
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchScroll (id, xoffset, yoffset) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];
    var data = {};

    if(arguments.length === 4 && id && typeof xoffset === 'number' && typeof yoffset === 'number') {

        /*!
         * start scrolling at a particular screen location
         */
        data = {
            element: id,
            xoffset: xoffset,
            yoffset: yoffset
        };

    } else if(arguments.length === 4 && !id && typeof xoffset === 'number' && typeof yoffset === 'number') {

        /*!
         * if you don't care where the scroll starts on the screen
         */
        data = {
            xoffset: xoffset,
            yoffset: yoffset
        };

    } else if(arguments.length === 3 && typeof id === 'number' && typeof xoffset === 'number') {

        /*!
         * if you don't care where the scroll starts on the screen
         */
        data = {
            xoffset: id,
            yoffset: xoffset
        };

    } else {

        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchScroll command'));

    }

    this.requestHandler.create(
        '/session/:sessionId/touch/scroll',
        data,
        callback
    );

};