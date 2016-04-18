
/**
 * opens new window via window.open
 * @param  {String} url            The URL to be loaded in the newly opened window.
 * @param  {String} windowName     A string name for the new window.
 * @param  {String} windowFeatures An optional parameter listing the features (size, position, scrollbars, etc.) of the new window as a string.
 *
 * @see  https://developer.mozilla.org/en-US/docs/Web/API/Window.open
 */

/* global window */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var newWindow = function newWindow(url) {
  var windowName = arguments.length <= 1 || arguments[1] === undefined ? 'new window' : arguments[1];
  var windowFeatures = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

  window.open(url, windowName, windowFeatures);
};

exports['default'] = newWindow;
module.exports = exports['default'];
