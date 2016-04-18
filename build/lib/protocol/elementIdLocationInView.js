/**
 *
 * Determine an element's location on the screen once it has been scrolled into view.
 *
 * *Note:* This is considered an internal command and should only be used to determine
 * an element's location for correctly generating native events.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Object} The X and Y coordinates for the element (`{x:number, y:number}`)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/location_in_view
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdLocationInView = function elementIdLocationInView(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdLocationInView protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/location_in_view');
};

exports['default'] = elementIdLocationInView;
module.exports = exports['default'];
