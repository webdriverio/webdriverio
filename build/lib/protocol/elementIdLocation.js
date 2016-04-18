/**
 *
 * Determine an element's location on the page. The point (0, 0) refers to the
 * upper-left corner of the page. The element's coordinates are returned as a
 * JSON object with x and y properties.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Object} The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/location
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdLocation = function elementIdLocation(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdLocation protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/location');
};

exports['default'] = elementIdLocation;
module.exports = exports['default'];
