/**
 *
 * Clear a `TEXTAREA` or text `INPUT element's value.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/clear
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdClear (id) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdClear protocol command');
    }

    var requestOptions = {
        path: '/session/:sessionId/element/:id/clear',
        method: 'POST'
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    return this.requestHandler.create(requestOptions);

};
