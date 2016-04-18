/**
 *
 * Perform a swipe up on an element.
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
var swipeUp = function swipeUp(selector, yOffset, speed) {
  /**
   * we can't use default values for function parameter here because this would
   * break the ability to chain the command with an element if reverse is used
   */
  yOffset = typeof yOffset === 'number' ? yOffset : -100;
  speed = typeof speed === 'number' ? speed : 100;

  /**
   * make sure yoffset is negative so we scroll down
   */
  yOffset = yOffset > 0 ? yOffset * -1 : yOffset;

  return this.pause(100).swipe(selector, 0, yOffset, speed);
};

exports['default'] = swipeUp;
module.exports = exports['default'];
