/**
 *
 * Determine an element's size in pixels. The size will be returned as a JSON object
 * with width and height properties.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Object} The width and height of the element, in pixels (`{width:number, height:number}`)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/size
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdSize (id) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdSize protocol command');
    }

    var requestPath = '/session/:sessionId/element/:id/size';
    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(requestPath);

};
