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

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdText protocol command');
    }

    var requestPath = '/session/:sessionId/element/:id/text';
    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(requestPath);

};
