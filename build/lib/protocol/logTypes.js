/**
 *
 * Get available log types.
 *
 * @returns {Strings[]}  The list of available [log types](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Log_Type)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/log/types
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var logTypes = function logTypes() {
  return this.requestHandler.create('/session/:sessionId/log/types');
};

exports['default'] = logTypes;
module.exports = exports['default'];
