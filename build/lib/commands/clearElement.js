/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value.
 *
 * <example>
    :clearElementAsync.js
    client
        .setValue('.input', 'test123')
        .clearElement('.input')
        .getValue('.input').then(function(value) {
            assert(value === ''); // true
        });

    :clearElementSync.js
    it('should demonstrate the clearElement command', function () {
        browser
            .setValue('.input', 'test123')
            .clearElement('.input')

        var value = browser.getValue('.input')
        assert(value === ''); // true
    });
 * </example>
 *
 * @param {String} selector input element
 *
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var clearElement = function clearElement(selector) {
    var _this = this;

    return this.elements(selector).then(function (res) {
        if (!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new _utilsErrorHandler.CommandError(7);
        }

        var elementIdClearCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdClearCommands.push(_this.elementIdClear(elem.ELEMENT, 'value'));
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

        return _this.unify(elementIdClearCommands);
    });
};

exports['default'] = clearElement;
module.exports = exports['default'];
