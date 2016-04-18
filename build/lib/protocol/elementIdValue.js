/**
 *
 * Send a sequence of key strokes to an element.
 *
 * @param {String} ID              ID of a WebElement JSON object to route the command to
 * @param {String|String[]} value  The sequence of keys to type. An array must be provided. The server should flatten the array items to a single string to be typed.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value
 * @type protocol
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Array$from = require('babel-runtime/core-js/array/from')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpersConstants = require('../helpers/constants');

var _utilsErrorHandler = require('../utils/ErrorHandler');

var elementIdValue = function elementIdValue(id, value) {
    var key = [];

    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdValue protocol command');
    }

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        key = checkUnicode(value);
    } else if (value instanceof Array) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var charSet = _step.value;

                key = key.concat(checkUnicode(charSet));
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
    } else {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdValue protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/element/' + id + '/value', {
        'value': key
    });
};

/*!
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return _helpersConstants.UNICODE_CHARACTERS.hasOwnProperty(value) ? [_helpersConstants.UNICODE_CHARACTERS[value]] : _Array$from(value);
}

exports['default'] = elementIdValue;
module.exports = exports['default'];
