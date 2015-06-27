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

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdName protocol command');
    }

    var requestPath = '/session/:sessionId/element/:id/name';
    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(requestPath);

};