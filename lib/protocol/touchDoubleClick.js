/**
 *
 * Double tap on the touch screen using finger motion events.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/doubleclick
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchDoubleClick (id) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof id !== 'string' && typeof id !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchDoubleClick protocol command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/touch/doubleclick',
        { element: id.toString() },
        callback
    );

};