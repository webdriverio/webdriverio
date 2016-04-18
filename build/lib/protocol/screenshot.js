/**
 *
 * Take a screenshot of the current viewport. To get the screenshot of the whole page
 * use the action command `saveScreenshot`
 *
 * @returns {String} screenshot   The screenshot as a base64 encoded PNG.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/screenshot
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var screenshot = function screenshot() {
  return this.requestHandler.create('/session/:sessionId/screenshot');
};

exports['default'] = screenshot;
module.exports = exports['default'];
