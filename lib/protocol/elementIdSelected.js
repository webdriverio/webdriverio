/**
 *
 * Determine if an OPTION element, or an INPUT element of type checkbox or
 * radiobutton is currently selected.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Boolean} true if the element is selected.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/selected
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdSelected (id) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdSelected protocol command');
    }

    var requestPath = '/session/:sessionId/element/:id/selected';
    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(requestPath);

};
