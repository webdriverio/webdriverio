/**
 *
 * Get an attribute from an DOM-element based on the selector and attribute name.
 * Returns a list of attribute values if selector matches multiple elements.
 *
 * <example>
    :index.html
    <div data-type="example" id="elem">
        Lorem ipsum dolor ammet
    </div>

    :getAttributeAsync.js
    client.getAttribute('#elem', 'data-type').then(function(attr) {
        console.log(attr); // outputs: "example"
    });

    :getAttributeSync.js
    it('should demonstrate the getAttribute command', function () {
        var elem = browser.element('#elem');

        var attr = elem.getAttribute('data-type');
        console.log(attr); // outputs: "example"

        console.log(browser.getAttribute('#elem', 'data-type')); // outputs: "example"
    });
 * </example>
 *
 * @param {String} selector      element with requested attribute
 * @param {String} attributeName requested attribute
 *
 * @returns {String|String[]|null} The value of the attribute(s), or null if it is not set on the element.
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

var getAttribute = function getAttribute(selector, attributeName) {
    var _this = this;

    /*!
     * parameter check
     */
    if (typeof attributeName !== 'string') {
        throw new _utilsErrorHandler.CommandError('number or type of arguments don\'t agree with getAttribute command');
    }

    return this.elements(selector).then(function (res) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new _utilsErrorHandler.CommandError(7);
        }

        var elementIdAttributeCommands = [];

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdAttributeCommands.push(_this.elementIdAttribute(elem.ELEMENT, attributeName));
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

exports['default'] = getAttribute;
module.exports = exports['default'];
