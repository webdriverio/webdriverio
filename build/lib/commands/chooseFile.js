/**
 *
 * Given a selector corresponding to an `<input type=file>`, will upload the local
 * file to the browser machine and fill the form accordingly. It does not submit
 * the form for you.
 *
 * @param {String} selector   input element
 * @param {String} localPath  local path to file to be uploaded
 *
 * @uses utility/uploadFile, action/addValue
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

var _utilsErrorHandler = require('../utils/ErrorHandler');

var chooseFile = function chooseFile(selector, localPath) {
    var _this = this;

    /*!
     * parameter check
     */
    if (typeof localPath !== 'string') {
        return new _utilsErrorHandler.CommandError('number or type of arguments don\'t agree with chooseFile command');
    }

    /*!
     * mobile check
     */
    if (this.isMobile) {
        return new _utilsErrorHandler.CommandError('chooseFile command is not supported on mobile platforms');
    }

    return new _Promise(function (resolve, reject) {
        _fs2['default'].exists(localPath, function (exists) {
            /* istanbul ignore next */
            if (!exists) {
                return reject(new _utilsErrorHandler.CommandError('File to upload does not exists on your system'));
            }

            _this.uploadFile(localPath).then(function (res) {
                return this.addValue(selector, res.value);
            }).then(resolve, reject);
        });
    });
};

exports['default'] = chooseFile;
module.exports = exports['default'];
