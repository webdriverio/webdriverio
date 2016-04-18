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

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdCssProperty = function elementIdCssProperty(id, cssPropertyName) {
    if (typeof id !== 'string' && typeof id !== 'number' || typeof cssPropertyName !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdCssProperty protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/css/' + cssPropertyName);
};

exports['default'] = elementIdCssProperty;
module.exports = exports['default'];
