/**
 *
 * Protocol bindings to get the session storage size.
 *
 * @returns {Number} The number of items in the storage.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/session_storage/size
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var sessionStorageSize = function sessionStorageSize() {
  return this.requestHandler.create('/session/:sessionId/session_storage/size');
};

exports['default'] = sessionStorageSize;
module.exports = exports['default'];
