/**
 *
 * Perform a swipe right on an element.
 *
 * @param {String} selector  element to swipe on
 * @param {Number} speed     time (in seconds) to spend performing the swipe
 *
 * @uses mobile/swipe
 * @type mobile
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var swipeRight = function swipeRight(selector, xOffset, speed) {
  /**
   * we can't use default values for function parameter here because this would
   * break the ability to chain the command with an element if reverse is used
   */
  xOffset = typeof xOffset === 'number' ? xOffset : -100;
  speed = typeof speed === 'number' ? speed : 100;

  /**
   * make sure xoffset is negative so we scroll left
   */
  xOffset = xOffset < 0 ? xOffset * -1 : xOffset;

  return this.pause(100).swipe(selector, xOffset, 0, speed);
};

exports['default'] = swipeRight;
module.exports = exports['default'];
