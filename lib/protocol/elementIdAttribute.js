/**
 *
 * Get the value of an element's attribute.
 *
 * @param {String} ID             ID of a WebElement JSON object to route the command to
 * @param {String} attributeName  attribute name of element you want to receive
 *
 * @returns {String|null} The value of the attribute, or null if it is not set on the element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/attribute/:name
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdAttribute (id, attributeName) {

    if((typeof id !== 'string' && typeof id !== 'number') || typeof attributeName !== 'string') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdAttribute protocol command');
    }

    var requestPath = '/session/:sessionId/element/:id/attribute/:name';

    requestPath = requestPath.replace(/:id/gi, id);
    requestPath = requestPath.replace(/:name/gi, attributeName);

    return this.requestHandler.create(requestPath);

};