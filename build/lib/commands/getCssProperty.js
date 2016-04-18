/**
 *
 * Get a css property from a DOM-element selected by given selector. The return value
 * is formatted to be testable. Colors gets parsed via [rgb2hex](https://www.npmjs.org/package/rgb2hex)
 * and all other properties gets parsed via [css-value](https://www.npmjs.org/package/css-value).
 *
 * Note that shorthand CSS properties (e.g. background, font, border, margin, padding, list-style, outline,
 * pause, cue) are not returned, in accordance with the DOM CSS2 specification- you should directly access
 * the longhand properties (e.g. background-color) to access the desired values.
 *
 * <example>
    :getCssPropertyAsync.js
    client.getCssProperty('#someElement', 'color').then(function(color) {
        console.log(color);
        // outputs the following:
        // {
        //     property: 'color',
        //     value: 'rgba(0, 136, 204, 1)',
        //     parsed: {
        //         hex: '#0088cc',
        //         alpha: 1,
        //         type: 'color',
        //         rgba: 'rgba(0, 136, 204, 1)'
        //     }
        // }
    });

    client.getCssProperty('#someElement', 'width').then(function(width) {
        console.log(width);
        // outputs the following:
        // {
        //     property: 'width',
        //     value: '100px',
        //     parsed: {
        //         type: 'number',
        //         string: '100px',
        //         unit: 'px',
        //         value: 100
        //     }
        // }
    });

    client.getCssProperty('body', 'font-family').then(function(font) {
        console.log(font);
        // outputs the following:
        // {
        //      property: 'font-family',
        //      value: 'helvetica',
        //      parsed: {
        //          value: [ 'helvetica', 'arial', 'freesans', 'clean', 'sans-serif' ],
        //          type: 'font',
        //          string: 'helvetica, arial, freesans, clean, sans-serif'
        //      }
        //  }
    })

    :getCssPropertySync.js
    it('should demonstrate the getCssProperty command', function () {
        var elem = browser.element('#someElement');

        var color = browser.getCssProperty('color');
        console.log(color); // outputs: (see above)
    });
 * </example>
 *
 * @param {String} selector    element with requested style attribute
 * @param {String} cssProperty css property name
 *
 * @uses protocol/elements, protocol/elementIdCssProperty
 * @type property
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpersParseCSSJs = require('../helpers/parseCSS.js');

var _helpersParseCSSJs2 = _interopRequireDefault(_helpersParseCSSJs);

var _utilsErrorHandler = require('../utils/ErrorHandler');

var getCssProperty = function getCssProperty(selector, cssProperty) {
    var _this = this;

    /*!
     * parameter check
     */
    if (typeof cssProperty !== 'string') {
        throw new _utilsErrorHandler.CommandError('number or type of arguments don\'t agree with getCssProperty command');
    }

    return this.elements(selector).then(function (res) {
        if (!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new _utilsErrorHandler.CommandError(7);
        }

        var elementIdCssPropertyCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdCssPropertyCommands.push(_this.elementIdCssProperty(elem.ELEMENT, cssProperty));
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

        return _Promise.all(elementIdCssPropertyCommands);
    }).then(function (result) {
        return (0, _helpersParseCSSJs2['default'])(result, cssProperty);
    });
};

exports['default'] = getCssProperty;
module.exports = exports['default'];
