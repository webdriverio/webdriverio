/**
 *
 * Return true or false if an `<option>` element, or an `<input>` element of type
 * checkbox or radio is currently selected found by given selector.
 *
 * <example>
    :index.html
    <select name="selectbox" id="selectbox">
        <option value="John Doe">John Doe</option>
        <option value="Layla Terry" selected="selected">Layla Terry</option>
        <option value="Bill Gilbert">Bill Gilbert"</option>
    </select>

    :isSelectedAsync.js
    client.isSelected('[value="Layla Terry"]').then(function(isSelected) {
        console.log(isSelected); // outputs: true
    });

    :isSelectedSync.js
    it('should demonstrate the isSelected command', function () {
        var element = browser.element('[value="Layla Terry"]');
        console.log(element.isSelected()); // outputs: true
    });
 * </example>
 *
 * @param   {String}             selector  option element or input of type checkbox or radio
 * @returns {Boolean|Boolean[]}            true if element is selected
 *
 * @uses protocol/elements, protocol/elementIdSelected
 * @type state
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var isSelected = function isSelected(selector) {
    var _this = this;

    return this.elements(selector).then(function (res) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new _utilsErrorHandler.CommandError(7);
        }

        var elementIdSelectedCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdSelectedCommands.push(_this.elementIdSelected(elem.ELEMENT));
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

        return _this.unify(elementIdSelectedCommands, {
            extractValue: true
        });
    });
};

exports['default'] = isSelected;
module.exports = exports['default'];
