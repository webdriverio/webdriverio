/**
 *
 * Query for an element's tag name.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {String}  the element's tag name, as a lowercase string
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/name
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdName (id) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof id !== 'string' && typeof id !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdName protocol command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/element/:id/name'.replace(/:id/gi, id),
        callback
    );

};