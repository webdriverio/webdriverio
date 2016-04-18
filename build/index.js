/**
 * webdriverio
 * https://github.com/Camme/webdriverio
 *
 * A WebDriver module for nodejs. Either use the super easy help commands or use the base
 * Webdriver wire protocol commands. Its totally inspired by jellyfishs webdriver, but the
 * goal is to make all the webdriver protocol items available, as near the original as possible.
 *
 * Copyright (c) 2013 Camilo Tapia <camilo.tapia@gmail.com>
 * Licensed under the MIT license.
 *
 * Contributors:
 *     Dan Jenkins <dan.jenkins@holidayextras.com>
 *     Christian Bromann <mail@christian-bromann.com>
 *     Vincent Voyer <vincent@zeroload.net>
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _libWebdriverio = require('./lib/webdriverio');

var _libWebdriverio2 = _interopRequireDefault(_libWebdriverio);

var _libMultibrowser = require('./lib/multibrowser');

var _libMultibrowser2 = _interopRequireDefault(_libMultibrowser);

var _libUtilsErrorHandler = require('./lib/utils/ErrorHandler');

var _libUtilsErrorHandler2 = _interopRequireDefault(_libUtilsErrorHandler);

var _libHelpersGetImplementedCommands = require('./lib/helpers/getImplementedCommands');

var _libHelpersGetImplementedCommands2 = _interopRequireDefault(_libHelpersGetImplementedCommands);

var _packageJson = require('./package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var IMPLEMENTED_COMMANDS = (0, _libHelpersGetImplementedCommands2['default'])();
var VERSION = _packageJson2['default'].version;

var remote = function remote(options, modifier) {
    if (options === undefined) options = {};

    /**
     * initialise monad
     */
    var wdio = (0, _libWebdriverio2['default'])(options, modifier);

    /**
     * build prototype: commands
     */
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(_Object$keys(IMPLEMENTED_COMMANDS)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var commandName = _step.value;

            wdio.lift(commandName, IMPLEMENTED_COMMANDS[commandName]);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var prototype = wdio();
    prototype.defer.resolve();
    return prototype;
};

var multiremote = function multiremote(options) {
    var multibrowser = new _libMultibrowser2['default']();

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = _getIterator(_Object$keys(options)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var browserName = _step2.value;

            multibrowser.addInstance(browserName, remote(options[browserName], multibrowser.getInstanceModifier()));
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return remote(options, multibrowser.getModifier());
};

exports.remote = remote;
exports.multiremote = multiremote;
exports.VERSION = VERSION;
exports.ErrorHandler = _libUtilsErrorHandler2['default'];
