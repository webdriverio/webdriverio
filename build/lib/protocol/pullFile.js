/**
 *
 * Pulls a file from the device.
 *
 * <example>
    :pullFileSync.js
    browser.pullFile('/data/local/tmp/file.txt')
 * </example>
 *
 * @param {String} path  device path to file
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#pull-file
 * @type mobile
 * @for ios, android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var pullFile = function pullFile(path) {
    if (typeof path !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('pullFile requires a parameter (path to file) from type string');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/pull_file',
        method: 'POST'
    }, { path: path });
};

exports['default'] = pullFile;
module.exports = exports['default'];
