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

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdSelected = function elementIdSelected(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdSelected protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/selected');
};

exports['default'] = elementIdSelected;
module.exports = exports['default'];
