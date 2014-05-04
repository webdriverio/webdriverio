/**
 *
 * Determine an element's size in pixels. The size will be returned as a JSON object
 * with width and height properties.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Object} The width and height of the element, in pixels (`{width:number, height:number}`)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/size
 *
 */

module.exports = function elementIdSize (id) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdSize protocol command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/element/:id/size'.replace(/:id/gi, id),
        arguments[arguments.length - 1]
    );

};
