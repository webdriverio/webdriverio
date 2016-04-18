/**
 *
 * Get the current page source.
 *
 * @returns {String} The current page source.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/source
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var source = function source() {
  return this.requestHandler.create('/session/:sessionId/source');
};

exports['default'] = source;
module.exports = exports['default'];
