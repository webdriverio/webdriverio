/**
 *
 * Query the value of an element's computed CSS property. The CSS property to query
 * should be specified using the CSS property name, not the JavaScript property name
 * (e.g. background-color instead of backgroundColor).
 *
 * @param {String} ID                ID of a WebElement JSON object to route the command to
 * @param  {String} cssPropertyName  CSS property
 *
 * @returns {String} The value of the specified CSS property.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/css/:propertyName
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdCssProperty (id, cssPropertyName) {

    if((typeof id !== 'string' && typeof id !== 'number') || typeof cssPropertyName !== 'string') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdCssProperty protocol command');
    }

    var requestPath = '/session/:sessionId/element/:id/css/:propertyName';

    requestPath = requestPath.replace(/:id/gi, id);
    requestPath = requestPath.replace(':propertyName', cssPropertyName);

    return this.requestHandler.create(requestPath);

};
