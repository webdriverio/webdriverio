/**
 *
 * Click any mouse button (at the coordinates set by the last moveto command). Note
 * that calling this command after calling buttondown and before calling button up
 * (or any out-of-order interactions sequence) will yield undefined behaviour).
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/click
 * @type protocol
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpersHandleMouseButtonProtocol = require('../helpers/handleMouseButtonProtocol');

var _helpersHandleMouseButtonProtocol2 = _interopRequireDefault(_helpersHandleMouseButtonProtocol);

var buttonPress = function buttonPress(button) {
    return _helpersHandleMouseButtonProtocol2['default'].call(this, '/session/:sessionId/click', button);
};

exports['default'] = buttonPress;
module.exports = exports['default'];
