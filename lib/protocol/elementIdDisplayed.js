/**
 *
 * Determine if an element is currently displayed.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Boolean} true if the element is displayed
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/displayed
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdDisplayed (id) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdDisplayed protocol command');
    }


    var requestPath = '/session/:sessionId/element/:id/displayed';

    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(requestPath);

};
