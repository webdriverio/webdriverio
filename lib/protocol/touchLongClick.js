/**
 *
 * Long press on the touch screen using finger motion events.
 *
 * @param {String} id ID of the element to long press on
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/longclick
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touchLongClick (id) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with touchLongClick protocol command');
    }

    return this.requestHandler.create(
        '/session/:sessionId/touch/longclick',
        { element: id.toString() }
    );

};