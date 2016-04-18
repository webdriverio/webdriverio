'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _cssValue = require('css-value');

var _cssValue2 = _interopRequireDefault(_cssValue);

var _rgb2hex = require('rgb2hex');

var _rgb2hex2 = _interopRequireDefault(_rgb2hex);

var _sanitize = require('./sanitize');

var _sanitize2 = _interopRequireDefault(_sanitize);

var parse = function parse(cssPropertyValue, cssProperty) {
    if (!cssPropertyValue || !cssPropertyValue.value) {
        return null;
    }

    var parsedValue = {
        property: cssProperty,
        value: cssPropertyValue.value.toLowerCase().trim()
    };

    if (parsedValue.value.indexOf('rgb') === 0) {
        /**
         * remove whitespaces in rgb values
         */
        parsedValue.value = parsedValue.value.replace(/\s/g, '');

        /**
         * parse color values
         */
        var color = parsedValue.value;
        parsedValue.parsed = (0, _rgb2hex2['default'])(parsedValue.value);
        parsedValue.parsed.type = 'color';
        parsedValue.parsed[/[rgba]+/g.exec(color)[0]] = color;
    } else if (parsedValue.property === 'font-family') {
        var font = (0, _cssValue2['default'])(cssPropertyValue.value);
        var string = parsedValue.value;
        var value = cssPropertyValue.value.split(/,/).map(_sanitize2['default'].css);

        parsedValue.value = _sanitize2['default'].css(font[0].value || font[0].string);
        parsedValue.parsed = { value: value, type: 'font', string: string };
    } else {
        /**
         * parse other css properties
         */
        try {
            parsedValue.parsed = (0, _cssValue2['default'])(cssPropertyValue.value);

            if (parsedValue.parsed.length === 1) {
                parsedValue.parsed = parsedValue.parsed[0];
            }

            if (parsedValue.parsed.type && parsedValue.parsed.type === 'number' && parsedValue.parsed.unit === '') {
                parsedValue.value = parsedValue.parsed.value;
            }
        } catch (e) {
            // TODO improve css-parse lib to handle properties like
            // `-webkit-animation-timing-function :  cubic-bezier(0.25, 0.1, 0.25, 1)
        }
    }

    return parsedValue;
};

var parseCSS = function parseCSS(response, cssProperty) {
    var parsedCSS = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(response), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var res = _step.value;

            parsedCSS.push(parse(res, cssProperty));
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

    if (parsedCSS.length === 1) {
        return parsedCSS[0];
    } else if (parsedCSS.length === 0) {
        return null;
    }

    return parsedCSS;
};

exports['default'] = parseCSS;
module.exports = exports['default'];
