/**
 *
 * Pulls a folder from the device's file system.
 *
 * <example>
    :pullFolderSync.js
    browser.pullFolder('/data/local/tmp')
 * </example>
 *
 * @param {String} path  device path to folder
 *
 * @type mobile
 * @for ios, android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var pullFolder = function pullFolder(path) {
    if (typeof path !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('pullFolder requires a parameter (path to folder) from type string');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/pull_folder',
        method: 'POST'
    }, { path: path });
};

exports['default'] = pullFolder;
module.exports = exports['default'];
