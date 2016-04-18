/**
 *
 * Get the value of a `<textarea>` or text `<input>` found by given selector.
 *
 * <example>
    :index.html
    <input type="text" value="John Doe" id="username">

    :getValueAsync.js
    client.getValue('#username').then(function(value) {
        console.log(value); // outputs: "John Doe"
    });

    :getValueSync.js
    it('should demonstrate the getValue command', function () {
        var inputUser = browser.element('#username');

        var value = inputUser.getValue();
        console.log(value); // outputs: "John Doe"
    });
 * </example>
 *
 * @param   {String} selector input or textarea element
 * @returns {String}          requested input value
 *
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var getValue = function getValue(selector) {
    var _this = this;

    return this.elements(selector).then(function (res) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            return new _utilsErrorHandler.CommandError(7);
        }

        var elementIdAttributeCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdAttributeCommands.push(_this.elementIdAttribute(elem.ELEMENT, 'value'));
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

        return _this.unify(elementIdAttributeCommands, {
            extractValue: true
        });
    });
};

exports['default'] = getValue;
module.exports = exports['default'];
