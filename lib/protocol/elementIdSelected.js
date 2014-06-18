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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof id !== 'string' && typeof id !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdSelected protocol command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/element/:id/selected'.replace(/:id/gi, id),
        callback
    );

};
