/**
 *
 * List all available engines on the machine. To use an engine, it has to be present
 * in this list.
 *
 * @returns {Object[]} engines   A list of available engines
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/available_engines
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var imeAvailableEngines = function imeAvailableEngines() {
  return this.requestHandler.create('/session/:sessionId/ime/available_engines');
};

exports['default'] = imeAvailableEngines;
module.exports = exports['default'];
