/**
 *
 * Apply left click on an element. If selector is not provided, click on the last
 * moved-to location.
 *
 * @param {String} selector element to click on
 * @uses protocol/element, protocol/buttonPress
 * @type action
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _helpersHandleMouseButtonCommand = require('../helpers/handleMouseButtonCommand');

var _helpersHandleMouseButtonCommand2 = _interopRequireDefault(_helpersHandleMouseButtonCommand);

var leftClick = function leftClick(selector) {
  return _helpersHandleMouseButtonCommand2['default'].call(this, selector, 'left');
};

exports['default'] = leftClick;
module.exports = exports['default'];
