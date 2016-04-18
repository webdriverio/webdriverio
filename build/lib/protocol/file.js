/**
 *
 * Uploads a base64 data object.
 *
 * @param {Object} data base64 data object
 *
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var file = function file(base64data) {
    return this.requestHandler.create('/session/:sessionId/file', {
        file: base64data
    });
};

exports['default'] = file;
module.exports = exports['default'];
