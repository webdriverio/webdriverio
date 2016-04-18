/**
 * Change focus to another frame on the page. If the frame id is null,
 * the server should switch to the page's default content.
 *
 * @param {String|Number|null|WebElementJSONObject} id   Identifier for the frame to change focus to.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var frame = function frame() {
    var frameId = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    return this.requestHandler.create('/session/:sessionId/frame', {
        id: frameId
    });
};

exports['default'] = frame;
module.exports = exports['default'];
