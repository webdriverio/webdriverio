/**
 *
 * Click and hold the left mouse button (at the coordinates set by the last moveto
 * command). Note that the next mouse-related command that should follow is buttonup.
 * Any other mouse command (such as click or another call to buttondown) will yield
 * undefined behaviour.
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttondown
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

var buttonDown = function buttonDown(button) {
    return _helpersHandleMouseButtonProtocol2['default'].call(this, '/session/:sessionId/buttondown', button);
};

exports['default'] = buttonDown;
module.exports = exports['default'];
