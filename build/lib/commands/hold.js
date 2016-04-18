/**
 *
 * Long press on an element using finger motion events. This command works only in a
 * mobile context.
 *
 * @param {String} selector element to hold on
 * @uses protocol/element, protocol/touchLongClick
 * @type mobile
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var hold = function hold(selector) {
  var _this = this;

  /*!
   * compatibility check
   */
  if (!this.isMobile) {
    throw new _utilsErrorHandler.CommandError('hold command is not supported on non mobile platforms');
  }

  return this.element(selector).then(function (res) {
    return _this.touchLongClick(res.value.ELEMENT);
  });
};

exports['default'] = hold;
module.exports = exports['default'];
