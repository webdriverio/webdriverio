/**
 *
 * Releases the mouse button previously held (where the mouse is currently at). Must
 * be called once for every buttondown command issued. See the note in click and
 * buttondown about implications of out-of-order commands.
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttonup
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

var buttonUp = function buttonUp(button) {
    return _helpersHandleMouseButtonProtocol2['default'].call(this, '/session/:sessionId/buttonup', button);
};

exports['default'] = buttonUp;
module.exports = exports['default'];
