/**
 *
 * protocol bindings to get local_storage size
 *
 * @returns {Number} The number of items in the storage.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/local_storage/size
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var localStorageSize = function localStorageSize() {
  return this.requestHandler.create('/session/:sessionId/local_storage/size');
};

exports['default'] = localStorageSize;
module.exports = exports['default'];
