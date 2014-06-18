/**
 *
 * Returns the visible text for the element.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {String} visible text for the element
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/text
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdText (id) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof id !== 'string' && typeof id !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdText protocol command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/element/:id/text'.replace(/:id/gi, id),
        callback
    );

};
