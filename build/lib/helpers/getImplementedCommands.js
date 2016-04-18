'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var COMMAND_TYPES = ['protocol', 'commands'];

/**
 * helper to find all implemented commands
 *
 * @returns {String[]} list of implemented command names
 */
var getImplementedCommands = function getImplementedCommands() {
    var commands = {};

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(COMMAND_TYPES), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var commandType = _step.value;

            var dir = _path2['default'].join(__dirname, '..', commandType);
            var files = _fs2['default'].readdirSync(dir);

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(files), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var filename = _step2.value;

                    var commandName = filename.slice(0, -3);

                    /**
                     * addCommand only there for documentation purposes
                     */
                    if (commandName === 'addCommand') {
                        continue;
                    }

                    commands[commandName] = require(_path2['default'].join(dir, commandName));
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

    return commands;
};

exports['default'] = getImplementedCommands;
module.exports = exports['default'];
