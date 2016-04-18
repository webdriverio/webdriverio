/**
 *
 * Return true or false if the selected DOM-element found by given selector is enabled.
 *
 * <example>
    :index.html
    <input type="text" name="inputField" class="input1">
    <input type="text" name="inputField" class="input2" disabled>
    <input type="text" name="inputField" class="input3" disabled="disabled">

    :isEnabledAsync.js
    client
        .isEnabled('.input1').then(function(isEnabled) {
            console.log(isEnabled); // outputs: true
        })
        .isEnabled('.input2').then(function(isEnabled) {
            console.log(isEnabled); // outputs: false
        })
        .isEnabled('.input3').then(function(isEnabled) {
            console.log(isEnabled); // outputs: false
        })
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* (is|are) enabled
 *
 * @uses protocol/elements, protocol/elementIdEnabled
 * @type state
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var isEnabled = function isEnabled(selector) {
    var _this = this;

    return this.elements(selector).then(function (res) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new _utilsErrorHandler.CommandError(7);
        }

        var elementIdEnabledCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdEnabledCommands.push(_this.elementIdEnabled(elem.ELEMENT));
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

        return _this.unify(elementIdEnabledCommands, {
            extractValue: true
        });
    });
};

exports['default'] = isEnabled;
module.exports = exports['default'];
