/**
 *
 * De-activates the currently-active IME engine.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/deactivated
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var imeDeactivated = function imeDeactivated() {
  return this.requestHandler.create('/session/:sessionId/ime/deactivated');
};

exports['default'] = imeDeactivated;
module.exports = exports['default'];
