/**
 *
 * Uploads a file to the selenium server.
 *
 * @param {String} localPath local path to file
 *
 * @type utility
 *
 */

'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _archiver = require('archiver');

var _archiver2 = _interopRequireDefault(_archiver);

var _utilsErrorHandler = require('../utils/ErrorHandler');

var uploadFile = function uploadFile(localPath) {
    var _this = this;

    /*!
     * parameter check
     */
    if (typeof localPath !== 'string') {
        throw new _utilsErrorHandler.CommandError('number or type of arguments don\'t agree with uploadFile command');
    }

    var zipData = [];
    var source = _fs2['default'].createReadStream(localPath);

    return new _Promise(function (resolve, reject) {
        (0, _archiver2['default'])('zip').on('error', function (e) {
            throw new Error(e);
        }).on('data', function (data) {
            return zipData.push(data);
        }).on('end', function () {
            return _this.file(Buffer.concat(zipData).toString('base64')).then(resolve, reject);
        }).append(source, { name: _path2['default'].basename(localPath) }).finalize(function (err) {
            /* istanbul ignore next */
            if (err) {
                reject(err);
            }
        });
    });
};

exports['default'] = uploadFile;
module.exports = exports['default'];
