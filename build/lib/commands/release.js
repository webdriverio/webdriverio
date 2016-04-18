/**
 *
 * Release touch sequenz on specific element.
 *
 * @param {String} selector element to release on
 *
 * @uses property/getLocation, protocol/touchUp
 * @type mobile
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var release = function release(selector) {
  var _this = this;

  /*!
   * compatibility check
   */
  if (!this.isMobile) {
    throw new _utilsErrorHandler.CommandError('release command is not supported on non mobile platforms');
  }

  return this.getLocation(selector).then(function (res) {
    return _this.touchUp(res.x, res.y);
  });
};

exports['default'] = release;
module.exports = exports['default'];
